import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getAllPublishedArticles, getPublishedArticleBySlug } from "@/lib/articles";
import ArticleClient from "./ArticleClient";
import ArticleJsonLd from "./ArticleJsonLd";
import { verifyAdminToken } from "@/lib/local-admin";
import type { Metadata } from "next";

/**
 * Extract individual reference strings from article content.
 * Supports both markdown (## References) and HTML (<section class="plos-references">).
 */
function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/^[\s↑]+/, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractReferences(content: string): string[] {
  // 1. Try HTML: find References section (h1, h2, or <strong>References</strong>)
  const htmlMatch = content.match(/<(?:h[12])>\s*References\s*<\/(?:h[12])>([\s\S]*?)(?:<h[12]>|$)/)
    || content.match(/<strong>\s*References\s*<\/strong>\s*<\/p>([\s\S]*?)(?:<h[12]>|<strong>|$)/);
  if (htmlMatch) {
    const refsBlock = htmlMatch[1];
    // Try <li> items first
    const liMatches = refsBlock.match(/<li[^>]*>([\s\S]*?)<\/li>/g);
    if (liMatches && liMatches.length > 0) {
      return liMatches.map((li) => stripHtml(li)).filter(Boolean);
    }
    // Fallback: <p> items containing references (numbered or plain)
    const pMatches = refsBlock.match(/<p>([\s\S]*?)<\/p>/g);
    if (pMatches && pMatches.length > 0) {
      return pMatches.map((p) => {
        let text = stripHtml(p);
        // Strip leading number prefix (e.g. "1. ", "[1] ")
        text = text.replace(/^\[?\d+\]?\.?\s*/, "");
        return text;
      }).filter((t) => t.length > 10); // skip tiny fragments
    }
  }

  // 2. Fallback: markdown ## References heading
  const lines = content.split(/\r?\n/);
  let inReferences = false;
  const refLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#{1,3}\s+references/i.test(trimmed)) {
      inReferences = true;
      continue;
    }
    if (inReferences) {
      if (/^#{1,3}\s+/.test(trimmed)) break;
      if (!trimmed) continue;
      if (/^\d+\.\s+/.test(trimmed)) {
        refLines.push(trimmed.replace(/^\d+\.\s*/, ""));
      } else {
        refLines.push(trimmed);
      }
    }
  }

  return refLines;
}

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  const articles = await getAllPublishedArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

