"use server";

import { del, head } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { ActionError, runStaffAction, type ActionResult } from "@/lib/admin/action";
import { logAudit } from "@/lib/admin/audit";
import { getCase, nextCaseNumber } from "@/lib/admin/gallery";
import {
  GALLERY_MAX_BYTES,
  GALLERY_PHOTO_TYPES,
  GALLERY_SIDES,
  GALLERY_VIEWS,
  galleryPhotoPrefix,
  publishBlockers,
} from "@/lib/gallery/meta";
import { GALLERY_TAG } from "@/lib/gallery/read";
import { caseFieldsSchema, consentSchema, type CaseFields, type ConsentFields } from "@/lib/gallery/schemas";
import { galleryBlob } from "@/lib/gallery/store";

const { galleryItems, galleryPhotos } = schema;
const run = (fn: (staffId: string) => Promise<void>) => runStaffAction("gallery", fn);
const caseId = z.number().int().positive();

const firstError = (e: z.ZodError) => e.issues[0]?.message ?? "Please check the form.";
/** Only cases that are (or were) public affect the cached public gallery. */
const refreshPublic = (status: string) => {
  if (status === "approved") updateTag(GALLERY_TAG);
};

async function loadOrThrow(id: number) {
  const found = await getCase(id);
  if (!found) throw new ActionError("This case no longer exists.");
  return found;
}

export async function createCase(input: CaseFields): Promise<ActionResult> {
  const parsed = caseFieldsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  let id = 0;
  const result = await run(async (staffId) => {
    const [row] = await getDb()
      .insert(galleryItems)
      .values({ ...parsed.data, number: await nextCaseNumber(), createdBy: staffId })
      .returning({ id: galleryItems.id });
    id = row.id;
    await logAudit(staffId, "gallery.created", "gallery_item", id);
  });
  if (!result.ok) return result;
  redirect(`/admin/gallery/${id}`);
}

export async function updateCase(id: number, input: CaseFields): Promise<ActionResult> {
  const parsed = caseFieldsSchema.safeParse(input);
  if (!parsed.success || !caseId.safeParse(id).success) {
    return { ok: false, error: parsed.success ? "Invalid case." : firstError(parsed.error) };
  }
  return run(async (staffId) => {
    const { item, photos } = await loadOrThrow(id);
    // Removing an angle from a published case must not leave it public without complete photos.
    const next = { ...item, ...parsed.data };
    const blockers = publishBlockers({ ...next, photos });
    const status = item.status === "approved" && blockers.length ? "pending" : item.status;
    await getDb()
      .update(galleryItems)
      .set({ ...parsed.data, status })
      .where(eq(galleryItems.id, id));
    await logAudit(staffId, "gallery.updated", "gallery_item", id);
    refreshPublic(item.status);
  });
}

/**
 * Record or withdraw photo consent. Withdrawing consent hides the case straight away and
 * refreshes the public gallery, so the photos stop being served.
 */
export async function updateConsent(id: number, input: ConsentFields): Promise<ActionResult> {
  const parsed = consentSchema.safeParse(input);
  if (!parsed.success || !caseId.safeParse(id).success) return { ok: false, error: "Invalid consent details." };
  const d = parsed.data;
  return run(async (staffId) => {
    const { item } = await loadOrThrow(id);
    const withdrawn = item.consentSigned && !d.consentSigned;
    await getDb()
      .update(galleryItems)
      .set({
        ...d,
        consentRecordedAt: d.consentSigned ? (item.consentSigned ? item.consentRecordedAt : new Date()) : null,
        consentRecordedBy: d.consentSigned ? (item.consentSigned ? item.consentRecordedBy : staffId) : null,
        status: withdrawn && item.status === "approved" ? "hidden" : item.status,
      })
      .where(eq(galleryItems.id, id));
    await logAudit(staffId, withdrawn ? "gallery.consent_withdrawn" : "gallery.consent_updated", "gallery_item", id);
    refreshPublic(item.status);
  });
}

export async function setCaseStatus(id: number, status: "approved" | "pending" | "hidden"): Promise<ActionResult> {
  if (!caseId.safeParse(id).success || !["approved", "pending", "hidden"].includes(status)) {
    return { ok: false, error: "Invalid status." };
  }
  return run(async (staffId) => {
    const { item, photos } = await loadOrThrow(id);
    if (status === "approved") {
      const blockers = publishBlockers({ ...item, photos });
      if (blockers.length) throw new ActionError(blockers[0]);
    }
    await getDb()
      .update(galleryItems)
      .set({ status, publishedAt: status === "approved" ? (item.publishedAt ?? new Date()) : item.publishedAt })
      .where(eq(galleryItems.id, id));
    await logAudit(staffId, `gallery.${status === "approved" ? "published" : status}`, "gallery_item", id);
    if (status === "approved" || item.status === "approved") updateTag(GALLERY_TAG);
  });
}

