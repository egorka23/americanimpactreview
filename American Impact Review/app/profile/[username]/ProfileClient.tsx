"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
  getUserByUsername,
  listArticlesByAuthorUsername,
  updateUserProfile
} from "@/lib/firestore";
import type { Article, UserProfile } from "@/lib/types";

export default function ProfileClient({ username }: { username: string }) {
  const { user, profile, refreshProfile } = useAuth();
  const [data, setData] = useState<UserProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const nextProfile = await getUserByUsername(username);
      setData(nextProfile);
      if (nextProfile) {
        const nextArticles = await listArticlesByAuthorUsername(nextProfile.username);
        setArticles(nextArticles);
      }
      setLoading(false);
    };

    load();
  }, [username]);

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !data) return;

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const field = String(formData.get("field") || "").trim();
    const bio = String(formData.get("bio") || "").trim();

    setSaving(true);
    await updateUserProfile(user.uid, { name, field, bio });
    setSaving(false);
    setData({ ...data, name, field, bio });
    await refreshProfile();
  };

  if (loading) {
    return <p className="text-sm text-slate-600">Loading profile...</p>;
  }

  if (!data) {
    return (
      <div className="card space-y-3">
        <h1 className="text-2xl font-semibold">Profile not found</h1>
        <Link href="/explore" className="button-secondary">
          Browse articles
        </Link>
      </div>
    );
  }

  const isOwner = user && profile?.username === data.username;

  return (
    <>
      <section>
        <header className="major">
          <h2>Profile</h2>
        </header>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <span className="image" style={{ maxWidth: "160px" }}>
            <img
              src={data.photoUrl || `https://i.pravatar.cc/160?u=${data.username}`}
              alt={data.name}
            />
          </span>
          <div>
            <h2>{data.name}</h2>
            <p style={{ marginBottom: "0.5rem" }}>@{data.username}</p>
            {data.field ? <p>{data.field}</p> : null}
            {data.bio ? <p>{data.bio}</p> : null}
          </div>
        </div>
      </section>

      {isOwner ? (
        <section>
          <header className="major">
            <h2>Edit profile</h2>
          </header>
          <form onSubmit={handleUpdate} className="glass" style={{ padding: "1.5rem", maxWidth: "36rem" }}>
            <div style={{ marginBottom: "1rem" }}>
              <label className="label" htmlFor="name">
                Name
              </label>
              <input className="input" id="name" name="name" defaultValue={data.name} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label className="label" htmlFor="field">
                Field
              </label>
              <input className="input" id="field" name="field" defaultValue={data.field} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label className="label" htmlFor="bio">
                Bio
              </label>
              <textarea className="input" id="bio" name="bio" defaultValue={data.bio} rows={4} />
            </div>
            <ul className="actions">
              <li>
                <button className="button" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </li>
            </ul>
          </form>
        </section>
      ) : null}

      <section>
        <header className="major">
          <h2>Recent articles</h2>
        </header>
        {articles.length === 0 ? (
          <p>No articles yet.</p>
        ) : (
          <div className="posts">
            {articles.map((article) => (
              <article key={article.id}>
                {article.imageUrl ? (
                  <Link href={`/article/${article.slug}`} className="image">
                    <img src={article.imageUrl} alt={article.title} />
                  </Link>
                ) : null}
                <h3>{article.title}</h3>
                {article.category ? (
                  <p style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.85rem" }}>
                    {article.category}
                  </p>
                ) : null}
                <p>{article.createdAt ? article.createdAt.toLocaleDateString() : ""}</p>
                <ul className="actions">
                  <li>
                    <Link href={`/article/${article.slug}`} className="button">
                      Read article
                    </Link>
                  </li>
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
