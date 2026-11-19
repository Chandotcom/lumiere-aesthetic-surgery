import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, ChevronRight, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container, Eyebrow, Heading, TextLink } from "@/components/ds";
import { FinalCta } from "@/components/home/final-cta";
import { PostCard } from "@/components/journal/post-card";
import { Prose } from "@/components/journal/prose";
import { JsonLd } from "@/components/seo/json-ld";
import { images } from "@/lib/content/home";
import { getPostBySlug, getPosts } from "@/lib/cms/journal";
import { formatDate } from "@/lib/content/journal";
import { getProcedures } from "@/lib/cms/procedures";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/schema";
import { site } from "@/lib/site";

export async function generateStaticParams() {
  return (await getPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = await getPostBySlug((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      publishedTime: post.publishedAt,
      authors: [site.surgeon],
      images: [{ url: `${post.image.src}?w=1200&h=630&fit=crop`, alt: post.image.alt }],
    },
  };
}

/** params read inside <Suspense> so client navigations stay instant (see procedures page). */
export default function ArticlePage({ params }: PageProps<"/blog/[slug]">) {
  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <Article params={params} />
    </Suspense>
  );
}

function ArticleSkeleton() {
  return (
    <Container size="prose" className="stack pt-24 pb-(--section-y)" aria-busy="true">
      <div className="h-3 w-32 animate-pulse bg-line" />
      <div className="h-14 w-full animate-pulse bg-line" />
      <div className="h-6 w-2/3 animate-pulse bg-line/60" />
      <div className="mt-6 aspect-[16/9] w-full animate-pulse bg-line/60" />
    </Container>
  );
}

async function Article({ params }: { params: PageProps<"/blog/[slug]">["params"] }) {
  const post = await getPostBySlug((await params).slug);
  if (!post) notFound();

  const allProcedures = await getProcedures();
  const related = post.relatedProcedures
    .map((s) => allProcedures.find((p) => p.slug === s))
    .filter((p) => !!p);
  const more = (await getPosts()).filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <JsonLd
        data={articleSchema({
          title: post.title,
          excerpt: post.excerpt,
          slug: post.slug,
          image: post.image.src,
          publishedAt: post.publishedAt,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Journal", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />

      <article className="bg-ivory pb-(--section-y)">
        {/* Header */}
        <Container size="prose" className="pt-8 md:pt-10">
          <nav aria-label="Breadcrumb" className="mb-12 md:mb-16">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs tracking-wide text-stone uppercase">
              <li><Link href="/blog" className="hover:text-bronze">Journal</Link></li>
              <ChevronRight aria-hidden className="size-3" />
              <li>
                <Link href={`/blog?topic=${post.category.toLowerCase().replace(/\s+/g, "-")}`} className="hover:text-bronze">
                  {post.category}
                </Link>
              </li>
            </ol>
          </nav>

          <div className="stack">
            <Eyebrow>{post.category}</Eyebrow>
            <Heading level={1} size="h1">
              {post.title}
            </Heading>
            <p className="lead">{post.excerpt}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-line py-5 text-sm text-stone">
              <span className="flex items-center gap-3">
                <span className="relative size-10 overflow-hidden rounded-full bg-cream">
                  <Image src={images.surgeon.src} alt="" fill sizes="40px" className="object-cover object-top" />
                </span>
                <span>
                  By <span className="text-ink">{site.surgeon}</span>
                </span>
              </span>
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              <span>{post.readTime}</span>
            </div>
          </div>
        </Container>

        {/* Cover */}
        <Container size="site" className="mt-12 md:mt-16">
          <div className="relative aspect-[16/9] overflow-hidden bg-cream">
            <Image
              src={post.image.src}
              alt={post.image.alt}
              fill
              preload
              sizes="(min-width: 1280px) 75rem, 100vw"
              className="object-cover"
            />
          </div>
        </Container>

        {/* Body */}
        <Container size="prose" className="mt-14 md:mt-20">
          <Prose markdown={post.content} />

          <p className="mt-12 flex items-start gap-3 border-t border-line pt-6 text-sm text-stone">
            <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-bronze" />
            Medically reviewed by {site.surgeon}. This article is general information and isn’t a
            substitute for advice from your own doctor.
          </p>

          {/* Author box (E-E-A-T) */}
          <aside aria-label="About the author" className="mt-10 grid gap-6 bg-cream p-6 sm:grid-cols-[auto_1fr] sm:p-8">
            <span className="relative size-20 overflow-hidden rounded-full">
              <Image src={images.surgeon.src} alt={images.surgeon.alt} fill sizes="80px" className="object-cover object-top" />
            </span>
            <div className="stack gap-3!">
              <p className="eyebrow">About the author</p>
              <p className="font-heading text-h4 text-ink">{site.surgeon}</p>
              <p className="text-sm text-stone">
                Board-certified plastic surgeon and founder of {site.name}, known for natural,
                proportion-led results.
              </p>
              <TextLink href="/about" className="self-start text-sm">
                Meet Dr. Marsh
              </TextLink>
            </div>
          </aside>

          {/* Related procedures */}
          {related.length > 0 && (
            <div className="mt-10">
              <p className="eyebrow mb-4">Related procedures</p>
              <ul className="flex flex-wrap gap-2">
                {related.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/procedures/${p.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-input bg-white px-4 py-2 text-sm text-ink transition-colors hover:border-bronze hover:text-bronze"
                    >
                      {p.name} <ArrowRight aria-hidden className="size-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <ButtonLink size="cta" href={`/consultation?procedure=${related[0].slug}`}>
                  Request a consultation <ArrowRight />
                </ButtonLink>
              </div>
            </div>
          )}
        </Container>
      </article>

      {/* More articles */}
      <section aria-labelledby="more-heading" className="section-y border-t border-line bg-ivory">
        <Container size="wide">
          <div className="section-intro flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="stack">
              <Eyebrow>Keep reading</Eyebrow>
              <Heading level={2} id="more-heading">
                More from <em>the journal</em>
              </Heading>
            </div>
            <TextLink href="/blog" className="self-start md:self-auto">
              All articles
            </TextLink>
          </div>
          <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((p) => (
              <li key={p.slug}>
                <PostCard post={p} />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <FinalCta />
    </>
  );
}
