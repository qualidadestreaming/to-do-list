"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ActivityForm } from "@/components/activities/activity-form";
import { ActivityDetailDialog } from "@/components/activities/activity-detail-dialog";
import { PriorityBadge } from "@/components/activities/priority-badge";
import { StatusBadge, isOverdue } from "@/components/activities/status-badge";
import { createActivity } from "@/lib/actions/activity-actions";
import type { Activity, ActivityStatus, AppUser } from "@/types/database";
import type { GutBandKey } from "@/lib/gut";

type StatusFilter = "all" | ActivityStatus | "overdue";
type SortOption = "priority_desc" | "priority_asc" | "due_date_asc";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function ActivitiesView({
  initialActivities,
  users,
  loadError,
}: {
  initialActivities: Activity[];
  users: AppUser[];
  currentUserId: string;
  loadError?: boolean;
}) {
  const router = useRouter();
  const activities = initialActivities;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [bandFilter, setBandFilter] = useState<GutBandKey | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("priority_desc");

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedActivity = activities.find((a) => a.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    let list = activities;

    if (statusFilter === "overdue") {
      list = list.filter((a) => isOverdue(a.due_date, a.status));
    } else if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }

    if (ownerFilter !== "all") {
      list = list.filter((a) => a.owner_user_id === ownerFilter);
    }

    if (bandFilter !== "all") {
      list = list.filter((a) => {
        if (bandFilter === "low") return a.priority <= 20;
        if (bandFilter === "medium") return a.priority >= 21 && a.priority <= 60;
        return a.priority >= 61;
      });
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q));
    }

    const sorted = [...list].sort((a, b) => {
      if (sort === "priority_desc") return b.priority - a.priority;
      if (sort === "priority_asc") return a.priority - b.priority;
      // due_date_asc: sem prazo vai para o final
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    });

    return sorted;
  }, [activities, statusFilter, ownerFilter, bandFilter, search, sort]);

  function ownerName(id: string) {
    return users.find((u) => u.id === id)?.name ?? "—";
  }

  function handleChanged() {
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-foreground">Atividades</h1>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Nova atividade
        </Button>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertDescription>
            Não foi possível carregar os dados agora. Verifique a conexão com o Supabase.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-3">
        <Input
          placeholder="Buscar atividade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-56"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ready">Pronta</SelectItem>
            <SelectItem value="on_going">Em andamento</SelectItem>
            <SelectItem value="closed">Concluída</SelectItem>
            <SelectItem value="overdue">Atrasadas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os responsáveis</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={bandFilter} onValueChange={(v) => setBandFilter(v as GutBandKey | "all")}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda prioridade</SelectItem>
            <SelectItem value="high">Alta (61–125)</SelectItem>
            <SelectItem value="medium">Média (21–60)</SelectItem>
            <SelectItem value="low">Baixa (1–20)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority_desc">Maior prioridade primeiro</SelectItem>
            <SelectItem value="priority_asc">Menor prioridade primeiro</SelectItem>
            <SelectItem value="due_date_asc">Prazo mais próximo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Atividade</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Prazo</th>
                <th className="px-4 py-3">Prioridade</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((activity) => (
                <tr
                  key={activity.id}
                  onClick={() => setSelectedId(activity.id)}
                  className="cursor-pointer hover:bg-accent/5"
                >
                  <td className="max-w-xs truncate px-4 py-3 font-medium text-foreground">
                    {activity.title}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ownerName(activity.owner_user_id)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(activity.due_date)}
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={activity.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={activity.status}
                      overdue={isOverdue(activity.due_date, activity.status)}
                    />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhuma atividade encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova atividade</DialogTitle>
          </DialogHeader>
          <ActivityForm
            users={users}
            submitLabel="Criar atividade"
            onSubmit={async (values) => {
              const result = await createActivity(values);
              if (result.ok) {
                toast.success("Atividade criada.");
                setCreateOpen(false);
                handleChanged();
              }
              return result;
            }}
          />
        </DialogContent>
      </Dialog>

      {selectedActivity && (
        <ActivityDetailDialog
          activity={selectedActivity}
          users={users}
          open={Boolean(selectedId)}
          onOpenChange={(open) => !open && setSelectedId(null)}
          onChanged={handleChanged}
        />
      )}
    </div>
  );
}
