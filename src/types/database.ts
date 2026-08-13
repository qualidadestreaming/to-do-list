// Tipos manuais espelhando supabase/schema.sql. Sem projeto Supabase ainda
// conectado não dá para gerar isso via `supabase gen types` — quando o projeto
// existir, rode `npx supabase gen types typescript` e substitua este arquivo
// (mantendo os aliases abaixo, usados no resto do app).
//
// IMPORTANTE: os tipos de linha (Department/AppUser/Activity/...) precisam
// ser `type` (object type literal), nunca `interface` — o supabase-js exige
// que cada Row/Insert/Update satisfaça estruturalmente `Record<string,
// unknown>` para inferir corretamente os tipos de `.rpc()`/`.from()`, e
// interfaces declaradas com `interface` não recebem a assinatura de índice
// implícita que esse check precisa (viram `never` silenciosamente).

export type UserRole = "colaborador" | "gestor";
export type ActivityStatus = "ready" | "on_going" | "closed";
export type ActivityPerformance = "on_time" | "late" | null;

export type Department = {
  id: string;
  name: string;
  slug: string;
  manager_user_id: string | null;
  created_at: string;
};

export type AppUser = {
  id: string;
  department_id: string;
  name: string;
  role: UserRole;
  active: boolean;
  created_at: string;
};

export type Activity = {
  id: string;
  department_id: string;
  owner_user_id: string;
  title: string;
  start_date: string;
  due_date: string | null;
  gravidade: number;
  urgencia: number;
  tendencia: number;
  priority: number;
  status: ActivityStatus;
  completed_date: string | null;
  performance: ActivityPerformance;
  created_at: string;
  updated_at: string;
};

export type ActivityFollowUp = {
  id: string;
  activity_id: string;
  author_user_id: string | null;
  note: string;
  created_at: string;
};

export interface Database {
  public: {
    Views: Record<string, never>;
    Functions: {
      list_departments_for_login: {
        Args: Record<string, never>;
        Returns: { slug: string; name: string }[];
      };
      login_department: {
        Args: { p_slug: string; p_password: string };
        Returns: { department_id: string; department_name: string }[];
      };
      list_department_users: {
        Args: { p_department_id: string };
        Returns: { user_id: string; user_name: string; user_role: UserRole }[];
      };
      set_department_password: {
        Args: { p_department_id: string; p_new_password: string };
        Returns: undefined;
      };
      create_department: {
        Args: { p_name: string; p_slug: string; p_password: string; p_manager_name: string };
        Returns: { department_id: string; department_name: string }[];
      };
    };
    Tables: {
      departments: {
        Row: Department;
        Insert: Partial<Department> & { name: string; slug: string; password_hash: string };
        Update: Partial<Department>;
        Relationships: [];
      };
      users: {
        Row: AppUser;
        Insert: Partial<AppUser> & { department_id: string; name: string };
        Update: Partial<AppUser>;
        Relationships: [];
      };
      activities: {
        Row: Activity;
        Insert: Partial<Activity> & {
          department_id: string;
          owner_user_id: string;
          title: string;
          gravidade: number;
          urgencia: number;
          tendencia: number;
        };
        Update: Partial<Activity>;
        Relationships: [];
      };
      activity_follow_ups: {
        Row: ActivityFollowUp;
        Insert: Partial<ActivityFollowUp> & { activity_id: string; note: string };
        Update: Partial<ActivityFollowUp>;
        Relationships: [];
      };
    };
  };
}
