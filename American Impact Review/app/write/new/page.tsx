"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import mammoth from "mammoth";
import { useAuth } from "@/components/AuthProvider";
import { createSubmission, getArticleBySlug } from "@/lib/firestore";
import { createSlug } from "@/lib/slug";

const USCIS_SECTIONS = [
  "Abstract",
  "Introduction",
  "Background / Early Career",
  "Major Projects / Contributions",
  "Patents / Publications / Awards",
  "Media Coverage / Recognition",
  "Impact Analysis",
  "Future Directions",
  "References"
];

const USCIS_TEMPLATE = USCIS_SECTIONS.map(
  (section) => `## ${section}\n\n[Write here]\n`
).join("\n");

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "are",
  "was",
  "were",
  "has",
  "have",
  "had",
  "but",
  "not",
  "you",
  "your",
  "about",
  "their",
  "they",
  "them",
  "its",
  "our",
  "over",
  "under",
  "using",
  "use",
  "via",
  "such",
  "also",
  "more",
  "most",
  "less",
  "than",
  "then",
  "these",
  "those",
  "can",
  "will",
  "may",
  "might",
  "should",
  "could",
  "into",
  "across",
  "between",
  "based",
  "within",
  "while",
  "each",
  "other",
  "first",
  "second",
  "third"
]);

function buildKeywords(input: { title: string; content: string; category: string; author: string }) {
  const text = `${input.title} ${input.category} ${input.author} ${input.content}`;
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
  const unique = Array.from(new Set(tokens));
  return unique.slice(0, 20);
}

async function createUniqueSlug(title: string) {
  const baseSlug = createSlug(title);
  let slug = baseSlug;
  const existing = await getArticleBySlug(slug);
  if (!existing) return slug;
  const suffix = Math.random().toString(36).slice(2, 6);
  slug = `${baseSlug}-${suffix}`;
  return slug;
}

function textToHtml(text: string) {
  return text
    .split(/\n\n+/)
    .map((paragraph) => `<p>${paragraph.trim()}</p>`)
    .join("");
}

