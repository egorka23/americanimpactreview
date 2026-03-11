import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";
import { CookieConsent } from "@/components/CookieConsent";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import JsonLd from "./JsonLd";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim();
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim();
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID?.trim();
const LINKEDIN_PID = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID?.trim();

const inter = localFont({
  src: [
    { path: "../public/fonts/Inter-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Inter-Italic.ttf", weight: "400", style: "italic" },
    { path: "../public/fonts/Inter-SemiBold.ttf", weight: "600", style: "normal" },
  ],
  display: "swap",
  variable: "--font-inter",
});

const sourceSerif4 = localFont({
  src: [{ path: "../public/fonts/PlayfairDisplay-SemiBold.ttf", weight: "600", style: "normal" }],
  display: "swap",
  variable: "--font-source-serif",
});

const montserrat = localFont({
  src: [
    { path: "../public/fonts/Inter-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Inter-SemiBold.ttf", weight: "600", style: "normal" },
  ],
  display: "swap",
  variable: "--font-montserrat",
});

const robotoSlab = localFont({
  src: [{ path: "../public/fonts/Inter-Regular.ttf", weight: "400", style: "normal" }],
  display: "swap",
  variable: "--font-roboto-slab",
});

const sourceSans3 = localFont({
  src: [{ path: "../public/fonts/Inter-Regular.ttf", weight: "400", style: "normal" }],
  display: "swap",
  variable: "--font-source-sans",
});


export const metadata: Metadata = {
  metadataBase: new URL("https://americanimpactreview.com"),
  title: {
    default: "American Impact Review",
    template: "%s | American Impact Review",
  },
  description: "American Impact Review is a peer-reviewed, open-access, multidisciplinary journal by Global Talent Foundation (501(c)(3) nonprofit). DOI prefix 10.66308 via Crossref. Publish original research in CS, Health, AI, Sports Science and more.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
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
    description: "American Impact Review is a peer-reviewed, open-access, multidisciplinary journal by Global Talent Foundation (501(c)(3) nonprofit). DOI prefix 10.66308 via Crossref. Publish original research in CS, Health, AI, Sports Science and more.",
    url: "https://americanimpactreview.com",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "American Impact Review" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "American Impact Review",
    description: "American Impact Review is a peer-reviewed, open-access, multidisciplinary journal by Global Talent Foundation (501(c)(3) nonprofit). DOI prefix 10.66308 via Crossref. Publish original research in CS, Health, AI, Sports Science and more.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://americanimpactreview.com",
  },
  other: {
    "ahrefs-site-verification": "aa8d6f9bbcfe0b8c2a7ee0d7fa1fa9381bc795821b190b39f5089799aa34d8b2",
    "algolia-site-verification": "DEDDD92A6297B480",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif4.variable} ${montserrat.variable} ${robotoSlab.variable} ${sourceSans3.variable}`}>
      {/* Google Consent Mode v2 default — must load BEFORE gtag */}
      <Script id="consent-defaults" strategy="beforeInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{analytics_storage:'granted',ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',wait_for_update:500});`}
      </Script>
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:true});${ADS_ID ? `gtag('config','${ADS_ID}');` : ''}`}
          </Script>
        </>
      )}
      {/* Microsoft Clarity */}
      {CLARITY_ID && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${CLARITY_ID}");`}
        </Script>
      )}
      {/* LinkedIn Insight Tag */}
      {LINKEDIN_PID && (
        <Script id="linkedin-insight" strategy="afterInteractive">
          {`_linkedin_partner_id="${LINKEDIN_PID}";window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push(_linkedin_partner_id);(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];var b=document.createElement("script");b.type="text/javascript";b.async=true;b.src="https://snap.licdn.com/li.ltr-js/insight.min.js";s.parentNode.insertBefore(b,s);})(window.lintrk);`}
        </Script>
      )}
      <body>
        <JsonLd />
        <div className="scroll-backdrop" aria-hidden="true" />
        <AuthProvider>
          <AppShell>{children}</AppShell>
          <CookieConsent />
          <Analytics />
          <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  );
}
