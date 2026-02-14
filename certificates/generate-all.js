const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// All articles data
const articles = [
  {
    id: 'e2026001',
    title: 'Monitoring and Scalability of High-Load Systems: An Evidence-Based Framework for Real-Time SLA Compliance and Customer Satisfaction Optimization',
    authors: ['Nikolai Stepanov', 'Bogdan Mikhaylov'],
    received: 'January 11, 2026',
    published: 'February 10, 2026',
    doi: '10.70729/air.2026.0201',
  },
  {
    id: 'e2026002',
    title: 'Diagnostic Capabilities of Hardware-Software Systems in Sports Medicine',
    authors: ['V.M. Alekseev'],
    received: 'January 11, 2026',
    published: 'February 10, 2026',
    doi: '10.70729/air.2026.0202',
  },
  {
    id: 'e2026003',
    title: 'Finger Dermatoglyphics as Predictive Markers of Physical Abilities: Applications in Athlete Selection and Training',
    authors: ['Tamara F. Abramova', 'Tatyana M. Nikitina', 'Nadezhda I. Kochetkova'],
    received: 'January 11, 2026',
    published: 'February 10, 2026',
    doi: '10.70729/air.2026.0203',
  },
  {
    id: 'e2026004',
    title: 'Laboratory Assessment of Aerobic and Anaerobic Performance in Elite Greco-Roman Wrestlers: A Case Series Using the Wingate Anaerobic Test and Graded Exercise Testing',
    authors: ['Ivan Timme'],
    received: 'January 15, 2026',
    published: 'February 10, 2026',
    doi: '10.70729/air.2026.0204',
  },
  {
    id: 'e2026005',
    title: 'Genetic Markers for Talent Identification and Training Individualization in Elite Combat Sport and Endurance Athletes: Insights from a National Sports Science Program',
    authors: ['Roman Andreev'],
    received: 'January 15, 2026',
    published: 'February 10, 2026',
    doi: '10.70729/air.2026.0205',
  },
  {
    id: 'e2026006',
    title: 'Longitudinal Physiological Monitoring and Evidence-Based Training Periodization in Junior Cross-Country Skiers: A Three-Season Case Study',
    authors: ['Alex Ver'],
    received: 'January 20, 2026',
    published: 'February 10, 2026',
    doi: '10.70729/air.2026.0206',
  },
  {
    id: 'e2026007',
    title: 'Leveraging Artificial Intelligence for Scalable Customer Success in Mobile Marketing Technology: A Systematic Review and Strategic Framework',
    authors: ['Eugene Mishchenko', 'Irina Smirnova'],
    received: 'January 20, 2026',
    published: 'February 11, 2026',
    doi: '10.70729/air.2026.0207',
  },
];

function adaptFontSizes(titleLen, nameLen) {
  let titleSize, nameSize;
  if (titleLen <= 60) titleSize = 28;
  else if (titleLen <= 100) titleSize = 24;
  else if (titleLen <= 150) titleSize = 21;
  else if (titleLen <= 200) titleSize = 18;
  else titleSize = 16;

  if (nameLen <= 15) nameSize = 52;
  else if (nameLen <= 25) nameSize = 44;
  else if (nameLen <= 35) nameSize = 38;
  else nameSize = 32;

  return { titleSize, nameSize };
}

