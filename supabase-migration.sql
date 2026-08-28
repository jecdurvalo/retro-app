-- Rode isso no Supabase (painel do seu projeto -> SQL Editor -> New query -> Run).
-- Cria as tabelas que passam a guardar o histórico de retros, os grupos de tema
-- e o título/subtítulo editável do board, que hoje só existem no localStorage
-- do navegador (não sincronizam entre dispositivos e não têm backup).

create table if not exists retro_snapshots (
  id text primary key,
  session_id text not null,
  title text not null,
  date date not null,
  mood_average numeric not null default 0,
  mood_count integer not null default 0,
  item_count integer not null default 0,
  open_plan_count integer not null default 0,
  themes jsonb not null default '[]'::jsonb,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  leader_name text,
  participant_names jsonb not null default '[]'::jsonb,
  bookmarked boolean not null default false
);

-- If you already ran this migration before, run these two lines to add the
-- new columns (líder/participantes do histórico de retros) without dropping data:
alter table retro_snapshots add column if not exists leader_name text;
alter table retro_snapshots add column if not exists participant_names jsonb not null default '[]'::jsonb;
alter table retro_snapshots add column if not exists bookmarked boolean not null default false;

alter table retro_snapshots enable row level security;

drop policy if exists "retro_snapshots_all_access" on retro_snapshots;
create policy "retro_snapshots_all_access" on retro_snapshots
  for all
  using (true)
  with check (true);

create table if not exists retro_board_settings (
  session_id text primary key,
  board_header jsonb not null default '{}'::jsonb,
  theme_groups jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table retro_board_settings enable row level security;

drop policy if exists "retro_board_settings_all_access" on retro_board_settings;
create policy "retro_board_settings_all_access" on retro_board_settings
  for all
  using (true)
  with check (true);
