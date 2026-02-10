import ArticleClient from "./ArticleClient";

export const dynamicParams = false;

export async function generateStaticParams() {
  return [];
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  return <ArticleClient slug={params.slug} />;
}
