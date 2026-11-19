import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { formatAddress, getSiteSettings } from "@/lib/cms/settings";
import type { SiteSettings } from "@/lib/cms/schemas";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} collects, uses and protects your personal and health information.`,
  alternates: { canonical: "/privacy" },
};

/** Contact details come from the editable site settings. */
const buildSections = (c: SiteSettings): LegalSection[] => [
  {
    id: "overview",
    title: "Overview",
    body: `${site.name} (“we”, “us”) respects your privacy. This policy explains what information we collect through this website, why we collect it and the choices you have. Information you share with us during medical care is also protected by applicable health-privacy laws and our separate notice of privacy practices, available on request.`,
  },
  {
    id: "information-we-collect",
    title: "Information we collect",
    body: `**Information you give us** — when you request a consultation or contact us, we collect your name, email, phone number, the areas or procedures you’re interested in, your preferred contact method and any message you choose to send. Please don’t include detailed medical history in website forms; we discuss that privately at your consultation.

**Information collected automatically** — we use privacy-friendly analytics that do **not** use cookies or track you across other websites. They record anonymous, aggregated information such as pages viewed, approximate country and device type.

**How you found us** — if you arrive from an ad or a link containing campaign tags, we note the campaign name and referring website with your consultation request. This helps us understand which channels are useful. It is stored only in your browser session until you submit a form.`,
  },
  {
    id: "how-we-use",
    title: "How we use your information",
    body: `We use your information to:

- respond to your enquiry and arrange your consultation;
- send appointment reminders by text, **only** if you opted in;
- send news or offers by email, **only** if you opted in;
- improve our website and understand which services interest visitors;
- meet our legal, regulatory and record-keeping obligations.

We never sell your personal information, and we don’t use advertising pixels on our forms or patient pages.`,
  },
  {
    id: "photos",
    title: "Patient photographs",
    body: `Before-and-after photographs are part of your medical record. We publish a photo **only** with your separate, signed written authorization, which states where it may appear (for example our website or social media) and whether your face may be shown. You can withdraw your authorization at any time; we will remove the photo from our website and stop future use.`,
  },
  {
    id: "sharing",
    title: "Who we share information with",
    body: `We share information only with service providers who help us operate — such as secure hosting, scheduling, email and text-message services — under contracts that require them to protect it and use it only for our purposes. Providers handling health information sign appropriate data-protection agreements. We may also disclose information when required by law.`,
  },
  {
    id: "cookies",
    title: "Cookies & tracking",
    body: `This website does not use advertising or cross-site tracking cookies. Our analytics are cookieless. We use your browser’s temporary session storage for two conveniences: remembering that you confirmed you are 18+ to view the gallery, and remembering how you arrived at the site for your consultation request. Both are cleared when you close the tab.`,
  },
  {
    id: "security-retention",
    title: "Security & retention",
    body: `Information is transmitted over encrypted connections and stored with access limited to staff who need it. Staff accounts use multi-factor authentication, and access to patient enquiries is logged. We keep enquiry information only as long as needed to respond and to meet legal requirements, then delete or anonymize it.`,
  },
  {
    id: "your-rights",
    title: "Your choices & rights",
    body: `Depending on where you live, you may have the right to access, correct or delete your personal information, to object to or limit certain uses, and to withdraw consent. You can unsubscribe from emails using the link in any message and stop texts by replying **STOP**.

To make a request, email [${c.email}](mailto:${c.email}) or call ${c.phone}. We will verify your identity and respond within the time required by law.`,
  },
  {
    id: "children",
    title: "Children",
    body: `This website is intended for adults. We do not knowingly collect information from anyone under 18 through this site. Consultations for minors require a parent or guardian.`,
  },
  {
    id: "changes-contact",
    title: "Changes & contact",
    body: `We may update this policy from time to time and will change the “last updated” date above. Questions? Contact our privacy officer at [${c.email}](mailto:${c.email}) or ${formatAddress(c.address)}.`,
  },
];

export default async function PrivacyPage() {
  const sections = buildSections(await getSiteSettings());
  return (
    <LegalPage
      eyebrow="Privacy policy"
      title={
        <>
          Your privacy, <em>protected.</em>
        </>
      }
      intro="We collect only what we need to care for you — and we never sell your information."
      updated="November 18, 2026"
      path="/privacy"
      sections={sections}
    />
  );
}
