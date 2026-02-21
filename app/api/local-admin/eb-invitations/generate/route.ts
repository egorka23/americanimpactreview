import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 120;

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
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    const body = await request.json();
    const text = String(body.text || "").trim();

    if (!text) {
      return NextResponse.json({ error: "Paste researcher profile text." }, { status: 400 });
    }

    const clipped = text.slice(0, 50000);

    const systemPrompt = [
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
    ].join("\n");

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: "user", content: `--- RESEARCHER PROFILE TEXT ---\n${clipped}` },
      ],
    });

    const content = message.content[0]?.type === "text" ? message.content[0].text : "";

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
    const msg = error instanceof Error ? error.message : "AI generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
