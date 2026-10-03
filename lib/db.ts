import { createClient, type Client } from "@libsql/client";
let client: Client | undefined;
export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_NOT_CONFIGURED");
  if (process.env.VERCEL && url.startsWith("file:"))
    throw new Error("LOCAL_DATABASE_ON_VERCEL");
  client ??= createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  return client;
}
export async function initializeDatabase() {
  await db().batch(
    [
      `CREATE TABLE IF NOT EXISTS learning_sections (
      id TEXT PRIMARY KEY, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
      `CREATE TABLE IF NOT EXISTS learning_lessons (
      id TEXT PRIMARY KEY, section_id TEXT NOT NULL REFERENCES learning_sections(id),
      data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
      "CREATE INDEX IF NOT EXISTS learning_lessons_section ON learning_lessons(section_id)",
    ],
    "write",
  );
}
