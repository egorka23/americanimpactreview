import Link from "next/link";

const pages = {
  indexing: {
    href: "/indexing",
    title: "Indexing & Recognition",
    desc: "See where we're indexed and why it matters for your research",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  editorial: {
    href: "/editorial-board",
    title: "Editorial Board",
    desc: "Meet the scholars behind our peer review process",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  authors: {
    href: "/for-authors",
    title: "For Authors",
    desc: "Ready to submit? See our process and timeline",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
};

type PageKey = keyof typeof pages;

export default function TriangleNav({ current }: { current: PageKey }) {
  const others = (Object.keys(pages) as PageKey[]).filter((k) => k !== current);

  return (
    <section className="triangle-nav">
      <div className="triangle-nav__label">Continue exploring</div>
      <div className="triangle-nav__cards">
        {others.map((key) => {
          const p = pages[key];
          return (
            <Link key={key} href={p.href} className="triangle-nav__card">
              <div className="triangle-nav__icon">{p.icon}</div>
              <div className="triangle-nav__text">
                <div className="triangle-nav__title">{p.title}</div>
                <div className="triangle-nav__desc">{p.desc}</div>
              </div>
              <svg className="triangle-nav__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
