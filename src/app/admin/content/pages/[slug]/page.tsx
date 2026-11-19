import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BackToContent, EditorPage } from "@/components/admin/cms/editor-page";
import { PageEditor } from "@/components/admin/cms/page-editor";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { loadEditorData } from "@/lib/cms/editor-data";
import { newPageFields, pageSchema, pageSlugSchema } from "@/lib/cms/page-schema";
import { getDocument } from "@/lib/cms/store";
import { procedures } from "@/lib/content/procedures";

export const metadata: Metadata = { title: "Edit page" };

export default function EditPagePage({ params }: PageProps<"/admin/content/pages/[slug]">) {
  return (
    <div className="space-y-6">
      <BackToContent />
      <Suspense fallback={<Skeleton className="h-[40rem] w-full" />}>
        <Editor params={params} />
      </Suspense>
    </div>
  );
}

async function load(slug: string) {
  await connection();
  // A page exists only once it has a stored document (created with "New page").
  if (!(await getDocument("page", slug))) return null;
  return loadEditorData("page", slug, pageSchema, () => newPageFields(slug.replace(/-/g, " ")));
}

async function Editor({ params }: Pick<PageProps<"/admin/content/pages/[slug]">, "params">) {
  const { slug } = await params;
  if (!pageSlugSchema.safeParse(slug).success) notFound();
  if (!hasDatabase()) return <DbNotice />;
  const data = await load(slug);
  if (!data) notFound();
  const { initial, state, revisions, editorKey } = data;

  return (
    <EditorPage
      eyebrow="Custom page"
      title={initial.title}
      description={`Built from sections. Lives at /${slug}; the address is fixed.`}
      livePath={`/${slug}`}
      kind="page"
      contentKey={slug}
      revisions={revisions}
    >
      <PageEditor
        key={editorKey}
        slug={slug}
        initial={initial}
        state={state}
        procedureOptions={procedures.map((p) => ({ slug: p.slug, name: p.name }))}
      />
    </EditorPage>
  );
}
