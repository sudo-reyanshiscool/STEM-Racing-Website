// Announcements, mentor notes, holidays, posting to every team, and the mentor overview.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mentorAction, workspaceAction } from '../../src/lib/dashboard/actions';
import { hashCode } from '../../src/lib/dashboard/codes';
import { loadOverview } from '../../src/lib/dashboard/overview';
import {
  countActivity,
  listAllAnnouncements,
  listAnnouncements,
  listHolidays,
  listMentorNotes,
  listTasks,
  listTeams,
  recordActivity,
} from '../../src/lib/dashboard/store';
import { loadWorkspace } from '../../src/lib/dashboard/workspace';
import { testDb, type TestDb } from '../helpers/database';

const ROLES = ['Design and engineering', 'Enterprise', 'Project management'];
const TODAY = '2026-09-30';

let db: TestDb;
let mentorHash: string;
let alpha: number;
let beta: number;
let closed: number;

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(values)) data.set(name, value);
  return data;
}

const asMentor = (values: Record<string, string>) => mentorAction(db, form(values), mentorHash, ROLES);
const asTeam = (teamId: number, values: Record<string, string>) =>
  workspaceAction(db, teamId, 'team', form(values), ROLES);
const asMentorOn = (teamId: number, values: Record<string, string>) =>
  workspaceAction(db, teamId, 'mentor', form(values), ROLES);

async function teamId(slug: string): Promise<number> {
  const team = (await listTeams(db)).find((entry) => entry.slug === slug);
  if (!team) throw new Error(`No team ${slug}`);
  return team.id;
}

beforeAll(async () => {
  db = await testDb();
  mentorHash = await hashCode('TEST-MENTOR-01');
  for (const name of ['Test Alpha', 'Test Beta', 'Test Closed']) await asMentor({ action: 'team-add', name, code: '' });
  alpha = await teamId('test-alpha');
  beta = await teamId('test-beta');
  closed = await teamId('test-closed');
  await asMentor({ action: 'team-archive', id: String(closed), archived: 'true' });
});

afterAll(() => db.close());

describe('the new tables', () => {
  it('have row level security on and no policy', async () => {
    const tables = await db.query<{ name: string; secured: boolean }>(
      `select relname as name, relrowsecurity as secured from pg_class
       where relnamespace = 'public'::regnamespace and relkind = 'r'
         and relname in ('announcements', 'mentor_notes', 'holidays') order by relname`,
    );
    expect(tables).toEqual([
      { name: 'announcements', secured: true },
      { name: 'holidays', secured: true },
      { name: 'mentor_notes', secured: true },
    ]);
    expect(await db.query('select 1 from pg_policies')).toEqual([]);
  });
});

