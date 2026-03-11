/**
 * Regenerate PDFs for all published articles via the production API.
 * Generates an admin token locally, then calls the regenerate-pdf endpoint.
 *
 * Usage:
 *   set -a && source .env.local && set +a && npx tsx scripts/regenerate-all-pdfs.ts
 *
 * Options:
 *   --engine=latex      Force LaTeX for all articles
 *   --engine=puppeteer  Force Puppeteer for all articles
 *   --slug=e2026001     Regenerate only one article
 *   --dry-run           Show what would be done without actually calling the API
 */

import { createHmac } from "crypto";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://americanimpactreview.com";
const SECRET = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "";

if (!SECRET) {
  console.error("ERROR: AUTH_SECRET or ADMIN_PASSWORD must be set");
  process.exit(1);
}

// All 18 published article slugs
const ALL_SLUGS = [
  "e2026001", "e2026002", "e2026003", "e2026004", "e2026005",
  "e2026006", "e2026007", "e2026008", "e2026009", "e2026012",
  "e2026013", "e2026015", "e2026016", "e2026018", "e2026019",
  "e2026020", "e2026021", "e2026022",
];

function generateAdminToken(): string {
  const ts = Date.now().toString();
  const sig = createHmac("sha256", SECRET).update(ts).digest("hex");
  return `${ts}.${sig}`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let engine: string | undefined;
  let slug: string | undefined;
  let dryRun = false;

  for (const arg of args) {
    if (arg.startsWith("--engine=")) engine = arg.split("=")[1];
    if (arg.startsWith("--slug=")) slug = arg.split("=")[1];
    if (arg === "--dry-run") dryRun = true;
  }

  return { engine, slug, dryRun };
}

async function regenerateOne(slug: string, engine: string | undefined, token: string): Promise<{ ok: boolean; detail: string }> {
  const engineParam = engine ? `?engine=${engine}` : "";
  const url = `${BASE_URL}/api/local-admin/regenerate-pdf/${slug}${engineParam}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Cookie: `air_admin=${encodeURIComponent(token)}`,
    },
  });

  const json = await res.json();

  if (res.ok && json.success) {
    const sizeMb = (json.size / 1024 / 1024).toFixed(2);
    return {
      ok: true,
      detail: `${json.pageCount} pages, ${sizeMb} MB, engine=${json.engine}`,
    };
  } else {
    return {
      ok: false,
      detail: json.error || json.detail || `HTTP ${res.status}`,
    };
  }
}

async function main() {
  const { engine, slug, dryRun } = parseArgs();
  const slugs = slug ? [slug] : ALL_SLUGS;

  console.log(`\nRegenerate PDFs for ${slugs.length} article(s)`);
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Engine: ${engine || "(auto — server default)"}`);
  if (dryRun) console.log("  DRY RUN — no API calls will be made\n");
  else console.log();

  const token = generateAdminToken();
  let success = 0;
  let failed = 0;

  for (const s of slugs) {
    process.stdout.write(`  ${s} ... `);

    if (dryRun) {
      console.log("(dry run)");
      continue;
    }

    try {
      const result = await regenerateOne(s, engine, token);
      if (result.ok) {
        console.log(`OK  ${result.detail}`);
        success++;
      } else {
        console.log(`FAIL  ${result.detail}`);
        failed++;
      }
    } catch (err) {
      console.log(`ERROR  ${err}`);
      failed++;
    }
  }

  if (!dryRun) {
    console.log(`\nDone: ${success} succeeded, ${failed} failed`);
  }
}

main().catch(console.error);
