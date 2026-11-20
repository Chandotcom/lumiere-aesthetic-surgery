import "server-only";
import { pageSchema, type PageFields } from "./page-schema";
import { readContent, readDocument } from "./read";

/**
 * Section-built pages, keyed by slug: published versions for visitors, drafts in staff preview.
 * Cached with the CMS (`cms:page`), so publishing refreshes them straight away. Stored data
 * that no longer matches the schema is skipped rather than breaking the page.
 */
export async function getPages(): Promise<Map<string, PageFields>> {
  const docs = await readContent("page");
  const out = new Map<string, PageFields>();
  for (const [slug, data] of Object.entries(docs)) {
    const parsed = pageSchema.safeParse(data);
    if (parsed.success) out.set(slug, parsed.data);
  }
  return out;
}

export async function getPage(slug: string): Promise<PageFields | undefined> {
  const parsed = pageSchema.safeParse(await readDocument("page", slug));
  return parsed.success ? parsed.data : undefined;
}
