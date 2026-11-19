"use client";

import { useId, useState, useTransition } from "react";
import Image from "next/image";
import { uploadPresigned } from "@vercel/blob/client";
import { ImageUp, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { attachGalleryPhoto, removeGalleryPhoto } from "@/app/admin/gallery/actions";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/admin/media-meta";
import {
  GALLERY_MAX_BYTES,
  GALLERY_PHOTO_TYPES,
  GALLERY_SIDES,
  galleryPhotoPrefix,
  staffPhotoUrl,
  type GallerySide,
} from "@/lib/gallery/meta";
import type { View } from "@/lib/content/gallery";
import { cn } from "@/lib/utils";

type Photo = { id: number; view: string; side: string; width: number | null; height: number | null; size: number };

const extFor: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

async function imageSize(file: File) {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return { width: null, height: null };
  }
}

/** Before/after upload slots for each photo angle of a case. */
export function PhotoGrid({ caseId, views, photos }: { caseId: number; views: string[]; photos: Photo[] }) {
  return (
    <div className="space-y-6">
      {views.map((view) => (
        <div key={view}>
          <h3 className="mb-2 text-sm font-medium">{view}</h3>
          <div className="grid max-w-xl grid-cols-2 gap-3">
            {GALLERY_SIDES.map((side) => (
              <PhotoSlot
                key={side}
                caseId={caseId}
                view={view}
                side={side}
                photo={photos.find((p) => p.view === view && p.side === side)}
              />
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs text-stone">
        JPG, PNG or WebP up to {formatBytes(GALLERY_MAX_BYTES)}. Use the same lighting, pose and framing for before and
        after, and don’t retouch results. Photos are stored privately and are only shown publicly once the case is
        published with consent.
      </p>
    </div>
  );
}

function PhotoSlot({ caseId, view, side, photo }: { caseId: number; view: string; side: GallerySide; photo?: Photo }) {
  const [busy, setBusy] = useState(false);
  const [removing, startRemove] = useTransition();
  const inputId = useId();
  const label = `${view} ${side}`;

  async function upload(file: File) {
    if (!(GALLERY_PHOTO_TYPES as readonly string[]).includes(file.type)) {
      toast.error("Only JPG, PNG or WebP photos.");
      return;
    }
    if (file.size > GALLERY_MAX_BYTES) {
      toast.error(`That photo is ${formatBytes(file.size)}. The limit is ${formatBytes(GALLERY_MAX_BYTES)}.`);
      return;
    }
    setBusy(true);
    try {
      const { width, height } = await imageSize(file);
      // Generated name: the original file name may contain the patient's name.
      const path = `${galleryPhotoPrefix(caseId)}${view.toLowerCase()}-${side}.${extFor[file.type]}`;
      const blob = await uploadPresigned(path, file, {
        access: "private",
        handleUploadUrl: "/api/admin/gallery/upload",
        contentType: file.type,
      });
      const res = await attachGalleryPhoto({ caseId, view: view as View, side, url: blob.url, width, height });
      if (!res.ok) throw new Error(res.error);
      toast.success(`${label} photo uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative aspect-[4/5] overflow-hidden rounded-sm border bg-cream/50",
          photo ? "border-line" : "border-dashed border-line",
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file && !busy) void upload(file);
        }}
      >
        {photo ? (
          <Image
            src={staffPhotoUrl(photo.id)}
            alt={`${label} photo`}
            fill
            unoptimized // private photos never go through the shared image optimizer cache
            className="object-cover"
            sizes="16rem"
          />
        ) : (
          <label
            htmlFor={inputId}
            className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 p-3 text-center text-xs text-stone hover:text-ink"
          >
            {busy ? <Loader2 className="size-5 animate-spin text-bronze" aria-hidden /> : <ImageUp className="size-5 text-bronze" aria-hidden />}
            {busy ? "Uploading…" : <>Drop or choose the <strong className="font-medium">{side}</strong> photo</>}
          </label>
        )}
        <span
          className={cn(
            "pointer-events-none absolute top-2 left-2 px-1.5 py-0.5 text-[0.625rem] tracking-[0.18em] uppercase",
            side === "before" ? "bg-ivory/90 text-ink" : "bg-ink/85 text-ivory",
          )}
        >
          {side}
        </span>
        {busy && photo && (
          <div className="absolute inset-0 grid place-items-center bg-ivory/70">
            <Loader2 className="size-5 animate-spin text-bronze" aria-label="Uploading" />
          </div>
        )}
      </div>

      <input
        id={inputId}
        type="file"
        accept={GALLERY_PHOTO_TYPES.join(",")}
        className="sr-only"
        disabled={busy}
        aria-label={`Upload ${label} photo`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />
      {photo && (
        <div className="flex items-center justify-between gap-2 text-xs text-stone">
          <span>
            {photo.width && photo.height ? `${photo.width}×${photo.height} · ` : ""}
            {formatBytes(photo.size)}
          </span>
          <span className="flex gap-1">
            <label
              htmlFor={inputId}
              className="cursor-pointer rounded-sm px-2 py-1 text-bronze hover:bg-cream hover:text-bronze-deep"
            >
              Replace
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={removing || busy}
              aria-label={`Remove ${label} photo`}
              onClick={() =>
                startRemove(async () => {
                  const res = await removeGalleryPhoto(caseId, photo.id);
                  if (res.ok) toast.success(`${label} photo removed`);
                  else toast.error(res.error);
                })
              }
            >
              <Trash2 className="size-3.5" aria-hidden />
            </Button>
          </span>
        </div>
      )}
    </div>
  );
}
