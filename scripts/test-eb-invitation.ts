import * as fs from "fs";
import * as path from "path";

// Load .env.local manually
const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

import { sendEditorialBoardInvitation } from "@/lib/email";

async function main() {
  await sendEditorialBoardInvitation({
    fullName: "Jane Smith",
    email: "egorka23@gmail.com",
    title: "PhD",
    affiliation: "Stanford University, Department of Computer Science",
    expertiseArea: "artificial intelligence policy and algorithmic governance",
    achievements:
      "your published research on fairness-aware machine learning frameworks and your contribution to the IEEE Standards Association working group on AI transparency",
  });
  console.log("Editorial Board invitation sent to egorka23@gmail.com");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
