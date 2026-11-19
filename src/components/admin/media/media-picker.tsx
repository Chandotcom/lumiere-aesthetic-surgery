"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Images, Loader2 } from "lucide-react";
import { listMediaForPicker } from "@/app/admin/media/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MediaItem } from "@/lib/admin/media-meta";
import { cn } from "@/lib/utils";
import { MediaDropzone } from "./media-upload";

/** "Choose from library" button + dialog. Calls `onSelect` with the chosen image. */
export function MediaPicker({ onSelect }: { onSelect: (item: { url: string; alt: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [loading, startLoading] = useTransition();

  const load = () =>
    startLoading(async () => {
      try {
        setItems(await listMediaForPicker());
      } catch {
        setItems([]);
      }
    });

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setOpen(true);
          load();
        }}
      >
        <Images /> Choose from library
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Media library</DialogTitle>
            <DialogDescription>Pick an image, or upload a new one.</DialogDescription>
          </DialogHeader>
          <MediaDropzone onUploaded={load} className="py-5" />
          {loading && !items ? (
            <p className="flex items-center gap-2 text-sm text-stone">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Loading…
            </p>
          ) : !items?.length ? (
            <p className="text-sm text-stone">No images yet. Upload one above.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect({ url: item.url, alt: item.alt });
                      setOpen(false);
                    }}
                    className="group block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
                  >
                    <span className="relative block aspect-square overflow-hidden rounded-sm bg-cream">
                      <Image src={item.url} alt="" fill sizes="200px" className="object-cover transition-transform group-hover:scale-105" />
                    </span>
                    <span className={cn("mt-1 block truncate text-xs", item.alt ? "text-stone" : "text-destructive")}>
                      {item.alt || "No alt text yet"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
