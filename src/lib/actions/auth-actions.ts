"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import {
  createPendingDepartmentCookie,
  createSessionCookie,
  destroySessionCookie,
  destroyPendingDepartmentCookie,
  getPendingDepartment,
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

type VerifyDepartmentPasswordResult =
  | { ok: true; departmentName: string; users: DepartmentUserOption[] }
  | { ok: false; error: string };

export async function verifyDepartmentPassword(input: {
  slug: string;
  password: string;
}): Promise<VerifyDepartmentPasswordResult> {
  const slug = input.slug?.trim().toLowerCase();
  const password = input.password ?? "";
  if (!slug || !password) {
    return { ok: false, error: "Informe o departamento e a senha." };
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.rpc("login_department", {
    p_slug: slug,
    p_password: password,
  });

  if (error) {
    console.error("login_department", error);
    return { ok: false, error: "Não foi possível validar o login agora. Tente novamente." };
  }

  const row = data?.[0];
  if (!row) {
    return { ok: false, error: "Departamento ou senha incorretos." };
  }

  const { data: usersData, error: usersError } = await supabase.rpc("list_department_users", {
    p_department_id: row.department_id,
  });

  if (usersError) {
    console.error("list_department_users", usersError);
    return { ok: false, error: "Não foi possível carregar a lista de colaboradores." };
  }

  const users: DepartmentUserOption[] = (usersData ?? []).map(
    (u: { user_id: string; user_name: string; user_role: UserRole }) => ({
      id: u.user_id,
      name: u.user_name,
      role: u.user_role,
    })
  );

  if (users.length === 0) {
    return {
      ok: false,
      error: "Este departamento ainda não tem nenhum colaborador cadastrado. Fale com o gestor.",
    };
  }

  await createPendingDepartmentCookie({
    departmentId: row.department_id,
    departmentName: row.department_name,
  });

  return { ok: true, departmentName: row.department_name, users };
}

type CompleteLoginResult = { ok: false; error: string };

export async function completeLogin(input: { userId: string }): Promise<CompleteLoginResult> {
  const pending = await getPendingDepartment();
  if (!pending) {
    return { ok: false, error: "Sua sessão de login expirou. Comece de novo." };
  }

  const supabase = createServerClient();
  const { data: usersData, error } = await supabase.rpc("list_department_users", {
    p_department_id: pending.departmentId,
  });

  if (error) {
    console.error("list_department_users", error);
    return { ok: false, error: "Não foi possível confirmar o login agora. Tente novamente." };
  }

  const match = (usersData ?? []).find(
    (u: { user_id: string }) => u.user_id === input.userId
  ) as { user_id: string; user_name: string; user_role: UserRole } | undefined;

  if (!match) {
    return { ok: false, error: "Usuário inválido para este departamento." };
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
