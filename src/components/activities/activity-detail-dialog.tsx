"use client";

import { useEffect, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { deleteActivity, updateActivity } from "@/lib/actions/activity-actions";
import { useActivityErrorTranslator, type ActivityActionResult } from "@/lib/i18n/activity-errors";
import type { Activity, ActivityStatus, AppUser } from "@/types/database";

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
  const t = useTranslations("activities.detail");
  const tForm = useTranslations("activities.form");
  const translateError = useActivityErrorTranslator();
  const [isPending, startTransition] = useTransition();
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Status "pendente": Iniciar/Concluir/Reabrir só mexem aqui. O badge no
  // topo já reflete a mudança, mas nada vai pro banco até o usuário clicar
  // em "Salvar alterações" (que envia isso junto no updateActivity).
  const [pendingStatus, setPendingStatus] = useState<ActivityStatus>(activity.status);
  const [pendingCompletedDate, setPendingCompletedDate] = useState(
    activity.completed_date ?? new Date().toISOString().slice(0, 10)
  );

  // Reabrir o popup em outra atividade (ou depois de um salvamento) precisa
  // descartar o rascunho de status da anterior.
  useEffect(() => {
    setPendingStatus(activity.status);
    setPendingCompletedDate(activity.completed_date ?? new Date().toISOString().slice(0, 10));
    setShowCloseForm(false);
    setActionError(null);
  }, [activity.id, activity.status, activity.completed_date]);

  const statusChanged = pendingStatus !== activity.status;
  const overdue = isOverdue(activity.due_date, pendingStatus);

  function runAction(action: () => Promise<ActivityActionResult>) {
    setActionError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setActionError(translateError(result));
        return;
      }
      onChanged();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent fitted className="h-[760px] max-h-[90vh] gap-0 sm:max-w-2xl">
        <DialogHeader className="static mx-0 mt-0 gap-1.5 border-b bg-transparent px-6 pt-6 pb-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {t("activityNo", { id: activity.id.slice(0, 8) })}
          </p>
          <DialogTitle className="pr-8 text-base font-bold">{activity.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 border-b px-6 py-3.5">
          <StatusBadge status={pendingStatus} overdue={overdue} />
          <PriorityBadge priority={activity.priority} />
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {pendingStatus === "ready" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-lg"
                disabled={isPending}
                onClick={() => setPendingStatus("on_going")}
              >
                {t("start")}
              </Button>
            )}
            {pendingStatus !== "closed" && !showCloseForm && (
              <Button
                type="button"
                size="sm"
                className="rounded-lg"
                disabled={isPending}
                onClick={() => setShowCloseForm(true)}
              >
                {t("complete")}
              </Button>
            )}
            {pendingStatus === "closed" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-lg"
                disabled={isPending}
                onClick={() => setPendingStatus("on_going")}
              >
                {t("reopen")}
              </Button>
            )}
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              disabled={isPending}
              title={t("delete")}
              onClick={() => {
                if (confirm(t("confirmDelete"))) {
                  runAction(() => deleteActivity(activity.id));
                }
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        {statusChanged && (
          <p className="border-b bg-gut-medium/40 px-6 py-2 text-xs font-semibold text-gut-medium-foreground">
            {t("unsavedStatus")}
          </p>
        )}

        {actionError && (
          <p className="border-b bg-destructive/5 px-6 py-2 text-xs text-destructive">{actionError}</p>
        )}

        {showCloseForm && (
          <div className="flex items-end gap-2 border-b bg-muted/30 px-6 py-3.5">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("completedDate")}
              </label>
              <Input
                type="date"
                className="rounded-lg"
                value={pendingCompletedDate}
                onChange={(e) => setPendingCompletedDate(e.target.value)}
              />
            </div>
            <Button
              type="button"
              size="sm"
              className="rounded-lg"
              onClick={() => {
                setPendingStatus("closed");
                setShowCloseForm(false);
              }}
            >
              {t("confirm")}
            </Button>
            <Button type="button" size="sm" variant="ghost" className="rounded-lg" onClick={() => setShowCloseForm(false)}>
              {t("cancel")}
            </Button>
          </div>
        )}

        <Tabs defaultValue="detalhes" className="min-h-0 flex-1 gap-0">
          <div className="border-b px-6 py-3">
            <TabsList>
              <TabsTrigger value="detalhes">{t("tabDetails")}</TabsTrigger>
              <TabsTrigger value="historico">{t("tabFollowUp")}</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="detalhes" className="min-h-0 overflow-y-auto px-6 py-6">
            <ActivityForm
              users={users}
              submitLabel={tForm("submitEdit")}
              noteLabel={tForm("noteOnEdit")}
              defaultValues={{
                name: activity.name,
                title: activity.title,
                ownerUserId: activity.owner_user_id,
                startDate: activity.start_date,
                dueDate: activity.due_date ?? "",
                gravidade: activity.gravidade as 1 | 2 | 3 | 4 | 5,
                urgencia: activity.urgencia as 1 | 2 | 3 | 4 | 5,
                tendencia: activity.tendencia as 1 | 2 | 3 | 4 | 5,
              }}
              onSubmit={async (values) => {
                const result = await updateActivity(activity.id, {
                  ...values,
                  status: pendingStatus,
                  completedDate: pendingStatus === "closed" ? pendingCompletedDate : "",
                });
                if (result.ok) {
                  onChanged();
                  onOpenChange(false);
                }
                return result;
              }}
            />
          </TabsContent>
          <TabsContent value="historico" className="min-h-0 overflow-y-auto px-6 py-6">
            <FollowUpTimeline activityId={activity.id} users={users} onAdded={onChanged} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
