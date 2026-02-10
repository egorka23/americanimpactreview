# American Impact Review

Minimal MVP built with Next.js (App Router), Tailwind CSS, and Firebase.

## Features
- Email/password auth (Firebase Auth)
- User profiles with name, field of expertise, bio
- Write and publish articles
- Public article pages with shareable URLs
- Explore page with recent articles

## Firestore data model

`users` collection
- `uid` (string, doc id)
- `username` (string)
- `name` (string)
- `field` (string)
- `bio` (string)
- `createdAt` (timestamp)

`articles` collection
- `title` (string)
- `content` (string)
- `slug` (string)
- `authorId` (string)
- `authorUsername` (string)
- `category` (string)
- `imageUrl` (string)
- `createdAt` (timestamp)

## Local setup
1. Create a Firebase project and enable Email/Password auth.
2. Create a Firestore database in production or test mode.
3. Copy `.env.local.example` to `.env.local` and fill in your Firebase config.
4. Install dependencies:
   - `npm install`
5. Run the dev server:
   - `npm run dev`

## Seed demo data
- Visit `/seed` in your browser to create 10 sample articles and 5 profiles.

## Notes
- The app uses client-side Firebase SDK calls for simplicity.
- `@/lib/firestore.ts` is the main data access layer.
