import { notFound } from "next/navigation";
import { getAllSlugs, getArticleBySlug } from "@/lib/articles";
import ArticleClient from "./ArticleClient";
import type { Metadata } from "next";

/**
 * Extract individual reference strings from raw markdown content.
 * Looks for content after the "## References" heading, where each
 * reference is a numbered line like "1. Author (Year). Title..."
 */
function extractReferences(content: string): string[] {
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
      // Stop if we hit another heading
      if (/^#{1,3}\s+/.test(trimmed)) {
        break;
      }
      // Skip empty lines
      if (!trimmed) continue;
      // Collect numbered reference lines, stripping the leading number
      if (/^\d+\.\s+/.test(trimmed)) {
        refLines.push(trimmed.replace(/^\d+\.\s*/, ""));
      }
    }
  }

  return refLines;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const article = getArticleBySlug(params.slug);
  if (!article) return {};

  const description = article.abstract
    ? article.abstract.slice(0, 160).trim()
    : article.content.slice(0, 160).replace(/[#*\n]+/g, " ").trim();

  const authors = article.authors && article.authors.length
    ? article.authors
    : [article.authorUsername];

  const publishedDate = article.publishedAt ?? article.createdAt;
  const citationDate = publishedDate
    ? `${publishedDate.getFullYear()}/${String(publishedDate.getMonth() + 1).padStart(2, "0")}/${String(publishedDate.getDate()).padStart(2, "0")}`
    : undefined;

  const references = extractReferences(article.content);

  return {
    title: article.title,
    description,
    alternates: {
      canonical: `https://americanimpactreview.com/article/${params.slug}`,
    },
    openGraph: {
      title: article.title,
      description,
      type: "article",
      images: article.imageUrl ? [{ url: article.imageUrl }] : undefined,
    },
    twitter: {
      card: "summary",
      title: article.title,
      description,
    },
    other: {
      "citation_title": article.title,
      ...(citationDate ? { "citation_publication_date": citationDate } : {}),
      "citation_journal_title": "American Impact Review",
      "citation_journal_abbrev": "Am. Impact Rev.",
      "citation_volume": "1",
      "citation_issue": "1",
      "citation_firstpage": String(parseInt((article.id || params.slug).replace(/\D/g, "").slice(-3)) || 1),
      "citation_lastpage": String(parseInt((article.id || params.slug).replace(/\D/g, "").slice(-3)) || 1),
      ...(article.doi ? { "citation_doi": article.doi } : {}),
      "citation_language": "en",
      "citation_publisher": "Global Talent Foundation",
      "citation_article_type": "Research Article",
      "citation_pdf_url": `https://americanimpactreview.com/articles/${params.slug}.pdf`,
      "citation_fulltext_html_url": `https://americanimpactreview.com/article/${params.slug}`,
      "citation_abstract_html_url": `https://americanimpactreview.com/article/${params.slug}`,
      ...(article.abstract ? { "citation_abstract": article.abstract } : {}),
      ...(article.keywords?.length ? { "citation_keywords": article.keywords.join(", ") } : {}),
      ...(references.length ? { "citation_reference": references } : {}),
      "dc.identifier": article.doi || params.slug,
    },
  };
}

/**
 * Server component that renders citation_author + citation_author_institution
 * meta tags in the correct alternating order (PLOS ONE pattern).
 */
function ScholarAuthorMeta({ authors, affiliations }: { authors: string[]; affiliations: string[] }) {
  const tags: React.ReactNode[] = [];
  for (let i = 0; i < authors.length; i++) {
    tags.push(
      <meta key={`author-${i}`} name="citation_author" content={authors[i]} />
    );
    if (affiliations[i]) {
      tags.push(
        <meta key={`affil-${i}`} name="citation_author_institution" content={affiliations[i]} />
      );
    }
  }
  return <>{tags}</>;
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  const authors = article.authors && article.authors.length
    ? article.authors
    : [article.authorUsername];
  const affiliations = article.affiliations ?? [];

  const serialized = {
    ...article,
    publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
    createdAt: article.createdAt ? article.createdAt.toISOString() : null,
    receivedAt: article.receivedAt ? article.receivedAt.toISOString() : null,
    acceptedAt: article.acceptedAt ? article.acceptedAt.toISOString() : null,
  };

  return (
    <>
      <ScholarAuthorMeta authors={authors} affiliations={affiliations} />
      <ArticleClient article={serialized} />
    </>
  );
}
