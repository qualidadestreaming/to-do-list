"use server";

import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import {
  activityFormSchema,
  closeActivitySchema,
  followUpSchema,
  type ActivityFormValues,
} from "@/lib/validation/activity";

type ActionResult = { ok: true } | { ok: false; error: string };

const ACTIVITIES_PATH = "/app/atividades";

export async function createActivity(input: ActivityFormValues): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const parsed = activityFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const values = parsed.data;

  const supabase = await createSessionClient();
  const { data: activity, error } = await supabase
    .from("activities")
    .insert({
      department_id: session.departmentId,
      owner_user_id: values.ownerUserId,
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
    return { ok: false, error: "Não foi possível criar a atividade." };
  }

  if (values.note) {
    await supabase.from("activity_follow_ups").insert({
      activity_id: activity.id,
      author_user_id: session.userId,
      note: values.note,
    });
  }

  revalidatePath(ACTIVITIES_PATH);
  return { ok: true };
}

export async function updateActivity(
  activityId: string,
  input: ActivityFormValues
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const parsed = activityFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const values = parsed.data;

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("activities")
    .update({
      owner_user_id: values.ownerUserId,
      title: values.title,
      start_date: values.startDate,
      due_date: values.dueDate || null,
      gravidade: values.gravidade,
      urgencia: values.urgencia,
      tendencia: values.tendencia,
    })
    .eq("id", activityId);

  if (error) {
    console.error("updateActivity", error);
    return { ok: false, error: "Não foi possível salvar as alterações." };
  }

  if (values.note) {
    await supabase.from("activity_follow_ups").insert({
      activity_id: activityId,
      author_user_id: session.userId,
      note: values.note,
    });
  }

  revalidatePath(ACTIVITIES_PATH);
  return { ok: true };
}

export async function startActivity(activityId: string): Promise<ActionResult> {
  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("activities")
    .update({ status: "on_going" })
    .eq("id", activityId)
    .eq("status", "ready");

  if (error) {
    console.error("startActivity", error);
    return { ok: false, error: "Não foi possível iniciar a atividade." };
  }
  revalidatePath(ACTIVITIES_PATH);
  return { ok: true };
}

export async function closeActivity(input: {
  activityId: string;
  completedDate: string;
}): Promise<ActionResult> {
  const parsed = closeActivitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("activities")
    .update({ status: "closed", completed_date: parsed.data.completedDate })
    .eq("id", parsed.data.activityId);

  if (error) {
    console.error("closeActivity", error);
    return { ok: false, error: "Não foi possível concluir a atividade." };
  }
  revalidatePath(ACTIVITIES_PATH);
  return { ok: true };
}

export async function reopenActivity(activityId: string): Promise<ActionResult> {
  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("activities")
    .update({ status: "on_going", completed_date: null })
    .eq("id", activityId)
    .eq("status", "closed");

  if (error) {
    console.error("reopenActivity", error);
    return { ok: false, error: "Não foi possível reabrir a atividade." };
  }
  revalidatePath(ACTIVITIES_PATH);
  return { ok: true };
}

export async function addFollowUp(input: {
  activityId: string;
  note: string;
}): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const parsed = followUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.from("activity_follow_ups").insert({
    activity_id: parsed.data.activityId,
    author_user_id: session.userId,
    note: parsed.data.note,
  });

  if (error) {
    console.error("addFollowUp", error);
    return { ok: false, error: "Não foi possível registrar a atualização." };
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
  const supabase = await createSessionClient();
  const { error } = await supabase.from("activities").delete().eq("id", activityId);

  if (error) {
    console.error("deleteActivity", error);
    return { ok: false, error: "Não foi possível excluir a atividade." };
  }
  revalidatePath(ACTIVITIES_PATH);
  return { ok: true };
}
