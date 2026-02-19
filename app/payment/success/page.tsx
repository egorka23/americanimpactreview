import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Successful | American Impact Review",
};

export default function PaymentSuccessPage() {
  return (
    <section className="checkout-layout" style={{ justifyContent: "center", minHeight: "60vh" }}>
      <div className="checkout-card" style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>&#10003;</div>
        <h1 style={{ fontSize: "1.5rem", marginBottom: 8 }}>Payment Successful</h1>
        <p style={{ color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>
          Thank you! Your publication fee has been received. Our editorial team will proceed with
          formatting and publishing your article. You will receive a confirmation email shortly.
        </p>
        <a
          href="/"
          style={{
            display: "inline-block",
            padding: "12px 28px",
            background: "#0a1628",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Return to Homepage
        </a>
      </div>
    </section>
  );
}
