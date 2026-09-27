-- The one-time welcome a team sees the first time it opens its workspace. Every existing team
-- starts unwelcomed, so each of them sees it once after this migration runs.

alter table teams add column welcomed boolean not null default false;
