import "server-only";
import { unstable_cache } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Activity, AppUser } from "@/types/database";

/**
 * Leitura cacheada de atividades/usuários por departamento. Todo mundo do
 * mesmo departamento vê exatamente o mesmo dado (RLS só filtra por
 * department_id, não por usuário), então cachear por departamento é seguro
 * e é isso que faz trocar de menu parecer instantâneo em vez de esperar
 * ~1-2s pela ida ao Supabase toda vez.
 *
 * unstable_cache não permite usar cookies()/headers() dentro da função
 * cacheada — por isso aqui é service-role (bypassa RLS) com o filtro por
 * department_id feito manualmente, replicando a mesma regra que a policy
 * `activities_select`/`users_select` aplicaria.
 *
 * Invalidação: toda mutação de atividade chama revalidateTag(`activities-
 * ${departmentId}`) (ver src/lib/actions/activity-actions.ts). Sem isso, a
 * tela ficaria servindo dado desatualizado até o revalidate por tempo.
 */
export async function getCachedActivities(
  departmentId: string
): Promise<{ activities: Activity[]; error: boolean }> {
  const fn = unstable_cache(
    async () => {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("department_id", departmentId)
        .range(0, 9999);
      if (error) {
        console.error("getCachedActivities", error);
        return { activities: [] as Activity[], error: true };
      }
      return { activities: (data ?? []) as Activity[], error: false };
    },
    ["activities", departmentId],
    { tags: [`activities-${departmentId}`], revalidate: 900 }
  );
  return fn();
}

export async function getCachedDepartmentUsers(
  departmentId: string
): Promise<{ users: AppUser[]; error: boolean }> {
  const fn = unstable_cache(
    async () => {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("department_id", departmentId)
        .eq("active", true)
        .order("name");
      if (error) {
        console.error("getCachedDepartmentUsers", error);
        return { users: [] as AppUser[], error: true };
      }
      return { users: (data ?? []) as AppUser[], error: false };
    },
    ["department-users", departmentId],
    { tags: [`users-${departmentId}`], revalidate: 900 }
  );
  return fn();
}
