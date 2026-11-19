import { serveGalleryPhoto } from "@/lib/gallery/serve";

/** Public gallery photo. 404 unless the case is approved and consent is recorded. */
export async function GET(_request: Request, ctx: RouteContext<"/api/gallery-image/[id]">) {
  return serveGalleryPhoto((await ctx.params).id, { publicOnly: true });
}
