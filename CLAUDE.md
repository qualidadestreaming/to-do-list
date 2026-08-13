# TDL Multilaser — Documento de continuidade para o Claude

> Leia isto primeiro se a conversa começar com algo como "continue o projeto TDL Multilaser". Este arquivo é para o Claude, não para o usuário.

## O que é o projeto

TDL Multilaser é a substituição de uma planilha Excel ("To Do List") usada hoje pelo time de **Qualidade** do Grupo Multilaser para gerenciar atividades prioritárias, com Matriz GUT (Gravidade × Urgência × Tendência). Vira um sistema web multi-departamento: hoje só existe o departamento Qualidade, mas o produto é desenhado para receber outros departamentos no futuro (Fase 6).

Construído em fases, com aval do usuário ao final de cada uma — não pule fase nem antecipe trabalho de uma fase futura sem confirmar antes.

## Stack

- **Frontend**: Next.js 16 (App Router, TypeScript) — satisfaz o pedido de "14+"
- **UI**: Tailwind CSS v4 + shadcn/ui (base Radix, preset Nova)
- **Gráficos**: Recharts (Fase 3)
- **Backend/DB**: Supabase (Postgres + RLS) — projeto ainda não criado, ver "Pendências" abaixo
- **Deploy**: Vercel (ainda não conectado)
- **i18n**: next-intl (instalado, wiring completo fica para a Fase 4)
- **Tema claro/escuro**: next-themes (instalado, wiring fica para a Fase 1)
- **Formulários**: react-hook-form + zod (o componente `form` do shadcn/ui não está disponível nesta versão do CLI para este stack — formulários são montados manualmente com esses dois pacotes)

Repositório GitHub: `https://github.com/qualidadestreaming/to-do-list` (remoto `origin` já configurado localmente; nenhum push foi feito ainda — só com confirmação explícita do usuário, como em todos os projetos dele).

## Identidade visual (padrão oficial Grupo Multilaser)

Tokens em `src/app/globals.css`, sempre usados via classes Tailwind (`bg-primary`, `text-brand-purple`, etc.), nunca hex direto no JSX:

- `--brand-purple: #5000BF` / `--brand-purple-dark: #3A008C` / `--brand-blue: #004EDB` / `--brand-blue-light: #4691FF` — fixos, **não mudam entre tema claro/escuro** (identidade da marca).
- `--primary` = roxo (claro) / azul claro (escuro, para manter contraste sobre fundo escuro).
- `--card` = `#F2F2F5` no tema claro (fundo neutro de cartão pedido).
- Sidebar/topbar usam os tokens `--sidebar-*`, fixados em roxo (`--brand-purple` claro / roxo bem escuro no tema escuro) — é onde a marca aparece como fundo dominante, de propósito (o resto da UI é neutro, roxo/azul só como destaque).
- Faixas de criticidade GUT: `--gut-low/medium/high` (+ `-foreground`) — verde/amarelo/vermelho, com um par claro/escuro cada.
- Status de atividade: `--status-ready/ongoing/closed/overdue` (+ `-foreground`) — cores de badge, ver seção "Máquina de estados" abaixo. `overdue` é usado só como indicador visual (nunca é um valor de `status` no banco).
- Fonte: Arial via pilha de fontes do sistema (`--font-sans` em `:root`), **não** via `next/font/google` — Google Fonts não hospeda Arial. `next/font` não se aplica aqui; é uma decisão consciente, documentada para não ser "corrigida" por engano numa sessão futura.

## Modelo de dados (`supabase/schema.sql`)

Fonte da verdade "fresh install" — cole o arquivo inteiro no SQL Editor de um projeto Supabase novo. Ainda não existe projeto Supabase conectado (ver "Pendências").

- **`departments`**: `id, name, slug, password_hash, manager_user_id (nullable), created_at`. `manager_user_id` referencia `users(id)` — FK adicionada só depois de criar `users` (referência circular). Fica `null` até o usuário definir quem é o gestor da Qualidade (pendência aberta, ver abaixo).
- **`users`**: `id, department_id, name, role ('colaborador'|'gestor'), active, created_at`. Sem login/senha individual.
- **`activities`**: campos da planilha (ver tabela de mapeamento no prompt original do usuário). `priority` e `performance` são **colunas geradas** pelo Postgres (`generated always as ... stored`), nunca calculadas/confiadas no client:
  - `priority = gravidade * urgencia * tendencia` (1–125).
  - `performance`: `null` enquanto não fechada; `'on_time'` se fechada sem prazo ou `completed_date <= due_date`; `'late'` caso contrário.
  - Constraint garante `completed_date` obrigatório quando `status = 'closed'` e proibido nos outros status.
  - "Atrasado" **não é um 4º status** — é um badge visual computado em runtime (`due_date < hoje AND status <> 'closed'`), decisão explícita do prompt original para manter a máquina de estados simples.
- **`activity_follow_ups`**: tabela separada (`activity_id, author_user_id, note, created_at`) em vez de um campo único sobrescrito — histórico timestampado, pedido explícito do usuário na seção 1.3 do prompt original.

### Máquina de estados de `status`

