import { consultTypes, contactMethods, timeframes } from "@/lib/validation/consultation";

/** "4m", "3h 12m", "2d 5h": compact durations for the waiting timer and response times. */
export function formatDuration(ms: number) {
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

/** Date and time in the clinic's time zone (not the server's). */
export { formatClinicDateTime as formatDateTime } from "./time";

const weekFmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });

/** "2026-11-16" (a week start from SQL) → "Nov 16". */
export function formatWeek(iso: string) {
  return weekFmt.format(new Date(`${iso}T00:00:00Z`));
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const percentFmt = new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 0 });

export function formatPercent(ratio: number) {
  return percentFmt.format(ratio);
}

/** Label for a code stored by the consultation form (falls back to the raw code). */
function labeler(options: readonly { value: string; label: string }[]) {
  const map = new Map(options.map((o) => [o.value, o.label]));
  return (code: string | null) => (code ? (map.get(code) ?? code) : "—");
}

export const consultTypeLabel = labeler(consultTypes);
export const timeframeLabel = labeler(timeframes);
export const contactMethodLabel = labeler(contactMethods);
