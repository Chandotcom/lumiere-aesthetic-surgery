import "server-only";
import { and, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getProcedure } from "@/lib/content/procedures";
import { publishBlockers } from "@/lib/gallery/meta";
import { documentLabel, editorHref } from "./editor-links";
import { staffNames } from "./staff";

const { contentDocuments, contentRevisions, reviews, galleryItems, galleryPhotos, media } = schema;

const titleOf = (data: unknown) => (data && typeof data === "object" ? (data as { title?: unknown }).title : undefined);

/** What needs an editor's attention, and what happened recently. Content data only: no leads. */
export async function getWebsiteOverview() {
  const db = getDb();
  const [drafts, pendingReviews, pendingCases, recent, totals] = await Promise.all([
    db
      .select({
        kind: contentDocuments.kind,
        key: contentDocuments.key,
        draft: contentDocuments.draft,
        updatedAt: contentDocuments.draftUpdatedAt,
        updatedBy: contentDocuments.draftUpdatedBy,
      })
      .from(contentDocuments)
      .where(isNotNull(contentDocuments.draft))
      .orderBy(desc(contentDocuments.draftUpdatedAt))
      .limit(8),
    db
      .select({ id: reviews.id, name: reviews.name, rating: reviews.rating, createdAt: reviews.createdAt })
      .from(reviews)
      .where(eq(reviews.status, "pending"))
      .orderBy(desc(reviews.createdAt))
      .limit(5),
    db
      .select({
        item: galleryItems,
        photos: sql<{ view: string; side: string }[]>`coalesce(json_agg(json_build_object('view', ${galleryPhotos.view}, 'side', ${galleryPhotos.side})) filter (where ${galleryPhotos.id} is not null), '[]')`,
      })
      .from(galleryItems)
      .leftJoin(galleryPhotos, eq(galleryPhotos.itemId, galleryItems.id))
      .where(eq(galleryItems.status, "pending"))
      .groupBy(galleryItems.id)
      .orderBy(desc(galleryItems.updatedAt))
      .limit(5),
    db
      .select({
        id: contentRevisions.id,
        kind: contentDocuments.kind,
        key: contentDocuments.key,
        data: contentRevisions.data,
        at: contentRevisions.createdAt,
        by: contentRevisions.publishedBy,
      })
      .from(contentRevisions)
      .innerJoin(contentDocuments, eq(contentDocuments.id, contentRevisions.documentId))
      .orderBy(desc(contentRevisions.createdAt))
      .limit(5),
    Promise.all([
      db.select({ n: count() }).from(media),
      db.select({ n: count() }).from(reviews).where(eq(reviews.status, "approved")),
      db.select({ n: count() }).from(reviews).where(eq(reviews.status, "pending")),
      db
        .select({ n: count() })
        .from(galleryItems)
        .where(and(eq(galleryItems.status, "approved"), eq(galleryItems.consentSigned, true))),
      db.select({ n: count() }).from(galleryItems).where(eq(galleryItems.status, "pending")),
      db.select({ n: count() }).from(contentDocuments).where(isNotNull(contentDocuments.draft)),
    ]),
  ]);

  const names = await staffNames([
    ...drafts.map((d) => d.updatedBy).filter((v): v is string => Boolean(v)),
    ...recent.map((r) => r.by).filter((v): v is string => Boolean(v)),
  ]);
  const [[mediaCount], [publishedReviews], [reviewsWaiting], [publishedCases], [casesWaiting], [draftCount]] = totals;

  return {
    drafts: drafts.map((d) => ({
      label: documentLabel(d.kind, d.key, titleOf(d.draft)),
      href: editorHref(d.kind, d.key),
      updatedAt: d.updatedAt,
      by: d.updatedBy ? (names.get(d.updatedBy) ?? null) : null,
    })),
    reviews: pendingReviews,
    cases: pendingCases.map(({ item, photos }) => ({
      id: item.id,
      label: `${getProcedure(item.procedureSlug)?.name ?? item.procedureSlug} · #${item.number}`,
      blocker: publishBlockers({ ...item, photos })[0] ?? null,
    })),
    recent: recent.map((r) => ({
      id: r.id,
      label: documentLabel(r.kind, r.key, titleOf(r.data)),
      href: editorHref(r.kind, r.key),
      at: r.at,
      by: r.by ? (names.get(r.by) ?? null) : null,
    })),
    totals: {
      media: mediaCount.n,
      publishedReviews: publishedReviews.n,
      reviewsWaiting: reviewsWaiting.n,
      publishedCases: publishedCases.n,
      casesWaiting: casesWaiting.n,
      drafts: draftCount.n,
    },
  };
}

export type WebsiteOverview = Awaited<ReturnType<typeof getWebsiteOverview>>;
