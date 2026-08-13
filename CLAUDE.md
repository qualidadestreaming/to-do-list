# TDL Multilaser — Documento de continuidade para o Claude

> Leia isto primeiro se a conversa começar com algo como "continue o projeto TDL Multilaser". Este arquivo é para o Claude, não para o usuário.

## O que é o projeto

TDL Multilaser é a substituição de uma planilha Excel ("To Do List") usada hoje pelo time de **Qualidade** do Grupo Multilaser para gerenciar atividades prioritárias, com Matriz GUT (Gravidade × Urgência × Tendência). Vira um sistema web multi-departamento: hoje só existe o departamento Qualidade, mas o produto é desenhado para receber outros departamentos no futuro (Fase 6).

Construído em fases. O usuário pediu explicitamente, numa rodada (2026-08-13), para eu avançar por várias fases seguidas sem parar para aprovação a cada uma — decisões ambíguas encontradas no caminho foram registradas aqui (seção "Pendências") em vez de travar o trabalho. Isso não é a regra padrão de trabalho dele (normalmente ele aprova fase a fase) — só valeu para essa rodada específica; ao retomar o projeto, resuma o que foi feito e pergunte antes de seguir para fases NOVAS que ainda não tinham sido abertas nessa rodada.

## Stack

- **Frontend**: Next.js 16 (App Router, TypeScript) — satisfaz o pedido de "14+"
- **UI**: Tailwind CSS v4 + shadcn/ui (base Radix, preset Nova)
- **Gráficos**: Recharts
- **Backend/DB**: Supabase (Postgres + RLS) — projeto ainda não criado, ver "Pendências" abaixo
- **Deploy**: Vercel (ainda não conectado)
- **i18n**: next-intl, **sem roteamento por locale** (sem segmento `[locale]` na URL) — ver seção própria abaixo
- **Tema claro/escuro**: next-themes, toggle na topbar, persistido em `localStorage` (por navegador/dispositivo)
- **Formulários**: react-hook-form + zod (o componente `form` do shadcn/ui não está disponível nesta versão do CLI para este stack — formulários são montados manualmente com esses dois pacotes, usando `Controller` para os campos `Select`)

Repositório GitHub: `https://github.com/qualidadestreaming/to-do-list` (remoto `origin` já configurado localmente). **Push só com confirmação explícita do usuário** (regra permanente). Ele tentou uma vez me dar um Personal Access Token da própria conta (`israeloliveira12`), mas essa conta não tem permissão de escrita no repo (403) — ele optou por "ficar só local por enquanto" em vez de resolver o acesso agora. Enquanto isso não for resolvido, os commits ficam empilhados localmente — não tente `push` de novo sem ele pedir/resolver o acesso primeiro.

## Identidade visual (padrão oficial Grupo Multilaser)

Tokens em `src/app/globals.css`, sempre usados via classes Tailwind (`bg-primary`, `text-brand-purple`, etc.), nunca hex direto no JSX:

- `--brand-purple: #5000BF` / `--brand-purple-dark: #3A008C` / `--brand-blue: #004EDB` / `--brand-blue-light: #4691FF` — fixos, **não mudam entre tema claro/escuro** (identidade da marca).
- `--primary` = roxo (claro) / azul claro (escuro, para manter contraste sobre fundo escuro).
- `--card` = `#F2F2F5` no tema claro (fundo neutro de cartão pedido).
- Sidebar/topbar usam os tokens `--sidebar-*`, fixados em roxo (`--brand-purple` claro / roxo bem escuro no tema escuro) — é onde a marca aparece como fundo dominante, de propósito (o resto da UI é neutro, roxo/azul só como destaque).
- Faixas de criticidade GUT: `--gut-low/medium/high` (+ `-foreground`) — verde/amarelo/vermelho, com um par claro/escuro cada. As versões `-foreground` (mais saturadas) são usadas como preenchimento sólido nos gráficos do Dashboard; as versões base (pastel) são usadas como fundo de badge.
- Status de atividade: `--status-ready/ongoing/closed/overdue` (+ `-foreground`) — cores de badge, ver seção "Máquina de estados" abaixo. `overdue` é usado só como indicador visual (nunca é um valor de `status` no banco).
- Fonte: Arial via pilha de fontes do sistema (`--font-sans` em `:root`), **não** via `next/font/google` — Google Fonts não hospeda Arial. `next/font` não se aplica aqui; é uma decisão consciente, documentada para não ser "corrigida" por engano numa sessão futura.
- **Não há logo real do Grupo Multilaser em nenhum arquivo de imagem** — o "logo" hoje é um chip de texto ("Multilaser" em negrito sobre fundo roxo/branco translúcido) na topbar (`src/components/shell/topbar.tsx` e `public-topbar.tsx`). Se o usuário fornecer um arquivo de logo de verdade (SVG/PNG), trocar esses dois componentes para usar `next/image`/`<img>` no lugar do chip de texto.

