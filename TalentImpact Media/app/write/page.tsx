"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { PDFDocument } from "pdf-lib";

export default function PublishArticlePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [fileName, setFileName] = useState<string>("No file selected");
  const [pageCount, setPageCount] = useState(5);
  const [pageSource, setPageSource] = useState<"manual" | "pdf" | "docx" | "estimate">("manual");
  const [title, setTitle] = useState("");
  const [section, setSection] = useState("Research");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const reviewRate = 120;
  const publicationRate = 80;

  const reviewCost = useMemo(() => pageCount * reviewRate, [pageCount]);
  const publicationCost = useMemo(() => pageCount * publicationRate, [pageCount]);
  const totalCost = useMemo(() => reviewCost + publicationCost, [reviewCost, publicationCost]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/write");
    }
  }, [loading, user, router]);

  useEffect(() => {
    document.body.classList.add("page-publish");
    return () => document.body.classList.remove("page-publish");
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-600">Loading...</p>;
  }

  if (!user) {
    return <p className="text-sm text-slate-600">Redirecting to login...</p>;
  }

  return (
    <section className="publish-layout">
      <aside className="publish-sidebar">
        <div className="publish-profile">
          <div className="publish-avatar">
            {(profile?.name || user.email || "U").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="publish-name">{profile?.name || "Your profile"}</div>
            <div className="publish-email">{user.email}</div>
          </div>
        </div>

        <div className="publish-nav">
          <button
            type="button"
            className="publish-nav__item"
            onClick={() => router.push("/journal")}
          >
            Upcoming publications
          </button>
          <button
            type="button"
            className="publish-nav__item"
            onClick={() =>
              router.push(profile?.username ? `/profile/${profile.username}` : "/explore")
            }
          >
            My articles
          </button>
          <button
            type="button"
            className="publish-nav__item"
            onClick={() => router.push("/settings")}
          >
            Profile settings
          </button>
        </div>

        <div className="publish-help">
          <button type="button" className="publish-help__item">Help</button>
          <button type="button" className="publish-help__item">Exit</button>
        </div>
      </aside>

      <div className="publish-main">
        <header className="publish-header">
          <h1>Publishing an article</h1>
          <p>Upload your article file. No in-site editor required.</p>
        </header>

        <div className="publish-card">
          <h2>Add an article</h2>

          <label className="publish-field">
            <span>Article Title</span>
            <input
              className="input"
              placeholder="Don’t use Caps Lock"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label className="publish-field">
            <span>Magazine section</span>
            <select className="input" value={section} onChange={(event) => setSection(event.target.value)}>
              <option>Research</option>
              <option>Industry</option>
              <option>Profiles</option>
              <option>Opinion</option>
              <option>Case studies</option>
            </select>
          </label>

          <div className="publish-upload">
            <label className="publish-upload__button">
              + File with the article
              <input
                type="file"
                accept=".docx,.doc,.rtf,.pdf"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  setUploadError(null);
                  if (!file) {
                    setFileName("No file selected");
                    return;
                  }
                  setFileName(file.name);
                  try {
                    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
                      const buffer = await file.arrayBuffer();
                      const pdf = await PDFDocument.load(buffer);
                      const pages = pdf.getPageCount();
                      setPageCount(pages || 1);
                      setPageSource("pdf");
                    } else if (file.name.toLowerCase().endsWith(".docx")) {
                      const mammoth = await import("mammoth");
                      const buffer = await file.arrayBuffer();
                      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
                      const words = result.value.trim().split(/\s+/).filter(Boolean).length;
                      const pages = Math.max(1, Math.round(words / 350));
                      setPageCount(pages);
                      setPageSource("docx");
                    } else {
                      const pages = Math.max(1, Math.round(file.size / 24000));
                      setPageCount(pages);
                      setPageSource("estimate");
                    }
                  } catch (err) {
                    setUploadError("Could not read the file to estimate page count.");
                  }
                }}
              />
            </label>
            <div className="publish-upload__meta">
              Supported files: .docx, .doc, .rtf, .pdf
              <span>{fileName}</span>
              <span className="publish-upload__hint">
                Page count: {pageCount} ({pageSource === "manual" ? "manual" : pageSource})
              </span>
            </div>
          </div>
          {uploadError ? <p className="publish-error">{uploadError}</p> : null}

          <p className="publish-note">
            Please make sure the uploaded file contains author details: full name,
            status, place of study/work, country, and city.
          </p>

          <div className="publish-row">
            <div>
              <div className="publish-row__label">Number of pages</div>
            </div>
            <div className="publish-stepper">
              <button
                type="button"
                onClick={() => {
                  setPageCount((prev) => Math.max(1, prev - 1));
                  setPageSource("manual");
                }}
              >
                –
              </button>
              <span>{pageCount}</span>
              <button
                type="button"
                onClick={() => {
                  setPageCount((prev) => prev + 1);
                  setPageSource("manual");
                }}
              >
                +
              </button>
            </div>
          </div>

          <div className="publish-row">
            <div className="publish-row__label">Estimated review cost</div>
            <div className="publish-cost">$ {reviewCost}</div>
          </div>

          <div className="publish-row">
            <div className="publish-row__label">Estimated publication cost</div>
            <div className="publish-cost">$ {publicationCost}</div>
          </div>

          <div className="publish-row">
            <div className="publish-row__label">Estimated total</div>
            <div className="publish-cost">$ {totalCost}</div>
          </div>

          <button
            className="button big publish-submit"
            type="button"
            onClick={() => {
              setUploadError(null);
              if (!title.trim()) {
                setUploadError("Please enter a title.");
                return;
              }
              if (!fileName || fileName === "No file selected") {
                setUploadError("Please upload your article file.");
                return;
              }
              const payload = {
                title: title.trim(),
                section,
                fileName,
                pageCount,
                pageSource,
                createdAt: new Date().toISOString()
              };
              localStorage.setItem("tim_submission_draft", JSON.stringify(payload));
              router.push("/checkout");
            }}
          >
            Continue to checkout
          </button>
        </div>
      </div>

      <aside className="publish-preview">
        <div className="publish-preview__card">
          <div className="publish-preview__image" />
          <div className="publish-preview__caption">Issue cover preview</div>
        </div>
      </aside>
    </section>
  );
}
