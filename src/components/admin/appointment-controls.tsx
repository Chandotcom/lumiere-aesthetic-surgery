"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  bookAppointment,
  rescheduleAppointment,
  updateAppointmentStatus,
} from "@/app/admin/appointments/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/admin/action";
import {
  appointmentStatusLabel,
  appointmentStatuses,
  appointmentTypeLabel,
  appointmentTypes,
  defaultDuration,
  type AppointmentStatus,
  type AppointmentType,
} from "@/lib/admin/appointment-meta";
import { cn } from "@/lib/utils";

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

function useAction() {
  const [pending, startTransition] = useTransition();
  function run(action: () => Promise<ActionResult>, success: string, onDone?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(success);
        onDone?.();
      } else toast.error(result.error);
    });
  }
  return [pending, run] as const;
}

/** Status/outcome picker plus an inline reschedule form, for one appointment row. */
export function AppointmentRowActions({
  id,
  status,
  patient,
  date,
  time,
  durationMin,
}: {
  id: number;
  status: AppointmentStatus;
  patient: string;
  /** Current slot in clinic time, used to prefill the reschedule form. */
  date: string;
  time: string;
  durationMin: number;
}) {
  const [pending, run] = useAction();
  const [rescheduling, setRescheduling] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          aria-label={`Status for ${patient}`}
          value={status}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.value as AppointmentStatus;
            run(() => updateAppointmentStatus(id, next), `Marked ${appointmentStatusLabel[next].toLowerCase()}`);
          }}
          className={cn(selectClass, "w-36")}
        >
          {appointmentStatuses.map((s) => (
            <option key={s} value={s}>
              {appointmentStatusLabel[s]}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="ghost"
          aria-expanded={rescheduling}
          onClick={() => setRescheduling((v) => !v)}
        >
          Reschedule
        </Button>
      </div>
      {rescheduling && (
        <form
          className="space-y-3 rounded-sm border border-line bg-cream/40 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            run(
              () =>
                rescheduleAppointment(id, {
                  date: String(f.get("date")),
                  time: String(f.get("time")),
                  durationMin: String(f.get("durationMin")),
                }),
              "Rescheduled",
              () => setRescheduling(false),
            );
          }}
        >
          <SlotFields date={date} time={time} durationMin={durationMin} />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              Save new time
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setRescheduling(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

/** Date, time and duration inputs (uncontrolled, read via FormData). Times are clinic time. */
function SlotFields({
  date,
  time,
  durationMin,
  minDate,
  onDurationKey,
}: {
  date?: string;
  time?: string;
  durationMin: number;
  minDate?: string;
  /** Changing this key resets the duration field to `durationMin` (e.g. after a type change). */
  onDurationKey?: string;
}) {
  const uid = useId();
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-date`}>Date</Label>
        <Input id={`${uid}-date`} name="date" type="date" required defaultValue={date} min={minDate} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-time`}>Time</Label>
        <Input id={`${uid}-time`} name="time" type="time" required step={900} defaultValue={time} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-dur`}>Minutes</Label>
        <Input
          key={onDurationKey}
          id={`${uid}-dur`}
          name="durationMin"
          type="number"
          required
          min={15}
          max={600}
          step={15}
          defaultValue={durationMin}
        />
      </div>
    </div>
  );
}

/** Book a new appointment for a lead (lead detail page). */
export function BookAppointmentForm({
  leadId,
  defaultType,
  today,
  zoneLabel,
}: {
  leadId: number;
  defaultType: AppointmentType;
  /** Clinic-zone "YYYY-MM-DD", used as the date picker's minimum. */
  today: string;
  zoneLabel: string;
}) {
  const [pending, run] = useAction();
  const [type, setType] = useState<AppointmentType>(defaultType);
  const [depositPaid, setDepositPaid] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const uid = useId();

  return (
    <form
      key={formKey}
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const amount = String(f.get("depositAmount") ?? "");
        run(
          () =>
            bookAppointment({
              leadId,
              type,
              date: String(f.get("date")),
              time: String(f.get("time")),
              durationMin: String(f.get("durationMin")),
              depositPaid,
              depositAmount: amount === "" ? null : amount,
            }),
          `${appointmentTypeLabel[type]} booked`,
          () => {
            setDepositPaid(false);
            setFormKey((k) => k + 1);
          },
        );
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-type`}>Type</Label>
        <select
          id={`${uid}-type`}
          value={type}
          onChange={(e) => setType(e.target.value as AppointmentType)}
          className={selectClass}
        >
          {appointmentTypes.map((t) => (
            <option key={t} value={t}>
              {appointmentTypeLabel[t]}
            </option>
          ))}
        </select>
      </div>

      <SlotFields durationMin={defaultDuration[type]} minDate={today} onDurationKey={type} />
      <p className="text-xs text-stone">Times are clinic time ({zoneLabel}).</p>

      {type === "surgery" && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={depositPaid}
              onChange={(e) => setDepositPaid(e.target.checked)}
              className="size-4 accent-bronze"
            />
            Deposit paid
          </label>
          {depositPaid && (
            <div className="space-y-1.5">
              <Label htmlFor={`${uid}-deposit`}>Amount ($)</Label>
              <Input id={`${uid}-deposit`} name="depositAmount" type="number" min={0} step={50} className="w-32" />
            </div>
          )}
        </div>
      )}

      <Button type="submit" disabled={pending}>
        Book {appointmentTypeLabel[type].toLowerCase()}
      </Button>
    </form>
  );
}