## Modelo de dados (`supabase/schema.sql`)

Fonte da verdade "fresh install" — cole o arquivo inteiro no SQL Editor de um projeto Supabase novo. **Ainda não existe projeto Supabase conectado** (ver "Pendências") — `.env.local` tem valores placeholder só para o `next build`/`next dev` não quebrar; nenhuma tela foi testada contra dados reais ainda.

- **`departments`**: `id, name, slug, password_hash, manager_user_id (nullable), created_at`. `manager_user_id` referencia `users(id)` — FK adicionada só depois de criar `users` (referência circular). Fica `null` até o usuário definir quem é o gestor da Qualidade (pendência aberta, ver abaixo).
- **`users`**: `id, department_id, name, role ('colaborador'|'gestor'), active, created_at`. Sem login/senha individual.
- **`activities`**: campos da planilha. `priority` e `performance` são **colunas geradas** pelo Postgres (`generated always as ... stored`), nunca calculadas/confiadas no client:
  - `priority = gravidade * urgencia * tendencia` (1–125).
  - `performance`: `null` enquanto não fechada; `'on_time'` se fechada sem prazo ou `completed_date <= due_date`; `'late'` caso contrário.
  - Constraint garante `completed_date` obrigatório quando `status = 'closed'` e proibido nos outros status.
  - "Atrasado" **não é um 4º status** — é um badge visual computado em runtime (`due_date < hoje AND status <> 'closed'`, `src/lib/activity-status.ts`), decisão explícita do prompt original para manter a máquina de estados simples.
- **`activity_follow_ups`**: tabela separada (`activity_id, author_user_id, note, created_at`) em vez de um campo único sobrescrito — histórico timestampado, pedido explícito do usuário.

### Máquina de estados de `status` (CONFIRMADO com o usuário)

`ready` → `on_going` → `closed`. **Toda atividade sempre nasce `ready`, mesmo já tendo `due_date` definida** — o usuário confirmou explicitamente essa decisão (não é condicional ao prazo). A transição `ready → on_going` é manual, via botão "Iniciar" no detalhe da atividade (`startActivity()`, `src/lib/actions/activity-actions.ts`) — só permitida a partir de `ready`. `closeActivity()` aceita fechar tanto de `ready` quanto de `on_going` (uma atividade trivial pode ir direto para concluída sem passar por "iniciar"). Existe também `reopenActivity()` (closed → on_going, limpa `completed_date`) — não foi pedido explicitamente no prompt original, mas foi adicionado como complemento óbvio de "concluir" (evita ficar sem solução para um clique errado); se o usuário achar desnecessário, é só remover o botão "Reabrir" do `ActivityDetailDialog`.

## Autenticação e RLS — como funciona (IMPLEMENTADO, Fase 1)

Sem Supabase Auth por pessoa.

