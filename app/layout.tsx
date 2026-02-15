import type { Metadata } from "next";
import Script from "next/script";
import {
  Inter,
  Source_Serif_4,
  Montserrat,
  Roboto_Slab,
  Source_Sans_3,
  Open_Sans,
} from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";
import JsonLd from "./JsonLd";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-source-serif",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-montserrat",
});

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-roboto-slab",
});

const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-source-sans",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-open-sans",
});

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
    <html lang="en" className={`${inter.variable} ${sourceSerif4.variable} ${montserrat.variable} ${robotoSlab.variable} ${sourceSans3.variable} ${openSans.variable}`}>
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}
      <body>
        <JsonLd />
        <div className="scroll-backdrop" aria-hidden="true" />
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
