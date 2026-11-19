"use client";

import { useEffect, useTransition } from "react";
import { FormProvider, type FieldValues, type UseFormReturn } from "react-hook-form";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  discardContentDraft,
  publishContent,
  revertToDefault,
  saveContentDraft,
} from "@/app/admin/content/actions";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/admin/action";

export type ContentState = {
  hasDraft: boolean;
  hasPublished: boolean;
  /** Preformatted in clinic time by the server. */
  draftUpdatedAt: string | null;
  publishedAt: string | null;
};

/**
 * Shared editor shell for every content kind: Save draft / Preview / Publish toolbar,
 * status line, and an unsaved-changes guard. The kind-specific fields go in `children`.
 */
export function ContentForm<T extends FieldValues>({
  form,
  kind,
  contentKey,
  state,
  children,
  revertLabel = "Revert live page to default",
  unpublishedText = "Live page shows the default content",
  extraActions,
}: {
  form: UseFormReturn<T>;
  kind: string;
  contentKey: string;
  state: ContentState;
  children: React.ReactNode;
  /** Label for removing the live version (e.g. "Unpublish" for posts with no built-in default). */
  revertLabel?: string;
  /** Status when nothing is published yet (pages without code defaults say "Not published yet"). */
  unpublishedText?: string;
  /** Extra buttons for the bottom action row (e.g. Delete post). */
  extraActions?: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const { isDirty } = form.formState;

  // Warn before leaving the page with unsaved edits.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  function run(action: () => Promise<ActionResult>, success: string, after?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(success);
        after?.();
      } else toast.error(result.error);
    });
  }

  const saveDraft = form.handleSubmit(
    (data) => run(() => saveContentDraft(kind, contentKey, data), "Draft saved", () => form.reset(data)),
    () => toast.error("Please fix the highlighted fields."),
  );

  const publish = form.handleSubmit(
    (data) => run(() => publishContent(kind, contentKey, data), "Published. The live page is updated.", () => form.reset(data)),
    () => toast.error("Please fix the highlighted fields."),
  );

  const previewHref = `/api/admin/preview?kind=${encodeURIComponent(kind)}&key=${encodeURIComponent(contentKey)}`;

  return (
    <FormProvider {...form}>
      <form onSubmit={saveDraft} noValidate className="space-y-8">
        <div className="sticky top-0 z-10 -mx-6 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-ivory/95 px-6 py-3 backdrop-blur">
          <StatusLine state={state} dirty={isDirty} unpublishedText={unpublishedText} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="outline" disabled={pending}>
              Save draft
            </Button>
            {state.hasDraft && !isDirty ? (
              <a
                href={previewHref}
                target="_blank"
                rel="noopener"
                className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-ink/80 px-2.5 text-sm font-medium hover:bg-ink hover:text-ivory"
              >
                Preview <ExternalLink className="size-3.5" aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : (
              <Button type="button" variant="outline" disabled title="Save a draft first, then preview it">
                Preview
              </Button>
            )}
            <Button type="button" disabled={pending || (!isDirty && !state.hasDraft)} onClick={() => publish()}>
              Publish
            </Button>
          </div>
        </div>

        {children}

        <div className="flex flex-wrap gap-2 border-t border-line pt-6">
          {state.hasDraft && (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => run(() => discardContentDraft(kind, contentKey), "Draft discarded")}
            >
              Discard draft
            </Button>
          )}
          {state.hasPublished && (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => run(() => revertToDefault(kind, contentKey), "Done. The live page is updated.")}
            >
              {revertLabel}
            </Button>
          )}
          {extraActions}
        </div>
      </form>
    </FormProvider>
  );
}

function StatusLine({ state, dirty, unpublishedText }: { state: ContentState; dirty: boolean; unpublishedText: string }) {
  const parts: string[] = [];
  if (dirty) parts.push("Unsaved changes");
  else if (state.hasDraft) parts.push(`Draft saved ${state.draftUpdatedAt ?? ""}`.trim());
  parts.push(state.hasPublished ? `Live version published ${state.publishedAt ?? ""}`.trim() : unpublishedText);
  return (
    <p className="text-sm text-stone" aria-live="polite">
      {parts.join(" · ")}
    </p>
  );
}
