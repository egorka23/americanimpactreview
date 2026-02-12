"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const faqs: { q: string; a: string }[] = [
  {
    q: "When is the publication fee charged?",
    a: "Only after your manuscript has been accepted through peer review. There are no submission fees, page charges, or color-figure surcharges at any stage.",
  },
  {
    q: "Can my institution or funder pay the fee?",
    a: "Yes. After acceptance we can issue an invoice directly to your institution, department, or funding agency. Just let us know during the payment step.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept credit and debit cards (Visa, Mastercard, Amex) and bank wire transfers. Institutional purchase orders are also accepted.",
  },
  {
    q: "Does requesting a fee waiver affect my review?",
    a: "No. Waiver requests are handled by the editorial office and are never disclosed to editors or reviewers. Fee status has no influence on peer review or acceptance decisions.",
  },
  {
    q: "How long does a waiver decision take?",
    a: "Typically within 5 business days of your request. You will receive an email with the decision and next steps.",
  },
  {
    q: "I'm a reviewer for AIR. Do I get a discount?",
    a: "Yes. Active peer reviewers receive a voucher code that can be applied toward future publication fees. The voucher is issued after completing a review assignment.",
  },
  {
    q: "Why is the fee so much lower than other journals?",
    a: "American Impact Review is published by Global Talent Foundation, a 501(c)(3) nonprofit. We have no shareholders or profit targets. The $200 fee covers only the direct costs of production, hosting, and archiving.",
  },
];

