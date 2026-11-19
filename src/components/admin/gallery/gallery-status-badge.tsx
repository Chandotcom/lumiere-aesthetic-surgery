import { Badge } from "@/components/ui/badge";
import { galleryStatusLabel, type GalleryStatus } from "@/lib/gallery/meta";
import { cn } from "@/lib/utils";

const tone: Record<GalleryStatus, string> = {
  pending: "bg-cream text-ink",
  approved: "bg-emerald-100 text-emerald-900",
  hidden: "bg-stone/10 text-stone",
};

export function GalleryStatusBadge({ status, className }: { status: GalleryStatus; className?: string }) {
  return <Badge className={cn(tone[status], className)}>{galleryStatusLabel[status]}</Badge>;
}
