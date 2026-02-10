"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { updateUserProfile } from "@/lib/firestore";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function SettingsPage() {
  const { user, profile, loading, refreshProfile, isAdmin } = useAuth();
  const [name, setName] = useState("");
  const [field, setField] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    if (!profile) return;
    setName(profile.name || "");
    setField(profile.field || "");
    setBio(profile.bio || "");
    setPhotoUrl(profile.photoUrl || "");
  }, [profile]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("tim_theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }
  }, []);

  const applyTheme = (next: "light" | "dark") => {
    setTheme(next);
    localStorage.setItem("tim_theme", next);
    document.documentElement.classList.toggle("theme-dark", next === "dark");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await updateUserProfile(user.uid, {
        name: name.trim(),
        field: field.trim(),
        bio: bio.trim(),
        photoUrl: photoUrl.trim()
      });
      await refreshProfile();
      setSaved(true);
    } catch (err) {
      setError("Unable to save settings right now.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-600">Loading...</p>;
  }

  if (!user) {
    return (
      <div className="card space-y-3">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-slate-600">
          Log in to manage your account settings.
        </p>
        <div className="flex gap-3">
          <Link href="/login" className="button-secondary">
            Log in
          </Link>
          <Link href="/signup" className="button">
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section>
      <header className="major">
        <h2>Settings</h2>
      </header>
      <div className="settings-grid">
        <div className="card settings-card">
          <h3 className="text-xl font-semibold">Profile</h3>
          <p className="text-sm text-slate-600">
            Update your public profile details.
          </p>
          <div className="settings-form">
            <div className="settings-avatar">
              <img
                src={photoUrl || `https://i.pravatar.cc/160?u=${profile?.username}`}
                alt={profile?.name || profile?.username || "Profile"}
              />
              <div>
                <label className="label">Profile photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file || !user) return;
                    setUploading(true);
                    setError(null);
                    try {
                      const fileRef = ref(storage, `avatars/${user.uid}/${Date.now()}-${file.name}`);
                      await uploadBytes(fileRef, file);
                      const url = await getDownloadURL(fileRef);
                      setPhotoUrl(url);
                      await updateUserProfile(user.uid, { photoUrl: url });
                      await refreshProfile();
                      setSaved(true);
                    } catch (err) {
                      setError("Unable to upload photo right now.");
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
                {uploading ? <p className="text-sm text-slate-500">Uploading...</p> : null}
              </div>
            </div>
            <label className="label" htmlFor="name">
              Name
            </label>
            <input
              className="input"
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <label className="label" htmlFor="field">
              Field of expertise
            </label>
            <input
              className="input"
              id="field"
              value={field}
              onChange={(event) => setField(event.target.value)}
            />
            <label className="label" htmlFor="bio">
              Short bio
            </label>
            <textarea
              className="input"
              id="bio"
              rows={4}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {saved ? <p className="text-sm text-emerald-600">Saved.</p> : null}
            <button className="button" type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        <div className="card settings-card">
          <h3 className="text-xl font-semibold">Appearance</h3>
          <p className="text-sm text-slate-600">Choose your theme.</p>
          <div className="theme-toggle">
            <button
              type="button"
              className={theme === "light" ? "button" : "button-secondary"}
              onClick={() => applyTheme("light")}
            >
              Light mode
            </button>
            <button
              type="button"
              className={theme === "dark" ? "button" : "button-secondary"}
              onClick={() => applyTheme("dark")}
            >
              Dark mode
            </button>
          </div>
          <div className="settings-meta">
            <div>
              <strong>Username:</strong> {profile?.username || "—"}
            </div>
            <div>
              <strong>Email:</strong> {user.email}
            </div>
          </div>
        </div>

        <div className="card settings-card">
          <h3 className="text-xl font-semibold">Admin access</h3>
          <p className="text-sm text-slate-600">
            Use this UID in Firestore to grant admin access.
          </p>
          <div className="settings-meta">
            <div>
              <strong>Your UID:</strong> {user.uid}
            </div>
            <div>
              <strong>Admin status:</strong> {isAdmin ? "Enabled" : "Not enabled"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
