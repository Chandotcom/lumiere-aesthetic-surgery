"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMedia, updateMediaAlt } from "@/app/admin/media/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBytes, type MediaItem } from "@/lib/admin/media-meta";
import { MediaDropzone } from "./media-upload";

export function MediaLibrary({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <MediaDropzone onUploaded={() => router.refresh()} />
      {items.length === 0 ? (
        <p className="rounded-sm border border-line p-8 text-center text-sm text-stone">
          No images yet. Uploads appear here and in the image picker of every editor.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

function MediaCard({ item }: { item: MediaItem }) {
  const [pending, startTransition] = useTransition();
  const [alt, setAlt] = useState(item.alt);
  const [confirmForce, setConfirmForce] = useState<string | null>(null);
  const missingAlt = !item.alt.trim();

  const remove = (force: boolean) =>
    startTransition(async () => {
      const res = await deleteMedia(item.id, force);
      if (res.ok) toast.success("Image deleted");
      else if (!force && res.error.startsWith("Still used on")) setConfirmForce(res.error);
      else toast.error(res.error);
    });

  return (
    <li className="overflow-hidden rounded-sm border border-line">
      <div className="relative aspect-[4/3] bg-cream">
        <Image src={item.url} alt={item.alt} fill sizes="(min-width: 1280px) 20vw, (min-width: 840px) 30vw, 100vw" className="object-cover" />
      </div>
      <div className="space-y-2 p-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const res = await updateMediaAlt(item.id, alt);
              if (res.ok) toast.success("Alt text saved");
              else toast.error(res.error);
            });
          }}
        >
          <Input
            aria-label="Alt text"
            placeholder="Describe the image (alt text)"
            value={alt}
            maxLength={200}
            onChange={(e) => setAlt(e.target.value)}
            aria-invalid={missingAlt || undefined}
          />
          <Button type="submit" size="sm" variant="outline" disabled={pending || alt === item.alt}>
            Save
          </Button>
        </form>
        {missingAlt && <p className="text-xs text-destructive">Add alt text before using this image on the site.</p>}
        <div className="flex items-center justify-between gap-2 text-xs text-stone">
          <span>
            {item.width && item.height ? `${item.width}×${item.height} · ` : ""}
            {formatBytes(item.size)}
          </span>
          <span className="flex gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Copy image URL"
              onClick={() => navigator.clipboard.writeText(item.url).then(() => toast.success("URL copied"))}
            >
              <Copy />
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label="Delete image" disabled={pending} onClick={() => remove(false)}>
              <Trash2 />
            </Button>
          </span>
        </div>
        {confirmForce && (
          <div className="space-y-2 rounded-sm bg-cream/60 p-2 text-xs">
            <p>{confirmForce}</p>
            <div className="flex gap-2">
              <Button size="xs" variant="destructive" disabled={pending} onClick={() => remove(true)}>
                Delete anyway
              </Button>
              <Button size="xs" variant="ghost" onClick={() => setConfirmForce(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
