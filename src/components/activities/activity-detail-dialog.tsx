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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="pr-6">
            <span className="mb-2 block text-base font-semibold">{activity.name}</span>
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
              {t("start")}
            </Button>
          )}
          {activity.status !== "closed" && !showCloseForm && (
            <Button
              type="button"
              size="sm"
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
              disabled={isPending}
              onClick={() => runAction(() => reopenActivity(activity.id))}
            >
              {t("reopen")}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={isPending}
            onClick={() => {
              if (confirm(t("confirmDelete"))) {
                runAction(() => deleteActivity(activity.id));
              }
            }}
          >
            <Trash2 className="size-4" />
            {t("delete")}
          </Button>
        </div>

        {showCloseForm && (
          <div className="flex items-end gap-2 rounded-lg border bg-muted/40 p-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">{t("completedDate")}</label>
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
              {t("confirm")}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowCloseForm(false)}>
              {t("cancel")}
            </Button>
          </div>
        )}

        <Tabs defaultValue="detalhes">
          <TabsList>
            <TabsTrigger value="detalhes">{t("tabDetails")}</TabsTrigger>
            <TabsTrigger value="historico">{t("tabFollowUp")}</TabsTrigger>
          </TabsList>
          <TabsContent value="detalhes" className="pt-2">
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
