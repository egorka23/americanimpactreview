import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://americanimpactreview.com"),
  title: {
    default: "American Impact Review",
    template: "%s | American Impact Review",
  },
  description: "A peer-reviewed, open-access, multidisciplinary journal. Publish original research with permanent archive placement.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "American Impact Review",
    title: "American Impact Review",
    description: "A peer-reviewed, open-access, multidisciplinary journal published by Global Talent Foundation.",
    url: "https://americanimpactreview.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "American Impact Review",
    description: "A peer-reviewed, open-access, multidisciplinary journal.",
  },
  alternates: {},
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
