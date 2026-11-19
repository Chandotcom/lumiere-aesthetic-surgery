import "server-only";
import { get } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { galleryBlob, hasGalleryStore } from "./store";

const { galleryItems, galleryPhotos } = schema;

const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

/**
 * Streams one gallery photo from the private store.
 * `publicOnly`: serve it only while its case is approved AND consent is recorded. Anything else
 * returns the same 404 as a missing photo, so the response never reveals that a case exists.
 */
export async function serveGalleryPhoto(idParam: string, { publicOnly }: { publicOnly: boolean }) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0 || !process.env.DATABASE_URL || !hasGalleryStore()) return notFound();

  const [row] = await getDb()
    .select({
      pathname: galleryPhotos.pathname,
      status: galleryItems.status,
      consentSigned: galleryItems.consentSigned,
    })
    .from(galleryPhotos)
    .innerJoin(galleryItems, eq(galleryItems.id, galleryPhotos.itemId))
    .where(eq(galleryPhotos.id, id))
    .limit(1);
  if (!row) return notFound();
  if (publicOnly && !(row.status === "approved" && row.consentSigned)) return notFound();

  const blob = await get(row.pathname, { access: "private", ...galleryBlob() });
  if (!blob || blob.statusCode !== 200) return notFound();

  return new Response(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType,
      "Content-Length": String(blob.blob.size),
      // Public: short CDN cache, so hiding a case or withdrawn consent takes effect within minutes.
      // Staff: never cached anywhere.
      "Cache-Control": publicOnly ? "public, max-age=60, s-maxage=300" : "private, no-store",
      "X-Robots-Tag": "noindex, noimageindex",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
