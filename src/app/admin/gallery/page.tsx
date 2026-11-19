import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Plus } from "lucide-react";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { GalleryStatusBadge } from "@/components/admin/gallery/gallery-status-badge";
import { SampleBadge } from "@/components/admin/lead-status-badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/admin/format";
import { countCasesByStatus, listCases } from "@/lib/admin/gallery";
import { getProcedure } from "@/lib/content/procedures";
import { galleryStatusLabel, isGalleryStatus, type GalleryStatus } from "@/lib/gallery/meta";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Gallery" };

export default function GalleryAdminPage({ searchParams }: PageProps<"/admin/gallery">) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl">Before &amp; after gallery</h1>
          <p className="mt-1 max-w-2xl text-sm text-stone">
            Patient cases for the public gallery. A case goes live only after you record the patient’s signed photo
            consent and publish it. Photos are stored privately.
          </p>
        </div>
        <ButtonLink href="/admin/gallery/new" className="self-start sm:self-auto">
          <Plus /> New case
        </ButtonLink>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <CaseList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function load(status?: GalleryStatus) {
  await connection();
  const [rows, counts] = await Promise.all([listCases(status), countCasesByStatus()]);
  return { rows, counts };
}

async function CaseList({ searchParams }: Pick<PageProps<"/admin/gallery">, "searchParams">) {
  if (!hasDatabase()) return <DbNotice />;
  const params = await searchParams;
  const status = isGalleryStatus(params.status) ? params.status : undefined;
  const { rows, counts } = await load(status);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const tabs = [
    { status: undefined, label: "All", count: total },
    ...(Object.keys(galleryStatusLabel) as GalleryStatus[]).map((s) => ({
      status: s,
      label: galleryStatusLabel[s],
      count: counts[s],
    })),
  ];

  return (
    <div className="space-y-4">
      <nav aria-label="Filter by status">
        <ul className="flex flex-wrap gap-1">
          {tabs.map((t) => {
            const current = t.status === status;
            return (
              <li key={t.label}>
                <Link
                  href={t.status ? `/admin/gallery?status=${t.status}` : "/admin/gallery"}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-sm border border-line px-3 py-1.5 text-sm text-stone transition-colors hover:border-ink/40 hover:text-ink",
                    current && "border-ink bg-ink text-ivory hover:text-ivory",
                  )}
                >
                  {t.label}
                  <span className={cn("text-xs tabular-nums", current ? "text-ivory/70" : "text-stone/70")}>{t.count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {rows.length === 0 ? (
        <p className="rounded-sm border border-line p-8 text-center text-sm text-stone">
          {status ? "No cases with this status." : "No cases yet. Add one with “New case”."}
        </p>
      ) : (
        <div className="rounded-sm border border-line">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Photos</TableHead>
                <TableHead>Consent</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id} className="relative">
                  <TableCell>
                    <Link href={`/admin/gallery/${c.id}`} className="font-medium text-ink after:absolute after:inset-0 hover:underline">
                      {getProcedure(c.procedureSlug)?.name ?? c.procedureSlug} · #{c.number}
                    </Link>
                    {c.isSample && <SampleBadge className="ml-2" />}
                  </TableCell>
                  <TableCell>{c.ageRange}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {c.isSample ? "Placeholder" : `${c.photoCount} of ${c.views.length * 2}`}
                  </TableCell>
                  <TableCell>{c.consentSigned ? "Signed" : <span className="text-destructive">Missing</span>}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDateTime(c.updatedAt)}</TableCell>
                  <TableCell>
                    <GalleryStatusBadge status={c.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