1. Pessoa escolhe o departamento (dropdown, populado por `list_departments_for_login()`, RPC pública sem senha) e digita a senha → `verifyDepartmentPassword()` (`src/lib/actions/auth-actions.ts`) chama `login_department(slug, password)` (RPC `security definer`, único ponto que lê `password_hash`, via `crypt()`/pgcrypto).
2. Servidor grava um cookie **`tdl_pending`** (JWT próprio, 10 min de validade) provando que a senha já foi validada, e devolve ao client a lista de colaboradores ativos do departamento (`list_department_users`) para a pessoa escolher **quem ela é**. **Isso é uma inferência da minha parte a partir do prompt** (necessária porque `owner_user_id`/autoria de follow-up e o badge de "gestor" — que libera o menu Administração — precisam saber qual pessoa física está no navegador) — nunca foi rejeitada pelo usuário, mas também nunca foi confirmada explicitamente. Se ele reclamar desse passo extra no login, é o primeiro lugar a rever.
3. Ao escolher o usuário, `completeLogin()` **revalida no servidor** (nunca confia no que o client mandou) que esse `userId` pertence de fato ao departamento do cookie `tdl_pending`, aí sim assina o cookie de sessão de verdade **`tdl_session`** (`jose`, `SUPABASE_JWT_SECRET`, 180 dias, `httpOnly`) contendo `{ department_id, user_id, user_role, role: 'authenticated' }`, e apaga o `tdl_pending`.
4. Todo client Supabase do lado servidor (`createSessionClient()` em `src/lib/supabase/server.ts`) injeta esse JWT como `Authorization: Bearer`. O Postgres decodifica via `auth.jwt()` (helper nativo do Supabase). RLS (`current_department_id()`, `current_session_role()`, `is_gestor()` em `schema.sql`) filtra toda query por `department_id` — nunca só a UI escondendo dado.
5. **`src/proxy.ts`** (convenção do Next 16 — `middleware.ts` foi renomeado via `npx @next/codemod middleware-to-proxy`, não confundir com um middleware "de fato deprecated": é só o novo nome do mesmo mecanismo) protege `/app/**` (redireciona pra `/login` sem sessão válida) e redireciona `/login` → `/app/dashboard` se já autenticado. Verifica o JWT direto (sem chamar `session.ts`, que usa `next/headers` incompatível com Edge Runtime do proxy).
6. Client Supabase do navegador (`src/lib/supabase/client.ts`) só existe com a anon key, sem o JWT de sessão — **não é usado em lugar nenhum ainda**, porque toda leitura/escrita de dado protegido por RLS precisa passar por Server Component ou Server Action (o cookie de sessão é `httpOnly`, inacessível ao JS do browser). Se um dia precisar de uma chamada Supabase direto do client (ex: Realtime), vai precisar de um endpoint que troque o cookie por um token utilizável pelo browser client — não implementado, não foi necessário até agora.

## i18n — troca de idioma em tempo real (IMPLEMENTADO, Fase 4)

Requisito do prompt original: troca de idioma **sem reload forçado**. Isso descarta o padrão usual do next-intl (`[locale]` na URL + middleware de roteamento, que exige navegação). Arquitetura escolhida:

