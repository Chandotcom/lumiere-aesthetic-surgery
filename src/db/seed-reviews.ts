// Seeds the demo reviews from src/lib/content/home.ts as published SAMPLE reviews (labelled
// "Sample review" on the site). Re-running replaces the sample reviews only; real reviews are
// never touched. `--clear` removes the samples. Run with `pnpm db:seed:reviews`.
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { testimonials } from "../lib/content/home";
import { reviews } from "./schema";

config({ path: ".env.local", quiet: true });

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));
  await db.delete(reviews).where(eq(reviews.isSample, true));
  if (process.argv.includes("--clear")) {
    console.log("Removed the sample reviews.");
    return;
  }
  // The first sample gets the newest date, so it leads the carousel.
  const now = Date.now();
  await db.insert(reviews).values(
    testimonials.map((t, i) => ({
      name: t.name,
      rating: t.rating,
      body: t.quote,
      procedureSlug: t.procedureSlug,
      photoUrl: t.image?.src ?? null,
      photoAlt: t.image?.alt ?? null,
      source: "clinic",
      isSample: true,
      status: "approved" as const,
      publishedAt: new Date(now - (i + 1) * 9 * 86_400_000),
    })),
  );
  console.log(`Reviews seeded: ${testimonials.length} sample reviews.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
