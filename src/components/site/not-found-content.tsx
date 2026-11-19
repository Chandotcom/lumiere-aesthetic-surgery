import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container, Eyebrow, Heading } from "@/components/ds";
import { procedures } from "@/lib/content/procedures";

const popular = ["rhinoplasty", "breast-augmentation", "tummy-tuck", "facelift"]
  .map((s) => procedures.find((p) => p.slug === s)!)
  .filter(Boolean);

/** The 404 message and popular links, without site chrome (used inside and outside the site layout). */
export function NotFoundContent() {
  return (
    <div className="bg-ivory">
      <Container size="wide" className="grid gap-14 py-(--section-y) md:grid-cols-12 md:items-center md:gap-8">
        <div className="stack md:col-span-6">
          <Eyebrow>Error 404</Eyebrow>
          <Heading level={1} size="h1">
            This page has <em>moved on.</em>
          </Heading>
          <p className="lead max-w-md">
            The page you’re looking for doesn’t exist or may have been renamed. Let’s get you somewhere useful.
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
    </div>
  );
}
