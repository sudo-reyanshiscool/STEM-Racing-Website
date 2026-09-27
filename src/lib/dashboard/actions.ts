// What happens when a form is sent. The pages hand the form over and show what comes back.
// No Astro imports, so the tests run these against a database inside the test process.
import { codeMatches, hashCode, makeCode, normaliseCode } from './codes';
import type { Db } from './db';
import { isDeliverableKey, isStatus } from './deliverables';
import { checkId, checkLink, checkNote, checkTask, LIMITS, text, type Errors } from './fields';
import { countAttempts, forgetAttempt, hashAddress, MAX_FAILURES, recordAttempt } from './limit';
import { mentorVersion, newSession, signSession, type Session } from './session';
import {
  addLink,
  addTask,
  createTeam,
  deleteLink,
  deleteTask,
  editTask,
  getTeam,
  listTeamsWithCodes,
  recordActivity,
  resetCode,
  setArchived,
  setDeliverable,
  setNote,
  setTaskDone,
  type Author,
} from './store';

// Signing in

export type SignInResult =
  | { ok: true; session: Session; cookie: string; next: '/dashboard/team' | '/dashboard/mentor' }
  | { ok: false; reason: 'blocked' | 'unknown' | 'closed'; message: string };

export const SIGN_IN_MESSAGES = {
  blocked: 'Too many attempts. Try again in 15 minutes.',
  unknown: 'That code was not recognised.',
  closed: 'This workspace is closed. Ask your mentor.',
} as const;

export interface SignInInput {
  code: unknown;
  /** The address the request came from. */
  address: string;
  secret: string;
  /** The hash of the mentor code. Undefined when none is set, and then no mentor can sign in. */
  mentorCodeHash: string | undefined;
  now?: Date;
}

function refused(reason: keyof typeof SIGN_IN_MESSAGES): SignInResult {
  return { ok: false, reason, message: SIGN_IN_MESSAGES[reason] };
}

export async function signIn(db: Db, input: SignInInput): Promise<SignInResult> {
  const now = input.now ?? new Date();
  const address = hashAddress(input.address, input.secret);
  // Written down before the code is looked at, so that guesses sent together count together.
  const attempt = await recordAttempt(db, address, now);
  const forgotten = async (result: SignInResult) => {
    await forgetAttempt(db, attempt);
    return result;
  };
  // A refused attempt is forgotten, so that trying while blocked does not make the block longer.
  if ((await countAttempts(db, address, now)) > MAX_FAILURES) return forgotten(refused('blocked'));

  const code = normaliseCode(text(input.code));
  if (code !== undefined) {
    if (input.mentorCodeHash && (await codeMatches(code, input.mentorCodeHash))) {
      const version = mentorVersion(input.mentorCodeHash, input.secret);
      const session = newSession('mentor', null, version, now.getTime());
      return forgotten({ ok: true, session, cookie: signSession(session, input.secret), next: '/dashboard/mentor' });
    }
    for (const team of await listTeamsWithCodes(db)) {
      if (!(await codeMatches(code, team.codeHash))) continue;
      if (team.archived) return forgotten(refused('closed'));
      const session = newSession('team', team.id, team.codeVersion, now.getTime());
      return forgotten({ ok: true, session, cookie: signSession(session, input.secret), next: '/dashboard/team' });
    }
  }
  // The attempt stays written down: it failed.
  return refused('unknown');
}

// Forms

export type ActionResult =
  | { ok: true; action: string; notice: string; shownCode?: { team: string; code: string } }
  | {
      ok: false;
      /** The form that was sent, so the page can put the messages beside it. */
      action: string;
      errors: Errors;
      /** What the person typed, to put back in the form. */
      values: Record<string, string>;
    };

/** What the page says after each form. The page looks the text up by the name of the form. */
const NOTICES: Readonly<Record<string, string>> = {
  deliverable: 'Status saved.',
  'task-add': 'Task added.',
  'task-edit': 'Task saved.',
  'task-done': 'Task updated.',
  'task-delete': 'Task deleted.',
  note: 'Note saved.',
  'link-add': 'Link added.',
  'link-delete': 'Link deleted.',
  'team-archive': 'Team updated.',
};

