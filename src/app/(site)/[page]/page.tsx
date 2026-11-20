import { Suspense } from "react";
import type { Metadata } from "next";
import { notFoundMetadata } from "@/lib/seo/not-found";
import { notFound } from "next/navigation";
import { PageBlocks } from "@/components/blocks/page-blocks";
import { Container } from "@/components/ds";
import { getPage, getPages } from "@/lib/cms/pages";
import { site } from "@/lib/site";

/**
 * Pages built from sections in the admin (Pages → Custom pages), at /<slug>. Fixed routes such
 * as /about always win over this one, and page slugs can't use those names (pageSlugSchema).
 */
export async function generateStaticParams() {
  const slugs = [...(await getPages()).keys()].map((page) => ({ page }));
  // Cache Components needs at least one param to prerender; this placeholder just 404s.
  return slugs.length ? slugs : [{ page: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/[page]">): Promise<Metadata> {
  const slug = (await params).page;
  const p = await getPage(slug);
  if (!p) return notFoundMetadata;
  return {
    title: p.seo.title || p.title,
    description: p.seo.description || undefined,
    alternates: { canonical: `/${slug}` },
    // The demo is noindex site-wide anyway; this keeps a single page out of search on a live site.
    ...(p.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: { siteName: site.name },
  };
}

export default function BuiltPage({ params }: PageProps<"/[page]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}

function PageSkeleton() {
  return (
    <Container size="wide" className="grid gap-10 pt-24 pb-(--section-y) md:grid-cols-2" aria-busy="true">
      <div className="space-y-5">
        <div className="h-14 w-3/4 animate-pulse bg-line" />
        <div className="h-24 w-full animate-pulse bg-line/60" />
      </div>
      <div className="aspect-[4/5] w-full max-w-md animate-pulse bg-line/60" />
    </Container>
  );
}

async function PageContent({ params }: { params: PageProps<"/[page]">["params"] }) {
  const p = await getPage((await params).page);
  if (!p) notFound();
  return <PageBlocks title={p.title} blocks={p.blocks} />;
}
