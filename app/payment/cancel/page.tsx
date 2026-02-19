import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Cancelled | American Impact Review",
};

export default function PaymentCancelPage() {
  return (
    <section className="checkout-layout" style={{ justifyContent: "center", minHeight: "60vh" }}>
      <div className="checkout-card" style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>&#x2715;</div>
        <h1 style={{ fontSize: "1.5rem", marginBottom: 8 }}>Payment Cancelled</h1>
        <p style={{ color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>
          Your payment was not completed. If you would like to try again, please use the payment
          link from your email. If you have questions, contact us at{" "}
          <a href="mailto:egor@americanimpactreview.com" style={{ color: "#1e3a5f" }}>
            egor@americanimpactreview.com
          </a>.
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
