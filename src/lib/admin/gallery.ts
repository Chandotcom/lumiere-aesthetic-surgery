import "server-only";
import { asc, count, desc, eq, max } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { galleryStatusLabel, type GalleryStatus } from "@/lib/gallery/meta";

const { galleryItems, galleryPhotos } = schema;

export type AdminCase = typeof galleryItems.$inferSelect;
export type AdminPhoto = Pick<typeof galleryPhotos.$inferSelect, "id" | "view" | "side" | "width" | "height" | "size">;

export async function listCases(status?: GalleryStatus) {
  const db = getDb();
  const base = db
    .select({
      id: galleryItems.id,
      number: galleryItems.number,
      procedureSlug: galleryItems.procedureSlug,
      ageRange: galleryItems.ageRange,
      views: galleryItems.views,
      consentSigned: galleryItems.consentSigned,
      isSample: galleryItems.isSample,
      status: galleryItems.status,
      updatedAt: galleryItems.updatedAt,
      photoCount: count(galleryPhotos.id),
    })
    .from(galleryItems)
    .leftJoin(galleryPhotos, eq(galleryPhotos.itemId, galleryItems.id))
    .groupBy(galleryItems.id)
    .orderBy(desc(galleryItems.updatedAt))
    .$dynamic();
  return status ? base.where(eq(galleryItems.status, status)) : base;
}

export async function countCasesByStatus(): Promise<Record<GalleryStatus, number>> {
  const rows = await getDb()
    .select({ status: galleryItems.status, n: count() })
    .from(galleryItems)
    .groupBy(galleryItems.status);
  const out = Object.fromEntries(Object.keys(galleryStatusLabel).map((s) => [s, 0])) as Record<GalleryStatus, number>;
  for (const r of rows) out[r.status] = r.n;
  return out;
}

export async function getCase(id: number) {
  const db = getDb();
  const [item] = await db.select().from(galleryItems).where(eq(galleryItems.id, id)).limit(1);
  if (!item) return null;
  const photos: AdminPhoto[] = await db
    .select({
      id: galleryPhotos.id,
      view: galleryPhotos.view,
      side: galleryPhotos.side,
      width: galleryPhotos.width,
      height: galleryPhotos.height,
      size: galleryPhotos.size,
    })
    .from(galleryPhotos)
    .where(eq(galleryPhotos.itemId, id))
    .orderBy(asc(galleryPhotos.id));
  return { item, photos };
}

/** Next public case number (numbers are never reused, so links to old cases never point elsewhere). */
export async function nextCaseNumber() {
  const [row] = await getDb().select({ n: max(galleryItems.number) }).from(galleryItems);
  return Math.max(row?.n ?? 0, 1000) + 1;
}
