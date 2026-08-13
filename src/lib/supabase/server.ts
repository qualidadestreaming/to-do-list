import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Client Supabase para uso em Server Components/Actions/Route Handlers,
 * autenticado com o JWT de sessão do departamento (ver src/lib/auth/session.ts,
 * Fase 1) como Authorization: Bearer — é isso que faz as policies de RLS
 * (current_department_id() em supabase/schema.sql) enxergarem a sessão atual.
 *
 * Sem token (usuário deslogado), o client funciona como anônimo: RLS bloqueia
 * tudo que exige current_department_id(), que é o comportamento esperado.
 */
export function createServerClient(accessToken?: string) {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: accessToken
        ? { headers: { Authorization: `Bearer ${accessToken}` } }
        : undefined,
    }
  );
}

/**
 * Client com a service_role key — bypassa RLS por completo. Só pode ser
 * importado em código que roda no servidor (Server Actions/Route Handlers),
 * nunca em código que chega ao bundle do cliente. Reservado para operações
 * administrativas que precisam existir antes de qualquer sessão (ex: criar um
 * departamento novo, Fase 6) ou para a função de login (embora login em si já
 * seja resolvido via RPC security definer em supabase/schema.sql).
 */
export function createServiceRoleClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
