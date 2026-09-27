import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mentorAction, noticeFor, signIn, slugify, workspaceAction } from '../../src/lib/dashboard/actions';
import { hashCode } from '../../src/lib/dashboard/codes';
import { readSession } from '../../src/lib/dashboard/session';
import { countActivity, getNote, getTeam, listLinks, listTasks, listTeams } from '../../src/lib/dashboard/store';
import { loadWorkspace } from '../../src/lib/dashboard/workspace';
import { testDb, type TestDb } from '../helpers/database';

// Codes made up for these tests. None is in use anywhere.
const MENTOR_CODE = 'TEST-MENTOR-01';
const ALPHA_CODE = 'TEST-ALPHA-01';
const BETA_CODE = 'TEST-BETA-01';

const SECRET = 's'.repeat(32);
const ROLES = ['Design and engineering', 'Enterprise', 'Project management'];
const NOW = new Date('2026-09-28T09:00:00Z');

let db: TestDb;
let mentorHash: string;
let alpha: number;
let beta: number;

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(values)) data.set(name, value);
  return data;
}

const asMentor = (values: Record<string, string>) => mentorAction(db, form(values), mentorHash);
const asTeam = (teamId: number, values: Record<string, string>) =>
  workspaceAction(db, teamId, 'team', form(values), ROLES);
const asMentorOn = (teamId: number, values: Record<string, string>) =>
  workspaceAction(db, teamId, 'mentor', form(values), ROLES);
const enter = (code: unknown, address = '203.0.113.1', now = NOW) =>
  signIn(db, { code, address, secret: SECRET, mentorCodeHash: mentorHash, now });

async function teamId(slug: string): Promise<number> {
  const team = (await listTeams(db)).find((entry) => entry.slug === slug);
  if (!team) throw new Error(`No team ${slug}`);
  return team.id;
}

beforeAll(async () => {
  db = await testDb();
  mentorHash = await hashCode(MENTOR_CODE);
  await asMentor({ action: 'team-add', name: 'Test Alpha', code: ALPHA_CODE });
  await asMentor({ action: 'team-add', name: 'Test Beta', code: BETA_CODE });
  alpha = await teamId('test-alpha');
  beta = await teamId('test-beta');
});

afterAll(() => db.close());

describe('notices', () => {
  it('has text for a form it knows and none for anything else', () => {
    expect(noticeFor('task-add')).toBe('Task added.');
    for (const key of ['', 'constructor', 'toString', '__proto__', '<script>', null]) {
      expect(noticeFor(key)).toBeUndefined();
    }
  });
});

describe('slugs', () => {
  it.each([
    ['N!TRO', 'n-tro'],
    ['Vortex Grand Prix', 'vortex-grand-prix'],
    ['  The   Beasts  ', 'the-beasts'],
    ['Équipe Zéro', 'equipe-zero'],
    ['!!!', ''],
    ['टीम', ''],
  ])('turns %s into "%s"', (name, slug) => {
    expect(slugify(name)).toBe(slug);
  });
});

