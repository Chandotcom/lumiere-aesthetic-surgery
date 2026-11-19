"use server";

import { del, head } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { ActionError, runStaffAction, type ActionResult } from "@/lib/admin/action";
import { logAudit } from "@/lib/admin/audit";
import { findMediaUsage, getMedia, listMedia, mediaToken } from "@/lib/admin/media";
import { MEDIA_FOLDER, MEDIA_MAX_BYTES, MEDIA_TYPES, type MediaItem } from "@/lib/admin/media-meta";
import { requireStaff } from "@/lib/admin/session";

const { media } = schema;
const run = (fn: (staffId: string) => Promise<void>) => runStaffAction("media", fn);

const registerSchema = z.object({
  url: z.url().refine((u) => new URL(u).hostname.endsWith(".public.blob.vercel-storage.com"), "Not a media-library file."),
  alt: z.string().trim().max(200),
  width: z.number().int().positive().max(20_000).nullable(),
  height: z.number().int().positive().max(20_000).nullable(),
});

/**
 * Record a file the browser just uploaded straight to Blob. The file's details are read back
 * from the store itself (head), so a client can't register foreign or oversized files.
 */
export async function registerMedia(input: z.input<typeof registerSchema>): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid upload." };
  const d = parsed.data;

  return run(async (staffId) => {
    const info = await head(d.url, { token: mediaToken() }).catch(() => null);
    if (!info) throw new ActionError("The upload couldn't be found. Please try again.");
    if (!info.pathname.startsWith(MEDIA_FOLDER)) throw new ActionError("Not a media-library file.");
    if (!(MEDIA_TYPES as readonly string[]).includes(info.contentType)) throw new ActionError("Only JPG, PNG, WebP or AVIF images.");
    if (info.size > MEDIA_MAX_BYTES) throw new ActionError("Images are limited to 10 MB.");

    const [row] = await getDb()
      .insert(media)
      .values({
        url: info.url,
        pathname: info.pathname,
        alt: d.alt,
        contentType: info.contentType,
        size: info.size,
        width: d.width,
        height: d.height,
        uploadedBy: staffId,
      })
      .onConflictDoNothing()
      .returning({ id: media.id });
    await logAudit(staffId, "media.uploaded", "media", row?.id);
  });
}

export async function updateMediaAlt(id: number, alt: string): Promise<ActionResult> {
  const parsed = z
    .object({ id: z.number().int().positive(), alt: z.string().trim().max(200, "Alt text is limited to 200 characters.") })
    .safeParse({ id, alt });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid alt text." };
  return run(async (staffId) => {
    await getDb().update(media).set({ alt: parsed.data.alt }).where(eq(media.id, parsed.data.id));
    await logAudit(staffId, "media.alt_updated", "media", parsed.data.id);
  });
}

/** Delete an image. Refuses while a page or post still uses it, unless `force` is set. */
export async function deleteMedia(id: number, force = false): Promise<ActionResult> {
  if (!Number.isSafeInteger(id) || id <= 0) return { ok: false, error: "Invalid image." };
  return run(async (staffId) => {
    const item = await getMedia(id);
    if (!item) throw new ActionError("This image no longer exists.");
    if (!force) {
      const usage = await findMediaUsage(item.url);
      if (usage.length) {
        const where = usage.map((u) => (u.key === "main" ? u.kind : `${u.kind} “${u.key}”`)).join(", ");
        throw new ActionError(`Still used on: ${where}. Replace it there first, or delete anyway.`);
      }
    }
    await del(item.url, { token: mediaToken() });
    await getDb().delete(media).where(eq(media.id, id));
    await logAudit(staffId, "media.deleted", "media", id);
  });
}

/** Library contents for the image picker in the content editors. */
export async function listMediaForPicker(): Promise<MediaItem[]> {
  await requireStaff();
  return listMedia();
}
