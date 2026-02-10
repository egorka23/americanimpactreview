# American Impact Review - Setup Guide

## Requirements
- Node.js 18+ (https://nodejs.org)
- npm (comes with Node.js)
- Firebase account (https://firebase.google.com)

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Firebase
1. Go to https://console.firebase.google.com
2. Create a new project (or use existing)
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database**
5. Go to Project Settings → General → Your apps → Add Web App
6. Copy the config values

### 3. Configure environment
Create a file named `.env.local` in the root folder with:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Replace the values with your Firebase config.

### 4. Run the development server
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 5. Build for production
```bash
npm run build
npm run start
```

## Deploy to Vercel
1. Push code to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Add environment variables (same as `.env.local`)
5. Deploy

## Project Structure
- `app/` - Next.js pages and routes
- `components/` - Reusable React components
- `lib/` - Firebase config and utilities
- `public/` - Static assets

## Support
For questions, contact the project maintainer.
