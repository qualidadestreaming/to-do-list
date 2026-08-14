"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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
import { AssignPopover } from "@/components/activities/assign-popover";
import { PriorityBadge } from "@/components/activities/priority-badge";
import { StatusBadge, isOverdue } from "@/components/activities/status-badge";
import { createActivity } from "@/lib/actions/activity-actions";
import type { Activity, ActivityStatus, AppUser } from "@/types/database";
import type { GutBandKey } from "@/lib/gut";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | ActivityStatus | "overdue";
type SortOption =
  | "created_desc"
  | "created_asc"
  | "priority_desc"
  | "priority_asc"
  | "due_date_asc"
  | "due_date_desc";
type Scope = "minhas" | "todas";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function ActivitiesView({
  initialActivities,
  users,
  currentUserId,
  loadError,
}: {
  initialActivities: Activity[];
  users: AppUser[];
  currentUserId: string;
  loadError?: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("activities");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("activities.status");
  const tGut = useTranslations("activities.gutBands");
  const activities = initialActivities;

  const [scope, setScope] = useState<Scope>("minhas");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [bandFilter, setBandFilter] = useState<GutBandKey | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("created_desc");

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedActivity = activities.find((a) => a.id === selectedId) ?? null;

  const scoped = useMemo(
    () => (scope === "minhas" ? activities.filter((a) => a.owner_user_id === currentUserId) : activities),
    [activities, scope, currentUserId]
  );

  const filtered = useMemo(() => {
    let list = scoped;

    if (statusFilter === "overdue") {
      list = list.filter((a) => isOverdue(a.due_date, a.status));
    } else if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }

    if (scope === "todas" && ownerFilter !== "all") {
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
      list = list.filter(
        (a) => a.name.toLowerCase().includes(q) || a.title.toLowerCase().includes(q)
      );
    }

    const sorted = [...list].sort((a, b) => {
      if (sort === "created_desc") return b.created_at.localeCompare(a.created_at);
      if (sort === "created_asc") return a.created_at.localeCompare(b.created_at);
      if (sort === "priority_desc") return b.priority - a.priority;
      if (sort === "priority_asc") return a.priority - b.priority;
      // due_date_*: sem prazo sempre vai para o final, independente da direção
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return sort === "due_date_desc"
        ? b.due_date.localeCompare(a.due_date)
        : a.due_date.localeCompare(b.due_date);
    });

    return sorted;
  }, [scoped, scope, statusFilter, ownerFilter, bandFilter, search, sort]);

  function handleChanged() {
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          {t("newActivity")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-0.5 rounded-lg border bg-card p-0.5">
          {(["minhas", "todas"] as Scope[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors",
                scope === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(`scope.${s === "minhas" ? "mine" : "all"}`)}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {scope === "minhas"
            ? t("scope.mineHint", { count: scoped.length })
            : t("scope.allHint", { count: scoped.length })}
        </span>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertDescription>{tCommon("genericLoadError")}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-3">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-56"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t("filters.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
            <SelectItem value="ready">{tStatus("ready")}</SelectItem>
            <SelectItem value="on_going">{tStatus("on_going")}</SelectItem>
            <SelectItem value="closed">{tStatus("closed")}</SelectItem>
            <SelectItem value="overdue">{tStatus("overdueFilter")}</SelectItem>
          </SelectContent>
        </Select>
        {scope === "todas" && (
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder={t("filters.owner")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allOwners")}</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={bandFilter} onValueChange={(v) => setBandFilter(v as GutBandKey | "all")}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t("filters.priority")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allPriorities")}</SelectItem>
            <SelectItem value="high">{tGut("highRange")}</SelectItem>
            <SelectItem value="medium">{tGut("mediumRange")}</SelectItem>
            <SelectItem value="low">{tGut("lowRange")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t("filters.sort")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_desc">{t("filters.sortCreatedDesc")}</SelectItem>
            <SelectItem value="created_asc">{t("filters.sortCreatedAsc")}</SelectItem>
            <SelectItem value="priority_desc">{t("filters.sortPriorityDesc")}</SelectItem>
            <SelectItem value="priority_asc">{t("filters.sortPriorityAsc")}</SelectItem>
            <SelectItem value="due_date_asc">{t("filters.sortDueDate")}</SelectItem>
            <SelectItem value="due_date_desc">{t("filters.sortDueDateDesc")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t("columns.name")}</th>
                <th className="px-4 py-3">{t("columns.description")}</th>
                <th className="px-4 py-3">{t("columns.owner")}</th>
                <th className="px-4 py-3">{t("columns.dueDate")}</th>
                <th className="px-4 py-3">{t("columns.priority")}</th>
                <th className="px-4 py-3">{t("columns.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((activity) => (
                <tr
                  key={activity.id}
                  onClick={() => setSelectedId(activity.id)}
                  className="cursor-pointer align-top hover:bg-accent/5"
                >
                  <td className="max-w-[220px] px-4 py-3 font-medium text-foreground">
                    {activity.name}
                  </td>
                  <td className="max-w-sm px-4 py-3 text-muted-foreground">
                    <p className="line-clamp-2 min-h-[3.25em] leading-relaxed whitespace-pre-line">
                      {activity.title}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <AssignPopover
                      activityId={activity.id}
                      ownerId={activity.owner_user_id}
                      users={users}
                      onChanged={handleChanged}
                    />
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
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    {t("noResults")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("newActivity")}</DialogTitle>
          </DialogHeader>
          <ActivityForm
            users={users}
            submitLabel={t("form.submitCreate")}
            onSubmit={async (values) => {
              const result = await createActivity(values);
              if (result.ok) {
                toast.success(t("form.createdToast"));
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
