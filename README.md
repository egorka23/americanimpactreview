# American Impact Review — Journal Platform

Academic journal publishing platform for [American Impact Review](https://americanimpactreview.com).

**Publisher:** Global Talent Foundation 501(c)(3)

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Firebase** (Auth, Firestore, Storage)
- **Tailwind CSS**
- **Tiptap** rich-text editor with Word import (Mammoth)

## Features

- Email/password authentication
- User profiles (name, field, bio, photo)
- Article submission with rich-text editor
- Word document (.docx) import
- Submission → Review → Publish workflow
- Admin dashboard for editorial management
- Public article pages with SEO-friendly slugs
- Search & filter (keywords, categories, authors)
- PDF export
- Seed data for development

## Firestore Collections

| Collection | Purpose |
|---|---|
| `users` | Author profiles |
| `articles` | Published articles |
| `submissions` | Article submissions (workflow states) |
| `admins` | Admin access control |
| `reviewer_inquiries` | Reviewer signup requests |

## Local Setup

1. Clone and install:
   ```bash
   git clone https://github.com/egorka23/americanimpactreview-app.git
   cd americanimpactreview-app
   npm install
   ```

2. Copy `.env.local.example` to `.env.local` and fill in Firebase config.

3. Run dev server:
   ```bash
   npm run dev
   ```

4. Visit `/seed` to populate demo data.

## Deploy

Vercel (auto-deploy on push to `main`).

## Related

- [americanimpactreview.com](https://americanimpactreview.com) — static landing site ([repo](https://github.com/egorka23/americanimpactreview))
