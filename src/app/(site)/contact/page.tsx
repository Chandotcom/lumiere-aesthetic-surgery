import type { Metadata } from "next";
import { ArrowRight, Car, Clock, Mail, MapPin, Phone, Plane, Train } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container, Eyebrow, Heading, TextLink } from "@/components/ds";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { formatAddress, getSiteSettings, seoMetadata, settingsDefaults, telHref } from "@/lib/cms/settings";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { site } from "@/lib/site";

export function generateMetadata(): Promise<Metadata> {
  return seoMetadata("contact");
}

const directions = [
  { icon: Car, title: "By car", text: "Complimentary valet at the main entrance, plus reserved accessible parking beside the lobby." },
  { icon: Train, title: "Public transit", text: "Five minutes’ walk from Central Station. Bus lines 12 and 40 stop outside the building." },
  { icon: Plane, title: "Traveling patients", text: "Twenty minutes from the airport. Our coordinator can recommend nearby recovery-friendly hotels." },
];

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const { address, hours } = settings;
  const fullAddress = formatAddress(address);
  const mapQuery = encodeURIComponent(fullAddress);
  const tel = telHref(settings.phone);
  // Structured opening hours only while the hours are the built-in ones (free text can't be parsed reliably).
  const defaultHours = JSON.stringify(hours) === JSON.stringify(settingsDefaults().hours);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MedicalClinic",
          name: site.name,
          url: site.url,
          telephone: settings.phone,
          email: settings.email,
          address: {
            "@type": "PostalAddress",
            streetAddress: address.street,
            addressLocality: address.city,
            addressRegion: address.region,
            postalCode: address.postal,
          },
          openingHoursSpecification: defaultHours ? [
            { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"], opens: "09:00", closes: "17:00" },
            { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "09:00", closes: "16:00" },
          ] : undefined,
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />

      {/* Intro */}
      <section className="bg-ivory pt-(--section-y) pb-12 md:pb-16">
        <Container size="wide" className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="stack md:col-span-7">
            <Eyebrow>Contact</Eyebrow>
            <Heading level={1} size="h1">
              We’d love to <em>hear from you.</em>
            </Heading>
          </div>
          <p className="lead max-w-md text-balance md:col-span-4 md:col-start-9">
            Questions about a procedure, pricing or your visit? Our patient coordinator replies
            within one business day.
          </p>
        </Container>
      </section>

      {/* Contact cards + visit */}
      <section className="border-t border-line bg-ivory pb-(--section-y)">
        <Container size="wide" className="grid gap-12 pt-12 md:grid-cols-12 md:gap-8 md:pt-16">
          <div className="stack md:col-span-5">
            <ul className="border-t border-line">
              <li className="flex gap-4 border-b border-line py-6">
                <Phone className="mt-1 size-5 shrink-0 text-bronze" aria-hidden />
                <div>
                  <p className="text-xs tracking-wide text-stone uppercase">Call</p>
                  <a href={tel} className="font-heading text-h4 text-ink transition-colors hover:text-bronze">{settings.phone}</a>
                </div>
              </li>
              <li className="flex gap-4 border-b border-line py-6">
                <Mail className="mt-1 size-5 shrink-0 text-bronze" aria-hidden />
                <div>
                  <p className="text-xs tracking-wide text-stone uppercase">Email</p>
                  <a href={`mailto:${settings.email}`} className="font-heading text-h4 break-all text-ink transition-colors hover:text-bronze">{settings.email}</a>
                  <p className="mt-1 text-sm text-stone">Please don’t send medical details by email.</p>
                </div>
              </li>
              <li className="flex gap-4 border-b border-line py-6">
                <MapPin className="mt-1 size-5 shrink-0 text-bronze" aria-hidden />
                <div>
                  <p className="text-xs tracking-wide text-stone uppercase">Visit</p>
                  <address className="font-heading text-h4 text-ink not-italic">
                    {address.street}
                    <br />
                    {address.city}, {address.region} {address.postal}
                  </address>
                </div>
              </li>
            </ul>

            <div className="mt-2 bg-cream p-6">
              <p className="mb-4 flex items-center gap-2 text-xs tracking-wide text-stone uppercase">
                <Clock className="size-4 text-bronze" aria-hidden /> Opening hours
              </p>
              <dl className="space-y-2 text-sm">
                {hours.map((h) => (
                  <div key={h.days} className="flex justify-between gap-6">
                    <dt className="text-stone">{h.days}</dt>
                    <dd className="text-right text-ink">{h.time}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div data-slot="actions">
              <ButtonLink size="cta-lg" className="w-full sm:w-auto" href="/consultation">
                Request a consultation <ArrowRight />
              </ButtonLink>
            </div>
          </div>

          {/* Map card — a link out, not an embed, so no third-party tracking loads on this page */}
          <div className="md:col-span-6 md:col-start-7">
            <div className="relative flex aspect-[4/3] flex-col justify-end overflow-hidden border border-line bg-[linear-gradient(135deg,#f3ede4_0%,#e9e1d5_100%)] p-6 md:aspect-auto md:h-full md:min-h-[28rem]">
              <svg aria-hidden className="absolute inset-0 size-full text-line" preserveAspectRatio="none" viewBox="0 0 400 300">
                <g fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M0 80 H400 M0 190 H400 M120 0 V300 M290 0 V300" />
                  <path d="M0 260 L400 40" strokeWidth="6" className="text-white/70" stroke="currentColor" />
                  <path d="M40 0 V300 M210 0 V300 M350 0 V300 M0 140 H400 M0 240 H400" strokeWidth="0.75" />
                </g>
              </svg>
              <span aria-hidden className="absolute top-[42%] left-[52%] grid size-12 -translate-1/2 place-items-center rounded-full bg-bronze text-white shadow-[0_12px_30px_-10px_rgb(29_27_24/0.5)]">
                <MapPin className="size-5" />
              </span>
              <div className="relative bg-ivory/95 p-5 backdrop-blur-sm">
                <p className="font-heading text-h4 text-ink">{site.name}</p>
                <p className="mt-1 text-sm text-stone">{fullAddress}</p>
                <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline"
                  >
                    Open in Google Maps<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  <a
                    href={`https://maps.apple.com/?q=${mapQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline"
                  >
                    Open in Apple Maps<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Getting here */}
      <section aria-labelledby="directions-heading" className="section-y bg-cream">
        <Container size="wide">
          <Reveal className="section-intro grid gap-6 md:grid-cols-12 md:items-end">
            <div className="stack md:col-span-7">
              <Eyebrow>Getting here</Eyebrow>
              <Heading level={2} id="directions-heading">
                An easy, <em>private</em> arrival.
              </Heading>
            </div>
            <p className="max-w-sm text-stone md:col-span-4 md:col-start-9">
              A discreet side entrance is available for procedure days — just ask when booking.
            </p>
          </Reveal>
          <ul className="grid gap-px border border-line bg-line md:grid-cols-3">
            {directions.map(({ icon: Icon, title, text }, i) => (
              <Reveal as="li" variant="content" key={title} delay={i * 100} className="flex flex-col gap-4 bg-cream p-8 lg:p-10">
                <Icon className="size-6 text-bronze" aria-hidden />
                <Heading level={3} size="h4">
                  {title}
                </Heading>
                <p className="text-sm text-stone">{text}</p>
              </Reveal>
            ))}
          </ul>
          <p className="mt-10 text-sm text-stone">
            Need accessibility arrangements? See our{" "}
            <TextLink href="/accessibility">accessibility statement</TextLink>.
          </p>
        </Container>
      </section>
    </>
  );
}
