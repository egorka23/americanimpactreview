"use client";

import { FormEvent, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile } from "@/lib/firestore";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getUserProfile(credential.user.uid);
      const next = searchParams.get("next");
      if (next && next.startsWith("/")) {
        router.push(next);
      } else if (profile?.username) {
        router.push(`/profile/${profile.username}`);
      } else {
        router.push("/explore");
      }
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <header className="major">
        <h2>Welcome back</h2>
      </header>
      <p>Log in to publish and manage your articles.</p>

      <form onSubmit={handleSubmit} className="glass" style={{ padding: "1.5rem", maxWidth: "32rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input className="input" id="password" name="password" type="password" required />
        </div>

        {error ? <p style={{ color: "#b91c1c", marginBottom: "1rem" }}>{error}</p> : null}

        <ul className="actions">
          <li>
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Log in"}
            </button>
          </li>
          <li>
            <Link
              href={searchParams.get("next") ? `/signup?next=${encodeURIComponent(searchParams.get("next") as string)}` : "/signup"}
              className="button"
            >
              Create account
            </Link>
          </li>
        </ul>
      </form>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <LoginForm />
    </Suspense>
  );
}