- `src/lib/i18n/config.ts`: `LOCALES = ['pt','en','zh']`, `DEFAULT_LOCALE='pt'`, `loadMessages(locale)` (import dinâmico do JSON).
- `src/lib/i18n/locale-context.tsx` (`"use client"`): `<LocaleProvider>` guarda `locale`/`messages` em `useState`, e envolve os filhos com `<NextIntlClientProvider locale={locale} messages={messages}>` — é isso que faz `useTranslations()` funcionar em qualquer client component da árvore. `setLocale(novoLocale)`: grava um cookie **não-httpOnly** `tdl_locale` (`document.cookie`, só preferência de UI, não é segredo) + `import()` dinâmico do JSON do novo idioma + atualiza o state — **tudo client-side, sem `router.refresh()`/navegação**, por isso a troca é instantânea.
- `src/app/layout.tsx` (Server Component): lê o cookie `tdl_locale` no primeiro request, carrega o JSON correspondente no servidor, e passa como `initialLocale`/`initialMessages` pro `<LocaleProvider>` — evita flash de idioma errado no primeiro paint.
- **Todo texto traduzível vive em componentes Client** (`"use client"`), nunca em Server Components — `next-intl/server` (`getTranslations`) não foi usado de propósito, pra não duplicar o mecanismo de tradução em dois sistemas paralelos. Nas 2 páginas que são Server Components (`login/page.tsx`, e as de `/app/*`), todo o JSX visível foi movido para um componente client filho (ex: `LoginScreen`) — a página Server só busca dado/valida sessão.
- **Erros vindos de Server Actions são traduzidos no client, não no servidor**: toda action (`auth-actions.ts`, `activity-actions.ts`) retorna um `errorCode` (string enum, ex: `"invalid_credentials"`), nunca uma mensagem pronta. O client mapeia o código pra texto via `useTranslations()` (ver `src/lib/i18n/activity-errors.ts` para atividades, e o `translateError()` inline em `login-form.tsx` para auth). **Nunca volte a colocar string literal em português num `return { ok:false, error: "..." }` de uma action** — isso quebra a tradução pros outros 2 idiomas silenciosamente.
- **Escopo cortado por tempo**: as mensagens de validação client-side do `zod` (`src/lib/validation/activity.ts`, ex: `"Descreva a atividade."`) **continuam fixas em português**, independente do idioma escolhido. Resolver isso direito exigiria schemas por idioma (ou um mapa de tradução de `issue.code`/`path` pra chave i18n) — não implementado. Se o usuário notar/reclamar, é o próximo item óbvio de polish.
- Arquivos de mensagem: `src/lib/i18n/messages/{pt,en,zh}.json` — pt.json é a fonte "canônica" (escrita primeiro), en/zh são traduções fiéis da mesma estrutura de chaves. **Sempre que adicionar uma chave nova, adicione nos 3 arquivos** — não há fallback automático (`useTranslations` do next-intl lança erro em dev se a chave não existir no idioma ativo).
- Testado manualmente no preview: troca PT→EN sem navegação (confirmado por URL/cookie/DOM inalterados exceto o texto), tema claro/escuro com contraste correto nos dois.

## Pendências / decisões em aberto (não inventar, perguntar antes)

1. **Gestor do departamento Qualidade**: usuário disse "a definir" — `manager_user_id` fica `null` até ele decidir. Bloqueia só a Fase 5 (seed).
2. **Projeto Supabase real ainda não existe.** Usuário vai criar e passar as chaves (`.env.local.example` documenta o que é preciso). **Nenhuma tela foi testada contra dado real** — toda validação até agora foi `npm run build` (TypeScript limpo) + inspeção manual da lógica + smoke test das telas públicas (login) no preview. Isso é uma lacuna real, não só formalidade: bugs de RLS/integração só aparecem com banco de verdade.
3. **Identificação "quem sou eu" após login de departamento** (Fase 1): inferência minha, nunca confirmada explicitamente — ver seção de autenticação acima.
4. **Reabrir atividade (`reopenActivity`)**: adicionado por mim como complemento natural de "concluir", não pedido explicitamente — ver seção "Máquina de estados".
5. **Repositório GitHub**: existe, remoto configurado, mas a conta `israeloliveira12` não tem permissão de push (testado, 403). Usuário optou por não resolver agora — **não tente `git push` sem ele pedir de novo**, os commits ficam só locais até lá.
6. **Mensagens de validação do zod não traduzem** (ver seção i18n acima) — gap conhecido, não implementado por escopo/tempo.
7. **Sem teste end-to-end de nenhuma tela que depende de dado** (Atividades, Dashboard) — só a tela de Login foi de fato clicada no preview (sem Supabase real, então só a parte estática/i18n/tema foi validada ali também).

## Fases

