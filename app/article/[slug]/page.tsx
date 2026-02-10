import { notFound } from "next/navigation";
import { getAllSlugs, getArticleBySlug } from "@/lib/articles";
import ArticleClient from "./ArticleClient";
import type { Metadata } from "next";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const article = getArticleBySlug(params.slug);
  if (!article) return {};

  const description = article.content.slice(0, 160).replace(/[#*\n]+/g, " ").trim();

  const authors = article.authors && article.authors.length
    ? article.authors
    : [article.authorUsername];

  const publishedDate = article.publishedAt ?? article.createdAt;
  const citationDate = publishedDate
    ? `${publishedDate.getFullYear()}/${String(publishedDate.getMonth() + 1).padStart(2, "0")}/${String(publishedDate.getDate()).padStart(2, "0")}`
    : undefined;

  return {
    title: article.title,
    description,
    openGraph: {
      title: article.title,
      description,
      type: "article",
      images: article.imageUrl ? [{ url: article.imageUrl }] : undefined,
    },
    other: {
      "citation_title": article.title,
      "citation_author": authors.length === 1 ? authors[0] : authors,
      ...(citationDate ? { "citation_publication_date": citationDate } : {}),
      "citation_journal_title": "American Impact Review",
      "citation_journal_abbrev": "Am. Impact Rev.",
      "citation_volume": "1",
      "citation_issue": "1",
      "citation_firstpage": article.id || params.slug,
      ...(article.doi ? { "citation_doi": article.doi } : {}),
      "citation_language": "en",
      "citation_publisher": "Global Talent Foundation",
      "citation_issn": "PENDING",
      "citation_fulltext_html_url": `https://americanimpactreview.com/article/${params.slug}`,
    },
  };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  const serialized = {
    ...article,
    publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
    createdAt: article.createdAt ? article.createdAt.toISOString() : null,
    receivedAt: article.receivedAt ? article.receivedAt.toISOString() : null,
    acceptedAt: article.acceptedAt ? article.acceptedAt.toISOString() : null,
  };

  return <ArticleClient article={serialized} />;
}
