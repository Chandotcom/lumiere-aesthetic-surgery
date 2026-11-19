// Central site config. Fictional demo brand — never replace with a real clinic's identity
// unless the site is being rebranded for that clinic.
export const site = {
  name: "Lumière Aesthetic Surgery",
  shortName: "Lumière",
  surgeon: "Dr. Elena Marsh, MD",
  description:
    "Board-certified plastic surgery and aesthetic treatments. A fictional demo practice.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  phone: "+1 (555) 010-0199",
  email: "hello@lumiere-demo.example",
  isDemo: true,
  /** IANA zone the clinic works in. Admin times are entered and shown in it, whatever the server's zone. */
  timeZone: process.env.NEXT_PUBLIC_CLINIC_TIME_ZONE ?? "America/New_York",
  // Static (not new Date()) so pages can be fully prerendered under Cache Components.
  copyrightYear: 2026,
} as const;

/** SEO-ready but noindex by default. Flip NEXT_PUBLIC_ALLOW_INDEXING=true for a real clinic. */
export const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";
