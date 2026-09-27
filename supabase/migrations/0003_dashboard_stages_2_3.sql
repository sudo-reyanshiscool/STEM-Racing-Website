-- Team dashboard, stages 2 and 3: what mentors write, and the holidays that streaks leave out.

create table mentor_notes (
  id integer generated always as identity primary key,
  team_id integer not null references teams (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index mentor_notes_team on mentor_notes (team_id);

-- A row with no team is for every team.
create table announcements (
  id integer generated always as identity primary key,
  team_id integer references teams (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index announcements_team on announcements (team_id);

create table holidays (
  id integer generated always as identity primary key,
  label text not null check (char_length(label) between 1 and 60),
  starts_on date not null,
  ends_on date not null check (ends_on >= starts_on)
);

alter table mentor_notes enable row level security;
alter table announcements enable row level security;
alter table holidays enable row level security;

-- The role the site signs in as. It is made by hand, so it is not there in a test database.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'dashboard_app') then
    grant select, insert, update, delete on mentor_notes, announcements, holidays to dashboard_app;
  end if;
end
$$;
