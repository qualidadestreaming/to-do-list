import { getGutBand } from "@/lib/gut";
import { cn } from "@/lib/utils";

const BAND_CLASSES: Record<string, string> = {
  low: "bg-gut-low text-gut-low-foreground",
  medium: "bg-gut-medium text-gut-medium-foreground",
  high: "bg-gut-high text-gut-high-foreground",
};

export function PriorityBadge({ priority }: { priority: number }) {
  const band = getGutBand(priority);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        BAND_CLASSES[band.key]
      )}
      title={`Prioridade GUT: ${priority} (${band.label})`}
    >
      {priority}
      <span className="opacity-80">· {band.label}</span>
    </span>
  );
}
