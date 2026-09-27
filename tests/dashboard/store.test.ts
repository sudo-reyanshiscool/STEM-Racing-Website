import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  addLink,
  addTask,
  countActivity,
  createTeam,
  deleteLink,
  deleteTask,
  deliverableStatuses,
  editTask,
  getNote,
  getTeam,
  listLinks,
  listTasks,
  listTeams,
  listTeamsWithCodes,
  recordActivity,
  resetCode,
  setArchived,
  setDeliverable,
  setNote,
  setTaskDone,
} from '../../src/lib/dashboard/store';
import { migrationFiles, testDb, type TestDb } from '../helpers/database';

let db: TestDb;
let alpha: number;
let beta: number;

const task = { title: 'Book the wind tunnel', ownerRole: null, dueDate: null };

beforeAll(async () => {
  db = await testDb();
  alpha = (await createTeam(db, { slug: 'test-alpha', name: 'Test Alpha', codeHash: 'scrypt.a.a' }))!.id;
  beta = (await createTeam(db, { slug: 'test-beta', name: 'Test Beta', codeHash: 'scrypt.b.b' }))!.id;
});

afterAll(() => db.close());

describe('the tables', () => {
  it('switches row level security on for every table, with no policy', async () => {
    const tables = await db.query<{ name: string; secured: boolean }>(
      `select relname as name, relrowsecurity as secured from pg_class
       where relnamespace = 'public'::regnamespace and relkind = 'r' order by relname`,
    );
    expect(tables.map((table) => table.name)).toEqual([
      'activity',
      'deliverables',
      'links',
      'notes',
      'signin_failures',
      'tasks',
      'teams',
    ]);
    for (const table of tables) expect(table.secured, table.name).toBe(true);
    expect(await db.query('select 1 from pg_policies')).toEqual([]);
  });

  it('names each migration with a number, so they run in order', () => {
    for (const file of migrationFiles()) expect(file).toMatch(/^\d{4}_[a-z0-9_]+\.sql$/);
  });

  it('starts with no invented content', async () => {
    const fresh = await testDb();
    for (const table of ['teams', 'tasks', 'links', 'notes', 'deliverables', 'activity', 'signin_failures']) {
      expect(await fresh.query(`select 1 from ${table}`), table).toEqual([]);
    }
    await fresh.close();
  });
});

describe('teams', () => {
  it('makes a team that is open, at version 1', async () => {
    expect(await getTeam(db, alpha)).toEqual({
      id: alpha,
      slug: 'test-alpha',
      name: 'Test Alpha',
      codeVersion: 1,
      archived: false,
    });
  });

  it('refuses a slug that is in use', async () => {
    expect(await createTeam(db, { slug: 'test-alpha', name: 'Another', codeHash: 'scrypt.c.c' })).toBeUndefined();
  });

  it('returns nothing for a team that is not there', async () => {
    expect(await getTeam(db, 9999)).toBeUndefined();
  });

  it('keeps the code hash out of the plain list', async () => {
    for (const team of await listTeams(db)) expect(team).not.toHaveProperty('codeHash');
    expect((await listTeamsWithCodes(db)).map((team) => team.codeHash)).toEqual(['scrypt.a.a', 'scrypt.b.b']);
  });

  it('moves the version on when the code is reset', async () => {
    const team = (await createTeam(db, { slug: 'test-reset', name: 'Test Reset', codeHash: 'scrypt.d.d' }))!;
    expect(await resetCode(db, team.id, 'scrypt.e.e')).toBe(true);
    expect((await getTeam(db, team.id))?.codeVersion).toBe(2);
    expect(await resetCode(db, 9999, 'scrypt.e.e')).toBe(false);
  });

  it('archives and reopens, and lists open teams first', async () => {
    const team = (await createTeam(db, { slug: 'test-aaa', name: 'AAA Archived', codeHash: 'scrypt.f.f' }))!;
    expect(await setArchived(db, team.id, true)).toBe(true);
    const names = (await listTeams(db)).map((entry) => entry.name);
    expect(names.at(-1)).toBe('AAA Archived');
    expect(await setArchived(db, team.id, false)).toBe(true);
    expect(await setArchived(db, 9999, true)).toBe(false);
  });
});

