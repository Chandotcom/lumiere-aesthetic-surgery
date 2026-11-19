import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { resolveKind } from "@/lib/cms/registry";
import { getStaffWith } from "@/lib/admin/session";

/**
 * Staff-only: turn on Draft Mode, then open the public page for one content document.
 * GET because it's opened in a new tab from the editor. The redirect target is built from
 * the content registry, never taken from the URL, so this can't be used as an open redirect.
 */
export async function GET(request: Request) {
  if (!(await getStaffWith("content"))) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") ?? "";
  const key = searchParams.get("key") ?? "";
  const def = resolveKind(kind, key);
  if (!def) return new Response("Unknown content", { status: 404 });

  (await draftMode()).enable();
  redirect(def.previewPath(key));
}
