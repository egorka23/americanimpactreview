// Send "Indexed in Google Scholar" notification email via Resend
// Usage: node scripts/send-scholar-email.js <authorEmail> <authorFirstName> <certPath>
// Example: node scripts/send-scholar-email.js egor@zihipro.com Yelena "/Users/aeb/Downloads/Yelena Kovalenko_AIR Certificate.pdf"

const { Resend } = require("resend");
const fs = require("fs");
const path = require("path");

// Load .env.local manually
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split("\n").forEach(line => {
    const m = line.match(/^([A-Z_]+)="?(.*?)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/\\n/g, "");
  });
}

const RESEND_API_KEY = (process.env.RESEND_API_KEY || "").replace(/\\n/g, "").trim();
const RESEND_FROM = process.env.RESEND_FROM || "American Impact Review <noreply@americanimpactreview.com>";

const resend = new Resend(RESEND_API_KEY);

// Article data for e2026018
const ARTICLE = {
  title: "Value Creation in the Algorithmic Age: A Systematic Review of How AI, Data Privacy, and Platform Ecosystems Are Reshaping Marketing Theory",
  authors: "Yelena Kovalenko, Artem Nikitin, Yana Kuzina",
  doi: "10.66308/air.e2026018",
  slug: "e2026018",
  published: "February 28, 2026",
  scholarUrl: "https://scholar.google.com/scholar?hl=en&as_sdt=0%2C50&q=Value+Creation+in+the+Algorithmic+Age%3A+A+Systematic+Review+of+How+AI%2C+Data+Privacy%2C+and+Platform+Ecosystems+Are+Reshaping+Marketing+Theory",
};