describe('deliverables', () => {
  it('has no rows for a new team', async () => {
    expect(await deliverableStatuses(db, alpha)).toEqual({});
  });

  it('saves a status and changes it', async () => {
    await setDeliverable(db, alpha, 'car', 'in_progress');
    await setDeliverable(db, alpha, 'car', 'done');
    await setDeliverable(db, alpha, 'renders', 'in_progress');
    expect(await deliverableStatuses(db, alpha)).toEqual({ car: 'done', renders: 'in_progress' });
  });

  it('keeps each team to its own', async () => {
    expect(await deliverableStatuses(db, beta)).toEqual({});
  });
});

describe('tasks', () => {
  it('adds a task and reads it back with its date as text', async () => {
    const id = await addTask(db, alpha, { title: 'Render the car', ownerRole: 'Enterprise', dueDate: '2026-10-02' }, 'team');
    expect(await listTasks(db, alpha)).toContainEqual({
      id,
      title: 'Render the car',
      ownerRole: 'Enterprise',
      dueDate: '2026-10-02',
      done: false,
      createdBy: 'team',
    });
  });

  it('ticks off and reopens', async () => {
    const id = (await addTask(db, alpha, task, 'team'))!;
    expect(await setTaskDone(db, alpha, id, true)).toBe(true);
    expect((await listTasks(db, alpha)).find((entry) => entry.id === id)?.done).toBe(true);
    expect(await setTaskDone(db, alpha, id, false)).toBe(true);
    expect((await listTasks(db, alpha)).find((entry) => entry.id === id)?.done).toBe(false);
  });

  it('lets a team tick off a mentor task, and not edit or delete it', async () => {
    const id = (await addTask(db, alpha, task, 'mentor'))!;
    expect(await setTaskDone(db, alpha, id, true)).toBe(true);
    expect(await editTask(db, alpha, id, { ...task, title: 'Changed' }, 'team')).toBe(false);
    expect(await deleteTask(db, alpha, id, 'team')).toBe(false);
    expect((await listTasks(db, alpha)).find((entry) => entry.id === id)?.title).toBe('Book the wind tunnel');
  });

  it('lets a mentor edit and delete any task', async () => {
    const own = (await addTask(db, alpha, task, 'team'))!;
    const set = (await addTask(db, alpha, task, 'mentor'))!;
    expect(await editTask(db, alpha, own, { ...task, title: 'By mentor' }, 'mentor')).toBe(true);
    expect(await deleteTask(db, alpha, set, 'mentor')).toBe(true);
    const tasks = await listTasks(db, alpha);
    expect(tasks.find((entry) => entry.id === own)?.title).toBe('By mentor');
    expect(tasks.find((entry) => entry.id === set)).toBeUndefined();
  });

  it('clears a role and a date when a task is edited without them', async () => {
    const id = (await addTask(db, alpha, { title: 'Dated', ownerRole: 'Enterprise', dueDate: '2026-10-02' }, 'team'))!;
    expect(await editTask(db, alpha, id, { title: 'Dated', ownerRole: null, dueDate: null }, 'team')).toBe(true);
    expect((await listTasks(db, alpha)).find((entry) => entry.id === id)).toMatchObject({
      ownerRole: null,
      dueDate: null,
    });
  });

  it('never lets one team read, tick, edit or delete the task of another', async () => {
    const id = (await addTask(db, alpha, { ...task, title: 'Alpha only' }, 'team'))!;
    expect((await listTasks(db, beta)).map((entry) => entry.id)).not.toContain(id);
    expect(await setTaskDone(db, beta, id, true)).toBe(false);
    expect(await editTask(db, beta, id, { ...task, title: 'Taken' }, 'team')).toBe(false);
    expect(await editTask(db, beta, id, { ...task, title: 'Taken' }, 'mentor')).toBe(false);
    expect(await deleteTask(db, beta, id, 'team')).toBe(false);
    expect(await deleteTask(db, beta, id, 'mentor')).toBe(false);
    expect((await listTasks(db, alpha)).find((entry) => entry.id === id)).toMatchObject({
      title: 'Alpha only',
      done: false,
    });
  });

  it('stops at 200 tasks for a team, and leaves other teams free', async () => {
    const team = (await createTeam(db, { slug: 'test-full', name: 'Test Full', codeHash: 'scrypt.g.g' }))!;
    for (let i = 0; i < 200; i += 1) expect(await addTask(db, team.id, task, 'team')).toBeTypeOf('number');
    expect(await addTask(db, team.id, task, 'team')).toBeUndefined();
    expect(await addTask(db, team.id, task, 'mentor')).toBeUndefined();
    expect(await listTasks(db, team.id)).toHaveLength(200);
    expect(await addTask(db, beta, task, 'team')).toBeTypeOf('number');
  });

  it('stores text as text, whatever it holds', async () => {
    const title = `Robert'); drop table tasks; -- <script>alert(1)</script> 🏁 $1`;
    const id = (await addTask(db, alpha, { ...task, title }, 'team'))!;
    expect((await listTasks(db, alpha)).find((entry) => entry.id === id)?.title).toBe(title);
  });
});

