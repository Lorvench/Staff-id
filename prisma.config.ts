import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma v7 configuration.
 *
 * As of Prisma 7 the datasource URL is no longer read from `schema.prisma`;
 * the CLI (migrate, studio, db push) reads it from here, and the runtime client
 * receives it through a driver adapter in `src/lib/prisma.ts`.
 * `DATABASE_URL` remains the single connection string for both — no directUrl.
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
});
