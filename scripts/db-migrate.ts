// bun --env-file=.env.local scripts/db-migrate.ts — applies db/*.sql in order (idempotent statements).
import { readdir } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const sql = neon(url);
for (const file of (await readdir("db"))
  .filter((f) => f.endsWith(".sql"))
  .sort()) {
  const text = await Bun.file(`db/${file}`).text();
  for (const statement of text
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s && !/^--[^\n]*$/.test(s))) {
    await sql.query(statement);
  }
  console.log(`applied ${file}`);
}
