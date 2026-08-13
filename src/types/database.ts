// Tipos manuais espelhando supabase/schema.sql. Sem projeto Supabase ainda
// conectado não dá para gerar isso via `supabase gen types` — quando o projeto
// existir, rode `npx supabase gen types typescript` e substitua este arquivo
// (mantendo os aliases abaixo, usados no resto do app).

export type UserRole = "colaborador" | "gestor";
export type ActivityStatus = "ready" | "on_going" | "closed";
export type ActivityPerformance = "on_time" | "late" | null;

export interface Department {
  id: string;
  name: string;
  slug: string;
  manager_user_id: string | null;
  created_at: string;
}

export interface AppUser {
  id: string;
  department_id: string;
  name: string;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface Activity {
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
}

export interface ActivityFollowUp {
  id: string;
  activity_id: string;
  author_user_id: string | null;
  note: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: Department;
        Insert: Partial<Department> & { name: string; slug: string; password_hash: string };
        Update: Partial<Department>;
      };
      users: {
        Row: AppUser;
        Insert: Partial<AppUser> & { department_id: string; name: string };
        Update: Partial<AppUser>;
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
      };
      activity_follow_ups: {
        Row: ActivityFollowUp;
        Insert: Partial<ActivityFollowUp> & { activity_id: string; note: string };
        Update: Partial<ActivityFollowUp>;
      };
    };
  };
}
