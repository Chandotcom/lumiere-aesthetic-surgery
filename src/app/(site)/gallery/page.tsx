import { Suspense } from "react";
import type { Metadata } from "next";
import { seoMetadata } from "@/lib/cms/settings";
import { ArrowRight, BadgeCheck, Camera, FileSignature } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container, Eyebrow, Heading } from "@/components/ds";
import { AgeGate } from "@/components/gallery/age-gate";
import { GalleryBrowser, GalleryPreview } from "@/components/gallery/gallery-browser";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo/schema";

export function generateMetadata(): Promise<Metadata> {
  return seoMetadata("gallery");
}

const promises = [
  { icon: Camera, title: "Unretouched", text: "Same lighting, pose and camera for every before and after." },
  { icon: FileSignature, title: "Shared with consent", text: "Each patient signs a written photo authorization, which they can withdraw." },
  { icon: BadgeCheck, title: "Our own patients", text: "Every case was performed by Dr. Marsh at our practice." },
];

export default function GalleryPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Before & after gallery", path: "/gallery" },
        ])}
      />

      {/* Intro */}
      <section className="bg-ivory pt-(--section-y) pb-12 md:pb-16">
        <Container size="wide">
          <div className="grid gap-8 md:grid-cols-12 md:items-end">
            <div className="stack md:col-span-7">
              <Eyebrow>Gallery</Eyebrow>
              <Heading level={1} size="h1">
                Before &amp; <em>after.</em>
              </Heading>
            </div>
            <p className="lead max-w-md text-balance md:col-span-4 md:col-start-9">
              Real results from real patients — shown honestly, so you can judge our work for
              yourself.
            </p>
          </div>

          <ul className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-3 md:mt-16">
            {promises.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4 bg-ivory p-6">
                <Icon className="mt-0.5 size-5 shrink-0 text-bronze" aria-hidden />
                <div>
                  <p className="font-medium text-ink">{title}</p>
                  <p className="text-sm text-stone">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Gallery */}
      <section aria-label="Before and after cases" className="bg-ivory pb-(--section-y)">
        <Container size="wide">
          <p className="mb-8 border-l-2 border-bronze bg-cream px-4 py-3 text-sm text-stone">
            <strong className="font-medium text-ink">Demo:</strong> this fictional practice shows
            placeholder images. A real clinic’s gallery displays consented patient photos here.
          </p>
          <AgeGate preview={<GalleryPreview />}>
            <Suspense fallback={<GalleryPreview />}>
              <GalleryBrowser />
            </Suspense>
          </AgeGate>
          <p className="mt-16 max-w-3xl text-xs text-stone">
            Individual results vary. Photos show outcomes for specific patients and are not a
            guarantee of your result. Your consultation includes an honest discussion of what is
            realistic for you.
          </p>
        </Container>
      </section>

      {/* CTA */}
      <section className="grain section-y bg-ink text-ivory">
        <Container size="wide" className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="stack md:col-span-7">
            <Eyebrow className="text-sand">Your result</Eyebrow>
            <Heading level={2}>
              Picture what’s possible <em>for you.</em>
            </Heading>
            <p className="max-w-lg text-ivory/75">
              At your consultation, Dr. Marsh reviews cases similar to yours and talks through
              realistic outcomes for your anatomy.
            </p>
          </div>
          <div className="md:col-span-4 md:col-start-9 md:justify-self-end">
            <ButtonLink size="cta-lg" className="bg-ivory text-ink hover:bg-white" href="/consultation">
              Request a consultation <ArrowRight />
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