describe('announcements', () => {
  it('reach one team when posted to one team', async () => {
    expect(await asMentor({ action: 'announce', target: String(alpha), body: 'Alpha: bring your car on Friday.' })).toMatchObject({
      ok: true,
      notice: 'Announcement posted.',
    });
    expect((await listAnnouncements(db, alpha)).map((entry) => entry.body)).toEqual(['Alpha: bring your car on Friday.']);
    expect(await listAnnouncements(db, beta)).toEqual([]);
  });

  it('reach every team when posted to all, with the newest first', async () => {
    await asMentor({ action: 'announce', target: 'all', body: 'Portfolios are due in two weeks.' });
    expect((await listAnnouncements(db, alpha)).map((entry) => entry.body)).toEqual([
      'Portfolios are due in two weeks.',
      'Alpha: bring your car on Friday.',
    ]);
    expect((await listAnnouncements(db, beta)).map((entry) => entry.body)).toEqual(['Portfolios are due in two weeks.']);
  });

  it('say who they are for in the mentor list', async () => {
    const all = await listAllAnnouncements(db);
    expect(all.map((entry) => entry.teamName)).toEqual([null, 'Test Alpha']);
  });

  it('show the five most recent on the workspace, and the rest on request', async () => {
    for (let i = 1; i <= 5; i += 1) await asMentor({ action: 'announce', target: String(beta), body: `Beta ${i}` });
    const workspace = await loadWorkspace(db, beta, undefined, TODAY);
    expect(workspace.announcements.map((entry) => entry.body)).toEqual(['Beta 5', 'Beta 4', 'Beta 3', 'Beta 2', 'Beta 1']);
    expect(workspace.moreAnnouncements).toBe(1);
    const everything = await loadWorkspace(db, beta, undefined, TODAY, { allAnnouncements: true });
    expect(everything.announcements).toHaveLength(6);
    expect(everything.moreAnnouncements).toBe(0);
  });

  it.each([
    ['nothing', '', 'Write the announcement.'],
    ['1,001 characters', 'a'.repeat(1001), 'Keep the announcement to 1000 characters or fewer.'],
  ])('refuse %s', async (_name, body, message) => {
    expect(await asMentor({ action: 'announce', target: 'all', body })).toMatchObject({
      ok: false,
      errors: { body: message },
    });
  });

  it.each([['a team that is not there', '9999'], ['no target', ''], ['text', 'everyone'], ['an archived team', 'closed']])(
    'refuse %s as the target',
    async (_name, target) => {
      const value = target === 'closed' ? String(closed) : target;
      expect(await asMentor({ action: 'announce', target: value, body: 'Hello' })).toMatchObject({
        ok: false,
        errors: { target: 'Choose a team from the list.' },
      });
    },
  );

  it('are edited and deleted by a mentor', async () => {
    const [newest] = await listAnnouncements(db, alpha);
    expect(await asMentor({ action: 'announcement-edit', id: String(newest?.id), body: 'Portfolios are due on 14 October.' })).toMatchObject({ ok: true });
    expect((await listAnnouncements(db, alpha))[0]?.body).toBe('Portfolios are due on 14 October.');
    expect(await asMentor({ action: 'announcement-delete', id: String(newest?.id) })).toMatchObject({ ok: true });
    expect((await listAnnouncements(db, alpha)).map((entry) => entry.body)).toEqual(['Alpha: bring your car on Friday.']);
  });

  it('cannot be posted, edited or deleted by a team', async () => {
    const [entry] = await listAnnouncements(db, alpha);
    for (const values of [
      { action: 'announce', target: 'all', body: 'From a team' },
      { action: 'announcement-edit', id: String(entry?.id), body: 'Changed' },
      { action: 'announcement-delete', id: String(entry?.id) },
    ] as Record<string, string>[]) {
      expect(await asTeam(alpha, values)).toMatchObject({ ok: false, errors: { form: 'That form was not recognised.' } });
    }
    expect((await listAnnouncements(db, alpha)).map((item) => item.body)).toEqual(['Alpha: bring your car on Friday.']);
  });

  it('keep text as text', async () => {
    const body = `<script>alert(1)</script> '); drop table announcements; --`;
    await asMentor({ action: 'announce', target: String(alpha), body });
    expect((await listAnnouncements(db, alpha))[0]?.body).toBe(body);
  });
});

