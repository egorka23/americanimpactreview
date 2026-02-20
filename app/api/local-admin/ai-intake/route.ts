import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { aiIntakeRuns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureLocalAdminSchema, isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";
import mammoth from "mammoth";
import { CATEGORIES, TAXONOMY } from "@/lib/taxonomy";
import { spawn } from "child_process";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_FILE_MB = 50;
const CLAUDE_TIMEOUT = 120_000; // 120 seconds

function buildTaxonomyPrompt() {
  const subjectLines = Object.entries(TAXONOMY)
    .map(([cat, subs]) => `${cat}: ${subs.join(", ")}`)
    .join("\n");
  return `Categories: ${CATEGORIES.join(", ")}.\nSubjects by category:\n${subjectLines}`;
}

async function extractText(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const buffer = Buffer.from(await file.arrayBuffer());

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }

  if (ext === "pdf") {
    const mod = await import("pdf-parse");
    const parseFn = (mod as unknown as { default?: (b: Buffer) => Promise<{ text?: string }> }).default
      || (mod as unknown as (b: Buffer) => Promise<{ text?: string }>);
    const result = await parseFn(buffer);
    return result.text || "";
  }

  throw new Error("Unsupported file type. Please upload .docx or .pdf");
}

function safeJsonParse(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

/** Call Claude CLI via spawn — same approach as file-analyzer */
function callClaudeCLI(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Remove CLAUDECODE env var to allow spawning from within Claude Code session
    const env = { ...process.env };
    delete env.CLAUDECODE;
    const child = spawn("claude", ["--print"], {
      stdio: ["pipe", "pipe", "pipe"],
      env,
    });

    let stdout = "";
    let stderr = "";

    const timeoutId = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Claude CLI timeout after ${CLAUDE_TIMEOUT / 1000}s`));
    }, CLAUDE_TIMEOUT);

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("close", (code: number | null) => {
      clearTimeout(timeoutId);
      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`));
        return;
      }
      if (!stdout.trim()) {
        reject(new Error(`No response from Claude CLI: ${stderr}`));
        return;
      }
      resolve(stdout);
    });

    child.on("error", (error: Error) => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to start Claude CLI: ${error.message}. Make sure Claude CLI is installed (npm i -g @anthropic-ai/claude-code).`));
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

export async function POST(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureLocalAdminSchema();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const createdBy = (formData.get("createdBy") as string | null) || null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 50MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "docx") {
      return NextResponse.json({ error: "Only .docx files are accepted. Please convert your document to Word format." }, { status: 400 });
    }

    const blob = await put(`ai-intake/${Date.now()}-${file.name}`, file, { access: "public" });

    const intake = await db.insert(aiIntakeRuns).values({
      createdByUserId: createdBy,
      originalFileUrl: blob.url,
      originalFileName: file.name,
      status: "running",
      modelVersion: "claude-cli",
      createdAt: new Date(),
    }).returning({ id: aiIntakeRuns.id });

    const intakeId = intake[0]?.id;

    const rawText = await extractText(file);
    const clipped = rawText.slice(0, 40000);

    const prompt = [
      "You are extracting manuscript metadata for a journal submission form.",
      "Return JSON ONLY (no markdown, no explanation, no ```json fences) with this shape:",
      "{ \"title\": \"\", \"abstract\": \"\", \"keywords\": [], \"articleType\": \"\", \"category\": \"\", \"subject\": \"\", \"authors\": [], \"declarations\": {}, \"confidence\": {}, \"evidence\": {}, \"warnings\": [] }",
      "",
      "authors[] objects: { \"name\": \"\", \"email\": \"\", \"affiliation\": \"\", \"orcid\": \"\" }",
      "declarations: { \"ethicsApproval\": \"\", \"fundingStatement\": \"\", \"dataAvailability\": \"\", \"aiDisclosure\": \"\", \"conflictOfInterest\": \"\", \"coverLetter\": \"\" }",
      "confidence: { \"title\": 0.9, \"abstract\": 0.9, \"keywords\": 0.8, \"authors\": 0.7, \"declarations\": 0.5 } as numbers 0-1",
      "evidence: { \"title\": \"snippet...\", \"abstract\": \"snippet...\" } with short snippets (max 240 chars).",
      "",
      "IMPORTANT: For every field you cannot find in the text, set it to empty string/array AND add a specific warning like 'No [field] found in manuscript'.",
      "For declarations: look for sections titled 'Ethics', 'IRB', 'Funding', 'Acknowledgments', 'Data Availability', 'AI Disclosure', 'Conflict of Interest', 'Competing Interests', 'Cover Letter'.",
      "For authors: look at the first page for names, emails, affiliations, and ORCID identifiers. Check footnotes and corresponding author sections.",
      "Choose category and subject only from the provided list. If unsure, use category 'Other' and empty subject.",
      "Keywords should be 3-6 short phrases.",
      "Extract the FULL abstract, not a summary. Copy it verbatim from the manuscript.",
      "",
      buildTaxonomyPrompt(),
      "",
      `File name: ${file.name}`,
      "---",
      clipped || "(No extractable text)",
    ].join("\n");

    let content: string;
    try {
      content = await callClaudeCLI(prompt);
    } catch (cliError) {
      const msg = cliError instanceof Error ? cliError.message : "Claude CLI failed";
      await db.update(aiIntakeRuns).set({ status: "failed", errorMessage: msg }).where(eq(aiIntakeRuns.id, intakeId));
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const parsed = safeJsonParse(content);

    if (!parsed) {
      await db.update(aiIntakeRuns).set({ status: "failed", errorMessage: "Failed to parse Claude response" }).where(eq(aiIntakeRuns.id, intakeId));
      return NextResponse.json({ error: "Failed to parse Claude response" }, { status: 500 });
    }

    const warnings: string[] = Array.isArray(parsed.warnings) ? parsed.warnings : [];
    if (!parsed.title) warnings.push("No title detected.");
    if (!parsed.abstract) warnings.push("No abstract detected.");
    if (!parsed.keywords || parsed.keywords.length < 3) warnings.push("Keywords missing or too few; suggested keywords may be weak.");
    if (!parsed.authors || parsed.authors.length === 0) warnings.push("No authors detected.");
    const primaryAuthor = Array.isArray(parsed.authors) ? parsed.authors[0] : null;
    if (primaryAuthor && !primaryAuthor.email) warnings.push("Primary author email not found — you must enter it manually.");
    if (primaryAuthor && !primaryAuthor.affiliation) warnings.push("Primary author affiliation not found.");
    const decl = parsed.declarations || {};
    if (!decl.ethicsApproval) warnings.push("Ethics/IRB statement not found in manuscript.");
    if (!decl.fundingStatement) warnings.push("Funding statement not found in manuscript.");
    if (!decl.conflictOfInterest) warnings.push("Conflict of interest statement not found in manuscript.");
    if (!decl.dataAvailability) warnings.push("Data availability statement not found in manuscript.");
    if (!decl.aiDisclosure) warnings.push("AI disclosure not found in manuscript.");

    await db.update(aiIntakeRuns).set({
      status: "succeeded",
      extractedJson: JSON.stringify(parsed),
      confidenceJson: JSON.stringify(parsed.confidence || {}),
      warningsJson: JSON.stringify(warnings),
      evidenceJson: JSON.stringify(parsed.evidence || {}),
      modelVersion: "claude-cli",
      errorMessage: null,
    }).where(eq(aiIntakeRuns.id, intakeId));

    await logLocalAdminEvent({
      action: "ai_intake_extracted",
      entityType: "ai_intake",
      entityId: intakeId,
      detail: file.name,
    });

    return NextResponse.json({
      intakeId,
      status: "succeeded",
      extracted: parsed,
      confidence: parsed.confidence || {},
      warnings,
      evidence: parsed.evidence || {},
      file: { name: file.name, url: blob.url },
    });
  } catch (error) {
    console.error("AI intake error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
