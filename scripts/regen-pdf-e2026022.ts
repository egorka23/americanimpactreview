import fs from "fs";
import { compileLatexLab } from "../lib/latex-lab/compile";

const DOCX_PATH = "/Users/aeb/Desktop/бизнес статьи для AIR/Article_05_SaaS_Freemium_CaseStudy_revised.docx";
const OUTPUT_PATH = "/Users/aeb/Desktop/e2026022.pdf";

async function main() {
  console.log("Reading DOCX...");
  const buffer = fs.readFileSync(DOCX_PATH);

  console.log("Compiling with LaTeX...");
  const result = await compileLatexLab({
    filename: "Article_05_SaaS_Freemium_CaseStudy_revised.docx",
    content: buffer,
    meta: {
      title: "Scaling a SaaS Business: The Role of Freemium Models in Converting Free Users to Paying Customers",
      authors: "Noa Kessler, Patrick W. Gallagher",
      received: "January 22, 2026",
      accepted: "February 28, 2026",
      published: "March 7, 2026",
      articleType: "Research Article",
      pages: "e2026022",
      keywords: [
        "freemium",
        "SaaS",
        "conversion rate",
        "product-led growth",
        "customer acquisition",
        "B2B software"
      ],
    },
    debug: false,
    imageFit: true,
  });

  if (!result.ok || !result.pdf) {
    console.error("Compilation failed!");
    console.error(result.userMessage);
    // Print last 2000 chars of log
    if (result.logText) {
      console.error("\n--- LOG (last 2000 chars) ---");
      console.error(result.logText.slice(-2000));
    }
    process.exit(1);
  }

  fs.writeFileSync(OUTPUT_PATH, result.pdf);
  console.log(`PDF saved to ${OUTPUT_PATH} (${(result.pdf.length / 1024).toFixed(0)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
