"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { reassignActivity } from "@/lib/actions/activity-actions";
import { useActivityErrorTranslator } from "@/lib/i18n/activity-errors";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/types/database";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function AssignPopover({
  activityId,
  ownerId,
  users,
  onChanged,
}: {
  activityId: string;
  ownerId: string;
  users: AppUser[];
  onChanged: () => void;
}) {
  const translateError = useActivityErrorTranslator();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const owner = users.find((u) => u.id === ownerId);

  function handlePick(newOwnerId: string) {
    if (newOwnerId === ownerId) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      const result = await reassignActivity(activityId, newOwnerId);
      if (!result.ok) {
        toast.error(translateError(result));
        return;
      }
      setOpen(false);
      onChanged();
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 rounded-full border border-dashed border-transparent py-0.5 pl-0.5 pr-2 text-sm hover:border-primary hover:text-primary"
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {initials(owner?.name ?? "—")}
          </span>
          {owner?.name ?? "—"}
          {isPending ? (
            <Loader2 className="size-3 animate-spin opacity-60" />
          ) : (
            <ChevronDown className="size-3 opacity-40" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-56 p-1"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-64 overflow-y-auto">
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => handlePick(u.id)}
              disabled={isPending}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                u.id === ownerId && "bg-accent/60 font-medium"
              )}
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold">
                {initials(u.name)}
              </span>
              {u.name}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
