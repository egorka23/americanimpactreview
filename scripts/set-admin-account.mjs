import fs from "fs";
import path from "path";
import { createClient } from "@libsql/client";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnv(path.resolve(process.cwd(), ".env.local"));

const username = process.env.ADMIN_USERNAME || "serafimka464@gmail.com";
const password = process.env.ADMIN_PASSWORD || "fc91.d2vn";
const displayName = "Serafim";

if (!process.env.TURSO_DATABASE_URL) {
  console.error("TURSO_DATABASE_URL is missing.");
  process.exit(1);
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const hashed = await hash(password, 12);

await client.execute({
  sql: `INSERT INTO admin_accounts (id, username, password, display_name, created_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(username) DO UPDATE SET
          password = excluded.password,
          display_name = excluded.display_name`,
  args: [randomUUID(), username, hashed, displayName, Date.now()],
});

console.log(`Admin account ready for ${username}`);