describe('mentor notes', () => {
  it('are written by a mentor on one team and read by that team alone', async () => {
    expect(await asMentorOn(alpha, { action: 'mentor-note-add', body: 'Good progress on the renders.' })).toMatchObject({
      ok: true,
      notice: 'Note added.',
    });
    expect((await loadWorkspace(db, alpha, undefined, TODAY)).mentorNotes.map((note) => note.body)).toEqual([
      'Good progress on the renders.',
    ]);
    expect((await loadWorkspace(db, beta, undefined, TODAY)).mentorNotes).toEqual([]);
  });

  it('are edited and deleted by a mentor, on the team they belong to', async () => {
    const [note] = await listMentorNotes(db, alpha);
    const id = String(note?.id);
    expect(await asMentorOn(beta, { action: 'mentor-note-edit', id, body: 'Wrong team' })).toMatchObject({ ok: false });
    expect(await asMentorOn(beta, { action: 'mentor-note-delete', id })).toMatchObject({ ok: false });
    expect(await asMentorOn(alpha, { action: 'mentor-note-edit', id, body: 'Renders look sharp.' })).toMatchObject({ ok: true });
    expect((await listMentorNotes(db, alpha))[0]?.body).toBe('Renders look sharp.');
    expect(await asMentorOn(alpha, { action: 'mentor-note-delete', id })).toMatchObject({ ok: true });
    expect(await listMentorNotes(db, alpha)).toEqual([]);
  });

  it('cannot be written, edited or deleted by a team', async () => {
    await asMentorOn(alpha, { action: 'mentor-note-add', body: 'Kept.' });
    const [note] = await listMentorNotes(db, alpha);
    for (const values of [
      { action: 'mentor-note-add', body: 'From the team' },
      { action: 'mentor-note-edit', id: String(note?.id), body: 'Changed' },
      { action: 'mentor-note-delete', id: String(note?.id) },
    ] as Record<string, string>[]) {
      expect(await asTeam(alpha, values)).toMatchObject({ ok: false });
    }
    expect((await listMentorNotes(db, alpha)).map((item) => item.body)).toEqual(['Kept.']);
  });

  it('refuse nothing and 2,001 characters', async () => {
    expect(await asMentorOn(alpha, { action: 'mentor-note-add', body: ' ' })).toMatchObject({
      ok: false,
      errors: { body: 'Write the note.' },
    });
    expect(await asMentorOn(alpha, { action: 'mentor-note-add', body: 'a'.repeat(2001) })).toMatchObject({
      ok: false,
      errors: { body: 'Keep the note to 2000 characters or fewer.' },
    });
  });

  it('do not count toward a streak', async () => {
    const before = await countActivity(db, alpha);
    await asMentorOn(alpha, { action: 'mentor-note-add', body: 'No credit.' });
    await asMentor({ action: 'announce', target: String(alpha), body: 'No credit.' });
    expect(await countActivity(db, alpha)).toBe(before);
  });
});

describe('a task posted by a mentor', () => {
  it('goes to one team', async () => {
    expect(
      await asMentor({ action: 'task-post', target: String(beta), title: 'Send the AI declaration', ownerRole: '', dueDate: '2026-10-09' }),
    ).toMatchObject({ ok: true, notice: 'Task posted to 1 team.' });
    expect((await listTasks(db, beta)).map((task) => [task.title, task.createdBy, task.dueDate])).toEqual([
      ['Send the AI declaration', 'mentor', '2026-10-09'],
    ]);
  });

  it('goes to every open team, and to no archived team', async () => {
    expect(await asMentor({ action: 'task-post', target: 'all', title: 'Book a judging slot', ownerRole: 'Enterprise', dueDate: '' })).toMatchObject({
      ok: true,
      notice: 'Task posted to 2 teams.',
    });
    for (const id of [alpha, beta]) {
      expect((await listTasks(db, id)).map((task) => task.title)).toContain('Book a judging slot');
    }
    expect(await listTasks(db, closed)).toEqual([]);
  });

  it('gives back what was typed when a field is wrong', async () => {
    expect(await asMentor({ action: 'task-post', target: 'all', title: '', ownerRole: 'Driver', dueDate: '2026-09-31' })).toEqual({
      ok: false,
      action: 'task-post',
      errors: {
        title: 'Give the task a title.',
        ownerRole: 'Choose a role from the list.',
        dueDate: 'Use a date on the calendar, in the form 2026-10-02.',
      },
      values: { target: 'all', title: '', ownerRole: 'Driver', dueDate: '2026-09-31' },
    });
  });
});

