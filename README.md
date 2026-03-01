# American Impact Review

Peer-reviewed, open-access, multidisciplinary journal at [americanimpactreview.com](https://americanimpactreview.com).

**Publisher:** Global Talent Foundation 501(c)(3)

## Tech Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Static articles** from Markdown (SSG at build time)
- **pdf-lib** for client-side PDF export

## Local Setup

```bash
git clone https://github.com/egorka23/americanimpactreview.git
cd americanimpactreview
npm install
npm run dev
```

## Deploy

Auto-deploy on push to `main` via Vercel.

## PDF Lab (LaTeX)

The PDF Lab is a **sandbox** for testing LaTeX compilation in Docker. It does **not** touch the production publish flow.

### Prerequisites
- Docker installed and running
- Build the LaTeX image:
  ```bash
  docker build -t air-latex-lab:latest services/latex
  ```

### Local usage
1. Enable the lab:
   ```bash
   export PDF_LAB_ENABLED=true
   export PDF_LAB_TOKEN=your_shared_secret
   ```
2. Run the dev server:
   ```bash
   npm run dev
   ```
3. Open:
   - `http://localhost:3000/lab/pdf`

### Smoke tests
```bash
npm run latex:smoke
```

### Debugging failed compiles
- The API returns `logText` in the response.
- Enable “Debug bundle.zip” to download generated `.tex`, assets, and logs.

### Security notes
- Docker-only compilation (no host LaTeX execution).
- `-no-shell-escape` enforced.
- Network disabled, CPU/memory limits, timeouts, read-only root.