function WriteEditorContent() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"type" | "paste" | "upload">("type");
  const [pasteText, setPasteText] = useState("");
  const [enforceUscis, setEnforceUscis] = useState(true);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [insertTemplate, setInsertTemplate] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editorTextState, setEditorTextState] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [extraImages, setExtraImages] = useState("");
  const [articleType, setArticleType] = useState("");
  const [abstractText, setAbstractText] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [authorsInput, setAuthorsInput] = useState("");
  const [affiliationsInput, setAffiliationsInput] = useState("");
  const [correspondingName, setCorrespondingName] = useState("");
  const [correspondingEmail, setCorrespondingEmail] = useState("");
  const [orcidsInput, setOrcidsInput] = useState("");
  const [dataAvailability, setDataAvailability] = useState("");
  const [ethicsStatement, setEthicsStatement] = useState("");
  const [authorContributions, setAuthorContributions] = useState("");
  const [acknowledgments, setAcknowledgments] = useState("");
  const [funding, setFunding] = useState("");
  const [competingInterests, setCompetingInterests] = useState("");
  const [licenseText, setLicenseText] = useState("CC BY 4.0");
  const [openAccess, setOpenAccess] = useState(true);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [pendingPayload, setPendingPayload] = useState<{
    title: string;
    category: string;
    imageUrl: string;
    extraImages: string;
    content: string;
    articleType: string;
    abstractText: string;
    keywordsInput: string;
    authorsInput: string;
    affiliationsInput: string;
    correspondingName: string;
    correspondingEmail: string;
    orcidsInput: string;
    dataAvailability: string;
    ethicsStatement: string;
    authorContributions: string;
    acknowledgments: string;
    funding: string;
    competingInterests: string;
    licenseText: string;
    openAccess: boolean;
  } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] }
      }),
      Placeholder.configure({
        placeholder: "Start writing your USCIS-ready article here."
      })
    ],
    content: "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setEditorTextState(editor.getText({ blockSeparator: "\n\n" }));
    }
  });

  const editorText = editorTextState || editor?.getText({ blockSeparator: "\n\n" }) || "";
  const wordCount = useMemo(() => {
    const words = editorText.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }, [editorText]);
  const pageEstimate = Math.max(1, Math.round(wordCount / 500));

  const sectionStatus = useMemo(() => {
    const lower = editorText.toLowerCase();
    return USCIS_SECTIONS.map((section) =>
      lower.includes(section.toLowerCase())
    );
  }, [editorText]);

  const sectionWordCounts = useMemo(() => {
    const text = editorText.toLowerCase();
    if (!text.trim()) return USCIS_SECTIONS.map(() => 0);

    const normalize = (value: string) =>
      value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const normalizedSections = USCIS_SECTIONS.map((s) => normalize(s));

    const markers = normalizedSections
      .map((section, index) => ({
        section,
        index,
        pos: text.indexOf(section)
      }))
      .filter((item) => item.pos >= 0)
      .sort((a, b) => a.pos - b.pos);

    const counts = new Array(USCIS_SECTIONS.length).fill(0);

    if (markers.length === 0) {
      return counts;
    }

    markers.forEach((marker, idx) => {
      const start = marker.pos + marker.section.length;
      const end = idx < markers.length - 1 ? markers[idx + 1].pos : text.length;
      const slice = text.slice(start, end);
      const words = slice.trim().split(/\s+/).filter(Boolean).length;
      counts[marker.index] = words;
    });

    return counts;
  }, [editorText]);

  const minTotalWords = 1200;
  const missingSections = USCIS_SECTIONS.filter((_, index) => !sectionStatus[index]);
  const isComplete =
    sectionStatus.every(Boolean) &&
    wordCount >= minTotalWords &&
    sectionWordCounts.filter((count) => count > 0).every((count) => count >= 60);

  const completion = Math.round(
    (sectionStatus.filter(Boolean).length / USCIS_SECTIONS.length) * 100
  );

  useEffect(() => {
    if (!editor) return;
    editor.commands.focus();
  }, [editor]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/write/new");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!editor) return;
    const template = searchParams.get("template");
    const mode = searchParams.get("mode");
    const draft = searchParams.get("draft");
    const autofill = searchParams.get("autofill");
    if (draft) {
      setDraftId(draft);
    }
    if (template === "1") {
      setInsertTemplate(true);
    }
    if (mode === "paste" || mode === "upload" || mode === "type") {
      setTab(mode);
    }
    if (mode === "upload" && autofill === "1") {
      const pending = sessionStorage.getItem("tim_pending_upload");
      if (pending) {
        try {
          const parsed = JSON.parse(pending);
          const binary = atob(parsed.base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
          }
          const buffer = bytes.buffer;
          mammoth.convertToHtml({ arrayBuffer: buffer }).then((result) => {
            editor.commands.setContent(result.value || "<p></p>");
            setTab("type");
          });
          sessionStorage.removeItem("tim_pending_upload");
        } catch (err) {
          sessionStorage.removeItem("tim_pending_upload");
        }
      }
    }
  }, [editor, searchParams]);

  useEffect(() => {
    if (!editor || !user || draftLoaded) return;
    const draftKey = `tim_drafts_${user.uid}`;
    let draftToLoad = draftId;
    if (!draftToLoad) {
      const newId = Math.random().toString(36).slice(2, 10);
      draftToLoad = newId;
      setDraftId(newId);
      router.replace(`/write/new?draft=${newId}`);
    }
    const raw = localStorage.getItem(draftKey);
    const items = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(items) ? items : [];
    const existing = list.find((item: any) => item.id === draftToLoad);
    if (existing) {
      if (typeof existing.title === "string") setTitle(existing.title);
      if (typeof existing.category === "string") setCategory(existing.category);
      if (typeof existing.imageUrl === "string") setImageUrl(existing.imageUrl);
      if (typeof existing.extraImages === "string") setExtraImages(existing.extraImages);
      if (typeof existing.content === "string" && existing.content.trim()) {
        editor.commands.setContent(textToHtml(existing.content));
        setEditorTextState(existing.content);
      }
    } else {
      list.unshift({
        id: draftToLoad,
        title: "Untitled draft",
        content: "",
        imageUrl: "",
        category: "",
        extraImages: "",
        updatedAt: new Date().toISOString()
      });
      localStorage.setItem(draftKey, JSON.stringify(list));
    }
    setDraftLoaded(true);
  }, [editor, user, draftLoaded, draftId, router]);

  useEffect(() => {
    if (!user || !draftLoaded || !draftId) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      const draftKey = `tim_drafts_${user.uid}`;
      const raw = localStorage.getItem(draftKey);
      const items = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(items) ? items : [];
      const next = list.map((item: any) =>
        item.id === draftId
          ? {
              ...item,
              title,
              category,
              imageUrl,
              extraImages,
              content: editorText,
              updatedAt: new Date().toISOString()
            }
          : item
      );
      localStorage.setItem(draftKey, JSON.stringify(next));
    }, 800);
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [user, draftLoaded, draftId, title, category, imageUrl, extraImages, editorText]);

  useEffect(() => {
    if (!editor || !insertTemplate) return;
    editor.commands.setContent(textToHtml(USCIS_TEMPLATE));
    setInsertTemplate(false);
  }, [editor, insertTemplate]);

  const handleInsertTemplate = () => {
    if (!editor) return;
    editor.commands.setContent(textToHtml(USCIS_TEMPLATE));
  };

  const handlePasteApply = () => {
    if (!editor) return;
    if (!pasteText.trim()) return;
    editor.commands.setContent(textToHtml(pasteText));
    setTab("type");
  };

  const handleUpload = async (file: File | null) => {
    if (!editor || !file) return;
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        styleMap: [
          "p[style-name='Heading 1'] => h2:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Title'] => h2:fresh"
        ]
      }
    );
    editor.commands.setContent(result.value || "<p></p>");
    setTab("type");
  };


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!user || !profile) {
      setError("Please log in to publish.");
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedCategory = category.trim();
    const trimmedImageUrl = imageUrl.trim();
    const trimmedExtraImages = extraImages.trim();
    const trimmedArticleType = articleType.trim();
    const trimmedAbstract = abstractText.trim();
    const trimmedKeywords = keywordsInput.trim();
    const trimmedAuthors = authorsInput.trim();
    const trimmedAffiliations = affiliationsInput.trim();
    const trimmedCorrespondingName = correspondingName.trim();
    const trimmedCorrespondingEmail = correspondingEmail.trim();
    const trimmedOrcids = orcidsInput.trim();
    const trimmedDataAvailability = dataAvailability.trim();
    const trimmedEthics = ethicsStatement.trim();
    const trimmedContributions = authorContributions.trim();
    const trimmedAcknowledgments = acknowledgments.trim();
    const trimmedFunding = funding.trim();
    const trimmedCompeting = competingInterests.trim();
    const trimmedLicense = licenseText.trim();
    const content = editorText.trim();

    if (
      !trimmedTitle ||
      !content ||
      !trimmedArticleType ||
      !trimmedAbstract ||
      !trimmedKeywords ||
      !trimmedAuthors ||
      !trimmedAffiliations ||
      !trimmedCorrespondingName ||
      !trimmedCorrespondingEmail ||
      !trimmedDataAvailability ||
      !trimmedEthics ||
      !trimmedContributions ||
      !trimmedAcknowledgments ||
      !trimmedFunding ||
      !trimmedCompeting ||
      !trimmedLicense
    ) {
      setError("All metadata fields are required before submission.");
      return;
    }
    const tooShortSections = USCIS_SECTIONS.filter(
      (_, index) => sectionWordCounts[index] > 0 && sectionWordCounts[index] < 60
    );

    if (enforceUscis && !isComplete) {
      const missingText = missingSections.length
        ? `Missing sections: ${missingSections.join(", ")}. `
        : "";
      const shortText = tooShortSections.length
        ? `Sections too short: ${tooShortSections.join(", ")}. `
        : "";
      setWarningMessage(
        `${missingText}${shortText}Total words must be at least ${minTotalWords}.`
      );
      setPendingPayload({
        title: trimmedTitle,
        category: trimmedCategory,
        imageUrl: trimmedImageUrl,
        extraImages: trimmedExtraImages,
        content,
        articleType: trimmedArticleType,
        abstractText: trimmedAbstract,
        keywordsInput: trimmedKeywords,
        authorsInput: trimmedAuthors,
        affiliationsInput: trimmedAffiliations,
        correspondingName: trimmedCorrespondingName,
        correspondingEmail: trimmedCorrespondingEmail,
        orcidsInput: trimmedOrcids,
        dataAvailability: trimmedDataAvailability,
        ethicsStatement: trimmedEthics,
        authorContributions: trimmedContributions,
        acknowledgments: trimmedAcknowledgments,
        funding: trimmedFunding,
        competingInterests: trimmedCompeting,
        licenseText: trimmedLicense,
        openAccess
      });
      setWarningOpen(true);
      setError(
        `USCIS checks failed. Make sure all sections are present, each section has at least 60 words, and total length is at least ${minTotalWords} words.`
      );
      return;
    }

    setSubmitting(true);
    try {
      await submitArticle({
        title: trimmedTitle,
        category: trimmedCategory,
        imageUrl: trimmedImageUrl,
        extraImages: trimmedExtraImages,
        content,
        articleType: trimmedArticleType,
        abstractText: trimmedAbstract,
        keywordsInput: trimmedKeywords,
        authorsInput: trimmedAuthors,
        affiliationsInput: trimmedAffiliations,
        correspondingName: trimmedCorrespondingName,
        correspondingEmail: trimmedCorrespondingEmail,
        orcidsInput: trimmedOrcids,
        dataAvailability: trimmedDataAvailability,
        ethicsStatement: trimmedEthics,
        authorContributions: trimmedContributions,
        acknowledgments: trimmedAcknowledgments,
        funding: trimmedFunding,
        competingInterests: trimmedCompeting,
        licenseText: trimmedLicense,
        openAccess
      });
    } catch (err) {
      setError("Unable to publish right now. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitArticle = async (payload: {
    title: string;
    category: string;
    imageUrl: string;
    extraImages: string;
    content: string;
    articleType: string;
    abstractText: string;
    keywordsInput: string;
    authorsInput: string;
    affiliationsInput: string;
    correspondingName: string;
    correspondingEmail: string;
    orcidsInput: string;
    dataAvailability: string;
    ethicsStatement: string;
    authorContributions: string;
    acknowledgments: string;
    funding: string;
    competingInterests: string;
    licenseText: string;
    openAccess: boolean;
  }) => {
    if (!user || !profile) return;
    const imageUrls = payload.extraImages
      ? payload.extraImages.split(",").map((url) => url.trim()).filter(Boolean)
      : [];
    const keywords = payload.keywordsInput
      .split(",")
      .map((kw) => kw.trim())
      .filter(Boolean)
      .slice(0, 20);
    const authors = payload.authorsInput
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    const affiliations = payload.affiliationsInput
      .split(",")
      .map((affil) => affil.trim())
      .filter(Boolean);
    const orcids = payload.orcidsInput
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const submissionId = await createSubmission({
      title: payload.title,
      abstract: payload.abstractText,
      content: payload.content,
      authorId: user.uid,
      authorUsername: profile.username,
      category: payload.category,
      articleType: payload.articleType,
      authors,
      correspondingAuthorName: payload.correspondingName,
      correspondingAuthorEmail: payload.correspondingEmail,
      orcids,
      imageUrl: payload.imageUrl || "https://picsum.photos/seed/talentimpact/1200/800",
      imageUrls,
      keywords,
      affiliations,
      funding: payload.funding,
      competingInterests: payload.competingInterests,
      dataAvailability: payload.dataAvailability,
      ethicsStatement: payload.ethicsStatement,
      authorContributions: payload.authorContributions,
      acknowledgments: payload.acknowledgments,
      license: payload.licenseText,
      openAccess: payload.openAccess
    });
    if (draftId) {
      const draftKey = `tim_drafts_${user.uid}`;
      const raw = localStorage.getItem(draftKey);
      const items = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(items) ? items : [];
      const next = list.filter((item: any) => item.id !== draftId);
      localStorage.setItem(draftKey, JSON.stringify(next));
    }
    router.push(`/submit?submitted=${submissionId}`);
  };

  const handlePublishAnyway = async () => {
    if (!pendingPayload) {
      setWarningOpen(false);
      return;
    }
    setWarningOpen(false);
    setSubmitting(true);
    try {
      await submitArticle(pendingPayload);
    } catch (err) {
      setError("Unable to publish right now. Try again.");
    } finally {
      setSubmitting(false);
      setPendingPayload(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-600">Loading...</p>;
  }

  if (!user) {
    return <p className="text-sm text-slate-600">Redirecting to login...</p>;
  }

  return (
    <section>
      <header className="major">
        <h2>Write & publish</h2>
      </header>

      <div className="editor-layout">
        <div className="editor-main">
          <div className="editor-toolbar" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button type="button" className="button-secondary" onClick={() => router.push("/write")}>
                Back
              </button>
              <strong>USCIS Editor</strong>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => editor?.commands.undo()}
                  disabled={!editor?.can().undo()}
                  aria-label="Undo"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => editor?.commands.redo()}
                  disabled={!editor?.can().redo()}
                  aria-label="Redo"
                >
                  →
                </button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" className="button" onClick={handleInsertTemplate}>
                Insert template
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="glass" style={{ padding: "1.5rem" }}>
            <div style={{ marginBottom: "1rem" }}>
              <label className="label" htmlFor="title">
                Title
              </label>
              <input
                className="input"
                id="title"
                name="title"
                placeholder="Your article headline"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div className="glass editor-surface" style={{ padding: "1rem", marginBottom: "1rem" }}>
              <EditorContent editor={editor} />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label className="label" htmlFor="category">
                Category
              </label>
              <input
                className="input"
                id="category"
                name="category"
                placeholder="AI, Engineering, Medicine..."
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              />
            </div>

            <div className="card settings-card" style={{ marginBottom: "1rem" }}>
              <h3>Journal metadata (required)</h3>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label" htmlFor="articleType">
                  Article type
                </label>
                <input
                  className="input"
                  id="articleType"
                  name="articleType"
                  placeholder="Research Article, Review, Case Study..."
                  value={articleType}
                  onChange={(event) => setArticleType(event.target.value)}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label" htmlFor="abstract">
                  Abstract
                </label>
                <textarea
                  className="input"
                  id="abstract"
                  name="abstract"
                  rows={5}
                  placeholder="Structured abstract (background, methods, results, conclusions)."
                  value={abstractText}
                  onChange={(event) => setAbstractText(event.target.value)}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label" htmlFor="keywords">
                  Keywords (comma-separated)
                </label>
                <input
                  className="input"
                  id="keywords"
                  name="keywords"
                  placeholder="impact analysis, clinical diagnostics, data governance"
                  value={keywordsInput}
                  onChange={(event) => setKeywordsInput(event.target.value)}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label" htmlFor="authors">
                  Authors (comma-separated full names)
                </label>
                <input
                  className="input"
                  id="authors"
                  name="authors"
                  placeholder="Dr. Jane Smith, Prof. Omar Patel"
                  value={authorsInput}
                  onChange={(event) => setAuthorsInput(event.target.value)}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label" htmlFor="affiliations">
                  Affiliations (comma-separated)
                </label>
                <input
                  className="input"
                  id="affiliations"
                  name="affiliations"
                  placeholder="University of X, Institute of Y"
                  value={affiliationsInput}
                  onChange={(event) => setAffiliationsInput(event.target.value)}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label" htmlFor="correspondingName">
                  Corresponding author name
                </label>
                <input
                  className="input"
                  id="correspondingName"
                  name="correspondingName"
                  placeholder="Dr. Jane Smith"
                  value={correspondingName}
                  onChange={(event) => setCorrespondingName(event.target.value)}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label" htmlFor="correspondingEmail">
                  Corresponding author email
                </label>
                <input
                  className="input"
                  id="correspondingEmail"
                  name="correspondingEmail"
                  type="email"
                  placeholder="jane@university.edu"
                  value={correspondingEmail}
                  onChange={(event) => setCorrespondingEmail(event.target.value)}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label" htmlFor="orcids">
                  ORCID(s) (comma-separated)
                </label>
                <input
                  className="input"
                  id="orcids"
                  name="orcids"
                  placeholder="0000-0002-1825-0097"
                  value={orcidsInput}
                  onChange={(event) => setOrcidsInput(event.target.value)}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label" htmlFor="dataAvailability">
                  Data availability statement
                </label>
                <textarea
                  className="input"
                  id="dataAvailability"
                  name="dataAvailability"
                  rows={3}
                  placeholder="Where and how the data can be accessed."
                  value={dataAvailability}
                  onChange={(event) => setDataAvailability(event.target.value)}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label" htmlFor="ethicsStatement">
                  Ethics statement
                </label>
                <textarea
                  className="input"
                  id="ethicsStatement"
                  name="ethicsStatement"
                  rows={3}
                  placeholder="IRB approvals, consent procedures, or exemption."
                  value={ethicsStatement}
                  onChange={(event) => setEthicsStatement(event.target.value)}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label" htmlFor="authorContributions">
                  Author contributions
                </label>
                <textarea
                  className="input"
                  id="authorContributions"
                  name="authorContributions"
                  rows={3}
                  placeholder="Conceptualization, methodology, analysis, writing, review."
                  value={authorContributions}
                  onChange={(event) => setAuthorContributions(event.target.value)}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label" htmlFor="acknowledgments">
                  Acknowledgments
                </label>
                <textarea
                  className="input"
                  id="acknowledgments"
                  name="acknowledgments"
                  rows={2}
                  placeholder="Teams, labs, or contributors to recognize."
                  value={acknowledgments}
                  onChange={(event) => setAcknowledgments(event.target.value)}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label" htmlFor="funding">
                  Funding statement
                </label>
                <textarea
                  className="input"
                  id="funding"
                  name="funding"
                  rows={2}
                  placeholder="Grant numbers, sponsors, institutional funding."
                  value={funding}
                  onChange={(event) => setFunding(event.target.value)}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label" htmlFor="competingInterests">
                  Competing interests
                </label>
                <textarea
                  className="input"
                  id="competingInterests"
                  name="competingInterests"
                  rows={2}
                  placeholder="Disclosures or 'None declared'."
                  value={competingInterests}
                  onChange={(event) => setCompetingInterests(event.target.value)}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label" htmlFor="licenseText">
                  License
                </label>
                <input
                  className="input"
                  id="licenseText"
                  name="licenseText"
                  placeholder="CC BY 4.0"
                  value={licenseText}
                  onChange={(event) => setLicenseText(event.target.value)}
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={openAccess}
                  onChange={(event) => setOpenAccess(event.target.checked)}
                />
                Open access
              </label>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label className="label" htmlFor="imageUrl">
                Cover image URL
              </label>
              <input
                className="input"
                id="imageUrl"
                name="imageUrl"
                placeholder="https://..."
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
              />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label className="label" htmlFor="imageUrls">
                Additional image URLs (comma-separated)
              </label>
              <input
                className="input"
                id="imageUrls"
                name="imageUrls"
                placeholder="https://..., https://..."
                value={extraImages}
                onChange={(event) => setExtraImages(event.target.value)}
              />
            </div>

            {error ? <p style={{ color: "#b91c1c", marginBottom: "1rem" }}>{error}</p> : null}

            <ul className="actions">
              <li>
                    <button className="button" type="submit" disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit for review"}
                    </button>
                  </li>
                </ul>
              </form>
        </div>

        <aside className={`editor-sidebar ${sidebarOpen ? "" : "collapsed"}`}>
          <div className="editor-toolbar" style={{ justifyContent: "space-between" }}>
            <strong>Requirements</strong>
            <button
              type="button"
              className="button-secondary"
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              {sidebarOpen ? "Collapse" : "Expand"}
            </button>
          </div>
          {sidebarOpen ? (
            <>
              <div className="editor-stats" style={{ marginTop: "1rem" }}>
                <div>
                  <strong>Word Count</strong>
                  <div>{wordCount}</div>
                </div>
                <div>
                  <strong>Estimated Pages</strong>
                  <div>{pageEstimate}</div>
                </div>
                <div>
                  <strong>Section Completion</strong>
                  <div>{completion}%</div>
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem" }}>
                <input
                  type="checkbox"
                  checked={enforceUscis}
                  onChange={(event) => setEnforceUscis(event.target.checked)}
                />
                Enforce USCIS checklist
              </label>
              <div style={{ marginTop: "0.75rem" }} className="progress-track">
                <div className="progress-bar" style={{ width: `${completion}%` }} />
              </div>
              {enforceUscis ? (
                <>
                  <div className="editor-checklist">
                    {USCIS_SECTIONS.map((section, index) => (
                      <div key={section} className="editor-check">
                        <span>{sectionStatus[index] ? "✅" : "⚠️"}</span>
                        <span>{section}</span>
                        <span>({sectionWordCounts[index]} words)</span>
                      </div>
                    ))}
                  </div>
                  {missingSections.length > 0 ? (
                    <p style={{ marginTop: "0.75rem" }}>
                      Missing sections: {missingSections.join(", ")}.
                    </p>
                  ) : null}
                  <p style={{ marginTop: "0.75rem" }}>
                    {isComplete ? "✅ USCIS checks passed." : "⚠️ USCIS checks incomplete."}
                  </p>
                </>
              ) : null}

              {tab === "paste" ? (
                <div style={{ marginTop: "1rem" }}>
                  <strong>Paste content</strong>
                  <textarea
                    className="input"
                    rows={6}
                    placeholder="Paste your article text here"
                    value={pasteText}
                    onChange={(event) => setPasteText(event.target.value)}
                  />
                  <div style={{ marginTop: "0.75rem" }}>
                    <button type="button" className="button" onClick={handlePasteApply}>
                      Insert into editor
                    </button>
                  </div>
                </div>
              ) : null}
              {tab === "upload" ? (
                <div style={{ marginTop: "1rem" }}>
                  <strong>Upload Word</strong>
                  <input
                    type="file"
                    accept=".docx"
                    onChange={(event) => handleUpload(event.target.files?.[0] ?? null)}
                  />
                </div>
              ) : null}
            </>
          ) : null}
        </aside>
      </div>

      {warningOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50
          }}
        >
          <div className="card" style={{ maxWidth: "520px", width: "90%" }}>
            <h3 style={{ marginBottom: "0.75rem" }}>USCIS Checklist Warning</h3>
            <p style={{ marginBottom: "1rem" }}>{warningMessage}</p>
            <ul className="actions">
              <li>
                <button type="button" className="button" onClick={handlePublishAnyway}>
                  Publish anyway
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setWarningOpen(false)}
                >
                  Go back and fix
                </button>
              </li>
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function WriteEditorPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-600">Loading editor...</p>}>
      <WriteEditorContent />
    </Suspense>
  );
}
