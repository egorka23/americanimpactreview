"use client";

import { useEffect, useState } from "react";

interface ReviewData {
  reviewerName: string;
  reviewerEmail: string;
  manuscriptId: string;
  title?: string;
  objectivesClear: string;
  literatureAdequate: string;
  introComments: string;
  methodsReproducible: string;
  statisticsAppropriate: string;
  methodsComments: string;
  resultsPresentation: string;
  tablesAppropriate: string;
  resultsComments: string;
  conclusionsSupported: string;
  limitationsStated: string;
  discussionComments: string;
  originality: string;
  methodology: string;
  clarity: string;
  significance: string;
  languageEditing: string;
  majorIssues: string;
  minorIssues: string;
  commentsToAuthors: string;
  confidentialComments: string;
  recommendation: string;
  submittedAt?: string;
  docId?: string;
  fullHash?: string;
}

function CheckIcon({ yes }: { yes: boolean }) {
  return yes ? (
    <div className="check-icon ci-yes">&#10003;</div>
  ) : (
    <div className="check-icon ci-no">&#10007;</div>
  );
}

function NumberedList({ text }: { text: string }) {
  if (!text.trim()) return null;
  const lines = text.split(/\n/).filter((l) => l.trim());
  const numberPattern = /^(\d+)\.\s*(.*)/;

  return (
    <ul className="issue-list">
      {lines.map((line, i) => {
        const match = line.trim().match(numberPattern);
        if (match) {
          return (
            <li key={i}>
              <span className="issue-num">{match[1]}.</span>
              {match[2]}
            </li>
          );
        }
        return <li key={i}>{line.trim()}</li>;
      })}
    </ul>
  );
}

