"use client";

import { useTranslations } from "next-intl";
import type { Activity } from "@/types/database";

export function GutPanorama({ activities }: { activities: Activity[] }) {
  const t = useTranslations("dashboard.panorama");
  const tGut = useTranslations("activities.gutBands");

  const low = activities.filter((a) => a.priority <= 20).length;
  const medium = activities.filter((a) => a.priority >= 21 && a.priority <= 60).length;
  const high = activities.filter((a) => a.priority >= 61).length;
  const total = low + medium + high;

  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <div className="rounded-xl border bg-card px-5 py-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-foreground">{t("title")}</h3>
        <span className="text-xs text-muted-foreground">{t("subtitle", { count: total })}</span>
      </div>
      <div className="flex h-3.5 overflow-hidden rounded-full bg-muted">
        {low > 0 && <div className="h-full bg-gut-low-foreground" style={{ width: `${pct(low)}%` }} />}
        {medium > 0 && (
          <div className="h-full bg-gut-medium-foreground" style={{ width: `${pct(medium)}%` }} />
        )}
        {high > 0 && <div className="h-full bg-gut-high-foreground" style={{ width: `${pct(high)}%` }} />}
      </div>
      <div className="mt-3 flex flex-wrap gap-5">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2.5 rounded-sm bg-gut-low-foreground" />
          {tGut("lowRange")} · {low}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2.5 rounded-sm bg-gut-medium-foreground" />
          {tGut("mediumRange")} · {medium}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2.5 rounded-sm bg-gut-high-foreground" />
          {tGut("highRange")} · {high}
        </span>
      </div>
    </div>
  );
}
