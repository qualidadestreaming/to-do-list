"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createSessionClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import {
  activityFormSchema,
  followUpSchema,
  type ActivityFormValues,
} from "@/lib/validation/activity";
import type { Activity } from "@/types/database";

// Códigos de erro (não texto) — o client traduz para o idioma ativo via
// next-intl. "validation" significa que o zod já rejeitou os dados (a
// mensagem de validação em si vem do próprio schema, hoje só em PT — ver
// CLAUDE.md, escopo cortado por tempo).
export type ActivityErrorCode =
  | "session_expired"
  | "validation"
  | "create_failed"
  | "update_failed"
  | "start_failed"
  | "close_failed"
  | "reopen_failed"
  | "follow_up_failed"
  | "delete_failed"
  | "reassign_failed";

type ActionResult =
  | { ok: true }
  | { ok: false; errorCode: ActivityErrorCode; validationMessage?: string };

const ACTIVITIES_PATH = "/app/atividades";

/** Invalida a cache de leitura (src/lib/data/activities.ts) do departamento
 * junto com o path — toda mutação precisa chamar isso, senão o próximo
 * carregamento continua servindo dado desatualizado da cache agressiva. */
function invalidateActivitiesCache(departmentId: string) {
  updateTag(`activities-${departmentId}`);
  revalidatePath(ACTIVITIES_PATH);
  revalidatePath("/app/dashboard");
}

export async function createActivity(input: ActivityFormValues): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, errorCode: "session_expired" };

  const parsed = activityFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errorCode: "validation", validationMessage: parsed.error.issues[0]?.message };
  }
  const values = parsed.data;

  const supabase = await createSessionClient();
  const { data: activity, error } = await supabase
    .from("activities")
    .insert({
      department_id: session.departmentId,
      owner_user_id: values.ownerUserId,
      name: values.name,
      title: values.title,
      start_date: values.startDate,
      due_date: values.dueDate || null,
      gravidade: values.gravidade,
      urgencia: values.urgencia,
      tendencia: values.tendencia,
      // Decisão confirmada com o usuário: a atividade sempre nasce "ready",
      // mesmo já tendo prazo definido — não é o default da coluna que decide
      // isso, é uma escolha de produto explícita.
      status: "ready",
    })
    .select("id")
    .single();

  if (error || !activity) {
    console.error("createActivity", error);
    return { ok: false, errorCode: "create_failed" };
  }

  if (values.note) {
    await supabase.from("activity_follow_ups").insert({
      activity_id: activity.id,
      author_user_id: session.userId,
      note: values.note,
    });
  }

  invalidateActivitiesCache(session.departmentId);
  return { ok: true };
}

export async function updateActivity(
  activityId: string,
  input: ActivityFormValues
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, errorCode: "session_expired" };

  const parsed = activityFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errorCode: "validation", validationMessage: parsed.error.issues[0]?.message };
  }
  const values = parsed.data;

  const patch: Partial<Activity> = {
    owner_user_id: values.ownerUserId,
    name: values.name,
    title: values.title,
    start_date: values.startDate,
    due_date: values.dueDate || null,
    gravidade: values.gravidade,
    urgencia: values.urgencia,
    tendencia: values.tendencia,
  };

  // Mudança de status vem no mesmo salvamento do resto do formulário.
  // completed_date acompanha o status por causa da constraint da tabela:
  // fechada exige data, qualquer outro status exige null.
  if (values.status) {
    patch.status = values.status;
    patch.completed_date =
      values.status === "closed" ? (values.completedDate ?? null) : null;
  }

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("activities")
    .update(patch)
    .eq("id", activityId);

  if (error) {
    console.error("updateActivity", error);
    return { ok: false, errorCode: "update_failed" };
  }

  if (values.note) {
    await supabase.from("activity_follow_ups").insert({
      activity_id: activityId,
      author_user_id: session.userId,
      note: values.note,
    });
  }

  invalidateActivitiesCache(session.departmentId);
  return { ok: true };
}

export async function reassignActivity(activityId: string, newOwnerId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, errorCode: "session_expired" };

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("activities")
    .update({ owner_user_id: newOwnerId })
    .eq("id", activityId);

  if (error) {
    console.error("reassignActivity", error);
    return { ok: false, errorCode: "reassign_failed" };
  }
  invalidateActivitiesCache(session.departmentId);
  return { ok: true };
}

// startActivity/closeActivity/reopenActivity foram removidas: gravavam o
// status na hora do clique. Agora Iniciar/Concluir/Reabrir só marcam a
// intenção na tela e o status vai junto no updateActivity ao salvar.

export async function addFollowUp(input: {
  activityId: string;
  note: string;
}): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, errorCode: "session_expired" };

  const parsed = followUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errorCode: "validation", validationMessage: parsed.error.issues[0]?.message };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.from("activity_follow_ups").insert({
    activity_id: parsed.data.activityId,
    author_user_id: session.userId,
    note: parsed.data.note,
  });

  if (error) {
    console.error("addFollowUp", error);
    return { ok: false, errorCode: "follow_up_failed" };
  }
  revalidatePath(ACTIVITIES_PATH);
  return { ok: true };
}

export async function getActivityFollowUps(activityId: string) {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("activity_follow_ups")
    .select("*")
    .eq("activity_id", activityId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getActivityFollowUps", error);
    return [];
  }
  return data ?? [];
}

export async function deleteActivity(activityId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, errorCode: "session_expired" };

  const supabase = await createSessionClient();
  const { error } = await supabase.from("activities").delete().eq("id", activityId);

  if (error) {
    console.error("deleteActivity", error);
    return { ok: false, errorCode: "delete_failed" };
  }
  invalidateActivitiesCache(session.departmentId);
  return { ok: true };
}
