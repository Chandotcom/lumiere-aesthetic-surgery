import "server-only";
import { count, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { reviewStatusLabel, type ReviewStatus } from "@/lib/reviews/meta";

const { reviews } = schema;
export type AdminReview = typeof reviews.$inferSelect;

export async function listReviews(status?: ReviewStatus) {
  const q = getDb().select().from(reviews).orderBy(desc(reviews.updatedAt)).$dynamic();
  return status ? q.where(eq(reviews.status, status)) : q;
}

export async function countReviewsByStatus(): Promise<Record<ReviewStatus, number>> {
  const rows = await getDb().select({ status: reviews.status, n: count() }).from(reviews).groupBy(reviews.status);
  const out = Object.fromEntries(Object.keys(reviewStatusLabel).map((s) => [s, 0])) as Record<ReviewStatus, number>;
  for (const r of rows) out[r.status] = r.n;
  return out;
}

export async function getReview(id: number) {
  const [row] = await getDb().select().from(reviews).where(eq(reviews.id, id)).limit(1);
  return row ?? null;
}

/**
 * Real reviews are locked once published: the quote and rating can't be changed, and the review
 * can't be deleted, only hidden with a reason. Sample (demo) reviews stay editable.
 */
export const isLocked = (r: Pick<AdminReview, "publishedAt" | "isSample">) => Boolean(r.publishedAt) && !r.isSample;
