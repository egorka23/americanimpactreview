"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

export function NavBar() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

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
          {user ? (
            <>
              {profile?.username ? (
                <Link
                  href={`/profile/${profile.username}`}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Profile
                </Link>
              ) : null}
              <button onClick={handleSignOut} className="button-secondary">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="button-secondary">
                Log in
              </Link>
              <Link href="/signup" className="button">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
