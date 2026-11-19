import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { selectClass } from "@/components/admin/gallery/case-details-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ACTIVITY_PAGE_SIZE,
  activityPeople,
  activitySections,
  describeAction,
  describeTarget,
  isActivitySection,
  listActivity,
  type ActivityFilter,
} from "@/lib/admin/activity";
import { formatDateTime } from "@/lib/admin/format";
import { staffNames } from "@/lib/admin/staff";
import { clinicTimeToDate, clinicZoneLabel } from "@/lib/admin/time";

export const metadata: Metadata = { title: "Activity" };

export default function ActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Activity</h1>
        <p className="mt-1 max-w-2xl text-sm text-stone">
          Every change made in this dashboard: who did what, and when. It records actions only, never patient
          details.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ActivityLog searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

/** The day after a YYYY-MM-DD date, so "to" includes the whole day. */
function nextDay(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function load(filter: ActivityFilter) {
  await connection();
  const [{ rows, total }, people] = await Promise.all([listActivity(filter), activityPeople()]);
  const names = await staffNames([...people, ...rows.map((r) => r.userId)]);
  return { rows, total, people, names };
}

async function ActivityLog({ searchParams }: Pick<PageProps<"/admin/activity">, "searchParams">) {
  if (!hasDatabase()) return <DbNotice />;
  const params = await searchParams;
  const person = str(params.person).slice(0, 64);
  const section = isActivitySection(params.section) ? params.section : undefined;
  const from = DATE.test(str(params.from)) ? str(params.from) : "";
  const to = DATE.test(str(params.to)) ? str(params.to) : "";
  const page = Math.max(1, Math.min(1000, Number(params.page) || 1));

  const { rows, total, people, names } = await load({
    userId: person || undefined,
    section,
    from: from ? (clinicTimeToDate(from, "00:00") ?? undefined) : undefined,
    to: to ? (clinicTimeToDate(nextDay(to), "00:00") ?? undefined) : undefined,
    page,
  });
  const pages = Math.max(1, Math.ceil(total / ACTIVITY_PAGE_SIZE));
  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (person) sp.set("person", person);
    if (section) sp.set("section", section);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `/admin/activity?${s}` : "/admin/activity";
  };

  return (
    <div className="space-y-4">
      <form className="grid gap-3 rounded-sm border border-line p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_10rem_10rem_auto] lg:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="person">Person</Label>
          <select id="person" name="person" defaultValue={person} className={selectClass}>
            <option value="">Everyone</option>
            {people
              .map((id) => ({ id, name: names.get(id) ?? id }))
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="section">Section</Label>
          <select id="section" name="section" defaultValue={section ?? ""} className={selectClass}>
            <option value="">All sections</option>
            {Object.entries(activitySections).map(([k, s]) => (
              <option key={k} value={k}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="from">From</Label>
          <Input id="from" name="from" type="date" defaultValue={from} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="to">To</Label>
          <Input id="to" name="to" type="date" defaultValue={to} />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Filter</Button>
          {(person || section || from || to) && (
            <Link href="/admin/activity" className="inline-flex items-center px-2 text-sm text-stone hover:text-ink">
              Clear
            </Link>
          )}
        </div>
      </form>

      <p className="text-sm text-stone" aria-live="polite">
        {total === 0 ? "No activity matches these filters." : `${total} ${total === 1 ? "change" : "changes"}`}
        {total > 0 && ` · times in ${clinicZoneLabel()}`}
      </p>

      {rows.length > 0 && (
        <div className="rounded-sm border border-line">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Who</TableHead>
                <TableHead>What</TableHead>
                <TableHead>Where</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const { verb, detail } = describeAction(r.action);
                const target = describeTarget(r.entity, r.entityId);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">{formatDateTime(r.createdAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">{names.get(r.userId) ?? "Unknown"}</TableCell>
                    <TableCell>
                      {verb}
                      {detail && <span className="text-stone"> · {detail}</span>}
                    </TableCell>
                    <TableCell>
                      {target.href ? (
                        <Link href={target.href} className="text-bronze hover:underline">
                          {target.label}
                        </Link>
                      ) : (
                        target.label
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Activity pages" className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="text-bronze hover:underline">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-stone">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} className="text-bronze hover:underline">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
