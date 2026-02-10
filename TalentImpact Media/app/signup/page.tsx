"use client";

import { FormEvent, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserProfile, getUserByUsername } from "@/lib/firestore";

function SignupForm() {
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
    const username = String(formData.get("username") || "")
      .trim()
      .toLowerCase();
    const name = String(formData.get("name") || "").trim();
    const field = String(formData.get("field") || "").trim();
    const bio = String(formData.get("bio") || "").trim();

    if (!email || !password || !username || !name) {
      setError("Please complete all required fields.");
      setLoading(false);
      return;
    }

    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      setError("That username is already taken.");
      setLoading(false);
      return;
    }

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await createUserProfile({
        uid: credential.user.uid,
        username,
        name,
        field,
        bio
      });
      const next = searchParams.get("next");
      if (next && next.startsWith("/")) {
        router.push(next);
      } else {
        router.push(`/profile/${username}`);
      }
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/operation-not-allowed") {
        setError("Email/password sign-in is disabled in Firebase Auth.");
      } else if (code === "auth/email-already-in-use") {
        setError("That email is already in use.");
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.");
      } else {
        setError(`Unable to create account. ${code || "Please try again."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <header className="major">
        <h2>Create your account</h2>
      </header>
      <p>Start publishing your expertise in minutes.</p>

      <form onSubmit={handleSubmit} className="glass" style={{ padding: "1.5rem", maxWidth: "36rem" }}>
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
          <input
            className="input"
            id="password"
            name="password"
            type="password"
            minLength={6}
            required
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label className="label" htmlFor="username">
            Username
          </label>
          <input className="input" id="username" name="username" required />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input className="input" id="name" name="name" required />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label className="label" htmlFor="field">
            Field of expertise
          </label>
          <input className="input" id="field" name="field" placeholder="Product, Design, Marketing..." />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label className="label" htmlFor="bio">
            Short bio
          </label>
          <textarea className="input" id="bio" name="bio" />
        </div>

        {error ? <p style={{ color: "#b91c1c", marginBottom: "1rem" }}>{error}</p> : null}

        <ul className="actions">
          <li>
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </li>
          <li>
            <Link
              href={searchParams.get("next") ? `/login?next=${encodeURIComponent(searchParams.get("next") as string)}` : "/login"}
              className="button"
            >
              Log in
            </Link>
          </li>
        </ul>
      </form>
    </section>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <SignupForm />
    </Suspense>
  );
}
