// Gallery constants shared by server code and admin client components (so: not server-only).
import type { View } from "@/lib/content/gallery";

export const GALLERY_VIEWS = ["Front", "Profile", "Oblique"] as const satisfies readonly View[];
export const GALLERY_SIDES = ["before", "after"] as const;
export type GallerySide = (typeof GALLERY_SIDES)[number];

export const GALLERY_AGE_RANGES = ["18–24", "25–34", "35–44", "45–54", "55–64", "65+"] as const;

export const consentScopes = {
  website: "Website only",
  website_social: "Website and social media",
} as const;
export type ConsentScope = keyof typeof consentScopes;

export const galleryStatusLabel = { pending: "Pending review", approved: "Published", hidden: "Hidden" } as const;
export type GalleryStatus = keyof typeof galleryStatusLabel;
export const isGalleryStatus = (v: unknown): v is GalleryStatus =>
  typeof v === "string" && v in galleryStatusLabel;

/** Photos are stored under gallery/cases/<case id>/ in the PRIVATE store. */
export const GALLERY_FOLDER = "gallery/cases/";
export const galleryPhotoPrefix = (caseId: number) => `${GALLERY_FOLDER}${caseId}/`;
export const GALLERY_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const GALLERY_MAX_BYTES = 15 * 1024 * 1024;

export const caseSlug = (c: { procedureSlug: string; number: number }) => `${c.procedureSlug}-${c.number}`;

/** Public, consent-checked image URL. */
export const publicPhotoUrl = (photoId: number) => `/api/gallery-image/${photoId}`;
/** Staff-only image URL (any status), used in the admin. */
export const staffPhotoUrl = (photoId: number) => `/api/admin/gallery/photo/${photoId}`;

/** What still blocks publishing a case. An empty list means it can be approved. */
export function publishBlockers(c: {
  consentSigned: boolean;
  isSample: boolean;
  views: readonly string[];
  photos: readonly { view: string; side: string }[];
}): string[] {
  const out: string[] = [];
  if (!c.consentSigned) out.push("Record the patient’s signed photo consent.");
  if (c.views.length === 0) out.push("Choose at least one photo angle.");
  if (!c.isSample) {
    const missing = c.views.flatMap((v) =>
      GALLERY_SIDES.filter((s) => !c.photos.some((p) => p.view === v && p.side === s)).map((s) => `${v} ${s}`),
    );
    if (missing.length) out.push(`Upload the missing photos: ${missing.join(", ").toLowerCase()}.`);
  }
  return out;
}