/** The text for a form's name. Undefined for any other text, so an address cannot choose what the page says. */
export function noticeFor(action: string | null): string | undefined {
  return action !== null && Object.hasOwn(NOTICES, action) ? NOTICES[action] : undefined;
}

function done(action: string): ActionResult {
  return { ok: true, action, notice: noticeFor(action) ?? 'Saved.' };
}

/** For a form that names a row that is not there, or not this team's. */
const GONE = 'That item is no longer there.';

function fail(action: string, errors: Errors, values: Record<string, string> = {}): ActionResult {
  return { ok: false, action, errors, values };
}

function fields<Name extends string>(form: FormData, names: readonly Name[]): Record<Name, string> {
  return Object.fromEntries(names.map((name) => [name, text(form.get(name))])) as Record<Name, string>;
}

/**
 * A change to one team's workspace. The team id comes from the session, or for a mentor from
 * the address of the page, and never from the form.
 */
export async function workspaceAction(
  db: Db,
  teamId: number,
  author: Author,
  form: FormData,
  roles: readonly string[],
): Promise<ActionResult> {
  const action = text(form.get('action'));
  const result = await runWorkspaceAction(db, teamId, author, action, form, roles);
  // Only a team's own changes count toward its streak.
  if (result.ok && author === 'team') await recordActivity(db, teamId, action);
  return result;
}

async function runWorkspaceAction(
  db: Db,
  teamId: number,
  author: Author,
  action: string,
  form: FormData,
  roles: readonly string[],
): Promise<ActionResult> {
  switch (action) {
    case 'deliverable': {
      const key = text(form.get('key'));
      const status = text(form.get('status'));
      if (!isDeliverableKey(key) || !isStatus(status)) return fail(action, { form: 'Choose a status from the list.' });
      await setDeliverable(db, teamId, key, status);
      return done(action);
    }
    case 'task-add': {
      const values = fields(form, ['title', 'ownerRole', 'dueDate']);
      const checked = checkTask(values, roles);
      if (!checked.ok) return fail(action, checked.errors, values);
      const id = await addTask(db, teamId, checked.value, author);
      if (id === undefined) {
        return fail(action, { form: `A team can hold ${LIMITS.tasks} tasks. Delete one to add another.` }, values);
      }
      return done(action);
    }
    case 'task-edit': {
      const id = checkId(form.get('id'));
      const values = fields(form, ['title', 'ownerRole', 'dueDate']);
      if (id === undefined) return fail(action, { form: GONE });
      const checked = checkTask(values, roles);
      if (!checked.ok) return fail(action, checked.errors, { ...values, id: String(id) });
      if (!(await editTask(db, teamId, id, checked.value, author))) return fail(action, { form: GONE });
      return done(action);
    }
    case 'task-done': {
      const id = checkId(form.get('id'));
      const ticked = text(form.get('done')) === 'true';
      if (id === undefined || !(await setTaskDone(db, teamId, id, ticked))) return fail(action, { form: GONE });
      return done(action);
    }
    case 'task-delete': {
      const id = checkId(form.get('id'));
      if (id === undefined || !(await deleteTask(db, teamId, id, author))) return fail(action, { form: GONE });
      return done(action);
    }
    case 'note': {
      // The status note and the links are the team's own. A mentor reads them.
      if (author !== 'team') return fail(action, { form: 'Only the team can change its note.' });
      const values = { note: typeof form.get('note') === 'string' ? (form.get('note') as string) : '' };
      const checked = checkNote(values.note);
      if (!checked.ok) return fail(action, checked.errors, values);
      await setNote(db, teamId, checked.value);
      return done(action);
    }
    case 'link-add': {
      if (author !== 'team') return fail(action, { form: 'Only the team can change its links.' });
      const values = fields(form, ['label', 'url']);
      const checked = checkLink(values);
      if (!checked.ok) return fail(action, checked.errors, values);
      const id = await addLink(db, teamId, checked.value);
      if (id === undefined) {
        return fail(action, { form: `A team can hold ${LIMITS.links} links. Delete one to add another.` }, values);
      }
      return done(action);
    }
    case 'link-delete': {
      if (author !== 'team') return fail(action, { form: 'Only the team can change its links.' });
      const id = checkId(form.get('id'));
      if (id === undefined || !(await deleteLink(db, teamId, id))) return fail(action, { form: GONE });
      return done(action);
    }
    default:
      return fail(action, { form: 'That form was not recognised.' });
  }
}

