// Upload rules shared by the browser (instant feedback) and the server (enforcement).

export const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MEDIA_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
/** Every media-library upload lives under this folder in the Blob store. */
export const MEDIA_FOLDER = "media/";

export type MediaItem = {
  id: number;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  size: number;
  contentType: string;
  createdAt: string; // ISO
};

/** "Before & After (1).JPG" → "before-after-1.jpg" */
export function safeFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  return `${base || "image"}${ext ? `.${ext}` : ""}`;
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
