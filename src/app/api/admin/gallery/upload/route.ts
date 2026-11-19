import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { getStaff } from "@/lib/admin/session";
import { GALLERY_FOLDER, GALLERY_MAX_BYTES, GALLERY_PHOTO_TYPES } from "@/lib/gallery/meta";
import { galleryBlob } from "@/lib/gallery/store";

/**
 * Presigned uploads into the PRIVATE gallery store (same flow as the media library).
 * Staff only, images only, and only under gallery/cases/<id>/. The browser then calls the
 * `attachGalleryPhoto` action, which checks the file and links it to the case.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadPresignedBody;
  // We record uploads ourselves (a Server Action after the upload), so completion callbacks are
  // never accepted. The SDK still requires a webhook key, which only verifies those callbacks.
  if (body?.type !== "blob.generate-presigned-url") return Response.json({ error: "Unsupported event" }, { status: 400 });
  try {
    const result = await handleUploadPresigned({
      body,
      request,
      webhookPublicKey: process.env.BLOB_WEBHOOK_PUBLIC_KEY || "callbacks-disabled",
      getSignedToken: async (pathname) => {
        if (!(await getStaff())) throw new Error("Unauthorized");
        if (!/^gallery\/cases\/\d+\/[\w.-]+$/.test(pathname) || !pathname.startsWith(GALLERY_FOLDER)) {
          throw new Error("Invalid upload path");
        }
        const rules = { allowedContentTypes: [...GALLERY_PHOTO_TYPES], maximumSizeInBytes: GALLERY_MAX_BYTES };
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          validUntil: Date.now() + 10 * 60_000,
          ...rules,
          ...galleryBlob(),
        });
        return { token, urlOptions: { ...rules, addRandomSuffix: true } };
      },
    });
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 400 });
  }
}
