"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActivityForm } from "@/components/activities/activity-form";
import { FollowUpTimeline } from "@/components/activities/follow-up-timeline";
import { PriorityBadge } from "@/components/activities/priority-badge";
import { StatusBadge, isOverdue } from "@/components/activities/status-badge";
import {
  closeActivity,
  deleteActivity,
  reopenActivity,
  startActivity,
  updateActivity,
} from "@/lib/actions/activity-actions";
import type { Activity, AppUser } from "@/types/database";

export function ActivityDetailDialog({
  activity,
  users,
  open,
  onOpenChange,
  onChanged,
}: {
  activity: Activity;
  users: AppUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [completedDate, setCompletedDate] = useState(new Date().toISOString().slice(0, 10));
  const [actionError, setActionError] = useState<string | null>(null);

  const overdue = isOverdue(activity.due_date, activity.status);

  function runAction(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setActionError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      onChanged();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={activity.status} overdue={overdue} />
              <PriorityBadge priority={activity.priority} />
            </div>
          </DialogTitle>
        </DialogHeader>

        {actionError && <p className="text-sm text-destructive">{actionError}</p>}

        <div className="flex flex-wrap gap-2 border-b pb-4">
          {activity.status === "ready" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => runAction(() => startActivity(activity.id))}
            >
              Iniciar
            </Button>
          )}
          {activity.status !== "closed" && !showCloseForm && (
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={() => setShowCloseForm(true)}
            >
              Concluir
            </Button>
          )}
          {activity.status === "closed" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => runAction(() => reopenActivity(activity.id))}
            >
              Reabrir
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={isPending}
            onClick={() => {
              if (confirm("Excluir esta atividade e todo o histórico de follow-up?")) {
                runAction(() => deleteActivity(activity.id));
              }
            }}
          >
            <Trash2 className="size-4" />
            Excluir
          </Button>
        </div>

        {showCloseForm && (
          <div className="flex items-end gap-2 rounded-lg border bg-muted/40 p-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">Data de conclusão</label>
              <Input
                type="date"
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
              />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={() =>
                runAction(async () => {
                  const result = await closeActivity({ activityId: activity.id, completedDate });
                  if (result.ok) setShowCloseForm(false);
                  return result;
                })
              }
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Confirmar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowCloseForm(false)}>
              Cancelar
            </Button>
          </div>
        )}

        <Tabs defaultValue="detalhes">
          <TabsList>
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="historico">Follow-up</TabsTrigger>
          </TabsList>
          <TabsContent value="detalhes" className="pt-2">
            <ActivityForm
              users={users}
              submitLabel="Salvar alterações"
              noteLabel="Nova atualização (opcional, vira um follow-up)"
              defaultValues={{
                title: activity.title,
                ownerUserId: activity.owner_user_id,
                startDate: activity.start_date,
                dueDate: activity.due_date ?? "",
                gravidade: activity.gravidade as 1 | 2 | 3 | 4 | 5,
                urgencia: activity.urgencia as 1 | 2 | 3 | 4 | 5,
                tendencia: activity.tendencia as 1 | 2 | 3 | 4 | 5,
              }}
              onSubmit={async (values) => {
                const result = await updateActivity(activity.id, values);
                if (result.ok) onChanged();
                return result;
              }}
            />
          </TabsContent>
          <TabsContent value="historico" className="pt-2">
            <FollowUpTimeline activityId={activity.id} users={users} onAdded={onChanged} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