export default function ReviewPrintClient() {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("air-review-print");
      if (raw) {
        setData(JSON.parse(raw));
      }
    } catch {}
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem", color: "#64748b" }}>
        Loading review data...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem", color: "#b91c1c" }}>
        No review data found. Please submit your review first.
      </div>
    );
  }

  const parsedDate = data.submittedAt ? new Date(data.submittedAt) : null;
  const validDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : new Date();

  const shortDate = validDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const longDate = validDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const docId = data.docId || "AIR-PRR-XXXXXXXX";
  const fullHash = data.fullHash || "0000000000000000";
  const now = new Date().toISOString().replace(/\.\d+Z$/, "Z");

  const sections: {
    title: string;
    checks: [string, string][];
    comments?: string;
  }[] = [
    {
      title: "Introduction",
      checks: [
        ["Objectives clearly stated", data.objectivesClear],
        ["Literature review adequate", data.literatureAdequate],
      ],
      comments: data.introComments,
    },
    {
      title: "Methods",
      checks: [
        ["Methods reproducible", data.methodsReproducible],
        ["Statistics appropriate", data.statisticsAppropriate],
      ],
      comments: data.methodsComments,
    },
    {
      title: "Results",
      checks: [
        ["Results presented clearly", data.resultsPresentation],
        ["Tables/figures appropriate", data.tablesAppropriate],
      ],
      comments: data.resultsComments,
    },
    {
      title: "Discussion & Conclusions",
      checks: [
        ["Conclusions supported by data", data.conclusionsSupported],
        ["Limitations clearly stated", data.limitationsStated],
      ],
      comments: data.discussionComments,
    },
  ];

  const ratings: [string, string][] = [
    ["Originality", data.originality],
    ["Methods", data.methodology],
    ["Clarity", data.clarity],
    ["Significance", data.significance],
    ["Lang. Edit", data.languageEditing],
  ];

  return (
    <>
      <style>{printStyles}</style>

      {/* Toolbar (hidden in print) */}
      <div className="prv-toolbar">
        <button className="prv-btn-secondary" onClick={() => window.close()}>
          Close
        </button>
        <button className="prv-btn-download" onClick={() => window.print()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download PDF
        </button>
      </div>

      <div className="prv-page">
        {/* Header */}
        <div className="h-flex">
          <div>
            <div className="h-logo">American Impact Review</div>
            <div className="h-tagline">Published by Global Talent Foundation 501(c)(3)</div>
          </div>
          <div className="h-right">
            <div className="h-doctype">Peer Review Record</div>
            <br />
            <span className="h-id">{docId}</span>
          </div>
        </div>
        <div className="h-divider" />

        {/* Title block */}
        <div className="h-title">Peer Review Record</div>
        {data.title && <div className="h-ms-title">{data.title}</div>}
        <div className="h-ms-id">
          Manuscript {data.manuscriptId} &middot; Single-blind Review &middot; {longDate}
        </div>

        {/* Reviewer prominent */}
        <div className="reviewer-prominent">
          <div className="reviewer-prominent-label">Reviewed By</div>
          <div className="reviewer-prominent-name">{data.reviewerName}</div>
          <div className="reviewer-prominent-email">{data.reviewerEmail}</div>
        </div>

        {/* Two-column meta */}
        <div className="meta-cols">
          <div className="meta-col">
            <div className="meta-col-title">Reviewer</div>
            <div className="meta-row">
              <span className="meta-lbl">Name</span>
              <span className="meta-val">{data.reviewerName}</span>
            </div>
            <div className="meta-row">
              <span className="meta-lbl">Email</span>
              <span className="meta-val">{data.reviewerEmail}</span>
            </div>
          </div>
          <div className="meta-col">
            <div className="meta-col-title">Manuscript</div>
            <div className="meta-row">
              <span className="meta-lbl">ID</span>
              <span className="meta-val">{data.manuscriptId}</span>
            </div>
            <div className="meta-row">
              <span className="meta-lbl">Date</span>
              <span className="meta-val">{shortDate}</span>
            </div>
            <div className="meta-row">
              <span className="meta-lbl">Type</span>
              <span className="meta-val">Single-blind</span>
            </div>
          </div>
        </div>

        {/* Sections */}
        {sections.map((sec) => (
          <div className="sec" key={sec.title}>
            <div className="sec-head">{sec.title}</div>
            <div className="check-list">
              {sec.checks.map(([label, val]) => (
                <div className="check-item" key={label}>
                  <CheckIcon yes={val === "Yes"} />
                  <span className="check-text">{label}</span>
                </div>
              ))}
            </div>
            {sec.comments?.trim() && (
              <>
                <div className="cmt-label">Reviewer Comments</div>
                <p className="cmt-text">{sec.comments}</p>
              </>
            )}
          </div>
        ))}

        {/* Overall Assessment */}
        <div className="sec">
          <div className="sec-head">Overall Assessment</div>
          <div className="ratings-bar">
            {ratings.map(([label, val]) => (
              <div className="rb-item" key={label}>
                <div className="rb-label">{label}</div>
                <div className="rb-value">{val || "-"}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Feedback */}
        <div className="sec">
          <div className="sec-head">Detailed Feedback</div>

          {data.majorIssues?.trim() && (
            <>
              <div className="issue-label">Major Issues</div>
              <NumberedList text={data.majorIssues} />
            </>
          )}

          {data.minorIssues?.trim() && (
            <>
              <div className="issue-label">Minor Issues</div>
              <NumberedList text={data.minorIssues} />
            </>
          )}

          {data.commentsToAuthors?.trim() && (
            <>
              <div className="cmt-label">Comments to Authors</div>
              <p className="cmt-text">{data.commentsToAuthors}</p>
            </>
          )}

          {data.confidentialComments?.trim() && (
            <>
              <div className="cmt-label">Confidential to Editor</div>
              <p className="cmt-text">{data.confidentialComments}</p>
            </>
          )}
        </div>

        {/* Recommendation card */}
        <div className="rec-card">
          <span className="rec-label">Final Recommendation</span>
          <span className="rec-val">{data.recommendation}</span>
        </div>

        {/* Verification box */}
        <div className="ver-box">
          <div className="ver-top">
            <span className="ver-title">Document Verification</span>
            <div className="ver-badge">
              <div className="ver-badge-inner">
                VERIFIED
                <small>AIR Editorial System</small>
              </div>
            </div>
          </div>
          <div className="ver-grid">
            <span className="vl">Document ID:</span>
            <span className="vv">{docId}</span>
            <span className="vl">Integrity (SHA-256):</span>
            <span className="vv">{fullHash.slice(0, 16)}... (cryptographic hash)</span>
            <span className="vl">Publisher:</span>
            <span className="vv">Global Talent Foundation 501(c)(3) &middot; EIN 93-3926624</span>
            <span className="vl">Journal:</span>
            <span className="vv">American Impact Review &middot; americanimpactreview.com</span>
            <span className="vl">Review Protocol:</span>
            <span className="vv">COPE Ethical Guidelines for Peer Reviewers</span>
            <span className="vl">Generated:</span>
            <span className="vv">{now}</span>
          </div>
        </div>

        <p className="disclaimer">
          This peer review record was generated by the American Impact Review editorial system.
          The Document ID is derived from a SHA-256 cryptographic hash of the review content.
          Modification of any field invalidates this record. Retain for professional records and
          credential verification.
        </p>

        <div className="ft-line" />
        <div className="ft">
          American Impact Review &middot; Global Talent Foundation &middot; {docId} &middot; Page 1
        </div>
      </div>
    </>
  );
}

const printStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Roboto:ital,wght@0,400;0,500;0,700;1,400&display=swap');

  /* Reset for this page */
  .prv-toolbar, .prv-page, .prv-page * {
    margin: 0; padding: 0; box-sizing: border-box;
  }

  /* ── TOOLBAR ── */
  .prv-toolbar {
    width: 612px; margin: 0 auto;
    display: flex; justify-content: flex-end; gap: 10px;
    padding: 20px 0 16px;
  }
  .prv-toolbar button {
    font-family: 'Roboto', sans-serif;
    font-size: 13px; font-weight: 600;
    padding: 10px 24px; border: none; border-radius: 4px;
    cursor: pointer; transition: all 0.15s;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .prv-btn-download {
    background: linear-gradient(135deg, #1e3a5f, #2d5a8e) !important;
    color: #fff !important;
    box-shadow: 0 0 0 0 rgba(30,58,95,0.5);
    animation: prvPulse 2s ease-in-out infinite;
    position: relative;
    overflow: hidden;
  }
  .prv-btn-download::before {
    content: '';
    position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
    animation: prvShimmer 3s ease-in-out infinite;
  }
  .prv-btn-download:hover {
    background: linear-gradient(135deg, #15304f, #24466f);
    animation: none;
    box-shadow: 0 4px 20px rgba(30,58,95,0.45);
    transform: translateY(-1px);
  }
  .prv-btn-download:hover::before { animation: none; opacity: 0; }
  @keyframes prvPulse {
    0%, 100% { box-shadow: 0 2px 8px rgba(30,58,95,0.3); }
    50% { box-shadow: 0 4px 24px rgba(30,58,95,0.55), 0 0 12px rgba(45,90,142,0.3); }
  }
  @keyframes prvShimmer {
    0% { left: -100%; }
    60%, 100% { left: 200%; }
  }
  .prv-btn-secondary { background: #fff; color: #1e3a5f; border: 1px solid #b0bdd0; }
  .prv-btn-secondary:hover { background: #f0f3f7; }

  /* ── PAGE ── */
  .prv-page {
    width: 612px; min-height: 792px; background: #fff;
    padding: 40px 48px 44px; margin: 0 auto;
    font-family: 'Lora', Georgia, serif;
    color: #1a1a1a; box-shadow: 0 4px 24px rgba(0,0,0,0.18); line-height: 1.5;
    border-top: 5px solid #1e3a5f;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }

  /* ── HEADER ── */
  .prv-page .h-flex { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
  .prv-page .h-logo { font-family: 'Roboto', sans-serif; font-size: 11px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1px; }
  .prv-page .h-tagline { font-family: 'Roboto', sans-serif; font-size: 7px; color: #666; }
  .prv-page .h-right { text-align: right; }
  .prv-page .h-doctype { font-family: 'Roboto', sans-serif; font-size: 7.5px; font-weight: 700; color: #fff; background: #1a1a1a; text-transform: uppercase; letter-spacing: 1px; padding: 3px 10px; display: inline-block; margin-bottom: 3px; border-radius: 2px; }
  .prv-page .h-id { font-family: 'Roboto Mono', monospace; font-size: 7px; color: #666; }
  .prv-page .h-divider { height: 1.5px; background: #1e3a5f; margin-bottom: 8px; }
  .prv-page .h-title { font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; text-align: center; }
  .prv-page .h-ms-title { font-size: 12px; font-style: italic; color: #444; text-align: center; margin-bottom: 5px; line-height: 1.4; padding: 0 20px; }
  .prv-page .h-ms-id { font-family: 'Roboto', sans-serif; font-size: 9px; color: #666; text-align: center; margin-bottom: 12px; }

  /* ── REVIEWER ── */
  .prv-page .reviewer-prominent { text-align: center; margin-bottom: 14px; }
  .prv-page .reviewer-prominent-label { font-family: 'Roboto', sans-serif; font-size: 7px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 3px; }
  .prv-page .reviewer-prominent-name { font-size: 16px; font-weight: 700; color: #1a1a1a; margin-bottom: 2px; }
  .prv-page .reviewer-prominent-email { font-family: 'Roboto', sans-serif; font-size: 8.5px; color: #555; }

  /* ── META COLS ── */
  .prv-page .meta-cols { display: flex; gap: 12px; margin-bottom: 14px; }
  .prv-page .meta-col { flex: 1; background: #f0f3f7; border-left: 3px solid #1e3a5f; padding: 8px 12px; }
  .prv-page .meta-col-title { font-family: 'Roboto', sans-serif; font-size: 9px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
  .prv-page .meta-row { display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 2px; }
  .prv-page .meta-row:last-child { margin-bottom: 0; }
  .prv-page .meta-lbl { color: #666; font-family: 'Roboto', sans-serif; font-size: 8px; }
  .prv-page .meta-val { font-weight: 600; color: #222; }

  /* ── SECTIONS ── */
  .prv-page .sec { margin-bottom: 22px; }
  .prv-page .sec-head { font-family: 'Roboto', sans-serif; font-size: 13px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px; margin-bottom: 10px; }

  /* ── CHECKLIST ── */
  .prv-page .check-list { margin-bottom: 10px; font-size: 9.5px; padding-left: 12px; }
  .prv-page .check-item { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .prv-page .check-icon { width: 18px; height: 18px; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
  .prv-page .ci-yes { background: #e8edf4; color: #1e3a5f; }
  .prv-page .ci-no { background: #ffebee; color: #c62828; }
  .prv-page .check-text { color: #333; }

  /* ── COMMENTS ── */
  .prv-page .cmt-label { font-family: 'Roboto', sans-serif; font-size: 9px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 8px; margin-bottom: 4px; padding-left: 12px; }
  .prv-page .cmt-text { font-size: 9.5px; color: #222; line-height: 1.6; margin-bottom: 12px; padding-left: 12px; white-space: pre-wrap; }

  /* ── ISSUES ── */
  .prv-page .issue-label { font-family: 'Roboto', sans-serif; font-size: 11px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 8px; margin-bottom: 6px; padding-left: 12px; }
  .prv-page .issue-list { list-style: none; padding-left: 36px; margin-bottom: 12px; }
  .prv-page .issue-list li { font-size: 9.5px; color: #222; line-height: 1.6; margin-bottom: 3px; position: relative; padding-left: 20px; }
  .prv-page .issue-list li .issue-num { font-family: 'Roboto', sans-serif; font-weight: 700; color: #1e3a5f; position: absolute; left: 0; }

  /* ── RATINGS ── */
  .prv-page .ratings-bar { display: flex; gap: 0; margin-bottom: 8px; border: 1px solid #b0bdd0; border-radius: 4px; overflow: hidden; }
  .prv-page .rb-item { flex: 1; text-align: center; padding: 6px 4px; border-right: 1px solid #b0bdd0; font-family: 'Roboto', sans-serif; }
  .prv-page .rb-item:last-child { border-right: none; }
  .prv-page .rb-label { font-size: 7px; color: #666; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 1px; }
  .prv-page .rb-value { font-size: 10px; font-weight: 700; color: #1e3a5f; }

  /* ── RECOMMENDATION ── */
  .prv-page .rec-card { background: #1e3a5f; color: #fff; padding: 14px 20px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; border-radius: 4px; }
  .prv-page .rec-label { font-family: 'Roboto', sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #fff; }
  .prv-page .rec-val { font-size: 16px; font-weight: 700; color: #fff; }

  /* ── VERIFICATION ── */
  .prv-page .ver-box { border: 1px solid #b0bdd0; border-radius: 4px; padding: 10px 14px; margin-bottom: 8px; font-family: 'Roboto', sans-serif; font-size: 9px; }
  .prv-page .ver-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .prv-page .ver-title { font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.8px; font-size: 9px; }
  .prv-page .ver-badge { border: 2px solid #1e3a5f; padding: 2px; display: inline-block; }
  .prv-page .ver-badge-inner { border: 1px solid #1e3a5f; padding: 4px 10px; font-size: 9px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: 1.5px; text-align: center; line-height: 1.3; font-family: 'Roboto', sans-serif; }
  .prv-page .ver-badge-inner small { display: block; font-size: 6px; font-weight: 500; letter-spacing: 0.5px; color: #4a6a8a; margin-top: 1px; }
  .prv-page .ver-grid { display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; }
  .prv-page .vl { font-weight: 600; color: #666; }
  .prv-page .vv { color: #333; }

  .prv-page .disclaimer { font-size: 8px; font-style: italic; color: #777; line-height: 1.5; margin-bottom: 10px; }
  .prv-page .ft-line { height: 1.5px; background: #1e3a5f; margin-bottom: 6px; }
  .prv-page .ft { font-family: 'Roboto', sans-serif; font-size: 7px; color: #777; text-align: center; }

  /* ══════════════════════════════════════════════
     PRINT STYLES
     ══════════════════════════════════════════════ */
  @media print {
    body { background: #fff !important; padding: 0 !important; margin: 0 !important; }
    .prv-toolbar { display: none !important; }
    .prv-page {
      box-shadow: none; width: 100%; max-width: 6.5in;
      min-height: auto; padding: 20px 0 24px; margin: 0 auto;
      border-top: 5px solid #1e3a5f;
    }

    @page { size: letter; margin: 0.5in 0.75in 0.5in 0.75in; }

    /* Scale up text for print readability */
    .prv-page .h-logo { font-size: 14px; }
    .prv-page .h-tagline { font-size: 9px; }
    .prv-page .h-doctype { font-size: 10px; padding: 4px 12px; }
    .prv-page .h-id { font-size: 10px; color: #333; }
    .prv-page .h-divider { height: 2px; }
    .prv-page .h-title { font-size: 19px; margin-bottom: 6px; }
    .prv-page .h-ms-title { font-size: 15px; margin-bottom: 7px; }
    .prv-page .h-ms-id { font-size: 11px; margin-bottom: 16px; }

    .prv-page .reviewer-prominent-label { font-size: 9px; }
    .prv-page .reviewer-prominent-name { font-size: 20px; }
    .prv-page .reviewer-prominent-email { font-size: 11px; }

    .prv-page .meta-col { padding: 10px 14px; }
    .prv-page .meta-col-title { font-size: 11px; margin-bottom: 8px; }
    .prv-page .meta-row { font-size: 11px; margin-bottom: 3px; }
    .prv-page .meta-lbl { font-size: 10px; }
    .prv-page .meta-val { font-size: 11px; }

    .prv-page .sec-head { font-size: 16px; margin-bottom: 12px; }

    .prv-page .check-list { font-size: 12px; }
    .prv-page .check-icon { width: 22px; height: 22px; font-size: 16px; }
    .prv-page .check-item { gap: 8px; margin-bottom: 5px; }
    .prv-page .check-text { font-size: 12px; }

    .prv-page .cmt-label { font-size: 11px; margin-top: 10px; margin-bottom: 5px; }
    .prv-page .cmt-text { font-size: 12px; line-height: 1.65; margin-bottom: 14px; }

    .prv-page .issue-label { font-size: 13px; margin-bottom: 7px; }
    .prv-page .issue-list li { font-size: 12px; line-height: 1.65; margin-bottom: 4px; }

    .prv-page .rb-item { padding: 8px 6px; }
    .prv-page .rb-label { font-size: 9px; }
    .prv-page .rb-value { font-size: 13px; }

    .prv-page .rec-card { padding: 16px 24px; margin-bottom: 18px; }
    .prv-page .rec-label { font-size: 12px; }
    .prv-page .rec-val { font-size: 20px; }

    .prv-page .ver-box { padding: 12px 16px; font-size: 11px; }
    .prv-page .ver-title { font-size: 11px; }
    .prv-page .ver-badge-inner { font-size: 11px; padding: 5px 12px; }
    .prv-page .ver-badge-inner small { font-size: 7px; }
    .prv-page .ver-grid { gap: 5px 12px; }
    .prv-page .vl { font-size: 10px; }
    .prv-page .vv { font-size: 10px; }

    .prv-page .disclaimer { font-size: 11px; color: #333; }
    .prv-page .ft { font-size: 10px; color: #333; }

    /* Prevent breaks */
    .prv-page .sec { break-inside: avoid; }
    .prv-page .rec-card { break-inside: avoid; }
    .prv-page .ver-box { break-inside: avoid; }
    .prv-page .meta-cols { break-inside: avoid; }
    .prv-page .reviewer-prominent { break-inside: avoid; }
    .prv-page .sec-head { break-after: avoid; }
    .prv-page .issue-label { break-after: avoid; }
    .prv-page .cmt-label { break-after: avoid; }
  }
`;
