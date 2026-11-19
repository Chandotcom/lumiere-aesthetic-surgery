import Link from "next/link";
import { CookieSettingsButton } from "@/components/site/cookie-consent";
import { serviceGroups } from "@/lib/content/home";
import { getSiteSettings } from "@/lib/cms/settings";
import { site } from "@/lib/site";
import { Logo } from "./logo";

const practiceLinks = [
  { label: "Request a consultation", href: "/consultation" },
  { label: "Before & after gallery", href: "/gallery" },
  { label: "Journal", href: "/blog" },
  { label: "About Dr. Marsh", href: "/about" },
  { label: "Contact & location", href: "/contact" },
];
const legalLinks = [
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of use", href: "/terms" },
  { label: "Accessibility", href: "/accessibility" },
];

export async function SiteFooter() {
  const { phone } = await getSiteSettings();
  return (
    <footer className="grain bg-ink pb-20 text-ivory md:pb-0">
      <div className="container-wide grid gap-12 pt-(--section-y) pb-8 md:grid-cols-12 md:pb-4">
        <div className="stack md:col-span-4">
          <Logo />
          <p className="max-w-xs text-sm text-ivory/70">
            123 Demo Avenue, Suite 400
            <br />
            Anytown, ST 00000
          </p>
          <p className="text-sm text-ivory/70">
            <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="hover:text-sand">
              {phone}
            </a>
            <br />
            Mon–Fri, 9am–5pm
          </p>
        </div>

        <FooterCol title="Procedures" className="md:col-span-3">
          {serviceGroups.map((g) => (
            <FooterLink key={g.category} href={g.href}>
              {g.category}
            </FooterLink>
          ))}
        </FooterCol>
        <FooterCol title="Practice" className="md:col-span-3">
          {practiceLinks.map((l) => (
            <FooterLink key={l.href} href={l.href}>
              {l.label}
            </FooterLink>
          ))}
        </FooterCol>
        <FooterCol title="Legal" className="md:col-span-2">
          {legalLinks.map((l) => (
            <FooterLink key={l.href} href={l.href}>
              {l.label}
            </FooterLink>
          ))}
          <li>
            <CookieSettingsButton className="text-left text-ivory/80 transition-colors hover:text-sand" />
          </li>
        </FooterCol>
      </div>

      {/* Oversized wordmark — decorative */}
      <div aria-hidden className="container-wide overflow-hidden">
        <p className="-mb-[0.18em] text-center font-heading text-[19vw] leading-none font-extralight tracking-[0.06em] text-ivory/[0.07] uppercase select-none 2xl:text-[17rem]">
          {site.shortName}
        </p>
      </div>

      <div className="border-t border-ivory/15">
        <div className="container-wide flex flex-col gap-2 py-6 text-xs text-ivory/60 md:flex-row md:justify-between">
          <p>© {site.copyrightYear} {site.name}. Fictional demo practice.</p>
          <p>
            This site does not provide medical advice. In an emergency, call your local emergency
            number.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <p className="eyebrow text-sand!">{title}</p>
      <ul className="mt-5 space-y-3 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-ivory/80 transition-colors hover:text-sand">
        {children}
      </Link>
    </li>
  );
}
