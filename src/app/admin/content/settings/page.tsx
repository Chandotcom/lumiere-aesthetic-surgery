import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { BackToContent, EditorPage } from "@/components/admin/cms/editor-page";
import { SettingsEditor } from "@/components/admin/cms/settings-editor";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { loadEditorData } from "@/lib/cms/editor-data";
import { settingsSchema } from "@/lib/cms/schemas";
import { settingsDefaults } from "@/lib/cms/settings";

export const metadata: Metadata = { title: "Contact details" };

export default function Page() {
  return (
    <div className="space-y-6">
      <BackToContent />
      <Suspense fallback={<Skeleton className="h-[40rem] w-full" />}>
        <Editor />
      </Suspense>
    </div>
  );
}

async function load() {
  await connection();
  return loadEditorData("settings", "main", settingsSchema, settingsDefaults);
}

async function Editor() {
  if (!hasDatabase()) return <DbNotice />;
  const { initial, state, revisions, editorKey } = await load();
  return (
    <EditorPage
      title="Contact details"
      description="Phone, email, address and opening hours, used across the whole site."
      livePath="/contact"
      kind="settings"
      contentKey="main"
      revisions={revisions}
    >
      <SettingsEditor key={editorKey} initial={initial} state={state} />
    </EditorPage>
  );
}
