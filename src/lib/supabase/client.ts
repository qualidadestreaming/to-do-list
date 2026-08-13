"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Client Supabase para uso em componentes de cliente. Autenticação é feita à
 * parte (sessão de departamento, ver src/lib/auth) — este client só usa a
 * anon key; RLS é quem decide o que cada requisição pode ver.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
