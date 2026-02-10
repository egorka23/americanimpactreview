"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SubmissionDraft = {
  title: string;
  section: string;
  fileName: string;
  pageCount: number;
  pageSource: string;
  createdAt: string;
};

type AddOns = {
  express: boolean;
  editing: boolean;
  featured: boolean;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<SubmissionDraft | null>(null);
  const [addOns, setAddOns] = useState<AddOns>({
    express: false,
    editing: false,
    featured: false
  });
  const [agree, setAgree] = useState(false);
  const [locked, setLocked] = useState(false);
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reviewFee = 12;
  const publishingPerPage = 45;
  const expressFee = 20;
  const editingPerPage = 30;
  const featuredFee = 25;

  useEffect(() => {
    const raw = localStorage.getItem("tim_submission_draft");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setDraft(parsed);
    } catch (err) {
      setDraft(null);
    }
  }, []);

  const publishingFee = useMemo(() => {
    if (!draft) return 0;
    return draft.pageCount * publishingPerPage;
  }, [draft]);

  const editingFee = useMemo(() => {
    if (!draft || !addOns.editing) return 0;
    return draft.pageCount * editingPerPage;
  }, [draft, addOns.editing]);

  const addOnTotal = useMemo(() => {
    return (addOns.express ? expressFee : 0) + (addOns.featured ? featuredFee : 0) + editingFee;
  }, [addOns.express, addOns.featured, editingFee]);

  const subtotal = useMemo(() => {
    return reviewFee + addOnTotal;
  }, [reviewFee, addOnTotal]);

  const total = subtotal;

  const hasRequiredDraft =
    !!draft &&
    !!draft.title &&
    !!draft.section &&
    !!draft.fileName &&
    Number.isFinite(draft.pageCount) &&
    draft.pageCount > 0;

  const canPay =
    hasRequiredDraft &&
    agree &&
    payerName.trim().length > 1 &&
    payerEmail.trim().length > 3 &&
    cardNumber.trim().length >= 12 &&
    cardExp.trim().length >= 4 &&
    cardCvc.trim().length >= 3 &&
    !locked;

  const handlePay = () => {
    setError(null);
    if (!hasRequiredDraft) {
      setError("Missing article data. Please return to publish page.");
      return;
    }
    if (!agree) {
      setError("You must accept the review fee terms.");
      return;
    }
    if (!canPay) {
      setError("Please complete all required payment fields.");
      return;
    }
    setLocked(true);
    const submissionId = `TIM-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const record = {
      id: submissionId,
      draft,
      addOns,
      pricing: {
        reviewFee,
        publishingPerPage,
        publishingFee,
        expressFee: addOns.express ? expressFee : 0,
        editingPerPage,
        editingFee,
        featuredFee: addOns.featured ? featuredFee : 0,
        subtotal,
        total
      },
      payer: {
        name: payerName.trim(),
        email: payerEmail.trim()
      },
      status: "submitted",
      createdAt: new Date().toISOString(),
      locked: true
    };

    const existing = localStorage.getItem("tim_submissions");
    const list = existing ? JSON.parse(existing) : [];
    const next = Array.isArray(list) ? [...list, record] : [record];
    localStorage.setItem("tim_submissions", JSON.stringify(next));
    localStorage.setItem("tim_last_submission", JSON.stringify(record));

    window.setTimeout(() => {
      router.push("/confirmation");
    }, 900);
  };

  return (
    <section className="checkout-layout">
      <div className="checkout-left">
        <header className="checkout-header">
          <h1>Checkout</h1>
          <p>Complete payment to submit your article for review.</p>
        </header>

        <div className="checkout-card">
          <h2>Article information</h2>
          {!hasRequiredDraft ? (
            <div className="checkout-empty">
              <p>No article data found.</p>
              <button className="button" onClick={() => router.push("/write")}>
                Return to publish
              </button>
            </div>
          ) : (
            <>
              <div className="checkout-meta">
                <div>
                  <span>Title</span>
                  <strong>{draft?.title}</strong>
                </div>
                <div>
                  <span>Section</span>
                  <strong>{draft?.section}</strong>
                </div>
                <div>
                  <span>File</span>
                  <strong>{draft?.fileName}</strong>
                </div>
                <div>
                  <span>Pages</span>
                  <strong>{draft?.pageCount}</strong>
                </div>
                <div>
                  <span>Price per page</span>
                  <strong>$ {publishingPerPage}</strong>
                </div>
              </div>

              <div className="checkout-addons">
                <h3>Optional add-ons</h3>
                <label>
                  <input
                    type="checkbox"
                    checked={addOns.express}
                    onChange={(event) =>
                      setAddOns((prev) => ({ ...prev, express: event.target.checked }))
                    }
                    disabled={locked}
                  />
                  <span>Express review (+$ {expressFee})</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={addOns.editing}
                    onChange={(event) =>
                      setAddOns((prev) => ({ ...prev, editing: event.target.checked }))
                    }
                    disabled={locked}
                  />
                  <span>Professional editing (+$ {editingPerPage} / page)</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={addOns.featured}
                    onChange={(event) =>
                      setAddOns((prev) => ({ ...prev, featured: event.target.checked }))
                    }
                    disabled={locked}
                  />
                  <span>Featured placement (+$ {featuredFee})</span>
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="checkout-right">
        <div className="checkout-card checkout-summary">
          <h2>Order summary</h2>
          <div className="summary-row">
            <span>Review fee (required)</span>
            <strong>$ {reviewFee}</strong>
          </div>
          <div className="summary-row summary-muted">
            <span>Estimated publishing fee ({draft?.pageCount || 0} pages)</span>
            <strong>$ {publishingFee}</strong>
          </div>
          {addOns.express ? (
            <div className="summary-row">
              <span>Express review</span>
              <strong>$ {expressFee}</strong>
            </div>
          ) : null}
          {addOns.editing ? (
            <div className="summary-row">
              <span>Professional editing</span>
              <strong>$ {editingFee}</strong>
            </div>
          ) : null}
          {addOns.featured ? (
            <div className="summary-row">
              <span>Featured placement</span>
              <strong>$ {featuredFee}</strong>
            </div>
          ) : null}
          <div className="summary-row summary-total">
            <span>Review total due today</span>
            <strong>$ {total}</strong>
          </div>
          <p className="summary-note">
            Publishing fees are billed only after approval. All submissions undergo independent review.
          </p>
        </div>

        <div className="checkout-card">
          <h2>Payment details</h2>
          <div className="checkout-form">
            <label>
              Name on card
              <input
                className="input"
                value={payerName}
                onChange={(event) => setPayerName(event.target.value)}
                placeholder="Full name"
                disabled={locked}
              />
            </label>
            <label>
              Email
              <input
                className="input"
                value={payerEmail}
                onChange={(event) => setPayerEmail(event.target.value)}
                placeholder="name@email.com"
                disabled={locked}
              />
            </label>
            <label>
              Card number
              <input
                className="input"
                value={cardNumber}
                onChange={(event) => setCardNumber(event.target.value)}
                placeholder="4242 4242 4242 4242"
                disabled={locked}
              />
            </label>
            <div className="checkout-form__row">
              <label>
                Expiry
                <input
                  className="input"
                  value={cardExp}
                  onChange={(event) => setCardExp(event.target.value)}
                  placeholder="MM/YY"
                  disabled={locked}
                />
              </label>
              <label>
                CVC
                <input
                  className="input"
                  value={cardCvc}
                  onChange={(event) => setCardCvc(event.target.value)}
                  placeholder="123"
                  disabled={locked}
                />
              </label>
            </div>
          </div>

          <label className="checkout-terms">
            <input
              type="checkbox"
              checked={agree}
              onChange={(event) => setAgree(event.target.checked)}
              disabled={locked}
            />
            <span>
              I agree that the review fee is non-refundable and publication is subject to approval.
            </span>
          </label>

          {error ? <p className="checkout-error">{error}</p> : null}

          <button className="button big checkout-pay" disabled={!canPay} onClick={handlePay}>
            Pay review fee $ {total}
          </button>

          <div className="checkout-trust">
            <span>Secure payment</span>
            <span>Privacy protected</span>
            <span>Stripe-ready checkout</span>
          </div>
        </div>
      </div>
    </section>
  );
}
