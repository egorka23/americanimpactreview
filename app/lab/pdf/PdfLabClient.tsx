"use client";

import { useMemo, useState } from "react";

type CompileResponse = {
  ok: boolean;
  pdfBase64?: string;
  logText?: string;
  bundleBase64?: string | null;
  markdownText?: string | null;
  userFriendlyMessage?: string;
};

export default function PdfLabClient() {
  const [file, setFile] = useState<File | null>(null);
  const [token, setToken] = useState("");
  const [meta, setMeta] = useState({
    title: "",
    authors: "",
    doi: "",
    received: "",
    accepted: "",
    published: "",
  });
  const [debug, setDebug] = useState(false);
  const [imageOptions, setImageOptions] = useState({
    forcePage: false,
    fitToPage: true,
    maxHeight: "0.85",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logText, setLogText] = useState("");
  const [markdownText, setMarkdownText] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [bundleUrl, setBundleUrl] = useState<string | null>(null);

  const fileHint = useMemo(() => {
    if (!file) return "Upload a .md, .docx, or .zip bundle (main.md + images folder).";
    return `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  }, [file]);

  const handleSubmit = async () => {
    setError("");
    setLogText("");
    setMarkdownText(null);
    setPdfUrl(null);
    setBundleUrl(null);

    if (!file) {
      setError("Please upload a .md or .zip file.");
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", meta.title);
      form.append("authors", meta.authors);
      form.append("doi", meta.doi);
      form.append("received", meta.received);
      form.append("accepted", meta.accepted);
      form.append("published", meta.published);
      form.append("debug", debug ? "true" : "false");
      form.append("imageForcePage", imageOptions.forcePage ? "true" : "false");
      form.append("imageFit", imageOptions.fitToPage ? "true" : "false");
      form.append("imageMaxHeight", imageOptions.maxHeight);
      if (token) form.append("token", token);

      const res = await fetch("/api/lab/latex/compile", { method: "POST", body: form });
      const data = (await res.json()) as CompileResponse;

      if (!res.ok || !data.ok) {
        setError(data.userFriendlyMessage || data.logText || "Compilation failed.");
        setLogText(data.logText || "");
        return;
      }

      if (data.pdfBase64) {
        const pdfBlob = new Blob([Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0))], { type: "application/pdf" });
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
      }

      if (data.bundleBase64) {
        const bundleBlob = new Blob([Uint8Array.from(atob(data.bundleBase64), (c) => c.charCodeAt(0))], { type: "application/zip" });
        const url = URL.createObjectURL(bundleBlob);
        setBundleUrl(url);
      }

      setLogText(data.logText || "");
      setMarkdownText(data.markdownText || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ padding: "2.5rem 1.5rem", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>PDF Lab (LaTeX Sandbox)</h1>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
        This sandbox compiles Markdown into a LaTeX PDF using Docker. It does not touch production publishing.
      </p>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "1.5rem", background: "#ffffff" }}>
        <label style={{ fontWeight: 600 }}>Upload Markdown / DOCX / Bundle</label>
        <input
          type="file"
          accept=".md,.docx,.zip"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ display: "block", marginTop: "0.5rem" }}
        />
        <p style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "0.5rem" }}>{fileHint}</p>
        <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.25rem" }}>
          Images: `.docx` embeds are supported; `.md` requires a `.zip` bundle with an `images/` folder.
        </p>

        <div style={{ display: "grid", gap: "0.75rem", marginTop: "1.5rem" }}>
          <input
            type="text"
            placeholder="Title (optional)"
            value={meta.title}
            onChange={(e) => setMeta((prev) => ({ ...prev, title: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Authors (comma-separated, optional)"
            value={meta.authors}
            onChange={(e) => setMeta((prev) => ({ ...prev, authors: e.target.value }))}
          />
          <input
            type="text"
            placeholder="DOI (optional)"
            value={meta.doi}
            onChange={(e) => setMeta((prev) => ({ ...prev, doi: e.target.value }))}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <input
              type="text"
              placeholder="Received"
              value={meta.received}
              onChange={(e) => setMeta((prev) => ({ ...prev, received: e.target.value }))}
            />
            <input
              type="text"
              placeholder="Accepted"
              value={meta.accepted}
              onChange={(e) => setMeta((prev) => ({ ...prev, accepted: e.target.value }))}
            />
            <input
              type="text"
              placeholder="Published"
              value={meta.published}
              onChange={(e) => setMeta((prev) => ({ ...prev, published: e.target.value }))}
            />
          </div>
          <input
            type="password"
            placeholder="PDF Lab token (optional)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setDebug((prev) => !prev)}
              aria-pressed={debug}
              style={{
                padding: "0.4rem 0.75rem",
                borderRadius: 999,
                border: "1px solid #d1d5db",
                background: debug ? "#111827" : "#ffffff",
                color: debug ? "#ffffff" : "#111827",
                cursor: "pointer",
              }}
            >
              {debug ? "Debug bundle: ON" : "Debug bundle: OFF"}
            </button>
            <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>Include debug bundle.zip</span>
          </div>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "0.75rem", background: "#f9fafb" }}>
            <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Image handling</div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input
                type="checkbox"
                checked={imageOptions.forcePage}
                onChange={(e) => setImageOptions((prev) => ({ ...prev, forcePage: e.target.checked }))}
              />
              Force each image onto its own page
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input
                type="checkbox"
                checked={imageOptions.fitToPage}
                onChange={(e) => setImageOptions((prev) => ({ ...prev, fitToPage: e.target.checked }))}
              />
              Fit images to page height
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              Max image height
              <select
                value={imageOptions.maxHeight}
                onChange={(e) => setImageOptions((prev) => ({ ...prev, maxHeight: e.target.value }))}
              >
                <option value="0.5">0.5 × text height</option>
                <option value="0.6">0.6 × text height</option>
                <option value="0.7">0.7 × text height</option>
                <option value="0.8">0.8 × text height</option>
                <option value="0.85">0.85 × text height</option>
                <option value="0.9">0.9 × text height</option>
              </select>
            </label>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            marginTop: "1.5rem",
            background: "#111827",
            color: "#fff",
            padding: "0.75rem 1.5rem",
            borderRadius: 8,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
      {loading ? "Compiling..." : "Generate PDF"}
        </button>

        {error ? (
          <div style={{ marginTop: "1rem", color: "#b91c1c", fontWeight: 500 }}>{error}</div>
        ) : null}
      </div>

      <div style={{ marginTop: "2rem", display: "grid", gap: "1.5rem" }}>
        {pdfUrl ? (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "1rem", background: "#ffffff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>PDF Output</strong>
              <a href={pdfUrl} download="air-lab.pdf">Download PDF</a>
            </div>
            <iframe title="PDF preview" src={pdfUrl} style={{ width: "100%", height: 480, border: "none", marginTop: "1rem" }} />
          </div>
        ) : null}

        {bundleUrl ? (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "1rem", background: "#ffffff" }}>
            <strong>Debug bundle</strong>
            <div>
              <a href={bundleUrl} download="bundle.zip">Download bundle.zip</a>
            </div>
          </div>
        ) : null}

        <details style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "1rem", background: "#ffffff" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>Compile logs</summary>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem", marginTop: "0.75rem" }}>{logText || "No logs yet."}</pre>
        </details>

        {markdownText ? (
          <details style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "1rem", background: "#ffffff" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Converted Markdown</summary>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem", marginTop: "0.75rem" }}>{markdownText}</pre>
          </details>
        ) : null}
      </div>
    </section>
  );
}
