import { site } from "@/lib/site";

// Clinic-time helpers. Servers (e.g. Vercel) run in UTC, so never rely on the process time zone.

const tz = site.timeZone;

function parts(t: number) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = Object.fromEntries(fmt.formatToParts(t).map((x) => [x.type, x.value]));
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    second: Number(p.second),
  };
}

/** Clinic-zone offset from UTC at instant `t`, in ms. */
function offsetAt(t: number) {
  const p = parts(t);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(t / 1000) * 1000;
}

/**
 * "2026-11-24" + "14:30" in clinic time → the UTC instant. Returns null for invalid input.
 * Two passes handle the DST boundary correctly.
 */
export function clinicTimeToDate(date: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const wall = Date.parse(`${date}T${time}:00Z`);
  if (Number.isNaN(wall)) return null;
  let t = wall - offsetAt(wall);
  t = wall - offsetAt(t);
  return new Date(t);
}

/** "YYYY-MM-DD" for the clinic-zone calendar day of `d` (for grouping and date inputs). */
export function clinicDayKey(d: Date) {
  const p = parts(d.getTime());
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** "HH:mm" (24h) clinic-zone wall time of `d`, for time inputs. */
export function clinicTimeKey(d: Date) {
  const p = parts(d.getTime());
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

const dayFmt = new Intl.DateTimeFormat("en", { timeZone: tz, weekday: "long", month: "long", day: "numeric", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en", { timeZone: tz, hour: "numeric", minute: "2-digit" });
const dateTimeFmt = new Intl.DateTimeFormat("en", { timeZone: tz, dateStyle: "medium", timeStyle: "short" });

export const formatClinicDay = (d: Date) => dayFmt.format(d);
export const formatClinicTime = (d: Date) => timeFmt.format(d);
export const formatClinicDateTime = (d: Date) => dateTimeFmt.format(d);

/** Short zone label for the clinic, e.g. "EST". */
export function clinicZoneLabel(d = new Date()) {
  return (
    new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "short" })
      .formatToParts(d)
      .find((p) => p.type === "timeZoneName")?.value ?? tz
  );
}