function buildHtml(firstName) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @media only screen and (max-width: 480px) {
      .email-outer { padding: 16px 8px !important; }
      .email-card { padding: 24px 18px !important; border-radius: 12px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f8f6f3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div class="email-outer" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div class="email-card" style="background:#ffffff;border-radius:16px;padding:40px 36px;box-shadow:0 4px 24px rgba(10,22,40,0.06);">

      <div style="text-align:center;margin-bottom:32px;">
        <img src="https://americanimpactreview.com/logo-email.png" alt="AIR" width="48" height="48" style="display:block;margin:0 auto 12px;width:48px;height:48px;" />
        <div style="font-size:18px;font-weight:700;color:#0a1628;letter-spacing:-0.01em;">American Impact Review</div>
        <div style="font-size:11px;color:#8a7e6e;letter-spacing:0.08em;text-transform:uppercase;margin-top:2px;">A Peer-Reviewed Multidisciplinary Journal</div>
      </div>

      <h1 style="font-size:22px;color:#059669;margin:0 0 8px;text-align:center;">Your Article Is Indexed in Google Scholar</h1>
      <p style="font-size:14px;color:#64748b;text-align:center;margin:0 0 28px;">A milestone for your publication</p>

      <p style="font-size:14px;color:#334155;line-height:1.7;">Dear ${firstName},</p>

      <p style="font-size:14px;color:#334155;line-height:1.7;">We are pleased to inform you that your article published in <strong>American Impact Review</strong> has been <strong>indexed by Google Scholar</strong>, one of the world's largest academic search engines. This means your research is now discoverable by millions of scholars, researchers, and students worldwide.</p>

      <div style="background:#f8f6f3;border-radius:12px;padding:20px 24px;margin:20px 0;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:6px 0;color:#64748b;width:120px;vertical-align:top;">Title</td>
            <td style="padding:6px 0;color:#0a1628;font-weight:600;">${ARTICLE.title}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Authors</td>
            <td style="padding:6px 0;color:#0a1628;font-weight:500;">${ARTICLE.authors}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">DOI</td>
            <td style="padding:6px 0;color:#0a1628;font-weight:500;"><a href="https://doi.org/${ARTICLE.doi}" style="color:#1e3a5f;text-decoration:none;">${ARTICLE.doi}</a></td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Published</td>
            <td style="padding:6px 0;color:#0a1628;font-weight:500;">${ARTICLE.published}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Status</td>
            <td style="padding:6px 0;font-weight:600;"><span style="display:inline-block;background:#059669;color:#fff;padding:3px 10px;border-radius:20px;font-size:12px;">Indexed in Google Scholar</span></td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;margin:24px 0;">
        <a href="${ARTICLE.scholarUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">View on Google Scholar</a>
      </div>

      <div style="text-align:center;margin:0 0 24px;">
        <a href="https://americanimpactreview.com/article/${ARTICLE.slug}" style="color:#1e3a5f;font-size:14px;font-weight:500;text-decoration:none;">View article page &#8594;</a>
      </div>

      <div style="margin:20px 0;border-radius:10px;overflow:hidden;border:1px solid #e2e0dc;">
        <img src="https://americanimpactreview.com/email-assets/scholar-e2026018.png" alt="Article page with Google Scholar badge" style="width:100%;display:block;" />
      </div>
      <p style="font-size:12px;color:#94a3b8;text-align:center;margin:4px 0 20px;">Your article page now features a direct link to Google Scholar</p>

      <h2 style="font-size:16px;color:#0a1628;margin:28px 0 14px;">About Your DOI</h2>
      <p style="font-size:14px;color:#334155;line-height:1.7;">Your article has been assigned a permanent Digital Object Identifier (DOI):</p>
      <div style="text-align:center;margin:16px 0 20px;">
        <a href="https://doi.org/${ARTICLE.doi}" style="display:inline-block;background:#f8f6f3;border:1px solid #e2e0dc;border-radius:8px;padding:12px 24px;text-decoration:none;font-size:15px;font-weight:700;color:#1e3a5f;letter-spacing:0.01em;"><span style="display:inline-block;background:#1e3a5f;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;margin-right:10px;vertical-align:middle;letter-spacing:0.05em;">DOI</span>${ARTICLE.doi}</a>
      </div>
      <p style="font-size:14px;color:#334155;line-height:1.7;">A DOI is a unique, permanent identifier registered with <a href="https://www.crossref.org" style="color:#1e3a5f;text-decoration:none;font-weight:500;">Crossref</a>, the world's largest DOI registration agency used by publishers such as Elsevier, Springer Nature, Wiley, and IEEE. Your DOI ensures that:</p>

      <div style="margin:16px 0 20px;">
        <div style="display:flex;margin-bottom:10px;"><span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">1</span><span style="font-size:14px;color:#334155;line-height:1.6;">Your article has a <strong>permanent, citable web address</strong> that will always resolve to your publication, regardless of any future URL changes.</span></div>
        <div style="display:flex;margin-bottom:10px;"><span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">2</span><span style="font-size:14px;color:#334155;line-height:1.6;">Citations to your work are <strong>tracked automatically</strong> across all academic databases worldwide.</span></div>
        <div style="display:flex;margin-bottom:0;"><span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">3</span><span style="font-size:14px;color:#334155;line-height:1.6;">Your publication is <strong>discoverable through Crossref metadata</strong>, which feeds into Google Scholar, ORCID, university repositories, and reference managers like Zotero and Mendeley.</span></div>
      </div>

      <h2 style="font-size:16px;color:#0a1628;margin:28px 0 14px;">What Google Scholar Indexing Means</h2>
      <p style="font-size:14px;color:#334155;line-height:1.7;">Google Scholar is the primary search engine used by researchers to discover academic publications. Indexing in Google Scholar means:</p>
      <ul style="font-size:14px;color:#334155;line-height:1.8;padding-left:20px;margin:8px 0 20px;">
        <li>Your article appears in search results when scholars search for topics in your field</li>
        <li>Citations to your work will be tracked and displayed on your Google Scholar profile</li>
        <li>Your h-index and citation metrics will reflect this publication</li>
        <li>Researchers worldwide can find, read, and cite your work</li>
      </ul>

      <h2 style="font-size:16px;color:#0a1628;margin:28px 0 14px;">Your Publication Certificate</h2>
      <p style="font-size:14px;color:#334155;line-height:1.7;">Your official Certificate of Publication from American Impact Review is attached to this email. This certificate confirms your peer-reviewed publication and can be used for your academic portfolio, CV, or institutional records.</p>

      <hr style="border:none;border-top:1px solid #e2e0dc;margin:28px 0;" />

      <h2 style="font-size:16px;color:#0a1628;margin:0 0 14px;">Recommended Next Steps</h2>
      <div style="font-size:14px;color:#334155;line-height:1.7;">
        <div style="display:flex;margin-bottom:10px;"><span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:#059669;color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">1</span><span>Add this publication to your <strong>Google Scholar profile</strong> to track citations.</span></div>
        <div style="display:flex;margin-bottom:10px;"><span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:#059669;color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">2</span><span>Update your <strong>ORCID record</strong> with this publication and its DOI.</span></div>
        <div style="display:flex;margin-bottom:10px;"><span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:#059669;color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">3</span><span>Share the article link or DOI with colleagues and on professional networks.</span></div>
        <div style="display:flex;margin-bottom:0;"><span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:#059669;color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">4</span><span>Include the DOI (<strong>${ARTICLE.doi}</strong>) in your CV and any reference lists.</span></div>
      </div>

      <hr style="border:none;border-top:1px solid #e2e0dc;margin:28px 0;" />

      <p style="font-size:14px;color:#334155;line-height:1.7;">Thank you for publishing with American Impact Review. We are proud to support the visibility and impact of your research.</p>

      <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0;">If you have questions, reply to this email or contact us at <a href="mailto:editor@americanimpactreview.com" style="color:#1e3a5f;text-decoration:none;">editor@americanimpactreview.com</a>.</p>

    </div>

    <div style="text-align:center;padding:20px 0;font-size:11px;color:#94a3b8;">
      American Impact Review &middot; 501(c)(3) nonprofit (Global Talent Foundation, EIN: 33-2266959)<br />
      7613 Elmwood Ave, Suite 628241, Middleton, WI 53562, USA
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  const email = process.argv[2];
  const firstName = process.argv[3];
  const certPath = process.argv[4];

  if (!email || !firstName) {
    console.error("Usage: node scripts/send-scholar-email.js <email> <firstName> [certPath]");
    process.exit(1);
  }

  const attachments = [];
  if (certPath && fs.existsSync(certPath)) {
    const content = fs.readFileSync(certPath);
    const filename = path.basename(certPath);
    attachments.push({ filename, content });
    console.log(`Attaching: ${filename}`);
  }

  console.log(`Sending to: ${email} (${firstName})`);

  const result = await resend.emails.send({
    from: RESEND_FROM,
    to: email,
    subject: `Your Article Is Now Indexed in Google Scholar | American Impact Review`,
    html: buildHtml(firstName),
    replyTo: "editor@americanimpactreview.com",
    attachments,
  });

  console.log("Sent!", result);
}

main().catch((e) => { console.error(e); process.exit(1); });
