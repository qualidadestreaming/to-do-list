"use server";

import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import {
  changePasswordSchema,
  editUserSchema,
  newDepartmentSchema,
  newUserSchema,
  type ChangePasswordValues,
  type EditUserValues,
  type NewDepartmentValues,
  type NewUserValues,
} from "@/lib/validation/admin";

export type AdminErrorCode =
  | "forbidden"
  | "session_expired"
  | "validation"
  | "create_user_failed"
  | "update_user_failed"
  | "change_password_failed"
  | "create_department_failed"
  | "slug_taken";

type ActionResult =
  | { ok: true }
  | { ok: false; errorCode: AdminErrorCode; validationMessage?: string };

const ADMIN_PATH = "/app/admin";

async function requireGestor() {
  const session = await getSession();
  if (!session) return { ok: false as const, errorCode: "session_expired" as const };
  if (session.userRole !== "gestor") return { ok: false as const, errorCode: "forbidden" as const };
  return { ok: true as const, session };
}

export async function createDepartmentUser(input: NewUserValues): Promise<ActionResult> {
  const guard = await requireGestor();
  if (!guard.ok) return guard;

  const parsed = newUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errorCode: "validation", validationMessage: parsed.error.issues[0]?.message };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.from("users").insert({
    department_id: guard.session.departmentId,
    name: parsed.data.name,
    role: parsed.data.role,
  });

  if (error) {
    console.error("createDepartmentUser", error);
    return { ok: false, errorCode: "create_user_failed" };
  }
  revalidatePath(ADMIN_PATH);
  return { ok: true };
}

export async function updateDepartmentUser(
  userId: string,
  input: EditUserValues
): Promise<ActionResult> {
  const guard = await requireGestor();
  if (!guard.ok) return guard;

  const parsed = editUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errorCode: "validation", validationMessage: parsed.error.issues[0]?.message };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("users")
    .update({ name: parsed.data.name, role: parsed.data.role, active: parsed.data.active })
    .eq("id", userId);

  if (error) {
    console.error("updateDepartmentUser", error);
    return { ok: false, errorCode: "update_user_failed" };
  }
  revalidatePath(ADMIN_PATH);
  return { ok: true };
}

export async function changeDepartmentPassword(input: ChangePasswordValues): Promise<ActionResult> {
  const guard = await requireGestor();
  if (!guard.ok) return guard;

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errorCode: "validation", validationMessage: parsed.error.issues[0]?.message };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("set_department_password", {
    p_department_id: guard.session.departmentId,
    p_new_password: parsed.data.newPassword,
  });

  if (error) {
    console.error("changeDepartmentPassword", error);
    return { ok: false, errorCode: "change_password_failed" };
  }
  return { ok: true };
}

export async function createDepartment(input: NewDepartmentValues): Promise<ActionResult> {
  const guard = await requireGestor();
  if (!guard.ok) return guard;

  const parsed = newDepartmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errorCode: "validation", validationMessage: parsed.error.issues[0]?.message };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("create_department", {
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
    p_password: parsed.data.password,
    p_manager_name: parsed.data.managerName,
  });

  if (error) {
    console.error("createDepartment", error);
    if (error.message?.toLowerCase().includes("duplicate") || error.code === "23505") {
      return { ok: false, errorCode: "slug_taken" };
    }
    return { ok: false, errorCode: "create_department_failed" };
  }
  revalidatePath(ADMIN_PATH);
  return { ok: true };
}
