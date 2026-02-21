#!/usr/bin/env node
/**
 * Render certificate HTML to PDF via screenshot approach.
 * Takes a screenshot at exact dimensions, then embeds in a PDF.
 * Usage: node render-pdf.js <input.html> <output.pdf>
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function main() {
  const [,, inputHtml, outputPdf] = process.argv;
  if (!inputHtml || !outputPdf) {
    console.error('Usage: node render-pdf.js <input.html> <output.pdf>');
    process.exit(1);
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // US Letter at 96 DPI: 816 x 1056 px
  await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 4 });

  const fileUrl = 'file://' + path.resolve(inputHtml);
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 15000 });

  // Wait for Google Fonts
  await new Promise(r => setTimeout(r, 2000));

  // Take a screenshot at exact page size
  const pngPath = path.resolve(outputPdf).replace(/\.pdf$/, '.png');
  await page.screenshot({
    path: pngPath,
    clip: { x: 0, y: 0, width: 816, height: 1056 },
    omitBackground: false,
  });

  // Now create a single-page PDF with this image embedded
  // We'll use a new page with the image and print to PDF
  const imgPage = await browser.newPage();
  await imgPage.setViewport({ width: 816, height: 1056 });

  const imgBase64 = fs.readFileSync(pngPath).toString('base64');
  const imgHtml = `<!DOCTYPE html>
<html><head>
<style>
  * { margin: 0; padding: 0; }
  @page { size: 8.5in 11in; margin: 0; }
  html, body { width: 8.5in; height: 11in; overflow: hidden; }
  img { width: 8.5in; height: 11in; display: block; }
</style>
</head><body>
<img src="data:image/png;base64,${imgBase64}">
</body></html>`;

  await imgPage.setContent(imgHtml, { waitUntil: 'load' });

  await imgPage.pdf({
    path: path.resolve(outputPdf),
    width: '8.5in',
    height: '11in',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    pageRanges: '1',
  });

  // Clean up PNG
  fs.unlinkSync(pngPath);

  await browser.close();
  console.log(`PDF saved: ${outputPdf}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
