-- Retro Sync — schema completo
-- Cole este script inteiro no SQL Editor do novo projeto Supabase e rode uma vez.
-- Cobre TUDO que hoje tem dado real no app: as duas tabelas que já existiam
-- (retro_items, retro_snapshots), a de configurações do board que já é lida/escrita
-- pelo código (retro_board_settings, lib/board-header.ts e lib/theme-groups.ts) e
-- as tabelas novas para o que hoje só vive no localStorage do navegador: frentes,
-- pessoas, decisões, tarefas, rituais, fechamento mensal e o ciclo de evolução.
--
-- Importante: criar essas tabelas aqui é só a metade "banco existe". A outra
-- metade — trocar lib/fronts.ts, lib/people.ts, lib/decisions.ts, lib/tasks.ts,
-- lib/rituals.ts e lib/evolution.ts para ler/escrever no Supabase (com fallback
-- pro localStorage, no mesmo padrão que lib/board-header.ts já usa) — ainda não
-- foi feita. Sem isso, essas tabelas ficam vazias.
--
-- Ficaram de fora de propósito (não têm mais tela que escreva neles, sobraram da
-- pasta /management que já foi removida): lib/monthly-close.ts (chave antiga
-- "retro-management-monthly-closes", diferente da usada por /rituais),
-- lib/hot-topics.ts, lib/initiatives.ts e lib/delegation.ts.

create extension if not exists pgcrypto;

-- ─── retro_items ─────────────────────────────────────────────────────────────
-- Um item por card do board (Mandamos bem / Podemos melhorar / Vamos repensar).
-- Também guarda os registros de mood (categoria action_items, conteúdo
-- codificado por lib/mood.ts).

create table if not exists public.retro_items (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,
  category    text not null check (category in ('went_well', 'to_improve', 'action_items')),
  content     text not null,
  author_name text,
  created_at  timestamptz not null default now()
);

create index if not exists retro_items_session_id_idx on public.retro_items (session_id);
create index if not exists retro_items_session_category_idx on public.retro_items (session_id, category);

alter table public.retro_items enable row level security;

create policy "retro_items: leitura pública"
  on public.retro_items for select
  using (true);

create policy "retro_items: inserção pública"
  on public.retro_items for insert
  with check (true);

create policy "retro_items: exclusão pública"
  on public.retro_items for delete
  using (true);

-- Realtime: o /retro assina mudanças na tabela para atualizar os cards ao vivo.
alter publication supabase_realtime add table public.retro_items;

-- ─── retro_snapshots ─────────────────────────────────────────────────────────
-- Um snapshot por retro finalizada (aba /historico e /minha-evolucao).
-- O id é gerado no cliente (ex: "snapshot-<timestamp>"), por isso é texto e não
-- tem default — o insert sempre vem com um id já definido.

create table if not exists public.retro_snapshots (
  id                text primary key,
  session_id        text not null,
  title             text not null,
  date              date not null,
  mood_average      numeric not null default 0,
  mood_count        integer not null default 0,
  item_count        integer not null default 0,
  open_plan_count   integer not null default 0,
  themes            text[] not null default '{}',
  items             jsonb not null default '[]',
  leader_name       text,
  participant_names text[] not null default '{}',
  bookmarked        boolean not null default false,
  created_at        timestamptz not null default now()
);

create index if not exists retro_snapshots_session_id_idx on public.retro_snapshots (session_id);
create index if not exists retro_snapshots_session_date_idx on public.retro_snapshots (session_id, date desc);

alter table public.retro_snapshots enable row level security;

create policy "retro_snapshots: leitura pública"
  on public.retro_snapshots for select
  using (true);

create policy "retro_snapshots: inserção pública"
  on public.retro_snapshots for insert
  with check (true);

create policy "retro_snapshots: atualização pública"
  on public.retro_snapshots for update
  using (true)
  with check (true);

create policy "retro_snapshots: exclusão pública"
  on public.retro_snapshots for delete
  using (true);

-- ─── retro_board_settings ──────────────────────────────────────────────────────
-- Título/subtítulo do board (/retro) e os grupos de tema criados lá. Já é lido e
-- escrito hoje por lib/board-header.ts e lib/theme-groups.ts — só faltava esta
-- tabela existir no projeto novo.

