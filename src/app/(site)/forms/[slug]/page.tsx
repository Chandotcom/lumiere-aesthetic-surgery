import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, Eyebrow, Heading } from "@/components/ds";
import { FormRenderer } from "@/components/forms/form-renderer";
import { JsonLd } from "@/components/seo/json-ld";
import { getForm, getForms } from "@/lib/cms/forms";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { site } from "@/lib/site";

/** Forms built in the admin (Forms), at /forms/<slug>. Submissions go to the Leads inbox. */
export async function generateStaticParams() {
  const slugs = [...(await getForms()).keys()].map((slug) => ({ slug }));
  // Cache Components needs at least one param to prerender; this placeholder just 404s.
  return slugs.length ? slugs : [{ slug: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/forms/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const form = await getForm(slug);
  if (!form) return {};
  return {
    title: form.title,
    description: form.intro || undefined,
    alternates: { canonical: `/forms/${slug}` },
    openGraph: { siteName: site.name },
  };
}

export default function FormPage({ params }: PageProps<"/forms/[slug]">) {
  return (
    <section className="section-y bg-ivory">
      <Suspense fallback={<FormSkeleton />}>
        <FormContent params={params} />
      </Suspense>
    </section>
  );
}

function FormSkeleton() {
  return (
    <Container size="wide" className="grid gap-14 lg:grid-cols-12 lg:gap-8" aria-busy="true">
      <div className="space-y-5 lg:col-span-5">
        <div className="h-14 w-3/4 animate-pulse bg-line" />
        <div className="h-20 w-full animate-pulse bg-line/60" />
      </div>
      <div className="h-[32rem] animate-pulse bg-line/40 lg:col-span-7" />
    </Container>
  );
}

async function FormContent({ params }: { params: PageProps<"/forms/[slug]">["params"] }) {
  const { slug } = await params;
  const form = await getForm(slug);
  if (!form) notFound();
  return (
    <Container size="wide" className="grid gap-14 lg:grid-cols-12 lg:gap-8">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: form.title, path: `/forms/${slug}` },
        ])}
      />
      <div className="stack lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:col-span-5 lg:self-start xl:pr-10">
        <Eyebrow>Get in touch</Eyebrow>
        <Heading level={1} size="h1">
          {form.title}
        </Heading>
        {form.intro && <p className="lead max-w-md text-balance whitespace-pre-line">{form.intro}</p>}
      </div>
      <div className="lg:col-span-7">
        <div className="border border-line bg-white p-6 shadow-[0_30px_60px_-40px_rgb(29_27_24/0.3)] sm:p-10 lg:p-12">
          <FormRenderer slug={slug} form={form} />
        </div>
        <p className="mt-4 text-xs text-stone">
          This form is not monitored for emergencies. If you need urgent medical help, call your local emergency number.
        </p>
      </div>
    </Container>
  );
}
