import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";

const { contentDocuments: docs, contentRevisions: revisions } = schema;

const byKindKey = (kind: string, key: string) => and(eq(docs.kind, kind), eq(docs.key, key));

export async function getDocument(kind: string, key: string) {
  const [doc] = await getDb().select().from(docs).where(byKindKey(kind, key)).limit(1);
  return doc ?? null;
}

/** State of every document of a kind, for overview lists. */
export async function listDocumentStates(kind: string) {
  const rows = await getDb()
    .select({
      key: docs.key,
      hasDraft: sql<boolean>`${docs.draft} is not null`,
      hasPublished: sql<boolean>`${docs.published} is not null`,
      draftUpdatedAt: docs.draftUpdatedAt,
      publishedAt: docs.publishedAt,
    })
    .from(docs)
    .where(eq(docs.kind, kind));
  return new Map(rows.map((r) => [r.key, r]));
}

export async function saveDraft(kind: string, key: string, data: unknown, staffId: string) {
  const now = new Date();
  await getDb()
    .insert(docs)
    .values({ kind, key, draft: data, draftUpdatedAt: now, draftUpdatedBy: staffId })
    .onConflictDoUpdate({
      target: [docs.kind, docs.key],
      set: { draft: data, draftUpdatedAt: now, draftUpdatedBy: staffId },
    });
}

/** Draft → published, with a revision snapshot. Returns false when there is no draft. */
export async function publishDraft(kind: string, key: string, staffId: string) {
  const doc = await getDocument(kind, key);
  if (!doc || doc.draft == null) return false;
  const db = getDb();
  await db
    .update(docs)
    .set({ published: doc.draft, draft: null, draftUpdatedAt: null, publishedAt: new Date(), publishedBy: staffId })
    .where(eq(docs.id, doc.id));
  await db.insert(revisions).values({ documentId: doc.id, data: doc.draft, publishedBy: staffId });
  return true;
}

export async function discardDraft(kind: string, key: string) {
  await getDb().update(docs).set({ draft: null, draftUpdatedAt: null }).where(byKindKey(kind, key));
}

/**
 * Stop overriding the code defaults: the published version is removed (revisions are kept,
 * so it can still be restored). Returns false when nothing was published.
 */
export async function unpublish(kind: string, key: string) {
  const updated = await getDb()
    .update(docs)
    .set({ published: null, publishedAt: null })
    .where(and(byKindKey(kind, key), sql`${docs.published} is not null`))
    .returning({ id: docs.id });
  return updated.length > 0;
}

/** Remove a document and its revisions entirely (custom journal posts only). */
export async function deleteDocument(kind: string, key: string) {
  await getDb().delete(docs).where(byKindKey(kind, key));
}

/** Every stored key of a kind with its draft/published data, for admin listings. */
export async function listDocuments(kind: string) {
  return getDb()
    .select({
      key: docs.key,
      draft: docs.draft,
      published: docs.published,
      draftUpdatedAt: docs.draftUpdatedAt,
      publishedAt: docs.publishedAt,
    })
    .from(docs)
    .where(eq(docs.kind, kind));
}

export async function listRevisions(kind: string, key: string, limit = 20) {
  return getDb()
    .select({ id: revisions.id, createdAt: revisions.createdAt, publishedBy: revisions.publishedBy })
    .from(revisions)
    .innerJoin(docs, eq(revisions.documentId, docs.id))
    .where(byKindKey(kind, key))
    .orderBy(desc(revisions.createdAt))
    .limit(limit);
}

/** The data of one revision, only if it belongs to this kind/key. */
export async function getRevisionData(kind: string, key: string, revisionId: number) {
  const [row] = await getDb()
    .select({ data: revisions.data })
    .from(revisions)
    .innerJoin(docs, eq(revisions.documentId, docs.id))
    .where(and(byKindKey(kind, key), eq(revisions.id, revisionId)))
    .limit(1);
  return row?.data ?? null;
}