async function resolveArticle(slug: string, allowPrivate: boolean) {
  try {
    return await getPublishedArticleBySlug(slug, { allowPrivate });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const allowPrivate = verifyAdminToken(cookies().get("air_admin")?.value || "");
  const article = await resolveArticle(params.slug, allowPrivate);
  if (!article) return {};

  const description = article.abstract
    ? article.abstract.replace(/\*\*/g, "").slice(0, 160).trim()
    : article.content.slice(0, 160).replace(/[#*\n]+/g, " ").trim();

  const authors = article.authors && article.authors.length
    ? article.authors
    : [article.authorUsername];
  const affiliations = article.affiliations ?? [];
  const orcids = article.orcids ?? [];

  const publishedDate = article.publishedAt ?? article.createdAt;
  const citationDate = publishedDate
    ? `${publishedDate.getFullYear()}/${String(publishedDate.getMonth() + 1).padStart(2, "0")}/${String(publishedDate.getDate()).padStart(2, "0")}`
    : undefined;

  const references = extractReferences(article.content);

  // Build author-related meta tag arrays
  const authorInstitutions = authors.map((_, i) => affiliations[i] || affiliations[affiliations.length - 1] || "");
  const authorOrcids = authors
    .map((_, i) => orcids[i])
    .filter((o): o is string => !!o && /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(o))
    .map((o) => `https://orcid.org/${o}`);

  return {
    title: article.title,
    description,
    alternates: {
      canonical: `https://americanimpactreview.com/article/${params.slug}`,
    },
    openGraph: {
      title: article.title,
      description,
      url: `https://americanimpactreview.com/article/${params.slug}`,
      siteName: "American Impact Review",
      locale: "en_US",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
    },
    other: {
      "citation_title": article.title,
      "citation_author": authors,
      ...(authorInstitutions.some(Boolean) ? { "citation_author_institution": authorInstitutions.filter(Boolean) } : {}),
      ...(authorOrcids.length ? { "citation_author_orcid": authorOrcids } : {}),
      ...(citationDate ? { "citation_publication_date": citationDate } : {}),
      "citation_journal_title": "American Impact Review",
      "citation_journal_abbrev": "Am. Impact Rev.",
      "citation_volume": "1",
      "citation_issue": "1",
      "citation_firstpage": params.slug,
      "citation_lastpage": params.slug,
      ...(article.doi ? { "citation_doi": article.doi } : {}),
      "citation_language": "en",
      "citation_publisher": "Global Talent Foundation",
      "citation_article_type": "Research Article",
      "citation_pdf_url": `https://americanimpactreview.com/articles/${params.slug}.pdf`,
      "citation_fulltext_html_url": `https://americanimpactreview.com/article/${params.slug}`,
      "citation_abstract_html_url": `https://americanimpactreview.com/article/${params.slug}`,
      ...(article.abstract ? { "citation_abstract": article.abstract.replace(/\*\*/g, "").replace(/\r?\n/g, " ") } : {}),
      ...(article.keywords?.length ? { "citation_keywords": article.keywords.join(", ") } : {}),
      ...(references.length ? { "citation_reference": references } : {}),
      "DC.creator": authors,
      "dc.identifier": article.doi || params.slug,
      "DC.title": article.title,
      "DC.date": citationDate || "",
      "DC.publisher": "Global Talent Foundation",
      "DC.type": "Text",
      "DC.format": "text/html",
      "DC.language": "en",
      "DCTERMS.isPartOf": "American Impact Review",
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const allowPrivate = verifyAdminToken(cookies().get("air_admin")?.value || "");
  const article = await resolveArticle(params.slug, allowPrivate);
  if (!article) notFound();

  const authors = article.authors && article.authors.length
    ? article.authors
    : [article.authorUsername];
  const orcids = article.orcids ?? [];

  // Replace inline base64 data URIs with API route URLs to shrink the page
  // from ~5MB to ~150KB for articles with embedded images (e.g. e2026008, e2026013).
  let contentForClient = article.content;
  let imgCounter = 0;
  contentForClient = contentForClient.replace(
    /data:image\/[\w+.-]+;base64,[A-Za-z0-9+/=\s]+/g,
    () => `/api/article-image/${params.slug}/${imgCounter++}`,
  );

  const serialized = {
    ...article,
    content: contentForClient,
    publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
    createdAt: article.createdAt ? article.createdAt.toISOString() : null,
    receivedAt: article.receivedAt ? article.receivedAt.toISOString() : null,
    acceptedAt: article.acceptedAt ? article.acceptedAt.toISOString() : null,
    viewCount: (article as any).viewCount ?? 0,
    downloadCount: (article as any).downloadCount ?? 0,
    manuscriptUrl: (article as { manuscriptUrl?: string }).manuscriptUrl || null,
  };

  const description = article.abstract
    ? article.abstract.slice(0, 300).trim()
    : article.content.slice(0, 300).replace(/[#*\n]+/g, " ").trim();

  return (
    <>
      <ArticleJsonLd
        title={article.title}
        authors={authors}
        orcids={orcids}
        publishedAt={article.publishedAt ? article.publishedAt.toISOString() : null}
        createdAt={article.createdAt ? article.createdAt.toISOString() : null}
        receivedAt={article.receivedAt ? article.receivedAt.toISOString() : null}
        acceptedAt={article.acceptedAt ? article.acceptedAt.toISOString() : null}
        description={description}
        slug={params.slug}
        imageUrl={article.imageUrl}
        doi={article.doi}
        keywords={article.keywords}
        openAccess={(article as any).openAccess}
        license={(article as any).license}
      />
      <ArticleClient article={serialized} />
    </>
  );
}
