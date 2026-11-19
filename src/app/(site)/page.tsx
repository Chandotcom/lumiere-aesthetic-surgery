import type { Metadata } from "next";
import { getSiteSettings, seoMetadata } from "@/lib/cms/settings";
import { CareOptions } from "@/components/home/care-options";
import { Faq } from "@/components/home/faq";
import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { Journal } from "@/components/home/journal";
import { Journey } from "@/components/home/journey";
import { Marquee } from "@/components/home/marquee";
import { Procedures } from "@/components/home/procedures";
import { ResultsTeaser } from "@/components/home/results-teaser";
import { Statement } from "@/components/home/statement";
import { Surgeon } from "@/components/home/surgeon";
import { Testimonials } from "@/components/home/testimonials";
import { JsonLd } from "@/components/seo/json-ld";
import { clinicSchema } from "@/lib/seo/schema";

export function generateMetadata(): Promise<Metadata> {
  return seoMetadata("home");
}

// Rhythm: light → light → dark → light → cream → dark → light → cream → light → light → dark
export default async function Home() {
  const settings = await getSiteSettings();
  return (
    <>
      <JsonLd data={clinicSchema(settings)} />
      <Hero />
      <Marquee />
      <Statement />
      <Procedures />
      <Surgeon />
      <Journey />
      <ResultsTeaser />
      <Testimonials />
      <CareOptions />
      <Faq />
      <Journal />
      <FinalCta />
    </>
  );
}
