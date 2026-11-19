import "server-only";
import type { z } from "zod";
import { getStaff } from "@/lib/admin/session";
import { formatClinicDateTime } from "@/lib/admin/time";
import { getDocument, listRevisions } from "./store";

/**
 * Everything an editor page needs for one document: the values the form starts from
 * (draft, else the live version, else the code defaults), its publish state, the version
 * history, and a key that remounts the form whenever the stored versions change.
 */
export async function loadEditorData<T>(kind: string, key: string, schema: z.ZodType<T>, defaults: () => T) {
  const [doc, revisions, staff] = await Promise.all([getDocument(kind, key), listRevisions(kind, key), getStaff()]);
  const stored = schema.safeParse(doc?.draft ?? doc?.published);
  return {
    initial: stored.success ? stored.data : defaults(),
    state: {
      hasDraft: doc?.draft != null,
      hasPublished: doc?.published != null,
      draftUpdatedAt: doc?.draftUpdatedAt ? formatClinicDateTime(doc.draftUpdatedAt) : null,
      publishedAt: doc?.publishedAt ? formatClinicDateTime(doc.publishedAt) : null,
    },
    revisions: revisions.map((r) => ({
      id: r.id,
      label: `${formatClinicDateTime(r.createdAt)}${r.publishedBy && r.publishedBy === staff?.id ? " · you" : ""}`,
    })),
    editorKey: `${doc?.draftUpdatedAt?.getTime() ?? 0}-${doc?.publishedAt?.getTime() ?? 0}`,
  };
}
