import "server-only";
import { put } from "@vercel/blob";

/** Upload an image (gallery / blog cover) to Vercel Blob. Call only from authenticated admin actions. */
export async function uploadImage(file: File, folder: "gallery" | "blog") {
  if (!file.type.startsWith("image/")) throw new Error("Only image uploads are allowed.");
  const { url } = await put(`${folder}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return url;
}