export default function PricingClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">About</div>
          <h1>Pricing</h1>
          <p>
            American Impact Review is published by Global Talent Foundation, a registered 501(c)(3) nonprofit. Because we have no shareholders, no advertising revenue targets, and no profit motive, we keep our article processing charge at a fixed $200, a fraction of what most open-access journals charge. Every dollar goes directly to peer review coordination, copyediting, hosting, and archiving.
          </p>
          <div className="page-meta">
            <span>Open Access</span>
            <span>No Submission Fee</span>
            <span>Waivers Available</span>
          </div>
        </div>
      </section>

      <section className="page-section pricing-simple">

        {/* ── APC ── */}
        <p className="ps-body">
          The article processing charge is <strong>$200</strong> per accepted manuscript. This is a single flat fee with no hidden costs. You pay nothing to submit. The fee is charged only after your paper has passed peer review and been accepted for publication.
        </p>

        <Link className="button" href="/submit">Submit a manuscript</Link>

        {/* ── What's included ── */}
        <h2 className="ps-heading">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          What is included
        </h2>
        <ul className="ps-list">
          <li>Professional copyediting and formatting</li>
          <li>Permanent DOI and archiving</li>
          <li>Gold open-access distribution</li>
          <li>Indexing submission preparation</li>
          <li>No submission fee, no page charges, no figure surcharges</li>
        </ul>

        {/* ── What the fee supports ── */}
        <h2 className="ps-heading">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Where your fee goes
        </h2>
        <p className="ps-body">
          As a nonprofit publisher we operate without profit margins. The entire $200 goes toward the direct costs of publishing your work.
        </p>
        <div className="ps-supports">
          <div className="ps-support">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b5432a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <div>
              <strong>Peer review coordination</strong>
              <span>Reviewer recruitment, assignment tracking, and editorial management</span>
            </div>
          </div>
          <div className="ps-support">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b5432a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
            <div>
              <strong>Production and copyediting</strong>
              <span>Professional typesetting, layout, and PDF generation</span>
            </div>
          </div>
          <div className="ps-support">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b5432a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <div>
              <strong>Platform and hosting</strong>
              <span>Website maintenance, server infrastructure, and security</span>
            </div>
          </div>
          <div className="ps-support">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b5432a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <div>
              <strong>Archiving and indexing</strong>
              <span>Permanent DOI assignment, metadata distribution, and indexing submissions</span>
            </div>
          </div>
        </div>

        {/* ── Fee waivers ── */}
        <h2 className="ps-heading">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Fee waivers
        </h2>
        <p className="ps-body">
          We believe cost should never prevent good research from being published. Partial or full fee waivers are available for:
        </p>
        <ul className="ps-list">
          <li>Authors from low- and middle-income countries</li>
          <li>Independent researchers without institutional funding</li>
          <li>Graduate students and early-career scholars</li>
          <li>Authors who have served as peer reviewers for AIR</li>
        </ul>
        <p className="ps-body ps-body--note">
          To request a waiver, email <a href="mailto:egor@americanimpactreview.com?subject=Fee%20Waiver%20Request" className="ps-link">egor@americanimpactreview.com</a> with the subject line &quot;Fee Waiver Request&quot; and include your name, affiliation, and a brief explanation. The editorial office reviews within 5 business days. Waiver requests are confidential and never influence editorial decisions.
        </p>

        {/* ── Payment ── */}
        <h2 className="ps-heading">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          Payment
        </h2>
        <div className="ps-supports">
          <div className="ps-support">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b5432a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <div>
              <strong>When to pay</strong>
              <span>After acceptance. Invoice sent by email, due within 30 days.</span>
            </div>
          </div>
          <div className="ps-support">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b5432a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            <div>
              <strong>Methods</strong>
              <span>Stripe, PayPal, Wise, Revolut, bank wire, institutional purchase order.</span>
            </div>
          </div>
          <div className="ps-support">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b5432a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <div>
              <strong>Institutional invoicing</strong>
              <span>We invoice your institution, department, or funder directly.</span>
            </div>
          </div>
          <div className="ps-support">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b5432a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <div>
              <strong>Currency</strong>
              <span>All fees in USD. No additional taxes or surcharges.</span>
            </div>
          </div>
        </div>

        <p className="ps-body ps-body--note" style={{ marginTop: "0.5rem" }}>We accept all major payment methods:</p>
        <div className="ps-payment-logos">
          <div className="ps-payment-badge">
            <Image src="/payment/stripe.svg" alt="Stripe" width={60} height={24} />
          </div>
          <div className="ps-payment-badge">
            <Image src="/payment/paypal.svg" alt="PayPal" width={60} height={24} />
          </div>
          <div className="ps-payment-badge">
            <Image src="/payment/visa.svg" alt="Visa" width={60} height={24} />
          </div>
          <div className="ps-payment-badge">
            <Image src="/payment/mastercard.svg" alt="Mastercard" width={60} height={24} />
          </div>
          <div className="ps-payment-badge">
            <Image src="/payment/amex.svg" alt="Amex" width={60} height={24} />
          </div>
          <div className="ps-payment-badge">
            <Image src="/payment/wise.svg" alt="Wise" width={60} height={24} />
          </div>
          <div className="ps-payment-badge">
            <Image src="/payment/revolut.svg" alt="Revolut" width={60} height={24} />
          </div>
        </div>

        {/* ── Comparison with real journals ── */}
        <h2 className="ps-heading">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          How our fees compare
        </h2>
        <p className="ps-body">
          Most open-access journals charge between $1,000 and $3,000 per article. Below is how AIR compares to other multidisciplinary and social science journals.
        </p>
        <div className="ps-bars">
          <div className="ps-bar">
            <span className="ps-bar__label ps-bar__label--accent">American Impact Review</span>
            <div className="ps-bar__track">
              <div className="ps-bar__fill ps-bar__fill--accent" style={{ width: "8%" }} />
            </div>
            <span className="ps-bar__val ps-bar__val--accent">$200</span>
          </div>
          <div className="ps-bar">
            <span className="ps-bar__label">F1000Research</span>
            <div className="ps-bar__track">
              <div className="ps-bar__fill ps-bar__fill--mid" style={{ width: "53%" }} />
            </div>
            <span className="ps-bar__val">$1,595</span>
          </div>
          <div className="ps-bar">
            <span className="ps-bar__label">Cogent</span>
            <div className="ps-bar__track">
              <div className="ps-bar__fill ps-bar__fill--mid" style={{ width: "73%" }} />
            </div>
            <span className="ps-bar__val">$2,195</span>
          </div>
          <div className="ps-bar">
            <span className="ps-bar__label">SAGE Open</span>
            <div className="ps-bar__track">
              <div className="ps-bar__fill ps-bar__fill--mid" style={{ width: "75%" }} />
            </div>
            <span className="ps-bar__val">$2,250</span>
          </div>
          <div className="ps-bar">
            <span className="ps-bar__label">Heliyon</span>
            <div className="ps-bar__track">
              <div className="ps-bar__fill ps-bar__fill--mid" style={{ width: "76%" }} />
            </div>
            <span className="ps-bar__val">$2,270</span>
          </div>
          <div className="ps-bar">
            <span className="ps-bar__label">PLOS ONE</span>
            <div className="ps-bar__track">
              <div className="ps-bar__fill ps-bar__fill--light" style={{ width: "79%" }} />
            </div>
            <span className="ps-bar__val">$2,382</span>
          </div>
          <div className="ps-bar">
            <span className="ps-bar__label">Frontiers</span>
            <div className="ps-bar__track">
              <div className="ps-bar__fill ps-bar__fill--light" style={{ width: "84%" }} />
            </div>
            <span className="ps-bar__val">$2,535</span>
          </div>
          <div className="ps-bar">
            <span className="ps-bar__label">MDPI</span>
            <div className="ps-bar__track">
              <div className="ps-bar__fill ps-bar__fill--light" style={{ width: "100%" }} />
            </div>
            <span className="ps-bar__val">$3,120</span>
          </div>
        </div>

        {/* ── FAQ ── */}
        <h2 className="ps-heading">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Frequently asked questions
        </h2>
        <div className="ps-faq-list">
          {faqs.map((faq, i) => (
            <button
              key={i}
              className={`ps-faq ${openFaq === i ? "is-open" : ""}`}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              type="button"
            >
              <div className="ps-faq__q">
                <span>{faq.q}</span>
                <svg className="ps-faq__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
              </div>
              <div className="ps-faq__a">{faq.a}</div>
            </button>
          ))}
        </div>

        {/* ── CTA ── */}
        <div className="ps-cta">
          <h3>Ready to publish?</h3>
          <p>Submit your manuscript today. No upfront costs; fees apply only upon acceptance.</p>
          <div className="ps-cta__actions">
            <Link className="button" href="/submit">Submit a manuscript</Link>
            <Link className="button button--secondary" href="/getting-started">How it works</Link>
          </div>
        </div>

      </section>
    </>
  );
}
