import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronRight } from "lucide-react";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Skeleton } from "@/components/ui/skeleton";
import { countLeadsByForm } from "@/lib/admin/leads";
import { formSchema } from "@/lib/cms/form-schema";
import { listDocuments, listDocumentStates } from "@/lib/cms/store";

export const metadata: Metadata = { title: "Forms" };

export default function FormsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl">Forms</h1>
          <p className="mt-1 max-w-2xl text-sm text-stone">
            Build forms such as a callback request or an event sign-up, without plugins. Each one has its own page and
            can be added to any custom page. Every submission arrives in Leads, with the same alerts and response timer.
          </p>
        </div>
        <ButtonLink href="/admin/forms/new" variant="outline">
          New form
        </ButtonLink>
      </div>
      <Suspense fallback={<Skeleton className="h-72 w-full" />}>
        <FormList />
      </Suspense>
    </div>
  );
}

async function loadForms() {
  await connection();
  const [docs, counts, consultation] = await Promise.all([
    listDocuments("form"),
    countLeadsByForm(),
    listDocumentStates("consultation"),
  ]);
  const forms = docs
    .map((d) => {
      const data = formSchema.safeParse(d.draft ?? d.published);
      return {
        slug: d.key,
        title: data.success ? data.data.title : d.key,
        questions: data.success ? data.data.fields.length : 0,
        hasDraft: d.draft != null,
        hasPublished: d.published != null,
        submissions: counts.get(d.key) ?? 0,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
  return { forms, consultation: consultation.get("main") };
}

async function FormList() {
  if (!hasDatabase()) return <DbNotice />;
  const { forms, consultation } = await loadForms();

  return (
    <div className="space-y-10">
    <section aria-labelledby="built-in-forms" className="space-y-4">
      <h2 id="built-in-forms" className="font-heading text-xl">
        Built-in form
      </h2>
      <ul className="divide-y divide-line rounded-sm border border-line">
        <li>
          <Link href="/admin/forms/consultation" className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-cream/50">
            <span className="min-w-0">
              <span className="block font-medium">Consultation form</span>
              <span className="text-xs text-stone">/consultation · Edit its wording: questions, options, consent texts and the thank-you message</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {consultation?.hasDraft && <Badge className="bg-sand/40 text-ink">Draft</Badge>}
              {consultation?.hasPublished ? (
                <Badge className="bg-emerald-100 text-emerald-900">Edited</Badge>
              ) : (
                <span className="text-xs text-stone">Default</span>
              )}
              <ChevronRight className="size-4 text-stone" aria-hidden />
            </span>
          </Link>
        </li>
      </ul>
    </section>
    <section aria-labelledby="custom-forms" className="space-y-4">
      <h2 id="custom-forms" className="font-heading text-xl">
        Your forms
      </h2>
      {forms.length === 0 ? (
        <p className="rounded-sm border border-line p-6 text-center text-sm text-stone">
          No forms yet. Start with “New form”, for example a callback request.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-sm border border-line">
          {forms.map((f) => (
            <li key={f.slug}>
              <Link href={`/admin/forms/${f.slug}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-cream/50">
                <span className="min-w-0">
                  <span className="block font-medium">{f.title}</span>
                  <span className="text-xs text-stone">
                    /forms/{f.slug} · {f.questions} questions · {f.submissions} {f.submissions === 1 ? "submission" : "submissions"}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {f.hasDraft && <Badge className="bg-sand/40 text-ink">Draft</Badge>}
                  {f.hasPublished ? (
                    <Badge className="bg-emerald-100 text-emerald-900">Live</Badge>
                  ) : (
                    <span className="text-xs text-stone">Not published</span>
                  )}
                  <ChevronRight className="size-4 text-stone" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
    </div>
  );
}
