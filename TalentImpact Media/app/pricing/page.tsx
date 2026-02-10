"use client";

import Link from "next/link";

export default function PricingPage() {
  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">About</div>
          <h1>Pricing</h1>
          <p>Transparent, flat‑rate publication fees with optional vouchers.</p>
          <div className="page-meta">
            <span>Open Access</span>
            <span>Flat‑Rate</span>
            <span>Voucher Available</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="pricing-grid">
          <article className="pricing-card pricing-card--primary">
            <div className="pricing-card__badge">Publication fee</div>
            <h2>$200</h2>
            <p className="pricing-card__subtitle">
              Flat fee per accepted article.
            </p>
            <ul className="category-list">
              <li>Charged only after acceptance</li>
              <li>Includes DOI assignment and archiving</li>
              <li>Copyediting and journal formatting included</li>
              <li>Open‑access distribution</li>
            </ul>
            <div className="pricing-card__actions">
              <Link className="button" href="/submit">
                Submit now
              </Link>
            </div>
          </article>

          <article className="pricing-card">
            <div className="pricing-card__badge pricing-card__badge--muted">Voucher program</div>
            <h3>Apply for a voucher</h3>
            <p className="pricing-card__subtitle">
              Authors may request a voucher to reduce or waive the publication fee.
            </p>
            <ul className="category-list">
              <li>Request during submission</li>
              <li>Based on need or institutional support</li>
              <li>Reviewed by the editorial office</li>
              <li>No impact on editorial decisions</li>
            </ul>
            <div className="pricing-card__note">
              Questions? Contact the editorial office via the reviewer inquiry form or
              include notes in your submission.
            </div>
          </article>
        </div>

        <div className="card settings-card" style={{ marginTop: "1.5rem" }}>
          <h3>What the fee supports</h3>
          <ul className="category-list">
            <li>Editorial screening and peer review coordination</li>
            <li>Production, layout, and PDF publication</li>
            <li>Permanent archiving and indexing preparation</li>
            <li>Platform hosting and maintenance</li>
          </ul>
        </div>
      </section>
    </>
  );
}
