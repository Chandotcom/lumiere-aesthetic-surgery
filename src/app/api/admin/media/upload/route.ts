import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { getStaff } from "@/lib/admin/session";
import { mediaToken } from "@/lib/admin/media";
import { MEDIA_FOLDER, MEDIA_MAX_BYTES, MEDIA_TYPES } from "@/lib/admin/media-meta";

/**
 * Issues short-lived presigned upload URLs, so the browser uploads straight to Vercel Blob.
 * This avoids the ~1 MB Server Action and 4.5 MB function body limits.
 *
 * Presigned uploads work with both kinds of credentials: a read-write token (local
 * BLOB_READ_WRITE_TOKEN) and the short-lived OIDC credentials Vercel uses for connected stores
 * (BLOB_STORE_ID). The older `handleUpload` only works with a read-write token.
 *
 * Only signed-in staff get a URL, and only for images under the size limit in media/. The
 * browser then calls the `registerMedia` action, which re-reads the file before recording it.
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
        if (!pathname.startsWith(MEDIA_FOLDER) || pathname.includes("..")) throw new Error("Invalid upload path");
        const rules = { allowedContentTypes: [...MEDIA_TYPES], maximumSizeInBytes: MEDIA_MAX_BYTES };
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          validUntil: Date.now() + 10 * 60_000,
          ...rules,
          token: mediaToken(), // undefined on Vercel → OIDC + BLOB_STORE_ID
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
