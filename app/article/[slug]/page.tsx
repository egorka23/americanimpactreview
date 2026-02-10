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

  return {
    title: article.title,
    description,
    openGraph: {
      title: article.title,
      description,
      type: "article",
      images: article.imageUrl ? [{ url: article.imageUrl }] : undefined,
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
