import "server-only";
import { headers } from "next/headers";
import { isLocalHost, isTrustedHost } from "@/lib/trusted-host";

/**
 * This request's origin (e.g. https://clinic.vercel.app), but only if the host is one we know:
 * localhost, the configured site URL, or one of this Vercel project's own domains. Anything else
 * (a spoofed Host header) gives null, so the result is safe to fetch or to put in a link.
 */
export async function trustedRequestOrigin(): Promise<string | null> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host || !isTrustedHost(host)) return null;
  const proto = h.get("x-forwarded-proto") ?? (isLocalHost(host) ? "http" : "https");
  return `${proto}://${host}`;
}
