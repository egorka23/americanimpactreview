# American Impact Review

## Overview
Next.js 14 static journal site. No database — articles from Markdown (SSG).
Publisher: Global Talent Foundation 501(c)(3)
Live: https://americanimpactreview.com

## Tech Stack
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Articles: static Markdown files in `/articles/` → SSG at build time
- PDF export: pdf-lib (client-side)

## Project Structure
```
app/            - Next.js pages (App Router)
components/     - React components (EditorialHeader, EditorialShell, etc.)
lib/            - articles.ts (MD loader), types.ts, slug.ts
articles/       - 20 Markdown articles (source of truth)
public/         - Static assets (logos, covers, editorial template)
```

## Key Files
- `lib/articles.ts` — reads .md files, parses title/author/date/category
- `app/explore/page.tsx` — server component, loads all articles
- `app/explore/ExploreClient.tsx` — client search/filter
- `app/article/[slug]/page.tsx` — SSG with generateStaticParams
- `app/article/[slug]/ArticleClient.tsx` — article view + PDF download

## Auth
Currently stubbed out (AuthProvider returns null). Auth pages show "coming soon".

## Deploy
Auto-deploy on push to `main` via Vercel.

## Git Branches
- `main` — current application
- `static-archive` — old static HTML site (preserved for reference)