- [x] **Fase 0 — Fundação**: scaffold Next.js/Tailwind/shadcn, dependências, paleta Multilaser, `supabase/schema.sql` com RLS básico, `.env.local.example`, `CLAUDE.md`, remoto Git.
- [x] **Fase 1 — Autenticação e casca do app**: login em 2 passos (departamento+senha → escolher usuário), sessão JWT `httpOnly` de 180 dias, `src/proxy.ts` protegendo `/app/**`, Topbar (tema/idioma/logout), nav Dashboard/Atividades/Administração (esta última só pra `gestor`).
- [x] **Fase 2 — Atividades e Matriz GUT**: CRUD completo (`src/lib/actions/activity-actions.ts`), cálculo de prioridade GUT ao vivo no formulário, badges de criticidade/status, filtros/ordenação, histórico de follow-up timestampado, transições de status (iniciar/concluir/reabrir/excluir).
- [x] **Fase 3 — Dashboard**: KPIs, gráfico de distribuição por status (donut), gráfico por faixa GUT (barras), ranking de performance por responsável (barras empilhadas), filtros por responsável/status/prioridade/período.
- [x] **Fase 4 — i18n e polish visual**: PT/EN/ZH completos nas telas construídas até agora (Login, Topbar/Nav, Atividades, Dashboard), troca em tempo real sem reload (confirmado no preview), tema claro/escuro testado (contraste ok nos dois), responsividade sem overflow horizontal testada em mobile (375px) na tela de Login.
- [x] **Fase 5 — Migração de dados**: script `scripts/migrate-spreadsheet.mjs` escrito e testado em dry-run contra o arquivo real do usuário. Ver seção própria abaixo — **ainda não rodado com `--commit`** (precisa do Supabase real existir e do departamento/usuários já seedados primeiro).
- [ ] **Fase 6 — Administração e expansão**: painel de gestor (`/app/admin`) ainda é um stub estático.

## Fase 5 — Script de migração (`scripts/migrate-spreadsheet.mjs`)

Lê a planilha original, classifica cada linha (finalizada / ativa / ambígua), recalcula a prioridade GUT, converte datas seriais do Excel, casa o "dono" pelo NOME DA ABA (mais confiável que a coluna "Dono", que é texto livre — ver achados abaixo), e insere via `service_role` key (bypassa RLS, necessário porque o script não roda com uma sessão de usuário).

**Modo de uso**: `node scripts/migrate-spreadsheet.mjs --file "C:\caminho\TDL QA MULTI 2026.xlsx"` — roda em **dry-run por padrão** (só gera os 2 relatórios CSV em `scripts/migration-output/`, gitignored, nunca escreve no banco); passar `--commit` pra gravar de verdade. Outras opções: `--department <slug>` (default `"qualidade"`), `--status-rule due-date|always-ready` (ver comentário no topo do arquivo — **decisão não confirmada com o usuário**, o default `due-date` é um palpite razoável, não uma instrução dele).

**Pré-requisito que o script não automatiza**: o departamento e os 20 usuários (com nome idêntico ao nome da aba) precisam já existir no Supabase antes de rodar com `--commit` — isso é trabalho da Fase 6 (admin) ou de um insert manual. O script falha rápido e claro se o departamento/algum usuário não existir, em vez de inserir com dado incompleto.

**Testado em dry-run contra o arquivo real do usuário** (`C:\Users\israe\Downloads\TDL QA MULTI 2026.xlsx`, caminho local dele, arquivo não está no repo): **364 atividades prontas para migrar, 2094 já finalizadas na planilha (corretamente ignoradas), 230 em revisão manual** (motivos legítimos: Status/Performance vazios nas duas colunas — 161 casos —, G/U/T realmente em branco na planilha, ou `Início` ilegível — nunca um bug do script inserindo dado errado).

**2 bugs reais encontrados e corrigidos durante o teste em dry-run** (antes de eu considerar o script pronto):
1. **Casamento de coluna por nome exato quebrava em 4 abas** (Adria/Julioney/Natalia/Verônica) porque elas escrevem "Urgencia"/"Tendencia" **sem acento** (as outras 16 abas usam "Urgência"/"Tendência" com acento) — 85 linhas perdiam G/U/T em silêncio (viravam `undefined`, caíam em revisão manual, mas pelo motivo errado). Corrigido comparando nomes de coluna por texto normalizado (sem acento/case), não por igualdade exata — mesma função `normalize()` já usada pra classificar status.
2. A coluna de follow-up também varia: `F´UP` na maioria das abas, mas **"Follow Up"** em pelo menos uma — adicionado como alias reconhecido.

