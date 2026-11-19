import Image from "next/image";
import type { Metadata } from "next";
import { seoMetadata } from "@/lib/cms/settings";
import { ArrowRight, HeartHandshake, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container, Eyebrow, Heading, TextLink } from "@/components/ds";
import { FinalCta } from "@/components/home/final-cta";
import { Testimonials } from "@/components/home/testimonials";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { getHomeContent } from "@/lib/cms/home";
import { breadcrumbSchema, physicianSchema } from "@/lib/seo/schema";
import { site } from "@/lib/site";

export function generateMetadata(): Promise<Metadata> {
  return seoMetadata("about");
}

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}`;

// Fictional demo credentials — clearly marked.
const training = [
  { year: "2004", title: "Doctor of Medicine", place: "State University School of Medicine (demo)" },
  { year: "2010", title: "Residency in Plastic & Reconstructive Surgery", place: "University Medical Center (demo)" },
  { year: "2011", title: "Fellowship in Aesthetic Surgery", place: "Institute for Aesthetic Surgery (demo)" },
  { year: "2012", title: "Board certification", place: "American Board of Plastic Surgery (demo)" },
  { year: "2014", title: "Founded Lumière Aesthetic Surgery", place: "Private practice, accredited surgical suite" },
];

const values = [
  { icon: Scale, title: "Proportion over trends", text: "Results are planned around your features and frame — never a template or a passing look." },
  { icon: HeartHandshake, title: "Honesty first", text: "You’ll hear what’s realistic, what it costs and when a procedure isn’t right for you." },
  { icon: ShieldCheck, title: "Safety without compromise", text: "Accredited facility, board-certified anesthesia and strict patient selection." },
  { icon: Sparkles, title: "Care that continues", text: "Your relationship with us continues long after surgery, with a year of follow-up." },
];

const team = [
  { name: "Sofia Alvarez, RN", role: "Lead surgical nurse", image: { src: unsplash("1594824476967-48c8b964273f"), alt: "Smiling nurse in teal scrubs with arms crossed" } },
  { name: "Marcus Bell, CRNA", role: "Anesthesia lead", image: { src: unsplash("1622253692010-333f2da6031d"), alt: "Smiling clinician in blue scrubs with a stethoscope" } },
  { name: "Hannah Price", role: "Patient care coordinator", image: { src: unsplash("1573496359142-b8d87734a5a2"), alt: "Smiling woman in a grey blazer" } },
];

export default async function AboutPage() {
  // Surgeon photo and stats are shared with the homepage (editable in the admin).
  const { surgeon } = await getHomeContent();
  const stats = surgeon.stats;
  return (
    <>
      <JsonLd data={physicianSchema()} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-ivory">
        <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[36%] bg-cream md:block" />
        <Container size="wide" className="media-pair relative grid items-center gap-14 py-(--section-y) md:gap-x-16 lg:gap-x-20">
          <div className="stack">
            <Eyebrow>About</Eyebrow>
            <Heading level={1} size="h1">
              Meet Dr. Elena <em>Marsh.</em>
            </Heading>
            <p className="lead max-w-xl text-balance">
              Board-certified plastic surgeon, founder of {site.name}, and a firm believer that the
              best results are the ones no one can point to.
            </p>
            <blockquote className="border-l-2 border-bronze pl-6 font-heading text-h4 font-light text-ink">
              “My job is to listen closely, operate precisely, and tell you the truth — even when
              the answer is ‘not yet.’”
            </blockquote>
            <div data-slot="actions">
              <ButtonLink size="cta-lg" href="/consultation">
                Request a consultation <ArrowRight />
              </ButtonLink>
            </div>
          </div>

          <div className="media-pair-img relative mx-auto max-w-md max-md:w-full md:mx-0 md:max-w-none">
            <div aria-hidden className="absolute -bottom-6 -left-6 hidden h-3/4 w-3/4 bg-sand/45 md:block" />
            <div className="relative aspect-[4/5] w-full overflow-hidden">
              <Image
                src={surgeon.image.src}
                alt={surgeon.image.alt}
                fill
                preload
                sizes="(min-width: 1024px) 40vw, (min-width: 840px) 50vw, 28rem"
                className="object-cover object-top"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Story */}
      <section aria-labelledby="story-heading" className="section-y border-t border-line bg-ivory">
        <Container size="wide" className="grid gap-12 md:grid-cols-12 md:gap-8">
          <Reveal className="stack md:col-span-4">
            <Eyebrow>Her story</Eyebrow>
            <Heading level={2} id="story-heading">
              Precision, shaped by <em>listening.</em>
            </Heading>
          </Reveal>
          <Reveal delay={100} className="md:col-span-7 md:col-start-6">
            <div className="stack text-[1.0625rem] leading-[1.85] text-ink/85">
              <p>
                Dr. Marsh trained in plastic and reconstructive surgery before completing a
                dedicated fellowship in aesthetic surgery. Reconstructive work taught her how
                much anatomy, balance and healing matter; aesthetic work taught her how personal
                every decision is.
              </p>
              <p>
                She founded Lumière in 2014 with a simple idea: a practice where patients are
                never rushed, never pressured and always told the truth. Every consultation is
                led by Dr. Marsh herself, and every plan is written down — including the risks,
                the recovery and the full cost.
              </p>
              <p>
                Outside the operating room she teaches surgical residents, contributes to patient
                safety research and still reviews every journal article published on this site.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Training */}
      <section aria-labelledby="training-heading" className="section-y bg-cream">
        <Container size="wide" className="grid gap-12 md:grid-cols-12 md:gap-8">
          <Reveal className="stack md:sticky md:top-[calc(var(--header-h)+2rem)] md:col-span-4 md:self-start">
            <Eyebrow>Training &amp; credentials</Eyebrow>
            <Heading level={2} id="training-heading">
              Two decades of <em>expertise.</em>
            </Heading>
            <p className="text-sm text-stone">Credentials shown are fictional for this demo practice.</p>
          </Reveal>
          <ol className="border-t border-line md:col-span-7 md:col-start-6">
            {training.map((t, i) => (
              <Reveal as="li" key={t.title} delay={i * 80} className="grid grid-cols-[5rem_1fr] gap-6 border-b border-line py-6 md:grid-cols-[7rem_1fr]">
                <span className="numeral text-h4 text-bronze">{t.year}</span>
                <div>
                  <p className="font-heading text-h4 text-ink">{t.title}</p>
                  <p className="mt-1 text-sm text-stone">{t.place}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      {/* Values */}
      <section aria-labelledby="values-heading" className="section-y bg-ivory">
        <Container size="wide">
          <Reveal className="section-intro grid gap-6 md:grid-cols-12 md:items-end">
            <div className="stack md:col-span-7">
              <Eyebrow>Philosophy</Eyebrow>
              <Heading level={2} id="values-heading">
                What guides <em>every decision.</em>
              </Heading>
            </div>
          </Reveal>
          <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, text }, i) => (
              <Reveal as="li" variant="content" key={title} delay={i * 100} className="flex flex-col gap-5 bg-ivory p-8 lg:p-10">
                <span className="grid size-11 place-items-center rounded-full border border-bronze/40 text-bronze">
                  <Icon className="size-5" aria-hidden />
                </span>
                <Heading level={3} size="h4">
                  {title}
                </Heading>
                <p className="text-sm text-stone">{text}</p>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/* Stats */}
      <section aria-label="Practice at a glance" className="grain bg-ink py-16 text-ivory md:py-20">
        <Container size="wide">
          <dl className="grid grid-cols-2 gap-y-10 md:grid-cols-4">
            {stats.map((s, i) => (
              <div key={s.label} className={`flex flex-col gap-2 ${i % 2 ? "pl-6" : "pr-6"} md:px-8 md:first:pl-0 ${i > 0 ? "md:border-l md:border-ivory/15" : ""}`}>
                <dt className="order-2 text-sm text-ivory/65">{s.label}</dt>
                <dd className="order-1 font-heading text-h1 font-light">
                  {s.value}
                  <span className="text-sand">{s.suffix}</span>
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* Practice & team */}
      <section aria-labelledby="team-heading" className="section-y bg-ivory">
        <Container size="wide">
          <div className="section-intro grid gap-12 md:grid-cols-12 md:items-center md:gap-8">
            <Reveal className="stack md:col-span-5">
              <Eyebrow>The practice</Eyebrow>
              <Heading level={2} id="team-heading">
                A small team, <em>entirely yours.</em>
              </Heading>
              <p className="text-stone">
                Procedures take place in our accredited private surgical suite, with
                board-certified anesthesia and a dedicated nurse beside you from arrival to
                recovery. Consultations include 3D imaging so you can see realistic options.
              </p>
              <p>
                <TextLink href="/procedures">Explore our procedures</TextLink>
              </p>
            </Reveal>
            <Reveal variant="image" className="relative aspect-[16/10] overflow-hidden md:col-span-6 md:col-start-7">
              <Image
                src={unsplash("1666214280557-f1b5022eb634")}
                alt="Physician reviewing a 3D scan on a monitor during a consultation"
                fill
                sizes="(min-width: 840px) 50vw, 100vw"
                className="object-cover"
              />
            </Reveal>
          </div>

          <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-3">
            {team.map((m, i) => (
              <Reveal as="li" key={m.name} delay={i * 100}>
                <div className="relative aspect-[4/5] overflow-hidden bg-cream">
                  <Image src={m.image.src} alt={m.image.alt} fill sizes="(min-width: 480px) 33vw, 100vw" className="object-cover object-top" />
                </div>
                <p className="mt-5 font-heading text-h4 text-ink">{m.name}</p>
                <p className="text-sm text-stone">{m.role}</p>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      <Testimonials />
      <FinalCta />
    </>
  );
}