const attachSchema = z.object({
  caseId,
  view: z.enum(GALLERY_VIEWS),
  side: z.enum(GALLERY_SIDES),
  url: z.url(),
  width: z.number().int().positive().max(20_000).nullable(),
  height: z.number().int().positive().max(20_000).nullable(),
});

/**
 * Link a photo the browser just uploaded to the private store. Its details are read back from
 * the store (head), so only files in this case's folder, of an allowed type and size, are accepted.
 * A photo that replaces an older one deletes the old file.
 */
export async function attachGalleryPhoto(input: z.input<typeof attachSchema>): Promise<ActionResult> {
  const parsed = attachSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid upload." };
  const d = parsed.data;
  return run(async (staffId) => {
    const { item, photos } = await loadOrThrow(d.caseId);
    if (item.isSample) throw new ActionError("Sample cases use placeholder art. Create a new case for real photos.");
    const info = await head(d.url, galleryBlob()).catch(() => null);
    if (!info) throw new ActionError("The upload couldn't be found. Please try again.");
    if (!info.pathname.startsWith(galleryPhotoPrefix(d.caseId))) throw new ActionError("This photo belongs to another case.");
    if (!(GALLERY_PHOTO_TYPES as readonly string[]).includes(info.contentType)) throw new ActionError("Only JPG, PNG or WebP photos.");
    if (info.size > GALLERY_MAX_BYTES) throw new ActionError("Photos are limited to 15 MB.");

    const old = photos.find((p) => p.view === d.view && p.side === d.side);
    const db = getDb();
    const [oldRow] = old
      ? await db.select({ pathname: galleryPhotos.pathname }).from(galleryPhotos).where(eq(galleryPhotos.id, old.id))
      : [];
    if (old) await db.delete(galleryPhotos).where(eq(galleryPhotos.id, old.id));
    await db.insert(galleryPhotos).values({
      itemId: d.caseId,
      view: d.view,
      side: d.side,
      pathname: info.pathname,
      contentType: info.contentType,
      size: info.size,
      width: d.width,
      height: d.height,
      uploadedBy: staffId,
    });
    if (oldRow) await del(oldRow.pathname, galleryBlob()).catch(() => undefined);
    await logAudit(staffId, old ? "gallery.photo_replaced" : "gallery.photo_added", "gallery_item", d.caseId);
    refreshPublic(item.status);
  });
}

export async function removeGalleryPhoto(caseIdValue: number, photoId: number): Promise<ActionResult> {
  if (!caseId.safeParse(caseIdValue).success || !caseId.safeParse(photoId).success) return { ok: false, error: "Invalid photo." };
  return run(async (staffId) => {
    const { item } = await loadOrThrow(caseIdValue);
    const db = getDb();
    const [photo] = await db
      .delete(galleryPhotos)
      .where(and(eq(galleryPhotos.id, photoId), eq(galleryPhotos.itemId, caseIdValue)))
      .returning({ pathname: galleryPhotos.pathname });
    if (!photo) throw new ActionError("This photo no longer exists.");
    await del(photo.pathname, galleryBlob()).catch(() => undefined);
    // A published case can't stay public with a missing photo.
    if (item.status === "approved" && !item.isSample) {
      await db.update(galleryItems).set({ status: "pending" }).where(eq(galleryItems.id, caseIdValue));
    }
    await logAudit(staffId, "gallery.photo_removed", "gallery_item", caseIdValue);
    refreshPublic(item.status);
  });
}

/** Permanently delete a case and its photo files. */
export async function deleteCase(id: number): Promise<ActionResult> {
  if (!caseId.safeParse(id).success) return { ok: false, error: "Invalid case." };
  const result = await run(async (staffId) => {
    const { item } = await loadOrThrow(id);
    const db = getDb();
    const files = await db.select({ pathname: galleryPhotos.pathname }).from(galleryPhotos).where(eq(galleryPhotos.itemId, id));
    if (files.length) await del(files.map((f) => f.pathname), galleryBlob());
    await db.delete(galleryItems).where(eq(galleryItems.id, id)); // photos cascade
    await logAudit(staffId, "gallery.deleted", "gallery_item", id);
    refreshPublic(item.status);
  });
  if (!result.ok) return result;
  redirect("/admin/gallery");
}
