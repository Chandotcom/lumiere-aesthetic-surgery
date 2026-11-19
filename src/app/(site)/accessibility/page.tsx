import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { getSiteSettings } from "@/lib/cms/settings";
import type { SiteSettings } from "@/lib/cms/schemas";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Accessibility Statement",
  description: `${site.name} is committed to a website everyone can use. Read our accessibility commitment and how to request help.`,
  alternates: { canonical: "/accessibility" },
};

/** Contact details come from the editable site settings. */
const buildSections = (c: SiteSettings): LegalSection[] => [
  {
    id: "commitment",
    title: "Our commitment",
    body: `We want everyone — including people who use assistive technology — to be able to learn about our care and request a consultation easily. We aim to meet the **Web Content Accessibility Guidelines (WCAG) 2.1, Level AA**.`,
  },
  {
    id: "features",
    title: "What we’ve built in",
    body: `- Text and interactive elements meet AA color-contrast ratios
- Every feature works with a keyboard, with a visible focus outline
- A “Skip to content” link at the top of every page
- Descriptive alternative text on images
- Form fields with labels, clear error messages and focus moved to the first problem
- Before-and-after sliders operable with arrow keys and announced to screen readers
- Respect for your device’s “reduce motion” setting — animations switch off
- Layouts that reflow to small screens without sideways scrolling`,
  },
  {
    id: "known-limitations",
    title: "Known limitations",
    body: `Some third-party content we link to, such as financing applications or maps, is outside our control and may not fully meet the same standard. We review our site regularly and fix issues as we find them.`,
  },
  {
    id: "feedback",
    title: "Need help or found a problem?",
    body: `If anything on this site is difficult to use, we want to know — and we’ll help you get the information or appointment you need another way.

- Call **${c.phone}** (Mon–Fri, 9am–5pm)
- Email [${c.email}](mailto:${c.email})

Please tell us the page and what happened. We aim to respond within two business days.`,
  },
  {
    id: "in-clinic",
    title: "Accessibility at our clinic",
    body: `Our clinic offers step-free access, an accessible restroom and reserved parking near the entrance. Let us know about any needs when booking and we’ll make arrangements.`,
  },
];

export default async function AccessibilityPage() {
  const sections = buildSections(await getSiteSettings());
  return (
    <LegalPage
      eyebrow="Accessibility"
      title={
        <>
          A site for <em>everyone.</em>
        </>
      }
      intro="We design and test this website so it works for people of all abilities."
      updated="November 18, 2026"
      path="/accessibility"
      sections={sections}
    />
  );
}
