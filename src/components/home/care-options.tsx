import { ArrowRight, CreditCard, Plane } from "lucide-react";
import { Container, Heading, TextLink } from "@/components/ds";
import { Reveal } from "@/components/motion/reveal";

const options = [
  {
    icon: CreditCard,
    eyebrow: "Financing",
    title: "Flexible monthly plans",
    text: "Spread the cost with trusted patient-financing partners. Plans from about $180/month, with 0% options for qualified applicants.",
    note: "Example only. Subject to credit approval.",
    link: { label: "Explore financing", href: "/consultation" },
  },
  {
    icon: Plane,
    eyebrow: "Traveling patients",
    title: "Coming from out of town?",
    text: "Start with a virtual consultation. Our coordinator arranges your dates, recovery stay and follow-ups so you can travel with confidence.",
    note: "A final in-person exam is always required before surgery.",
    link: { label: "Plan your visit", href: "/consultation" },
  },
];

export function CareOptions() {
  return (
    <section className="section-y bg-cream">
      <Container size="wide">
        <div className="grid gap-px border border-line bg-line md:grid-cols-2">
        {options.map(({ icon: Icon, ...o }, i) => (
          <Reveal variant="content" key={o.title} delay={i * 120} className="flex flex-col gap-6 bg-cream p-8 md:p-12 lg:p-16">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full border border-bronze/40 text-bronze">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="eyebrow">{o.eyebrow}</span>
            </div>
            <Heading level={3} size="h2">
              {o.title}
            </Heading>
            <p className="max-w-md text-stone">{o.text}</p>
            <p className="text-xs text-stone/80">{o.note}</p>
            <p className="mt-auto pt-2">
              <TextLink href={o.link.href} className="inline-flex items-center gap-2">
                {o.link.label} <ArrowRight className="size-4" aria-hidden />
              </TextLink>
            </p>
          </Reveal>
        ))}
        </div>
      </Container>
    </section>
  );
}
