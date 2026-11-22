import { NextResponse, type NextRequest } from "next/server";
import { getPostBySlug } from "@/lib/cms/journal";
import { getForm } from "@/lib/cms/forms";
import { getPage } from "@/lib/cms/pages";
import { RESERVED_SLUGS } from "@/lib/cms/page-schema";
import { getProcedureBySlug } from "@/lib/cms/procedures";
import { getGalleryCase } from "@/lib/gallery/read";

/**
 * Does a URL under one of the dynamic public routes exist? Proxy asks this before the page
 * renders, so unknown URLs get a real 404 status. Pages stream (Cache Components), so a
 * notFound() inside the page can only show the 404 content under a 200 status.
 *
 * It uses the same cached readers as the pages, so the answer matches what the page would
 * render and refreshes on publish. It only reveals what the public pages show anyway.
 */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") ?? "";
  return NextResponse.json({ exists: await exists(path) }, { headers: { "Cache-Control": "no-store" } });
}

async function exists(path: string): Promise<boolean> {
  const parts = path.split("/").filter(Boolean).map(safeDecode);
  if (parts.some((p) => p === null)) return false;
  const [a, b] = parts as string[];
  // A fixed route (e.g. /about) always exists, even if the Proxy matcher ever lets one through.
  if (parts.length === 1) return RESERVED_SLUGS.has(a) || Boolean(await getPage(a));
  if (parts.length !== 2) return false;
  switch (a) {
    case "procedures":
      return Boolean(await getProcedureBySlug(b));
    case "blog":
      return Boolean(await getPostBySlug(b));
    case "gallery":
      return Boolean(await getGalleryCase(b));
    case "forms":
      return Boolean(await getForm(b));
    default:
      return false;
  }
}

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return null;
  }
}
