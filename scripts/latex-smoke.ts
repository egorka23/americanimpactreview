import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { compileLatexLab } from "@/lib/latex-lab/compile";
import { execFileSync } from "child_process";

const FIXTURES_DIR = path.join(process.cwd(), "fixtures/latex-lab");

type Fixture = {
  name: string;
  filename: string;
  kind: "md" | "zip";
};

const FIXTURES: Fixture[] = [
  { name: "simple", filename: "simple.md", kind: "md" },
  { name: "long", filename: "long.md", kind: "md" },
  { name: "unicode", filename: "unicode.md", kind: "md" },
  { name: "list-table", filename: "list-table.md", kind: "md" },
  { name: "figures", filename: "figures.md", kind: "zip" },
];

function ensureDocker() {
  execFileSync("docker", ["--version"], { stdio: "inherit" });
}

async function run() {
  ensureDocker();

  for (const fixture of FIXTURES) {
    const sourcePath = path.join(FIXTURES_DIR, fixture.filename);
    const mdContent = fs.readFileSync(sourcePath, "utf8");

    let filename = fixture.filename;
    let buffer = Buffer.from(mdContent, "utf8");

    if (fixture.kind === "zip") {
      const zip = new AdmZip();
      zip.addFile("main.md", Buffer.from(mdContent, "utf8"));
      const imagePath = path.join(FIXTURES_DIR, "images", "sample.png");
      zip.addFile("images/sample.png", fs.readFileSync(imagePath));
      buffer = zip.toBuffer();
      filename = "bundle.zip";
    }

    console.log(`[latex-smoke] Compiling ${fixture.name}...`);
    const result = await compileLatexLab({
      filename,
      content: buffer,
      meta: {
        title: `Fixture: ${fixture.name}`,
        authors: "AIR Test Suite",
      },
      debug: false,
    });

    if (!result.ok || !result.pdf) {
      console.error(`[latex-smoke] Failed: ${fixture.name}`);
      console.error(result.logText);
      process.exit(1);
    }
  }

  console.log("[latex-smoke] All fixtures compiled successfully.");
}

run().catch((err) => {
  console.error("[latex-smoke] Error:", err);
  process.exit(1);
});