**Achado de qualidade de dado, não um bug do script**: a coluna "Dono" às vezes diverge do nome da aba (ex: aba "Julioney" tem linhas com Dono = "Welington Silveira / Wanderley Uchôa"; aba "Adria" tem linhas com Dono = "Verônica"/"Maria Verônica"). O script **usa o nome da aba como fonte da verdade** (é o sinal estrutural mais confiável, bate exatamente com a lista de seed do prompt original) e só imprime um aviso no console quando isso diverge — não bloqueia nem pula a linha. Se o usuário quiser que essas linhas específicas fossem atribuídas à pessoa citada em "Dono" em vez da aba, é uma revisão manual pós-migração (mover a atividade pro dono certo depois), não algo pra resolver no script.

**`xlsx` (SheetJS)**: **tem 1 vulnerabilidade "high" conhecida no `npm audit`**, mas só é usada como devDependency neste script de migração one-off (nunca em código de produção/browser) — risco aceito.

## A planilha original (`TDL QA MULTI 2026.xlsx`) — achados de estrutura

- **22 abas**: `To do list_Modelo` (template vazio), `tabela` (legenda "Prioridade GUT 1–5 → categoria de exemplo", ex: 1="Parada de linha...", 5="Solicitação COMMEX" — é um guia de referência pra ajudar a PESSOA a decidir a nota de gravidade/urgência ao preencher, **não** é um dado a migrar pra tabela nenhuma; não foi pedido no prompt original, não implementar sem pedido explícito), e **20 abas, uma por colaborador** (Verônica, Natalia, Ana Gemaque, Israel, Queren, AlexandreSS, Carla, Renato, Josiele, Nayara, Rosiane, Victor, Oseas, Anderson, Wilson Rocha, George, Alfredo, Julioney, Wandemberg, Adria) — bate exatamente com a lista de seed do prompt original.
- **A tabela de dados de cada aba de colaborador começa na linha com o cabeçalho `Início | Prazo | Atividade | Gravidade | Urgência | Tendência | Prioridade | Dono | F´UP | Realizado | Status | Performance | Gap`** — a posição dessa linha **varia por aba** (linha 10 em algumas, linha 9 em outras, ex: `Israel`) — o script de importação precisa localizar o header procurando essas colunas, nunca assumir um número de linha fixo. Datas vêm como serial number do Excel (ex: `45751`), não string — precisa converter (`xlsx` já expõe isso via `cellDates:true` na leitura, ou conversão manual do serial).
- **Achado importante e "sujo": o status real de cada linha às vezes está na coluna `Status` (índice 10) e às vezes na coluna `Performance` (índice 11)** — dependendo de quem preencheu a planilha, uma das duas fica vazia e a outra tem o valor. O script precisa checar as DUAS colunas (preferindo a que estiver preenchida) antes de decidir o mapeamento.
- **Valores encontrados nessas 2 colunas, com contagem de ocorrências** (2688 linhas com `Atividade` preenchida, somando as 20 abas):
  - **"Finalizado" (mapeia pra excluir da migração — já concluído)**: `Concluído no tempo` (823), `Good` (357), `Concluido` (105), `Concluído c/ atraso` (77), `Concluído c/ Atraso` (75), `Concluido ` (43, com espaço sobrando), `Finalizado` (16), `Closed` (3).
  - **"Em andamento" (migra como `on_going` ou `ready`, ver regra abaixo)**: `Andamento` (143), `On Going` (58+107 variantes de caixa), `andamentro` (10, typo), `em andamento` (6), `ongoing` (1), `Delayed` (5), `Standby` (3+6), `Standb` (1, typo), `Sem data` (2), célula vazia (961+753 nas duas colunas — provavelmente a maioria dessas linhas tem status só numa das duas colunas, não as duas vazias ao mesmo tempo — o script precisa cruzar).
  - Outliers a tratar como "revisão manual" (log, não falha silenciosa): `Required Date`/`Required date` (5, parece rótulo de cabeçalho vazado pra dentro dos dados por erro de preenchimento), `"."` (1, lixo).
