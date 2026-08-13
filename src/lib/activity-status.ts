import type { ActivityStatus } from "@/types/database";

export function isOverdue(dueDate: string | null, status: ActivityStatus): boolean {
  if (!dueDate || status === "closed") return false;
  const today = new Date().toISOString().slice(0, 10);
  return dueDate < today;
}
