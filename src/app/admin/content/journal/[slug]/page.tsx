import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BackToContent, EditorPage } from "@/components/admin/cms/editor-page";
import { PostEditor } from "@/components/admin/cms/post-editor";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { loadEditorData } from "@/lib/cms/editor-data";
import { clinicDayKey } from "@/lib/admin/time";
import { isBuiltInPost, newPostFields, postToFields } from "@/lib/cms/journal";
import { postSchema, postSlugSchema, type PostFields } from "@/lib/cms/schemas";
import { getDocument } from "@/lib/cms/store";
import { getPost } from "@/lib/content/journal";
import { procedures } from "@/lib/content/procedures";

export const metadata: Metadata = { title: "Edit journal post" };

export default function EditPostPage({ params }: PageProps<"/admin/content/journal/[slug]">) {
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
  const builtIn = getPost(slug);
  // A custom post exists only once it has a stored document.
  if (!builtIn && !(await getDocument("post", slug))) return null;
  // Built-in: the original article. Custom post with nothing stored (e.g. its only draft was
  // discarded): a fresh template, so the editor always has valid values.
  const fallback = (): PostFields =>
    builtIn ? postToFields(builtIn) : newPostFields(slug.replace(/-/g, " "), clinicDayKey(new Date()));
  return { builtIn: !!builtIn, ...(await loadEditorData("post", slug, postSchema, fallback)) };
}

async function Editor({ params }: Pick<PageProps<"/admin/content/journal/[slug]">, "params">) {
  const { slug } = await params;
  if (!isBuiltInPost(slug) && !postSlugSchema.safeParse(slug).success) notFound();
  if (!hasDatabase()) return <DbNotice />;

  const data = await load(slug);
  if (!data) notFound();
  const { builtIn, initial, state, revisions, editorKey } = data;

  return (
    <EditorPage
      eyebrow="Journal"
      title={initial.title}
      description={
        builtIn
          ? "A built-in article. Edit or hide it; you can always revert to the original."
          : "A post created in the admin. The web address is fixed."
      }
      livePath={`/blog/${slug}`}
      kind="post"
      contentKey={slug}
      revisions={revisions}
    >
      <PostEditor
        key={editorKey}
        slug={slug}
        initial={initial}
        state={state}
        builtIn={builtIn}
        procedureOptions={procedures.map((p) => ({ slug: p.slug, name: p.name }))}
      />
    </EditorPage>
  );
}
