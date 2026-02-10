import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";
import Script from "next/script";

export const metadata: Metadata = {
  title: "American Impact Review",
  description: "Share expertise and publish impactful stories."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="scroll-backdrop" aria-hidden="true" />
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
        <Script src="/editorial/assets/js/jquery.min.js" strategy="beforeInteractive" />
        <Script src="/editorial/assets/js/browser.min.js" strategy="afterInteractive" />
        <Script src="/editorial/assets/js/breakpoints.min.js" strategy="afterInteractive" />
        <Script src="/editorial/assets/js/util.js" strategy="afterInteractive" />
        <Script src="/editorial/assets/js/main.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
