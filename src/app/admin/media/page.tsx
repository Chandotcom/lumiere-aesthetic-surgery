import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { MediaLibrary } from "@/components/admin/media/media-library";
import { Skeleton } from "@/components/ui/skeleton";
import { hasMediaStore, listMedia } from "@/lib/admin/media";

export const metadata: Metadata = { title: "Media" };

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Media</h1>
        <p className="mt-1 max-w-2xl text-sm text-stone">
          Photos for your pages and journal. Upload here, or straight from any editor with &ldquo;Choose from
          library&rdquo;. Patient before/after photos never go here: they belong in the consent-gated gallery.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Library />
      </Suspense>
    </div>
  );
}

async function load() {
  await connection();
  return listMedia();
}

async function Library() {
  if (!hasDatabase()) return <DbNotice />;
  if (!hasMediaStore()) {
    return (
      <div className="rounded-sm border border-line bg-cream/60 p-4 text-sm text-stone">
        <p className="font-medium text-ink">Media storage not connected</p>
        <p className="mt-1">
          Create a public Vercel Blob store and set <code className="text-xs">BLOB_READ_WRITE_TOKEN</code> in{" "}
          <code className="text-xs">.env.local</code>.
        </p>
      </div>
    );
  }
  return <MediaLibrary items={await load()} />;
}
