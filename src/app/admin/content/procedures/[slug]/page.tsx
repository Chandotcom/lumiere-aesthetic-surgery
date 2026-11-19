import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { ProcedureEditor } from "@/components/admin/cms/procedure-editor";
import { RevisionList } from "@/components/admin/cms/revision-list";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { getStaff } from "@/lib/admin/session";
import { formatClinicDateTime } from "@/lib/admin/time";
import { procedureToFields } from "@/lib/cms/procedures";
import { procedureFieldsSchema } from "@/lib/cms/schemas";
import { getDocument, listRevisions } from "@/lib/cms/store";
import { getProcedure } from "@/lib/content/procedures";

export const metadata: Metadata = { title: "Edit procedure" };

export default function EditProcedurePage({ params }: PageProps<"/admin/content/procedures/[slug]">) {
  return (
    <div className="space-y-6">
      <Link href="/admin/content" className="inline-flex items-center gap-1.5 text-sm text-stone hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Site content
      </Link>
      <Suspense fallback={<Skeleton className="h-[40rem] w-full" />}>
        <Editor params={params} />
      </Suspense>
    </div>
  );
}

async function load(slug: string) {
  await connection();
  const [doc, revisions, staff] = await Promise.all([
    getDocument("procedure", slug),
    listRevisions("procedure", slug),
    getStaff(),
  ]);
  return { doc, revisions, staff };
}

async function Editor({ params }: Pick<PageProps<"/admin/content/procedures/[slug]">, "params">) {
  const { slug } = await params;
  const procedure = getProcedure(slug);
  if (!procedure) notFound();
  if (!hasDatabase()) return <DbNotice />;

  const { doc, revisions, staff } = await load(slug);

  // What the form starts from: the draft, else the live version, else the code defaults.
  const defaults = procedureToFields(procedure);
  const stored = procedureFieldsSchema.safeParse(doc?.draft ?? doc?.published);
  const initial = stored.success ? stored.data : defaults;

  const state = {
    hasDraft: doc?.draft != null,
    hasPublished: doc?.published != null,
    draftUpdatedAt: doc?.draftUpdatedAt ? formatClinicDateTime(doc.draftUpdatedAt) : null,
    publishedAt: doc?.publishedAt ? formatClinicDateTime(doc.publishedAt) : null,
  };

  return (
    <div className="grid gap-10 xl:grid-cols-[1fr_18rem]">
      <div className="min-w-0 space-y-6">
        <header className="space-y-1">
          <p className="text-xs tracking-wide text-stone uppercase">{procedure.category}</p>
          <h1 className="font-heading text-3xl">{procedure.name}</h1>
          <p className="text-sm text-stone">
            The name, address and category are fixed because links, filters and the consultation form depend on them.{" "}
            <a
              href={`/procedures/${slug}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 text-bronze hover:underline"
            >
              View live page <ExternalLink className="size-3" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </p>
        </header>
        <ProcedureEditor
          // Remount with fresh values whenever the stored versions change (save, discard, restore).
          key={`${doc?.draftUpdatedAt?.getTime() ?? 0}-${doc?.publishedAt?.getTime() ?? 0}`}
          slug={slug}
          name={procedure.name}
          initial={initial}
          state={state}
        />
      </div>
      <aside className="space-y-3 xl:sticky xl:top-6 xl:h-fit">
        <h2 className="font-heading text-lg">Published versions</h2>
        <RevisionList
          kind="procedure"
          contentKey={slug}
          revisions={revisions.map((r) => ({
            id: r.id,
            label: `${formatClinicDateTime(r.createdAt)}${r.publishedBy && r.publishedBy === staff?.id ? " · you" : ""}`,
          }))}
        />
      </aside>
    </div>
  );
}
