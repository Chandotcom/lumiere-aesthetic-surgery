import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { BackToContent, EditorPage } from "@/components/admin/cms/editor-page";
import { SeoEditor } from "@/components/admin/cms/settings-editor";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { loadEditorData } from "@/lib/cms/editor-data";
import { seoSchema } from "@/lib/cms/schemas";
import { seoDefaults } from "@/lib/cms/settings";

export const metadata: Metadata = { title: "SEO titles & descriptions" };

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
  return loadEditorData("seo", "main", seoSchema, seoDefaults);
}

async function Editor() {
  if (!hasDatabase()) return <DbNotice />;
  const { initial, state, revisions, editorKey } = await load();
  return (
    <EditorPage
      title="SEO titles & descriptions"
      description="How the main pages appear in search results and link previews. Procedure and journal pages use their own summaries."
      livePath="/"
      kind="seo"
      contentKey="main"
      revisions={revisions}
    >
      <SeoEditor key={editorKey} initial={initial} state={state} />
    </EditorPage>
  );
}
