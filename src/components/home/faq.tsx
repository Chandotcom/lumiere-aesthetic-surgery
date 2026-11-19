import { Plus } from "lucide-react";
import { Container, Eyebrow, Heading, TextLink } from "@/components/ds";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { Accent } from "@/components/ds/accent";
import { getHomeContent } from "@/lib/cms/home";
import { faqSchema } from "@/lib/seo/schema";

type FaqProps = {
  items?: { question: string; answer: string }[];
  heading?: React.ReactNode;
  className?: string;
};

/**
 * Native <details> accordion: accessible, no JS, and answers stay in the HTML for search/AI.
 * Without `items`/`heading`, shows the general FAQ from the homepage content (editable in the admin).
 */
export async function Faq({ items: itemsProp, heading: headingProp, className = "bg-ivory" }: FaqProps) {
  const general = itemsProp && headingProp ? null : (await getHomeContent()).faq;
  const items = itemsProp ?? general!.items;
  const heading = headingProp ?? <Accent text={general!.heading} />;
  return (
    <section aria-labelledby="faq-heading" className={`section-y ${className}`}>
      <JsonLd data={faqSchema(items)} />
      <Container size="wide" className="grid gap-12 md:grid-cols-12 md:gap-8">
        <Reveal className="stack md:sticky md:top-[calc(var(--header-h)+2rem)] md:col-span-4 md:self-start">
          <Eyebrow>Questions</Eyebrow>
          <Heading level={2} id="faq-heading">
            {heading}
          </Heading>
          <p className="text-stone">
            Can’t find what you’re looking for?{" "}
            <TextLink href="/consultation">Ask our patient coordinator</TextLink>.
          </p>
        </Reveal>

        <Reveal delay={100} className="md:col-span-7 md:col-start-6">
          <div className="border-t border-line">
            {items.map((f, i) => (
              <details key={`${i}-${f.question}`} className="group border-b border-line" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-ink [&::-webkit-details-marker]:hidden">
                  <span className="font-heading text-h4">{f.question}</span>
                  <Plus
                    aria-hidden
                    className="mt-1 size-5 shrink-0 text-bronze transition-transform duration-300 group-open:rotate-45"
                  />
                </summary>
                <p className="max-w-2xl pb-7 text-stone">{f.answer}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
