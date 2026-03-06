"use client";

import { useState, useRef } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const honeypotRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
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
      setMessage(data.message || "Thank you for subscribing!");
      setEmail("");

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

  return (
    <div className="air-newsletter">
      <div className="air-newsletter__label">Stay updated</div>
      {status === "success" ? (
        <p className="air-newsletter__msg air-newsletter__msg--ok">{message}</p>
      ) : (
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
            type="email"
            className="air-newsletter__input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
            required
          />
          <button
            type="submit"
            className="air-newsletter__btn"
            disabled={status === "loading"}
          >
            {status === "loading" ? "..." : "Subscribe"}
          </button>
        </form>
      )}
      {status === "error" && (
        <p className="air-newsletter__msg air-newsletter__msg--err">{message}</p>
      )}
    </div>
  );
}
