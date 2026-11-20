import { z } from "zod";

/**
 * First-touch attribution (captured client-side by `AttributionCapture`, only with consent) plus
 * the honeypot. Shared by every public form that creates a lead.
 */
export const attributionShape = {
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(150).optional(),
  referrer: z.string().max(500).optional(),
  landingPage: z.string().max(500).optional(),
  company: z.string().max(0).optional(), // must stay empty — bots fill it
};

/** Derive a simple channel label from first-touch attribution. */
export function sourceFrom(utmSource?: string, referrer?: string) {
  const s = (utmSource || "").toLowerCase();
  if (s) return s.slice(0, 40);
  const r = (referrer || "").toLowerCase();
  if (r.includes("google.")) return "google";
  if (r.includes("instagram.")) return "instagram";
  if (r.includes("facebook.") || r.includes("fb.")) return "facebook";
  if (r.includes("tiktok.")) return "tiktok";
  return r ? "referral" : "website";
}

/** The attribution columns of a lead row. */
export function attributionColumns(d: { utmSource?: string; utmMedium?: string; utmCampaign?: string; referrer?: string; landingPage?: string }) {
  return {
    source: sourceFrom(d.utmSource, d.referrer),
    utmSource: d.utmSource || null,
    utmMedium: d.utmMedium || null,
    utmCampaign: d.utmCampaign || null,
    referrer: d.referrer || null,
    landingPage: d.landingPage || null,
  };
}
