import { Badge } from "@/components/ui/badge";
import { appointmentStatusLabel, type AppointmentStatus } from "@/lib/admin/appointment-meta";
import { cn } from "@/lib/utils";

const tone: Record<AppointmentStatus, string> = {
  scheduled: "bg-sky-100 text-sky-900",
  completed: "bg-emerald-100 text-emerald-900",
  no_show: "bg-destructive/10 text-destructive",
  cancelled: "bg-stone/10 text-stone",
};

export function AppointmentStatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  return <Badge className={cn(tone[status], className)}>{appointmentStatusLabel[status]}</Badge>;
}
