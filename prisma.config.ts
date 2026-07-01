import { defineConfig } from 'prisma/config';

// Prisma 7 moves connection URLs out of schema.prisma into this config file.
// URLs are read from the environment — never hardcoded, so no credentials live in
// the repo. SHADOW_DATABASE_URL is optional (only used by `prisma migrate dev`).
// Used by the Prisma CLI; the runtime client connects via the pg driver adapter.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
    ...(process.env.SHADOW_DATABASE_URL
      ? { shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL }
      : {}),
  },
});
