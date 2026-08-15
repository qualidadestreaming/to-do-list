"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { GutPanorama } from "@/components/dashboard/gut-panorama";
import { StatusDistributionChart } from "@/components/dashboard/status-distribution-chart";
import { GutBandChart } from "@/components/dashboard/gut-band-chart";
import { PerformanceRankingChart } from "@/components/dashboard/performance-ranking-chart";
import { ClosuresByOwnerChart } from "@/components/dashboard/closures-by-owner-chart";
import {
  computeClosuresByOwner,
  computeGutBandDistribution,
  computeKpis,
  computeActiveOverdueByOwner,
  computeStatusDistribution,
} from "@/lib/dashboard-metrics";
import type { Activity, ActivityStatus, AppUser } from "@/types/database";
import type { GutBandKey } from "@/lib/gut";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | ActivityStatus | "overdue";
type Scope = "geral" | "pessoal";

export function DashboardView({
  activities,
  users,
  currentUserId,
  currentUserName,
  departmentName,
  loadError,
}: {
  activities: Activity[];
  users: AppUser[];
  currentUserId: string;
  currentUserName: string;
  departmentName: string;
  loadError?: boolean;
}) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("activities.status");
  const tGut = useTranslations("activities.gutBands");

  const [scope, setScope] = useState<Scope>("pessoal");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [bandFilter, setBandFilter] = useState<GutBandKey | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const scoped = useMemo(
    () => (scope === "pessoal" ? activities.filter((a) => a.owner_user_id === currentUserId) : activities),
    [activities, scope, currentUserId]
  );

  const filtered = useMemo(() => {
    return scoped.filter((a) => {
      if (scope === "geral" && ownerFilter !== "all" && a.owner_user_id !== ownerFilter) return false;
      if (statusFilter === "overdue") {
        const overdue = a.due_date && a.status !== "closed" && a.due_date < new Date().toISOString().slice(0, 10);
        if (!overdue) return false;
      } else if (statusFilter !== "all" && a.status !== statusFilter) {
        return false;
      }
      if (bandFilter !== "all") {
        if (bandFilter === "low" && a.priority > 20) return false;
        if (bandFilter === "medium" && (a.priority < 21 || a.priority > 60)) return false;
        if (bandFilter === "high" && a.priority < 61) return false;
      }
      if (fromDate && a.start_date < fromDate) return false;
      if (toDate && a.start_date > toDate) return false;
      return true;
    });
  }, [scoped, scope, ownerFilter, statusFilter, bandFilter, fromDate, toDate]);

  const kpis = useMemo(() => computeKpis(filtered), [filtered]);
  const statusData = useMemo(() => computeStatusDistribution(filtered), [filtered]);
  const bandData = useMemo(() => computeGutBandDistribution(filtered), [filtered]);
  const performanceData = useMemo(
    () => computeActiveOverdueByOwner(filtered, users),
    [filtered, users]
  );
  const closuresData = useMemo(() => computeClosuresByOwner(filtered, users), [filtered, users]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="inline-flex gap-0.5 rounded-lg bg-muted p-0.5">
          {(["geral", "pessoal"] as Scope[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors",
                scope === s
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(`scope.${s === "geral" ? "general" : "personal"}`)}
            </button>
          ))}
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        {scope === "geral"
          ? t("scope.generalHint", { department: departmentName })
          : t("scope.personalHint", { name: currentUserName })}
      </p>

      {loadError && (
        <Alert variant="destructive">
          <AlertDescription>{tCommon("genericLoadError")}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-3">
        {scope === "geral" && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t("filters.owner")}</Label>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon("all")}</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t("filters.status")}</Label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tCommon("all")}</SelectItem>
              <SelectItem value="ready">{tStatus("ready")}</SelectItem>
              <SelectItem value="on_going">{tStatus("on_going")}</SelectItem>
              <SelectItem value="closed">{tStatus("closed")}</SelectItem>
              <SelectItem value="overdue">{tStatus("overdueFilter")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t("filters.priority")}</Label>
          <Select value={bandFilter} onValueChange={(v) => setBandFilter(v as GutBandKey | "all")}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tCommon("all")}</SelectItem>
              <SelectItem value="high">{tGut("high")}</SelectItem>
              <SelectItem value="medium">{tGut("medium")}</SelectItem>
              <SelectItem value="low">{tGut("low")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t("filters.startFrom")}</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t("filters.startTo")}</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
        </div>
      </div>

      <KpiCards kpis={kpis} />

      <GutPanorama activities={filtered} />

      <div className="grid gap-4 lg:grid-cols-2">
        <StatusDistributionChart data={statusData} />
        <GutBandChart data={bandData} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ClosuresByOwnerChart data={closuresData} />
        <PerformanceRankingChart data={performanceData} />
      </div>
    </div>
  );
}