// Mentors

const NAME_MAX = 80;

/** "N!TRO" becomes "n-tro". Empty when the name holds no letter or digit of the Latin alphabet. */
export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** The code to store: the one typed, or a new one when the field was left empty. */
async function chooseCode(
  db: Db,
  typed: string,
  mentorCodeHash: string | undefined,
  exceptTeam?: number,
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  if (typed === '') return { ok: true, code: makeCode() };
  const code = normaliseCode(typed);
  if (code === undefined) return { ok: false, error: 'Use 6 to 32 letters and digits. Hyphens and spaces are ignored.' };
  const inUse = 'That code is in use. Choose another.';
  if (mentorCodeHash && (await codeMatches(code, mentorCodeHash))) return { ok: false, error: inUse };
  for (const team of await listTeamsWithCodes(db)) {
    if (team.id !== exceptTeam && (await codeMatches(code, team.codeHash))) return { ok: false, error: inUse };
  }
  // Shown as it was typed, in capitals, so that it reads as the mentor wrote it.
  return { ok: true, code: typed.toUpperCase().replace(/\s+/g, ' ') };
}

export async function mentorAction(db: Db, form: FormData, mentorCodeHash: string | undefined): Promise<ActionResult> {
  const action = text(form.get('action'));
  switch (action) {
    case 'team-add': {
      const values = fields(form, ['name']);
      const name = values.name;
      const slug = slugify(name);
      const errors: Errors = {};
      if (name === '') errors.name = 'Give the team a name.';
      else if ([...name].length > NAME_MAX) errors.name = `Keep the name to ${NAME_MAX} characters or fewer.`;
      else if (slug === '') errors.name = 'Use a letter or a digit in the name.';
      const chosen = await chooseCode(db, text(form.get('code')), mentorCodeHash);
      if (!chosen.ok) errors.code = chosen.error;
      if (!chosen.ok || Object.keys(errors).length > 0) return fail(action, errors, values);
      const team = await createTeam(db, { slug, name, codeHash: await hashCode(chosen.code) });
      if (!team) return fail(action, { name: 'A team with this name is already here.' }, values);
      return { ok: true, action, notice: `${team.name} was added.`, shownCode: { team: team.name, code: chosen.code } };
    }
    case 'code-reset': {
      const id = checkId(form.get('id'));
      const team = id === undefined ? undefined : await getTeam(db, id);
      if (!team) return fail(action, { form: GONE });
      const chosen = await chooseCode(db, text(form.get('code')), mentorCodeHash, team.id);
      if (!chosen.ok) return fail(action, { code: chosen.error }, { id: String(team.id) });
      await resetCode(db, team.id, await hashCode(chosen.code));
      return {
        ok: true,
        action,
        notice: `${team.name} has a new code. Everyone using the old code is signed out.`,
        shownCode: { team: team.name, code: chosen.code },
      };
    }
    case 'team-archive': {
      const id = checkId(form.get('id'));
      const archived = text(form.get('archived')) === 'true';
      const team = id === undefined ? undefined : await getTeam(db, id);
      if (!team || !(await setArchived(db, team.id, archived))) return fail(action, { form: GONE });
      return done(action);
    }
    default:
      return fail(action, { form: 'That form was not recognised.' });
  }
}

