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
import { listDocuments, listDocumentStates } from "@/lib/cms/store";
import { posts as builtInPosts } from "@/lib/content/journal";
import { categories, procedures } from "@/lib/content/procedures";

export const metadata: Metadata = { title: "Site content" };

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Site content</h1>
        <p className="mt-1 max-w-2xl text-sm text-stone">
          Edit the text, prices and photos on the public site. Changes are saved as a draft you can preview, and go
          live when you publish.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ProcedureList />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
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
  if (!hasDatabase()) return null;
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
    <section id="journal" aria-labelledby="journal-heading" className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 id="journal-heading" className="font-heading text-xl">
          Journal
        </h2>
        <ButtonLink href="/admin/content/journal/new" size="sm">
          <Plus /> New post
        </ButtonLink>
      </div>
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
    </section>
  );
}

async function loadStates() {
  await connection();
  const [procedureStates, home, settings, seo] = await Promise.all([
    listDocumentStates("procedure"),
    listDocumentStates("home"),
    listDocumentStates("settings"),
    listDocumentStates("seo"),
  ]);
  return { procedureStates, singles: { home: home.get("main"), settings: settings.get("main"), seo: seo.get("main") } };
}

type DocState = { hasDraft: boolean; hasPublished: boolean } | undefined;

function StateBadges({ s }: { s: DocState }) {
  return (
    <span className="flex items-center gap-2">
      {s?.hasDraft && <Badge className="bg-sand/40 text-ink">Draft</Badge>}
      {s?.hasPublished ? (
        <Badge className="bg-emerald-100 text-emerald-900">Edited</Badge>
      ) : (
        <span className="text-xs text-stone">Default</span>
      )}
      <ChevronRight className="size-4 text-stone" aria-hidden />
    </span>
  );
}

async function ProcedureList() {
  if (!hasDatabase()) return <DbNotice />;
  const { procedureStates: states, singles } = await loadStates();

  const pages = [
    { href: "/admin/content/home", label: "Homepage", hint: "Hero, philosophy, surgeon, journey, stories, FAQ, closing banner", s: singles.home },
    { href: "/admin/content/settings", label: "Contact details", hint: "Phone, email, address, opening hours", s: singles.settings },
    { href: "/admin/content/seo", label: "SEO titles & descriptions", hint: "How the main pages appear in search results", s: singles.seo },
  ];

  return (
    <div className="space-y-10">
    <section aria-labelledby="pages-heading" className="space-y-4">
      <h2 id="pages-heading" className="font-heading text-xl">
        Pages & settings
      </h2>
      <ul className="divide-y divide-line rounded-sm border border-line">
        {pages.map((p) => (
          <li key={p.href}>
            <Link href={p.href} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-cream/50">
              <span>
                <span className="block font-medium">{p.label}</span>
                <span className="text-xs text-stone">{p.hint}</span>
              </span>
              <StateBadges s={p.s} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
    <section aria-labelledby="procedures-heading" className="space-y-4">
      <h2 id="procedures-heading" className="font-heading text-xl">
        Procedures
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        {categories.map((c) => (
          <div key={c.id} className="rounded-sm border border-line">
            <h3 className="border-b border-line px-4 py-2.5 text-sm font-medium">{c.name}</h3>
            <ul className="divide-y divide-line">
              {procedures
                .filter((p) => p.category === c.name)
                .map((p) => {
                  const s = states.get(p.slug);
                  return (
                    <li key={p.slug}>
                      <Link
                        href={`/admin/content/procedures/${p.slug}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-cream/50"
                      >
                        <span>{p.name}</span>
                        <StateBadges s={s} />
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
    </section>
    </div>
  );
}
