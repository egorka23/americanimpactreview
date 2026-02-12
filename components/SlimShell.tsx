"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EditorialHeader } from "@/components/EditorialHeader";

export function SlimShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Admin panel gets full-width, no header/footer
  if (pathname?.startsWith("/admin-panel") || pathname?.startsWith("/manage")) {
    return <>{children}</>;
  }

  return (
    <div className="slim-shell">
      <EditorialHeader />
      <main className="slim-main">{children}</main>
      <footer className="air-footer">
        <div className="air-footer__inner">
          <div className="air-footer__left">
            © 2026 American Impact Review.
            <br />
            Published by Global Talent Foundation.
          </div>
          <div className="air-footer__right">
            <Link href="/about-journal">About</Link>
            <Link href="/for-authors">For Authors</Link>
            <Link href="/for-reviewers">For Reviewers</Link>
            <Link href="/publication-rules">Policies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
