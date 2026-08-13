-- =============================================================================
-- TDL Multilaser — schema "fresh install"
-- Cole este arquivo inteiro no SQL Editor do Supabase (projeto novo, banco vazio).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. EXTENSÕES
-- -----------------------------------------------------------------------------
create extension if not exists pgcrypto; -- crypt()/gen_salt() para hash de senha de departamento

-- -----------------------------------------------------------------------------
-- 1. TABELAS
-- -----------------------------------------------------------------------------

create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  password_hash text not null,
  manager_user_id uuid, -- FK adicionada depois de criar users (referência circular)
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  name text not null,
  role text not null default 'colaborador' check (role in ('colaborador', 'gestor')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table departments
  add constraint departments_manager_user_id_fkey
  foreign key (manager_user_id) references users(id) on delete set null;

create table activities (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  owner_user_id uuid not null references users(id) on delete restrict,
  title text not null check (char_length(btrim(title)) > 0),
  start_date date not null default current_date,
  due_date date,
  gravidade smallint not null check (gravidade between 1 and 5),
  urgencia smallint not null check (urgencia between 1 and 5),
  tendencia smallint not null check (tendencia between 1 and 5),
  -- Prioridade GUT = gravidade × urgência × tendência (1–125), sempre recalculada
  -- pelo banco — nunca confiar em valor vindo do cliente/planilha antiga.
  priority smallint generated always as (gravidade * urgencia * tendencia) stored,
  status text not null default 'ready' check (status in ('ready', 'on_going', 'closed')),
  completed_date date,
  -- "Realizado" só pode existir quando a atividade está fechada, e é obrigatório
  -- quando ela está fechada.
  constraint activities_completed_date_matches_status check (
    (status = 'closed' and completed_date is not null)
    or (status <> 'closed' and completed_date is null)
  ),
  constraint activities_completed_date_not_before_start check (
    completed_date is null or completed_date >= start_date
  ),
  constraint activities_due_date_not_before_start check (
    due_date is null or due_date >= start_date
  ),
  -- Performance só existe para atividades fechadas: concluída dentro do prazo
  -- (ou sem prazo definido) vs. concluída com atraso.
  performance text generated always as (
    case
      when status <> 'closed' or completed_date is null then null
      when due_date is null then 'on_time'
      when completed_date <= due_date then 'on_time'
      else 'late'
    end
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Histórico de follow-up: cada atualização vira uma linha nova, timestampada e
-- com autor — em vez de um campo único que se sobrescreve (pedido explícito).
create table activity_follow_ups (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  author_user_id uuid references users(id) on delete set null,
  note text not null check (char_length(btrim(note)) > 0),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 2. ÍNDICES
-- -----------------------------------------------------------------------------
create index users_department_id_idx on users(department_id);
create index activities_department_id_idx on activities(department_id);
create index activities_owner_user_id_idx on activities(owner_user_id);
create index activities_status_idx on activities(status);
create index activities_due_date_idx on activities(due_date);
create index activity_follow_ups_activity_id_idx on activity_follow_ups(activity_id);

-- -----------------------------------------------------------------------------
-- 3. updated_at automático
-- -----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger activities_set_updated_at
  before update on activities
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. SESSÃO / AUTENTICAÇÃO POR DEPARTAMENTO
-- -----------------------------------------------------------------------------
-- Não há Supabase Auth por pessoa. O app assina um JWT próprio (com o JWT
-- secret do projeto) contendo claims { department_id, user_id, role,
-- role: 'authenticated' } e o usa como Authorization: Bearer nas chamadas ao
-- Supabase. auth.jwt() (helper nativo do Supabase) decodifica esse token
-- normalmente — funciona porque o PostgREST só verifica a assinatura, sem se
-- importar se o token veio do GoTrue ou foi assinado manualmente pelo backend.
create or replace function current_department_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'department_id', '')::uuid
$$;

create or replace function current_session_user_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'user_id', '')::uuid
$$;

create or replace function current_session_role()
returns text
language sql
stable
as $$
  select auth.jwt() ->> 'user_role'
$$;

create or replace function is_gestor()
returns boolean
language sql
stable
as $$
  select current_session_role() = 'gestor'
$$;

-- -----------------------------------------------------------------------------
-- 5. LOGIN (bypassa RLS de propósito — é o único caminho antes de existir sessão)
-- -----------------------------------------------------------------------------
create or replace function login_department(p_slug text, p_password text)
returns table (department_id uuid, department_name text)
language sql
security definer
set search_path = public
as $$
  select id, name
  from departments
  where slug = p_slug
    and password_hash = crypt(p_password, password_hash)
$$;

-- Depois de validar a senha do departamento (login_department), o app lista
-- os colaboradores ativos daquele departamento para a pessoa escolher "quem
-- sou eu" (não é autenticação individual, só identificação de autoria).
create or replace function list_department_users(p_department_id uuid)
returns table (user_id uuid, user_name text, user_role text)
language sql
security definer
set search_path = public
as $$
  select id, name, role
  from users
  where department_id = p_department_id and active = true
  order by name
$$;

create or replace function set_department_password(p_department_id uuid, p_new_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_gestor() or current_department_id() <> p_department_id then
    raise exception 'FORBIDDEN';
  end if;
  update departments
  set password_hash = crypt(p_new_password, gen_salt('bf'))
  where id = p_department_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
alter table departments enable row level security;
alter table users enable row level security;
alter table activities enable row level security;
alter table activity_follow_ups enable row level security;

-- departments: só enxerga a própria empresa/depto da sessão; edição (nome)
-- reservada ao gestor. Não há policy de insert/delete para o client (criação
-- de departamento é operação administrativa, feita com a service_role key).
create policy departments_select on departments
  for select using (id = current_department_id());

create policy departments_update on departments
  for update using (id = current_department_id() and is_gestor());

-- users: qualquer pessoa logada no departamento vê todos os colegas (igual à
-- planilha, onde cada aba era visível a todos). Gerenciar contas (criar,
-- editar, desativar) é exclusivo do gestor.
create policy users_select on users
  for select using (department_id = current_department_id());

create policy users_insert on users
  for insert with check (department_id = current_department_id() and is_gestor());

create policy users_update on users
  for update using (department_id = current_department_id() and is_gestor());

create policy users_delete on users
  for delete using (department_id = current_department_id() and is_gestor());

-- activities: qualquer pessoa logada no departamento pode ver e mexer nas
-- atividades do próprio departamento (mesmo modelo da planilha compartilhada).
create policy activities_select on activities
  for select using (department_id = current_department_id());

create policy activities_insert on activities
  for insert with check (
    department_id = current_department_id()
    and exists (
      select 1 from users
      where users.id = owner_user_id and users.department_id = current_department_id()
    )
  );

create policy activities_update on activities
  for update using (department_id = current_department_id());

create policy activities_delete on activities
  for delete using (department_id = current_department_id());

-- activity_follow_ups: segue o departamento da atividade-mãe.
create policy activity_follow_ups_select on activity_follow_ups
  for select using (
    exists (
      select 1 from activities
      where activities.id = activity_follow_ups.activity_id
        and activities.department_id = current_department_id()
    )
  );

create policy activity_follow_ups_insert on activity_follow_ups
  for insert with check (
    exists (
      select 1 from activities
      where activities.id = activity_follow_ups.activity_id
        and activities.department_id = current_department_id()
    )
  );

-- -----------------------------------------------------------------------------
-- FIM
-- -----------------------------------------------------------------------------
