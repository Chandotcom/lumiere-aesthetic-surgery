"use client";

import { useSyncExternalStore } from "react";

/**
 * Cookie / storage consent for the public site.
 *
 * - Necessary (always on): remembering this choice, the gallery 18+ confirmation, and sign-in
 *   cookies on staff pages.
 * - Analytics: Vercel Web Analytics (cookieless, first-party, aggregated).
 * - Marketing: first-touch attribution (UTM campaign + referrer), so the clinic knows which channel
 *   produced an enquiry. Any future ad pixel must also wait for this.
 *
 * The choice lives in localStorage (it is itself strictly necessary). It expires after 12 months or
 * when CONSENT_VERSION changes, and then we ask again. Global Privacy Control turns marketing off.
 */
export type Consent = { version: number; analytics: boolean; marketing: boolean; decidedAt: string };

export const CONSENT_VERSION = 1;
const KEY = "lumiere:consent";
const MAX_AGE_MS = 365 * 86_400_000;
const CHANGE = "lumiere:consent-change";
const OPEN = "lumiere:consent-open";

/** True when the browser sends Global Privacy Control, a legally recognised opt-out in some places. */
export function hasGlobalPrivacyControl() {
  return typeof navigator !== "undefined" && (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

let cachedRaw: string | null | undefined;
let cachedValue: Consent | null = null;

/** The stored, still-valid choice, or null when the visitor hasn't decided (or it expired). */
export function readConsent(): Consent | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cachedValue; // storage blocked: whatever was chosen on this page view
  }
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  cachedValue = null;
  try {
    const parsed = raw ? (JSON.parse(raw) as Consent) : null;
    if (
      parsed &&
      parsed.version === CONSENT_VERSION &&
      typeof parsed.analytics === "boolean" &&
      typeof parsed.marketing === "boolean" &&
      Date.now() - Date.parse(parsed.decidedAt) < MAX_AGE_MS
    ) {
      cachedValue = parsed;
    }
  } catch {
    // Corrupt value: treat as undecided.
  }
  return cachedValue;
}

export function saveConsent(choice: { analytics: boolean; marketing: boolean }) {
  const value: Consent = {
    version: CONSENT_VERSION,
    analytics: choice.analytics,
    // GPC is an opt-out of "sale/sharing"; honour it for marketing even when "Accept all" is clicked.
    marketing: choice.marketing && !hasGlobalPrivacyControl(),
    decidedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Storage blocked: the choice applies to this page view only.
    cachedRaw = JSON.stringify(value);
    cachedValue = value;
  }
  window.dispatchEvent(new Event(CHANGE));
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && onChange();
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onStorage); // other tabs
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

const PENDING = "pending" as const;

/**
 * The visitor's choice. `"pending"` during server rendering and hydration (we don't know yet),
 * null when undecided, otherwise the choice.
 */
export function useConsent(): Consent | null | typeof PENDING {
  return useSyncExternalStore<Consent | null | typeof PENDING>(subscribe, readConsent, () => PENDING);
}

/** Open the preferences dialog from anywhere (footer "Cookie settings"). */
export function openConsentSettings() {
  window.dispatchEvent(new Event(OPEN));
}

export function onOpenConsentSettings(handler: () => void) {
  window.addEventListener(OPEN, handler);
  return () => window.removeEventListener(OPEN, handler);
}
