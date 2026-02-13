"use client";

import Link from "next/link";
import Script from "next/script";
import { EditorialHeader } from "@/components/EditorialHeader";
import { SidebarSearch } from "@/components/SidebarSearch";

export function EditorialShell({ children }: { children: React.ReactNode }) {
  return (
    <div id="wrapper">
      <div id="main">
        <div className="inner">
          <EditorialHeader />

          {children}
        </div>
      </div>

      <div id="sidebar">
        <div className="inner">
          <SidebarSearch />

          <nav id="menu">
            <header className="major">
              <h2>Menu</h2>
            </header>
            <ul>
              <li>
                <Link href="/">Homepage</Link>
              </li>
              <li>
                <Link href="/journal">Journal</Link>
              </li>
              <li>
                <Link href="/explore">Explore</Link>
              </li>
              <li>
                <Link href="/archive">Archive</Link>
              </li>
              <li>
                <Link href="/submit">Submit</Link>
              </li>
              <li>
                <Link href="/submit">Submit Article</Link>
              </li>
              <li>
                <Link href="/publication-rules">Publication Rules</Link>
              </li>
              <li>
                <Link href="/for-authors">For Authors</Link>
              </li>
              <li>
                <Link href="/for-reviewers">For Reviewers</Link>
              </li>
              <li>
                <Link href="/signup">Create account</Link>
              </li>
              <li>
                <Link href="/login">Login</Link>
              </li>
            </ul>
          </nav>

          <section className="sidebar-categories">
            <details open>
              <summary>Categories</summary>
              <ul className="category-list">
                {[
                  "Product Strategy",
                  "AI & Data",
                  "Design Leadership",
                  "Growth Marketing",
                  "Engineering",
                  "Operations"
                ].map((category) => (
                  <li key={category}>{category}</li>
                ))}
              </ul>
            </details>
          </section>

          <section>
            <header className="major">
              <h2>Get started</h2>
            </header>
            <p>Create a profile, publish your first article, and share it.</p>
            <ul className="actions">
              <li>
                <Link href="/explore" className="button">
                  Explore articles
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <Script src="/editorial/assets/js/jquery.min.js" strategy="afterInteractive" />
      <Script src="/editorial/assets/js/browser.min.js" strategy="afterInteractive" />
      <Script src="/editorial/assets/js/breakpoints.min.js" strategy="afterInteractive" />
      <Script src="/editorial/assets/js/util.js" strategy="afterInteractive" />
      <Script src="/editorial/assets/js/main.js" strategy="afterInteractive" />
    </div>
  );
}
