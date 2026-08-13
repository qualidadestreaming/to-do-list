"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addFollowUp, getActivityFollowUps } from "@/lib/actions/activity-actions";
import type { ActivityFollowUp, AppUser } from "@/types/database";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FollowUpTimeline({
  activityId,
  users,
  onAdded,
}: {
  activityId: string;
  users: AppUser[];
  onAdded?: () => void;
}) {
  const [items, setItems] = useState<ActivityFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reload() {
    setLoading(true);
    getActivityFollowUps(activityId)
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  function authorName(id: string | null) {
    if (!id) return "—";
    return users.find((u) => u.id === id)?.name ?? "Ex-colaborador";
  }

  function handleAdd() {
    if (!note.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addFollowUp({ activityId, note });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNote("");
      reload();
      onAdded?.();
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder="Escreva uma atualização..."
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="button" size="sm" onClick={handleAdd} disabled={isPending || !note.trim()}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Adicionar atualização
        </Button>
      </div>

      <div className="max-h-80 space-y-3 overflow-y-auto border-t pt-3">
        {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma atualização registrada ainda.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border bg-card p-3 text-sm">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{authorName(item.author_user_id)}</span>
              <span>{formatDateTime(item.created_at)}</span>
            </div>
            <p className="whitespace-pre-wrap text-foreground">{item.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
