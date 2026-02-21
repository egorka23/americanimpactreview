import { NextResponse } from "next/server";
import { spawn } from "child_process";

export const runtime = "nodejs";
export const maxDuration = 120;

const CLAUDE_TIMEOUT = 90_000;

function safeJsonParse(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function callClaudeCLI(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
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

    child.stdout.on("data", (data: Buffer) => { stdout += data.toString(); });
    child.stderr.on("data", (data: Buffer) => { stderr += data.toString(); });

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
      reject(new Error(`Failed to start Claude CLI: ${error.message}. Make sure Claude CLI is installed.`));
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = String(body.text || "").trim();

    if (!text) {
      return NextResponse.json({ error: "Paste researcher profile text." }, { status: 400 });
    }

    const clipped = text.slice(0, 50000);

    const prompt = [
      "You are extracting information about an academic researcher from the provided text.",
      "The text is copied from academic profile pages (Google Scholar, ResearchGate, ORCID, university faculty pages, published articles, etc.).",
      "",
      "Return JSON ONLY (no markdown, no explanation, no ```json fences) with this exact shape:",
      '{ "fullName": "", "title": "", "affiliation": "", "expertiseArea": "", "achievements": "" }',
      "",
      "Field descriptions:",
      '- "fullName": Full name of the researcher (e.g. "Jane Smith")',
      '- "title": Academic degree/title (e.g. "PhD", "MD, PhD", "DrPH"). Just the degree abbreviation, not "Professor" etc. If only "Candidate of Sciences" is found, use "PhD" equivalent.',
      '- "affiliation": Current institution and department (e.g. "Harvard T.H. Chan School of Public Health, Department of Epidemiology")',
      '- "expertiseArea": Research area as a lowercase phrase for the sentence "...in the field of [expertiseArea]". Derive this from the actual research topics and publications — NOT from department name alone. (e.g. "Olympic education, physical culture pedagogy, and values formation in sport")',
      '- "achievements": Notable achievements as a lowercase phrase for the sentence "Your work, including [achievements], reflects..." — reference 2-3 SPECIFIC publications or contributions found in the text. Use actual paper titles or research topics. Be detailed and specific. NO period at the end.',
      "",
      "IMPORTANT:",
      "- Extract REAL information from the text. Do NOT invent or hallucinate anything.",
      "- If a field cannot be determined, set it to empty string.",
      "- For expertiseArea: use lowercase, as it appears mid-sentence. Base it on actual research topics from publications, not just department affiliation.",
      "- For achievements: use lowercase, be SPECIFIC — mention actual paper titles, research findings, or grant-funded projects. The more specific the better. No trailing period.",
      "- For title: prefer the highest degree (PhD > MS > BS). 'Candidate of Sciences' = PhD equivalent.",
      "- Read ALL provided text carefully before answering — publications list often contains the most valuable information.",
      "",
      "--- RESEARCHER PROFILE TEXT ---",
      clipped,
    ].join("\n");

    let content: string;
    try {
      content = await callClaudeCLI(prompt);
    } catch (cliError) {
      const raw = cliError instanceof Error ? cliError.message : "Claude CLI failed";
      const msg = raw.includes("Failed to start Claude CLI")
        ? "AI generation requires Claude CLI — only available when running locally (npm run dev)."
        : raw;
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const parsed = safeJsonParse(content);
    if (!parsed) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json({
      fullName: parsed.fullName || "",
      title: parsed.title || "",
      affiliation: parsed.affiliation || "",
      expertiseArea: parsed.expertiseArea || "",
      achievements: parsed.achievements || "",
    });
  } catch (error) {
    console.error("EB generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
