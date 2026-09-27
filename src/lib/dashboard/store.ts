// Every statement the dashboard runs. A function that touches a team's rows takes the team's
// id as its second argument and names it in the statement, so no row of another team can match.
import type { Db } from './db';
import { isDeliverableKey, isStatus, type DeliverableKey, type Status } from './deliverables';
import { LIMITS, type LinkFields, type TaskFields } from './fields';

export type Author = 'team' | 'mentor';

export interface Team {
  id: number;
  slug: string;
  name: string;
  codeVersion: number;
  archived: boolean;
}

export interface TeamWithCode extends Team {
  codeHash: string;
}

export interface Task {
  id: number;
  title: string;
  ownerRole: string | null;
  /** YYYY-MM-DD */
  dueDate: string | null;
  done: boolean;
  createdBy: Author;
}

export interface Link {
  id: number;
  label: string;
  url: string;
}

const TEAM = 'id, slug, name, code_version as "codeVersion", archived';
const TASK =
  'id, title, owner_role as "ownerRole", to_char(due_date, \'YYYY-MM-DD\') as "dueDate", done, created_by as "createdBy"';

// Teams

export function listTeams(db: Db): Promise<Team[]> {
  return db.query<Team>(`select ${TEAM} from teams order by archived, lower(name)`);
}

export function listTeamsWithCodes(db: Db): Promise<TeamWithCode[]> {
  return db.query<TeamWithCode>(`select ${TEAM}, code_hash as "codeHash" from teams order by id`);
}

export async function getTeam(db: Db, teamId: number): Promise<Team | undefined> {
  const rows = await db.query<Team>(`select ${TEAM} from teams where id = $1`, [teamId]);
  return rows[0];
}

/** Undefined when the slug is in use. */
export async function createTeam(
  db: Db,
  team: { slug: string; name: string; codeHash: string },
): Promise<Team | undefined> {
  const rows = await db.query<Team>(
    `insert into teams (slug, name, code_hash) values ($1, $2, $3)
     on conflict (slug) do nothing
     returning ${TEAM}`,
    [team.slug, team.name, team.codeHash],
  );
  return rows[0];
}

/** Every session that began with the old code ends, because the version moves on. */
export async function resetCode(db: Db, teamId: number, codeHash: string): Promise<boolean> {
  const rows = await db.query(
    'update teams set code_hash = $2, code_version = code_version + 1 where id = $1 returning id',
    [teamId, codeHash],
  );
  return rows.length === 1;
}

export async function setArchived(db: Db, teamId: number, archived: boolean): Promise<boolean> {
  const rows = await db.query('update teams set archived = $2 where id = $1 returning id', [teamId, archived]);
  return rows.length === 1;
}

// Deliverables

/** The status of each line the team has touched. A line with no row has not been started. */
export async function deliverableStatuses(db: Db, teamId: number): Promise<Partial<Record<DeliverableKey, Status>>> {
  const rows = await db.query<{ key: string; status: string }>(
    'select key, status from deliverables where team_id = $1',
    [teamId],
  );
  const statuses: Partial<Record<DeliverableKey, Status>> = {};
  for (const row of rows) if (isDeliverableKey(row.key) && isStatus(row.status)) statuses[row.key] = row.status;
  return statuses;
}

export async function setDeliverable(db: Db, teamId: number, key: DeliverableKey, status: Status): Promise<void> {
  await db.query(
    `insert into deliverables (team_id, key, status) values ($1, $2, $3)
     on conflict (team_id, key) do update set status = excluded.status, updated_at = now()`,
    [teamId, key, status],
  );
}

// Tasks

export function listTasks(db: Db, teamId: number): Promise<Task[]> {
  return db.query<Task>(`select ${TASK} from tasks where team_id = $1 order by id`, [teamId]);
}

/** Undefined when the team already holds as many tasks as it may. */
export async function addTask(db: Db, teamId: number, task: TaskFields, author: Author): Promise<number | undefined> {
  const rows = await db.query<{ id: number }>(
    `insert into tasks (team_id, title, owner_role, due_date, created_by)
     select $1, $2, $3, $4::date, $5
     where (select count(*) from tasks where team_id = $1) < $6
     returning id`,
    [teamId, task.title, task.ownerRole, task.dueDate, author, LIMITS.tasks],
  );
  return rows[0]?.id;
}

/** A team may tick off any of its tasks, a mentor's included. False when the task is not the team's. */
export async function setTaskDone(db: Db, teamId: number, taskId: number, done: boolean): Promise<boolean> {
  const rows = await db.query(
    'update tasks set done = $3, updated_at = now() where team_id = $1 and id = $2 returning id',
    [teamId, taskId, done],
  );
  return rows.length === 1;
}

/** A team changes only the tasks it wrote. A mentor changes any. */
export async function editTask(
  db: Db,
  teamId: number,
  taskId: number,
  task: TaskFields,
  author: Author,
): Promise<boolean> {
  const rows = await db.query(
    `update tasks set title = $3, owner_role = $4, due_date = $5::date, updated_at = now()
     where team_id = $1 and id = $2 and ($6 = 'mentor' or created_by = 'team')
     returning id`,
    [teamId, taskId, task.title, task.ownerRole, task.dueDate, author],
  );
  return rows.length === 1;
}

export async function deleteTask(db: Db, teamId: number, taskId: number, author: Author): Promise<boolean> {
  const rows = await db.query(
    `delete from tasks
     where team_id = $1 and id = $2 and ($3 = 'mentor' or created_by = 'team')
     returning id`,
    [teamId, taskId, author],
  );
  return rows.length === 1;
}

// Notes and links

export async function getNote(db: Db, teamId: number): Promise<string> {
  const rows = await db.query<{ note: string }>('select status_note as note from notes where team_id = $1', [teamId]);
  return rows[0]?.note ?? '';
}

export async function setNote(db: Db, teamId: number, note: string): Promise<void> {
  await db.query(
    `insert into notes (team_id, status_note) values ($1, $2)
     on conflict (team_id) do update set status_note = excluded.status_note, updated_at = now()`,
    [teamId, note],
  );
}

export function listLinks(db: Db, teamId: number): Promise<Link[]> {
  return db.query<Link>('select id, label, url from links where team_id = $1 order by id', [teamId]);
}

/** Undefined when the team already holds as many links as it may. */
export async function addLink(db: Db, teamId: number, link: LinkFields): Promise<number | undefined> {
  const rows = await db.query<{ id: number }>(
    `insert into links (team_id, label, url)
     select $1, $2, $3
     where (select count(*) from links where team_id = $1) < $4
     returning id`,
    [teamId, link.label, link.url, LIMITS.links],
  );
  return rows[0]?.id;
}

export async function deleteLink(db: Db, teamId: number, linkId: number): Promise<boolean> {
  const rows = await db.query('delete from links where team_id = $1 and id = $2 returning id', [teamId, linkId]);
  return rows.length === 1;
}

// Activity

/** One row for each change a team makes. Streaks are counted from these in stage 3. */
export async function recordActivity(db: Db, teamId: number, kind: string, now: Date = new Date()): Promise<void> {
  await db.query('insert into activity (team_id, kind, happened_at) values ($1, $2, $3::timestamptz)', [
    teamId,
    kind,
    now.toISOString(),
  ]);
}

export async function countActivity(db: Db, teamId: number): Promise<number> {
  const rows = await db.query<{ count: number }>(
    'select count(*)::int as count from activity where team_id = $1',
    [teamId],
  );
  return rows[0]?.count ?? 0;
}
