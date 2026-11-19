"use client";

import { useEffect } from "react";

const KEY = "lumiere:attribution";

export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  landingPage?: string;
};

/**
 * Stores FIRST-touch attribution (UTM params + external referrer + landing page) for this tab
 * session, so the consultation form can say which channel produced the lead.
 * First-party only: no cookies, no third-party pixels, nothing sent anywhere until the form is submitted.
 */
export function AttributionCapture() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) return;
      const url = new URL(window.location.href);
      const ref = document.referrer && new URL(document.referrer).host !== url.host ? document.referrer : "";
      const data: Attribution = {
        utmSource: url.searchParams.get("utm_source") ?? undefined,
        utmMedium: url.searchParams.get("utm_medium") ?? undefined,
        utmCampaign: url.searchParams.get("utm_campaign") ?? undefined,
        referrer: ref || undefined,
        landingPage: url.pathname,
      };
      sessionStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // Storage blocked (private mode etc.) — attribution is optional.
    }
  }, []);
  return null;
}

export function readAttribution(): Attribution {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "{}") as Attribution;
  } catch {
    return {};
  }
}
