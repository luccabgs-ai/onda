-- Schema do Onda no Supabase (Postgres).
-- Rode isso uma vez no SQL Editor do painel do Supabase.

create table projects (
  id text primary key,
  title text not null,
  description text,
  color text not null,
  area_id text,
  due_date text,
  created_at text not null,
  updated_at text not null
);

create table tasks (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  title text not null,
  description text,
  due_date text,
  priority text not null,
  checklist jsonb not null default '[]',
  valor_alvo double precision,
  valor_atual double precision not null default 0,
  unidade text,
  status text not null,
  sort_order double precision not null,
  created_at text not null,
  updated_at text not null
);

create table habitos (
  id text primary key,
  identidade text not null,
  area_id text not null,
  acao text not null,
  meta_atual text not null,
  meta_original text not null,
  ancora_tipo text not null,
  ancora_habito_id text,
  ancora_texto text,
  dias_semana jsonb not null,
  horario text,
  local text,
  votos jsonb not null default '{}',
  encolhimento_dismissado_em text,
  criado_em text not null,
  atualizado_em text not null
);

create table calendar_events (
  id text primary key,
  title text not null,
  date text not null,
  end_date text,
  type text not null,
  area_id text,
  project_id text,
  description text,
  location text,
  time text,
  color text,
  created_at text not null,
  updated_at text not null
);

create table cronometro_presets (
  id text primary key,
  nome text not null,
  fases jsonb not null,
  area_id text,
  habito_id text,
  pronto boolean not null default false,
  criado_em text not null,
  atualizado_em text not null
);

create table objetivos (
  id text primary key,
  titulo text not null,
  descricao text,
  area_id text,
  habito_ids jsonb not null default '[]',
  status text not null default 'ativo',
  criado_em text not null,
  atualizado_em text not null
);

create table metas (
  id text primary key,
  objetivo_id text not null references objetivos(id) on delete cascade,
  titulo text not null,
  unidade text,
  valor_alvo double precision not null,
  rastreio text not null,
  habito_id text,
  valor_manual double precision,
  prazo text,
  criado_em text not null,
  atualizado_em text not null
);

-- Registros do ritual (check-in da manhã / check-out da noite) — 1 linha por dia/tipo.
create table rituais (
  id text primary key,
  data text not null,
  tipo text not null,
  energia integer not null,
  intencao text,
  vitorias jsonb,
  funcionou text,
  carrega text,
  criado_em text not null,
  atualizado_em text not null
);

-- Organização: um ciclo por período (semana/mês/semestre/ano), id = `${escala}-${inicio}`.
-- Só nasce quando algo é escrito nele. `itens` = metas (sim/não) e indicadores (número x alvo).
create table ciclos (
  id text primary key,
  escala text not null,
  inicio text not null,
  fim text not null,
  foco text,
  itens jsonb not null default '[]',
  meio_nota text,
  meio_em text,
  nota integer,
  funcionou text,
  nao_funcionou text,
  levar text,
  fechado_em text,
  criado_em text not null,
  atualizado_em text not null
);
