"use client";

import { useTranslations } from "next-intl";
import { getGutBand } from "@/lib/gut";
import { cn } from "@/lib/utils";

// Número colorido direto (sem pílula de fundo) — o valor em si carrega o
// significado, igual aos KPIs dos BI internos Multilaser (ver skill
// dashboard-multilaser).
const TEXT_CLASSES: Record<string, string> = {
  low: "text-gut-low-foreground",
  medium: "text-gut-medium-foreground",
  high: "text-gut-high-foreground",
};

export function PriorityBadge({ priority }: { priority: number }) {
  const t = useTranslations("activities.gutBands");
  const band = getGutBand(priority);
  const label = t(band.key);
  return (
    <span
      className="inline-flex items-baseline gap-1.5 tabular-nums"
      title={`GUT: ${priority} (${label})`}
    >
      <span className={cn("text-sm font-bold", TEXT_CLASSES[band.key])}>{priority}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </span>
  );
}
