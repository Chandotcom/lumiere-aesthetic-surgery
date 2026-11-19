import "server-only";
import { desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb, schema } from "@/db";
import { testimonials } from "@/lib/content/home";
import { getProcedure } from "@/lib/content/procedures";
import { REVIEWS_SHOWN, type PublicReview } from "./meta";

export const REVIEWS_TAG = "reviews";

const fallback = (): PublicReview[] =>
  testimonials.map((t, i) => ({
    id: `sample-${i}`,
    quote: t.quote,
    name: t.name,
    procedure: getProcedure(t.procedureSlug)?.name ?? null,
    rating: t.rating,
    image: t.image ? { ...t.image } : null,
    isSample: true,
  }));

/**
 * Published reviews, newest first, for the testimonials carousel. Cached until a review change
 * calls updateTag("reviews"). Without a database, or on a read error, the built-in sample reviews
 * are shown. If staff have published none, this is empty and the section is not rendered.
 */
export async function getPublishedReviews(): Promise<PublicReview[]> {
  "use cache";
  cacheTag(REVIEWS_TAG);
  cacheLife("max");

  if (!process.env.DATABASE_URL) return fallback();
  try {
    const rows = await getDb()
      .select()
      .from(schema.reviews)
      .where(eq(schema.reviews.status, "approved"))
      .orderBy(desc(schema.reviews.publishedAt), desc(schema.reviews.id))
      .limit(REVIEWS_SHOWN);
    return rows.map((r) => ({
      id: String(r.id),
      quote: r.body,
      name: r.name,
      procedure: (r.procedureSlug && getProcedure(r.procedureSlug)?.name) || null,
      rating: r.rating,
      image: r.photoUrl ? { src: r.photoUrl, alt: r.photoAlt ?? "" } : null,
      isSample: r.isSample,
    }));
  } catch (err) {
    cacheLife("minutes");
    console.warn(
      "[reviews] Couldn't read reviews, showing the sample reviews instead. Reason:",
      err instanceof Error ? err.message : String(err),
    );
    return fallback();
  }
}
