"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ConfirmationPage() {
  const [record, setRecord] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem("tim_last_submission");
    if (!raw) return;
    try {
      setRecord(JSON.parse(raw));
    } catch (err) {
      setRecord(null);
    }
  }, []);

  if (!record) {
    return (
      <section className="checkout-layout">
        <div className="checkout-card">
          <h1>Submission not found</h1>
          <p>Please return to submit a manuscript.</p>
          <Link className="button" href="/submit">
            Submit a Manuscript
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout-layout">
      <div className="checkout-card confirmation-card">
        <h1>Payment confirmed</h1>
        <p>Thank you. Your submission is now in the review queue.</p>
        <div className="confirmation-meta">
          <div>
            <span>Submission ID</span>
            <strong>{record.id}</strong>
          </div>
          <div>
            <span>Title</span>
            <strong>{record.draft?.title}</strong>
          </div>
          <div>
            <span>Pages</span>
            <strong>{record.draft?.pageCount}</strong>
          </div>
          <div>
            <span>Total paid</span>
            <strong>$ {record.pricing?.total}</strong>
          </div>
        </div>
        <p className="summary-note">
          Payment does not guarantee publication. All submissions undergo independent review.
        </p>
        <div className="confirmation-actions">
          <Link className="button big" href="/journal">
            Go to dashboard
          </Link>
          <Link className="button-secondary" href="/write">
            Submit another
          </Link>
        </div>
      </div>
    </section>
  );
}
