# American Impact Review

## Overview
Next.js 14 journal platform with Firebase backend.
Publisher: Global Talent Foundation 501(c)(3)
Live: https://americanimpactreview.com

## Tech Stack
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Firebase: Auth, Firestore, Storage
- Tiptap editor + Mammoth (Word import) + pdf-lib (PDF export)

## Project Structure
```
app/            - Next.js pages (App Router)
components/     - React components (AuthProvider, AdminGate, NavBar, etc.)
lib/            - Firebase config, Firestore operations, types
scripts/        - Seed scripts for development data
articles/       - Markdown article content (seed data)
public/         - Static assets (logos, covers, editorial template)
```

## Firebase Project
- Project ID: american-impact-review
- Console: https://console.firebase.google.com/project/american-impact-review
- Collections: users, articles, submissions, admins, reviewer_inquiries

## Deploy
Auto-deploy on push to `main` via Vercel.

## Git Branches
- `main` — Next.js application (current)
- `static-archive` — old static HTML site (preserved for reference)
