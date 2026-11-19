// Seeds the procedures table from the site content (src/lib/content/procedures.ts), so the
// database and the public pages always list the same 16 procedures. Safe to re-run: existing
// rows are updated by slug. Run with `pnpm db:seed` after the migrations are applied.
// Imports drizzle directly (not ../db/index) because that module is server-only.
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { procedures as content, type Category } from "../lib/content/procedures";
import { procedures } from "./schema";

config({ path: ".env.local", quiet: true });

const categoryMap: Record<Category, (typeof procedures.$inferInsert)["category"]> = {
  Face: "face",
  Breast: "breast",
  Body: "body",
  "Non-surgical": "non_surgical",
};

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));

  await db
    .insert(procedures)
    .values(
      content.map((p) => ({
        slug: p.slug,
        name: p.name,
        category: categoryMap[p.category],
        priceFrom: p.price.from,
        priceTo: p.price.to,
        summary: p.summary,
      })),
    )
    .onConflictDoUpdate({
      target: procedures.slug,
      set: {
        name: sql`excluded.name`,
        category: sql`excluded.category`,
        priceFrom: sql`excluded.price_from`,
        priceTo: sql`excluded.price_to`,
        summary: sql`excluded.summary`,
        updatedAt: sql`now()`,
      },
    });

  console.log(`Seeded ${content.length} procedures.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
