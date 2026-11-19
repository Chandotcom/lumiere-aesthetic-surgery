import { getStaffWith } from "@/lib/admin/session";
import { serveGalleryPhoto } from "@/lib/gallery/serve";

/** Staff-only view of any gallery photo, including cases that aren't published. */
export async function GET(_request: Request, ctx: RouteContext<"/api/admin/gallery/photo/[id]">) {
  if (!(await getStaffWith("gallery"))) return new Response("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });
  return serveGalleryPhoto((await ctx.params).id, { publicOnly: false });
}
