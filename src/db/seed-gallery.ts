// Seeds the demo gallery: every placeholder case in src/lib/content/gallery.ts becomes an
// approved SAMPLE case (is_sample = true, placeholder art, no photos). Safe to re-run: rows are
// matched by case number and only sample rows are ever touched. Real cases are never changed.
// `--clear` removes the sample cases only. Run with `pnpm db:seed:gallery`.
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { galleryCases } from "../lib/content/gallery";
import { galleryItems } from "./schema";

config({ path: ".env.local", quiet: true });

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));

  if (process.argv.includes("--clear")) {
    const removed = await db.delete(galleryItems).where(eq(galleryItems.isSample, true)).returning({ id: galleryItems.id });
    console.log(`Removed ${removed.length} sample gallery cases.`);
    return;
  }

  const rows = galleryCases.map((c) => ({
    number: c.number,
    procedureSlug: c.procedureSlug,
    ageRange: c.ageRange,
    timeAfter: c.timeAfter,
    notes: c.notes,
    views: c.views,
    consentSigned: true,
    consentScope: "website",
    consentRecordedAt: new Date(`${c.publishedAt}T09:00:00Z`),
    showFace: c.showFace,
    isSample: true,
    status: "approved" as const,
    publishedAt: new Date(`${c.publishedAt}T09:00:00Z`),
  }));

  await db
    .insert(galleryItems)
    .values(rows)
    .onConflictDoUpdate({
      target: galleryItems.number,
      // Only refresh rows that are still samples; a real case with the same number wins.
      setWhere: eq(galleryItems.isSample, true),
      set: {
        procedureSlug: sql`excluded.procedure_slug`,
        ageRange: sql`excluded.age_range`,
        timeAfter: sql`excluded.time_after`,
        notes: sql`excluded.notes`,
        views: sql`excluded.views`,
        showFace: sql`excluded.show_face`,
      },
    });

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(galleryItems)
    .where(and(eq(galleryItems.isSample, true)));
  console.log(`Gallery seeded: ${n} sample cases.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
