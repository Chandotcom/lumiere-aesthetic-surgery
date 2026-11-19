import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { AlertCircle } from "lucide-react";
import { AppointmentStatusBadge } from "@/components/admin/appointment-badge";
import { AppointmentRowActions } from "@/components/admin/appointment-controls";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { SampleBadge } from "@/components/admin/lead-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  APPOINTMENTS_LIMIT,
  appointmentTypeLabel,
  appointmentTypes,
  countMissingOutcomes,
  isAppointmentType,
  listAppointments,
  type AppointmentListItem,
  type AppointmentType,
  type AppointmentView,
} from "@/lib/admin/appointments";
import { isSampleLead } from "@/lib/admin/lead-status";
import {
  clinicDayKey,
  clinicTimeKey,
  clinicZoneLabel,
  formatClinicDay,
  formatClinicTime,
} from "@/lib/admin/time";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Appointments" };

export default function AppointmentsPage({ searchParams }: PageProps<"/admin/appointments">) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Appointments</h1>
        <p className="mt-1 text-sm text-stone">
          Consultations, surgeries and follow-ups. Book new ones from a lead&rsquo;s page.
        </p>
      </div>
      <Suspense fallback={<ListSkeleton />}>
        <Appointments searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function load(view: AppointmentView, type: AppointmentType | undefined) {
  await connection();
  const now = new Date();
  const [rows, missing] = await Promise.all([listAppointments({ view, type, now }), countMissingOutcomes(now)]);
  return { rows, missing, now };
}

async function Appointments({ searchParams }: Pick<PageProps<"/admin/appointments">, "searchParams">) {
  if (!hasDatabase()) return <DbNotice />;

  const params = await searchParams;
  const view: AppointmentView = params.view === "past" ? "past" : "upcoming";
  const type = isAppointmentType(params.type) ? params.type : undefined;
  const { rows, missing, now } = await load(view, type);

  // Group by clinic-time calendar day, keeping the query's order.
  const days = new Map<string, AppointmentListItem[]>();
  for (const row of rows) {
    const key = clinicDayKey(row.startsAt);
    days.set(key, [...(days.get(key) ?? []), row]);
  }
  const todayKey = clinicDayKey(now);

  const href = (next: { view?: AppointmentView; type?: AppointmentType | null }) => {
    const sp = new URLSearchParams();
    const v = next.view ?? view;
    const t = next.type === null ? undefined : (next.type ?? type);
    if (v === "past") sp.set("view", "past");
    if (t) sp.set("type", t);
    const s = sp.toString();
    return s ? `/admin/appointments?${s}` : "/admin/appointments";
  };

  return (
    <div className="space-y-5">
      {missing > 0 && (
        <Link
          href="/admin/appointments?view=past"
          className="flex items-center gap-2 rounded-sm border border-bronze/40 bg-cream/60 px-4 py-3 text-sm hover:border-bronze"
        >
          <AlertCircle className="size-4 text-bronze" aria-hidden />
          <span>
            <strong className="font-medium">{missing}</strong> past{" "}
            {missing === 1 ? "appointment needs" : "appointments need"} an outcome (completed or no-show).
          </span>
        </Link>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterLinks
          label="Time"
          items={[
            { label: "Upcoming", href: href({ view: "upcoming" }), current: view === "upcoming" },
            { label: "Past", href: href({ view: "past" }), current: view === "past" },
          ]}
        />
        <FilterLinks
          label="Type"
          items={[
            { label: "All types", href: href({ type: null }), current: !type },
            ...appointmentTypes.map((t) => ({ label: appointmentTypeLabel[t], href: href({ type: t }), current: type === t })),
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <p className="rounded-sm border border-line p-8 text-center text-sm text-stone">
          {view === "upcoming" ? "No upcoming appointments." : "No past appointments."}
        </p>
      ) : (
        <div className="space-y-6">
          {[...days].map(([key, items]) => (
            <section key={key} aria-labelledby={`day-${key}`} className="space-y-2">
              <h2 id={`day-${key}`} className="text-sm font-medium text-ink">
                {formatClinicDay(items[0]!.startsAt)}
                {key === todayKey && <span className="ml-2 text-xs font-normal text-bronze">Today</span>}
              </h2>
              <ul className="divide-y divide-line rounded-sm border border-line">
                {items.map((a) => (
                  <AppointmentRow key={a.id} a={a} needsOutcome={a.status === "scheduled" && a.startsAt < now} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      <p className="text-xs text-stone">
        Times shown in clinic time ({clinicZoneLabel(now)}).
        {rows.length === APPOINTMENTS_LIMIT && ` Showing the first ${APPOINTMENTS_LIMIT}.`}
      </p>
    </div>
  );
}

function AppointmentRow({ a, needsOutcome }: { a: AppointmentListItem; needsOutcome: boolean }) {
  const durationMin = Math.round((a.endsAt.getTime() - a.startsAt.getTime()) / 60_000);
  return (
    <li className={cn("grid gap-3 p-4 md:grid-cols-[9rem_1fr_auto] md:items-start", needsOutcome && "bg-cream/40")}>
      <div className="text-sm tabular-nums">
        <div className="font-medium">{formatClinicTime(a.startsAt)}</div>
        <div className="text-xs text-stone">until {formatClinicTime(a.endsAt)}</div>
      </div>
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/leads/${a.leadId}`} className="font-medium text-ink hover:underline">
            {a.leadName}
          </Link>
          {isSampleLead(a.leadEmail) && <SampleBadge />}
          <AppointmentStatusBadge status={a.status} />
          {needsOutcome && <span className="text-xs font-medium text-bronze">Needs outcome</span>}
        </div>
        <div className="text-sm text-stone">
          {appointmentTypeLabel[a.type]} · {durationMin} min
          {a.type === "surgery" &&
            (a.depositPaid
              ? ` · Deposit paid${a.depositAmount ? ` ($${a.depositAmount.toLocaleString("en")})` : ""}`
              : " · No deposit yet")}
        </div>
      </div>
      <AppointmentRowActions
        id={a.id}
        status={a.status}
        patient={a.leadName}
        date={clinicDayKey(a.startsAt)}
        time={clinicTimeKey(a.startsAt)}
        durationMin={durationMin}
      />
    </li>
  );
}

function FilterLinks({ label, items }: { label: string; items: { label: string; href: string; current: boolean }[] }) {
  return (
    <nav aria-label={`Filter by ${label.toLowerCase()}`}>
      <ul className="flex flex-wrap gap-1">
        {items.map((t) => (
          <li key={t.label}>
            <Link
              href={t.href}
              aria-current={t.current ? "page" : undefined}
              className={cn(
                "inline-flex rounded-sm border border-line px-3 py-1.5 text-sm text-stone transition-colors hover:border-ink/40 hover:text-ink",
                t.current && "border-ink bg-ink text-ivory hover:text-ivory",
              )}
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="h-9 w-full max-w-xl" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
