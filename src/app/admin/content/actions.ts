"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { ActionError, runStaffAction, type ActionResult } from "@/lib/admin/action";
import { logAudit } from "@/lib/admin/audit";
import { clinicDayKey } from "@/lib/admin/time";
import { isBuiltInPost, newPostFields } from "@/lib/cms/journal";
import { cmsTag } from "@/lib/cms/read";
import { resolveKind } from "@/lib/cms/registry";
import { postSlugSchema } from "@/lib/cms/schemas";
import {
  deleteDocument,
  discardDraft,
  getDocument,
  getRevisionData,
  publishDraft,
  saveDraft,
  unpublish,
} from "@/lib/cms/store";

function kindOrThrow(kind: string, key: string) {
  const def = resolveKind(kind, key);
  if (!def) throw new ActionError("Unknown content.");
  return def;
}

function validate(kind: string, key: string, data: unknown) {
  const parsed = kindOrThrow(kind, key).schema.safeParse(data);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ActionError(issue ? `${issue.path.join(" › ") || "Form"}: ${issue.message}` : "Please check the form.");
  }
  return parsed.data;
}

const run = (fn: (staffId: string) => Promise<void>) => runStaffAction("content", fn);

/** Save edits as a draft. Only visible in preview until published. */
export async function saveContentDraft(kind: string, key: string, data: unknown): Promise<ActionResult> {
  return run(async (staffId) => {
    await saveDraft(kind, key, validate(kind, key, data), staffId);
    await logAudit(staffId, "content.draft_saved", kind, key);
  });
}

/** Save the given edits (if any) and publish them to the public site. */
export async function publishContent(kind: string, key: string, data?: unknown): Promise<ActionResult> {
  return run(async (staffId) => {
    if (data !== undefined) await saveDraft(kind, key, validate(kind, key, data), staffId);
    else kindOrThrow(kind, key);
    if (!(await publishDraft(kind, key, staffId))) throw new ActionError("There are no changes to publish.");
    updateTag(cmsTag(kind));
    await logAudit(staffId, "content.published", kind, key);
  });
}

export async function discardContentDraft(kind: string, key: string): Promise<ActionResult> {
  return run(async (staffId) => {
    kindOrThrow(kind, key);
    await discardDraft(kind, key);
    await logAudit(staffId, "content.draft_discarded", kind, key);
  });
}

/** Go back to the built-in default content on the public site. Revisions are kept. */
export async function revertToDefault(kind: string, key: string): Promise<ActionResult> {
  return run(async (staffId) => {
    kindOrThrow(kind, key);
    if (!(await unpublish(kind, key))) throw new ActionError("This page already shows the default content.");
    updateTag(cmsTag(kind));
    await logAudit(staffId, "content.reverted_to_default", kind, key);
  });
}

/** Start a new journal post as a draft. The address (slug) can't change afterwards. */
export async function createPost(slug: string, title: string): Promise<ActionResult> {
  const s = postSlugSchema.safeParse(slug);
  if (!s.success) return { ok: false, error: s.error.issues[0]?.message ?? "Invalid address." };
  const t = z.string().trim().min(1, "Enter a title.").max(120).safeParse(title);
  if (!t.success) return { ok: false, error: t.error.issues[0]?.message ?? "Invalid title." };

  return run(async (staffId) => {
    if (isBuiltInPost(s.data) || (await getDocument("post", s.data))) {
      throw new ActionError("A post with this address already exists. Choose another.");
    }
    await saveDraft("post", s.data, newPostFields(t.data, clinicDayKey(new Date())), staffId);
    await logAudit(staffId, "content.post_created", "post", s.data);
  });
}

/** Permanently delete a post created in the admin. Built-in articles can only be hidden. */
export async function deletePost(slug: string): Promise<ActionResult> {
  return run(async (staffId) => {
    kindOrThrow("post", slug);
    if (isBuiltInPost(slug)) throw new ActionError("Built-in articles can't be deleted. Hide them instead.");
    await deleteDocument("post", slug);
    updateTag(cmsTag("post"));
    await logAudit(staffId, "content.post_deleted", "post", slug);
  });
}

/** Load an earlier published version into the draft, to review and publish again. */
export async function restoreRevision(kind: string, key: string, revisionId: number): Promise<ActionResult> {
  const id = z.number().int().positive().safeParse(revisionId);
  if (!id.success) return { ok: false, error: "Invalid version." };
  return run(async (staffId) => {
    const data = await getRevisionData(kind, key, id.data);
    if (data == null) throw new ActionError("That version no longer exists.");
    const parsed = kindOrThrow(kind, key).schema.safeParse(data);
    if (!parsed.success) throw new ActionError("That version uses an older format and can't be restored.");
    await saveDraft(kind, key, parsed.data, staffId);
    await logAudit(staffId, "content.revision_restored", kind, `${key}#${id.data}`);
  });
}
