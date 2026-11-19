"use client";

import { useId, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { ImageUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { registerMedia } from "@/app/admin/media/actions";
import {
  formatBytes,
  MEDIA_FOLDER,
  MEDIA_MAX_BYTES,
  MEDIA_TYPES,
  safeFileName,
} from "@/lib/admin/media-meta";
import { cn } from "@/lib/utils";

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

/** Uploads files straight to Vercel Blob, then records them in the media library. */
export function useMediaUpload(onUploaded?: (url: string) => void) {
  const [busy, setBusy] = useState(0);

  async function uploadOne(file: File) {
    if (!(MEDIA_TYPES as readonly string[]).includes(file.type)) {
      toast.error(`${file.name}: only JPG, PNG, WebP or AVIF images.`);
      return;
    }
    if (file.size > MEDIA_MAX_BYTES) {
      toast.error(`${file.name} is ${formatBytes(file.size)}. The limit is ${formatBytes(MEDIA_MAX_BYTES)}.`);
      return;
    }
    setBusy((n) => n + 1);
    try {
      const { width, height } = await imageSize(file);
      const blob = await upload(`${MEDIA_FOLDER}${safeFileName(file.name)}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/media/upload",
        contentType: file.type,
      });
      const res = await registerMedia({ url: blob.url, alt: "", width, height });
      if (!res.ok) throw new Error(res.error);
      toast.success(`${file.name} uploaded. Add alt text so screen-reader users know what it shows.`);
      onUploaded?.(blob.url);
    } catch (err) {
      toast.error(`${file.name}: ${err instanceof Error ? err.message : "upload failed"}`);
    } finally {
      setBusy((n) => n - 1);
    }
  }

  return {
    busy: busy > 0,
    upload: async (files: FileList | File[]) => {
      for (const file of Array.from(files)) await uploadOne(file);
    },
  };
}

/** Click-or-drop upload area. */
export function MediaDropzone({ onUploaded, className }: { onUploaded?: (url: string) => void; className?: string }) {
  const { busy, upload: uploadFiles } = useMediaUpload(onUploaded);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files.length) void uploadFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-line px-4 py-8 text-center text-sm text-stone transition-colors",
        over && "border-bronze bg-cream/60",
        className,
      )}
    >
      {busy ? <Loader2 className="size-6 animate-spin text-bronze" aria-hidden /> : <ImageUp className="size-6 text-bronze" aria-hidden />}
      <p>
        {busy ? "Uploading…" : "Drag images here, or "}
        {!busy && (
          <label htmlFor={id} className="cursor-pointer text-bronze underline-offset-4 hover:underline">
            choose files
          </label>
        )}
      </p>
      <p className="text-xs">JPG, PNG, WebP or AVIF, up to {formatBytes(MEDIA_MAX_BYTES)}</p>
      <input
        ref={input}
        id={id}
        type="file"
        multiple
        accept={MEDIA_TYPES.join(",")}
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          if (e.target.files?.length) void uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
