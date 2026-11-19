import { Suspense } from "react";
import type { Metadata } from "next";
import { seoMetadata } from "@/lib/cms/settings";
import { Container, Eyebrow, Heading } from "@/components/ds";
import { JournalBrowser } from "@/components/journal/journal-browser";
import { PostCard } from "@/components/journal/post-card";
import { JsonLd } from "@/components/seo/json-ld";
import { getPosts } from "@/lib/cms/journal";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { site } from "@/lib/site";

export function generateMetadata(): Promise<Metadata> {
  return seoMetadata("blog");
}

export default async function JournalPage() {
  const posts = await getPosts();
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Journal", path: "/blog" },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: `The Journal — ${site.name}`,
          url: new URL("/blog", site.url).toString(),
          blogPost: posts.map((p) => ({
            "@type": "BlogPosting",
            headline: p.title,
            url: new URL(`/blog/${p.slug}`, site.url).toString(),
            datePublished: p.publishedAt,
          })),
        }}
      />

      <section className="bg-ivory pt-(--section-y) pb-(--section-y)">
        <Container size="wide">
          <div className="section-intro grid gap-8 md:grid-cols-12 md:items-end">
            <div className="stack md:col-span-7">
              <Eyebrow>The journal</Eyebrow>
              <Heading level={1} size="h1">
                Insight, <em>before you decide.</em>
              </Heading>
            </div>
            <p className="lead max-w-md text-balance md:col-span-4 md:col-start-9">
              Clear, honest guidance on procedures, preparation and recovery — reviewed by Dr.
              Marsh.
            </p>
          </div>

          {/* Fallback = full static list, so the page is complete before JS (and for crawlers) */}
          <Suspense
            fallback={
              <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((p) => (
                  <li key={p.slug}>
                    <PostCard post={p} />
                  </li>
                ))}
              </ul>
            }
          >
            <JournalBrowser posts={posts} />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
