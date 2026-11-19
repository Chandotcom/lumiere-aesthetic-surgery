import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { getSiteSettings } from "@/lib/cms/settings";
import type { SiteSettings } from "@/lib/cms/schemas";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Terms that apply to your use of the ${site.name} website, including our medical disclaimer.`,
  alternates: { canonical: "/terms" },
};

/** Contact details come from the editable site settings. */
const buildSections = (c: SiteSettings): LegalSection[] => [
  {
    id: "acceptance",
    title: "Using this website",
    body: `By using this website you agree to these terms. If you don’t agree, please don’t use the site. ${site.name} is a fictional demonstration practice; no real medical services are offered through it.`,
  },
  {
    id: "medical-disclaimer",
    title: "Medical disclaimer",
    body: `Content on this website — including procedure pages, journal articles, prices and recovery timelines — is **general information only**. It is not medical advice, diagnosis or treatment, and it does not replace a consultation with a qualified medical professional who has examined you.

Every patient is different. Never delay seeking medical care because of something you read here. **In an emergency, call your local emergency number.**`,
  },
  {
    id: "no-relationship",
    title: "No doctor–patient relationship",
    body: `Submitting a consultation request, sending a message or reading our content does not create a doctor–patient relationship. That relationship begins only after an in-person (or approved virtual) consultation and agreement to treatment.`,
  },
  {
    id: "results-pricing",
    title: "Results, reviews & pricing",
    body: `Before-and-after photos show results for specific patients and are **not a guarantee** of your outcome; individual results vary. Testimonials reflect individual experiences. Prices are typical ranges for guidance only — your actual cost is confirmed in a written quote after your consultation. Financing examples are illustrative and subject to credit approval by third-party lenders.`,
  },
  {
    id: "use-of-site",
    title: "Acceptable use",
    body: `Please don’t misuse the site — for example by submitting false information, attempting to access areas you aren’t authorized to use, interfering with its security, or copying content for commercial purposes without permission.`,
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    body: `Text, design and branding on this site belong to ${site.name} or its licensors. Photography is used under license. Patient photographs are published with written consent and may not be copied or reused under any circumstances.`,
  },
  {
    id: "links",
    title: "Third-party links",
    body: `We may link to other websites, such as financing partners or maps. We aren’t responsible for their content or privacy practices.`,
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: `The website is provided “as is”. To the extent permitted by law, we are not liable for losses arising from your use of the site or reliance on its general information.`,
  },
  {
    id: "changes",
    title: "Changes & contact",
    body: `We may update these terms and will change the “last updated” date above. Questions? Email [${c.email}](mailto:${c.email}).`,
  },
];

export default async function TermsPage() {
  const sections = buildSections(await getSiteSettings());
  return (
    <LegalPage
      eyebrow="Terms of use"
      title={
        <>
          Terms of <em>use.</em>
        </>
      }
      intro="The ground rules for using this website — including why our content is information, not medical advice."
      updated="November 18, 2026"
      path="/terms"
      sections={sections}
    />
  );
}
