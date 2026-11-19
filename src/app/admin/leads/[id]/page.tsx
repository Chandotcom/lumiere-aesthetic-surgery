import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { AppointmentStatusBadge } from "@/components/admin/appointment-badge";
import { AppointmentRowActions, BookAppointmentForm } from "@/components/admin/appointment-controls";
import { LeadActions } from "@/components/admin/lead-actions";
import { appointmentTypeLabel } from "@/lib/admin/appointment-meta";
import { clinicDayKey, clinicTimeKey, clinicZoneLabel } from "@/lib/admin/time";
import { LeadStatusBadge, SampleBadge } from "@/components/admin/lead-status-badge";
import { ResponseTime } from "@/components/admin/response-time";
import { Skeleton } from "@/components/ui/skeleton";
import {
  consultTypeLabel,
  contactMethodLabel,
  formatDateTime,
  timeframeLabel,
} from "@/lib/admin/format";
import { getLead, isSampleLead, listLeadAppointments } from "@/lib/admin/leads";
import { getStaff } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Lead" };

export default function LeadPage({ params }: PageProps<"/admin/leads/[id]">) {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-1.5 text-sm text-stone hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All leads
      </Link>
      <Suspense fallback={<LeadSkeleton />}>
        <LeadDetail params={params} />
      </Suspense>
    </div>
  );
}

async function loadLead(id: number) {
  await connection();
  const [lead, appointments, staff] = await Promise.all([
    getLead(id),
    listLeadAppointments(id),
    getStaff(),
  ]);
  return { lead, appointments, staff, now: Date.now() };
}

async function LeadDetail({ params }: Pick<PageProps<"/admin/leads/[id]">, "params">) {
  if (!hasDatabase()) return <DbNotice />;

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const { lead, appointments, staff, now } = await loadLead(id);
  if (!lead) notFound();

  const facts: [string, React.ReactNode][] = [
    ["Email", <a key="e" href={`mailto:${lead.email}`} className="text-bronze hover:underline">{lead.email}</a>],
    ["Phone", lead.phone ? <a key="p" href={`tel:${lead.phone}`} className="text-bronze hover:underline">{lead.phone}</a> : "—"],
    ["Prefers", contactMethodLabel(lead.contactMethod)],
    ["Interest", lead.procedureInterest ?? "—"],
    ["Consultation", consultTypeLabel(lead.consultType)],
    ["Timeframe", timeframeLabel(lead.timeframe)],
    ["SMS consent", lead.smsConsent ? "Yes" : "No"],
    ["Marketing consent", lead.marketingConsent ? "Yes" : "No"],
  ];

  const attribution: [string, string | null][] = [
    ["Source", lead.source],
    ["UTM source", lead.utmSource],
    ["UTM medium", lead.utmMedium],
    ["UTM campaign", lead.utmCampaign],
    ["Referrer", lead.referrer],
    ["Landing page", lead.landingPage],
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="min-w-0 space-y-8">
        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl">{lead.name}</h1>
            <LeadStatusBadge status={lead.status} />
            {isSampleLead(lead.email) && <SampleBadge />}
          </div>
          <p className="text-sm text-stone">
            Received {formatDateTime(lead.createdAt)} · <ResponseTime lead={lead} now={now} />
          </p>
        </header>

        <section aria-labelledby="details" className="space-y-3">
          <h2 id="details" className="font-heading text-lg">Details</h2>
          <dl className="grid gap-x-6 gap-y-3 rounded-sm border border-line p-4 text-sm sm:grid-cols-2">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-stone">{label}</dt>
                <dd className="mt-0.5 break-words">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="message" className="space-y-3">
          <h2 id="message" className="font-heading text-lg">Message</h2>
          <p className="rounded-sm border border-line p-4 text-sm whitespace-pre-wrap">
            {lead.message || <span className="text-stone">No message.</span>}
          </p>
        </section>

        <section aria-labelledby="appointments" className="space-y-3">
          <h2 id="appointments" className="font-heading text-lg">Appointments</h2>
          {appointments.length === 0 ? (
            <p className="text-sm text-stone">No appointments yet.</p>
          ) : (
            <ul className="divide-y divide-line rounded-sm border border-line text-sm">
              {appointments.map((a) => {
                const durationMin = Math.round((a.endsAt.getTime() - a.startsAt.getTime()) / 60_000);
                return (
                  <li key={a.id} className="grid gap-3 p-3 sm:grid-cols-[1fr_auto] sm:items-start">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{appointmentTypeLabel[a.type]}</span>
                        <AppointmentStatusBadge status={a.status} />
                      </div>
                      <div className="text-stone">
                        {formatDateTime(a.startsAt)} · {durationMin} min
                        {a.type === "surgery" && a.depositPaid && " · Deposit paid"}
                      </div>
                    </div>
                    <AppointmentRowActions
                      id={a.id}
                      status={a.status}
                      patient={lead.name}
                      date={clinicDayKey(a.startsAt)}
                      time={clinicTimeKey(a.startsAt)}
                      durationMin={durationMin}
                    />
                  </li>
                );
              })}
            </ul>
          )}
          <details className="rounded-sm border border-line p-4" open={appointments.length === 0}>
            <summary className="cursor-pointer text-sm font-medium">Book an appointment</summary>
            <div className="mt-4">
              <BookAppointmentForm
                leadId={lead.id}
                defaultType={lead.consultType === "virtual" ? "virtual" : "consultation"}
                today={clinicDayKey(new Date(now))}
                zoneLabel={clinicZoneLabel(new Date(now))}
              />
            </div>
          </details>
        </section>

        <section aria-labelledby="attribution" className="space-y-3">
          <h2 id="attribution" className="font-heading text-lg">Attribution</h2>
          <dl className="grid gap-x-6 gap-y-3 rounded-sm border border-line p-4 text-sm sm:grid-cols-2">
            {attribution.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-stone">{label}</dt>
                <dd className="mt-0.5 break-all">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <aside className="h-fit rounded-sm border border-line p-4 lg:sticky lg:top-6">
        <LeadActions
          // Remount with fresh values after a server refresh.
          key={`${lead.status}-${lead.updatedAt.getTime()}`}
          leadId={lead.id}
          status={lead.status}
          notes={lead.notes ?? ""}
          responded={lead.firstRespondedAt != null}
          assignedToMe={staff != null && lead.assignedTo === staff.id}
          assignedToOther={lead.assignedTo != null && lead.assignedTo !== staff?.id}
        />
      </aside>
    </div>
  );
}

function LeadSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]" aria-hidden>
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