create table if not exists public.retro_board_settings (
  session_id   text primary key,
  board_header jsonb not null default '{}',
  theme_groups jsonb not null default '[]',
  updated_at   timestamptz not null default now()
);

alter table public.retro_board_settings enable row level security;

create policy "retro_board_settings: acesso público"
  on public.retro_board_settings for all
  using (true)
  with check (true);

-- As sete tabelas abaixo (leadership_*) NÃO têm session_id: são dados do cockpit de
-- gestão, que existem uma vez só (não são "por retro" como os itens/board acima).
-- É por isso que lib/fronts.ts, lib/people.ts etc. chamam load/save sem passar
-- nenhum id de sessão — não faria sentido dar a eles um.

-- ─── leadership_fronts ──────────────────────────────────────────────────────────
-- Uma linha por frente (lib/fronts.ts). O objeto inteiro (dono, status, FCAs,
-- tags, progressOverride etc.) fica no jsonb `data`, no mesmo formato que o app
-- já usa — evita ter que espelhar cada campo em coluna.

create table if not exists public.leadership_fronts (
  id         text primary key,
  data       jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leadership_fronts enable row level security;

create policy "leadership_fronts: acesso público"
  on public.leadership_fronts for all
  using (true)
  with check (true);

-- ─── leadership_people ───────────────────────────────────────────────────────
-- Uma linha por pessoa (lib/people.ts). Mesmo padrão: objeto completo em `data`.

create table if not exists public.leadership_people (
  id         text primary key,
  data       jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leadership_people enable row level security;

create policy "leadership_people: acesso público"
  on public.leadership_people for all
  using (true)
  with check (true);

-- ─── leadership_decisions ───────────────────────────────────────────────────────
-- Uma linha por decisão (lib/decisions.ts, tela /decisoes).

create table if not exists public.leadership_decisions (
  id         text primary key,
  data       jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leadership_decisions enable row level security;

create policy "leadership_decisions: acesso público"
  on public.leadership_decisions for all
  using (true)
  with check (true);

-- ─── leadership_tasks ───────────────────────────────────────────────────────────
-- Uma linha por tarefa (lib/tasks.ts — "Próximas ações" do Painel e das frentes).

create table if not exists public.leadership_tasks (
  id         text primary key,
  data       jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leadership_tasks enable row level security;

create policy "leadership_tasks: acesso público"
  on public.leadership_tasks for all
  using (true)
  with check (true);

-- ─── leadership_rituals ─────────────────────────────────────────────────────────
-- Uma linha por ritual (lib/rituals.ts, tela /rituais).

create table if not exists public.leadership_rituals (
  id         text primary key,
  data       jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leadership_rituals enable row level security;

create policy "leadership_rituals: acesso público"
  on public.leadership_rituals for all
  using (true)
  with check (true);

-- ─── leadership_monthly_close ───────────────────────────────────────────────────
-- Objeto único (lib/rituals.ts: loadMonthlyClose/saveMonthlyClose — checklist de
-- fechamento mensal mostrado em /rituais). `singleton` garante que só existe 1 linha.

create table if not exists public.leadership_monthly_close (
  singleton  boolean primary key default true check (singleton),
  data       jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.leadership_monthly_close enable row level security;

create policy "leadership_monthly_close: acesso público"
  on public.leadership_monthly_close for all
  using (true)
  with check (true);

-- ─── leadership_evolution ───────────────────────────────────────────────────────
-- Objeto único (lib/evolution.ts), reunindo os quatro pedaços que hoje moram em
-- chaves separadas do localStorage: evidências, focos atuais, compromissos do
-- ciclo e o ciclo em si (datas/label). Mesma garantia de linha única.

create table if not exists public.leadership_evolution (
  singleton   boolean primary key default true check (singleton),
  evidences   jsonb not null default '[]',
  focuses     jsonb not null default '[]',
  commitments jsonb not null default '[]',
  cycle       jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);

alter table public.leadership_evolution enable row level security;

create policy "leadership_evolution: acesso público"
  on public.leadership_evolution for all
  using (true)
  with check (true);