describe('notes and links', () => {
  it('has an empty note until one is saved', async () => {
    expect(await getNote(db, alpha)).toBe('');
    await setNote(db, alpha, 'Car body is at the printers.');
    await setNote(db, alpha, 'Car body is back.\nSanding next.');
    expect(await getNote(db, alpha)).toBe('Car body is back.\nSanding next.');
    expect(await getNote(db, beta)).toBe('');
  });

  it('adds and deletes a link, and keeps each team to its own', async () => {
    const id = (await addLink(db, alpha, { label: 'Drive folder', url: 'https://drive.google.com/x' }))!;
    expect(await listLinks(db, alpha)).toEqual([{ id, label: 'Drive folder', url: 'https://drive.google.com/x' }]);
    expect(await listLinks(db, beta)).toEqual([]);
    expect(await deleteLink(db, beta, id)).toBe(false);
    expect(await deleteLink(db, alpha, id)).toBe(true);
    expect(await listLinks(db, alpha)).toEqual([]);
  });

  it('stops at 30 links', async () => {
    for (let i = 0; i < 30; i += 1) {
      expect(await addLink(db, beta, { label: `Link ${i}`, url: 'https://example.org' })).toBeTypeOf('number');
    }
    expect(await addLink(db, beta, { label: 'One more', url: 'https://example.org' })).toBeUndefined();
  });

  it('will not hold a link that is not https, even if a check is missed', async () => {
    await expect(addLink(db, alpha, { label: 'Bad', url: 'javascript:alert(1)' })).rejects.toThrow();
  });
});

describe('activity', () => {
  it('counts one row for each change, for that team alone', async () => {
    const before = await countActivity(db, alpha);
    await recordActivity(db, alpha, 'task-add', new Date('2026-09-28T09:00:00Z'));
    await recordActivity(db, alpha, 'note', new Date('2026-09-28T09:05:00Z'));
    expect(await countActivity(db, alpha)).toBe(before + 2);
    expect(await countActivity(db, beta)).toBe(0);
  });
});

describe('deleting a team', () => {
  it('takes its rows with it', async () => {
    const team = (await createTeam(db, { slug: 'test-gone', name: 'Test Gone', codeHash: 'scrypt.h.h' }))!;
    await addTask(db, team.id, task, 'team');
    await setNote(db, team.id, 'note');
    await db.query('delete from teams where id = $1', [team.id]);
    expect(await listTasks(db, team.id)).toEqual([]);
    expect(await getNote(db, team.id)).toBe('');
  });
});
