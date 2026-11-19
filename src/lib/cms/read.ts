import "server-only";
import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { draftMode } from "next/headers";
import { getDb, schema } from "@/db";

export const cmsTag = (kind: string) => `cms:${kind}`;

/**
 * All documents of one kind, keyed by document key, for the public site.
 * Normal visitors get the published versions, cached until a publish calls updateTag.
 * In Draft Mode (staff preview) the cache is bypassed and drafts win over published versions.
 * Without a database, or on a read error, returns {} so the code defaults are shown.
 */
export async function readContent(kind: string): Promise<Record<string, unknown>> {
  "use cache";
  cacheTag(cmsTag(kind));
  cacheLife("max");

  const { isEnabled: preview } = await draftMode();
  if (!process.env.DATABASE_URL) return {};

  try {
    const rows = await getDb()
      .select({
        key: schema.contentDocuments.key,
        draft: schema.contentDocuments.draft,
        published: schema.contentDocuments.published,
      })
      .from(schema.contentDocuments)
      .where(eq(schema.contentDocuments.kind, kind));

    const out: Record<string, unknown> = {};
    for (const r of rows) {
      const value = preview ? (r.draft ?? r.published) : r.published;
      if (value != null) out[r.key] = value;
    }
    return out;
  } catch (err) {
    // Don't pin a failed read for long; fall back to defaults and retry soon.
    cacheLife("minutes");
    // A warning, not an error: the page still renders (with the built-in content), so this
    // shouldn't trigger the dev error overlay. It still shows in the terminal and server logs.
    const cause = err instanceof Error && err.cause != null ? (err.cause instanceof Error ? err.cause.message : String(err.cause)) : null;
    const reason = cause ?? (err instanceof Error ? err.message : String(err));
    console.warn(`[cms] Couldn't read "${kind}" content, showing the built-in version instead. Reason: ${reason}`);
    return {};
  }
}

/** True while a staff member is previewing drafts. Safe to call inside `'use cache'`. */
export async function isPreview() {
  return (await draftMode()).isEnabled;
}
