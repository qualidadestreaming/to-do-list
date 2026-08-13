"use client";

import { useTranslations } from "next-intl";
import { getGutBand } from "@/lib/gut";
import { cn } from "@/lib/utils";

const BAND_CLASSES: Record<string, string> = {
  low: "bg-gut-low text-gut-low-foreground",
  medium: "bg-gut-medium text-gut-medium-foreground",
  high: "bg-gut-high text-gut-high-foreground",
};

export function PriorityBadge({ priority }: { priority: number }) {
  const t = useTranslations("activities.gutBands");
  const band = getGutBand(priority);
  const label = t(band.key);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        BAND_CLASSES[band.key]
      )}
      title={`GUT: ${priority} (${label})`}
    >
      {priority}
      <span className="opacity-80">· {label}</span>
    </span>
  );
}
