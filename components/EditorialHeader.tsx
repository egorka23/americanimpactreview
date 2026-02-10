"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase";
import { useRef, useState, useEffect } from "react";

export function EditorialHeader() {
  const { user, profile, isAdmin } = useAuth();
  const router = useRouter();

  const [activeMenu, setActiveMenu] = useState<"journal" | "about" | "explore" | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const handleSignOut = async () => {
    await signOut(auth);
    setMobileOpen(false);
    router.push("/");
  };

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
    }, 120);
  };

  // Lock body scroll when mobile menu is open
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
          <svg width="36" height="36" viewBox="0 0 38 38" fill="none" aria-hidden="true">
            <circle cx="19" cy="19" r="17" stroke="#c0b8a8" strokeWidth="1" fill="none"/>
            <circle cx="19" cy="19" r="11" stroke="#8a7e6e" strokeWidth="1" fill="none"/>
            <circle cx="19" cy="19" r="6" stroke="#b5432a" strokeWidth="1.2" fill="none"/>
            <circle cx="19" cy="19" r="2.2" fill="#b5432a"/>
          </svg>
          <span style={{
            display: "flex",
            flexDirection: "column",
          }}>
            <span style={{
              fontFamily: "'Source Serif 4', serif",
              fontSize: "1.45rem",
              fontWeight: 700,
              color: "#1a3a5c",
              lineHeight: 1,
              letterSpacing: "0.01em",
            }}>
              American Impact Review
            </span>
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.55rem",
              fontWeight: 400,
              color: "#8a7e6e",
              letterSpacing: "0.18em",
              textTransform: "uppercase" as const,
              marginTop: "4px",
            }}>
              Published by Global Talent Foundation
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
                  <Link href="/getting-started">Getting Started</Link>
                  <Link href="/publication-rules">Submission Guidelines</Link>
                  <Link href="/journal">What We Publish</Link>
                  <Link href="/submit">Submit Now</Link>
                  {isAdmin ? <Link href="/admin">Admin</Link> : null}
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
                  <Link href="/about-journal">About the Journal</Link>
                  <Link href="/editorial-board">Editorial Board</Link>
                  <Link href="/pricing">Pricing</Link>
                  <Link href="/for-authors">For Authors</Link>
                  <Link href="/for-reviewers">For Reviewers</Link>
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
                  <Link href="/explore">Explore</Link>
                  <Link href="/archive">Archive</Link>
                  {profile?.username ? (
                    <Link href={`/profile/${profile.username}`}>Profile</Link>
                  ) : null}
                  <Link href="/write">Publish</Link>
                </div>
                <div className="topbar-group">
                  <span className="topbar-title">Account</span>
                  {user ? (
                    <button type="button" onClick={handleSignOut} className="topbar-action">
                      Sign out
                    </button>
                  ) : (
                    <>
                      <Link href="/login">Log in</Link>
                      <Link href="/signup">Sign up</Link>
                    </>
                  )}
                </div>
              </div>
            </div>
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

      {/* Mobile overlay + drawer — outside header to avoid stacking context issues */}
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
          {isAdmin ? <Link href="/admin" onClick={() => setMobileOpen(false)}>Admin</Link> : null}
        </div>
        <div className="mobile-drawer-section">
          <span className="mobile-drawer-title">About</span>
          <Link href="/about-journal" onClick={() => setMobileOpen(false)}>About the Journal</Link>
          <Link href="/editorial-board" onClick={() => setMobileOpen(false)}>Editorial Board</Link>
          <Link href="/pricing" onClick={() => setMobileOpen(false)}>Pricing</Link>
          <Link href="/for-authors" onClick={() => setMobileOpen(false)}>For Authors</Link>
          <Link href="/for-reviewers" onClick={() => setMobileOpen(false)}>For Reviewers</Link>
        </div>
        <div className="mobile-drawer-section">
          <span className="mobile-drawer-title">Explore</span>
          <Link href="/explore" onClick={() => setMobileOpen(false)}>Explore</Link>
          <Link href="/archive" onClick={() => setMobileOpen(false)}>Archive</Link>
          {profile?.username ? (
            <Link href={`/profile/${profile.username}`} onClick={() => setMobileOpen(false)}>Profile</Link>
          ) : null}
          <Link href="/write" onClick={() => setMobileOpen(false)}>Publish</Link>
        </div>
        <div className="mobile-drawer-section">
          <span className="mobile-drawer-title">Account</span>
          {user ? (
            <button type="button" onClick={handleSignOut} className="topbar-action">
              Sign out
            </button>
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
