import "server-only";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type PatchedFetch = typeof fetch & { _nextOriginalFetch?: typeof fetch };

// Neon's HTTP driver sends queries with fetch(). Next.js patches global fetch and, during
// build-time prerendering, caches requests that have no explicit cache option. It even
// reuses them across builds, so a new build could bake in stale rows. Database queries
// must never go through that cache (caching is done one level up with 'use cache' +
// cacheTag), so the driver uses the original, unpatched fetch. It's looked up on every call
// because Next applies its patch after this module loads.
neonConfig.fetchFunction = (input: RequestInfo | URL, init?: RequestInit) => {
  const current = globalThis.fetch as PatchedFetch;
  return (current._nextOriginalFetch ?? current)(input, init);
};

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local or run `vercel env pull .env.local --yes`.",
    );
  }
  return drizzle(neon(url), { schema });
}

let _db: ReturnType<typeof createDb> | undefined;

/** Lazily created so `next build` works before the database is provisioned. */
export function getDb() {
  _db ??= createDb();
  return _db;
}

export { schema };
