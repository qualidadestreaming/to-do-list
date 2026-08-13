import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserRole } from "@/types/database";

const COOKIE_NAME = "tdl_session";
const PENDING_COOKIE_NAME = "tdl_pending";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 180; // 180 dias — sessão fica ativa até logout explícito
const PENDING_DURATION_SECONDS = 60 * 10; // 10 minutos para completar o passo 2 do login (escolher usuário)

export interface SessionPayload {
  departmentId: string;
  departmentName: string;
  userId: string;
  userName: string;
  userRole: UserRole;
}

function getSecret() {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) throw new Error("SUPABASE_JWT_SECRET não configurado");
  return new TextEncoder().encode(secret);
}

/**
 * Assina o JWT de sessão. As claims `department_id`/`user_id`/`user_role`
 * são exatamente o que supabase/schema.sql lê via auth.jwt() nas policies de
 * RLS (current_department_id()/current_session_role()) — não renomear sem
 * atualizar o schema também. `role: "authenticated"` é a claim que o
 * PostgREST usa para decidir com qual role de Postgres rodar a query.
 */
export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    role: "authenticated",
    department_id: payload.departmentId,
    department_name: payload.departmentName,
    user_id: payload.userId,
    user_name: payload.userName,
    user_role: payload.userRole,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.department_id !== "string" ||
      typeof payload.department_name !== "string" ||
      typeof payload.user_id !== "string" ||
      typeof payload.user_name !== "string" ||
      typeof payload.user_role !== "string"
    ) {
      return null;
    }
    return {
      departmentId: payload.department_id,
      departmentName: payload.department_name,
      userId: payload.user_id,
      userName: payload.user_name,
      userRole: payload.user_role as UserRole,
    };
  } catch {
    return null;
  }
}

export async function createSessionCookie(payload: SessionPayload) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function destroySessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

/** Lê e valida a sessão atual. Retorna null se não houver cookie ou se o token for inválido/expirado. */
export async function getSession(): Promise<SessionPayload | null> {
  const token = await getSessionToken();
  if (!token) return null;
  return verifySession(token);
}

// -----------------------------------------------------------------------------
// Login em 2 passos: (1) senha do departamento, (2) escolher "quem sou eu".
// O cookie "pending" prova que o passo 1 já foi validado no servidor — sem
// ele, não dá para chamar a action do passo 2 direto e logar em qualquer
// departamento/usuário só adivinhando IDs.
// -----------------------------------------------------------------------------

interface PendingDepartment {
  departmentId: string;
  departmentName: string;
}

export async function createPendingDepartmentCookie(payload: PendingDepartment) {
  const token = await new SignJWT({
    department_id: payload.departmentId,
    department_name: payload.departmentName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PENDING_DURATION_SECONDS}s`)
    .sign(getSecret());

  const store = await cookies();
  store.set(PENDING_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PENDING_DURATION_SECONDS,
  });
}

export async function getPendingDepartment(): Promise<PendingDepartment | null> {
  const store = await cookies();
  const token = store.get(PENDING_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.department_id !== "string" || typeof payload.department_name !== "string") {
      return null;
    }
    return { departmentId: payload.department_id, departmentName: payload.department_name };
  } catch {
    return null;
  }
}

export async function destroyPendingDepartmentCookie() {
  const store = await cookies();
  store.delete(PENDING_COOKIE_NAME);
}
