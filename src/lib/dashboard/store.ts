// Every statement the dashboard runs. A function that touches a team's rows takes the team's
// id as its second argument and names it in the statement, so no row of another team can match.
import type { Db } from './db';
import { isDeliverableKey, isStatus, type DeliverableKey, type Status } from './deliverables';
import { LIMITS, type HolidayFields, type LinkFields, type TaskFields } from './fields';

export type Author = 'team' | 'mentor';

export interface Team {
  id: number;
  slug: string;
  name: string;
  codeVersion: number;
  archived: boolean;
  /** True once the team has seen the one-time welcome on its workspace. */
  welcomed: boolean;
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

export interface Announcement {
  id: number;
  /** Null when the announcement is for every team. */
  teamId: number | null;
  body: string;
  /** YYYY-MM-DD in the school's time. */
  postedOn: string;
}

export interface AnnouncementForMentor extends Announcement {
  /** Null when the announcement is for every team. */
  teamName: string | null;
}

export interface MentorNote {
  id: number;
  body: string;
  /** YYYY-MM-DD in the school's time. */
  writtenOn: string;
}

export interface HolidayRow {
  id: number;
  label: string;
  startsOn: string;
  endsOn: string;
}

export interface TeamTotals {
  teamId: number;
  doneCount: number;
  overdue: number;
  /** YYYY-MM-DD in the school's time. */
  createdOn: string;
}

export interface Link {
  id: number;
  label: string;
  url: string;
}

const TEAM = 'id, slug, name, code_version as "codeVersion", archived, welcomed';
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

/** Marks the team as having seen its one-time welcome. Calling it again does nothing. */
export async function markWelcomed(db: Db, teamId: number): Promise<void> {
  await db.query('update teams set welcomed = true where id = $1', [teamId]);
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

/** The same for every team at once, for the mentor overview. */
export async function deliverableStatusesByTeam(
  db: Db,
): Promise<Map<number, Partial<Record<DeliverableKey, Status>>>> {
  const rows = await db.query<{ teamId: number; key: string; status: string }>(
    'select team_id as "teamId", key, status from deliverables',
  );
  const byTeam = new Map<number, Partial<Record<DeliverableKey, Status>>>();
  for (const row of rows) {
    if (!isDeliverableKey(row.key) || !isStatus(row.status)) continue;
    byTeam.set(row.teamId, { ...byTeam.get(row.teamId), [row.key]: row.status });
  }
  return byTeam;
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

/** The days on which a team made a change, in the school's time, oldest first. */
export async function activityDays(db: Db, teamId: number, timeZone: string): Promise<string[]> {
  const rows = await db.query<{ day: string }>(
    `select distinct to_char(happened_at at time zone $2, 'YYYY-MM-DD') as day
     from activity where team_id = $1 order by day`,
    [teamId, timeZone],
  );
  return rows.map((row) => row.day);
}

/** The same for every team at once, for the mentor overview. */
export async function activityDaysByTeam(db: Db, timeZone: string): Promise<Map<number, string[]>> {
  const rows = await db.query<{ teamId: number; day: string }>(
    `select distinct team_id as "teamId", to_char(happened_at at time zone $1, 'YYYY-MM-DD') as day
     from activity order by day`,
    [timeZone],
  );
  const days = new Map<number, string[]>();
  for (const row of rows) days.set(row.teamId, [...(days.get(row.teamId) ?? []), row.day]);
  return days;
}

/** For each team: lines done, tasks overdue on the day given, and the day the team was made. */
export function teamTotals(db: Db, today: string, timeZone: string): Promise<TeamTotals[]> {
  return db.query<TeamTotals>(
    `select t.id as "teamId",
       (select count(*)::int from deliverables d where d.team_id = t.id and d.status = 'done') as "doneCount",
       (select count(*)::int from tasks k where k.team_id = t.id and not k.done and k.due_date < $1::date) as overdue,
       to_char(t.created_at at time zone $2, 'YYYY-MM-DD') as "createdOn"
     from teams t`,
    [today, timeZone],
  );
}

// What mentors write

const ANNOUNCEMENT = `a.id, a.team_id as "teamId", a.body, to_char(a.created_at at time zone $1, 'YYYY-MM-DD') as "postedOn"`;

/** Announcements for one team and for every team, newest first. */
export function listAnnouncements(db: Db, teamId: number, timeZone = 'UTC'): Promise<Announcement[]> {
  return db.query<Announcement>(
    `select ${ANNOUNCEMENT} from announcements a
     where a.team_id = $2 or a.team_id is null
     order by a.created_at desc, a.id desc`,
    [timeZone, teamId],
  );
}

export function listAllAnnouncements(db: Db, timeZone = 'UTC'): Promise<AnnouncementForMentor[]> {
  return db.query<AnnouncementForMentor>(
    `select ${ANNOUNCEMENT}, t.name as "teamName"
     from announcements a left join teams t on t.id = a.team_id
     order by a.created_at desc, a.id desc`,
    [timeZone],
  );
}

export async function addAnnouncement(db: Db, teamId: number | null, body: string): Promise<void> {
  await db.query('insert into announcements (team_id, body) values ($1, $2)', [teamId, body]);
}

export async function editAnnouncement(db: Db, id: number, body: string): Promise<boolean> {
  const rows = await db.query('update announcements set body = $2 where id = $1 returning id', [id, body]);
  return rows.length === 1;
}

export async function deleteAnnouncement(db: Db, id: number): Promise<boolean> {
  const rows = await db.query('delete from announcements where id = $1 returning id', [id]);
  return rows.length === 1;
}

export function listMentorNotes(db: Db, teamId: number, timeZone = 'UTC'): Promise<MentorNote[]> {
  return db.query<MentorNote>(
    `select id, body, to_char(created_at at time zone $2, 'YYYY-MM-DD') as "writtenOn"
     from mentor_notes where team_id = $1 order by created_at desc, id desc`,
    [teamId, timeZone],
  );
}

export async function addMentorNote(db: Db, teamId: number, body: string): Promise<void> {
  await db.query('insert into mentor_notes (team_id, body) values ($1, $2)', [teamId, body]);
}

export async function editMentorNote(db: Db, teamId: number, id: number, body: string): Promise<boolean> {
  const rows = await db.query(
    'update mentor_notes set body = $3 where team_id = $1 and id = $2 returning id',
    [teamId, id, body],
  );
  return rows.length === 1;
}

export async function deleteMentorNote(db: Db, teamId: number, id: number): Promise<boolean> {
  const rows = await db.query('delete from mentor_notes where team_id = $1 and id = $2 returning id', [teamId, id]);
  return rows.length === 1;
}

// Holidays

export function listHolidays(db: Db): Promise<HolidayRow[]> {
  return db.query<HolidayRow>(
    `select id, label, to_char(starts_on, 'YYYY-MM-DD') as "startsOn", to_char(ends_on, 'YYYY-MM-DD') as "endsOn"
     from holidays order by starts_on, id`,
  );
}

export async function addHoliday(db: Db, holiday: HolidayFields): Promise<void> {
  await db.query('insert into holidays (label, starts_on, ends_on) values ($1, $2::date, $3::date)', [
    holiday.label,
    holiday.startsOn,
    holiday.endsOn,
  ]);
}

export async function deleteHoliday(db: Db, id: number): Promise<boolean> {
  const rows = await db.query('delete from holidays where id = $1 returning id', [id]);
  return rows.length === 1;
}
