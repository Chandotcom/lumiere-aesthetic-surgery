import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb, schema } from "@/db";
import { galleryCases as placeholderCases, type GalleryCase, type View } from "@/lib/content/gallery";
import { getProcedure } from "@/lib/content/procedures";
import { caseSlug, publicPhotoUrl } from "./meta";

export const GALLERY_TAG = "gallery";

const { galleryItems, galleryPhotos } = schema;

/**
 * Published (approved + consented) cases, newest first. Cached until an admin change calls
 * updateTag("gallery"). Without a database, or on a read error, the built-in placeholder cases
 * are shown so the demo never renders an empty gallery by accident.
 */
export async function getGalleryCases(): Promise<GalleryCase[]> {
  "use cache";
  cacheTag(GALLERY_TAG);
  cacheLife("max");

  if (!process.env.DATABASE_URL) return placeholderCases;
  try {
    const db = getDb();
    const items = await db
      .select()
      .from(galleryItems)
      .where(and(eq(galleryItems.status, "approved"), eq(galleryItems.consentSigned, true)))
      .orderBy(desc(galleryItems.publishedAt), desc(galleryItems.number));

    const photos = items.length
      ? await db
          .select({ id: galleryPhotos.id, itemId: galleryPhotos.itemId, view: galleryPhotos.view, side: galleryPhotos.side })
          .from(galleryPhotos)
          .where(inArray(galleryPhotos.itemId, items.map((i) => i.id)))
      : [];

    return items.flatMap((item): GalleryCase[] => {
      const procedure = getProcedure(item.procedureSlug);
      if (!procedure) return [];
      const mine = photos.filter((p) => p.itemId === item.id);
      const views = item.views as View[];
      const pairs: GalleryCase["photos"] = {};
      for (const view of views) {
        const before = mine.find((p) => p.view === view && p.side === "before");
        const after = mine.find((p) => p.view === view && p.side === "after");
        if (before && after) pairs[view] = { before: publicPhotoUrl(before.id), after: publicPhotoUrl(after.id) };
      }
      // A real (non-sample) case only lists the angles that have both photos.
      const shownViews = item.isSample ? views : views.filter((v) => pairs[v]);
      if (shownViews.length === 0) return [];
      return [
        {
          slug: caseSlug(item),
          number: item.number,
          procedureSlug: item.procedureSlug,
          category: procedure.category,
          ageRange: item.ageRange,
          timeAfter: item.timeAfter,
          views: shownViews,
          notes: item.notes,
          publishedAt: (item.publishedAt ?? item.createdAt).toISOString().slice(0, 10),
          consentSigned: true,
          showFace: item.showFace,
          photos: item.isSample ? undefined : pairs,
        },
      ];
    });
  } catch (err) {
    cacheLife("minutes");
    console.warn(
      "[gallery] Couldn't read gallery cases, showing the placeholder cases instead. Reason:",
      err instanceof Error ? err.message : String(err),
    );
    return placeholderCases;
  }
}

export async function getGalleryCase(slug: string) {
  return (await getGalleryCases()).find((c) => c.slug === slug);
}

export async function getCasesForProcedure(procedureSlug: string) {
  return (await getGalleryCases()).filter((c) => c.procedureSlug === procedureSlug);
}
