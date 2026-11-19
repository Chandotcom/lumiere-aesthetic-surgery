import "server-only";
import { credentials, faqs, images, journey, stats, testimonials } from "@/lib/content/home";
import { site } from "@/lib/site";
import { readContent } from "./read";
import { homeSchema, type HomeContent } from "./schemas";

/** The built-in homepage copy (what the site shows until an edit is published). */
export function homeDefaults(): HomeContent {
  return {
    hero: {
      eyebrow: `${site.surgeon} · Board-certified plastic surgeon`,
      heading: "Natural results, *refined* by expertise.",
      intro: "Surgical and non-surgical care for the face, breast and body — planned around you, never around a trend.",
      image: { ...images.hero },
      badgeTitle: "Board-certified",
      badgeText: "15+ years in aesthetic surgery",
      trustLine: "Rated 4.9 by our patients · Private, surgeon-led consultations",
    },
    statement: {
      text: "We believe the finest plastic surgery is the kind no one can point to. Our work is about *balance, proportion and restraint* — helping you look like yourself, only more at ease.",
      body: "Every plan begins with listening. Dr. Marsh personally leads each consultation, explains every option — including doing nothing — and only recommends what she would choose for her own family.",
      image: { ...images.statement },
    },
    surgeon: {
      heading: "Surgical precision. *An artist’s restraint.*",
      quote: "The best result is the one people notice without knowing why.",
      intro: "With more than fifteen years in aesthetic surgery, Dr. Marsh is known for natural, proportion-led results and an unhurried approach to every patient she meets.",
      image: { ...images.surgeon },
      credentials: credentials.map((value) => ({ value })),
      stats: stats.map((s) => ({ ...s })),
    },
    journey: {
      heading: "Cared for at *every step.*",
      intro: "From your first question to your one-year check-in, you’ll always know what happens next — and who to call.",
      image: { ...images.journey },
      steps: journey.map((s) => ({ ...s })),
    },
    testimonials: {
      heading: "In their *own words.*",
      items: testimonials.map((t) => ({ ...t, image: { ...t.image } })),
    },
    faq: {
      heading: "Good questions, *honest answers.*",
      items: faqs.map((f) => ({ ...f })),
    },
    finalCta: {
      heading: "Your consultation, *your pace.*",
      intro: "A private, no-pressure conversation with Dr. Marsh — in person or virtually. Most consultations are available within a week.",
      image: { ...images.finalCta },
    },
  };
}

/** Homepage content: the published edit (draft in preview), else the defaults. */
export async function getHomeContent(): Promise<HomeContent> {
  const docs = await readContent("home");
  const parsed = homeSchema.safeParse(docs.main);
  return parsed.success ? parsed.data : homeDefaults();
}
