import "server-only";
import { after } from "next/server";
import { procedures } from "@/lib/content/procedures";
import { getGalleryCases } from "@/lib/gallery/read";
import { trustedRequestOrigin } from "@/lib/request-origin";
import { findPagesUsingForm, listDocuments } from "./store";
import { posts as builtInPosts } from "@/lib/content/journal";

/**
 * Why this exists: pages under a dynamic route (/[page], /forms/[slug], /procedures/[slug],
 * /blog/[slug], /gallery/[case]) are cached as whole pages. After `updateTag`, Next 16 serves the
 * old cached page ONE more time while it rebuilds in the background (fully static routes such as
 * /consultation don't have this). Without help, that one stale response goes to whoever opens
 * the page first — usually the staff member checking their change.
 *
 * So after a publish we request the affected pages ourselves, after the response is sent. That
 * request absorbs the stale copy and starts the rebuild, and the next visitor gets fresh content.
 */
export async function warmAfterChange(kind: string, key: string) {
  const origin = await trustedRequestOrigin();
  if (!origin) return;
  after(async () => {
    try {
      const paths = await affectedPaths(kind, key);
      await warm(origin, paths);
    } catch (err) {
      console.warn("[cms] cache warm-up skipped:", err instanceof Error ? err.message : "unknown error");
    }
  });
}

/** Every page under a dynamic route, for changes that show site-wide (contact details, homepage blocks). */
async function allDynamicPaths() {
  const [pageDocs, formDocs, postDocs, cases] = await Promise.all([
    listDocuments("page"),
    listDocuments("form"),
    listDocuments("post"),
    getGalleryCases().catch(() => []),
  ]);
  const postSlugs = new Set([...builtInPosts.map((p) => p.slug), ...postDocs.map((d) => d.key)]);
  return [
    ...procedures.map((p) => `/procedures/${p.slug}`),
    ...[...postSlugs].map((s) => `/blog/${s}`),
    ...pageDocs.map((d) => `/${d.key}`),
    ...formDocs.map((d) => `/forms/${d.key}`),
    ...cases.map((c) => `/gallery/${c.slug}`),
  ];
}

async function affectedPaths(kind: string, key: string): Promise<string[]> {
  switch (kind) {
    case "procedure":
      return [`/procedures/${key}`];
    case "post":
      return [`/blog/${key}`];
    case "page":
      return [`/${key}`];
    case "form": {
      const pages = await findPagesUsingForm(key);
      return [`/forms/${key}`, ...pages.map((p) => `/${p.key}`)];
    }
    case "settings":
    case "home":
      return allDynamicPaths();
    default:
      // SEO and the consultation form only change fully static pages, which refresh on their own.
      return [];
  }
}

/**
 * Request each path, a few at a time. A small change (one page) gets a second pass: a deleted page
 * sometimes needs two requests before its 404 replaces the cached copy. Failures are ignored,
 * because this only speeds things up.
 */
async function warm(origin: string, paths: string[]) {
  const unique = [...new Set(paths)];
  const passes = unique.length <= 10 ? 2 : 1;
  for (let pass = 0; pass < passes; pass++) {
    const queue = [...unique];
    const worker = async () => {
      for (let path = queue.shift(); path; path = queue.shift()) {
        await fetch(new URL(path, origin), { cache: "no-store", headers: { "x-lumiere-warm": "1" } })
          .then((r) => r.body?.cancel())
          .catch(() => {});
      }
    };
    await Promise.all(Array.from({ length: 4 }, worker));
  }
}
