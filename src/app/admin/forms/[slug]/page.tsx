import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Inbox } from "lucide-react";
import { BackToForms, EditorPage } from "@/components/admin/cms/editor-page";
import { FormEditor } from "@/components/admin/cms/form-editor";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { ButtonLink } from "@/components/ui/button-link";
import { Skeleton } from "@/components/ui/skeleton";
import { can } from "@/lib/admin/roles";
import { getStaff } from "@/lib/admin/session";
import { loadEditorData } from "@/lib/cms/editor-data";
import { formSchema, formSlugSchema, newFormFields } from "@/lib/cms/form-schema";
import { getDocument } from "@/lib/cms/store";

export const metadata: Metadata = { title: "Edit form" };

export default function EditFormPage({ params }: PageProps<"/admin/forms/[slug]">) {
  return (
    <div className="space-y-6">
      <BackToForms />
      <Suspense fallback={<Skeleton className="h-[40rem] w-full" />}>
        <Editor params={params} />
      </Suspense>
    </div>
  );
}

async function load(slug: string) {
  await connection();
  // A form exists only once it has a stored document (created with "New form").
  const [doc, staff] = await Promise.all([getDocument("form", slug), getStaff()]);
  if (!doc) return null;
  const data = await loadEditorData("form", slug, formSchema, () => newFormFields(slug.replace(/-/g, " ")));
  return { ...data, canSeeLeads: staff != null && can(staff.role, "leads") };
}

async function Editor({ params }: Pick<PageProps<"/admin/forms/[slug]">, "params">) {
  const { slug } = await params;
  if (!formSlugSchema.safeParse(slug).success) notFound();
  if (!hasDatabase()) return <DbNotice />;
  const data = await load(slug);
  if (!data) notFound();
  const { initial, state, revisions, editorKey, canSeeLeads } = data;

  return (
    <EditorPage
      eyebrow="Form"
      title={initial.title}
      description={`Lives at /forms/${slug}; the address is fixed. You can also add it to a custom page as a Form section.`}
      livePath={`/forms/${slug}`}
      kind="form"
      contentKey={slug}
      revisions={revisions}
    >
      {canSeeLeads && (
        <ButtonLink href={`/admin/leads?form=${slug}`} variant="outline" size="sm">
          <Inbox /> View submissions
        </ButtonLink>
      )}
      <FormEditor key={editorKey} slug={slug} initial={initial} state={state} />
    </EditorPage>
  );
}