- **Regra de mapeamento pra Fase 5** (a definir/confirmar com o usuário antes de escrever o script, mas o rascunho é): normalizar o texto (lowercase, trim, remover acento) e casar contra 2 listas (finalizado vs. não-finalizado) — qualquer valor não reconhecido cai em "revisão manual" no log, nunca é assumido silenciosamente. Pra quem migrar: `status` vira `on_going` se a linha já tem indício de trabalho em andamento, ou `ready` se realmente não há nada (replicando a mesma regra confirmada pro app: nasce `ready`, mas aqui há uma nuance — dado migrado já "existe há tempo", pode fazer mais sentido semântico entrar direto como `on_going` já que é retroativo, **não decidido ainda, perguntar ao usuário na Fase 5**).
- **Dono**: coluna tem nome completo (ex: "Israel Oliveira"), precisa casar por nome com a lista de `users` seedada — nomes que não baterem exatamente (com ou sem sobrenome) caem em "revisão manual".
- **Prioridade**: sempre recalcular (`gravidade × urgencia × tendencia`), nunca confiar na coluna `Prioridade` da planilha (pode estar desatualizada se alguém editou G/U/T depois).
- Scripts de inspeção usados (`scripts/_inspect-xlsx*.mjs`) foram **apagados** depois de extrair essas informações — não fazem parte do código do projeto, eram só exploração pontual. Se precisar reinspecionar, a lib `xlsx` já está instalada (`devDependencies`).

## Onde procurar o quê

- `supabase/schema.sql` — schema completo + RLS + funções de login. Toda regra de negócio sensível (cálculo de prioridade, performance, verificação de senha) vive aqui como função/coluna gerada do Postgres, não só em JS.
- `src/app/globals.css` — paleta Multilaser, tokens de tema claro/escuro, faixas GUT, cores de status.
- `src/lib/supabase/client.ts` / `server.ts` — factories de client Supabase (browser anon / server com JWT de sessão via `createSessionClient()` / service role).
- `src/lib/auth/session.ts` — assinatura/verificação dos 2 JWTs de sessão (`tdl_session`, `tdl_pending`) e helpers de cookie. `"server-only"`, nunca importar em client component.
- `src/lib/actions/*.ts` — todas as Server Actions (`"use server"`), sempre retornando `errorCode`, nunca texto pronto.
- `src/lib/i18n/` — config, mensagens (`pt/en/zh.json`), `LocaleProvider`, tradutor de erros de atividades.
- `src/lib/gut.ts` — cálculo/faixas de prioridade GUT, sem rótulo (rótulo é traduzido no componente).
- `src/lib/dashboard-metrics.ts` — cálculos puros do Dashboard (KPIs, distribuições), sem rótulo (idem).
- `src/components/activities/` / `src/components/dashboard/` / `src/components/shell/` / `src/components/auth/` — componentes de cada área, todos `"use client"`.
- `src/types/database.ts` — tipos manuais espelhando o schema (regenerar via `supabase gen types` assim que o projeto existir). **Atenção**: os tipos de linha (`Department`, `AppUser`, `Activity`, `ActivityFollowUp`) precisam ser `type`, nunca `interface` — ver comentário no topo do arquivo (interfaces não satisfazem o `Record<string, unknown>` que o supabase-js exige para `.rpc()`/`.from()` não colapsar em `never`; bug real que já aconteceu e foi corrigido nesta sessão).
- `.env.local.example` — todas as variáveis de ambiente necessárias, com onde encontrar cada uma no painel do Supabase. `.env.local` (gitignored) tem valores placeholder pra build/dev não quebrarem sem projeto real.
- `scripts/migrate-spreadsheet.mjs` — migração da planilha (Fase 5), dry-run por padrão. Lê `.env.local` manualmente (não passa pelo Next.js).
