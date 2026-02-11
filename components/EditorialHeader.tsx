"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "next-auth/react";

export function EditorialHeader() {
  const { user, loading } = useAuth();
  const [activeMenu, setActiveMenu] = useState<"journal" | "about" | "explore" | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const handleMenuEnter = (menu: "journal" | "about" | "explore") => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setActiveMenu(menu);
  };

  const handleMenuLeave = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
    }
    closeTimer.current = window.setTimeout(() => {
      setActiveMenu(null);
    }, 80);
  };

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <header id="header" className="slim-header">
        <Link href="/" className="logo" style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <svg className="header-logo-svg" width="36" height="36" viewBox="0 0 38 38" fill="none" aria-hidden="true">
            <circle cx="19" cy="19" r="17" stroke="#c0b8a8" strokeWidth="1" fill="none"/>
            <circle cx="19" cy="19" r="11" stroke="#8a7e6e" strokeWidth="1" fill="none"/>
            <circle cx="19" cy="19" r="6" stroke="#b5432a" strokeWidth="1.2" fill="none"/>
            <circle cx="19" cy="19" r="2.2" fill="#b5432a"/>
          </svg>
          <span className="header-logo-label">
            <span className="header-logo-name">
              American Impact Review
            </span>
            <span className="header-logo-tagline">
              A Peer-Reviewed Multidisciplinary Journal
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="slim-header-actions desktop-nav" aria-label="Main navigation">
          <div className="topbar-hover">
            <div
              className={`topbar-group-wrap ${activeMenu === "journal" ? "is-open" : ""}`}
              onMouseEnter={() => handleMenuEnter("journal")}
              onMouseLeave={handleMenuLeave}
              onFocus={() => handleMenuEnter("journal")}
              onBlur={handleMenuLeave}
            >
              <div className="topbar-hover-area" tabIndex={0}>
                Journal
              </div>
              <div className="topbar-panel topbar-panel--journal">
                <div className="topbar-group">
                  <span className="topbar-title">Journal</span>
                  <Link href="/getting-started">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    Getting Started
                  </Link>
                  <Link href="/publication-rules">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                    Submission Guidelines
                  </Link>
                  <Link href="/journal">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    What We Publish
                  </Link>
                  <Link href="/submit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Submit Now
                  </Link>
                </div>
              </div>
            </div>

            <div
              className={`topbar-group-wrap ${activeMenu === "about" ? "is-open" : ""}`}
              onMouseEnter={() => handleMenuEnter("about")}
              onMouseLeave={handleMenuLeave}
              onFocus={() => handleMenuEnter("about")}
              onBlur={handleMenuLeave}
            >
              <div className="topbar-hover-area" tabIndex={0}>
                About
              </div>
              <div className="topbar-panel topbar-panel--about">
                <div className="topbar-group">
                  <span className="topbar-title">About</span>
                  <Link href="/about-journal">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    About the Journal
                  </Link>
                  <Link href="/editorial-board">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Editorial Board
                  </Link>
                  <Link href="/pricing">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Pricing
                  </Link>
                  <Link href="/for-authors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    For Authors
                  </Link>
                  <Link href="/for-reviewers">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    For Reviewers
                  </Link>
                  <Link href="/policies">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Ethics &amp; Policies
                  </Link>
                  <Link href="/contact">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Contact
                  </Link>
                </div>
              </div>
            </div>

            <div
              className={`topbar-group-wrap ${activeMenu === "explore" ? "is-open" : ""}`}
              onMouseEnter={() => handleMenuEnter("explore")}
              onMouseLeave={handleMenuLeave}
              onFocus={() => handleMenuEnter("explore")}
              onBlur={handleMenuLeave}
            >
              <div className="topbar-hover-area" tabIndex={0}>
                Explore
              </div>
              <div className="topbar-panel topbar-panel--explore">
                <div className="topbar-group">
                  <span className="topbar-title">Explore</span>
                  <Link href="/explore">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    Browse Articles
                  </Link>
                  <Link href="/write">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Publish
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Account — separate from dropdowns */}
          <div className="topbar-account">
            {!loading && user ? (
              <>
                <span className="topbar-account__name">{user.name || user.email}</span>
                <button
                  className="topbar-account__signout"
                  onClick={() => signOut()}
                >
                  Sign out
                </button>
              </>
            ) : !loading ? (
              <Link href="/login" className="topbar-account__login">Log in</Link>
              <Link href="/signup" className="topbar-account__signup">Sign up</Link>
            ) : null}
          </div>
        </nav>

        {/* Mobile burger button */}
        <button
          type="button"
          className="mobile-burger"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span className={`burger-line ${mobileOpen ? "open" : ""}`} />
          <span className={`burger-line ${mobileOpen ? "open" : ""}`} />
          <span className={`burger-line ${mobileOpen ? "open" : ""}`} />
        </button>
      </header>

      {/* Mobile overlay + drawer */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}
      <nav className={`mobile-drawer ${mobileOpen ? "is-open" : ""}`}>
        <div className="mobile-drawer-section">
          <span className="mobile-drawer-title">Journal</span>
          <Link href="/getting-started" onClick={() => setMobileOpen(false)}>Getting Started</Link>
          <Link href="/publication-rules" onClick={() => setMobileOpen(false)}>Submission Guidelines</Link>
          <Link href="/journal" onClick={() => setMobileOpen(false)}>What We Publish</Link>
          <Link href="/submit" onClick={() => setMobileOpen(false)}>Submit Now</Link>
        </div>
        <div className="mobile-drawer-section">
          <span className="mobile-drawer-title">About</span>
          <Link href="/about-journal" onClick={() => setMobileOpen(false)}>About the Journal</Link>
          <Link href="/editorial-board" onClick={() => setMobileOpen(false)}>Editorial Board</Link>
          <Link href="/pricing" onClick={() => setMobileOpen(false)}>Pricing</Link>
          <Link href="/for-authors" onClick={() => setMobileOpen(false)}>For Authors</Link>
          <Link href="/for-reviewers" onClick={() => setMobileOpen(false)}>For Reviewers</Link>
          <Link href="/policies" onClick={() => setMobileOpen(false)}>Ethics &amp; Policies</Link>
          <Link href="/contact" onClick={() => setMobileOpen(false)}>Contact</Link>
        </div>
        <div className="mobile-drawer-section">
          <span className="mobile-drawer-title">Explore</span>
          <Link href="/explore" onClick={() => setMobileOpen(false)}>Browse Articles</Link>
          <Link href="/write" onClick={() => setMobileOpen(false)}>Publish</Link>
        </div>
        <div className="mobile-drawer-section">
          <span className="mobile-drawer-title">Account</span>
          {user ? (
            <>
              <span style={{ fontSize: "0.9rem", color: "#1a3a5c", fontWeight: 500 }}>
                {user.name || user.email}
              </span>
              <button
                onClick={() => { setMobileOpen(false); signOut(); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#b5432a", padding: 0, textAlign: "left", font: "inherit" }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)}>Log in</Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)}>Sign up</Link>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
