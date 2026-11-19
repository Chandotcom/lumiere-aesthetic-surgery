import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getStaff } from "@/lib/admin/session";
import { mediaToken } from "@/lib/admin/media";
import { MEDIA_FOLDER, MEDIA_MAX_BYTES, MEDIA_TYPES } from "@/lib/admin/media-meta";

/**
 * Issues short-lived tokens so the browser uploads straight to Vercel Blob. This avoids the
 * ~1 MB Server Action and 4.5 MB function body limits. Only signed-in staff get a token, and
 * only for images under the size limit in the media/ folder. The browser then calls the
 * `registerMedia` action, which checks the file really exists before recording it.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      token: mediaToken(),
      onBeforeGenerateToken: async (pathname) => {
        if (!(await getStaff())) throw new Error("Unauthorized");
        if (!pathname.startsWith(MEDIA_FOLDER)) throw new Error("Invalid upload path");
        return {
          allowedContentTypes: [...MEDIA_TYPES],
          maximumSizeInBytes: MEDIA_MAX_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 400 });
  }
}
