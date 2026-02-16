import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { aiIntakeRuns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureLocalAdminSchema, isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";
import mammoth from "mammoth";
import { CATEGORIES, TAXONOMY } from "@/lib/taxonomy";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_MB = 50;

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
      modelVersion: process.env.AI_INTAKE_MODEL || "gpt-4o-mini",
      createdAt: new Date(),
    }).returning({ id: aiIntakeRuns.id });

    const intakeId = intake[0]?.id;

    const rawText = await extractText(file);
    const clipped = rawText.slice(0, 12000);

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.AI_INTAKE_MODEL || "gpt-4o-mini";
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not set" }, { status: 400 });
    }

    const system = [
      "You are extracting manuscript metadata for a journal submission form.",
      "Return JSON ONLY with this shape:",
      "{ title, abstract, keywords[], articleType, category, subject, authors[], declarations, confidence, evidence, warnings }",
      "authors[] objects: { name, email, affiliation, orcid }",
      "declarations: { ethicsApproval, fundingStatement, dataAvailability, aiDisclosure, conflictOfInterest, coverLetter }",
      "confidence: { title, abstract, keywords, authors, declarations } as numbers 0-1",
      "evidence: { title, abstract, keywords, authors, declarations } with short snippets (no more than 240 chars).",
      "If a field is missing, use empty string/array and add a warning.",
      "Choose category and subject only from the provided list. If unsure, use category 'Other' and empty subject.",
      "Keywords should be 3-6 short phrases.",
    ].join(" ");

    const user = [
      `File name: ${file.name}`,
      buildTaxonomyPrompt(),
      "---",
      clipped || "(No extractable text)"
    ].join("\n");

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
        max_tokens: 900,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      await db.update(aiIntakeRuns).set({ status: "failed", errorMessage: errText }).where(eq(aiIntakeRuns.id, intakeId));
      return NextResponse.json({ error: errText }, { status: 500 });
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content || "";
    const parsed = safeJsonParse(content);

    if (!parsed) {
      await db.update(aiIntakeRuns).set({ status: "failed", errorMessage: "Failed to parse AI response" }).where(eq(aiIntakeRuns.id, intakeId));
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const warnings: string[] = Array.isArray(parsed.warnings) ? parsed.warnings : [];
    if (!parsed.title) warnings.push("No title detected.");
    if (!parsed.abstract) warnings.push("No abstract detected.");
    if (!parsed.keywords || parsed.keywords.length < 3) warnings.push("Keywords missing or too few; suggested keywords may be weak.");
    if (!parsed.authors || parsed.authors.length === 0) warnings.push("No authors detected.");

    await db.update(aiIntakeRuns).set({
      status: "succeeded",
      extractedJson: JSON.stringify(parsed),
      confidenceJson: JSON.stringify(parsed.confidence || {}),
      warningsJson: JSON.stringify(warnings),
      evidenceJson: JSON.stringify(parsed.evidence || {}),
      modelVersion: model,
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
