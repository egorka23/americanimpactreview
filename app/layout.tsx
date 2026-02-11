import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";
import Script from "next/script";
import JsonLd from "./JsonLd";

export const metadata: Metadata = {
  metadataBase: new URL("https://americanimpactreview.com"),
  title: {
    default: "American Impact Review",
    template: "%s | American Impact Review",
  },
  description: "American Impact Review is a peer-reviewed, open-access, multidisciplinary journal published by Global Talent Foundation, a 501(c)(3) nonprofit. Publish original research across Computer Science, Health Sciences, AI, Sports Science, Energy and more. Continuous publishing with permanent archive placement.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "American Impact Review",
    title: "American Impact Review",
    description: "A peer-reviewed, open-access, multidisciplinary journal published by Global Talent Foundation, a 501(c)(3) nonprofit. Original research in CS, Health, AI, Sports Science, Energy and more.",
    url: "https://americanimpactreview.com",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "American Impact Review" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "American Impact Review",
    description: "A peer-reviewed, open-access, multidisciplinary journal published by Global Talent Foundation. Original research across Computer Science, Health Sciences, AI, Sports Science, Energy and more.",
    images: ["/og-image.png"],
  },
  // verification: { google: "YOUR_CODE_HERE" },  // Add after GSC verification
  alternates: {
    canonical: "https://americanimpactreview.com",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <JsonLd />
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
