import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { SourceChart, WeeklyLeadsChart } from "@/components/admin/kpi-charts";
import { Skeleton } from "@/components/ui/skeleton";
import { capitalize, formatDuration, formatPercent, formatWeek } from "@/lib/admin/format";
import { getKpis, type Kpis } from "@/lib/admin/kpis";
import { can, homeFor } from "@/lib/admin/roles";
import { getStaff } from "@/lib/admin/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-stone">How quickly enquiries are answered, and how they turn into patients.</p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </div>
  );
}

async function loadKpis() {
  await connection();
  return getKpis();
}

async function Dashboard() {
  // Enquiry KPIs are front-desk data; other roles start in their own section.
  const staff = await getStaff();
  if (staff && !can(staff.role, "dashboard")) redirect(homeFor(staff.role));
  if (!hasDatabase()) return <DbNotice />;
  const kpis = await loadKpis();

  return (
    <div className="space-y-6">
      {kpis.waiting > 0 && (
        <Link
          href="/admin/leads?status=new"
          className="flex items-center justify-between gap-4 rounded-sm border border-bronze/40 bg-cream/60 px-4 py-3 text-sm hover:border-bronze"
        >
          <span>
            <strong className="font-medium">{kpis.waiting}</strong>{" "}
            {kpis.waiting === 1 ? "lead is" : "leads are"} waiting for a first response.
          </span>
          <span className="inline-flex items-center gap-1 text-bronze">
            Open inbox <ArrowRight className="size-4" aria-hidden />
          </span>
        </Link>
      )}

      <KpiRow kpis={kpis} />

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <ChartCard title="Leads per week" subtitle="Last 12 weeks">
          <WeeklyLeadsChart data={kpis.weekly} />
          <DataTable
            caption="Leads per week, last 12 weeks"
            headers={["Week of", "Leads"]}
            rows={kpis.weekly.map((w) => [formatWeek(w.week), w.leads])}
          />
        </ChartCard>
        <ChartCard title="Leads by source" subtitle="First touch, last 90 days">
          {kpis.sources.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone">No leads in the last 90 days.</p>
          ) : (
            <>
              <SourceChart data={kpis.sources} />
              <DataTable
                caption="Leads by source, last 90 days"
                headers={["Source", "Leads"]}
                rows={kpis.sources.map((s) => [capitalize(s.source), s.leads])}
              />
            </>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function KpiRow({ kpis }: { kpis: Kpis }) {
  const { current, previous } = kpis.newLeads;
  const delta = current - previous;
  return (
    <dl className="grid gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        label="New leads"
        value={current.toLocaleString("en")}
        note={
          previous === 0 && current === 0 ? (
            "Last 30 days"
          ) : (
            <Delta value={delta} upIsGood suffix="vs previous 30 days" />
          )
        }
      />
      <StatTile
        label="Average first response"
        value={kpis.avgResponseMs == null ? "—" : formatDuration(kpis.avgResponseMs)}
        note={
          kpis.respondedCount
            ? `${kpis.respondedCount} answered, last 30 days`
            : "No answered leads in the last 30 days"
        }
      />
      <StatTile
        label="Consult → surgery"
        value={kpis.conversion.rate == null ? "—" : formatPercent(kpis.conversion.rate)}
        note={
          kpis.conversion.consulted
            ? `${kpis.conversion.converted} of ${kpis.conversion.consulted} consultations, last 90 days`
            : "No completed consultations in the last 90 days"
        }
      />
      <StatTile
        label="No-show rate"
        value={kpis.noShow.rate == null ? "—" : formatPercent(kpis.noShow.rate)}
        note={
          kpis.noShow.total
            ? `${kpis.noShow.noShows} of ${kpis.noShow.total} appointments, last 90 days`
            : "No past appointments in the last 90 days"
        }
      />
    </dl>
  );
}

function StatTile({ label, value, note }: { label: string; value: string; note: React.ReactNode }) {
  return (
    <div className="bg-ivory p-5">
      <dt className="text-sm text-stone">{label}</dt>
      <dd className="mt-2 font-heading text-4xl font-normal tabular-nums text-ink">{value}</dd>
      <dd className="mt-2 text-xs text-stone">{note}</dd>
    </div>
  );
}

function Delta({ value, upIsGood, suffix }: { value: number; upIsGood: boolean; suffix: string }) {
  if (value === 0) return <span>No change {suffix}</span>;
  const up = value > 0;
  const good = up === upIsGood;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("inline-flex items-center gap-0.5 font-medium", good ? "text-emerald-700" : "text-destructive")}>
        <Icon className="size-3.5" aria-hidden />
        {up ? "+" : "−"}
        {Math.abs(value)}
      </span>
      {suffix}
    </span>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 space-y-4 rounded-sm border border-line p-5">
      <header>
        <h2 className="font-heading text-lg">{title}</h2>
        <p className="text-xs text-stone">{subtitle}</p>
      </header>
      {children}
    </section>
  );
}

/** The chart's data as a table: the accessible view (charts are aria-hidden). */
function DataTable({ caption, headers, rows }: { caption: string; headers: string[]; rows: (string | number)[][] }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-xs text-stone hover:text-ink">Show data table</summary>
      <table className="mt-2 w-full text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-xs text-stone">
            {headers.map((h, i) => (
              <th key={h} scope="col" className={cn("py-1.5 font-normal", i > 0 && "text-right")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row[0])} className="border-b border-line/60 last:border-0">
              {row.map((cell, i) => (
                <td key={i} className={cn("py-1.5", i > 0 && "text-right tabular-nums")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <Skeleton className="h-32 w-full" />
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}
