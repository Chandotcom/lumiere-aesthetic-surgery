import "server-only";
import type { Metadata } from "next";
import { site } from "@/lib/site";
import { readContent } from "./read";
import {
  seoPages,
  seoSchema,
  settingsSchema,
  type SeoContent,
  type SeoPage,
  type SiteSettings,
} from "./schemas";

// ── Contact details ──────────────────────────────────────────────────────
export function settingsDefaults(): SiteSettings {
  return {
    phone: site.phone,
    email: site.email,
    address: { street: "123 Demo Avenue, Suite 400", city: "Anytown", region: "ST", postal: "00000" },
    hours: [
      { days: "Monday – Thursday", time: "9:00am – 5:00pm" },
      { days: "Friday", time: "9:00am – 4:00pm" },
      { days: "Saturday", time: "By appointment" },
      { days: "Sunday", time: "Closed" },
    ],
    notificationEmail: "",
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const docs = await readContent("settings");
  const parsed = settingsSchema.safeParse(docs.main);
  return parsed.success ? parsed.data : settingsDefaults();
}

export const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

export const formatAddress = (a: SiteSettings["address"]) => `${a.street}, ${a.city}, ${a.region} ${a.postal}`;

// ── SEO ──────────────────────────────────────────────────────────────────
/** Titles get the "| Lumière Aesthetic Surgery" suffix automatically, except the homepage's. */
export function seoDefaults(): SeoContent {
  return {
    home: {
      title: `${site.name} | Plastic Surgery for Face, Breast & Body`,
      description:
        "Surgeon-led plastic surgery and non-surgical treatments for the face, breast and body. Request a private consultation.",
    },
    procedures: {
      title: "Procedures — Face, Breast, Body & Non-surgical",
      description:
        "Explore surgical and non-surgical procedures at Lumière: rhinoplasty, facelift, breast augmentation, tummy tuck, liposuction, injectables and more — with recovery times and pricing.",
    },
    gallery: {
      title: "Before & After Gallery",
      description:
        "Browse before-and-after results by procedure — rhinoplasty, facelift, breast augmentation, tummy tuck and more. Every photo is unretouched and shared with written patient consent.",
    },
    blog: {
      title: "The Journal — Plastic Surgery Guides & Recovery Advice",
      description: `Honest, medically reviewed guides from ${site.surgeon}: choosing procedures, preparing for surgery, recovery timelines and non-surgical treatments.`,
    },
    about: {
      title: `About ${site.surgeon} & the Practice`,
      description: `Meet ${site.surgeon}, board-certified plastic surgeon and founder of ${site.name} — her training, philosophy and the team behind every patient’s care.`,
    },
    contact: {
      title: "Contact & Location",
      description: `Visit or contact ${site.name}: address, opening hours, phone, email, directions and parking.`,
    },
    consultation: {
      title: "Request a Consultation",
      description: `Request a private, surgeon-led consultation with ${site.surgeon} — in person or virtual. A coordinator will contact you within one business day.`,
    },
  };
}

export async function getSeo(): Promise<SeoContent> {
  const docs = await readContent("seo");
  const parsed = seoSchema.safeParse(docs.main);
  return parsed.success ? parsed.data : seoDefaults();
}

/** Page metadata from the editable SEO settings. Use in `generateMetadata`. */
export async function seoMetadata(page: SeoPage): Promise<Metadata> {
  const entry = (await getSeo())[page];
  return {
    title: page === "home" ? { absolute: entry.title } : entry.title,
    description: entry.description,
    alternates: { canonical: seoPages[page].path },
  };
}
