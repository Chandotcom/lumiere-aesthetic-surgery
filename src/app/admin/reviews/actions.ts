"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { ActionError, runStaffAction, type ActionResult } from "@/lib/admin/action";
import { logAudit } from "@/lib/admin/audit";
import { getReview, isLocked } from "@/lib/admin/reviews";
import { hideReasons, reviewSchema, type HideReason, type ReviewFields } from "@/lib/reviews/meta";
import { REVIEWS_TAG } from "@/lib/reviews/read";

const { reviews } = schema;
const run = (fn: (staffId: string) => Promise<void>) => runStaffAction("reviews", fn);
const reviewId = z.number().int().positive();
const firstError = (e: z.ZodError) => e.issues[0]?.message ?? "Please check the form.";

function toColumns(d: z.output<typeof reviewSchema>) {
  return {
    name: d.name,
    rating: d.rating,
    body: d.body,
    procedureSlug: d.procedureSlug || null,
    source: d.source,
    verified: d.verified,
    photoUrl: d.photo.src || null,
    photoAlt: d.photo.src ? d.photo.alt : null,
  };
}

async function loadOrThrow(id: number) {
  const review = await getReview(id);
  if (!review) throw new ActionError("This review no longer exists.");
  return review;
}

export async function createReview(input: ReviewFields): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  let id = 0;
  const result = await run(async (staffId) => {
    const [row] = await getDb()
      .insert(reviews)
      .values({ ...toColumns(parsed.data), createdBy: staffId })
      .returning({ id: reviews.id });
    id = row.id;
    await logAudit(staffId, "review.created", "review", id);
  });
  if (!result.ok) return result;
  redirect(`/admin/reviews/${id}`);
}

export async function updateReview(id: number, input: ReviewFields): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success || !reviewId.safeParse(id).success) {
    return { ok: false, error: parsed.success ? "Invalid review." : firstError(parsed.error) };
  }
  return run(async (staffId) => {
    const current = await loadOrThrow(id);
    const next = toColumns(parsed.data);
    if (isLocked(current) && (next.body !== current.body || next.rating !== current.rating)) {
      throw new ActionError("A published review’s words and rating can’t be changed.");
    }
    await getDb().update(reviews).set(next).where(eq(reviews.id, id));
    await logAudit(staffId, "review.updated", "review", id);
    if (current.status === "approved") updateTag(REVIEWS_TAG);
  });
}

/** Publish, move back to review, or hide (hiding needs one of the policy reasons). */
export async function setReviewStatus(
  id: number,
  status: "approved" | "pending" | "hidden",
  reason?: HideReason,
): Promise<ActionResult> {
  if (!reviewId.safeParse(id).success || !["approved", "pending", "hidden"].includes(status)) {
    return { ok: false, error: "Invalid status." };
  }
  if (status === "hidden" && !(reason && reason in hideReasons)) {
    return { ok: false, error: "Choose why this review is being hidden." };
  }
  return run(async (staffId) => {
    const current = await loadOrThrow(id);
    await getDb()
      .update(reviews)
      .set({
        status,
        hiddenReason: status === "hidden" ? reason : null,
        publishedAt: status === "approved" ? (current.publishedAt ?? new Date()) : current.publishedAt,
      })
      .where(eq(reviews.id, id));
    await logAudit(staffId, `review.${status === "approved" ? "published" : status}`, "review", id);
    if (status === "approved" || current.status === "approved") updateTag(REVIEWS_TAG);
  });
}

/** Only sample reviews and reviews that were never published can be deleted. */
export async function deleteReview(id: number): Promise<ActionResult> {
  if (!reviewId.safeParse(id).success) return { ok: false, error: "Invalid review." };
  const result = await run(async (staffId) => {
    const current = await loadOrThrow(id);
    if (isLocked(current)) throw new ActionError("Published reviews can’t be deleted. Hide it with a reason instead.");
    await getDb().delete(reviews).where(eq(reviews.id, id));
    await logAudit(staffId, "review.deleted", "review", id);
    if (current.status === "approved") updateTag(REVIEWS_TAG);
  });
  if (!result.ok) return result;
  redirect("/admin/reviews");
}
