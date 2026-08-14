"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import {
  createPendingDepartmentCookie,
  createSessionCookie,
  destroySessionCookie,
  destroyPendingDepartmentCookie,
  getPendingDepartment,
  getSession,
} from "@/lib/auth/session";
import type { UserRole } from "@/types/database";

export interface DepartmentOption {
  slug: string;
  name: string;
}

export async function fetchDepartmentOptions(): Promise<DepartmentOption[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc("list_departments_for_login");
  if (error) {
    console.error("fetchDepartmentOptions", error);
    return [];
  }
  return (data ?? []) as DepartmentOption[];
}

export interface DepartmentUserOption {
  id: string;
  name: string;
  role: UserRole;
}

// Códigos de erro (não texto) — o client traduz para o idioma ativo via
// next-intl. Servidor nunca decide em qual idioma responder.
export type AuthErrorCode =
  | "missing_fields"
  | "invalid_credentials"
  | "generic_error"
  | "users_load_error"
  | "no_users_in_department"
  | "session_expired"
  | "confirm_error"
  | "invalid_user";

type VerifyDepartmentPasswordResult =
  | { ok: true; departmentName: string; users: DepartmentUserOption[] }
  | { ok: false; errorCode: AuthErrorCode };

export async function verifyDepartmentPassword(input: {
  slug: string;
  password: string;
}): Promise<VerifyDepartmentPasswordResult> {
  const slug = input.slug?.trim().toLowerCase();
  const password = input.password ?? "";
  if (!slug || !password) {
    return { ok: false, errorCode: "missing_fields" };
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.rpc("login_department", {
    p_slug: slug,
    p_password: password,
  });

  if (error) {
    console.error("login_department", error);
    return { ok: false, errorCode: "generic_error" };
  }

  const row = data?.[0];
  if (!row) {
    return { ok: false, errorCode: "invalid_credentials" };
  }

  const { data: usersData, error: usersError } = await supabase.rpc("list_department_users", {
    p_department_id: row.department_id,
  });

  if (usersError) {
    console.error("list_department_users", usersError);
    return { ok: false, errorCode: "users_load_error" };
  }

  const users: DepartmentUserOption[] = (usersData ?? []).map(
    (u: { user_id: string; user_name: string; user_role: UserRole }) => ({
      id: u.user_id,
      name: u.user_name,
      role: u.user_role,
    })
  );

  if (users.length === 0) {
    return { ok: false, errorCode: "no_users_in_department" };
  }

  await createPendingDepartmentCookie({
    departmentId: row.department_id,
    departmentName: row.department_name,
  });

  return { ok: true, departmentName: row.department_name, users };
}

type CompleteLoginResult = { ok: false; errorCode: AuthErrorCode };

export async function completeLogin(input: { userId: string }): Promise<CompleteLoginResult> {
  const pending = await getPendingDepartment();
  if (!pending) {
    return { ok: false, errorCode: "session_expired" };
  }

  const supabase = createServerClient();
  const { data: usersData, error } = await supabase.rpc("list_department_users", {
    p_department_id: pending.departmentId,
  });

  if (error) {
    console.error("list_department_users", error);
    return { ok: false, errorCode: "confirm_error" };
  }

  const match = (usersData ?? []).find(
    (u: { user_id: string }) => u.user_id === input.userId
  ) as { user_id: string; user_name: string; user_role: UserRole } | undefined;

  if (!match) {
    return { ok: false, errorCode: "invalid_user" };
  }

  await createSessionCookie({
    departmentId: pending.departmentId,
    departmentName: pending.departmentName,
    userId: match.user_id,
    userName: match.user_name,
    userRole: match.user_role,
  });
  await destroyPendingDepartmentCookie();

  redirect("/app/dashboard");
}

export async function logout() {
  await destroySessionCookie();
  redirect("/login");
}

// Troca "quem está usando" sem sair do departamento — não passa pela senha
// de novo (a pessoa já provou que sabe a senha do departamento ao logar da
// primeira vez; trocar de usuário aqui é só re-identificação, igual ao
// passo 2 do login).
export async function fetchDepartmentUsersForSwitch(): Promise<DepartmentUserOption[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = createServerClient();
  const { data, error } = await supabase.rpc("list_department_users", {
    p_department_id: session.departmentId,
  });
  if (error) {
    console.error("fetchDepartmentUsersForSwitch", error);
    return [];
  }
  return (data ?? []).map((u: { user_id: string; user_name: string; user_role: UserRole }) => ({
    id: u.user_id,
    name: u.user_name,
    role: u.user_role,
  }));
}

export async function switchUser(newUserId: string): Promise<{ ok: false; errorCode: AuthErrorCode }> {
  const session = await getSession();
  if (!session) return { ok: false, errorCode: "session_expired" };

  const supabase = createServerClient();
  const { data, error } = await supabase.rpc("list_department_users", {
    p_department_id: session.departmentId,
  });
  if (error) {
    console.error("switchUser", error);
    return { ok: false, errorCode: "confirm_error" };
  }

  const match = (data ?? []).find(
    (u: { user_id: string }) => u.user_id === newUserId
  ) as { user_id: string; user_name: string; user_role: UserRole } | undefined;

  if (!match) {
    return { ok: false, errorCode: "invalid_user" };
  }

  await createSessionCookie({
    departmentId: session.departmentId,
    departmentName: session.departmentName,
    userId: match.user_id,
    userName: match.user_name,
    userRole: match.user_role,
  });

  revalidatePath("/app", "layout");
  redirect("/app/dashboard");
}
