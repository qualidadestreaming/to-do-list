"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
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
import {
  closeActivity,
  deleteActivity,
  reopenActivity,
  startActivity,
  updateActivity,
} from "@/lib/actions/activity-actions";
import { useActivityErrorTranslator, type ActivityActionResult } from "@/lib/i18n/activity-errors";
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
  const t = useTranslations("activities.detail");
  const tForm = useTranslations("activities.form");
  const translateError = useActivityErrorTranslator();
  const [isPending, startTransition] = useTransition();
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [completedDate, setCompletedDate] = useState(new Date().toISOString().slice(0, 10));
  const [actionError, setActionError] = useState<string | null>(null);

  const overdue = isOverdue(activity.due_date, activity.status);

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
          <StatusBadge status={activity.status} overdue={overdue} />
          <PriorityBadge priority={activity.priority} />
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {activity.status === "ready" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-lg"
                disabled={isPending}
                onClick={() => runAction(() => startActivity(activity.id))}
              >
                {t("start")}
              </Button>
            )}
            {activity.status !== "closed" && !showCloseForm && (
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
            {activity.status === "closed" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-lg"
                disabled={isPending}
                onClick={() => runAction(() => reopenActivity(activity.id))}
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
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
              />
            </div>
            <Button
              type="button"
              size="sm"
              className="rounded-lg"
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
              {t("confirm")}
            </Button>
            <Button type="button" size="sm" variant="ghost" className="rounded-lg" onClick={() => setShowCloseForm(false)}>
              {t("cancel")}
            </Button>
          </div>
        )}

        <Tabs defaultValue="detalhes" className="min-h-0 flex-1 gap-0">
          <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b bg-transparent px-6 py-0">
            <TabsTrigger
              value="detalhes"
              className="rounded-none border-b-2 border-transparent px-2 py-2.5 text-xs font-bold text-muted-foreground shadow-none data-active:border-primary data-active:bg-transparent data-active:text-primary"
            >
              {t("tabDetails")}
            </TabsTrigger>
            <TabsTrigger
              value="historico"
              className="rounded-none border-b-2 border-transparent px-2 py-2.5 text-xs font-bold text-muted-foreground shadow-none data-active:border-primary data-active:bg-transparent data-active:text-primary"
            >
              {t("tabFollowUp")}
            </TabsTrigger>
          </TabsList>
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
                const result = await updateActivity(activity.id, values);
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
