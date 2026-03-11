import { getAllPublishedArticles } from "@/lib/articles";
import HomeClient from "./HomeClient";

export const revalidate = 3600;

/** Extract unique country count from author affiliations */
function countCountries(articles: { affiliations?: string[] }[]): number {
  const COUNTRY_PATTERNS: [RegExp, string][] = [
    [/\bUS[A]?\b|\bUnited States\b|\b[A-Z]{2},\s*USA\b|\bArizona\b|\bWisconsin\b|\bHouston\b|\bNew York\b|\bAlpharetta\b|\bScottsdale\b/i, "USA"],
    [/\bRussia\b|\bMoscow\b/i, "Russia"],
    [/\bIsrael\b|\bTel Aviv\b/i, "Israel"],
    [/\bQatar\b|\bDoha\b/i, "Qatar"],
    [/\bBulgaria\b|\bSvishtov\b/i, "Bulgaria"],
    [/\bLatvia\b|\bRiga\b/i, "Latvia"],
    [/\bArmenia\b|\bYerevan\b/i, "Armenia"],
    [/\bGermany\b|\bDresden\b/i, "Germany"],
    [/\bKazakhstan\b|\bKhromtau\b/i, "Kazakhstan"],
    [/\bUnited Kingdom\b|\bLondon\b|\bCoventry\b/i, "UK"],
    [/\bIndia\b|\bPune\b|\bBangalore\b/i, "India"],
    [/\bCanada\b|\bToronto\b/i, "Canada"],
    [/\bUzbekistan\b|\bBukhara\b/i, "Uzbekistan"],
    [/\bBelarus\b|\bBelarusian\b/i, "Belarus"],
  ];

  const countries = new Set<string>();
  for (const a of articles) {
    for (const aff of a.affiliations ?? []) {
      for (const [pattern, country] of COUNTRY_PATTERNS) {
        if (pattern.test(aff)) {
          countries.add(country);
          break;
        }
      }
    }
  }
  return countries.size;
}

export default async function HomePage() {
  const allArticles = await getAllPublishedArticles();

  const sorted = [...allArticles].sort((a, b) => {
    const da = a.publishedAt?.getTime() ?? a.createdAt?.getTime() ?? 0;
    const db_ = b.publishedAt?.getTime() ?? b.createdAt?.getTime() ?? 0;
    return db_ - da;
  });

  const mapArticle = (a: (typeof sorted)[0]) => ({
    slug: a.slug,
    title: a.title,
    authors: a.authors ?? ["Unknown"],
    category: a.category,
    abstract: a.abstract || "",
    viewCount: a.viewCount ?? 0,
    downloadCount: a.downloadCount ?? 0,
    doi: a.doi || null,
    publishedAt: a.publishedAt
      ? a.publishedAt.toISOString()
      : a.createdAt
        ? a.createdAt.toISOString()
        : null,
  });

  const latest = sorted.slice(0, 6).map(mapArticle);

  // Top 3 most-read articles for hero section
  const mostRead = [...allArticles]
    .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    .slice(0, 3)
    .map(mapArticle);

  const authorCountries = countCountries(allArticles);

  return (
    <HomeClient
      articles={latest}
      mostRead={mostRead}
      totalArticles={allArticles.length}
      authorCountries={authorCountries}
    />
  );
}
