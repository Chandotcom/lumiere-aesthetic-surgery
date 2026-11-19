import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

// Dashboard KPIs, derived from `leads` + `appointments`. All windows are rolling from now.

type Row = Record<string, unknown>;

const num = (v: unknown) => (v == null ? null : Number(v));

async function one(query: ReturnType<typeof sql>) {
  const result = await getDb().execute(query);
  return (result.rows[0] ?? {}) as Row;
}

async function many(query: ReturnType<typeof sql>) {
  const result = await getDb().execute(query);
  return result.rows as Row[];
}

export type Kpis = Awaited<ReturnType<typeof getKpis>>;

export async function getKpis() {
  const [leads, response, conversion, noShow, weekly, sources] = await Promise.all([
    // New leads: last 30 days vs the 30 before; plus leads still waiting for a first response.
    one(sql`
      select
        count(*) filter (where created_at >= now() - interval '30 days') as current,
        count(*) filter (where created_at >= now() - interval '60 days'
                           and created_at <  now() - interval '30 days') as previous,
        count(*) filter (where first_responded_at is null and status = 'new') as waiting
      from leads`),

    // Average time to first response, for leads received in the last 30 days.
    one(sql`
      select
        avg(extract(epoch from (first_responded_at - created_at))) as avg_seconds,
        count(*) as responded
      from leads
      where created_at >= now() - interval '30 days' and first_responded_at is not null`),

    // Consult → surgery: of leads with a completed consultation in the last 90 days,
    // how many have a surgery booked or done.
    one(sql`
      with consulted as (
        select distinct lead_id from appointments
        where type in ('consultation', 'virtual')
          and status = 'completed'
          and starts_at >= now() - interval '90 days'
      )
      select
        count(*) as consulted,
        count(*) filter (where exists (
          select 1 from appointments s
          where s.lead_id = consulted.lead_id
            and s.type = 'surgery'
            and s.status in ('scheduled', 'completed')
        )) as converted
      from consulted`),

    // No-show rate: past appointments in the last 90 days that ended as completed or no-show.
    one(sql`
      select
        count(*) filter (where status = 'no_show') as no_shows,
        count(*) as attended_or_missed
      from appointments
      where starts_at >= now() - interval '90 days'
        and starts_at < now()
        and status in ('completed', 'no_show')`),

    // Leads per week, last 12 weeks (weeks start on Monday), including empty weeks.
    many(sql`
      select to_char(w.week, 'YYYY-MM-DD') as week, count(l.id) as leads
      from generate_series(
        date_trunc('week', now()) - interval '11 weeks',
        date_trunc('week', now()),
        interval '1 week'
      ) as w(week)
      left join leads l on date_trunc('week', l.created_at) = w.week
      group by w.week
      order by w.week`),

    // Leads by first-touch source, last 90 days, largest first.
    many(sql`
      select source, count(*) as leads
      from leads
      where created_at >= now() - interval '90 days'
      group by source
      order by count(*) desc, source`),
  ]);

  const consulted = num(conversion.consulted) ?? 0;
  const attended = num(noShow.attended_or_missed) ?? 0;
  const avgSeconds = num(response.avg_seconds);

  return {
    newLeads: { current: num(leads.current) ?? 0, previous: num(leads.previous) ?? 0 },
    waiting: num(leads.waiting) ?? 0,
    avgResponseMs: avgSeconds == null ? null : avgSeconds * 1000,
    respondedCount: num(response.responded) ?? 0,
    conversion: {
      consulted,
      converted: num(conversion.converted) ?? 0,
      rate: consulted ? (num(conversion.converted) ?? 0) / consulted : null,
    },
    noShow: {
      total: attended,
      noShows: num(noShow.no_shows) ?? 0,
      rate: attended ? (num(noShow.no_shows) ?? 0) / attended : null,
    },
    weekly: weekly.map((r) => ({ week: String(r.week), leads: Number(r.leads) })),
    sources: sources.map((r) => ({ source: String(r.source), leads: Number(r.leads) })),
  };
}
