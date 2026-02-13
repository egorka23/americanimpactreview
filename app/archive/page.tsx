import type { Metadata } from "next";
import { getAllPublishedArticles } from "@/lib/articles";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Archive",
  description:
    "Browse the full archive of peer-reviewed articles published in American Impact Review, organized by volume and date.",
  alternates: {
    canonical: "https://americanimpactreview.com/archive",
  },
  openGraph: {
    title: "Archive",
    description:
      "Browse the full archive of peer-reviewed articles published in American Impact Review, organized by volume and date.",
    url: "https://americanimpactreview.com/archive",
  },
  twitter: {
    card: "summary_large_image",
    title: "Archive",
    description:
      "Browse the full archive of peer-reviewed articles published in American Impact Review, organized by volume and date.",
  },
};

export default async function ArchivePage() {
  const articles = await getAllPublishedArticles();
  const categories = Array.from(new Set(articles.map((a) => a.category).filter(Boolean)));

  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">Archive</div>
          <h1>Article Archive</h1>
          <p>Browse all published articles. New articles are added continuously as they are accepted.</p>
          <div className="page-meta">
            <span>Continuous Publishing</span>
            <span>Open Access</span>
            <span>CC BY 4.0</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="page-vitals">
          <div className="page-vital-card">
            <div className="val">{articles.length}</div>
            <div className="lbl">Articles Published</div>
          </div>
          <div className="page-vital-card">
            <div className="val">{categories.length}</div>
            <div className="lbl">Disciplines</div>
          </div>
          <div className="page-vital-card">
            <div className="val">1</div>
            <div className="lbl">Volume (2026)</div>
          </div>
        </div>

        <header className="major" style={{ marginTop: "2rem" }}>
          <h2>Volume 1 (2026)</h2>
        </header>
        <p style={{ marginBottom: "1.5rem", color: "#5a6a7a" }}>
          All articles published in the inaugural volume, listed by publication date.
        </p>

        <div className="posts">
          {articles.map((article) => {
            const dateStr = article.createdAt
              ? article.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
              : "";
            return (
              <article key={article.id}>
                <h3>{article.title}</h3>
                <p style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {article.category} · {dateStr}
                </p>
                <p style={{ fontSize: "0.9rem" }}>
                  By {(article.authors && article.authors[0]) || article.authorUsername}
                </p>
                <ul className="actions">
                  <li>
                    <Link className="button" href={`/article/${article.slug}`}>
                      Read article
                    </Link>
                  </li>
                </ul>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
