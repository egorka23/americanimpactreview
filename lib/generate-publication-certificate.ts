export interface PublicationCertificateData {
  title: string;
  authors?: string;
  /** Single author name for individual certificate */
  authorName?: string;
  receivedDate?: string;
  publishedDate?: string;
  doi?: string;
  issn?: string;
}

/**
 * Generate certificate PDF via server-side Puppeteer API.
 * Returns PDF bytes.
 */
export async function generatePublicationCertificate(
  data: PublicationCertificateData
): Promise<Uint8Array> {
  const res = await fetch("/api/local-admin/generate-certificate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      title: data.title,
      authorName: data.authorName || data.authors || "Unknown",
      receivedDate: data.receivedDate,
      publishedDate: data.publishedDate,
      doi: data.doi,
      issn: data.issn,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Certificate generation failed: ${res.status}`);
  }

  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}
