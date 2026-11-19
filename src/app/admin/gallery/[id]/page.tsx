import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { CaseDetailsForm } from "@/components/admin/gallery/case-details-form";
import { CaseStatusPanel } from "@/components/admin/gallery/case-status-panel";
import { ConsentForm } from "@/components/admin/gallery/consent-form";
import { PhotoGrid } from "@/components/admin/gallery/photo-grid";
import { SampleBadge } from "@/components/admin/lead-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/admin/format";
import { getCase } from "@/lib/admin/gallery";
import { getStaff } from "@/lib/admin/session";
import { getProcedure } from "@/lib/content/procedures";
import { caseSlug, publishBlockers, type ConsentScope } from "@/lib/gallery/meta";
import type { CaseFields } from "@/lib/gallery/schemas";
import { hasGalleryStore } from "@/lib/gallery/store";

export const metadata: Metadata = { title: "Gallery case" };

export default function CasePage({ params }: PageProps<"/admin/gallery/[id]">) {
  return (
    <div className="space-y-6">
      <Link href="/admin/gallery" className="inline-flex items-center gap-1.5 text-sm text-stone hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Gallery
      </Link>
      <Suspense fallback={<Skeleton className="h-[40rem] w-full" />}>
        <CaseEditor params={params} />
      </Suspense>
    </div>
  );
}

async function load(id: number) {
  await connection();
  const [found, staff] = await Promise.all([getCase(id), getStaff()]);
  return { found, staff };
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-sm border border-line p-5">
      <div>
        <h2 className="font-heading text-xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-stone">{description}</p>}
      </div>
      {children}
    </section>
  );
}

async function CaseEditor({ params }: Pick<PageProps<"/admin/gallery/[id]">, "params">) {
  if (!hasDatabase()) return <DbNotice />;
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const { found, staff } = await load(id);
  if (!found) notFound();
  const { item, photos } = found;

  const procedure = getProcedure(item.procedureSlug);
  const blockers = publishBlockers({ ...item, photos });
  const recordedBy = item.consentRecordedBy === staff?.id ? "you" : "a staff member";
  const details: CaseFields = {
    procedureSlug: item.procedureSlug,
    ageRange: item.ageRange as CaseFields["ageRange"],
    timeAfter: item.timeAfter,
    notes: item.notes,
    views: item.views as CaseFields["views"],
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_20rem]">
      <div className="min-w-0 space-y-6">
        <header>
          <p className="text-xs tracking-wide text-stone uppercase">Case #{item.number}</p>
          <h1 className="font-heading text-3xl">
            {procedure?.name ?? item.procedureSlug} {item.isSample && <SampleBadge className="ml-1 align-middle" />}
          </h1>
        </header>

        <Section title="Photos" description="One before and one after photo for each angle.">
          {item.isSample ? (
            <p className="text-sm text-stone">
              This is a sample case for the demo. It shows placeholder art on the website and can’t hold real photos.
              Create a new case to upload patient photos.
            </p>
          ) : !hasGalleryStore() ? (
            <div className="rounded-sm border border-line bg-cream/60 p-4 text-sm text-stone">
              <p className="font-medium text-ink">Private photo storage not connected</p>
              <p className="mt-1">
                Create a <strong>private</strong> Vercel Blob store with the env prefix <code className="text-xs">GALLERY</code>,
                or set <code className="text-xs">GALLERY_READ_WRITE_TOKEN</code> in <code className="text-xs">.env.local</code>.
              </p>
            </div>
          ) : (
            <PhotoGrid caseId={item.id} views={item.views} photos={photos} />
          )}
        </Section>

        <Section title="Details">
          <CaseDetailsForm key={item.updatedAt.toISOString()} caseId={item.id} defaults={details} />
        </Section>

        <Section title="Consent">
          <ConsentForm
            key={`${item.consentSigned}-${item.updatedAt.toISOString()}`}
            caseId={item.id}
            published={item.status === "approved"}
            defaults={{
              consentSigned: item.consentSigned,
              consentScope: item.consentScope as ConsentScope,
              showFace: item.showFace,
            }}
            recorded={
              item.consentRecordedAt ? `Recorded ${formatDateTime(item.consentRecordedAt)} by ${recordedBy}` : undefined
            }
          />
        </Section>
      </div>

      <aside className="space-y-3 xl:sticky xl:top-6 xl:h-fit">
        <h2 className="font-heading text-lg">Publishing</h2>
        <div className="rounded-sm border border-line p-4">
          <CaseStatusPanel
            caseId={item.id}
            status={item.status}
            blockers={blockers}
            publicPath={`/gallery/${caseSlug(item)}`}
          />
        </div>
      </aside>
    </div>
  );
}
