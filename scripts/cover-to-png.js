// Generate PNG cover images from cover-stock.html
// Usage: node scripts/cover-to-png.js [articleId]
// Example: node scripts/cover-to-png.js e2026022

const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const HTML_PATH = path.resolve(__dirname, "../public/cover-stock.html");
const OUT_DIR = path.resolve(__dirname, "../public/article-covers/covers");

async function run() {
  const targetId = process.argv[2]; // optional: specific article id

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 2000, deviceScaleFactor: 3 }); // 3x for high quality
  await page.goto("file://" + HTML_PATH, { waitUntil: "networkidle0" });

  // Wait for images to load
  await new Promise((r) => setTimeout(r, 2000));

  // Find all cover elements
  const covers = await page.$$(".w");

  for (const cover of covers) {
    // Get the article ID from the comment above or the DOI in the meta
    const id = await cover.evaluate((el) => {
      const meta = el.querySelector(".meta span");
      if (meta) {
        const m = meta.textContent.match(/air\.(e\d+)/);
        if (m) return m[1];
      }
      return null;
    });

    if (!id) continue;
    if (targetId && id !== targetId) continue;

    const coverEl = await cover.$(".c");
    if (!coverEl) continue;

    const outPath = path.join(OUT_DIR, `${id}-cover.png`);
    await coverEl.screenshot({ path: outPath, type: "png" });
    console.log(`✓ ${id} → ${outPath}`);
  }

  await browser.close();
  console.log("Done.");
}

run().catch(console.error);
