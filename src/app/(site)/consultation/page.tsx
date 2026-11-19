import { Suspense } from "react";
import type { Metadata } from "next";
import { getSiteSettings, seoMetadata, telHref } from "@/lib/cms/settings";
import { CalendarCheck, Clock, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { ConsultationForm } from "@/components/consultation/consultation-form";
import { Container, Eyebrow, Heading } from "@/components/ds";
import { Faq } from "@/components/home/faq";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo/schema";

export function generateMetadata(): Promise<Metadata> {
  return seoMetadata("consultation");
}

const expectations = [
  { icon: MessageCircle, title: "A personal conversation", text: "An unhurried consultation led by Dr. Marsh herself — never a sales coordinator." },
  { icon: CalendarCheck, title: "Usually within a week", text: "In person at our clinic or by secure video call, at a time that suits you." },
  { icon: ShieldCheck, title: "No pressure, ever", text: "Clear options, honest outcomes and a written all-inclusive quote to take home." },
];

export default async function ConsultationPage() {
  const { phone } = await getSiteSettings();
  const tel = telHref(phone);
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Request a consultation", path: "/consultation" },
        ])}
      />

      <section className="section-y bg-ivory">
        <Container size="wide" className="grid gap-14 lg:grid-cols-12 lg:gap-8">
          {/* Intro + reassurance */}
          <div className="stack lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:col-span-5 lg:self-start xl:pr-10">
            <Eyebrow>Consultation</Eyebrow>
            <Heading level={1} size="h1">
              Request a <em>consultation.</em>
            </Heading>
            <p className="lead max-w-md text-balance">
              Tell us a little about what you’re considering. It takes about two minutes, and
              there’s no obligation.
            </p>

            <ul className="mt-4 stack gap-6! border-t border-line pt-8">
              {expectations.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-bronze/40 text-bronze">
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-medium text-ink">{title}</p>
                    <p className="text-sm text-stone">{text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 grid gap-4 bg-cream p-6 text-sm text-stone sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <p className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-bronze" aria-hidden />
                <span>
                  Prefer to talk?
                  <br />
                  <a href={tel} className="link-underline">
                    {phone}
                  </a>
                </span>
              </p>
              <p className="flex gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-bronze" aria-hidden />
                <span>
                  Mon–Fri, 9am–5pm
                  <br />
                  Replies within 1 business day
                </span>
              </p>
              <p className="flex gap-3 sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-bronze" aria-hidden />
                <span>123 Demo Avenue, Suite 400, Anytown, ST 00000</span>
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <div className="border border-line bg-white p-6 shadow-[0_30px_60px_-40px_rgb(29_27_24/0.3)] sm:p-10 lg:p-12">
              <Suspense fallback={<div className="h-[36rem]" aria-hidden />}>
                <ConsultationForm phone={phone} />
              </Suspense>
            </div>
            <p className="mt-4 text-xs text-stone">
              This form is for consultation requests only and is not monitored for emergencies. If
              you need urgent medical help, call your local emergency number.
            </p>
          </div>
        </Container>
      </section>

      <Faq />
    </>
  );
}
