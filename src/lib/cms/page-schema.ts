// Section-based pages ("page builder"). A page is a title, SEO fields and an ordered list of
// pre-designed sections (blocks). Shared by the admin editor (client) and the public renderer.
import { z } from "zod";
import { images } from "@/lib/content/home";
import { procedures } from "@/lib/content/procedures";
import { imageSchema } from "./schemas";

const text = (max: number, label = "This field") =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} is limited to ${max} characters.`);
const optional = (max: number, label = "This field") =>
  z.string().trim().max(max, `${label} is limited to ${max} characters.`);
const accentPairs = (v: string) => (v.match(/\*/g)?.length ?? 0) % 2 === 0;
const accentMessage = "Accent markers (*) must come in pairs, e.g. Natural results, *refined* by expertise.";
const heading = (label = "Heading") => text(120, label).refine(accentPairs, accentMessage);
const optionalHeading = (label = "Heading") => optional(120, label).refine(accentPairs, accentMessage);

/** Buttons may only link inside this site, so a page can't send visitors somewhere unexpected. */
const internalHref = z
  .string()
  .trim()
  .max(200)
  .regex(/^\/(?!\/)[\w\-./?=&#%]*$/, "Link to a page on this site, starting with /, e.g. /consultation.");

const optionalCta = z
  .object({ label: optional(40, "Button text"), href: z.union([internalHref, z.literal("")]) })
  .refine((c) => Boolean(c.label) === Boolean(c.href), {
    path: ["href"],
    message: "Fill in both the button text and its link, or leave both empty.",
  });
const requiredCta = z.object({ label: text(40, "Button text"), href: internalHref });

export const TONES = ["default", "alt", "dark"] as const;
const tone = z.enum(TONES);

export const blockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hero"),
    eyebrow: optional(80, "Eyebrow"),
    heading: heading(),
    intro: optional(400, "Intro"),
    image: imageSchema,
    primary: optionalCta,
    secondary: optionalCta,
  }),
  z.object({
    type: z.literal("text"),
    tone,
    heading: optionalHeading(),
    body: text(10_000, "Text"),
  }),
  z.object({
    type: z.literal("mediaText"),
    tone,
    eyebrow: optional(80, "Eyebrow"),
    heading: heading(),
    body: text(2_000, "Text"),
    image: imageSchema,
    imageSide: z.enum(["left", "right"]),
    cta: optionalCta,
  }),
  z.object({
    type: z.literal("features"),
    tone,
    heading: heading(),
    intro: optional(300, "Intro"),
    items: z
      .array(z.object({ title: text(60, "Title"), text: text(240, "Text") }))
      .min(2, "Add at least 2 points.")
      .max(6, "Up to 6 points."),
  }),
  z.object({
    type: z.literal("stats"),
    tone,
    items: z
      .array(z.object({ value: text(20, "Number"), label: text(60, "Label") }))
      .min(2, "Add at least 2 numbers.")
      .max(4, "Up to 4 numbers."),
  }),
  z.object({
    type: z.literal("faq"),
    tone,
    heading: heading(),
    items: z
      .array(z.object({ question: text(200, "Question"), answer: text(1500, "Answer") }))
      .min(1, "Add at least one question.")
      .max(12),
  }),
  z.object({
    type: z.literal("procedures"),
    tone,
    heading: heading(),
    slugs: z
      .array(z.string().refine((s) => procedures.some((p) => p.slug === s), "Unknown procedure."))
      .min(1, "Choose at least one procedure.")
      .max(8, "Choose up to 8 procedures."),
  }),
  z.object({ type: z.literal("testimonials"), heading: heading() }),
  z.object({ type: z.literal("galleryTeaser") }),
  z.object({
    type: z.literal("cta"),
    heading: heading(),
    intro: optional(300, "Intro"),
    button: requiredCta,
  }),
]);

export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block["type"];

/** These sections show site-wide content with fixed anchors, so each may appear once per page. */
const ONCE: BlockType[] = ["testimonials", "galleryTeaser"];

export const pageSchema = z.object({
  title: text(120, "Title"),
  seo: z.object({ title: optional(70, "Search title"), description: optional(220, "Search description") }),
  /** Ask search engines not to list this page (e.g. a campaign page only for one audience). */
  noindex: z.boolean(),
  blocks: z
    .array(blockSchema)
    .min(1, "Add at least one section.")
    .max(20, "Up to 20 sections per page.")
    .superRefine((blocks, ctx) => {
      for (const t of ONCE) {
        if (blocks.filter((b) => b.type === t).length > 1) {
          ctx.addIssue({ code: "custom", message: `“${blockTypes[t].label}” can only be used once per page.` });
        }
      }
    }),
});

export type PageFields = z.infer<typeof pageSchema>;

// Every existing top-level route, plus words we may want later. Pages live at /<slug>.
const RESERVED = new Set([
  "about", "procedures", "consultation", "gallery", "blog", "contact", "privacy", "terms", "accessibility",
  "admin", "sign-in", "sign-up", "api", "new", "sitemap.xml", "robots.txt", "llms.txt", "favicon.ico", "preview",
]);

export const pageSlugSchema = z
  .string()
  .trim()
  .min(3, "Use at least 3 characters.")
  .max(60, "Keep the address under 60 characters.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens, e.g. spring-offer.")
  .refine((s) => !RESERVED.has(s), "This address is already used by the site. Choose another.");

/** The section types staff can add, with a short description for the "Add section" menu. */
export const blockTypes: Record<BlockType, { label: string; description: string }> = {
  hero: { label: "Hero", description: "Big headline with a photo and buttons. Best as the first section." },
  text: { label: "Text", description: "A heading and formatted text (Markdown)." },
  mediaText: { label: "Text + photo", description: "Text beside a portrait photo, left or right." },
  features: { label: "Key points", description: "2–6 short points in a grid." },
  stats: { label: "Numbers", description: "2–4 headline figures, e.g. years of experience." },
  faq: { label: "FAQ", description: "Questions and answers, also shown in search results." },
  procedures: { label: "Procedures", description: "Cards linking to chosen procedure pages." },
  testimonials: { label: "Patient reviews", description: "The published reviews carousel." },
  galleryTeaser: { label: "Before & after preview", description: "The age-gated gallery teaser." },
  cta: { label: "Call to action", description: "A dark closing banner with one button." },
};

/** Starting values for a newly added section. Every default passes the schema. */
export function newBlock(type: BlockType): Block {
  switch (type) {
    case "hero":
      return {
        type,
        eyebrow: "",
        heading: "A headline with an *accent*",
        intro: "One or two sentences about what this page offers.",
        image: { ...images.hero },
        primary: { label: "Request a consultation", href: "/consultation" },
        secondary: { label: "", href: "" },
      };
    case "text":
      return { type, tone: "default", heading: "", body: "Write your text here. Use **bold**, lists and [links](/contact)." };
    case "mediaText":
      return {
        type,
        tone: "alt",
        eyebrow: "",
        heading: "A heading with an *accent*",
        body: "Tell the story behind this section.",
        image: { ...images.journey },
        imageSide: "right",
        cta: { label: "", href: "" },
      };
    case "features":
      return {
        type,
        tone: "default",
        heading: "Why patients *choose us*",
        intro: "",
        items: [
          { title: "First point", text: "A short explanation." },
          { title: "Second point", text: "A short explanation." },
          { title: "Third point", text: "A short explanation." },
        ],
      };
    case "stats":
      return {
        type,
        tone: "alt",
        items: [
          { value: "15+", label: "Years of experience" },
          { value: "4.9", label: "Average patient rating" },
        ],
      };
    case "faq":
      return { type, tone: "alt", heading: "Good questions, *honest answers.*", items: [{ question: "Your question?", answer: "Your answer." }] };
    case "procedures":
      return { type, tone: "default", heading: "Related *procedures*", slugs: [procedures[0].slug] };
    case "testimonials":
      return { type, heading: "In their *own words.*" };
    case "galleryTeaser":
      return { type };
    case "cta":
      return {
        type,
        heading: "Your consultation, *your pace.*",
        intro: "A private, no-pressure conversation with Dr. Marsh.",
        button: { label: "Request a consultation", href: "/consultation" },
      };
  }
}

export function newPageFields(title: string): PageFields {
  const hero = newBlock("hero") as Extract<Block, { type: "hero" }>;
  return {
    title,
    seo: { title: "", description: "" },
    noindex: false,
    blocks: [{ ...hero, heading: title.replace(/\*/g, "") }, newBlock("cta")],
  };
}