describe('holidays', () => {
  it('are added in date order and deleted', async () => {
    await asMentor({ action: 'holiday-add', label: 'Winter break', startsOn: '2026-12-19', endsOn: '2027-01-04' });
    expect(await asMentor({ action: 'holiday-add', label: 'Diwali break', startsOn: '2026-11-06', endsOn: '2026-11-15' })).toMatchObject({
      ok: true,
      notice: 'Holiday added.',
    });
    const holidays = await listHolidays(db);
    expect(holidays.map((holiday) => [holiday.label, holiday.startsOn, holiday.endsOn])).toEqual([
      ['Diwali break', '2026-11-06', '2026-11-15'],
      ['Winter break', '2026-12-19', '2027-01-04'],
    ]);
    expect(await asMentor({ action: 'holiday-delete', id: String(holidays[0]?.id) })).toMatchObject({ ok: true });
    expect(await listHolidays(db)).toHaveLength(1);
  });

  it('may last one day', async () => {
    expect(await asMentor({ action: 'holiday-add', label: 'Founders day', startsOn: '2026-10-02', endsOn: '2026-10-02' })).toMatchObject({ ok: true });
  });

  it.each([
    ['no name', { label: '', startsOn: '2026-10-19', endsOn: '2026-10-23' }, { label: 'Give the holiday a name.' }],
    ['a name of 61 characters', { label: 'a'.repeat(61), startsOn: '2026-10-19', endsOn: '2026-10-23' }, { label: 'Keep the name to 60 characters or fewer.' }],
    ['a day that is not on the calendar', { label: 'Break', startsOn: '2026-09-31', endsOn: '2026-10-23' }, { startsOn: 'Use a date on the calendar, in the form 2026-10-02.' }],
    ['no last day', { label: 'Break', startsOn: '2026-10-19', endsOn: '' }, { endsOn: 'Use a date on the calendar, in the form 2026-10-02.' }],
    ['a last day before the first', { label: 'Break', startsOn: '2026-10-23', endsOn: '2026-10-19' }, { endsOn: 'The last day cannot be before the first.' }],
    ['a holiday longer than a year', { label: 'Break', startsOn: '2026-10-19', endsOn: '2027-10-20' }, { endsOn: 'A holiday can last a year at most.' }],
  ])('refuse %s', async (_name, values, errors) => {
    expect(await asMentor({ action: 'holiday-add', ...values })).toMatchObject({ ok: false, errors });
  });

  it('cannot be set by a team', async () => {
    expect(await asTeam(alpha, { action: 'holiday-add', label: 'Break', startsOn: '2026-10-19', endsOn: '2026-10-23' })).toMatchObject({ ok: false });
  });
});

