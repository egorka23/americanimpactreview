"use client";

import Image from "next/image";
import Link from "next/link";

export function NavBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/70 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight">
          <Image src="/logo.png" alt="American Impact Review logo" width={36} height={36} />
          <span>
            <span className="text-cyan-700">Talent</span>Impact Media
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/explore" className="text-slate-600 hover:text-slate-900">
            Explore
          </Link>
          <Link href="/write" className="text-slate-600 hover:text-slate-900">
            Publish
          </Link>
          <Link href="/login" className="button-secondary">
            Log in
          </Link>
          <Link href="/signup" className="button">
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
