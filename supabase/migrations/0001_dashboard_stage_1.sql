-- Team dashboard, stage 1. See docs/superpowers/specs/2026-09-27-team-dashboard-design.md.
-- Only the site's server reads these tables. Row level security is on with no policies,
-- so Supabase's public API returns nothing.

create table teams (
  id integer generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name text not null check (char_length(name) between 1 and 80),
  code_hash text not null,
  code_version integer not null default 1,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table deliverables (
  team_id integer not null references teams (id) on delete cascade,
  key text not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'done')),
  updated_at timestamptz not null default now(),
  primary key (team_id, key)
);

create table tasks (
  id integer generated always as identity primary key,
  team_id integer not null references teams (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  owner_role text,
  due_date date,
  done boolean not null default false,
  created_by text not null check (created_by in ('team', 'mentor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_team on tasks (team_id);

create table notes (
  team_id integer primary key references teams (id) on delete cascade,
  status_note text not null default '' check (char_length(status_note) <= 2000),
  updated_at timestamptz not null default now()
);

create table links (
  id integer generated always as identity primary key,
  team_id integer not null references teams (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 60),
  url text not null check (url like 'https://%' and char_length(url) <= 2000),
  created_at timestamptz not null default now()
);

create index links_team on links (team_id);

create table activity (
  id integer generated always as identity primary key,
  team_id integer not null references teams (id) on delete cascade,
  kind text not null,
  happened_at timestamptz not null default now()
);

create index activity_team_time on activity (team_id, happened_at);

create table signin_failures (
  address_hash text not null,
  happened_at timestamptz not null
);

create index signin_failures_address on signin_failures (address_hash, happened_at);

alter table teams enable row level security;
alter table deliverables enable row level security;
alter table tasks enable row level security;
alter table notes enable row level security;
alter table links enable row level security;
alter table activity enable row level security;
alter table signin_failures enable row level security;
