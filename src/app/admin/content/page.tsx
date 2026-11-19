import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronRight } from "lucide-react";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ButtonLink } from "@/components/ui/button-link";
import { pageSchema } from "@/lib/cms/page-schema";
import { listDocuments, listDocumentStates } from "@/lib/cms/store";
import { categories, procedures } from "@/lib/content/procedures";

export const metadata: Metadata = { title: "Pages" };

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Pages</h1>
        <p className="mt-1 max-w-2xl text-sm text-stone">
          Edit the text, prices and photos of the site&rsquo;s pages. Changes are saved as a draft you can preview, and go
          live when you publish.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ProcedureList />
      </Suspense>
    </div>
  );
}

async function loadStates() {
  await connection();
  const [procedureStates, home, settings, seo, pageDocs] = await Promise.all([
    listDocumentStates("procedure"),
    listDocumentStates("home"),
    listDocumentStates("settings"),
    listDocumentStates("seo"),
    listDocuments("page"),
  ]);
  const customPages = pageDocs
    .map((d) => {
      const data = pageSchema.safeParse(d.draft ?? d.published);
      return { slug: d.key, title: data.success ? data.data.title : d.key, hasDraft: d.draft != null, hasPublished: d.published != null };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
  return { procedureStates, customPages, singles: { home: home.get("main"), settings: settings.get("main"), seo: seo.get("main") } };
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
  const { procedureStates: states, customPages, singles } = await loadStates();

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
    <section aria-labelledby="custom-pages-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="custom-pages-heading" className="font-heading text-xl">
            Custom pages
          </h2>
          <p className="text-sm text-stone">Pages you build from ready-made sections, like campaign landing pages.</p>
        </div>
        <ButtonLink href="/admin/content/pages/new" variant="outline">
          New page
        </ButtonLink>
      </div>
      {customPages.length === 0 ? (
        <p className="rounded-sm border border-line p-6 text-center text-sm text-stone">No custom pages yet.</p>
      ) : (
        <ul className="divide-y divide-line rounded-sm border border-line">
          {customPages.map((pg) => (
            <li key={pg.slug}>
              <Link href={`/admin/content/pages/${pg.slug}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-cream/50">
                <span>
                  <span className="block font-medium">{pg.title}</span>
                  <span className="text-xs text-stone">/{pg.slug}</span>
                </span>
                <span className="flex items-center gap-2">
                  {pg.hasDraft && <Badge className="bg-sand/40 text-ink">Draft</Badge>}
                  {pg.hasPublished ? (
                    <Badge className="bg-emerald-100 text-emerald-900">Live</Badge>
                  ) : (
                    <span className="text-xs text-stone">Not published</span>
                  )}
                  <ChevronRight className="size-4 text-stone" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
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
