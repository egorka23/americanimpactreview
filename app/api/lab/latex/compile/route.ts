import { NextResponse } from "next/server";
import { compileLatexLab } from "@/lib/latex-lab/compile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function isEnabled() {
  return process.env.PDF_LAB_ENABLED === "true";
}

function hasValidToken(token?: string | null) {
  const expected = process.env.PDF_LAB_TOKEN;
  if (!expected) return true;
  return token === expected;
}

export async function POST(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const form = await request.formData();
  const token = String(form.get("token") || request.headers.get("x-lab-token") || "");
  if (!hasValidToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 413 });
  }

  const content = Buffer.from(await file.arrayBuffer());
  const meta = {
    title: String(form.get("title") || ""),
    authors: String(form.get("authors") || ""),
    doi: String(form.get("doi") || ""),
    received: String(form.get("received") || ""),
    accepted: String(form.get("accepted") || ""),
    published: String(form.get("published") || ""),
  };

  const debug = String(form.get("debug") || "") === "true";

  const result = await compileLatexLab({
    filename: file.name,
    content,
    meta,
    debug,
  });

  if (!result.ok || !result.pdf) {
    return NextResponse.json(
      { ok: false, logText: result.logText, userFriendlyMessage: result.userMessage || "Compilation failed." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    pdfBase64: result.pdf.toString("base64"),
    logText: result.logText,
    bundleBase64: result.bundle ? result.bundle.toString("base64") : null,
  });
}
