import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { isTrustedHost } from "@/lib/trusted-host";

// Clerk only attaches the session here. The actual "must be signed in" check lives in
// src/app/admin/layout.tsx (auth.protect()) and must be repeated in every admin
// Server Action / API route — Clerk deprecated path-matching auth in middleware.
const clerk = clerkMiddleware();

const STAFF_PATH = /^\/(admin|sign-in|sign-up|api\/admin)(\/|$)/;

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  if (STAFF_PATH.test(request.nextUrl.pathname)) return clerk(request, event);
  return missingPage(request);
}

/*
 * Real 404s for unknown URLs under the dynamic public routes (/<page>, /procedures/<slug>,
 * /blog/<slug>, /gallery/<case>, /forms/<slug>). Those pages stream, so the status is sent
 * as 200 before the page can call notFound(); only Proxy runs early enough (see Next's
 * streaming guide, "The HTTP contract").
 *
 * Only full page loads are checked. Client navigations and prefetches (RSC requests) and staff
 * previews pass straight through, and anything that fails also passes through, which just
 * means the old behaviour: "Page not found" under a 200.
 */
const POSITIVE_TTL = 60_000; // a deleted page may stay a soft 404 for up to a minute
const known = new Map<string, number>(); // path → expiry, per instance

async function missingPage(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (request.method !== "GET" && request.method !== "HEAD") return;
  if (request.headers.get("rsc") || request.headers.get("next-router-prefetch")) return;
  if (request.cookies.has("__prerender_bypass")) return; // Draft Mode: drafts aren't public yet
  const host = request.headers.get("host");
  if (!host || !isTrustedHost(host)) return;

  const expiry = known.get(pathname);
  if (expiry && expiry > Date.now()) return;

  try {
    const url = new URL("/api/route-exists", request.nextUrl.origin);
    url.searchParams.set("path", pathname);
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) return;
    const { exists } = (await res.json()) as { exists?: boolean };
    if (exists !== false) {
      if (known.size > 1000) known.clear();
      known.set(pathname, Date.now() + POSITIVE_TTL);
      return;
    }
  } catch {
    return;
  }
  // No route lives under a `_` folder, so this renders the root not-found page with status 404.
  return NextResponse.rewrite(new URL("/_missing/_", request.url));
}

export const config = {
  matcher: [
    // Staff routes: Clerk.
    "/admin/:path*",
    "/sign-in/:path*",
    "/sign-up/:path*",
    "/api/admin/:path*",
    // Dynamic public routes: the 404 check above.
    "/procedures/:slug",
    "/blog/:slug",
    "/gallery/:slug",
    "/forms/:slug",
    // Single-segment custom pages, minus the fixed routes and files (keep in sync with the
    // reserved slugs in src/lib/cms/page-schema.ts).
    "/((?!(?:about|procedures|consultation|gallery|blog|contact|privacy|terms|accessibility|forms|admin|sign-in|sign-up|api|preview|_next)$)[^/.]+)",
  ],
};
