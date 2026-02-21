"use client";

import { useState, FormEvent } from "react";

export default function ContactClient() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send message");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">Contact</div>
          <h1>Contact Us</h1>
          <p>
            Questions about submissions, editorial decisions, or general
            inquiries - we are here to help.
          </p>
          <div className="page-meta">
            <span>Editorial Office</span>
            <span>Publisher</span>
            <span>Support</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="faq-grid">
          <div className="card settings-card">
            <h3>Editorial Office</h3>
            <p>
              For editorial inquiries, you may contact the Editor-in-Chief directly:
            </p>
            <p style={{ fontWeight: 600, color: "rgb(var(--accent))" }}>
              egor@americanimpactreview.com
            </p>
            <p>
              Or use the contact form below. We aim to respond within 2-3 business days.
            </p>
          </div>

          <div className="card settings-card">
            <h3>Publisher</h3>
            <p>
              American Impact Review is published by:
            </p>
            <p style={{ fontWeight: 600 }}>
              Global Talent Foundation Inc.
            </p>
            <ul className="category-list">
              <li>7613 Elmwood Ave, Suite 628241</li>
              <li>Middleton, WI 53562, USA</li>
            </ul>
          </div>
        </div>

        <div className="write-section">
          <header className="major">
            <h2>Send a Message</h2>
          </header>

          {submitted ? (
            <div className="card settings-card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
              <h3 style={{ color: "rgb(var(--accent))", marginBottom: "0.75rem" }}>
                Thank you!
              </h3>
              <p style={{ marginBottom: 0 }}>
                We&apos;ll respond within 2-3 business days.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card settings-card" style={{ display: "grid", gap: "1.25rem" }}>
              <div className="contact-name-email-grid" style={{ display: "grid", gap: "1.25rem" }}>
                <div>
                  <label
                    htmlFor="contact-name"
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase" as const,
                      color: "rgb(var(--muted))",
                      marginBottom: "0.4rem",
                    }}
                  >
                    Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      border: "1px solid rgba(10,22,40,0.12)",
                      borderRadius: "10px",
                      fontSize: "0.95rem",
                      fontFamily: "inherit",
                      background: "#faf8f5",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase" as const,
                      color: "rgb(var(--muted))",
                      marginBottom: "0.4rem",
                    }}
                  >
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      border: "1px solid rgba(10,22,40,0.12)",
                      borderRadius: "10px",
                      fontSize: "0.95rem",
                      fontFamily: "inherit",
                      background: "#faf8f5",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-subject"
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase" as const,
                    color: "rgb(var(--muted))",
                    marginBottom: "0.4rem",
                  }}
                >
                  Subject
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Subject of your inquiry"
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    border: "1px solid rgba(10,22,40,0.12)",
                    borderRadius: "10px",
                    fontSize: "0.95rem",
                    fontFamily: "inherit",
                    background: "#faf8f5",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase" as const,
                    color: "rgb(var(--muted))",
                    marginBottom: "0.4rem",
                  }}
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Your message..."
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    border: "1px solid rgba(10,22,40,0.12)",
                    borderRadius: "10px",
                    fontSize: "0.95rem",
                    fontFamily: "inherit",
                    background: "#faf8f5",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>

              {error && (
                <p style={{ color: "#b5432a", fontSize: "0.9rem", margin: 0 }}>{error}</p>
              )}

              <div>
                <button
                  type="submit"
                  className="button"
                  disabled={sending}
                  style={{ cursor: sending ? "wait" : "pointer", opacity: sending ? 0.7 : 1 }}
                >
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