describe('signing in', () => {
  it('opens the workspace of the team whose code it is', async () => {
    const result = await enter(ALPHA_CODE);
    expect(result).toMatchObject({ ok: true, next: '/dashboard/team', session: { role: 'team', teamId: alpha } });
    if (result.ok) expect(readSession(result.cookie, SECRET, NOW.getTime())).toEqual(result.session);
  });

  it('reads the code whatever its case, spaces and hyphens', async () => {
    expect(await enter(' test alpha 01 ')).toMatchObject({ ok: true, session: { teamId: alpha } });
    expect(await enter('testbeta01')).toMatchObject({ ok: true, session: { teamId: beta } });
  });

  it('opens the mentor pages with the mentor code', async () => {
    expect(await enter(MENTOR_CODE)).toMatchObject({
      ok: true,
      next: '/dashboard/mentor',
      session: { role: 'mentor', teamId: null },
    });
  });

  it('lets no one in as a mentor when no mentor code is set', async () => {
    const result = await signIn(db, {
      code: MENTOR_CODE,
      address: '203.0.113.2',
      secret: SECRET,
      mentorCodeHash: undefined,
      now: NOW,
    });
    expect(result).toMatchObject({ ok: false, reason: 'unknown' });
  });

  it.each([
    ['a wrong code', 'TEST-GAMMA-01'],
    ['an empty field', ''],
    ['a missing field', null],
    ['a file', new Blob(['TEST-ALPHA-01'])],
    ['a symbol', 'TEST-ALPHA-0!'],
    ['a stored hash', 'scrypt.a.a'],
    ['a very long entry', 'A'.repeat(100_000)],
  ])('refuses %s with one message', async (_name, code) => {
    const address = `203.0.113.${Math.floor(Math.random() * 1e9)}`;
    expect(await enter(code, address)).toEqual({
      ok: false,
      reason: 'unknown',
      message: 'That code was not recognised.',
    });
  });

  it('blocks an address after five failures, even with the right code, for 15 minutes', async () => {
    const address = '198.51.100.20';
    for (let i = 0; i < 5; i += 1) expect(await enter('TEST-WRONG-01', address)).toMatchObject({ reason: 'unknown' });
    expect(await enter(ALPHA_CODE, address)).toEqual({
      ok: false,
      reason: 'blocked',
      message: 'Too many attempts. Try again in 15 minutes.',
    });
    expect(await enter(ALPHA_CODE, '198.51.100.21')).toMatchObject({ ok: true });
    const later = new Date(NOW.getTime() + 15 * 60_000);
    expect(await enter(ALPHA_CODE, address, later)).toMatchObject({ ok: true });
  });

  it('does not count a blocked attempt as a new failure', async () => {
    const address = '198.51.100.22';
    for (let i = 0; i < 5; i += 1) await enter('TEST-WRONG-01', address);
    for (let i = 0; i < 20; i += 1) await enter('TEST-WRONG-01', address, new Date(NOW.getTime() + 14 * 60_000));
    expect(await enter(ALPHA_CODE, address, new Date(NOW.getTime() + 15 * 60_000))).toMatchObject({ ok: true });
  });

  it('tells an archived team that its workspace is closed', async () => {
    await asMentor({ action: 'team-add', name: 'Test Closed', code: 'TEST-CLOSED-01' });
    const id = await teamId('test-closed');
    await asMentor({ action: 'team-archive', id: String(id), archived: 'true' });
    expect(await enter('TEST-CLOSED-01', '203.0.113.30')).toEqual({
      ok: false,
      reason: 'closed',
      message: 'This workspace is closed. Ask your mentor.',
    });
    await asMentor({ action: 'team-archive', id: String(id), archived: 'false' });
    expect(await enter('TEST-CLOSED-01', '203.0.113.30')).toMatchObject({ ok: true });
  });
});

