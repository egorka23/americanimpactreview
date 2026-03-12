# American Impact Review

## Overview
Next.js 14 academic journal site with Drizzle ORM + Turso (SQLite).
Publisher: Global Talent Foundation 501(c)(3)
Live: https://americanimpactreview.com

## Tech Stack
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Database: Turso (libsql) + Drizzle ORM
- Auth: Firebase (email/password)
- PDF export: pdf-lib (client-side)

## Project Structure
```
app/            - Next.js pages (App Router)
components/     - React components (EditorialHeader, EditorialShell, etc.)
lib/            - articles.ts, types.ts, slug.ts
lib/db/         - index.ts (Drizzle client), schema.ts (tables)
drizzle/        - SQL migrations
public/         - Static assets (logos, covers, editorial template)
```

## Key Files
- `lib/db/index.ts` — Drizzle + Turso client init (PRAGMA foreign_keys = ON)
- `lib/db/schema.ts` — users, sessions, submissions, review_assignments, reviews, reviewers
- `lib/articles.ts` — article data loader
- `app/article/[slug]/page.tsx` — article page with Google Scholar citation_* meta tags
- `app/article/[slug]/ArticleJsonLd.tsx` — ScholarlyArticle JSON-LD
- `app/sitemap.ts` — dynamic sitemap
- `app/robots.ts` — crawler rules

## Auth
Firebase Auth (email/password). AuthProvider in components.

## Article Cover Generation — CRITICAL RULES
When generating article covers (via cover prompt or manually):

1. **Site expects `.webp`**, NOT `.png`. Both `ArticleClient.tsx` and `HomeClient.tsx` load covers from `/article-covers/covers/{slug}-cover.webp`
2. After `node scripts/cover-to-png.js {slug}` generates the PNG, **always convert to webp**:
   ```
   cwebp -q 90 public/article-covers/covers/{slug}-cover.png -o public/article-covers/covers/{slug}-cover.webp
   ```
3. **Always commit BOTH** the source image, PNG, and webp:
   ```
   git add public/article-covers/ public/cover-stock.html
   ```
4. **Always push and deploy** — covers in `public/` only work on prod if committed and deployed
5. **Verify on localhost** before pushing — check `localhost:3000/article/{slug}` that cover loads

## Deploy Rules
- Auto-deploy on push to `main` via Vercel
- **Before every deploy**: run `git status` and check for untracked files in `public/` — if any assets are untracked, `git add` them first. Missing `public/` files = broken images on prod.

## Git Branches
- `main` — current application
- `static-archive` — old static HTML site (preserved for reference)

## SEO Notes
- Google Search Console connected (Feb 2026)
- ISSN: application submitted, pending
- Google Scholar: citation_* meta tags implemented, waiting for indexing (6-9 months for new journals)
