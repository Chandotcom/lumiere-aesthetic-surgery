import "server-only";
import { desc, eq, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { MediaItem } from "./media-meta";

const { media, contentDocuments, reviews } = schema;

/**
 * Credentials for the PUBLIC media store (site imagery). Patient photos use a separate private store.
 * Locally that's BLOB_READ_WRITE_TOKEN. On Vercel, a connected store may provide BLOB_STORE_ID
 * with short-lived OIDC credentials instead. Then this returns undefined and the SDK picks
 * them up itself.
 */
export function mediaToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN || undefined;
}

export const hasMediaStore = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

export async function listMedia(limit = 200): Promise<MediaItem[]> {
  const rows = await getDb().select().from(media).orderBy(desc(media.createdAt)).limit(limit);
  return rows.map((r) => ({
    id: r.id,
    url: r.url,
    alt: r.alt,
    width: r.width,
    height: r.height,
    size: r.size,
    contentType: r.contentType,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getMedia(id: number) {
  const [row] = await getDb().select().from(media).where(eq(media.id, id)).limit(1);
  return row ?? null;
}

/** Content documents (draft or published) and reviews that still reference this image URL. */
export async function findMediaUsage(url: string) {
  const pattern = `%${url.replace(/[\\%_]/g, "\\$&")}%`;
  const usedByReviews = await getDb()
    .select({ name: reviews.name })
    .from(reviews)
    .where(eq(reviews.photoUrl, url));
  const docs = await getDb()
    .select({ kind: contentDocuments.kind, key: contentDocuments.key })
    .from(contentDocuments)
    .where(
      or(
        sql`${contentDocuments.draft}::text like ${pattern}`,
        sql`${contentDocuments.published}::text like ${pattern}`,
      ),
    );
  return [...docs, ...usedByReviews.map((r) => ({ kind: "review", key: r.name }))];
}