describe('a mentor making teams', () => {
  it('adds a team with the code the mentor typed, and shows the code once', async () => {
    const result = await asMentor({ action: 'team-add', name: 'N!TRO', code: 'test-nitro-01' });
    expect(result).toEqual({
      ok: true,
      action: 'team-add',
      notice: 'N!TRO was added.',
      shownCode: { team: 'N!TRO', code: 'TEST-NITRO-01' },
    });
    expect(await getTeam(db, await teamId('n-tro'))).toMatchObject({ name: 'N!TRO', archived: false });
    expect(await enter('TEST-NITRO-01', '203.0.113.40')).toMatchObject({ ok: true });
  });

  it('makes a code when the field is left empty', async () => {
    const result = await asMentor({ action: 'team-add', name: 'Test Made', code: '' });
    expect(result.ok).toBe(true);
    if (!result.ok || !result.shownCode) throw new Error('No code was shown');
    expect(result.shownCode.code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{3}-[A-Z2-9]{3}$/);
    expect(await enter(result.shownCode.code, '203.0.113.41')).toMatchObject({ ok: true });
  });

  it('stores no code, only hashes', async () => {
    const rows = await db.query<{ code_hash: string }>('select code_hash from teams');
    for (const row of rows) {
      expect(row.code_hash).toMatch(/^scrypt\./);
      expect(row.code_hash).not.toMatch(/TEST/i);
    }
  });

  it.each([
    ['the code of another team', ALPHA_CODE],
    ['the same code typed another way', 'test alpha 01'],
    ['the mentor code', MENTOR_CODE],
  ])('refuses %s', async (_name, code) => {
    expect(await asMentor({ action: 'team-add', name: 'Test Clash', code })).toEqual({
      ok: false,
      action: 'team-add',
      errors: { code: 'That code is in use. Choose another.' },
      values: { name: 'Test Clash' },
    });
    expect((await listTeams(db)).map((team) => team.slug)).not.toContain('test-clash');
  });

  it.each([
    ['too short', 'AB-12'],
    ['a symbol', 'TEST-CODE-0!'],
  ])('refuses a code that is %s', async (_name, code) => {
    expect(await asMentor({ action: 'team-add', name: 'Test Short', code })).toMatchObject({
      ok: false,
      errors: { code: 'Use 6 to 32 letters and digits. Hyphens and spaces are ignored.' },
    });
  });

  it('never gives the typed code back when it refuses', async () => {
    const result = await asMentor({ action: 'team-add', name: '', code: 'TEST-KEPT-01' });
    expect(JSON.stringify(result)).not.toContain('KEPT');
  });

  it.each([
    ['no name', '', 'Give the team a name.'],
    ['a name of 81 characters', 'a'.repeat(81), 'Keep the name to 80 characters or fewer.'],
    ['a name with no letter or digit', '!!!', 'Use a letter or a digit in the name.'],
    ['a name that is in use', 'Test Alpha', 'A team with this name is already here.'],
    ['a name that differs only in case and spacing', 'test   ALPHA', 'A team with this name is already here.'],
  ])('refuses %s', async (_name, name, message) => {
    expect(await asMentor({ action: 'team-add', name, code: '' })).toMatchObject({
      ok: false,
      errors: { name: message },
    });
  });

  it('resets a code: the new one works, the old one does not, and old sessions end', async () => {
    await asMentor({ action: 'team-add', name: 'Test Reset', code: 'TEST-RESET-01' });
    const id = await teamId('test-reset');
    const before = await enter('TEST-RESET-01', '203.0.113.50');
    const result = await asMentor({ action: 'code-reset', id: String(id), code: 'TEST-RESET-02' });
    expect(result).toMatchObject({ ok: true, shownCode: { team: 'Test Reset', code: 'TEST-RESET-02' } });
    expect(await enter('TEST-RESET-01', '203.0.113.50')).toMatchObject({ ok: false, reason: 'unknown' });
    expect(await enter('TEST-RESET-02', '203.0.113.50')).toMatchObject({ ok: true });
    if (!before.ok) throw new Error('The first sign-in failed');
    expect((await getTeam(db, id))?.codeVersion).toBe(before.session.codeVersion + 1);
  });

  it('lets a team keep its own code on a reset, and not take the code of another', async () => {
    const id = await teamId('test-reset');
    expect(await asMentor({ action: 'code-reset', id: String(id), code: 'TEST-RESET-02' })).toMatchObject({ ok: true });
    expect(await asMentor({ action: 'code-reset', id: String(id), code: ALPHA_CODE })).toMatchObject({
      ok: false,
      errors: { code: 'That code is in use. Choose another.' },
    });
  });

  it.each([['code-reset'], ['team-archive']])('says so when %s names a team that is not there', async (action) => {
    expect(await asMentor({ action, id: '9999', code: '', archived: 'true' })).toMatchObject({
      ok: false,
      errors: { form: 'That item is no longer there.' },
    });
  });

  it('refuses a form it does not know', async () => {
    expect(await asMentor({ action: 'team-delete', id: String(alpha) })).toMatchObject({ ok: false });
    expect(await getTeam(db, alpha)).toBeDefined();
  });
});

