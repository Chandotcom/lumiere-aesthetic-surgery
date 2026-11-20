import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { ConsultationEditor } from "@/components/admin/cms/consultation-editor";
import { BackToForms, EditorPage } from "@/components/admin/cms/editor-page";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { consultationDefaults, consultationTextsSchema } from "@/lib/cms/consultation-schema";
import { loadEditorData } from "@/lib/cms/editor-data";

export const metadata: Metadata = { title: "Consultation form" };

export default function Page() {
  return (
    <div className="space-y-6">
      <BackToForms />
      <Suspense fallback={<Skeleton className="h-[40rem] w-full" />}>
        <Editor />
      </Suspense>
    </div>
  );
}

async function load() {
  await connection();
  return loadEditorData("consultation", "main", consultationTextsSchema, consultationDefaults);
}

async function Editor() {
  if (!hasDatabase()) return <DbNotice />;
  const { initial, state, revisions, editorKey } = await load();
  return (
    <EditorPage
      eyebrow="Form"
      title="Consultation form"
      description="The wording of the 3-step consultation request. The questions and the answers stored with each lead stay the same."
      livePath="/consultation"
      kind="consultation"
      contentKey="main"
      revisions={revisions}
    >
      <ConsultationEditor key={editorKey} initial={initial} state={state} />
    </EditorPage>
  );
}
