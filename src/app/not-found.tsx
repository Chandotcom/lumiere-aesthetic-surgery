import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container, Eyebrow, Heading } from "@/components/ds";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { MobileCta } from "@/components/site/mobile-cta";
import { getSiteSettings } from "@/lib/cms/settings";
import { procedures } from "@/lib/content/procedures";

export const metadata: Metadata = { title: "Page not found" };

const popular = ["rhinoplasty", "breast-augmentation", "tummy-tuck", "facelift"]
  .map((s) => procedures.find((p) => p.slug === s)!)
  .filter(Boolean);

// Root not-found renders outside the (site) layout, so it brings its own header/footer.
export default async function NotFound() {
  const { phone } = await getSiteSettings();
  return (
    <>
      <SiteHeader phone={phone} />
      <main id="main" className="flex-1 bg-ivory">
        <Container size="wide" className="grid gap-14 py-(--section-y) md:grid-cols-12 md:items-center md:gap-8">
          <div className="stack md:col-span-6">
            <Eyebrow>Error 404</Eyebrow>
            <Heading level={1} size="h1">
              This page has <em>moved on.</em>
            </Heading>
            <p className="lead max-w-md">
              The page you’re looking for doesn’t exist or may have been renamed. Let’s get you
              somewhere useful.
            </p>
            <div data-slot="actions" className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink size="cta-lg" href="/">
                Back to home
              </ButtonLink>
              <ButtonLink size="cta-lg" variant="outline" href="/consultation">
                Request a consultation
              </ButtonLink>
            </div>
          </div>

          <nav aria-label="Popular pages" className="md:col-span-5 md:col-start-8">
            <p className="eyebrow mb-4">Popular pages</p>
            <ul className="border-t border-line">
              {[
                ...popular.map((p) => ({ label: p.name, href: `/procedures/${p.slug}` })),
                { label: "All procedures", href: "/procedures" },
                { label: "Before & after gallery", href: "/gallery" },
                { label: "Contact & location", href: "/contact" },
              ].map((l) => (
                <li key={l.href} className="border-b border-line">
                  <Link href={l.href} className="group flex items-center justify-between py-4 text-ink transition-colors hover:text-bronze">
                    <span className="font-heading text-h4">{l.label}</span>
                    <ArrowRight aria-hidden className="size-4 text-bronze transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </main>
      <SiteFooter />
      <MobileCta phone={phone} />
    </>
  );
}