describe('a team changing its workspace', () => {
  it('saves a status', async () => {
    expect(await asTeam(alpha, { action: 'deliverable', key: 'car', status: 'done' })).toEqual({
      ok: true,
      action: 'deliverable',
      notice: 'Status saved.',
    });
    const workspace = await loadWorkspace(db, alpha, undefined, '2026-09-28');
    expect(workspace.doneCount).toBe(1);
    expect(workspace.deliverables[0]).toEqual({ key: 'car', label: 'Car', status: 'done' });
  });

  it.each([
    ['an unknown line', { key: 'trophy', status: 'done' }],
    ['an unknown status', { key: 'car', status: 'finished' }],
    ['nothing', {}],
  ])('refuses a status for %s', async (_name, values) => {
    expect(await asTeam(alpha, { action: 'deliverable', ...values })).toMatchObject({ ok: false });
  });

  it('adds a task, and gives back what was typed when a field is wrong', async () => {
    expect(
      await asTeam(alpha, { action: 'task-add', title: 'Render the car', ownerRole: 'Enterprise', dueDate: '2026-10-02' }),
    ).toEqual({ ok: true, action: 'task-add', notice: 'Task added.' });
    expect(await asTeam(alpha, { action: 'task-add', title: '', ownerRole: 'Enterprise', dueDate: '2026-09-31' })).toEqual({
      ok: false,
      action: 'task-add',
      errors: { title: 'Give the task a title.', dueDate: 'Use a date on the calendar, in the form 2026-10-02.' },
      values: { title: '', ownerRole: 'Enterprise', dueDate: '2026-09-31' },
    });
  });

  it('ticks off a mentor task, and cannot edit or delete it', async () => {
    await asMentorOn(alpha, { action: 'task-add', title: 'Send the AI declaration', ownerRole: '', dueDate: '' });
    const task = (await listTasks(db, alpha)).find((entry) => entry.createdBy === 'mentor');
    if (!task) throw new Error('No mentor task');
    const id = String(task.id);
    expect(await asTeam(alpha, { action: 'task-done', id, done: 'true' })).toMatchObject({ ok: true });
    expect(await asTeam(alpha, { action: 'task-edit', id, title: 'Changed', ownerRole: '', dueDate: '' })).toMatchObject({
      ok: false,
      errors: { form: 'That item is no longer there.' },
    });
    expect(await asTeam(alpha, { action: 'task-delete', id })).toMatchObject({ ok: false });
    expect((await listTasks(db, alpha)).find((entry) => entry.id === task.id)).toMatchObject({
      title: 'Send the AI declaration',
      done: true,
    });
  });

  it('cannot touch the task of another team, whatever id it sends', async () => {
    await asTeam(beta, { action: 'task-add', title: 'Beta only', ownerRole: '', dueDate: '' });
    const task = (await listTasks(db, beta)).find((entry) => entry.title === 'Beta only');
    if (!task) throw new Error('No task');
    const id = String(task.id);
    const attempts: Record<string, string>[] = [
      { action: 'task-done', id, done: 'true' },
      { action: 'task-edit', id, title: 'Taken', ownerRole: '', dueDate: '' },
      { action: 'task-delete', id },
    ];
    for (const values of attempts) {
      expect(await asTeam(alpha, values)).toMatchObject({ ok: false, errors: { form: 'That item is no longer there.' } });
    }
    expect((await listTasks(db, beta)).find((entry) => entry.id === task.id)).toMatchObject({
      title: 'Beta only',
      done: false,
    });
  });

  it('ignores a team id sent in the form', async () => {
    await asTeam(alpha, { action: 'note', note: 'Alpha wrote this.', teamId: String(beta), team_id: String(beta) });
    expect(await getNote(db, alpha)).toBe('Alpha wrote this.');
    expect(await getNote(db, beta)).toBe('');
  });

  it('saves a note with its line breaks, and refuses one that is too long', async () => {
    expect(await asTeam(alpha, { action: 'note', note: 'Body is back.\nSanding next.' })).toMatchObject({ ok: true });
    expect(await getNote(db, alpha)).toBe('Body is back.\nSanding next.');
    expect(await asTeam(alpha, { action: 'note', note: 'a'.repeat(2001) })).toMatchObject({
      ok: false,
      errors: { note: 'Keep the note to 2000 characters or fewer.' },
    });
    expect(await getNote(db, alpha)).toBe('Body is back.\nSanding next.');
  });

  it('adds and deletes a link, and refuses an address that is not https', async () => {
    expect(await asTeam(alpha, { action: 'link-add', label: 'Drive', url: 'https://drive.google.com/x' })).toMatchObject({
      ok: true,
    });
    expect(await asTeam(alpha, { action: 'link-add', label: 'Bad', url: 'javascript:alert(1)' })).toEqual({
      ok: false,
      action: 'link-add',
      errors: { url: 'The address must start with https://' },
      values: { label: 'Bad', url: 'javascript:alert(1)' },
    });
    const [link] = await listLinks(db, alpha);
    expect(await asTeam(beta, { action: 'link-delete', id: String(link?.id) })).toMatchObject({ ok: false });
    expect(await asTeam(alpha, { action: 'link-delete', id: String(link?.id) })).toMatchObject({ ok: true });
    expect(await listLinks(db, alpha)).toEqual([]);
  });

  it.each([['0'], ['-1'], ['1.5'], ['abc'], [''], ['1 or 1=1']])('refuses the id "%s"', async (id) => {
    expect(await asTeam(alpha, { action: 'task-delete', id })).toMatchObject({
      ok: false,
      errors: { form: 'That item is no longer there.' },
    });
  });

  it('refuses a form it does not know, and a form with no name', async () => {
    expect(await asTeam(alpha, { action: 'team-archive', id: String(beta), archived: 'true' })).toMatchObject({ ok: false });
    expect(await asTeam(alpha, {})).toMatchObject({ ok: false, errors: { form: 'That form was not recognised.' } });
    expect((await getTeam(db, beta))?.archived).toBe(false);
  });
});

