/**
 * Resend review invitation to dalas310516@gmail.com using the standard sendReviewInvitation function
 * which includes both "Download Manuscript PDF" and "Submit Your Review" buttons.
 */
import fs from "fs";
import path from "path";

// Load env BEFORE importing email module (it reads env at top level)
const envPath = path.join(__dirname, "..", ".env.local");
const envLines = fs.readFileSync(envPath, "utf-8").split("\n");
for (const line of envLines) {
  const eqIdx = line.indexOf("=");
  if (eqIdx === -1 || line.startsWith("#")) continue;
  const key = line.slice(0, eqIdx).trim();
  let val = line.slice(eqIdx + 1).trim();
  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
  val = val.replace(/\\n$/, "");
  if (key) process.env[key] = val;
}

async function main() {
  // Dynamic import so env is loaded first
  const { sendReviewInvitation } = await import("../lib/email");

  const pdfUrl = "https://q6wihgzfeqjx7zbu.public.blob.vercel-storage.com/review-copies/AIR-1A45D784-f5cbfa45.pdf";

  await sendReviewInvitation({
    reviewerName: "Dalas",
    reviewerEmail: "dalas310516@gmail.com",
    articleTitle: "Effects of Low-Level Laser Therapy on HSP70 Dynamics and Recovery Biomarkers in Elite Athletes: A Multi-Sport Longitudinal Investigation",
    articleId: "AIR-1A45D784",
    abstract: "This study investigates the effects of low-level laser therapy (LLLT) on heat shock protein 70 (HSP70) dynamics and recovery biomarkers in elite athletes across multiple sports disciplines. Using a longitudinal design with 127 athletes from 6 sports, we monitored physiological responses to LLLT intervention over 12 months of training and competition cycles, evaluating HSP70 expression patterns, inflammatory markers, and functional recovery parameters.",
    deadline: "2026-03-01",
    manuscriptUrl: pdfUrl,
    assignmentId: "f5cbfa45-44f3-4d4b-9f2f-e2b3babf176c",
  });

  console.log("Review invitation sent to dalas310516@gmail.com with both buttons!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
