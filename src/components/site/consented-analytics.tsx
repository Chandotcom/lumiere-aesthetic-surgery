"use client";

import { Analytics } from "@vercel/analytics/next";
import { readConsent, useConsent } from "@/lib/consent";

/**
 * Vercel Web Analytics, loaded only after the visitor allows analytics. If they withdraw consent
 * later, the script stays loaded until the next page load, but `beforeSend` drops every event.
 * Staff pages never show the banner, so they're never measured.
 */
export function ConsentedAnalytics() {
  const consent = useConsent();
  if (!consent || consent === "pending" || !consent.analytics) return null;
  return <Analytics beforeSend={(event) => (readConsent()?.analytics ? event : null)} />;
}
