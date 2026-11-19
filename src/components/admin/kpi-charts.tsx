"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { capitalize, formatWeek } from "@/lib/admin/format";

// One series per chart → one accent hue, no legend (the card title names the series).
const MARK = "var(--color-bronze)";
const GRID = "var(--color-line)";
const AXIS_TEXT = { fill: "var(--color-stone)", fontSize: 12 };


type TooltipProps = {
  active?: boolean;
  payload?: readonly { value?: unknown; payload?: { label?: string } }[];
};

/** Both charts' rows carry a `label`, so the tooltip reads it from the hovered row. */
function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0]?.value ?? 0);
  const label = payload[0]?.payload?.label;
  return (
    <div className="rounded-sm border border-line bg-ivory px-3 py-2 text-xs shadow-sm">
      <div className="text-stone">{label}</div>
      <div className="mt-0.5 font-medium text-ink tabular-nums">
        {value} {value === 1 ? "lead" : "leads"}
      </div>
    </div>
  );
}

/** Leads per week: columns on a shared baseline, hover tooltip per column. */
export function WeeklyLeadsChart({ data }: { data: { week: string; leads: number }[] }) {
  const rows = data.map((d) => ({ label: `Week of ${formatWeek(d.week)}`, short: formatWeek(d.week), leads: d.leads }));
  return (
    <div className="h-56 w-full" aria-hidden>
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} barCategoryGap={6}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis
            dataKey="short"
            tickLine={false}
            axisLine={{ stroke: GRID }}
            tick={AXIS_TEXT}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={AXIS_TEXT} width={48} />
          <Tooltip
            cursor={{ fill: "var(--color-cream)" }}
            content={(p) => <ChartTooltip active={p.active} payload={p.payload} />}
          />
          <Bar dataKey="leads" fill={MARK} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Leads by source: ranked horizontal bars, largest first, value at the tip. */
export function SourceChart({ data }: { data: { source: string; leads: number }[] }) {
  const rows = data.map((d) => ({ label: capitalize(d.source), leads: d.leads }));
  const height = Math.max(120, rows.length * 36 + 16);
  return (
    <div className="w-full" style={{ height }} aria-hidden>
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 0 }} barCategoryGap={8}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ ...AXIS_TEXT, fill: "var(--color-ink)" }}
            width={96}
          />
          <Tooltip
            cursor={{ fill: "var(--color-cream)" }}
            content={(p) => <ChartTooltip active={p.active} payload={p.payload} />}
          />
          <Bar
            dataKey="leads"
            fill={MARK}
            maxBarSize={20}
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
            label={{ position: "right", fill: "var(--color-ink)", fontSize: 12 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