function buildHTML(article, authorName) {
  const { titleSize, nameSize } = adaptFontSizes(article.title.length, authorName.length);

  // Read the seal SVG inline
  const sealPath = path.join(__dirname, 'seals', 'seal-06.svg');
  const sealSVG = fs.readFileSync(sealPath, 'utf8');

  // Read signature SVG
  const sigPath = path.join(__dirname, 'signature.svg');
  let sigTag = '';
  if (fs.existsSync(sigPath)) {
    sigTag = `<img class="sig-svg" src="file://${sigPath}" alt="Egor Akimov, Ph.D.">`;
  } else {
    sigTag = `<div style="font-family:'Great Vibes',cursive;font-size:36px;color:#1a2550;">Egor Akimov</div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Great+Vibes&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');
  @font-face {
    font-family: 'Amsterdam';
    src: url('file://${path.join(__dirname, 'Amsterdam.ttf')}') format('truetype');
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: 816px 1056px; margin: 0; }
  html, body {
    width: 816px; height: 1056px;
    font-family: 'EB Garamond', serif;
    background: #ece6f5;
    overflow: hidden;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .bg { position: absolute; top: 0; left: 0; width: 816px; height: 1056px; z-index: 1; }
  .page {
    position: relative; z-index: 10;
    width: 816px; height: 1056px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: space-evenly;
    padding: 40px 80px;
    overflow: hidden;
  }
  .header { text-align: center; }
  .journal-name {
    font-family: 'Playfair Display', serif;
    font-size: 30px; font-weight: 900;
    color: #1a2550; letter-spacing: 2px; text-transform: uppercase;
  }
  .journal-subtitle { font-size: 14px; color: #555; margin-top: 2px; }
  .cert-section { text-align: center; width: 100%; }
  .hr { width: 100%; height: 1.5px; background: linear-gradient(90deg, transparent, #8a7a4a, transparent); }
  .cert-title {
    font-family: 'Playfair Display', serif;
    font-size: 17px; font-weight: 700;
    color: #8a6d1b; letter-spacing: 5px; text-transform: uppercase;
    margin: 5px 0 1px;
  }
  .star { color: #8a7a4a; font-size: 16px; }
  .body-section { text-align: center; }
  .certify-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px; font-style: italic; color: #333; margin-bottom: 14px;
  }
  .article-title {
    font-family: 'Playfair Display', serif;
    font-weight: 700; color: #1a2550;
    text-align: center; padding: 12px 24px;
    border-top: 1.5px solid #1a2550; border-bottom: 1.5px solid #1a2550;
    max-width: 600px; line-height: 1.35;
    font-size: ${titleSize}px;
  }
  .written-by {
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px; font-style: italic; color: #333; margin-top: 22px; margin-bottom: 16px;
  }
  .author-name {
    font-family: 'Amsterdam', 'Great Vibes', cursive;
    font-size: ${nameSize}px; color: #1a2550; line-height: 1.2;
    margin-top: 24px; margin-bottom: 10px;
  }
  .details-section { text-align: center; margin-top: 28px; }
  .details {
    display: inline-block; text-align: left;
    font-size: 17px; color: #333; line-height: 1.8;
  }
  .details .row { display: flex; gap: 8px; }
  .details .label { font-weight: 600; text-align: right; min-width: 80px; color: #1a2550; }
  .details .sep { color: #8a7a4a; }
  .details .val { font-style: italic; }
  .peer-section { text-align: center; }
  .peer-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px; font-style: italic; color: #333; line-height: 1.5;
  }
  .peer-text .jb { font-weight: 700; font-style: italic; color: #1a2550; }
  .footer {
    width: 100%;
    display: flex; justify-content: space-between; align-items: flex-end;
  }
  .sig-block { text-align: left; }
  .sig-svg { width: 240px; height: auto; display: block; margin-bottom: 2px; }
  .sig-title { font-family: 'Cormorant Garamond', serif; font-size: 14px; font-style: italic; color: #444; }
  .sig-org { font-size: 14px; color: #1a2550; font-weight: 600; }
  .seal-block { text-align: center; }
  .seal-img { width: 150px; height: auto; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2)); }
  .issn { font-size: 13px; color: #1a2550; margin-top: 4px; font-weight: 600; letter-spacing: 1px; }
</style>
</head>
<body>
<div class="bg">
  <svg viewBox="0 0 816 1056" xmlns="http://www.w3.org/2000/svg">
    <path d="M450,-10 C560,25 680,55 820,15 L820,-10 Z" fill="rgba(160,170,230,0.3)" />
    <path d="M350,5 C500,55 640,100 820,50 L820,5 Z" fill="rgba(145,155,218,0.22)" />
    <path d="M250,25 C430,90 610,145 820,85 L820,25 Z" fill="rgba(155,165,225,0.18)" />
    <path d="M150,55 C380,130 590,175 820,115 L820,55 Z" fill="rgba(148,158,222,0.14)" />
    <path d="M80,80 C320,160 560,200 820,145 L820,80 Z" fill="rgba(155,165,228,0.1)" />
    <path d="M-20,720 C80,680 280,660 480,710 C640,750 750,800 820,780 L820,1060 L-20,1060 Z" fill="rgba(155,165,225,0.22)" />
    <path d="M-20,770 C70,740 240,720 400,755 C560,785 700,840 820,820 L820,1060 L-20,1060 Z" fill="rgba(148,158,220,0.18)" />
    <path d="M-20,820 C90,795 270,780 440,810 C590,835 720,880 820,865 L820,1060 L-20,1060 Z" fill="rgba(160,170,235,0.14)" />
    <path d="M-20,870 C110,850 290,840 460,860 C610,878 730,915 820,905 L820,1060 L-20,1060 Z" fill="rgba(152,162,226,0.1)" />
    <path d="M680,0 C740,90 790,230 820,330 L820,0 Z" fill="rgba(165,175,238,0.08)" />
    <path d="M-20,880 C40,840 130,770 220,740 L-20,740 Z" fill="rgba(165,175,238,0.08)" />
  </svg>
</div>
<div class="page">
  <div class="header">
    <div class="journal-name">American Impact Review</div>
    <div class="journal-subtitle">A Peer-Reviewed Multidisciplinary Journal</div>
  </div>
  <div class="cert-section">
    <div class="hr"></div>
    <div class="cert-title">Certificate of Publication</div>
    <div class="star">&#9733;</div>
    <div class="hr"></div>
  </div>
  <div class="body-section">
    <div class="certify-text">This is to certify that the article entitled</div>
    <div class="article-title">\u201C${article.title}\u201D</div>
    <div class="written-by">authored by</div>
    <div class="author-name">${authorName}</div>
  </div>
  <div class="details-section">
    <div class="details">
      <div class="row"><span class="label">Received:</span><span class="sep">|</span><span class="val">${article.received}</span></div>
      <div class="row"><span class="label">Published:</span><span class="sep">|</span><span class="val">${article.published}</span></div>
      <div class="row"><span class="label">DOI:</span><span class="sep">|</span><span class="val">${article.doi}</span></div>
    </div>
  </div>
  <div class="peer-section">
    <div class="peer-text">
      has been peer reviewed and published in<br>
      <span class="jb">American Impact Review</span>
    </div>
  </div>
  <div class="footer">
    <div class="sig-block">
      ${sigTag}
      <div class="sig-title">Editor-in-Chief</div>
      <div class="sig-org">American Impact Review</div>
    </div>
    <div class="seal-block">
      <img class="seal-img" src="file://${path.join(__dirname, 'seals', 'seal-06.svg')}" alt="AIR Seal">
      <div class="issn">ISSN: 0000-0000</div>
    </div>
  </div>
</div>
</body>
</html>`;
}

(async () => {
  const outDir = '/Users/aeb/Downloads/AIR-Certificates';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  let count = 0;

  for (const article of articles) {
    for (const author of article.authors) {
      const html = buildHTML(article, author);
      const tmpFile = path.join(__dirname, `_tmp_cert.html`);
      fs.writeFileSync(tmpFile, html);

      const page = await browser.newPage();
      await page.goto(`file://${tmpFile}`, { waitUntil: 'networkidle0', timeout: 15000 });

      // Wait for fonts
      await new Promise(r => setTimeout(r, 1500));

      const safeName = author.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${article.id}-${safeName}.pdf`;

      await page.pdf({
        path: path.join(outDir, filename),
        width: '816px',
        height: '1056px',
        printBackground: true,
        preferCSSPageSize: true,
      });

      await page.close();
      count++;
      console.log(`[${count}] ${filename}`);
    }
  }

  // Cleanup
  const tmpFile = path.join(__dirname, '_tmp_cert.html');
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);

  await browser.close();
  console.log(`\nDone! ${count} certificates saved to ${outDir}`);
})();
