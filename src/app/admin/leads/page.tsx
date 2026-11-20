import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Search, X } from "lucide-react";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { LeadStatusBadge, SampleBadge } from "@/components/admin/lead-status-badge";
import { ResponseTime } from "@/components/admin/response-time";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/admin/format";
import {
  countLeadsByStatus,
  isLeadStatus,
  isSampleLead,
  leadStatuses,
  leadStatusLabel,
  LEADS_LIMIT,
  listLeads,
  type LeadStatus,
} from "@/lib/admin/leads";
import { formSlugSchema } from "@/lib/cms/form-schema";
import { listFormTitles } from "@/lib/cms/forms";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Leads" };

export default function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Leads</h1>
        <p className="mt-1 text-sm text-stone">
          Consultation requests and form submissions from the website, newest first.
        </p>
      </div>
      <Suspense fallback={<InboxSkeleton />}>
        <LeadsInbox searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function loadInbox(status: LeadStatus | undefined, q: string, form: string | undefined) {
  await connection();
  const [rows, counts, formTitles] = await Promise.all([
    listLeads({ status, q, form }),
    countLeadsByStatus(form),
    listFormTitles(),
  ]);
  return { rows, counts, formTitles, now: Date.now() };
}

async function LeadsInbox({ searchParams }: Pick<PageProps<"/admin/leads">, "searchParams">) {
  if (!hasDatabase()) return <DbNotice />;

  const params = await searchParams;
  const status = isLeadStatus(params.status) ? params.status : undefined;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const form = typeof params.form === "string" && formSlugSchema.safeParse(params.form).success ? params.form : undefined;
  const { rows, counts, formTitles, now } = await loadInbox(status, q, form);
  const formName = (slug: string) => formTitles.get(slug) ?? slug.replace(/-/g, " ");
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <StatusTabs active={status} counts={counts} total={total} q={q} form={form} />
        <form role="search" className="relative w-full lg:w-72">
          {status && <input type="hidden" name="status" value={status} />}
          {form && <input type="hidden" name="form" value={form} />}
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-stone" aria-hidden />
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name, email or phone"
            aria-label="Search leads"
            className="pl-8"
          />
        </form>
      </div>

      {form && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-stone">
          Showing submissions of the form
          <Link
            href={inboxHref({ status, q })}
            className="inline-flex items-center gap-1 rounded-sm border border-line bg-cream px-2 py-0.5 text-ink hover:border-ink/40"
          >
            {formName(form)}
            <X className="size-3.5" aria-hidden />
            <span className="sr-only">(show all leads)</span>
          </Link>
        </p>
      )}

      {rows.length === 0 ? (
        <p className="rounded-sm border border-line p-8 text-center text-sm text-stone">
          {q || status || form ? "No leads match these filters." : "No leads yet. Submissions from /consultation appear here."}
        </p>
      ) : (
        <div className="rounded-sm border border-line">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Interest</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((lead) => (
                <TableRow key={lead.id} className="relative">
                  <TableCell>
                    {/* Stretched link: the whole row is clickable, but only one tab stop. */}
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="font-medium text-ink after:absolute after:inset-0 hover:underline"
                    >
                      {lead.name}
                    </Link>
                    {isSampleLead(lead.email) && <SampleBadge className="ml-2" />}
                    <div className="text-xs text-stone">{lead.email}</div>
                  </TableCell>
                  <TableCell className="max-w-64 truncate" title={lead.procedureInterest ?? undefined}>
                    {lead.formSlug ? `Form: ${formName(lead.formSlug)}` : (lead.procedureInterest ?? "—")}
                  </TableCell>
                  <TableCell className="capitalize">{lead.source}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDateTime(lead.createdAt)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <ResponseTime lead={lead} now={now} />
                  </TableCell>
                  <TableCell>
                    <LeadStatusBadge status={lead.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {rows.length === LEADS_LIMIT && (
        <p className="text-xs text-stone">Showing the newest {LEADS_LIMIT}. Use search or filters to narrow down.</p>
      )}
    </div>
  );
}

function inboxHref({ status, q, form }: { status?: LeadStatus; q?: string; form?: string }) {
  const sp = new URLSearchParams();
  if (status) sp.set("status", status);
  if (q) sp.set("q", q);
  if (form) sp.set("form", form);
  const s = sp.toString();
  return s ? `/admin/leads?${s}` : "/admin/leads";
}

function StatusTabs({
  active,
  counts,
  total,
  q,
  form,
}: {
  active?: LeadStatus;
  counts: Record<LeadStatus, number>;
  total: number;
  q: string;
  form?: string;
}) {
  const href = (status?: LeadStatus) => inboxHref({ status, q, form });
  const tabs = [
    { status: undefined, label: "All", count: total },
    ...leadStatuses.map((s) => ({ status: s, label: leadStatusLabel[s], count: counts[s] })),
  ];
  return (
    <nav aria-label="Filter by status">
      <ul className="flex flex-wrap gap-1">
        {tabs.map((t) => {
          const current = t.status === active;
          return (
            <li key={t.label}>
              <Link
                href={href(t.status)}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-sm border border-line px-3 py-1.5 text-sm text-stone transition-colors hover:border-ink/40 hover:text-ink",
                  current && "border-ink bg-ink text-ivory hover:text-ivory",
                )}
              >
                {t.label}
                <span className={cn("text-xs tabular-nums", current ? "text-ivory/70" : "text-stone/70")}>
                  {t.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function InboxSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="h-9 w-full max-w-xl" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