describe('a mentor on a team workspace', () => {
  it('sets a task, edits a team task and changes a status', async () => {
    expect(await asMentorOn(beta, { action: 'task-add', title: 'From mentor', ownerRole: '', dueDate: '' })).toMatchObject({
      ok: true,
    });
    const own = (await listTasks(db, beta)).find((entry) => entry.createdBy === 'team');
    expect(
      await asMentorOn(beta, { action: 'task-edit', id: String(own?.id), title: 'Edited', ownerRole: '', dueDate: '' }),
    ).toMatchObject({ ok: true });
    expect(await asMentorOn(beta, { action: 'deliverable', key: 'renders', status: 'in_progress' })).toMatchObject({
      ok: true,
    });
  });

  it('cannot change the note or the links of a team', async () => {
    expect(await asMentorOn(beta, { action: 'note', note: 'By mentor' })).toMatchObject({ ok: false });
    expect(await asMentorOn(beta, { action: 'link-add', label: 'X', url: 'https://example.org' })).toMatchObject({
      ok: false,
    });
    expect(await getNote(db, beta)).toBe('');
    expect(await listLinks(db, beta)).toEqual([]);
  });
});

describe('activity', () => {
  it('counts a change a team made, and not one that was refused or made by a mentor', async () => {
    await asMentor({ action: 'team-add', name: 'Test Active', code: '' });
    const id = await teamId('test-active');
    expect(await countActivity(db, id)).toBe(0);
    await asTeam(id, { action: 'note', note: 'First.' });
    expect(await countActivity(db, id)).toBe(1);
    await asTeam(id, { action: 'task-add', title: '', ownerRole: '', dueDate: '' });
    await asMentorOn(id, { action: 'task-add', title: 'From mentor', ownerRole: '', dueDate: '' });
    expect(await countActivity(db, id)).toBe(1);
  });
});

describe('the workspace', () => {
  it('flags an overdue task in words and sorts mentor tasks first', async () => {
    await asMentor({ action: 'team-add', name: 'Test View', code: '' });
    const id = await teamId('test-view');
    await asTeam(id, { action: 'task-add', title: 'Late', ownerRole: '', dueDate: '2026-09-20' });
    await asTeam(id, { action: 'task-add', title: 'Soon', ownerRole: '', dueDate: '2026-10-20' });
    await asMentorOn(id, { action: 'task-add', title: 'Set by mentor', ownerRole: '', dueDate: '' });
    const workspace = await loadWorkspace(db, id, undefined, '2026-09-28');
    expect(workspace.tasks.map((task) => [task.title, task.overdue])).toEqual([
      ['Set by mentor', false],
      ['Late', true],
      ['Soon', false],
    ]);
    expect(workspace.deadline).toBeUndefined();
    expect(workspace.deliverables).toHaveLength(10);
    expect(workspace.doneCount).toBe(0);
  });
});
