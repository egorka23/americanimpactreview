"use client";

import { useState, useRef, useEffect } from "react";

function SuccessModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="nl-modal-overlay" onClick={onClose}>
      <div className="nl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="nl-modal__check">&#10003;</div>
        <h3 className="nl-modal__title">Thank you for subscribing!</h3>
        <p className="nl-modal__text">
          We&apos;ll send you updates when new peer-reviewed articles are published.
          No spam, only research.
        </p>
        <button className="nl-modal__close" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const isValidEmail = (v: string) =>
    v.length <= 254 && /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (!isValidEmail(trimmed)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          website: honeypotRef.current?.value || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
        return;
      }
      setStatus("success");
      setEmail("");
      setShowModal(true);

      // GA4 event
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "newsletter_signup", {
          event_category: "engagement",
          event_label: "footer_form",
        });
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setStatus("idle");
  };

  return (
    <>
      <div className="air-newsletter">
        <div className="air-newsletter__label">Stay updated</div>
        <form onSubmit={handleSubmit} className="air-newsletter__form">
          {/* Honeypot */}
          <input
            ref={honeypotRef}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            style={{ position: "absolute", left: "-9999px", opacity: 0 }}
          />
          <input
            type="text"
            inputMode="email"
            autoComplete="email"
            className="air-newsletter__input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
            maxLength={254}
          />
          <button
            type="submit"
            className="air-newsletter__btn"
            disabled={status === "loading"}
          >
            {status === "loading" ? "..." : "Sign up"}
          </button>
        </form>
        {status === "error" && (
          <p className="air-newsletter__msg air-newsletter__msg--err">{message}</p>
        )}
      </div>
      {showModal && <SuccessModal onClose={closeModal} />}
    </>
  );
}
