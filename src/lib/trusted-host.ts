import { site } from "@/lib/site";

export function isLocalHost(host: string): boolean {
  return /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
}

/**
 * True for hosts we serve ourselves: localhost, the configured site URL and this Vercel
 * project's own domains. Check it before fetching or linking to a request-derived origin,
 * because the Host header can be spoofed. It uses no request APIs, so Proxy can call it too.
 */
export function isTrustedHost(host: string): boolean {
  if (isLocalHost(host)) return true;
  return [
    new URL(site.url).host,
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ].includes(host);
}
