import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { BackToContent, EditorPage } from "@/components/admin/cms/editor-page";
import { HomeEditor } from "@/components/admin/cms/home-editor";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { loadEditorData } from "@/lib/cms/editor-data";
import { homeSchema } from "@/lib/cms/schemas";
import { homeDefaults } from "@/lib/cms/home";

export const metadata: Metadata = { title: "Homepage" };

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
  return loadEditorData("home", "main", homeSchema, homeDefaults);
}

async function Editor() {
  if (!hasDatabase()) return <DbNotice />;
  const { initial, state, revisions, editorKey } = await load();
  return (
    <EditorPage
      title="Homepage"
      description="Text and photos of the homepage sections. The FAQ, patient stories and closing banner also appear on other pages."
      livePath="/"
      kind="home"
      contentKey="main"
      revisions={revisions}
    >
      <HomeEditor key={editorKey} initial={initial} state={state} />
    </EditorPage>
  );
}
