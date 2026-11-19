import { cacheLife } from "next/cache";
import { isPreview } from "@/lib/cms/read";
import { ExitPreviewForm } from "./exit-preview-form";

/**
 * Shown only while a staff member previews drafts (Draft Mode). Cached, so for normal
 * visitors it's part of the static shell and renders nothing; in Draft Mode the cache is
 * bypassed and it re-renders on every request.
 */
export async function PreviewBanner() {
  "use cache";
  // Without this, the default 15-minute lifetime would apply to every public page.
  cacheLife("max");
  if (!(await isPreview())) return null;
  return (
    <div role="status" className="bg-bronze text-white">
      <div className="container-wide flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
        <p>
          <strong className="font-medium">Preview mode:</strong> you&rsquo;re seeing unpublished drafts. Visitors
          still see the published site.
        </p>
        <ExitPreviewForm />
      </div>
    </div>
  );
}
