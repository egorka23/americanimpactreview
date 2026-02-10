"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase";
import { useRef, useState } from "react";

export function EditorialHeader() {
  const { user, profile, isAdmin } = useAuth();
  const router = useRouter();

  const [activeMenu, setActiveMenu] = useState<"journal" | "about" | "explore" | null>(null);
  const closeTimer = useRef<number | null>(null);

  const handleSignOut = async () => {
    await signOut(auth);
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

  return (
    <header id="header" className="slim-header">
      <Link href="/" className="logo" style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
        <Image
          src="/logo-mark.png"
          alt="American Impact Review"
          width={52}
          height={52}
          style={{ height: 52, width: 52 }}
        />
        <span style={{ fontSize: "1.35rem", letterSpacing: "-0.02em" }}>
          <strong>American Impact</strong> Review
        </span>
      </Link>
      <div className="slim-header-actions">
        <div className="topbar-hover" aria-label="Site sections">
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
      </div>
    </header>
  );
}
