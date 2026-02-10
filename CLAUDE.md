# American Impact Review - Project Instructions

## Overview
Static HTML/CSS site for American Impact Review (AIR) - a multidisciplinary scholarly journal.
Publisher: Global Talent Foundation 501(c)(3)
Live: https://americanimpactreview.com

## Structure
```
/index.html          - Main homepage (McKinsey corporate style)
/style.css           - Main homepage styles
/serafim-version/    - Alternative design (TalentImpact style, Space Grotesk)
/air-journal/        - Local working copy of serafim-version
```

## Tech Stack
- Pure static HTML/CSS/JS - no build tools, no frameworks
- Fonts: Source Serif 4 + Inter + Montserrat (main), Space Grotesk (serafim-version)
- Colors: --navy #0a1628, --red #b5432a, --gold #c4a87c
- SVG logo: concentric rings (Concept 4)

## Key Design Rules
- Main site: McKinsey corporate aesthetic, serif headings, navy/red/gold palette
- Serafim-version: glass morphism cards, gradient borders, hover-lift animations
- Mobile: disable hover-lift, single-column grids, breakpoints at 900px and 640px
- Journal cover: 3D book effect with rotateY, spine, page-edge shadows

## Deploy
Auto-deploy on push to `main` via Vercel.
Manual: `npx vercel --prod --yes`

## Important
- Do NOT touch files outside this repo
- Keep air-journal/ in sync with serafim-version/
- No frameworks - keep it static HTML
