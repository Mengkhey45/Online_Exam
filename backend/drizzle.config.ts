import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Drizzle Kit config for generating and applying migrations.
// `db:generate` produces SQL from src/db/schema without a live connection;
// `db:migrate` requires DATABASE_URL. RLS policies live in supabase/policies
// and are applied alongside their table's migration (AGENTS §6).
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./supabase/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  casing: "snake_case",
  strict: true,
  verbose: true,
});
