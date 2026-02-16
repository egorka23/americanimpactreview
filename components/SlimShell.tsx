"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EditorialHeader } from "@/components/EditorialHeader";

export function SlimShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Admin panel gets full-width, no header/footer
  if (pathname?.startsWith("/manage")) {
    return <>{children}</>;
  }

  return (
    <div className="slim-shell">
      <EditorialHeader />
      <main className="slim-main">{children}</main>
      <footer className="air-footer">
        <div className="air-footer__inner">
          {/* 3-column grid */}
          <div className="air-footer__grid">
            {/* Col 1: Brand */}
            <div className="air-footer__brand">
              <div className="air-footer__name">American Impact Review</div>
              <div className="air-footer__tagline">
                Peer-reviewed, open-access<br />multidisciplinary journal
              </div>
              <div className="air-footer__publisher">
                Published by <strong>Global Talent Foundation</strong>
                <br />a 501(c)(3) nonprofit
              </div>
            </div>

            {/* Col 2: Navigate */}
            <nav className="air-footer__nav">
              <div className="air-footer__nav-label">Navigate</div>
              <Link href="/about-journal">About</Link>
              <Link href="/for-authors">For Authors</Link>
              <Link href="/for-reviewers">For Reviewers</Link>
              <Link href="/publication-rules">Policies</Link>
              <Link href="/explore">Archive</Link>
            </nav>

            {/* Col 3: Legal & Contact */}
            <div className="air-footer__legal-col">
              <div className="air-footer__nav-label">Legal &amp; Contact</div>
              <Link href="/privacy-policy">Privacy Policy</Link>
              <Link href="/policies">Publication Ethics</Link>
              <Link href="/contact">Contact Us</Link>
              <div className="air-footer__social">
                <a
                  href="https://www.linkedin.com/company/american-impact-review"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="air-footer__social-link"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="air-footer__bar">
            <div className="air-footer__license">
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="air-footer__cc-badge"
                aria-label="Creative Commons Attribution 4.0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.98 0C5.37 0 0 5.37 0 11.98s5.37 11.98 11.98 11.98 11.98-5.37 11.98-11.98S18.59 0 11.98 0zM5.99 12.47c0-3.31 2.69-5.99 5.99-5.99 1.93 0 3.65.91 4.75 2.33l-1.43 1.07c-.79-1.05-2.04-1.72-3.42-1.72-2.37 0-4.3 1.93-4.3 4.3s1.93 4.3 4.3 4.3c1.39 0 2.63-.66 3.42-1.7l1.43 1.08c-1.1 1.4-2.82 2.31-4.75 2.31-3.3.01-5.99-2.68-5.99-5.98z"/>
                </svg>
              </a>
              <span>
                <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> · Open Access
              </span>
            </div>
            <span className="air-footer__verify">
              EIN: 33-2266959 ·{" "}
              <a
                href="https://apps.irs.gov/app/eos/detailsPage?ein=332266959&name=Global%20Talent%20Foundation%20Inc&city=Middleton&state=WI&countryAbbr=US&dba=&type=determinationLetters&orgTags=&searchTypeAdvanced="
                target="_blank"
                rel="noopener noreferrer"
              >
                Verify on IRS.gov
              </a>
            </span>
            <span className="air-footer__copy">© 2026 American Impact Review</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
