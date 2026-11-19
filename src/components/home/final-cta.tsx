import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container, Eyebrow, Heading } from "@/components/ds";
import { Accent } from "@/components/ds/accent";
import { Reveal } from "@/components/motion/reveal";
import { getHomeContent } from "@/lib/cms/home";
import { getSiteSettings } from "@/lib/cms/settings";

/** Full-bleed closing call to action. */
export async function FinalCta() {
  const [{ finalCta }, settings] = await Promise.all([getHomeContent(), getSiteSettings()]);
  const tel = `tel:${settings.phone.replace(/[^+\d]/g, "")}`;
  return (
    <section aria-labelledby="final-cta-heading" className="relative isolate overflow-hidden bg-ink text-ivory">
      <Image src={finalCta.image.src} alt="" fill sizes="100vw" className="-z-10 object-cover object-[50%_35%]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 via-ink/70 to-ink/30" />

      <Container size="wide" className="py-28 md:py-40">
        <Reveal className="stack max-w-2xl">
          <Eyebrow className="text-sand">Begin your journey</Eyebrow>
          <Heading level={2} id="final-cta-heading" size="h1">
            <Accent text={finalCta.heading} />
          </Heading>
          <p className="lead max-w-lg text-ivory/80">{finalCta.intro}</p>
          <div data-slot="actions" className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <ButtonLink size="cta-lg" className="bg-ivory text-ink hover:bg-white" href="/consultation">
              Request a consultation <ArrowRight />
            </ButtonLink>
            <a href={tel} className="text-sm text-ivory/85 underline-offset-4 hover:underline">
              or call {settings.phone}
            </a>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
