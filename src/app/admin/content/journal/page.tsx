import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronRight, Plus } from "lucide-react";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Skeleton } from "@/components/ui/skeleton";
import { postSchema } from "@/lib/cms/schemas";
import { listDocuments } from "@/lib/cms/store";
import { posts as builtInPosts } from "@/lib/content/journal";

export const metadata: Metadata = { title: "Journal" };

export default function JournalAdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl">Journal</h1>
          <p className="mt-1 max-w-2xl text-sm text-stone">
            Write and manage articles. New posts start as drafts you can preview, and appear on the site when you
            publish them.
          </p>
        </div>
        <ButtonLink href="/admin/content/journal/new">
          <Plus /> New post
        </ButtonLink>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <JournalList />
      </Suspense>
    </div>
  );
}

async function loadPosts() {
  await connection();
  return listDocuments("post");
}

/** Built-in articles plus posts created in the admin, newest first, with their status. */
async function JournalList() {
  if (!hasDatabase()) return <DbNotice />;
  const docs = new Map((await loadPosts()).map((d) => [d.key, d]));
  const keys = [...new Set([...builtInPosts.map((p) => p.slug), ...docs.keys()])];

  const rows = keys.map((slug) => {
    const doc = docs.get(slug);
    const builtIn = builtInPosts.find((p) => p.slug === slug);
    const latest = postSchema.safeParse(doc?.draft ?? doc?.published);
    const live = postSchema.safeParse(doc?.published);
    return {
      slug,
      builtIn: !!builtIn,
      title: latest.success ? latest.data.title : (builtIn?.title ?? slug),
      date: latest.success ? latest.data.publishedAt : (builtIn?.publishedAt ?? ""),
      hasDraft: doc?.draft != null,
      // Built-in posts are live unless hidden; custom posts only once published.
      isLive: live.success ? live.data.visible : !!builtIn,
      isEdited: doc?.published != null,
    };
  });
  rows.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ul className="divide-y divide-line rounded-sm border border-line">
      {rows.map((r) => (
        <li key={r.slug}>
          <Link
            href={`/admin/content/journal/${r.slug}`}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-cream/50"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{r.title}</span>
              <span className="text-xs text-stone">
                {r.date} · /blog/{r.slug}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {r.hasDraft && <Badge className="bg-sand/40 text-ink">Draft</Badge>}
              {!r.isLive ? (
                <Badge className="bg-stone/10 text-stone">{r.builtIn || r.isEdited ? "Hidden" : "Not published"}</Badge>
              ) : r.builtIn && !r.isEdited ? (
                <span className="text-xs text-stone">Default</span>
              ) : (
                <Badge className="bg-emerald-100 text-emerald-900">{r.builtIn ? "Edited" : "Live"}</Badge>
              )}
              <ChevronRight className="size-4 text-stone" aria-hidden />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
