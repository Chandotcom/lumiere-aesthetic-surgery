import { z } from "zod";

// Shapes of editable content. Shared by the admin forms (instant feedback) and the server
// (source of truth). Structural fields (slugs, names, categories) are NOT editable here:
// they drive links, filters, navigation and the consultation form.

const text = (max: number, label = "This field") =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} is limited to ${max} characters.`);

/** Images must come from a host next/image allows (see images.remotePatterns in next.config.ts). */
export const ALLOWED_IMAGE_PREFIX = "https://images.unsplash.com/";

export const imageSchema = z.object({
  src: z
    .string()
    .trim()
    .startsWith(ALLOWED_IMAGE_PREFIX, `Use an image URL starting with ${ALLOWED_IMAGE_PREFIX}`)
    .max(500),
  alt: text(200, "Alt text"),
});

const qa = z.object({ question: text(200, "Question"), answer: text(1500, "Answer") });

// ── Procedures ───────────────────────────────────────────────────────────
export const procedureFieldsSchema = z.object({
  tagline: text(160, "Tagline"),
  summary: text(600, "Summary"),
  image: imageSchema,
  facts: z.object({
    duration: text(60, "Procedure time"),
    anesthesia: text(60, "Anesthesia"),
    recovery: text(60, "Recovery"),
    results: text(60, "Results"),
  }),
  price: z
    .object({
      from: z.number({ error: "Enter a number." }).int().min(0).max(1_000_000),
      to: z.number({ error: "Enter a number." }).int().min(0).max(1_000_000),
    })
    .refine((p) => p.to >= p.from, { path: ["to"], message: "Must be at least the starting price." }),
  idealFor: z.array(z.object({ value: text(200, "Item") })).min(1, "Add at least one item.").max(10),
  timeline: z
    .array(z.object({ when: text(60, "Step title"), what: text(400, "Description") }))
    .min(1, "Add at least one step.")
    .max(8),
  faqs: z.array(qa).min(1, "Add at least one question.").max(12),
  /** Optional. Empty strings mean "use the automatic title / the summary". */
  seo: z.object({
    title: z.string().trim().max(70, "Title is limited to 70 characters."),
    description: z.string().trim().max(220, "Description is limited to 220 characters."),
  }),
});

export type ProcedureFields = z.infer<typeof procedureFieldsSchema>;

// ── Homepage ─────────────────────────────────────────────────────────────
/** Headings may mark one accent phrase with *asterisks*, rendered in the bronze accent style. */
const heading = (label = "Heading", max = 120) =>
  text(max, label).refine((v) => (v.match(/\*/g)?.length ?? 0) % 2 === 0, {
    message: "Accent markers (*) must come in pairs, e.g. Natural results, *refined* by expertise.",
  });

export const homeSchema = z.object({
  hero: z.object({
    eyebrow: text(100, "Eyebrow"),
    heading: heading(),
    intro: text(300, "Intro"),
    image: imageSchema,
    badgeTitle: text(40, "Badge title"),
    badgeText: text(60, "Badge text"),
    trustLine: text(140, "Trust line"),
  }),
  statement: z.object({
    text: heading("Statement", 400),
    body: text(500, "Body"),
    image: imageSchema,
  }),
  surgeon: z.object({
    heading: heading(),
    quote: text(200, "Quote"),
    intro: text(400, "Intro"),
    image: imageSchema,
    credentials: z.array(z.object({ value: text(120, "Credential") })).min(1).max(6),
    stats: z
      .array(z.object({ value: text(10, "Value"), suffix: z.string().trim().max(4), label: text(60, "Label") }))
      .min(1)
      .max(4),
  }),
  journey: z.object({
    heading: heading(),
    intro: text(300, "Intro"),
    image: imageSchema,
    steps: z.array(z.object({ title: text(60, "Title"), text: text(240, "Text") })).min(1).max(6),
  }),
  testimonials: z.object({
    heading: heading(),
    items: z
      .array(
        z.object({
          quote: text(400, "Quote"),
          name: text(40, "Name"),
          procedure: text(60, "Procedure"),
          image: imageSchema,
        }),
      )
      .min(1)
      .max(6),
  }),
  faq: z.object({
    heading: heading(),
    items: z.array(qa).min(1).max(12),
  }),
  finalCta: z.object({
    heading: heading(),
    intro: text(300, "Intro"),
    image: imageSchema,
  }),
});

export type HomeContent = z.infer<typeof homeSchema>;

// ── Journal posts ────────────────────────────────────────────────────────
export const journalTopics = ["Guides", "Recovery", "Wellness", "Non-surgical"] as const;

/** URL slug for a new post: lowercase words joined by hyphens. Fixed once the post exists. */
export const postSlugSchema = z
  .string()
  .trim()
  .min(3, "Use at least 3 characters.")
  .max(80, "Keep the address under 80 characters.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens, e.g. my-new-article.")
  .refine((s) => s !== "new", "This address is reserved. Choose another.");

export const postSchema = z.object({
  title: text(120, "Title"),
  excerpt: text(300, "Summary"),
  category: z.enum(journalTopics, { error: "Choose a topic." }),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  readTime: text(20, "Reading time"),
  image: imageSchema,
  relatedProcedures: z.array(z.string().max(80)).max(4, "Choose up to 4 procedures."),
  /** Hidden posts stay in the admin but disappear from the public site. */
  visible: z.boolean(),
  content: text(30_000, "Article"),
});

export type PostFields = z.infer<typeof postSchema>;

// ── Site settings (contact details) ──────────────────────────────────────
export const settingsSchema = z.object({
  phone: text(30, "Phone").regex(/^[+()\d\s.-]{7,}$/, "Enter a valid phone number."),
  email: z.email("Enter a valid email address.").max(120),
  address: z.object({
    street: text(120, "Street"),
    city: text(60, "City"),
    region: text(40, "State / region"),
    postal: text(20, "Postal code"),
  }),
  hours: z.array(z.object({ days: text(40, "Days"), time: text(40, "Hours") })).min(1).max(7),
});

export type SiteSettings = z.infer<typeof settingsSchema>;

// ── SEO (titles and descriptions of the main pages) ──────────────────────
export const seoPages = {
  home: { label: "Homepage", path: "/" },
  procedures: { label: "Procedures", path: "/procedures" },
  gallery: { label: "Gallery", path: "/gallery" },
  blog: { label: "Journal", path: "/blog" },
  about: { label: "About", path: "/about" },
  contact: { label: "Contact", path: "/contact" },
  consultation: { label: "Consultation", path: "/consultation" },
} as const;

export type SeoPage = keyof typeof seoPages;

const seoEntry = z.object({
  title: text(70, "Title"),
  description: text(220, "Description"),
});

export const seoSchema = z.object({
  home: seoEntry,
  procedures: seoEntry,
  gallery: seoEntry,
  blog: seoEntry,
  about: seoEntry,
  contact: seoEntry,
  consultation: seoEntry,
} satisfies Record<SeoPage, typeof seoEntry>);

export type SeoContent = z.infer<typeof seoSchema>;
