export type ReviewerCertificateData = {
  reviewerName: string;
  expertise: string;
  reviewCount: number;
  periodFrom: string;
  periodTo: string;
  issuedDate?: string;
};

/**
 * Generate reviewer certificate PDF via server-side Puppeteer API.
 * Returns PDF bytes.
 */
export async function generateReviewerCertificate(
  data: ReviewerCertificateData
): Promise<Uint8Array> {
  const res = await fetch("/api/local-admin/generate-reviewer-certificate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Reviewer certificate generation failed: ${res.status}`);
  }

  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}
