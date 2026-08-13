"use client";

import { useMemo, useState } from "react";
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
import { StatusDistributionChart } from "@/components/dashboard/status-distribution-chart";
import { GutBandChart } from "@/components/dashboard/gut-band-chart";
import { PerformanceRankingChart } from "@/components/dashboard/performance-ranking-chart";
import {
  computeGutBandDistribution,
  computeKpis,
  computePerformanceByOwner,
  computeStatusDistribution,
} from "@/lib/dashboard-metrics";
import type { Activity, ActivityStatus, AppUser } from "@/types/database";
import type { GutBandKey } from "@/lib/gut";

type StatusFilter = "all" | ActivityStatus | "overdue";

export function DashboardView({
  activities,
  users,
  loadError,
}: {
  activities: Activity[];
  users: AppUser[];
  loadError?: boolean;
}) {
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [bandFilter, setBandFilter] = useState<GutBandKey | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (ownerFilter !== "all" && a.owner_user_id !== ownerFilter) return false;
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
  }, [activities, ownerFilter, statusFilter, bandFilter, fromDate, toDate]);

  const kpis = useMemo(() => computeKpis(filtered), [filtered]);
  const statusData = useMemo(() => computeStatusDistribution(filtered), [filtered]);
  const bandData = useMemo(() => computeGutBandDistribution(filtered), [filtered]);
  const performanceData = useMemo(
    () => computePerformanceByOwner(filtered, users),
    [filtered, users]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>

      {loadError && (
        <Alert variant="destructive">
          <AlertDescription>
            Não foi possível carregar os dados agora. Verifique a conexão com o Supabase.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Responsável</Label>
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ready">Pronta</SelectItem>
              <SelectItem value="on_going">Em andamento</SelectItem>
              <SelectItem value="closed">Concluída</SelectItem>
              <SelectItem value="overdue">Atrasadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Prioridade GUT</Label>
          <Select value={bandFilter} onValueChange={(v) => setBandFilter(v as GutBandKey | "all")}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Início — de</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Início — até</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
        </div>
      </div>

      <KpiCards kpis={kpis} />

      <div className="grid gap-4 lg:grid-cols-2">
        <StatusDistributionChart data={statusData} />
        <GutBandChart data={bandData} />
      </div>

      <PerformanceRankingChart data={performanceData} />
    </div>
  );
}