describe('the mentor overview', () => {
  let fresh: TestDb;
  let one: number;
  let two: number;
  let three: number;
  const at = (day: string) => new Date(`${day}T06:30:00Z`);
  const freshMentor = (values: Record<string, string>) => mentorAction(fresh, form(values), mentorHash, ROLES);

  beforeAll(async () => {
    fresh = await testDb();
    for (const name of ['Test One', 'Test Two', 'Test Three', 'Test Four']) await freshMentor({ action: 'team-add', name, code: '' });
    const ids = Object.fromEntries((await listTeams(fresh)).map((team) => [team.slug, team.id]));
    one = ids['test-one']!;
    two = ids['test-two']!;
    three = ids['test-three']!;
    await freshMentor({ action: 'team-archive', id: String(ids['test-four']), archived: 'true' });
    // Made before the days below, so that a team with no change has been idle since then.
    await fresh.query(`update teams set created_at = '2026-09-01T06:00:00Z'`);

    // One: active three weeks in a row, two lines done, nothing overdue.
    for (const day of ['2026-09-15', '2026-09-22', '2026-09-29']) await recordActivity(fresh, one, 'note', at(day));
    await workspaceAction(fresh, one, 'mentor', form({ action: 'deliverable', key: 'car', status: 'done' }), ROLES);
    await workspaceAction(fresh, one, 'mentor', form({ action: 'deliverable', key: 'renders', status: 'done' }), ROLES);
    await workspaceAction(fresh, one, 'mentor', form({ action: 'deliverable', key: 'pit-display', status: 'in_progress' }), ROLES);
    // Two: active yesterday, with two overdue tasks, one done late task and one task due today.
    await recordActivity(fresh, two, 'note', at('2026-09-29'));
    for (const [title, dueDate] of [['Late A', '2026-09-20'], ['Late B', '2026-09-29'], ['Due today', '2026-09-30'], ['Done late', '2026-09-01']]) {
      await workspaceAction(fresh, two, 'mentor', form({ action: 'task-add', title: title!, ownerRole: '', dueDate: dueDate! }), ROLES);
    }
    const late = (await listTasks(fresh, two)).find((task) => task.title === 'Done late');
    await workspaceAction(fresh, two, 'mentor', form({ action: 'task-done', id: String(late?.id), done: 'true' }), ROLES);
    // Three: last active 15 days ago.
    await recordActivity(fresh, three, 'note', at('2026-09-15'));
  });

  afterAll(() => fresh.close());

  it('has one row for each team, with the teams that are behind first and archived teams last', async () => {
    const rows = await loadOverview(fresh, TODAY);
    expect(rows.map((row) => [row.team.name, row.behind])).toEqual([
      ['Test Three', true],
      ['Test Two', true],
      ['Test One', false],
      ['Test Four', false],
    ]);
    expect(rows.at(-1)?.team.archived).toBe(true);
  });

  it('counts the lines that are done, of ten', async () => {
    const rows = await loadOverview(fresh, TODAY);
    expect(rows.find((row) => row.team.id === one)).toMatchObject({ doneCount: 2, total: 10 });
    expect(rows.find((row) => row.team.id === two)).toMatchObject({ doneCount: 0, total: 10 });
  });

  it('counts a task as overdue the day after it was due, unless it is done', async () => {
    const rows = await loadOverview(fresh, TODAY);
    expect(rows.find((row) => row.team.id === two)?.overdue).toBe(2);
    expect(rows.find((row) => row.team.id === one)?.overdue).toBe(0);
  });

  it('says why a team is behind, in words', async () => {
    const rows = await loadOverview(fresh, TODAY);
    expect(rows.find((row) => row.team.id === two)?.reasons).toEqual(['2 tasks overdue']);
    expect(rows.find((row) => row.team.id === three)?.reasons).toEqual(['No change for 15 days']);
    expect(rows.find((row) => row.team.id === one)?.reasons).toEqual([]);
  });

  it('shows the streak, the longest streak and the last day a team made a change', async () => {
    const rows = await loadOverview(fresh, TODAY);
    expect(rows.find((row) => row.team.id === one)).toMatchObject({
      streak: { current: 3, longest: 3 },
      lastActive: '2026-09-29',
    });
    expect(rows.find((row) => row.team.id === three)).toMatchObject({ streak: { current: 0, longest: 1 } });
  });

  it('reads the day of a change in the school\'s time, not in UTC', async () => {
    const late = await testDb();
    await mentorAction(late, form({ action: 'team-add', name: 'Test Late', code: '' }), mentorHash, ROLES);
    const [team] = await listTeams(late);
    // 20:00 UTC on Sunday 27 September is 01:30 on Monday 28 September in New Delhi.
    await recordActivity(late, team!.id, 'note', new Date('2026-09-27T20:00:00Z'));
    const [row] = await loadOverview(late, TODAY);
    expect(row?.lastActive).toBe('2026-09-28');
    expect(row?.streak.current).toBe(1);
    await late.close();
  });

  it('does not call a team behind for days that were a holiday', async () => {
    await freshMentor({ action: 'holiday-add', label: 'Break', startsOn: '2026-09-21', endsOn: '2026-09-25' });
    const rows = await loadOverview(fresh, TODAY);
    expect(rows.find((row) => row.team.id === three)).toMatchObject({ behind: false, reasons: [] });
    expect(rows.find((row) => row.team.id === three)?.streak.current).toBe(1);
  });

  it('counts a team that has never made a change from the day it was made', async () => {
    const idle = await testDb();
    await mentorAction(idle, form({ action: 'team-add', name: 'Test Idle', code: '' }), mentorHash, ROLES);
    await idle.query(`update teams set created_at = '2026-09-10T06:00:00Z'`);
    const [row] = await loadOverview(idle, TODAY);
    expect(row).toMatchObject({ behind: true, reasons: ['No change for 20 days'], lastActive: null });
    await idle.query(`update teams set created_at = '2026-09-29T06:00:00Z'`);
    expect((await loadOverview(idle, TODAY))[0]).toMatchObject({ behind: false });
    await idle.close();
  });

  it('never calls an archived team behind', async () => {
    const rows = await loadOverview(fresh, TODAY);
    expect(rows.find((row) => row.team.name === 'Test Four')).toMatchObject({ behind: false, reasons: [] });
  });

  it('shows a team its own streak on its workspace', async () => {
    const workspace = await loadWorkspace(fresh, one, undefined, TODAY);
    expect(workspace.streak).toEqual({ current: 3, longest: 3 });
  });
});
