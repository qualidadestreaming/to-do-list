import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardKpis } from "@/lib/dashboard-metrics";
import { cn } from "@/lib/utils";

export function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  const items: { label: string; value: string; accent?: string }[] = [
    { label: "Total de atividades", value: String(kpis.total) },
    { label: "Prontas", value: String(kpis.ready) },
    { label: "Em andamento", value: String(kpis.onGoing) },
    { label: "Concluídas", value: String(kpis.closed) },
    {
      label: "Atrasadas",
      value: String(kpis.overdue),
      accent: kpis.overdue > 0 ? "text-status-overdue-foreground" : undefined,
    },
    {
      label: "% concluídas no prazo",
      value: kpis.onTimePercentage === null ? "—" : `${kpis.onTimePercentage}%`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => (
        <Card key={item.label} className="gap-1 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <span className={cn("text-2xl font-semibold tabular-nums", item.accent)}>
              {item.value}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
