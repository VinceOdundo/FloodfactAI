/**
 * Applies scripts/dev/local-supabase-shim.sql, every file in
 * supabase/migrations/ (in filename order), and supabase/seed.sql to a
 * plain local Postgres — no Docker, no Supabase CLI required. This is how
 * the schema and RLS policies in this repo are actually validated: against
 * a real Postgres, not just read as SQL. See docs/ARCHITECTURE.md.
 *
 * Requires `postgis` and `pgvector` installed on the target Postgres.
 * Defaults to a standard local Postgres (matches .github/workflows/ci.yml's
 * service container); override with LOCAL_PG_URL for a different setup.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const PG_URL = process.env.LOCAL_PG_URL ?? "postgresql://postgres:postgres@localhost:5432/postgres";
const ROOT = join(__dirname, "..", "..");

async function applyFile(client: Client, path: string) {
  const sql = readFileSync(path, "utf8");
  process.stdout.write(`Applying ${path.replace(ROOT + "/", "")} ... `);
  await client.query(sql);
  console.log("ok");
}

async function main() {
  const client = new Client({ connectionString: PG_URL });
  await client.connect();

  try {
    await applyFile(client, join(ROOT, "scripts/dev/local-supabase-shim.sql"));

    const migrationsDir = join(ROOT, "supabase/migrations");
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      await applyFile(client, join(migrationsDir, file));
    }

    await applyFile(client, join(ROOT, "supabase/seed.sql"));
    console.log("\nAll migrations and seed data applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\nMigration failed:", err.message);
  process.exit(1);
});