`ready` → `on_going` → `closed`. Regra clara do prompt original: **`ready` é o status inicial automático só quando a atividade nasce sem `due_date`.** O que acontece quando a atividade nasce **com** `due_date` definida (vai direto para `on_going`, ou também nasce `ready` até alguém "começar a trabalhar nela" manualmente?) **não está definido no prompt original — é uma decisão em aberto para confirmar com o usuário antes de implementar o formulário de criação na Fase 2.** O schema não trava essa decisão (o `default` da coluna é `'ready'`, mas a Fase 2 decide o valor real no insert).

## Autenticação e RLS — como funciona

Sem Supabase Auth por pessoa. Fluxo desenhado (mecânica de banco já implementada no schema; wiring de login/sessão é trabalho da **Fase 1**):

1. Pessoa escolhe o departamento e digita a senha → `login_department(slug, password)` (RPC `security definer`, único ponto que lê `password_hash`, via `crypt()`/pgcrypto). Bypassa RLS de propósito — é o único caminho que pode existir antes de uma sessão.
2. App lista os colaboradores ativos do departamento (`list_department_users`) para a pessoa escolher **quem ela é** — necessário porque a senha é só do departamento, mas `owner_user_id`/autoria de follow-up e o badge de "gestor" (menu de admin) precisam saber qual pessoa física está usando o navegador. **Isso é uma inferência da minha parte a partir do prompt, não uma instrução explícita — confirmar com o usuário na Fase 1 antes de construir a tela de login.**
3. Servidor assina um JWT próprio (`jose`, com `SUPABASE_JWT_SECRET` do projeto) contendo `{ department_id, user_id, user_role, role: 'authenticated' }` e grava num cookie `httpOnly` de longa duração.
4. Todo client Supabase do lado servidor (`createServerClient(token)` em `src/lib/supabase/server.ts`) manda esse JWT como `Authorization: Bearer`. O Postgres decodifica via `auth.jwt()` (helper nativo do Supabase — não se importa se o token veio do GoTrue ou foi assinado manualmente, só verifica a assinatura contra o JWT secret do projeto).
5. RLS (`current_department_id()`, `current_session_role()`, `is_gestor()` em `schema.sql`) filtra toda query por esse `department_id` — **nunca confiar só na UI para esconder dado de outro departamento**, exatamente como pedido.

Client Supabase do lado navegador (`src/lib/supabase/client.ts`) usa só a anon key — não injeta o JWT de sessão sozinho; isso é trabalho da Fase 1 (ler o cookie e passar para as chamadas, provavelmente via Route Handler/Server Action em vez de query direta do browser, dado que o cookie é `httpOnly`).

## Pendências / decisões em aberto (não inventar, perguntar antes)

1. **Gestor do departamento Qualidade**: usuário disse "a definir" — `manager_user_id` fica `null` até ele decidir. Não é bloqueio para nenhuma fase até a Fase 5 (seed).
2. **Projeto Supabase**: ainda não existe. Usuário vai criar e passar as chaves (`.env.local.example` documenta o que é preciso). Sem isso, nada de Fase 1 em diante roda de verdade contra um banco real.
3. **Identificação "quem sou eu" após login de departamento**: ver seção de autenticação acima — inferência, não instrução explícita. Confirmar antes da Fase 1.
4. **Status inicial quando a atividade já nasce com `due_date`**: ver "Máquina de estados" acima. Confirmar antes da Fase 2.
5. Repositório GitHub já existe (`qualidadestreaming/to-do-list`), remoto configurado — **nenhum push foi feito ainda**, só com confirmação explícita (regra permanente de todos os projetos deste usuário, não só este).

## Fases (ver prompt original do usuário para a lista completa)

- [x] **Fase 0 — Fundação**: scaffold Next.js/Tailwind/shadcn, dependências (Supabase, Recharts, next-intl, next-themes, react-hook-form/zod), paleta Multilaser em `globals.css`, `supabase/schema.sql` com RLS básico, `.env.local.example`, este `CLAUDE.md`, remoto Git configurado.
- [ ] Fase 1 — Autenticação e casca do app
- [ ] Fase 2 — Atividades e Matriz GUT
- [ ] Fase 3 — Dashboard
- [ ] Fase 4 — i18n e polish visual
- [ ] Fase 5 — Migração de dados (planilha `TDL_QA_MULTI_2026`)
- [ ] Fase 6 — Administração e expansão

## Onde procurar o quê

- `supabase/schema.sql` — schema completo + RLS + funções de login. Toda regra de negócio sensível (cálculo de prioridade, performance, verificação de senha) vive aqui como função/coluna gerada do Postgres, não só em JS.
- `src/app/globals.css` — paleta Multilaser, tokens de tema claro/escuro, faixas GUT, cores de status.
- `src/lib/supabase/client.ts` / `server.ts` — factories de client Supabase (browser anon / server com JWT de sessão / service role).
- `src/types/database.ts` — tipos manuais espelhando o schema (regenerar via `supabase gen types` assim que o projeto existir).
- `.env.local.example` — todas as variáveis de ambiente necessárias, com onde encontrar cada uma no painel do Supabase.
