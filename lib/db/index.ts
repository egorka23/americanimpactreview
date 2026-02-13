import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// SQLite disables foreign keys by default — enable per connection
client.execute("PRAGMA foreign_keys = ON");

export const db = drizzle(client, { schema });
