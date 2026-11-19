"use client";

import { useEffect } from "react";
import { readConsent, useConsent } from "@/lib/consent";

const KEY = "lumiere:attribution";

export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  landingPage?: string;
};

// First-touch details kept in memory only (not stored) until the visitor decides, so accepting on a
// later page still credits the right campaign. Client navigations keep this module alive.
let firstTouch: Attribution | null = null;

function captureFirstTouch(): Attribution {
  if (firstTouch) return firstTouch;
  const url = new URL(window.location.href);
  const ref = document.referrer && new URL(document.referrer).host !== url.host ? document.referrer : "";
  firstTouch = {
    utmSource: url.searchParams.get("utm_source") ?? undefined,
    utmMedium: url.searchParams.get("utm_medium") ?? undefined,
    utmCampaign: url.searchParams.get("utm_campaign") ?? undefined,
    referrer: ref || undefined,
    landingPage: url.pathname,
  };
  return firstTouch;
}

/**
 * Stores FIRST-touch attribution (UTM params + external referrer + landing page) for this tab
 * session, so the consultation form can say which channel produced the lead.
 * First-party only: no cookies, no third-party pixels, nothing sent anywhere until the form is submitted.
 * Runs only with "marketing attribution" consent; withdrawing consent deletes what was stored.
 */
export function AttributionCapture() {
  const consent = useConsent();
  const allowed = consent !== "pending" && Boolean(consent?.marketing);
  useEffect(() => {
    if (consent === "pending") return;
    try {
      const data = captureFirstTouch();
      if (!allowed) {
        sessionStorage.removeItem(KEY);
        return;
      }
      if (sessionStorage.getItem(KEY)) return;
      sessionStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // Storage blocked (private mode etc.) — attribution is optional.
    }
  }, [consent, allowed]);
  return null;
}

export function readAttribution(): Attribution {
  if (!readConsent()?.marketing) return {};
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "{}") as Attribution;
  } catch {
    return {};
  }
}
