// Shared by server and client code. Must match the enums in src/db/schema.ts
// (src/lib/admin/appointments.ts checks this at compile time).

export const appointmentTypes = ["consultation", "virtual", "surgery", "follow_up"] as const;
export const appointmentStatuses = ["scheduled", "completed", "no_show", "cancelled"] as const;

export type AppointmentType = (typeof appointmentTypes)[number];
export type AppointmentStatus = (typeof appointmentStatuses)[number];

export const appointmentTypeLabel: Record<AppointmentType, string> = {
  consultation: "Consultation",
  virtual: "Virtual consultation",
  surgery: "Surgery",
  follow_up: "Follow-up",
};

export const appointmentStatusLabel: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  no_show: "No-show",
  cancelled: "Cancelled",
};

/** Default length in minutes when booking. */
export const defaultDuration: Record<AppointmentType, number> = {
  consultation: 60,
  virtual: 30,
  surgery: 180,
  follow_up: 30,
};

export function isAppointmentType(v: unknown): v is AppointmentType {
  return typeof v === "string" && (appointmentTypes as readonly string[]).includes(v);
}
