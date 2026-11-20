import "server-only";
import { headers } from "next/headers";
import { site } from "@/lib/site";

/**
 * This request's origin (e.g. https://clinic.vercel.app), but only if the host is one we know:
 * localhost, the configured site URL, or one of this Vercel project's own domains. Anything else
 * (a spoofed Host header) gives null, so the result is safe to fetch or to put in a link.
 */
export async function trustedRequestOrigin(): Promise<string | null> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;
  const allowed = new Set(
    [
      new URL(site.url).host,
      process.env.VERCEL_URL,
      process.env.VERCEL_BRANCH_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ].filter(Boolean),
  );
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  if (!local && !allowed.has(host)) return null;
  const proto = h.get("x-forwarded-proto") ?? (local ? "http" : "https");
  return `${proto}://${host}`;
}
