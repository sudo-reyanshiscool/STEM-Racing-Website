# Team Dashboard, Stage 1: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Teams and mentors sign in with an access code; a team tracks deliverables, deadlines, tasks, notes and links; a mentor adds teams, resets codes and archives teams.

**Architecture:** The public site stays static. Pages under `src/pages/dashboard/` are rendered on request through the `@astrojs/vercel` adapter, behind one middleware that reads a signed cookie. All logic lives in `src/lib/dashboard/` as plain TypeScript that takes a `Db` as its first argument, so tests run it against PGlite, which is Postgres inside the test process. The pages are thin: they hand a form to an action and show what comes back.

**Tech Stack:** Astro 7, `@astrojs/vercel` 11, TypeScript, plain CSS, Supabase Postgres through the `postgres` package, PGlite and `pglite-socket` for tests and local work, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-27-team-dashboard-design.md`

**Stages 2 and 3** (mentor overview table, mentor notes, announcements, streaks, holidays) get plans of their own when this one is done.

## How this plan was made

Every file in this plan was drafted and run in a scratch copy of the site before it was written down. In that copy: 647 tests pass and 9 are skipped, `npm run check` reports 0 errors and 0 warnings, and the sign-in, team and mentor pages were exercised over HTTP and looked at in a browser at 375 and 800 wide. The scratch copy is thrown away. Nothing in the repository was changed.

Five things were found by running the draft, and the plan carries the fix for each:

| Found | Fix in the plan |
|---|---|
| The adapter builds the public pages into `dist/client/`, not `dist/`. It does so only when one page or more is rendered on request. | Task 9 adds the adapter and the first such page together, and changes the four places that read `dist/`. |
| A hash written as `scrypt$salt$key` lost its salt in `.env`, where `$` starts a variable. No mentor could sign in. | The stored form is `scrypt.salt.key`. Task 1 tests that a hash holds no `$`. |
| When the database was down and a form was sent, the page was a raw error, because a request whose body has been read cannot be passed on. | The middleware passes on a new request. Task 10 checks it by hand. |
| A ghost `Button` rendered as a `<button>` had white text on the browser's pale grey. | `.btn--ghost` sets `background: transparent`. Task 10 tests it. |
| The dashboard's CSS is sent inside its pages, so the brand tests in `tests/site` never read it. | Task 10 adds brand tests that read the source. |

## Global Constraints

- Node `>=22.12.0`. No UI framework and no Tailwind: `tests/unit/project.test.ts` fails on any package whose name holds `react`, `vue`, `svelte`, `solid`, `preact` or `tailwind`.
- `output` stays `'static'`. Only files under `src/pages/dashboard/` set `export const prerender = false`.
- Every colour comes from a token in `src/styles/tokens.css`. No hex value, `rgb()` or named colour in dashboard CSS.
- `--font-display` is used only by `h1`, `h2` and `.btn`, which exist already. Dashboard CSS never names it.
- No text is justified or right-aligned. No Verdana.
- A state is never shown by colour alone: "Overdue", "From your mentor", "Archived" and every refusal are words.
- No access code is written to the repository, a log, a test or a commit message. Tests use codes that begin `TEST-`. The user's own codes are typed by the user into the deployed mentor page and nowhere else.
- No invented content: a new database is empty. No team, task or name is seeded.
- No personal data: no names or email addresses of pupils. A task is owned by a role.
- The team id for every query comes from the session on the server, or for a mentor from the address of the page. No form field is read as a team id.
- Limits, from the spec: title 120 characters, note 2,000, link name 60, team name 80, 200 tasks and 30 links for each team. Links start with `https://`.
- Sign-in: 5 failed attempts from one address in 15 minutes block that address for 15 minutes. Sessions last 30 days.
- Dashboard pages send `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store`.
- The dashboard works with scripts off. No dashboard page adds a script.
- Code style: match the files beside it. Comments say why, in plain sentences. Two spaces, single quotes, semicolons, lines to about 120 characters.
- Commit messages follow the repository: `feat:`, `fix:`, `test:`, `docs:`. End each with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Work on the branch `team-dashboard`. Do not push, and do not merge into `main`, unless the user asks.

## Review Focus

Inputs and conditions the spec implies and a person will meet. Each has a test in the task named.

1. **A code typed another way.** `word 2abc`, `WORD-2ABC` and `word2abc` are one code, at sign-in and when a mentor chooses a code that a team already holds. Tests in Task 1 and Task 7.
2. **An id or a team id sent by hand.** A form that names the task of another team, an id of `0`, `-1`, `1.5` or `1 or 1=1`, or a `teamId` field, changes nothing. Tests in Task 4 and Task 7.
3. **A form sent while the database is down.** The person sees the "unavailable" page with status 503, not a raw error. Checked by hand in Task 10, step 9.
4. **An address that chooses its own message.** `?saved=constructor` and `?saved=<script>` show no notice. Test in Task 8.
5. **A page refreshed after a form.** A successful form answers with a redirect, so a refresh does not add the task twice. Checked by hand in Task 11, step 5.

## File Structure

| File | Job |
|---|---|
| `src/lib/dashboard/codes.ts` | Make, read, hash and compare access codes |
| `src/lib/dashboard/session.ts` | Sign and read the session cookie; make and check form tokens |
| `src/lib/dashboard/deliverables.ts` | The ten deliverables and three statuses |
| `src/lib/dashboard/fields.ts` | Check what was typed into a form |
| `src/lib/dashboard/db.ts` | The `Db` interface and the connection to Postgres |
| `src/lib/dashboard/store.ts` | Every SQL statement |
| `src/lib/dashboard/limit.ts` | The limit on failed sign-ins |
| `src/lib/dashboard/workspace.ts` | What the workspace shows, worked out from rows and the season |
| `src/lib/dashboard/actions.ts` | What happens when a form is sent |
| `src/lib/dashboard/runtime.ts` | Reads the settings. The only file here that imports from Astro. |
| `src/middleware.ts` | Guards `/dashboard` |
| `src/pages/dashboard/*` | Sign-in, team workspace, mentor page, sign-out, unavailable, keep-awake |
| `src/components/dashboard/Workspace.astro` | One team's workspace |
| `src/styles/dashboard.css` | Every dashboard style |
| `supabase/migrations/0001_dashboard_stage_1.sql` | The tables |
| `scripts/dashboard-*.ts` | Local database, migrations, hash of a code |
| `tests/helpers/database.ts` | A database inside the test process |
| `tests/unit/dashboard/*` | Tests that need no database |
| `tests/dashboard/*` | Tests that use the database |
| `tests/site/dashboard.test.ts` | What the build does with the dashboard |

---

### Task 1: Access codes

**Files:**
- Create: `src/lib/dashboard/codes.ts`
- Test: `tests/unit/dashboard/codes.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `makeCode(): string`, `formatCode(code: string): string`, `normaliseCode(input: string): string | undefined`, `hashCode(input: string): Promise<string>`, `codeMatches(input: string, stored: string): Promise<boolean>`, and the constants `CODE_ALPHABET`, `CODE_LENGTH` (10), `CODE_MIN` (6), `CODE_MAX` (32).

- [ ] **Step 1: Write the failing tests**

`tests/unit/dashboard/codes.test.ts`:

````ts
import { describe, expect, it } from 'vitest';
import { CODE_ALPHABET, codeMatches, formatCode, hashCode, makeCode, normaliseCode } from '../../../src/lib/dashboard/codes';

describe('access codes', () => {
  it('makes a code in three groups from letters and digits that are not easily confused', () => {
    for (let i = 0; i < 200; i += 1) {
      const code = makeCode();
      expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{3}-[A-Z2-9]{3}$/);
      expect(code).not.toMatch(/[0O1IL]/);
    }
  });

  it('does not repeat a code in 500 tries', () => {
    const codes = new Set(Array.from({ length: 500 }, makeCode));
    expect(codes.size).toBe(500);
  });

  it('has no confusable character in its alphabet', () => {
    expect(CODE_ALPHABET).toHaveLength(31);
    expect(CODE_ALPHABET).not.toMatch(/[0O1IL]/);
  });

  it('formats ten characters as 4-3-3', () => {
    expect(formatCode('K7QMX4P9RT')).toBe('K7QM-X4P-9RT');
  });

  it('reads a code whatever its case, spaces and hyphens', () => {
    expect(normaliseCode('K7QM-X4P-9RT')).toBe('K7QMX4P9RT');
    expect(normaliseCode('  k7qm x4p 9rt ')).toBe('K7QMX4P9RT');
    expect(normaliseCode('k7qmx4p9rt')).toBe('K7QMX4P9RT');
  });

  it('reads a code a mentor chose: a word, a hyphen and four characters', () => {
    expect(normaliseCode('WORD-2ABC')).toBe('WORD2ABC');
    expect(normaliseCode('longerword-2abc')).toBe('LONGERWORD2ABC');
  });

  it('allows 6 to 32 letters and digits', () => {
    expect(normaliseCode('ABC-123')).toBe('ABC123');
    expect(normaliseCode('A'.repeat(32))).toBe('A'.repeat(32));
  });

  it.each([
    ['empty', ''],
    ['hyphens alone', '------'],
    ['too short', 'AB-123'],
    ['too long', 'A'.repeat(33)],
    ['a symbol', 'WORD-2AB!'],
    ['a letter from another script', 'WORD-2ABЯ'],
    ['a very long entry', 'A'.repeat(100_000)],
  ])('refuses %s', (_name, input) => {
    expect(normaliseCode(input)).toBeUndefined();
  });

  it('matches a code with its own hash, however it is typed', async () => {
    const stored = await hashCode('K7QM-X4P-9RT');
    expect(await codeMatches('K7QM-X4P-9RT', stored)).toBe(true);
    expect(await codeMatches('k7qm x4p 9rt', stored)).toBe(true);
  });

  it('does not match another code', async () => {
    const stored = await hashCode('K7QM-X4P-9RT');
    expect(await codeMatches('K7QM-X4P-9RS', stored)).toBe(false);
    expect(await codeMatches('', stored)).toBe(false);
  });

  it('never stores the code and salts each hash', async () => {
    const first = await hashCode('K7QM-X4P-9RT');
    const second = await hashCode('K7QM-X4P-9RT');
    expect(first).toMatch(/^scrypt\.[\w-]+\.[\w-]+$/);
    // A dollar sign would be read as the start of a variable in a .env file.
    expect(first).not.toContain('$');
    expect(first).not.toContain('K7QM');
    expect(first).not.toBe(second);
  });

  it('refuses to hash something that is not a code', async () => {
    await expect(hashCode('hello')).rejects.toThrow('This is not an access code');
  });

  it.each([['empty', ''], ['no parts', 'scrypt'], ['another scheme', 'md5.abc.def'], ['a short key', 'scrypt.abcd.abcd']])(
    'does not match a stored value with %s',
    async (_name, stored) => {
      expect(await codeMatches('K7QM-X4P-9RT', stored)).toBe(false);
    },
  );
});
````


- [ ] **Step 2: Run the tests to see them fail**

Run: `npx vitest run tests/unit/dashboard/codes.test.ts`
Expected: FAIL. `Cannot find module '../../../src/lib/dashboard/codes'` or the like.


- [ ] **Step 3: Write the code**

`src/lib/dashboard/codes.ts`:

````ts
// Access codes. A code is shown once, when it is made, and stored only as a hash.
import { randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto';

/** Letters and digits that are not easily confused: no 0, O, 1, I or L. */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
/** The length of a code the dashboard makes. A mentor may choose a code of another length. */
export const CODE_LENGTH = 10;

const KEY_BYTES = 32;

/** "K7QMX4P9RT" becomes "K7QM-X4P-9RT". */
export function formatCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4, 7)}-${code.slice(7)}`;
}

export function makeCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return formatCode(code);
}

export const CODE_MIN = 6;
export const CODE_MAX = 32;

/**
 * What a person typed, as the letters and digits of a code. Case, spaces and hyphens do not
 * matter. Undefined when it cannot be a code, so that no hash is worked out for it.
 */
export function normaliseCode(input: string): string | undefined {
  // Nothing longer than this can be a code, and it keeps the work below small.
  if (input.length > CODE_MAX * 4) return undefined;
  const code = input.toUpperCase().replace(/[\s-]/g, '');
  return new RegExp(`^[A-Z0-9]{${CODE_MIN},${CODE_MAX}}$`).test(code) ? code : undefined;
}

function derive(code: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(code, salt, KEY_BYTES, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

/**
 * The stored form: "scrypt.salt.key", with a new salt for each code. The parts are joined by
 * dots because the mentor code's hash is kept in a .env file, where a dollar sign starts a variable.
 */
export async function hashCode(input: string): Promise<string> {
  const code = normaliseCode(input);
  if (code === undefined) throw new Error('This is not an access code');
  const salt = randomBytes(16);
  const key = await derive(code, salt);
  return `scrypt.${salt.toString('base64url')}.${key.toString('base64url')}`;
}

export async function codeMatches(input: string, stored: string): Promise<boolean> {
  const code = normaliseCode(input);
  const [scheme, salt, key] = stored.split('.');
  if (code === undefined || scheme !== 'scrypt' || !salt || !key) return false;
  const expected = Buffer.from(key, 'base64url');
  if (expected.length !== KEY_BYTES) return false;
  return timingSafeEqual(await derive(code, Buffer.from(salt, 'base64url')), expected);
}
````


- [ ] **Step 4: Run the tests to see them pass**

Run: `npx vitest run tests/unit/dashboard/codes.test.ts`
Expected: PASS, every test in the file.


- [ ] **Step 5: Commit**

```bash
git add src/lib/dashboard/codes.ts tests/unit/dashboard/codes.test.ts
git commit -m "feat: add access codes for the dashboard"
```


### Task 2: Sessions and form tokens

**Files:**
- Create: `src/lib/dashboard/session.ts`
- Test: `tests/unit/dashboard/session.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `interface Session { role: 'team' | 'mentor'; teamId: number | null; codeVersion: number; expires: number }`, `newSession(role, teamId, codeVersion, now?: number): Session`, `signSession(session, secret): string`, `readSession(value: string | undefined, secret, now?: number): Session | undefined`, `formToken(cookieValue, secret): string`, `formTokenMatches(token: unknown, cookieValue, secret): boolean`, and the constants `SESSION_COOKIE` (`'tbs_dashboard'`), `SESSION_DAYS` (30), `SESSION_SECONDS`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/dashboard/session.test.ts`:

````ts
import { describe, expect, it } from 'vitest';
import {
  formToken,
  formTokenMatches,
  newSession,
  readSession,
  SESSION_SECONDS,
  signSession,
  type Session,
} from '../../../src/lib/dashboard/session';

const SECRET = 'a'.repeat(32);
const NOW = Date.UTC(2026, 8, 28, 9, 0, 0);
const team: Session = newSession('team', 7, 3, NOW);

describe('sessions', () => {
  it('lasts 30 days', () => {
    expect(SESSION_SECONDS).toBe(2_592_000);
    expect(team.expires).toBe(NOW / 1000 + 2_592_000);
  });

  it('reads back what it signed', () => {
    expect(readSession(signSession(team, SECRET), SECRET, NOW)).toEqual(team);
    const mentor = newSession('mentor', null, 0, NOW);
    expect(readSession(signSession(mentor, SECRET), SECRET, NOW)).toEqual(mentor);
  });

  it('refuses a cookie signed with another secret', () => {
    expect(readSession(signSession(team, 'b'.repeat(32)), SECRET, NOW)).toBeUndefined();
  });

  it('refuses a cookie whose team was changed', () => {
    const [, signature] = signSession(team, SECRET).split('.');
    const forged = Buffer.from(JSON.stringify({ ...team, teamId: 8 })).toString('base64url');
    expect(readSession(`${forged}.${signature}`, SECRET, NOW)).toBeUndefined();
  });

  it('refuses a team cookie turned into a mentor cookie', () => {
    const [, signature] = signSession(team, SECRET).split('.');
    const forged = Buffer.from(JSON.stringify({ ...team, role: 'mentor', teamId: null })).toString('base64url');
    expect(readSession(`${forged}.${signature}`, SECRET, NOW)).toBeUndefined();
  });

  it('ends at its expiry and not before', () => {
    const cookie = signSession(team, SECRET);
    expect(readSession(cookie, SECRET, team.expires * 1000 - 1)).toEqual(team);
    expect(readSession(cookie, SECRET, team.expires * 1000)).toBeUndefined();
  });

  it.each([
    ['nothing', undefined],
    ['an empty value', ''],
    ['no dot', 'abc'],
    ['two dots', 'a.b.c'],
    ['no signature', 'abc.'],
    ['text that is not base64', '%%%.%%%'],
    ['a very long value', 'a'.repeat(100_000)],
  ])('refuses %s', (_name, value) => {
    expect(readSession(value, SECRET, NOW)).toBeUndefined();
  });

  it.each([
    ['a team session with no team', { role: 'team', teamId: null, codeVersion: 1, expires: 9_999_999_999 }],
    ['a mentor session with a team', { role: 'mentor', teamId: 3, codeVersion: 0, expires: 9_999_999_999 }],
    ['an unknown role', { role: 'admin', teamId: null, codeVersion: 0, expires: 9_999_999_999 }],
    ['a team id that is not a whole number', { role: 'team', teamId: '7', codeVersion: 1, expires: 9_999_999_999 }],
    ['no expiry', { role: 'team', teamId: 7, codeVersion: 1 }],
    ['a list', []],
  ])('refuses a signed cookie that holds %s', (_name, body) => {
    expect(readSession(signSession(body as unknown as Session, SECRET), SECRET, NOW)).toBeUndefined();
  });

  it('will not sign with a short secret', () => {
    expect(() => signSession(team, 'short')).toThrow('SESSION_SECRET needs 32 characters or more');
  });
});

describe('form tokens', () => {
  const cookie = signSession(team, SECRET);

  it('matches the cookie it was made for', () => {
    expect(formTokenMatches(formToken(cookie, SECRET), cookie, SECRET)).toBe(true);
  });

  it('does not match another session', () => {
    const other = signSession(newSession('team', 8, 1, NOW), SECRET);
    expect(formTokenMatches(formToken(other, SECRET), cookie, SECRET)).toBe(false);
  });

  it.each([['nothing', undefined], ['an empty value', ''], ['a file', new Blob(['x'])], ['a wrong value', 'abc']])(
    'does not match %s',
    (_name, token) => {
      expect(formTokenMatches(token, cookie, SECRET)).toBe(false);
    },
  );

  it('is not the session signature', () => {
    expect(cookie).not.toContain(formToken(cookie, SECRET));
  });
});
````


- [ ] **Step 2: Run the tests to see them fail**

Run: `npx vitest run tests/unit/dashboard/session.test.ts`
Expected: FAIL. The module is missing.


- [ ] **Step 3: Write the code**

`src/lib/dashboard/session.ts`:

````ts
// The signed cookie that keeps a team or a mentor signed in. No Astro imports.
import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'tbs_dashboard';
export const SESSION_DAYS = 30;
export const SESSION_SECONDS = SESSION_DAYS * 24 * 60 * 60;

export interface Session {
  role: 'team' | 'mentor';
  /** The team a team session belongs to. Null for a mentor. */
  teamId: number | null;
  /** The team's code_version when the session began. 0 for a mentor. */
  codeVersion: number;
  /** When the session ends, in seconds since 1970. */
  expires: number;
}

const MIN_SECRET = 32;

function mac(text: string, secret: string): Buffer {
  if (secret.length < MIN_SECRET) throw new Error(`SESSION_SECRET needs ${MIN_SECRET} characters or more`);
  return createHmac('sha256', secret).update(text).digest();
}

function sameBytes(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

export function newSession(role: Session['role'], teamId: number | null, codeVersion: number, now = Date.now()): Session {
  return { role, teamId, codeVersion, expires: Math.floor(now / 1000) + SESSION_SECONDS };
}

/** The cookie value: the session as base64url JSON, a dot, and its signature. */
export function signSession(session: Session, secret: string): string {
  const body = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${body}.${mac(`session:${body}`, secret).toString('base64url')}`;
}

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  const teamOk =
    s.role === 'team' ? Number.isInteger(s.teamId) && (s.teamId as number) > 0 : s.role === 'mentor' && s.teamId === null;
  return teamOk && Number.isInteger(s.codeVersion) && Number.isInteger(s.expires);
}

/** The session in a cookie value. Undefined when it is missing, altered, malformed or past its end. */
export function readSession(value: string | undefined, secret: string, now = Date.now()): Session | undefined {
  if (!value) return undefined;
  const [body, signature, ...rest] = value.split('.');
  if (!body || !signature || rest.length > 0) return undefined;
  if (!sameBytes(Buffer.from(signature, 'base64url'), mac(`session:${body}`, secret))) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return undefined;
  }
  if (!isSession(parsed) || parsed.expires * 1000 <= now) return undefined;
  return parsed;
}

/** The token a form carries. It belongs to one cookie value, so it ends when the session does. */
export function formToken(cookieValue: string, secret: string): string {
  return mac(`form:${cookieValue}`, secret).toString('base64url');
}

export function formTokenMatches(token: unknown, cookieValue: string, secret: string): boolean {
  if (typeof token !== 'string' || token === '') return false;
  return sameBytes(Buffer.from(token, 'base64url'), mac(`form:${cookieValue}`, secret));
}
````


- [ ] **Step 4: Run the tests to see them pass**

Run: `npx vitest run tests/unit/dashboard/session.test.ts`
Expected: PASS, every test in the file.


- [ ] **Step 5: Commit**

```bash
git add src/lib/dashboard/session.ts tests/unit/dashboard/session.test.ts
git commit -m "feat: add signed sessions and form tokens"
```


### Task 3: Deliverables and form fields

**Files:**
- Create: `src/lib/dashboard/deliverables.ts`
- Create: `src/lib/dashboard/fields.ts`
- Test: `tests/unit/dashboard/fields.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: From `deliverables.ts`: `DELIVERABLES`, `STATUSES`, the types `DeliverableKey` and `Status`, `isDeliverableKey(value: unknown)`, `isStatus(value: unknown)`. From `fields.ts`: `LIMITS`, the types `Errors`, `Checked<T>`, `TaskFields { title: string; ownerRole: string | null; dueDate: string | null }`, `LinkFields { label: string; url: string }`, and `text(value: unknown): string`, `isIsoDate(value: string): boolean`, `checkTask(input, roles): Checked<TaskFields>`, `checkNote(input: unknown): Checked<string>`, `checkLink(input): Checked<LinkFields>`, `checkId(input: unknown): number | undefined`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/dashboard/fields.test.ts`:

````ts
import { describe, expect, it } from 'vitest';
import { DELIVERABLES, isDeliverableKey, isStatus, STATUSES } from '../../../src/lib/dashboard/deliverables';
import { checkId, checkLink, checkNote, checkTask, isIsoDate, text } from '../../../src/lib/dashboard/fields';

const ROLES = ['Design and engineering', 'Enterprise', 'Project management'];

describe('deliverables', () => {
  it('lists the ten lines in the order the spec gives', () => {
    expect(DELIVERABLES.map((item) => item.label)).toEqual([
      'Car',
      'Engineering Drawings',
      'Renders',
      'Engineering Portfolio',
      'Enterprise Portfolio',
      'Project Management Portfolio',
      'AI Declaration',
      'Pit Display',
      'Verbal Presentation Script',
      'Verbal Presentation Video',
    ]);
  });

  it('gives each line its own key', () => {
    expect(new Set(DELIVERABLES.map((item) => item.key)).size).toBe(10);
  });

  it('has three statuses', () => {
    expect(STATUSES.map((status) => status.value)).toEqual(['not_started', 'in_progress', 'done']);
  });

  it('knows its keys and statuses from anything else', () => {
    expect(isDeliverableKey('car')).toBe(true);
    expect(isDeliverableKey('Car')).toBe(false);
    expect(isDeliverableKey(undefined)).toBe(false);
    expect(isStatus('done')).toBe(true);
    expect(isStatus('finished')).toBe(false);
    expect(isStatus(null)).toBe(false);
  });
});

describe('text', () => {
  it('trims, and treats a file or a missing field as empty', () => {
    expect(text('  hello  ')).toBe('hello');
    expect(text(null)).toBe('');
    expect(text(undefined)).toBe('');
    expect(text(new Blob(['x']))).toBe('');
  });

  it('drops the null character, which Postgres refuses', () => {
    expect(text('a\u0000b')).toBe('ab');
  });
});

describe('dates', () => {
  it('accepts a date on the calendar', () => {
    expect(isIsoDate('2026-10-02')).toBe(true);
    expect(isIsoDate('2028-02-29')).toBe(true);
  });

  it.each(['2026-09-31', '2026-13-01', '2027-02-29', '02/10/2026', '2026-1-2', '', '2026-10-02T00:00'])(
    'refuses %s',
    (value) => {
      expect(isIsoDate(value)).toBe(false);
    },
  );
});

describe('a task', () => {
  it('passes with a title alone', () => {
    expect(checkTask({ title: ' Book the wind tunnel ', ownerRole: '', dueDate: '' }, ROLES)).toEqual({
      ok: true,
      value: { title: 'Book the wind tunnel', ownerRole: null, dueDate: null },
    });
  });

  it('keeps a role and a date', () => {
    expect(checkTask({ title: 'Render the car', ownerRole: 'Enterprise', dueDate: '2026-10-02' }, ROLES)).toEqual({
      ok: true,
      value: { title: 'Render the car', ownerRole: 'Enterprise', dueDate: '2026-10-02' },
    });
  });

  it('needs a title', () => {
    expect(checkTask({ title: '   ', ownerRole: '', dueDate: '' }, ROLES)).toEqual({
      ok: false,
      errors: { title: 'Give the task a title.' },
    });
    expect(checkTask({ title: undefined, ownerRole: undefined, dueDate: undefined }, ROLES).ok).toBe(false);
  });

  it('allows 120 characters and refuses 121', () => {
    expect(checkTask({ title: 'a'.repeat(120), ownerRole: '', dueDate: '' }, ROLES).ok).toBe(true);
    expect(checkTask({ title: 'a'.repeat(121), ownerRole: '', dueDate: '' }, ROLES)).toEqual({
      ok: false,
      errors: { title: 'Keep the title to 120 characters or fewer.' },
    });
  });

  it('counts an emoji as one character', () => {
    expect(checkTask({ title: '🏁'.repeat(120), ownerRole: '', dueDate: '' }, ROLES).ok).toBe(true);
  });

  it('reports every field that is wrong', () => {
    expect(checkTask({ title: '', ownerRole: 'Driver', dueDate: '2026-09-31' }, ROLES)).toEqual({
      ok: false,
      errors: {
        title: 'Give the task a title.',
        ownerRole: 'Choose a role from the list.',
        dueDate: 'Use a date on the calendar, in the form 2026-10-02.',
      },
    });
  });
});

describe('a note', () => {
  it('may be empty', () => {
    expect(checkNote('')).toEqual({ ok: true, value: '' });
    expect(checkNote(undefined)).toEqual({ ok: true, value: '' });
  });

  it('allows 2,000 characters and refuses 2,001', () => {
    expect(checkNote('a'.repeat(2000)).ok).toBe(true);
    expect(checkNote('a'.repeat(2001))).toEqual({
      ok: false,
      errors: { note: 'Keep the note to 2000 characters or fewer.' },
    });
  });

  it('keeps line breaks inside the note', () => {
    expect(checkNote('one\ntwo')).toEqual({ ok: true, value: 'one\ntwo' });
  });
});

describe('a link', () => {
  it('passes with a name and an https address', () => {
    expect(checkLink({ label: 'Drive folder', url: 'https://drive.google.com/drive/folders/abc' })).toEqual({
      ok: true,
      value: { label: 'Drive folder', url: 'https://drive.google.com/drive/folders/abc' },
    });
  });

  it.each([
    ['http', 'http://example.org'],
    ['javascript', 'javascript:alert(1)'],
    ['data', 'data:text/html,hello'],
    ['no scheme', 'drive.google.com'],
    ['a scheme alone', 'https://'],
    ['a space inside', 'https://example.org/a b'],
    ['a line break inside', 'https://example.org/\nx'],
    ['a name and password', 'https://user:pass@example.org'],
    ['upper case scheme', 'HTTPS://example.org'],
  ])('refuses an address with %s', (_name, url) => {
    expect(checkLink({ label: 'Link', url })).toEqual({
      ok: false,
      errors: { url: 'The address must start with https://' },
    });
  });

  it('needs a name and an address', () => {
    expect(checkLink({ label: '', url: '' })).toEqual({
      ok: false,
      errors: { label: 'Give the link a name.', url: 'Paste the address of the link.' },
    });
  });

  it('allows a name of 60 characters and refuses 61', () => {
    expect(checkLink({ label: 'a'.repeat(60), url: 'https://example.org' }).ok).toBe(true);
    expect(checkLink({ label: 'a'.repeat(61), url: 'https://example.org' })).toEqual({
      ok: false,
      errors: { label: 'Keep the name to 60 characters or fewer.' },
    });
  });

  it('refuses an address longer than 2,000 characters', () => {
    expect(checkLink({ label: 'Link', url: `https://example.org/${'a'.repeat(2000)}` })).toEqual({
      ok: false,
      errors: { url: 'This address is too long.' },
    });
  });
});

describe('an id', () => {
  it('reads a whole number above zero', () => {
    expect(checkId('12')).toBe(12);
  });

  it.each(['', '0', '-1', '1.5', '1e3', ' 12abc', '12345678901', 'abc', undefined, null])('refuses %s', (value) => {
    expect(checkId(value)).toBeUndefined();
  });
});
````


- [ ] **Step 2: Run the tests to see them fail**

Run: `npx vitest run tests/unit/dashboard/fields.test.ts`
Expected: FAIL. The modules are missing.


- [ ] **Step 3: Write the code**

`src/lib/dashboard/deliverables.ts`:

````ts
// What every team hands in. The list is fixed: it was given by the programme's student lead.

export const DELIVERABLES = [
  { key: 'car', label: 'Car' },
  { key: 'engineering-drawings', label: 'Engineering Drawings' },
  { key: 'renders', label: 'Renders' },
  { key: 'portfolio-engineering', label: 'Engineering Portfolio' },
  { key: 'portfolio-enterprise', label: 'Enterprise Portfolio' },
  { key: 'portfolio-project-management', label: 'Project Management Portfolio' },
  { key: 'ai-declaration', label: 'AI Declaration' },
  { key: 'pit-display', label: 'Pit Display' },
  { key: 'verbal-presentation-script', label: 'Verbal Presentation Script' },
  { key: 'verbal-presentation-video', label: 'Verbal Presentation Video' },
] as const;

export type DeliverableKey = (typeof DELIVERABLES)[number]['key'];

export const STATUSES = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
] as const;

export type Status = (typeof STATUSES)[number]['value'];

export function isDeliverableKey(value: unknown): value is DeliverableKey {
  return DELIVERABLES.some((item) => item.key === value);
}

export function isStatus(value: unknown): value is Status {
  return STATUSES.some((status) => status.value === value);
}
````

`src/lib/dashboard/fields.ts`:

````ts
// Checks on what a person typed into a dashboard form. No database and no Astro imports.

export const LIMITS = {
  title: 120,
  note: 2000,
  linkLabel: 60,
  url: 2000,
  tasks: 200,
  links: 30,
} as const;

export type Errors = Record<string, string>;
export type Checked<T> = { ok: true; value: T } | { ok: false; errors: Errors };

export interface TaskFields {
  title: string;
  /** A role title from the programme page. Null when the task has no owner. */
  ownerRole: string | null;
  /** YYYY-MM-DD. Null when the task has no due date. */
  dueDate: string | null;
}

export interface LinkFields {
  label: string;
  url: string;
}

/** A form field as text. A file or a missing field is empty text. */
export function text(value: unknown): string {
  // Postgres refuses the null character, and no one types it.
  return typeof value === 'string' ? value.replaceAll('\u0000', '').trim() : '';
}

/** Counts characters as a person does: an emoji is one, not two. */
function length(value: string): number {
  return [...value].length;
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function checkTask(
  input: { title: unknown; ownerRole: unknown; dueDate: unknown },
  roles: readonly string[],
): Checked<TaskFields> {
  const title = text(input.title);
  const ownerRole = text(input.ownerRole);
  const dueDate = text(input.dueDate);
  const errors: Errors = {};
  if (title === '') errors.title = 'Give the task a title.';
  else if (length(title) > LIMITS.title) errors.title = `Keep the title to ${LIMITS.title} characters or fewer.`;
  if (ownerRole !== '' && !roles.includes(ownerRole)) errors.ownerRole = 'Choose a role from the list.';
  if (dueDate !== '' && !isIsoDate(dueDate)) errors.dueDate = 'Use a date on the calendar, in the form 2026-10-02.';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { title, ownerRole: ownerRole || null, dueDate: dueDate || null } };
}

export function checkNote(input: unknown): Checked<string> {
  const note = text(input);
  if (length(note) > LIMITS.note) {
    return { ok: false, errors: { note: `Keep the note to ${LIMITS.note} characters or fewer.` } };
  }
  return { ok: true, value: note };
}

function isHttpsUrl(value: string): boolean {
  if (!value.startsWith('https://') || /\s/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname !== '' && url.username === '' && url.password === '';
  } catch {
    return false;
  }
}

export function checkLink(input: { label: unknown; url: unknown }): Checked<LinkFields> {
  const label = text(input.label);
  const url = text(input.url);
  const errors: Errors = {};
  if (label === '') errors.label = 'Give the link a name.';
  else if (length(label) > LIMITS.linkLabel) errors.label = `Keep the name to ${LIMITS.linkLabel} characters or fewer.`;
  if (url === '') errors.url = 'Paste the address of the link.';
  else if (length(url) > LIMITS.url) errors.url = 'This address is too long.';
  else if (!isHttpsUrl(url)) errors.url = 'The address must start with https://';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { label, url } };
}

/** A whole number above zero from a form field, for the id of a task or a link. */
export function checkId(input: unknown): number | undefined {
  const value = text(input);
  if (!/^[1-9]\d{0,8}$/.test(value)) return undefined;
  return Number(value);
}
````


- [ ] **Step 4: Run the tests to see them pass**

Run: `npx vitest run tests/unit/dashboard/fields.test.ts`
Expected: PASS, every test in the file.


- [ ] **Step 5: Commit**

```bash
git add src/lib/dashboard/deliverables.ts src/lib/dashboard/fields.ts tests/unit/dashboard/fields.test.ts
git commit -m "feat: add the deliverables list and form checks"
```


### Task 4: The tables and the store

**Files:**
- Create: `supabase/migrations/0001_dashboard_stage_1.sql`
- Create: `src/lib/dashboard/db.ts`
- Create: `src/lib/dashboard/store.ts`
- Create: `tests/helpers/database.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `tests/dashboard/store.test.ts`

**Interfaces:**
- Consumes: `DeliverableKey`, `Status`, `isDeliverableKey`, `isStatus` from Task 3; `LIMITS`, `TaskFields`, `LinkFields` from Task 3.
- Produces: From `db.ts`: `type Param = string | number | boolean | null`, `interface Db { query<Row>(text: string, params?: readonly Param[]): Promise<Row[]> }`, `class DashboardUnavailable extends Error`, `connect(url: string): Db`. From `store.ts`: the types `Author` (`'team' | 'mentor'`), `Team { id; slug; name; codeVersion; archived }`, `TeamWithCode`, `Task { id; title; ownerRole; dueDate; done; createdBy }`, `Link { id; label; url }`, and the functions `listTeams`, `listTeamsWithCodes`, `getTeam`, `createTeam`, `resetCode`, `setArchived`, `deliverableStatuses`, `setDeliverable`, `listTasks`, `addTask`, `setTaskDone`, `editTask`, `deleteTask`, `getNote`, `setNote`, `listLinks`, `addLink`, `deleteLink`, `recordActivity`, `countActivity`. Each takes `db: Db` first, and a function that touches a team's rows takes `teamId: number` second. From `tests/helpers/database.ts`: `testDb(): Promise<TestDb>`, `migrationFiles(): string[]`.

- [ ] **Step 0: Add the packages**

```bash
npm install postgres
npm install -D @electric-sql/pglite
```

`postgres` is what the site uses to reach Supabase. `@electric-sql/pglite` is Postgres compiled to run inside Node: the tests use it, so no database needs installing.

- [ ] **Step 1: Write the failing tests**

`tests/dashboard/store.test.ts`:

````ts
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
````


- [ ] **Step 2: Run the tests to see them fail**

Run: `npx vitest run tests/dashboard/store.test.ts`
Expected: FAIL. The modules are missing.


- [ ] **Step 3: Write the code**

`supabase/migrations/0001_dashboard_stage_1.sql`:

````sql
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
````

`src/lib/dashboard/db.ts`:

````ts
// The one door to the database. Everything else asks through Db, so tests can hand in
// a database that lives inside the test process.
import postgres from 'postgres';

export type Param = string | number | boolean | null;

export interface Db {
  /** Runs one statement. Values go in as $1, $2 and so on, never inside the text. */
  query<Row = Record<string, unknown>>(text: string, params?: readonly Param[]): Promise<Row[]>;
}

/** The database cannot be reached, or the site has not been told where it is. */
export class DashboardUnavailable extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'DashboardUnavailable';
  }
}

export function connect(url: string): Db {
  // Supabase's pooler in transaction mode has no prepared statements. One connection is
  // enough for a function that serves one request at a time.
  const sql = postgres(url, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10 });
  return {
    async query<Row>(text: string, params: readonly Param[] = []) {
      try {
        const rows = await sql.unsafe(text, [...params]);
        return [...rows] as Row[];
      } catch (error) {
        // A refused statement is a fault in the code. Anything else is the connection.
        if (error instanceof postgres.PostgresError) throw error;
        throw new DashboardUnavailable('The database cannot be reached', { cause: error });
      }
    },
  };
}
````

`tests/helpers/database.ts`:

````ts
// A Postgres database inside the test process, with the dashboard's tables in it.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import type { Db, Param } from '../../src/lib/dashboard/db';

const MIGRATIONS = join(process.cwd(), 'supabase/migrations');

export function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith('.sql'))
    .sort();
}

export interface TestDb extends Db {
  close(): Promise<void>;
}

export async function testDb(): Promise<TestDb> {
  const lite = new PGlite();
  for (const file of migrationFiles()) await lite.exec(readFileSync(join(MIGRATIONS, file), 'utf8'));
  return {
    async query<Row>(text: string, params: readonly Param[] = []) {
      const result = await lite.query<Row>(text, [...params]);
      return result.rows;
    },
    close: () => lite.close(),
  };
}
````

`src/lib/dashboard/store.ts`:

````ts
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
````


- [ ] **Step 4: Run the tests to see them pass**

Run: `npx vitest run tests/dashboard/store.test.ts`
Expected: PASS, every test in the file. The 200-task test takes about a second.


- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0001_dashboard_stage_1.sql src/lib/dashboard/db.ts src/lib/dashboard/store.ts tests/helpers/database.ts package.json package-lock.json tests/dashboard/store.test.ts
git commit -m "feat: add the dashboard tables and store"
```


### Task 5: The limit on failed sign-ins

**Files:**
- Create: `src/lib/dashboard/limit.ts`
- Test: `tests/dashboard/limit.test.ts`

**Interfaces:**
- Consumes: `Db` from Task 4; `testDb` from Task 4.
- Produces: `MAX_FAILURES` (5), `WINDOW_MINUTES` (15), `hashAddress(address: string, secret: string): string`, `isBlocked(db, addressHash, now?: Date): Promise<boolean>`, `recordFailure(db, addressHash, now?: Date): Promise<void>`.

- [ ] **Step 1: Write the failing tests**

`tests/dashboard/limit.test.ts`:

````ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { hashAddress, isBlocked, MAX_FAILURES, recordFailure, WINDOW_MINUTES } from '../../src/lib/dashboard/limit';
import { testDb, type TestDb } from '../helpers/database';

const SECRET = 's'.repeat(32);
const START = new Date('2026-09-28T09:00:00Z');
const after = (minutes: number) => new Date(START.getTime() + minutes * 60_000);

let db: TestDb;
beforeAll(async () => {
  db = await testDb();
});
afterAll(() => db.close());

describe('the limit on failed sign-ins', () => {
  it('is five in 15 minutes', () => {
    expect(MAX_FAILURES).toBe(5);
    expect(WINDOW_MINUTES).toBe(15);
  });

  it('keeps an address as a hash', async () => {
    const hash = hashAddress('203.0.113.7', SECRET);
    expect(hash).not.toContain('203');
    expect(hash).toBe(hashAddress('203.0.113.7', SECRET));
    expect(hash).not.toBe(hashAddress('203.0.113.8', SECRET));
    expect(hash).not.toBe(hashAddress('203.0.113.7', 't'.repeat(32)));
  });

  it('allows four failures and blocks at the fifth', async () => {
    const address = hashAddress('198.51.100.1', SECRET);
    for (let i = 0; i < 4; i += 1) await recordFailure(db, address, after(i));
    expect(await isBlocked(db, address, after(4))).toBe(false);
    await recordFailure(db, address, after(4));
    expect(await isBlocked(db, address, after(4))).toBe(true);
  });

  it('lifts the block 15 minutes after the first of the five', async () => {
    const address = hashAddress('198.51.100.2', SECRET);
    for (let i = 0; i < 5; i += 1) await recordFailure(db, address, after(i));
    expect(await isBlocked(db, address, after(14.9))).toBe(true);
    expect(await isBlocked(db, address, after(15))).toBe(false);
  });

  it('does not block one address for the failures of another', async () => {
    const guesser = hashAddress('198.51.100.3', SECRET);
    for (let i = 0; i < 9; i += 1) await recordFailure(db, guesser, START);
    expect(await isBlocked(db, guesser, START)).toBe(true);
    expect(await isBlocked(db, hashAddress('198.51.100.4', SECRET), START)).toBe(false);
  });

  it('clears rows that are past the window', async () => {
    await recordFailure(db, hashAddress('198.51.100.5', SECRET), after(120));
    const rows = await db.query<{ happened_at: Date }>('select happened_at from signin_failures');
    expect(rows).toHaveLength(1);
  });
});
````


- [ ] **Step 2: Run the tests to see them fail**

Run: `npx vitest run tests/dashboard/limit.test.ts`
Expected: FAIL. The module is missing.


- [ ] **Step 3: Write the code**

`src/lib/dashboard/limit.ts`:

````ts
// Slows down guessing. Five failed sign-ins from one address in 15 minutes block that address
// until 15 minutes have passed since the last of them.
import { createHmac } from 'node:crypto';
import type { Db } from './db';

export const MAX_FAILURES = 5;
export const WINDOW_MINUTES = 15;

/** Addresses are kept as hashes, so the table holds nothing that names a person or a place. */
export function hashAddress(address: string, secret: string): string {
  return createHmac('sha256', secret).update(`address:${address}`).digest('base64url');
}

function windowStart(now: Date): string {
  return new Date(now.getTime() - WINDOW_MINUTES * 60_000).toISOString();
}

export async function isBlocked(db: Db, addressHash: string, now: Date = new Date()): Promise<boolean> {
  const rows = await db.query<{ count: number }>(
    `select count(*)::int as count from signin_failures
     where address_hash = $1 and happened_at > $2::timestamptz`,
    [addressHash, windowStart(now)],
  );
  return (rows[0]?.count ?? 0) >= MAX_FAILURES;
}

export async function recordFailure(db: Db, addressHash: string, now: Date = new Date()): Promise<void> {
  await db.query('insert into signin_failures (address_hash, happened_at) values ($1, $2::timestamptz)', [
    addressHash,
    now.toISOString(),
  ]);
  // Rows past the window decide nothing. Clearing them here keeps the table small.
  await db.query('delete from signin_failures where happened_at <= $1::timestamptz', [windowStart(now)]);
}
````


- [ ] **Step 4: Run the tests to see them pass**

Run: `npx vitest run tests/dashboard/limit.test.ts`
Expected: PASS, every test in the file.


- [ ] **Step 5: Commit**

```bash
git add src/lib/dashboard/limit.ts tests/dashboard/limit.test.ts
git commit -m "feat: limit failed sign-ins"
```


### Task 6: The workspace view

**Files:**
- Create: `src/lib/dashboard/workspace.ts`
- Test: `tests/unit/dashboard/workspace.test.ts`

**Interfaces:**
- Consumes: `seasonState`, `formatDate` and `SeasonData` from `src/lib/season.ts`, which exists; `Db`, `deliverableStatuses`, `listTasks`, `getNote`, `listLinks`, `Task`, `Link` from Task 4; `DELIVERABLES` from Task 3.
- Produces: The types `Deadline { title; when; left }`, `DeliverableLine`, `TaskLine` (a `Task` with `overdue: boolean`), `Workspace { deadline; deliverables; doneCount; tasks; note; links }`, and `daysBetween(from, to): number`, `daysLeftText(days): string`, `nextDeadline(season, today): Deadline | undefined`, `isOverdue(task, today): boolean`, `sortTasks(tasks)`, `deliverableLines(statuses)`, `loadWorkspace(db, teamId, season, today): Promise<Workspace>`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/dashboard/workspace.test.ts`:

````ts
import { describe, expect, it } from 'vitest';
import type { SeasonData } from '../../../src/lib/season';
import {
  daysBetween,
  daysLeftText,
  deliverableLines,
  isOverdue,
  nextDeadline,
  sortTasks,
} from '../../../src/lib/dashboard/workspace';

const season = (timeline: SeasonData['timeline']): SeasonData => ({
  year: '2026-27',
  registrationOpen: false,
  timeline,
});

describe('days', () => {
  it('counts whole days, across a month and a leap day', () => {
    expect(daysBetween('2026-09-28', '2026-09-28')).toBe(0);
    expect(daysBetween('2026-09-28', '2026-10-02')).toBe(4);
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
  });

  it('says how long is left', () => {
    expect(daysLeftText(0)).toBe('Today');
    expect(daysLeftText(1)).toBe('1 day left');
    expect(daysLeftText(12)).toBe('12 days left');
  });
});

describe('the next deadline', () => {
  it('is the first item dated today or later', () => {
    const data = season([
      { date: '2026-09-16', title: 'Briefing', description: '' },
      { date: '2026-10-02', title: 'Portfolio draft', description: '' },
      { date: '2026-11-20', title: 'Regional Finals', description: '' },
    ]);
    expect(nextDeadline(data, '2026-09-28')).toEqual({
      title: 'Portfolio draft',
      when: '2 October 2026',
      left: '4 days left',
    });
    expect(nextDeadline(data, '2026-10-02')).toEqual({ title: 'Portfolio draft', when: '2 October 2026', left: 'Today' });
    expect(nextDeadline(data, '2026-10-03')?.title).toBe('Regional Finals');
  });

  it('is the next undated item when no later item has a date', () => {
    const data = season([
      { date: '2026-09-16', title: 'Briefing', description: '' },
      { title: 'Regional Finals', description: '' },
    ]);
    expect(nextDeadline(data, '2026-09-28')).toEqual({
      title: 'Regional Finals',
      when: 'Date to be confirmed',
      left: '',
    });
  });

  it('is nothing with no season, an empty timeline or a season that is over', () => {
    expect(nextDeadline(undefined, '2026-09-28')).toBeUndefined();
    expect(nextDeadline(season([]), '2026-09-28')).toBeUndefined();
    expect(nextDeadline(season([{ date: '2026-09-16', title: 'Briefing', description: '' }]), '2026-09-28')).toBeUndefined();
  });
});

describe('tasks', () => {
  it('is overdue the day after it was due, unless it is done', () => {
    expect(isOverdue({ done: false, dueDate: '2026-09-28' }, '2026-09-28')).toBe(false);
    expect(isOverdue({ done: false, dueDate: '2026-09-28' }, '2026-09-29')).toBe(true);
    expect(isOverdue({ done: true, dueDate: '2026-09-28' }, '2026-09-29')).toBe(false);
    expect(isOverdue({ done: false, dueDate: null }, '2026-09-29')).toBe(false);
  });

  it('puts mentor tasks first, then sorts by date with undated tasks last', () => {
    const sorted = sortTasks([
      { id: 1, dueDate: null, createdBy: 'team' },
      { id: 2, dueDate: '2026-10-05', createdBy: 'team' },
      { id: 3, dueDate: '2026-11-01', createdBy: 'mentor' },
      { id: 4, dueDate: '2026-10-01', createdBy: 'team' },
      { id: 5, dueDate: null, createdBy: 'mentor' },
      { id: 6, dueDate: '2026-10-01', createdBy: 'team' },
    ] as const);
    expect(sorted.map((task) => task.id)).toEqual([3, 5, 4, 6, 2, 1]);
  });

  it('leaves the list it was given as it was', () => {
    const tasks = [
      { id: 1, dueDate: null, createdBy: 'team' as const },
      { id: 2, dueDate: '2026-10-05', createdBy: 'mentor' as const },
    ];
    sortTasks(tasks);
    expect(tasks.map((task) => task.id)).toEqual([1, 2]);
  });
});

describe('deliverable lines', () => {
  it('shows all ten, not started unless the team said otherwise', () => {
    const lines = deliverableLines({ car: 'done', renders: 'in_progress' });
    expect(lines).toHaveLength(10);
    expect(lines[0]).toEqual({ key: 'car', label: 'Car', status: 'done' });
    expect(lines[2]?.status).toBe('in_progress');
    expect(lines.filter((line) => line.status === 'not_started')).toHaveLength(8);
  });
});
````


- [ ] **Step 2: Run the tests to see them fail**

Run: `npx vitest run tests/unit/dashboard/workspace.test.ts`
Expected: FAIL. The module is missing.


- [ ] **Step 3: Write the code**

`src/lib/dashboard/workspace.ts`:

````ts
// What the team workspace shows, worked out from rows and the season file. No Astro imports.
import { formatDate, seasonState, type SeasonData } from '../season';
import type { Db } from './db';
import { DELIVERABLES, type DeliverableKey, type Status } from './deliverables';
import { deliverableStatuses, getNote, listLinks, listTasks, type Link, type Task } from './store';

export interface Deadline {
  title: string;
  /** "2 October 2026" or "Date to be confirmed". */
  when: string;
  /** "12 days left". Empty when the date is not confirmed. */
  left: string;
}

export interface DeliverableLine {
  key: DeliverableKey;
  label: string;
  status: Status;
}

export interface TaskLine extends Task {
  overdue: boolean;
}

export interface Workspace {
  deadline: Deadline | undefined;
  deliverables: DeliverableLine[];
  doneCount: number;
  tasks: TaskLine[];
  note: string;
  links: Link[];
}

const DAY = 24 * 60 * 60 * 1000;

/** Whole days from one YYYY-MM-DD date to another. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);
}

export function daysLeftText(days: number): string {
  if (days <= 0) return 'Today';
  return days === 1 ? '1 day left' : `${days} days left`;
}

/** The next item in the season timeline. Undefined when there is no season or it is over. */
export function nextDeadline(season: SeasonData | undefined, today: string): Deadline | undefined {
  const state = seasonState(season, today);
  if (state.kind === 'unscheduled') return { title: state.item.title, when: 'Date to be confirmed', left: '' };
  if (state.kind !== 'upcoming' || state.item.date === undefined) return undefined;
  return {
    title: state.item.title,
    when: formatDate(state.item.date),
    left: daysLeftText(daysBetween(today, state.item.date)),
  };
}

export function isOverdue(task: Pick<Task, 'done' | 'dueDate'>, today: string): boolean {
  return !task.done && task.dueDate !== null && task.dueDate < today;
}

/** Mentor tasks first. Inside each group by due date, with undated tasks last, then oldest first. */
export function sortTasks<T extends Pick<Task, 'id' | 'dueDate' | 'createdBy'>>(tasks: readonly T[]): T[] {
  return [...tasks].sort((a, b) => {
    if (a.createdBy !== b.createdBy) return a.createdBy === 'mentor' ? -1 : 1;
    if (a.dueDate !== b.dueDate) {
      if (a.dueDate === null) return 1;
      if (b.dueDate === null) return -1;
      return a.dueDate < b.dueDate ? -1 : 1;
    }
    return a.id - b.id;
  });
}

export function deliverableLines(statuses: Partial<Record<DeliverableKey, Status>>): DeliverableLine[] {
  return DELIVERABLES.map((item) => ({ ...item, status: statuses[item.key] ?? 'not_started' }));
}

export async function loadWorkspace(
  db: Db,
  teamId: number,
  season: SeasonData | undefined,
  today: string,
): Promise<Workspace> {
  const [statuses, tasks, note, links] = await Promise.all([
    deliverableStatuses(db, teamId),
    listTasks(db, teamId),
    getNote(db, teamId),
    listLinks(db, teamId),
  ]);
  const deliverables = deliverableLines(statuses);
  return {
    deadline: nextDeadline(season, today),
    deliverables,
    doneCount: deliverables.filter((line) => line.status === 'done').length,
    tasks: sortTasks(tasks).map((task) => ({ ...task, overdue: isOverdue(task, today) })),
    note,
    links,
  };
}
````


- [ ] **Step 4: Run the tests to see them pass**

Run: `npx vitest run tests/unit/dashboard/workspace.test.ts`
Expected: PASS, every test in the file.


- [ ] **Step 5: Commit**

```bash
git add src/lib/dashboard/workspace.ts tests/unit/dashboard/workspace.test.ts
git commit -m "feat: work out what the workspace shows"
```


### Task 7: Signing in and forms

**Files:**
- Create: `src/lib/dashboard/actions.ts`
- Test: `tests/dashboard/actions.test.ts`

**Interfaces:**
- Consumes: everything Tasks 1 to 6 produce.
- Produces: `signIn(db, input: SignInInput): Promise<SignInResult>` where `SignInInput` is `{ code: unknown; address: string; secret: string; mentorCodeHash: string | undefined; now?: Date }` and `SignInResult` is `{ ok: true; session; cookie; next: '/dashboard/team' | '/dashboard/mentor' }` or `{ ok: false; reason: 'blocked' | 'unknown' | 'closed'; message }`. `workspaceAction(db, teamId: number, author: Author, form: FormData, roles: readonly string[]): Promise<ActionResult>`. `mentorAction(db, form: FormData, mentorCodeHash: string | undefined): Promise<ActionResult>`. `ActionResult` is `{ ok: true; action; notice; shownCode?: { team; code } }` or `{ ok: false; action; errors: Errors; values: Record<string, string> }`. `noticeFor(action: string | null): string | undefined`. `slugify(name: string): string`. The forms are named `deliverable`, `task-add`, `task-edit`, `task-done`, `task-delete`, `note`, `link-add`, `link-delete`, `team-add`, `code-reset`, `team-archive`.

- [ ] **Step 1: Write the failing tests**

`tests/dashboard/actions.test.ts`:

````ts
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
````


- [ ] **Step 2: Run the tests to see them fail**

Run: `npx vitest run tests/dashboard/actions.test.ts`
Expected: FAIL. The module is missing.


- [ ] **Step 3: Write the code**

`src/lib/dashboard/actions.ts`:

````ts
// What happens when a form is sent. The pages hand the form over and show what comes back.
// No Astro imports, so the tests run these against a database inside the test process.
import { codeMatches, hashCode, makeCode, normaliseCode } from './codes';
import type { Db } from './db';
import { isDeliverableKey, isStatus } from './deliverables';
import { checkId, checkLink, checkNote, checkTask, LIMITS, text, type Errors } from './fields';
import { hashAddress, isBlocked, recordFailure } from './limit';
import { newSession, signSession, type Session } from './session';
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
  if (await isBlocked(db, address, now)) return refused('blocked');

  const code = normaliseCode(text(input.code));
  if (code !== undefined) {
    if (input.mentorCodeHash && (await codeMatches(code, input.mentorCodeHash))) {
      const session = newSession('mentor', null, 0, now.getTime());
      return { ok: true, session, cookie: signSession(session, input.secret), next: '/dashboard/mentor' };
    }
    for (const team of await listTeamsWithCodes(db)) {
      if (!(await codeMatches(code, team.codeHash))) continue;
      if (team.archived) return refused('closed');
      const session = newSession('team', team.id, team.codeVersion, now.getTime());
      return { ok: true, session, cookie: signSession(session, input.secret), next: '/dashboard/team' };
    }
  }
  await recordFailure(db, address, now);
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
````


- [ ] **Step 4: Run the tests to see them pass**

Run: `npx vitest run tests/dashboard/actions.test.ts`
Expected: PASS, every test in the file. They take about five seconds, because each code is hashed with scrypt.


- [ ] **Step 5: Commit**

```bash
git add src/lib/dashboard/actions.ts tests/dashboard/actions.test.ts
git commit -m "feat: add sign-in and form actions"
```


### Task 8: Scripts for the database and the mentor code

**Files:**
- Create: `scripts/dashboard-migrations.ts`
- Create: `scripts/dashboard-local-db.ts`
- Create: `scripts/dashboard-migrate.ts`
- Create: `scripts/dashboard-hash.ts`
- Create: `.env.example`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `hashCode`, `normaliseCode` from Task 1; the migration file from Task 4.
- Produces: the commands `npm run dashboard:db`, `npm run dashboard:migrate`, `npm run dashboard:hash` and `npm run test:dashboard`. The local database listens on `127.0.0.1:54329`.

These are run by hand, so the check is to run them.

- [ ] **Step 1: Add the packages and the commands**

```bash
npm install -D @electric-sql/pglite-socket tsx
npm pkg set scripts.test:dashboard="vitest run tests/dashboard tests/unit/dashboard"
npm pkg set scripts.test:all="npm run test && npm run test:dashboard && npm run test:site"
npm pkg set scripts.dashboard:db="tsx scripts/dashboard-local-db.ts"
npm pkg set scripts.dashboard:migrate="tsx --env-file=.env scripts/dashboard-migrate.ts"
npm pkg set scripts.dashboard:hash="tsx scripts/dashboard-hash.ts"
```

- [ ] **Step 2: Keep secrets and local data out of git**

Add these four lines to the end of `.gitignore`:

```
.env
.env.*
!.env.example
.dashboard-db/
```

- [ ] **Step 3: Write the scripts and the example settings**

`scripts/dashboard-migrations.ts`:

````ts
// Which migration files there are and how they are kept track of. Used by the local database
// and by the script that prepares the Supabase project.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const FOLDER = join(process.cwd(), 'supabase/migrations');

/** The table that records which files have run. It is secured like every other table. */
export const TRACKING = `
  create table if not exists dashboard_migrations (
    name text primary key,
    run_at timestamptz not null default now()
  );
  alter table dashboard_migrations enable row level security;
`;

export interface Migration {
  name: string;
  sql: string;
}

/** The files that have not run yet, in order. */
export function pending(done: ReadonlySet<string>): Migration[] {
  return readdirSync(FOLDER)
    .filter((name) => name.endsWith('.sql') && !done.has(name))
    .sort()
    .map((name) => ({ name, sql: readFileSync(join(FOLDER, name), 'utf8') }));
}
````

`scripts/dashboard-local-db.ts`:

````ts
// A Postgres database on this computer, for working on the dashboard. Nothing needs installing.
// The data is kept in .dashboard-db, which git ignores. Stop it with Ctrl+C.
//   npm run dashboard:db
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { pending, TRACKING } from './dashboard-migrations';

const PORT = 54329;

const db = await PGlite.create(join(process.cwd(), '.dashboard-db'));
await db.exec(TRACKING);
const { rows } = await db.query<{ name: string }>('select name from dashboard_migrations');
for (const migration of pending(new Set(rows.map((row) => row.name)))) {
  await db.transaction(async (tx) => {
    await tx.exec(migration.sql);
    await tx.query('insert into dashboard_migrations (name) values ($1)', [migration.name]);
  });
  console.log(`Ran ${migration.name}`);
}

const server = new PGLiteSocketServer({ db, port: PORT, host: '127.0.0.1' });
await server.start();
console.log('The local database is ready. Put this line in .env:');
console.log(`DATABASE_URL=postgres://postgres:postgres@127.0.0.1:${PORT}/postgres`);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void server
      .stop()
      .then(() => db.close())
      .then(() => process.exit(0));
  });
}
````

`scripts/dashboard-migrate.ts`:

````ts
// Runs the migration files that the database has not seen, in order. Safe to run again.
// It reads DATABASE_URL from .env, so check that file names the database you mean.
//   npm run dashboard:migrate
import postgres from 'postgres';
import { pending, TRACKING } from './dashboard-migrations';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Put it in .env.');
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });
try {
  console.log(`Database: ${new URL(url).host}`);
  await sql.unsafe(TRACKING);
  const rows = await sql<{ name: string }[]>`select name from dashboard_migrations`;
  const todo = pending(new Set(rows.map((row) => row.name)));
  for (const migration of todo) {
    await sql.begin(async (tx) => {
      await tx.unsafe(migration.sql);
      await tx`insert into dashboard_migrations (name) values (${migration.name})`;
    });
    console.log(`Ran ${migration.name}`);
  }
  if (todo.length === 0) console.log('Nothing to run. The database is up to date.');
} finally {
  await sql.end();
}
````

`scripts/dashboard-hash.ts`:

````ts
// Turns an access code into the hash that goes in MENTOR_CODE_HASH. The code is not shown
// as it is typed and is not kept anywhere.
//   npm run dashboard:hash
import { createInterface } from 'node:readline';
import { hashCode, normaliseCode } from '../src/lib/dashboard/codes';

const input = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
process.stdout.write('Type the code and press Enter. It will not be shown: ');
// Keeps the typed characters off the screen.
(input as unknown as { _writeToOutput: (text: string) => void })._writeToOutput = () => {};

input.question('', async (answer) => {
  input.close();
  process.stdout.write('\n');
  if (normaliseCode(answer) === undefined) {
    console.error('Use 6 to 32 letters and digits. Hyphens and spaces are ignored.');
    process.exit(1);
  }
  console.log('Put this line in .env, and the same value in Vercel as MENTOR_CODE_HASH:');
  console.log(`MENTOR_CODE_HASH=${await hashCode(answer)}`);
});
````

`.env.example`:

````bash
# Copy this file to .env and fill it in. .env is never committed.

# The database. For work on this computer, run "npm run dashboard:db" and use the line it prints.
# On Vercel this is the Supabase pooler address in transaction mode, which ends in :6543/postgres
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:54329/postgres

# Signs the session cookie. 32 characters or more. Make one with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
SESSION_SECRET=

# The hash of the mentor code. Make it with "npm run dashboard:hash".
MENTOR_CODE_HASH=

# Vercel sets this one itself on the deployed site. Any text will do on this computer.
CRON_SECRET=
````

- [ ] **Step 4: Run them**

In one terminal:

Run: `npm run dashboard:db`
Expected: `Ran 0001_dashboard_stage_1.sql`, then `The local database is ready.` and a `DATABASE_URL` line. Leave it running.

In another terminal:

```bash
cp .env.example .env
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('base64url'))"
```

Put the line it prints in `.env` in place of `SESSION_SECRET=`. Set `CRON_SECRET=local-cron` in `.env`.

Run: `npm run dashboard:migrate`
Expected: `Database: 127.0.0.1:54329` then `Nothing to run. The database is up to date.`

Run: `npm run dashboard:hash`, type `TEST-MENTOR-01` and press Enter.
Expected: the code is not shown as it is typed. A line `MENTOR_CODE_HASH=scrypt.` followed by two groups joined by a dot, with no `$` in it. Put that line in `.env`. `TEST-MENTOR-01` is for this computer only.

Run: `npm run dashboard:hash`, type `ab` and press Enter.
Expected: `Use 6 to 32 letters and digits. Hyphens and spaces are ignored.` and exit code 1.

Run: `git status --short`
Expected: `.env` and `.dashboard-db/` are not listed.

Run: `npm run test:dashboard`
Expected: PASS, 7 files.

- [ ] **Step 5: Commit**

```bash
git add scripts/dashboard-migrations.ts scripts/dashboard-local-db.ts scripts/dashboard-migrate.ts scripts/dashboard-hash.ts .env.example .gitignore package.json package-lock.json
git commit -m "feat: add scripts for the dashboard database and mentor code"
```

### Task 9: The adapter and the first page rendered on request

**Files:**
- Create: `src/env.d.ts`
- Create: `src/lib/dashboard/runtime.ts`
- Create: `src/pages/dashboard/unavailable.astro`
- Create: `src/pages/dashboard/api/keep-awake.ts`
- Create: `tests/site/dashboard.test.ts`
- Modify: `astro.config.mjs`
- Modify: `vercel.json`
- Modify: `tests/helpers/site.ts:7`
- Modify: `tests/helpers/sandbox.ts:54`
- Modify: `tests/site/dates-script.test.ts:34`
- Modify: `tests/site/brand.test.ts:49-53`

**Interfaces:**
- Consumes: `connect`, `DashboardUnavailable`, `Db` from Task 4; `Session` from Task 2; `Team` from Task 4.
- Produces: from `runtime.ts`, `getDb(): Db`, `sessionSecret(): string`, `mentorCodeHash(): string | undefined`, `cronSecret(): string | undefined`. `App.Locals.dashboard` is `{ session: Session; team: Team | undefined; token: string } | undefined`. The built public pages are in `dist/client/`.

The adapter and the page go in together. With the adapter and no page rendered on request, the build still writes to `dist/`. With one such page, it writes the public pages to `dist/client/`.

- [ ] **Step 1: Write the failing tests**

`tests/site/dashboard.test.ts`:

````ts
// What the build does with the dashboard. How the dashboard behaves is tested in tests/dashboard.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dist, page, pageFile, root, ROUTES, siteCss, texts } from '../helpers/site';

const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('the public site beside the dashboard', () => {
  it.each(ROUTES)('still builds %s as a file', (route) => {
    expect(existsSync(pageFile(route))).toBe(true);
  });

  it('builds no dashboard page ahead of time', () => {
    expect(existsSync(join(dist, 'dashboard'))).toBe(false);
    expect(existsSync(join(dist, 'dashboard.html'))).toBe(false);
  });

  it('keeps the dashboard out of the main navigation', () => {
    expect(page('/')('.site-nav a[href^="/dashboard"]')).toHaveLength(0);
  });
});

describe('the settings', () => {
  it('builds a static site with the Vercel adapter', () => {
    const config = read('astro.config.mjs');
    expect(config).toMatch(/output:\s*'static'/);
    expect(config).toMatch(/adapter:\s*vercel\(\)/);
  });

  it('wakes the database once a day', () => {
    const vercel = JSON.parse(read('vercel.json'));
    expect(vercel.crons).toEqual([{ path: '/dashboard/api/keep-awake', schedule: '0 3 * * *' }]);
    // The adapter decides where the build goes. A folder named here would hide the server code.
    expect(vercel).not.toHaveProperty('outputDirectory');
  });

  it('keeps secrets out of git', () => {
    const ignored = read('.gitignore').split('\n');
    expect(ignored).toEqual(expect.arrayContaining(['.env', '.dashboard-db/']));
    expect(read('.env.example')).toMatch(/^SESSION_SECRET=$/m);
    expect(read('.env.example')).toMatch(/^MENTOR_CODE_HASH=$/m);
  });

  it('keeps the database driver out of the browser', () => {
    const scripts = join(dist, '_astro');
    expect(existsSync(scripts)).toBe(true);
    expect(siteCss()).not.toMatch(/DATABASE_URL|SESSION_SECRET/);
  });
});
````

`page` and `texts` are imported for tests that Task 12 adds. `npm run check` reports them as hints until then, which is expected.

- [ ] **Step 2: Run the tests to see them fail**

Run: `npm run test:site`
Expected: FAIL in `tests/site/dashboard.test.ts`. "builds a static site with the Vercel adapter" and "wakes the database once a day" fail, and the `%s as a file` tests fail because `dist/client` is not there.

- [ ] **Step 3: Add the adapter**

```bash
npm install @astrojs/vercel
```

`astro.config.mjs`, whole file:

````js
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

// Static site. Every page is built to plain HTML at build time.
export default defineConfig({
  output: 'static',
  adapter: vercel(),
  site: vercelHost ? `https://${vercelHost}` : 'https://stemracing-tbs.vercel.app',
  trailingSlash: 'ignore',
});
````

`vercel.json`, whole file. `buildCommand` and `outputDirectory` go, because the adapter decides where the build is written:

````json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "astro",
  "cleanUrls": true,
  "trailingSlash": false,
  "crons": [{ "path": "/dashboard/api/keep-awake", "schedule": "0 3 * * *" }]
}
````

- [ ] **Step 4: Write the settings, the two pages and the type of `locals`**

`src/env.d.ts`:

````ts
declare namespace App {
  interface Locals {
    /** Set by src/middleware.ts on every dashboard page that needs a session. */
    dashboard?: {
      session: import('./lib/dashboard/session').Session;
      /** The team of a team session. Undefined for a mentor. */
      team: import('./lib/dashboard/store').Team | undefined;
      /** Goes in every form as the hidden field "token". */
      token: string;
    };
  }
}
````

`src/lib/dashboard/runtime.ts`:

````ts
// The settings the dashboard reads when it runs. This is the only dashboard file in src/lib
// that imports from Astro, so it is the only one the unit tests cannot load.
import { getSecret } from 'astro:env/server';
import { connect, DashboardUnavailable, type Db } from './db';

let db: Db | undefined;

function need(name: string): string {
  const value = getSecret(name);
  if (!value) throw new DashboardUnavailable(`${name} is not set`);
  return value;
}

export function getDb(): Db {
  db ??= connect(need('DATABASE_URL'));
  return db;
}

export function sessionSecret(): string {
  return need('SESSION_SECRET');
}

/** Undefined when no mentor code has been set. Then no one can sign in as a mentor. */
export function mentorCodeHash(): string | undefined {
  return getSecret('MENTOR_CODE_HASH') || undefined;
}

export function cronSecret(): string | undefined {
  return getSecret('CRON_SECRET') || undefined;
}
````

`src/pages/dashboard/unavailable.astro`:

````astro
---
import Section from '../../components/Section.astro';
import Base from '../../layouts/Base.astro';

export const prerender = false;
Astro.response.status = 503;
---

<Base title="Dashboard unavailable" description="The team dashboard is unavailable.">
  <Section surface="dark" labelledby="unavailable-title">
    <div class="stack">
      <h1 id="unavailable-title">The dashboard is unavailable</h1>
      <p class="lead">Your work is safe. Try again in a few minutes.</p>
    </div>
  </Section>
</Base>
````

`src/pages/dashboard/api/keep-awake.ts`:

````ts
// Vercel calls this once a day, so that Supabase does not pause the project for lack of use.
import { timingSafeEqual } from 'node:crypto';
import type { APIRoute } from 'astro';
import { cronSecret, getDb } from '../../../lib/dashboard/runtime';

export const prerender = false;

function allowed(header: string | null): boolean {
  const secret = cronSecret();
  if (!secret || !header) return false;
  const sent = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${secret}`);
  return sent.length === expected.length && timingSafeEqual(sent, expected);
}

export const GET: APIRoute = async ({ request }) => {
  if (!allowed(request.headers.get('authorization'))) return new Response('Not found', { status: 404 });
  await getDb().query('select 1');
  return new Response('awake');
};
````

- [ ] **Step 5: Point the tests at `dist/client`**

`tests/helpers/site.ts`, line 7:

```ts
export const dist = join(root, 'dist', 'client');
```

`tests/helpers/sandbox.ts`, lines 53 to 54:

```ts
  const file = (route: string) =>
    route === '/' ? join(dir, 'dist/client/index.html') : join(dir, 'dist/client', route.slice(1), 'index.html');
```

`tests/site/dates-script.test.ts`, line 34:

```ts
    const bundle = readFileSync(join(root, 'dist', 'client', src?.replace(/^\//, '') ?? ''), 'utf8');
```

`tests/site/brand.test.ts`, the test "puts no shadow or rotation on either logo link". A page rendered on request ships the shared rules in a CSS file of its own, so each rule appears twice:

```ts
  it('puts no shadow or rotation on either logo link', () => {
    // The dashboard pages ship the same rules in a file of their own, so each is counted once.
    const links = rules
      .filter((rule) => ['.site-header__home', '.site-footer__home'].includes(rule.selector))
      .filter((rule, index, all) => all.findIndex((other) => other.selector === rule.selector && other.body === rule.body) === index);
    expect(links).toHaveLength(2);
    for (const rule of links) expect(rule.body).not.toMatch(/(?:box-shadow|text-shadow|filter|rotate|transform):/);
  });
```

- [ ] **Step 6: Run every test**

Run: `npm run test:all`
Expected: PASS. No test that passed before this task fails. 9 are skipped, as before.

Run: `npm run check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 7: Check the two pages by hand**

With `npm run dashboard:db` running in another terminal:

```bash
npx astro dev --port 4321 &
sleep 6
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/dashboard/unavailable
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/dashboard/api/keep-awake
curl -s -w " %{http_code}\n" -H "Authorization: Bearer local-cron" http://localhost:4321/dashboard/api/keep-awake
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/teams
npx astro dev stop
```

Expected, in order: `503`, `404`, `awake 200`, `200`.

- [ ] **Step 8: Commit**

```bash
git add astro.config.mjs vercel.json package.json package-lock.json src/env.d.ts src/lib/dashboard/runtime.ts src/pages/dashboard tests/site/dashboard.test.ts tests/helpers/site.ts tests/helpers/sandbox.ts tests/site/dates-script.test.ts tests/site/brand.test.ts
git commit -m "feat: render dashboard pages on request with the Vercel adapter"
```

### Task 10: The guard, sign-in and sign-out

**Files:**
- Create: `src/middleware.ts`
- Create: `src/pages/dashboard/index.astro`
- Create: `src/pages/dashboard/sign-out.ts`
- Create: `src/styles/dashboard.css`
- Create: `tests/unit/dashboard/styles.test.ts`
- Modify: `src/components/Button.astro`
- Modify: `tests/site/dashboard.test.ts`

**Interfaces:**
- Consumes: `signIn` from Task 7; `readSession`, `formToken`, `formTokenMatches`, `SESSION_COOKIE`, `SESSION_SECONDS` from Task 2; `getTeam` from Task 4; `getDb`, `sessionSecret`, `mentorCodeHash` from Task 9; `DashboardUnavailable` from Task 4.
- Produces: `Astro.locals.dashboard` on every guarded page. `Button` with no `href` renders `<button type="submit">` and takes `size`, `name`, `value` and `pressed`. The CSS classes `dash-narrow`, `dash-head`, `dash-block`, `dash-form`, `dash-fields`, `dash-field`, `dash-hint`, `dash-message`, `dash-notice`, `dash-code`, `dash-bar`, `dash-bar__fill`, `dash-list`, `dash-row`, `dash-row__title`, `dash-row__title--done`, `dash-row__meta`, `dash-row__actions`, `dash-note`, `tag--overdue`, `tag--mentor`.

What the guard does, in order:

| Request | Answer |
|---|---|
| A public page | Passed through untouched |
| A dashboard page with no session | The sign-in, unavailable and keep-awake pages are shown. Any other goes to `/dashboard?again=1`. |
| A team session whose team is gone or whose code was reset | Cookie cleared, `/dashboard?again=1` |
| A team session whose team is archived | Cookie cleared, `/dashboard?closed=1` |
| A session on the sign-in page, or on the other role's pages | Sent to its own home |
| A form with no token, or the token of another session | 403 |
| The database cannot be reached | The unavailable page, status 503 |

- [ ] **Step 1: Write the failing tests**

`tests/unit/dashboard/styles.test.ts`. The two tests marked "Task 11" are added in Task 11, when the files they read exist:

````ts
// The dashboard's styles are sent with its pages, so the brand tests in tests/site, which read
// the public site's CSS, never see them. These read the source.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const css = readFileSync(join(root, 'src/styles/dashboard.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

function astroFiles(folder: string): string[] {
  return readdirSync(join(root, folder), { recursive: true, encoding: 'utf8' })
    .filter((name) => name.endsWith('.astro'))
    .map((name) => join(folder, name));
}

const sources = astroFiles('src/pages/dashboard');

describe('dashboard styles', () => {
  it('takes every colour from a token', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/\b(?:rgb|rgba|hsl|hsla|oklch|color-mix)\(/i);
    const declarations = [
      ...css.matchAll(/(?:^|[;{\s])(?:color|background(?:-color)?|border(?:-[\w-]+)?-color|outline|box-shadow|fill|stroke):([^;}]+)/g),
    ].map((match) => (match[1] ?? '').trim());
    expect(declarations.length).toBeGreaterThan(10);
    for (const value of declarations) {
      expect(value, `non-token colour: ${value}`).toMatch(/var\(--|^(?:transparent|currentColor|inherit|none)$/i);
    }
  });

  it('names a token in every border', () => {
    for (const match of css.matchAll(/border(?:-[\w-]+)?:\s*([^;}]+)/g)) {
      const value = (match[1] ?? '').trim();
      if (/^(?:0|none|inherit|999px|var\(--radius\)|0\.25rem)$/.test(value)) continue;
      expect(value, `border: ${value}`).toMatch(/var\(--/);
    }
  });

  it('uses only tokens that exist', () => {
    const tokens = readFileSync(join(root, 'src/styles/tokens.css'), 'utf8');
    // These are set by Section.astro for the surface the dashboard sits on.
    const surface = ['--fg', '--fg-strong', '--fg-muted', '--fg-inverse', '--rule', '--card-bg', '--card-border', '--stack'];
    for (const match of css.matchAll(/var\((--[\w-]+)/g)) {
      const name = match[1] ?? '';
      if (surface.includes(name)) continue;
      expect(tokens, name).toContain(`${name}:`);
    }
  });

  it('leaves the display font to headlines and buttons', () => {
    expect(css).not.toMatch(/--font-display/);
  });

  it('never names Verdana, and never justifies or right-aligns text', () => {
    expect(css).not.toMatch(/verdana/i);
    expect(css).not.toMatch(/text-align:\s*(justify|right|end)/);
  });

  it('keeps every dashboard style in one file', () => {
    expect(sources.length).toBeGreaterThanOrEqual(2);
    for (const file of sources) expect(readFileSync(join(root, file), 'utf8'), file).not.toMatch(/<style/);
  });

  it('sets nothing but a width in a style attribute', () => {
    for (const file of sources) {
      for (const match of readFileSync(join(root, file), 'utf8').matchAll(/\sstyle=\{?["'`]([^"'`]*)/g)) {
        expect(match[1], file).toMatch(/^width: \$\{percent\}%$/);
      }
    }
  });

  it('gives the ghost button a clear background, which a button element does not have by default', () => {
    const button = readFileSync(join(root, 'src/components/Button.astro'), 'utf8');
    expect(button).toMatch(/\.btn--ghost \{[^}]*background: transparent;/);
  });
});
````

Add to `tests/site/dashboard.test.ts`, after the block "the public site beside the dashboard":

````ts
describe('the dashboard pages', () => {
  const pages = ['index.astro', 'unavailable.astro', 'sign-out.ts', 'api/keep-awake.ts'];

  it.each(pages)('renders %s on request', (name) => {
    expect(read(`src/pages/dashboard/${name}`)).toMatch(/^export const prerender = false;$/m);
  });

  it('sets a session cookie that scripts cannot read and that stays inside the dashboard', () => {
    const signIn = read('src/pages/dashboard/index.astro');
    for (const setting of ['httpOnly: true', 'secure: import.meta.env.PROD', "sameSite: 'lax'", "path: '/dashboard'"]) {
      expect(signIn).toContain(setting);
    }
  });

  it('renders no other page on request', () => {
    for (const name of ['index', 'school', 'programme', 'teams', 'season', 'resources', 'support', '404', '[event]']) {
      expect(read(`src/pages/${name}.astro`), name).not.toMatch(/prerender\s*=\s*false/);
    }
  });

  it('sends its styles with the page, not with the public site', () => {
    expect(siteCss()).not.toMatch(/\.dash-/);
  });
});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `npx vitest run tests/unit/dashboard/styles.test.ts`
Expected: FAIL. `src/styles/dashboard.css` is missing.

- [ ] **Step 3: Let `Button` send a form**

`src/components/Button.astro`. Replace everything above `<style>` with:

````astro
---
interface Props {
  /** Where the link goes. Left out, the button sends the form it sits in. */
  href?: string;
  variant?: 'primary' | 'ghost';
  size?: 'normal' | 'small';
  /** Opens in a new tab. Use for links that leave the site. */
  external?: boolean;
  /** For a button in a form: the field it sends. */
  name?: string;
  value?: string;
  /** For a button that shows a choice: whether it is the one chosen. */
  pressed?: boolean;
}

const { href, variant = 'primary', size = 'normal', external = false, name, value, pressed } = Astro.props;
const classes = ['btn', `btn--${variant}`, size === 'small' && 'btn--small'];
---

{
  href === undefined ? (
    <button class:list={classes} type="submit" name={name} value={value} aria-pressed={pressed}>
      <slot />
    </button>
  ) : (
    <a
      class:list={classes}
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
    >
      <slot />
      {external && <span class="sr-only"> (opens in a new tab)</span>}
    </a>
  )
}
````

In the `<style>` block, add `cursor: pointer;` to `.btn` after `text-transform: uppercase;`. Add this rule after `.btn`:

```css
  .btn--small {
    min-height: 2.75rem;
    padding: 0.5rem 1rem;
    font-size: 0.8125rem;
  }
```

And make `.btn--ghost` read:

```css
  .btn--ghost {
    /* A button element has a background of its own. A link has none. */
    background: transparent;
    border-color: var(--fg-strong, var(--white));
    color: var(--fg-strong, var(--white));
  }
```

Every existing use of `Button` passes `href`, so each still renders the same link.

- [ ] **Step 4: Write the styles, the guard and the two pages**

`src/styles/dashboard.css`:

````css
/* The team dashboard. Every colour comes from tokens.css, through the variables that
   Section.astro sets for the surface the dashboard sits on. */

.dash-narrow {
  max-width: 32rem;
}

.dash-head {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 1rem 2rem;
}

.dash-block > * + * {
  margin-block-start: 1.25rem;
}

.dash-form {
  --stack: 1rem;
}

.dash-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: 1rem;
  align-items: start;
}

.dash-field {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
}

.dash-field label,
.dash-legend {
  font-size: var(--text-small);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fg-muted, var(--carbon-300));
}

.dash-field input,
.dash-field select,
.dash-field textarea {
  width: 100%;
  min-height: 3rem;
  padding: 0.6rem 0.85rem;
  border: 2px solid var(--fg-muted, var(--carbon-300));
  border-radius: 0.25rem;
  background: var(--carbon-shadow);
  color: var(--white);
  font: inherit;
  color-scheme: dark;
}

.dash-field textarea {
  min-height: 9rem;
  resize: vertical;
}

.dash-field [aria-invalid='true'] {
  border-color: var(--podium-gold);
}

.dash-hint {
  font-size: var(--text-small);
  color: var(--fg-muted, var(--carbon-300));
}

/* A message about what the person typed. The gold bar marks it without relying on colour alone:
   the text says what is wrong. */
.dash-message {
  padding-inline-start: 0.75rem;
  border-inline-start: 4px solid var(--podium-gold);
  color: var(--fg-strong, var(--white));
  font-weight: 500;
}

.dash-notice {
  padding: 0.85rem 1rem;
  border: 1px solid var(--card-border, var(--carbon-800));
  border-inline-start: 4px solid var(--pitlane-pink);
  border-radius: var(--radius);
  background: var(--card-bg, var(--gradient-core));
  color: var(--fg-strong, var(--white));
}

.dash-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--text-h3);
  font-weight: 700;
  letter-spacing: 0.08em;
  user-select: all;
}

/* Progress */
.dash-bar {
  height: 0.75rem;
  border-radius: 999px;
  background: var(--carbon-700);
  overflow: hidden;
}

.dash-bar__fill {
  height: 100%;
  border-radius: inherit;
  background: var(--gradient-secondary);
}

/* Lists of deliverables, tasks, links and teams */
.dash-list {
  display: grid;
  gap: 0.75rem;
  padding: 0;
  list-style: none;
}

.dash-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.75rem 1.5rem;
  align-items: center;
  padding: 1rem 1.25rem;
  border: 1px solid var(--card-border, var(--carbon-800));
  border-radius: var(--radius);
  background: var(--card-bg, var(--gradient-core));
}

.dash-row__title {
  color: var(--fg-strong, var(--white));
  font-weight: 700;
}

.dash-row__title--done {
  text-decoration-line: line-through;
}

.dash-row__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.75rem;
  align-items: center;
  font-size: var(--text-small);
  color: var(--fg-muted, var(--carbon-300));
}

.dash-row__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.dash-row__actions form {
  display: contents;
}

.dash-row details {
  grid-column: 1 / -1;
}

.dash-row summary {
  width: fit-content;
  min-height: 2.75rem;
  padding-block: 0.6rem;
  cursor: pointer;
  text-decoration-line: underline;
  text-decoration-color: var(--pitlane-pink);
  text-decoration-thickness: 0.125em;
  text-underline-offset: 0.22em;
}

.dash-row details[open] > summary {
  margin-block-end: 0.75rem;
}

.tag--overdue {
  border-color: var(--podium-gold);
  background: var(--podium-gold);
  color: var(--carbon-shadow);
}

.tag--mentor {
  border-color: var(--pitlane-pink);
}

.dash-note {
  white-space: pre-wrap;
}

@media (min-width: 48rem) {
  .dash-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
}
````

`src/middleware.ts`:

````ts
// Guards every page under /dashboard. The public pages are built ahead of time and pass through.
import { defineMiddleware } from 'astro:middleware';
import { DashboardUnavailable } from './lib/dashboard/db';
import { getDb, sessionSecret } from './lib/dashboard/runtime';
import { formToken, formTokenMatches, readSession, SESSION_COOKIE } from './lib/dashboard/session';
import { getTeam } from './lib/dashboard/store';

const SIGN_IN = '/dashboard';
/** Pages that need no session. */
const OPEN = new Set([SIGN_IN, '/dashboard/unavailable', '/dashboard/api/keep-awake']);

function isDashboard(path: string): boolean {
  return path === SIGN_IN || path.startsWith(`${SIGN_IN}/`);
}

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname.replace(/\/+$/, '') || '/';
  if (context.isPrerendered || !isDashboard(path)) return next();

  let response: Response;
  try {
    response = await guard();
  } catch (error) {
    if (!(error instanceof DashboardUnavailable)) throw error;
    console.error('Dashboard unavailable:', error.message);
    // A new request, because a form's body may have been read and cannot be sent on twice.
    response = await context.rewrite(new Request(new URL('/dashboard/unavailable', context.url)));
  }
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Cache-Control', 'no-store');
  return response;

  async function guard(): Promise<Response> {
    const cookie = context.cookies.get(SESSION_COOKIE)?.value;
    const session = readSession(cookie, sessionSecret());
    const leave = (reason: 'again' | 'closed') => {
      context.cookies.delete(SESSION_COOKIE, { path: SIGN_IN });
      return context.redirect(`${SIGN_IN}?${reason}=1`, 303);
    };

    if (!cookie || !session) {
      if (OPEN.has(path)) return next();
      return leave('again');
    }

    let team;
    if (session.role === 'team') {
      team = session.teamId === null ? undefined : await getTeam(getDb(), session.teamId);
      if (!team || team.codeVersion !== session.codeVersion) return leave('again');
      if (team.archived) return leave('closed');
    }

    const home = session.role === 'mentor' ? '/dashboard/mentor' : '/dashboard/team';
    if (path === SIGN_IN) return context.redirect(home, 303);
    if (!OPEN.has(path) && path !== '/dashboard/sign-out' && path !== home && !path.startsWith(`${home}/`)) {
      return context.redirect(home, 303);
    }

    const secret = sessionSecret();
    if (context.request.method !== 'GET' && context.request.method !== 'HEAD' && !OPEN.has(path)) {
      let sent: unknown;
      try {
        sent = (await context.request.clone().formData()).get('token');
      } catch {
        sent = undefined;
      }
      if (!formTokenMatches(sent, cookie, secret)) {
        return new Response('This form has expired. Go back and reload the page.', { status: 403 });
      }
    }

    context.locals.dashboard = { session, team, token: formToken(cookie, secret) };
    return next();
  }
});
````

`src/pages/dashboard/index.astro`:

````astro
---
import Button from '../../components/Button.astro';
import Section from '../../components/Section.astro';
import Base from '../../layouts/Base.astro';
import { signIn } from '../../lib/dashboard/actions';
import { getDb, mentorCodeHash, sessionSecret } from '../../lib/dashboard/runtime';
import { SESSION_COOKIE, SESSION_SECONDS } from '../../lib/dashboard/session';
import '../../styles/dashboard.css';

export const prerender = false;

let message = '';
if (Astro.url.searchParams.has('again')) message = 'Please sign in again.';
if (Astro.url.searchParams.has('closed')) message = 'This workspace is closed. Ask your mentor.';

if (Astro.request.method === 'POST') {
  const form = await Astro.request.formData();
  const result = await signIn(getDb(), {
    code: form.get('code'),
    address: Astro.clientAddress,
    secret: sessionSecret(),
    mentorCodeHash: mentorCodeHash(),
  });
  if (result.ok) {
    Astro.cookies.set(SESSION_COOKIE, result.cookie, {
      httpOnly: true,
      // Safari refuses a Secure cookie from http://localhost, so it is Secure on the built site only.
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/dashboard',
      maxAge: SESSION_SECONDS,
    });
    return Astro.redirect(result.next, 303);
  }
  message = result.message;
  Astro.response.status = result.reason === 'blocked' ? 429 : 401;
}
---

<Base title="Team sign-in" description="Sign in to the STEM Racing team dashboard at The British School, New Delhi.">
  <Section surface="dark" labelledby="sign-in-title">
    <div class="stack dash-narrow">
      <h1 id="sign-in-title">Team sign-in</h1>
      <p class="lead">Enter the access code your mentor gave your team.</p>
      <form class="dash-form stack" method="post" action="/dashboard">
        <div class="dash-field">
          <label for="code">Access code</label>
          <input
            id="code"
            name="code"
            type="password"
            required
            autofocus
            maxlength="64"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            aria-describedby={message ? 'code-message' : undefined}
            aria-invalid={message ? 'true' : undefined}
          />
          {message && <p id="code-message" class="dash-message" role="alert">{message}</p>}
        </div>
        <div class="actions">
          <Button>Sign in</Button>
        </div>
      </form>
    </div>
  </Section>
</Base>
````

`src/pages/dashboard/sign-out.ts`:

````ts
import type { APIRoute } from 'astro';
import { SESSION_COOKIE } from '../../lib/dashboard/session';

export const prerender = false;

// The middleware has checked the form's token by the time this runs.
export const POST: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(SESSION_COOKIE, { path: '/dashboard' });
  return redirect('/dashboard', 303);
};

export const GET: APIRoute = ({ redirect }) => redirect('/dashboard', 303);
````

- [ ] **Step 5: Run the tests to see them pass**

Run: `npm run test:all`
Expected: PASS.

Run: `npm run check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 6: Make a team to sign in as**

No page adds a team until Task 12. For this check, add one to the local database by hand. With `npm run dashboard:db` running:

```bash
npx tsx --env-file=.env -e "
import('./src/lib/dashboard/db.ts').then(async ({ connect }) => {
  const { hashCode } = await import('./src/lib/dashboard/codes.ts');
  const { createTeam } = await import('./src/lib/dashboard/store.ts');
  const db = connect(process.env.DATABASE_URL);
  console.log(await createTeam(db, { slug: 'test-local', name: 'Test Local', codeHash: await hashCode('TEST-LOCAL-01') }));
  process.exit(0);
});"
```

Expected: `{ id: 1, slug: 'test-local', name: 'Test Local', codeVersion: 1, archived: false }`. This team is in `.dashboard-db` on this computer and nowhere else.

- [ ] **Step 7: Check signing in by hand**

```bash
npx astro dev --port 4321 &
sleep 6
B=http://localhost:4321
curl -s -o /dev/null -D - $B/dashboard | grep -i -E "^HTTP|robots|cache-control"
curl -s -o /dev/null -D - $B/dashboard/team | grep -i -E "^HTTP|location"
curl -s -o /tmp/p.html -w "%{http_code}\n" -H "Origin: $B" -d "code=TEST-WRONG-01" $B/dashboard
grep -o 'role="alert">[^<]*' /tmp/p.html
curl -s -o /dev/null -D - -c /tmp/jar -H "Origin: $B" -d "code=test local 01" $B/dashboard | grep -i -E "^HTTP|location|set-cookie" | cut -c1-60
curl -s -b /tmp/jar -o /dev/null -D - $B/dashboard | grep -i -E "^HTTP|location"
curl -s -b /tmp/jar -o /dev/null -w "%{http_code}\n" -H "Origin: $B" -d "x=1" $B/dashboard/sign-out
```

Expected, in order:

```
HTTP/1.1 200 OK
cache-control: no-store
x-robots-tag: noindex, nofollow
HTTP/1.1 303 See Other
location: /dashboard?again=1
401
role="alert">That code was not recognised.
HTTP/1.1 303 See Other
location: /dashboard/team
set-cookie: tbs_dashboard=
HTTP/1.1 303 See Other
location: /dashboard/team
403
```

`/dashboard/team` does not exist until Task 11, so following that redirect gives 404 for now.

- [ ] **Step 8: Check the limit by hand**

```bash
for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w "%{http_code} " -H "Origin: $B" -H "X-Forwarded-For: 198.51.100.9" -d "code=TEST-WRONG-0$i" $B/dashboard; done
```

Expected: `401 401 401 401 401 429`. On this computer every request comes from one address, so sign-in is now blocked for 15 minutes. Clear it with:

```bash
npx tsx --env-file=.env -e "import('./src/lib/dashboard/db.ts').then(async ({ connect }) => { await connect(process.env.DATABASE_URL).query('delete from signin_failures'); process.exit(0); });"
```

- [ ] **Step 9: Check the page for when the database is down**

Stop `npm run dashboard:db` with Ctrl+C. Then:

```bash
curl -s -o /tmp/u.html -w "%{http_code}\n" -H "Origin: $B" -d "code=TEST-LOCAL-01" $B/dashboard
grep -o "<h1[^>]*>[^<]*" /tmp/u.html
npx astro dev stop
```

Expected: `503` and `<h1 id="unavailable-title">The dashboard is unavailable`. Start `npm run dashboard:db` again.

- [ ] **Step 10: Commit**

```bash
git add src/middleware.ts src/pages/dashboard/index.astro src/pages/dashboard/sign-out.ts src/styles/dashboard.css src/components/Button.astro tests/unit/dashboard/styles.test.ts tests/site/dashboard.test.ts
git commit -m "feat: guard the dashboard and add sign-in"
```

### Task 11: The team workspace

**Files:**
- Create: `src/components/dashboard/Workspace.astro`
- Create: `src/pages/dashboard/team.astro`
- Modify: `tests/unit/dashboard/styles.test.ts`
- Modify: `tests/site/dashboard.test.ts`

**Interfaces:**
- Consumes: `workspaceAction`, `noticeFor`, `ActionResult` from Task 7; `loadWorkspace`, `Workspace` from Task 6; `getDb` from Task 9; `Astro.locals.dashboard` and `Button` from Task 10; `getCurrentSeason`, `getProgramme` from `src/lib/content.ts` and `todayIso`, `formatDate` from `src/lib/season.ts`, which exist.
- Produces: `Workspace.astro` with the props `workspace: Workspace`, `author: Author`, `action: string`, `token: string`, `roles: readonly string[]`, `failed?: Extract<ActionResult, { ok: false }>`. Stage 2 uses it again for the mentor's view of a team.

- [ ] **Step 1: Write the failing tests**

In `tests/unit/dashboard/styles.test.ts`, make `sources` read both folders:

```ts
const sources = [...astroFiles('src/pages/dashboard'), ...astroFiles('src/components/dashboard')];
```

and add this test at the end of the `describe` block:

```ts
  it('marks overdue and refused entries in words, not by colour alone', () => {
    const workspace = readFileSync(join(root, 'src/components/dashboard/Workspace.astro'), 'utf8');
    expect(workspace).toMatch(/tag--overdue">Overdue</);
    expect(workspace).toMatch(/tag--mentor">From your mentor</);
  });
```

In `tests/site/dashboard.test.ts`, add `'team.astro'` to `pages`:

```ts
  const pages = ['index.astro', 'team.astro', 'unavailable.astro', 'sign-out.ts', 'api/keep-awake.ts'];
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npx vitest run tests/unit/dashboard/styles.test.ts`
Expected: FAIL. `src/components/dashboard` is missing.

- [ ] **Step 3: Write the component and the page**

`src/components/dashboard/Workspace.astro`:

````astro
---
// One team's workspace. The team sees it at /dashboard/team. In stage 2 a mentor sees the same
// view at /dashboard/mentor/team/[slug].
import type { ActionResult } from '../../lib/dashboard/actions';
import { DELIVERABLES, STATUSES } from '../../lib/dashboard/deliverables';
import { LIMITS } from '../../lib/dashboard/fields';
import type { Author } from '../../lib/dashboard/store';
import type { Workspace } from '../../lib/dashboard/workspace';
import { formatDate } from '../../lib/season';
import Button from '../Button.astro';

interface Props {
  workspace: Workspace;
  /** Who is looking. A team may not edit a mentor's task. A mentor may not edit the note or links. */
  author: Author;
  /** The address the forms are sent to. */
  action: string;
  token: string;
  roles: readonly string[];
  /** The form that was refused, to show its messages and what was typed. */
  failed?: Extract<ActionResult, { ok: false }> | undefined;
}

const { workspace, author, action, token, roles, failed } = Astro.props;
const total = DELIVERABLES.length;
const percent = Math.round((workspace.doneCount / total) * 100);
const statusLabel = (value: string) => STATUSES.find((status) => status.value === value)?.label ?? value;

/** The refused form, when it is the one named and, for an edit, the row named. */
const refusal = (name: string, id?: number) =>
  failed && failed.action === name && (id === undefined || failed.values.id === String(id)) ? failed : undefined;
const addTask = refusal('task-add');
const note = refusal('note');
const addLink = refusal('link-add');
const canEdit = (createdBy: Author) => author === 'mentor' || createdBy === 'team';
---

<section class="dash-block" aria-labelledby="deadline-title">
  <h2 id="deadline-title">Next deadline</h2>
  {
    workspace.deadline ? (
      <div class="card">
        <p class="dash-row__title">{workspace.deadline.title}</p>
        <p>{workspace.deadline.when}</p>
        {workspace.deadline.left && <p class="muted">{workspace.deadline.left}</p>}
      </div>
    ) : (
      <p class="muted">The next deadline appears here when the season timeline has one.</p>
    )
  }
</section>

<section class="dash-block" id="deliverables" aria-labelledby="deliverables-title">
  <h2 id="deliverables-title">Deliverables</h2>
  <p>{workspace.doneCount} of {total} done</p>
  <div class="dash-bar" aria-hidden="true">
    <div class="dash-bar__fill" style={`width: ${percent}%`}></div>
  </div>
  {refusal('deliverable') && <p class="dash-message" role="alert">{refusal('deliverable')?.errors.form}</p>}
  <ul class="dash-list">
    {
      workspace.deliverables.map((line) => (
        <li class="dash-row">
          <div>
            <p class="dash-row__title">{line.label}</p>
            <p class="dash-row__meta">{statusLabel(line.status)}</p>
          </div>
          <form class="dash-row__actions" method="post" action={`${action}#deliverables`}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="action" value="deliverable" />
            <input type="hidden" name="key" value={line.key} />
            {STATUSES.map((status) => (
              <Button
                size="small"
                variant={status.value === line.status ? 'primary' : 'ghost'}
                pressed={status.value === line.status}
                name="status"
                value={status.value}
              >
                {status.label}
                <span class="sr-only">: {line.label}</span>
              </Button>
            ))}
          </form>
        </li>
      ))
    }
  </ul>
</section>

<section class="dash-block" id="tasks" aria-labelledby="tasks-title">
  <h2 id="tasks-title">Tasks</h2>
  {
    ['task-done', 'task-delete'].map(
      (name) => refusal(name) && <p class="dash-message" role="alert">{refusal(name)?.errors.form}</p>,
    )
  }
  {
    workspace.tasks.length === 0 ? (
      <p class="muted">No tasks yet. Tasks from your mentor and tasks your team adds appear here.</p>
    ) : (
      <ul class="dash-list">
        {workspace.tasks.map((task) => {
          const edit = refusal('task-edit', task.id);
          const values = edit?.values ?? {
            title: task.title,
            ownerRole: task.ownerRole ?? '',
            dueDate: task.dueDate ?? '',
          };
          return (
            <li class="dash-row">
              <div>
                <p class:list={['dash-row__title', task.done && 'dash-row__title--done']}>{task.title}</p>
                <p class="dash-row__meta">
                  {task.createdBy === 'mentor' && <span class="tag tag--mentor">From your mentor</span>}
                  {task.overdue && <span class="tag tag--overdue">Overdue</span>}
                  {task.done && <span>Done</span>}
                  {task.ownerRole && <span>{task.ownerRole}</span>}
                  {task.dueDate && <span>Due {formatDate(task.dueDate)}</span>}
                </p>
              </div>
              <div class="dash-row__actions">
                <form method="post" action={`${action}#tasks`}>
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="action" value="task-done" />
                  <input type="hidden" name="id" value={task.id} />
                  <Button size="small" name="done" value={task.done ? 'false' : 'true'}>
                    {task.done ? 'Reopen' : 'Tick off'}
                    <span class="sr-only">: {task.title}</span>
                  </Button>
                </form>
                {canEdit(task.createdBy) && (
                  <form method="post" action={`${action}#tasks`}>
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="id" value={task.id} />
                    <Button size="small" variant="ghost" name="action" value="task-delete">
                      Delete
                      <span class="sr-only">: {task.title}</span>
                    </Button>
                  </form>
                )}
              </div>
              {canEdit(task.createdBy) && (
                <details open={edit !== undefined}>
                  <summary>
                    Edit
                    <span class="sr-only">: {task.title}</span>
                  </summary>
                  <form class="dash-form stack" method="post" action={`${action}#tasks`}>
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="action" value="task-edit" />
                    <input type="hidden" name="id" value={task.id} />
                    {edit?.errors.form && <p class="dash-message" role="alert">{edit.errors.form}</p>}
                    <div class="dash-fields">
                      <div class="dash-field">
                        <label for={`task-${task.id}-title`}>Title</label>
                        <input
                          id={`task-${task.id}-title`}
                          name="title"
                          required
                          maxlength={LIMITS.title}
                          value={values.title}
                          aria-invalid={edit?.errors.title ? 'true' : undefined}
                          aria-describedby={edit?.errors.title ? `task-${task.id}-title-message` : undefined}
                        />
                        {edit?.errors.title && (
                          <p id={`task-${task.id}-title-message`} class="dash-message">{edit.errors.title}</p>
                        )}
                      </div>
                      <div class="dash-field">
                        <label for={`task-${task.id}-role`}>Owner</label>
                        <select id={`task-${task.id}-role`} name="ownerRole">
                          <option value="">No owner</option>
                          {roles.map((role) => (
                            <option value={role} selected={role === values.ownerRole}>{role}</option>
                          ))}
                        </select>
                      </div>
                      <div class="dash-field">
                        <label for={`task-${task.id}-due`}>Due date</label>
                        <input
                          id={`task-${task.id}-due`}
                          name="dueDate"
                          type="date"
                          value={values.dueDate}
                          aria-invalid={edit?.errors.dueDate ? 'true' : undefined}
                          aria-describedby={edit?.errors.dueDate ? `task-${task.id}-due-message` : undefined}
                        />
                        {edit?.errors.dueDate && (
                          <p id={`task-${task.id}-due-message`} class="dash-message">{edit.errors.dueDate}</p>
                        )}
                      </div>
                    </div>
                    <div class="actions">
                      <Button size="small">Save task</Button>
                    </div>
                  </form>
                </details>
              )}
            </li>
          );
        })}
      </ul>
    )
  }

  <form class="dash-form stack card" method="post" action={`${action}#tasks`} aria-labelledby="task-add-title">
    <h3 id="task-add-title">Add a task</h3>
    <input type="hidden" name="token" value={token} />
    <input type="hidden" name="action" value="task-add" />
    {addTask?.errors.form && <p class="dash-message" role="alert">{addTask.errors.form}</p>}
    <div class="dash-fields">
      <div class="dash-field">
        <label for="task-title">Title</label>
        <input
          id="task-title"
          name="title"
          required
          maxlength={LIMITS.title}
          value={addTask?.values.title}
          aria-invalid={addTask?.errors.title ? 'true' : undefined}
          aria-describedby={addTask?.errors.title ? 'task-title-message' : undefined}
        />
        {addTask?.errors.title && <p id="task-title-message" class="dash-message">{addTask.errors.title}</p>}
      </div>
      <div class="dash-field">
        <label for="task-role">Owner</label>
        <select
          id="task-role"
          name="ownerRole"
          aria-invalid={addTask?.errors.ownerRole ? 'true' : undefined}
          aria-describedby={addTask?.errors.ownerRole ? 'task-role-message' : undefined}
        >
          <option value="">No owner</option>
          {roles.map((role) => <option value={role} selected={role === addTask?.values.ownerRole}>{role}</option>)}
        </select>
        {addTask?.errors.ownerRole && <p id="task-role-message" class="dash-message">{addTask.errors.ownerRole}</p>}
      </div>
      <div class="dash-field">
        <label for="task-due">Due date</label>
        <input
          id="task-due"
          name="dueDate"
          type="date"
          value={addTask?.values.dueDate}
          aria-invalid={addTask?.errors.dueDate ? 'true' : undefined}
          aria-describedby={addTask?.errors.dueDate ? 'task-due-message' : undefined}
        />
        {addTask?.errors.dueDate && <p id="task-due-message" class="dash-message">{addTask.errors.dueDate}</p>}
      </div>
    </div>
    <div class="actions">
      <Button>Add task</Button>
    </div>
  </form>
</section>

<section class="dash-block" id="notes" aria-labelledby="notes-title">
  <h2 id="notes-title">Notes and links</h2>
  {
    author === 'team' ? (
      <form class="dash-form stack" method="post" action={`${action}#notes`}>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="action" value="note" />
        <div class="dash-field">
          <label for="note">Status note</label>
          <textarea
            id="note"
            name="note"
            maxlength={LIMITS.note}
            aria-invalid={note?.errors.note ? 'true' : undefined}
            aria-describedby={note?.errors.note ? 'note-message note-hint' : 'note-hint'}
            set:text={note?.values.note ?? workspace.note}
          />
          <p id="note-hint" class="dash-hint">Your mentors can read this. Up to {LIMITS.note} characters.</p>
          {note?.errors.note && <p id="note-message" class="dash-message">{note.errors.note}</p>}
        </div>
        <div class="actions">
          <Button size="small">Save note</Button>
        </div>
      </form>
    ) : workspace.note ? (
      <p class="dash-note card">{workspace.note}</p>
    ) : (
      <p class="muted">The team has not written a status note.</p>
    )
  }

  <h3 id="links-title">Links</h3>
  {refusal('link-delete') && <p class="dash-message" role="alert">{refusal('link-delete')?.errors.form}</p>}
  {
    workspace.links.length === 0 ? (
      <p class="muted">No links yet. Save the address of your Drive folder or your CAD files here.</p>
    ) : (
      <ul class="dash-list" aria-labelledby="links-title">
        {workspace.links.map((link) => (
          <li class="dash-row">
            <a href={link.url} target="_blank" rel="noopener noreferrer nofollow">
              {link.label}
              <span class="sr-only"> (opens in a new tab)</span>
            </a>
            {author === 'team' && (
              <form class="dash-row__actions" method="post" action={`${action}#notes`}>
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="id" value={link.id} />
                <Button size="small" variant="ghost" name="action" value="link-delete">
                  Delete
                  <span class="sr-only">: {link.label}</span>
                </Button>
              </form>
            )}
          </li>
        ))}
      </ul>
    )
  }
  {
    author === 'team' && (
      <form class="dash-form stack card" method="post" action={`${action}#notes`} aria-labelledby="link-add-title">
        <h3 id="link-add-title">Add a link</h3>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="action" value="link-add" />
        {addLink?.errors.form && <p class="dash-message" role="alert">{addLink.errors.form}</p>}
        <div class="dash-fields">
          <div class="dash-field">
            <label for="link-label">Name</label>
            <input
              id="link-label"
              name="label"
              required
              maxlength={LIMITS.linkLabel}
              value={addLink?.values.label}
              aria-invalid={addLink?.errors.label ? 'true' : undefined}
              aria-describedby={addLink?.errors.label ? 'link-label-message' : undefined}
            />
            {addLink?.errors.label && <p id="link-label-message" class="dash-message">{addLink.errors.label}</p>}
          </div>
          <div class="dash-field">
            <label for="link-url">Address</label>
            <input
              id="link-url"
              name="url"
              type="url"
              required
              maxlength={LIMITS.url}
              placeholder="https://"
              value={addLink?.values.url}
              aria-invalid={addLink?.errors.url ? 'true' : undefined}
              aria-describedby={addLink?.errors.url ? 'link-url-message' : undefined}
            />
            {addLink?.errors.url && <p id="link-url-message" class="dash-message">{addLink.errors.url}</p>}
          </div>
        </div>
        <div class="actions">
          <Button size="small">Add link</Button>
        </div>
      </form>
    )
  }
</section>
````

`src/pages/dashboard/team.astro`:

````astro
---
import Button from '../../components/Button.astro';
import Workspace from '../../components/dashboard/Workspace.astro';
import Section from '../../components/Section.astro';
import Base from '../../layouts/Base.astro';
import { getCurrentSeason, getProgramme } from '../../lib/content';
import { noticeFor, workspaceAction, type ActionResult } from '../../lib/dashboard/actions';
import { getDb } from '../../lib/dashboard/runtime';
import { loadWorkspace } from '../../lib/dashboard/workspace';
import { todayIso } from '../../lib/season';
import '../../styles/dashboard.css';

export const prerender = false;

const dashboard = Astro.locals.dashboard;
// The middleware sends anyone without a team session away before this runs.
if (!dashboard?.team) return Astro.redirect('/dashboard', 303);
const { team, token } = dashboard;

const db = getDb();
const roles = (await getProgramme()).roles.map((role) => role.title);

let failed: Extract<ActionResult, { ok: false }> | undefined;
if (Astro.request.method === 'POST') {
  const result = await workspaceAction(db, team.id, 'team', await Astro.request.formData(), roles);
  if (result.ok) return Astro.redirect(`/dashboard/team?saved=${encodeURIComponent(result.action)}`, 303);
  failed = result;
  Astro.response.status = 422;
}

const notice = noticeFor(Astro.url.searchParams.get('saved'));
const workspace = await loadWorkspace(db, team.id, await getCurrentSeason(), todayIso());
---

<Base title={`${team.name} workspace`} description="A team workspace on the STEM Racing dashboard.">
  <Section surface="dark" labelledby="workspace-title">
    <div class="stack stack--loose">
      <div class="dash-head">
        <div class="stack">
          <p class="eyebrow">Team workspace</p>
          <h1 id="workspace-title">{team.name}</h1>
        </div>
        <form method="post" action="/dashboard/sign-out">
          <input type="hidden" name="token" value={token} />
          <Button variant="ghost" size="small">Sign out</Button>
        </form>
      </div>
      {notice && <p class="dash-notice" role="status">{notice}</p>}
      <Workspace workspace={workspace} author="team" action="/dashboard/team" token={token} roles={roles} failed={failed} />
    </div>
  </Section>
</Base>
````

- [ ] **Step 4: Run the tests to see them pass**

Run: `npm run test:all`
Expected: PASS.

Run: `npm run check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 5: Check the workspace by hand**

With `npm run dashboard:db` running and the team from Task 10, step 6:

```bash
npx astro dev --port 4321 &
sleep 6
B=http://localhost:4321; J=/tmp/jar; rm -f $J
curl -s -o /dev/null -c $J -H "Origin: $B" -d "code=TEST-LOCAL-01" $B/dashboard
curl -s -b $J -o /tmp/t.html -w "%{http_code}\n" $B/dashboard/team
T=$(grep -o 'name="token" value="[^"]*' /tmp/t.html | head -1 | sed 's/.*value="//')
grep -o "<h1[^>]*>[^<]*" /tmp/t.html; grep -o "[0-9]* of 10 done" /tmp/t.html
curl -s -b $J -o /dev/null -D - -H "Origin: $B" --data-urlencode "token=$T" -d "action=deliverable&key=car&status=done" $B/dashboard/team | grep -i -E "^HTTP|location"
curl -s -b $J -o /dev/null -w "%{http_code}\n" -H "Origin: $B" --data-urlencode "token=$T" --data-urlencode "title=Sand <b>the</b> body" -d "action=task-add&ownerRole=Enterprise&dueDate=2026-09-01" $B/dashboard/team
curl -s -b $J -o /tmp/t.html "$B/dashboard/team?saved=task-add"
grep -o "[0-9]* of 10 done" /tmp/t.html; grep -o 'role="status">[^<]*' /tmp/t.html; grep -o 'Sand[^<]*' /tmp/t.html | head -1
curl -s -b $J -o /tmp/t.html -w "%{http_code}\n" -H "Origin: $B" --data-urlencode "token=$T" -d "action=task-add&title=&ownerRole=Enterprise&dueDate=2026-09-31" $B/dashboard/team
grep -o 'class="dash-message">[^<]*' /tmp/t.html; grep -o '<option value="Enterprise" selected' /tmp/t.html | head -1
curl -s -b $J "$B/dashboard/team?saved=%3Cscript%3E" | grep -c 'role="status"'
curl -s -b $J -o /dev/null -w "%{http_code}\n" -H "Origin: https://evil.example" --data-urlencode "token=$T" -d "action=note&note=x" $B/dashboard/team
```

Expected, in order:

```
200
<h1 id="workspace-title">Test Local
0 of 10 done
HTTP/1.1 303 See Other
location: /dashboard/team?saved=deliverable
303
1 of 10 done
role="status">Task added.
Sand &lt;b&gt;the&lt;/b&gt; body
422
class="dash-message">Give the task a title.
class="dash-message">Use a date on the calendar, in the form 2026-10-02.
<option value="Enterprise" selected
0
403
```

The two `303` answers are what stop a refresh from sending a form twice.

- [ ] **Step 6: Look at it**

Open `http://localhost:4321/dashboard` in the browser, sign in with `TEST-LOCAL-01`, and check at 375, 768 and 1440 wide:

| Check | Expected |
|---|---|
| Sideways scroll | None. `document.documentElement.scrollWidth` equals `clientWidth`. |
| `h1` | One, the team name |
| Buttons, fields and "Edit" | Each 44px tall or more |
| Ghost buttons ("In progress", "Delete", "Sign out") | White text on the dark surface, with a white border |
| The status that is set | The filled button, and the words under the name of the line |
| The overdue task | A gold tag that reads "Overdue" |
| Keyboard only | Tab reaches every control in reading order, with the gold focus ring |
| Scripts off | Every form still works |

Then run `npx astro dev stop`.

- [ ] **Step 7: Commit**

```bash
git add src/components/dashboard/Workspace.astro src/pages/dashboard/team.astro tests/unit/dashboard/styles.test.ts tests/site/dashboard.test.ts
git commit -m "feat: add the team workspace"
```

### Task 12: The mentor page and the footer link

**Files:**
- Create: `src/pages/dashboard/mentor.astro`
- Modify: `src/components/Footer.astro:34-38`
- Modify: `tests/site/dashboard.test.ts`

**Interfaces:**
- Consumes: `mentorAction`, `noticeFor`, `ActionResult` from Task 7; `listTeams` from Task 4; `CODE_MAX` from Task 1; `getDb`, `mentorCodeHash` from Task 9; `Astro.locals.dashboard` and `Button` from Task 10.
- Produces: `/dashboard/mentor`. Stage 2 adds the overview table to this page.

A code is shown on the page that answers the form, and that page is not redirected to. So the code is in no address and no history, and it is gone on the next visit.

- [ ] **Step 1: Write the failing tests**

In `tests/site/dashboard.test.ts`, add `'mentor.astro'` to `pages`:

```ts
  const pages = ['index.astro', 'team.astro', 'mentor.astro', 'unavailable.astro', 'sign-out.ts', 'api/keep-awake.ts'];
```

and add this test to the block "the public site beside the dashboard", after "builds no dashboard page ahead of time":

```ts
  it.each(ROUTES)('links to the sign-in page from the footer of %s', (route) => {
    const $ = page(route);
    expect(texts($, '.site-footer a[href="/dashboard"]')).toEqual(['Team sign-in']);
  });
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npm run test:site`
Expected: FAIL. `mentor.astro` is missing, and no footer holds the link.

- [ ] **Step 3: Write the page**

`src/pages/dashboard/mentor.astro`:

````astro
---
import Button from '../../components/Button.astro';
import Section from '../../components/Section.astro';
import Base from '../../layouts/Base.astro';
import { getCollection } from 'astro:content';
import { mentorAction, noticeFor, type ActionResult } from '../../lib/dashboard/actions';
import { CODE_MAX } from '../../lib/dashboard/codes';
import { getDb, mentorCodeHash } from '../../lib/dashboard/runtime';
import { listTeams } from '../../lib/dashboard/store';
import '../../styles/dashboard.css';

export const prerender = false;

const dashboard = Astro.locals.dashboard;
// The middleware sends anyone without a mentor session away before this runs.
if (dashboard?.session.role !== 'mentor') return Astro.redirect('/dashboard', 303);
const { token } = dashboard;

const db = getDb();
let failed: Extract<ActionResult, { ok: false }> | undefined;
let shown: { team: string; code: string } | undefined;
let notice = noticeFor(Astro.url.searchParams.get('saved'));

if (Astro.request.method === 'POST') {
  const result = await mentorAction(db, await Astro.request.formData(), mentorCodeHash());
  if (!result.ok) {
    failed = result;
    Astro.response.status = 422;
  } else if (result.shownCode) {
    // A code is shown on this page alone. It is in no address, so it is in no history.
    shown = result.shownCode;
    notice = result.notice;
  } else {
    return Astro.redirect(`/dashboard/mentor?saved=${encodeURIComponent(result.action)}`, 303);
  }
}

const teams = await listTeams(db);
const taken = new Set(teams.map((team) => team.name.toLowerCase()));
const suggestions = (await getCollection('teams'))
  .map((entry) => entry.data.name)
  .filter((name, index, names) => names.indexOf(name) === index && !taken.has(name.toLowerCase()))
  .sort((a, b) => a.localeCompare(b));
const add = failed?.action === 'team-add' ? failed : undefined;
const rowError = (id: number) => (failed && failed.values.id === String(id) ? failed : undefined);
const CODE_HINT = 'Leave empty to have a code made. Letters and digits, 6 or more. Hyphens and spaces are ignored.';
---

<Base title="Mentor dashboard" description="The mentor pages of the STEM Racing dashboard.">
  <Section surface="dark" labelledby="mentor-title">
    <div class="stack stack--loose">
      <div class="dash-head">
        <div class="stack">
          <p class="eyebrow">Mentors</p>
          <h1 id="mentor-title">Teams</h1>
        </div>
        <form method="post" action="/dashboard/sign-out">
          <input type="hidden" name="token" value={token} />
          <Button variant="ghost" size="small">Sign out</Button>
        </form>
      </div>

      {notice && <p class="dash-notice" role="status">{notice}</p>}
      {
        shown && (
          <div class="dash-notice stack" role="status">
            <p>
              The code for {shown.team} is below. It is shown once. Write it down now and give it to the team.
            </p>
            <p class="dash-code">{shown.code}</p>
          </div>
        )
      }
      {failed?.errors.form && <p class="dash-message" role="alert">{failed.errors.form}</p>}

      <section class="dash-block" aria-labelledby="teams-title">
        <h2 id="teams-title">All teams</h2>
        {
          teams.length === 0 ? (
            <p class="muted">No teams yet. Add the first team below.</p>
          ) : (
            <ul class="dash-list">
              {teams.map((team) => {
                const error = rowError(team.id);
                return (
                  <li class="dash-row">
                    <div>
                      <p class="dash-row__title">{team.name}</p>
                      <p class="dash-row__meta">{team.archived ? 'Archived. The team cannot sign in.' : 'Open'}</p>
                    </div>
                    <form class="dash-row__actions" method="post" action="/dashboard/mentor">
                      <input type="hidden" name="token" value={token} />
                      <input type="hidden" name="action" value="team-archive" />
                      <input type="hidden" name="id" value={team.id} />
                      <Button size="small" variant="ghost" name="archived" value={team.archived ? 'false' : 'true'}>
                        {team.archived ? 'Reopen' : 'Archive'}
                        <span class="sr-only">: {team.name}</span>
                      </Button>
                    </form>
                    <details open={error?.action === 'code-reset'}>
                      <summary>
                        Reset code
                        <span class="sr-only">: {team.name}</span>
                      </summary>
                      <form class="dash-form stack" method="post" action="/dashboard/mentor">
                        <input type="hidden" name="token" value={token} />
                        <input type="hidden" name="action" value="code-reset" />
                        <input type="hidden" name="id" value={team.id} />
                        <p>Everyone using the old code is signed out.</p>
                        <div class="dash-field dash-narrow">
                          <label for={`code-${team.id}`}>New code</label>
                          <input
                            id={`code-${team.id}`}
                            name="code"
                            maxlength={CODE_MAX * 2}
                            autocomplete="off"
                            autocapitalize="characters"
                            spellcheck="false"
                            aria-invalid={error?.errors.code ? 'true' : undefined}
                            aria-describedby={`code-${team.id}-hint`}
                          />
                          <p id={`code-${team.id}-hint`} class="dash-hint">{CODE_HINT}</p>
                          {error?.errors.code && <p class="dash-message" role="alert">{error.errors.code}</p>}
                        </div>
                        <div class="actions">
                          <Button size="small">Reset code</Button>
                        </div>
                      </form>
                    </details>
                  </li>
                );
              })}
            </ul>
          )
        }
      </section>

      <section class="dash-block" id="add" aria-labelledby="add-title">
        <h2 id="add-title">Add a team</h2>
        <form class="dash-form stack card" method="post" action="/dashboard/mentor#add">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="action" value="team-add" />
          <div class="dash-fields">
            <div class="dash-field">
              <label for="team-name">Team name</label>
              <input
                id="team-name"
                name="name"
                required
                maxlength="80"
                list="team-names"
                autocomplete="off"
                value={add?.values.name}
                aria-invalid={add?.errors.name ? 'true' : undefined}
                aria-describedby={add?.errors.name ? 'team-name-message' : undefined}
              />
              <datalist id="team-names">{suggestions.map((name) => <option value={name} />)}</datalist>
              {add?.errors.name && <p id="team-name-message" class="dash-message">{add.errors.name}</p>}
            </div>
            <div class="dash-field">
              <label for="team-code">Access code</label>
              <input
                id="team-code"
                name="code"
                maxlength={CODE_MAX * 2}
                autocomplete="off"
                autocapitalize="characters"
                spellcheck="false"
                aria-invalid={add?.errors.code ? 'true' : undefined}
                aria-describedby={add?.errors.code ? 'team-code-message team-code-hint' : 'team-code-hint'}
              />
              <p id="team-code-hint" class="dash-hint">{CODE_HINT}</p>
              {add?.errors.code && <p id="team-code-message" class="dash-message">{add.errors.code}</p>}
            </div>
          </div>
          <div class="actions">
            <Button>Add team</Button>
          </div>
        </form>
      </section>
    </div>
  </Section>
</Base>
````

- [ ] **Step 4: Add the footer link**

`src/components/Footer.astro`, in the list under "Explore", after the `items.map(...)` block and before `</ul>`:

```astro
        <li>
          <a href="/dashboard">Team sign-in</a>
        </li>
```

The link is in the footer and not in the main navigation, because the dashboard is for teams and mentors, not for visitors.

- [ ] **Step 5: Run the tests to see them pass**

Run: `npm run test:all`
Expected: PASS.

Run: `npm run check`
Expected: 0 errors, 0 warnings, and no hint in `tests/site/dashboard.test.ts`.

- [ ] **Step 6: Check the mentor page by hand**

With `npm run dashboard:db` running and `MENTOR_CODE_HASH` in `.env` from Task 8:

```bash
npx astro dev --port 4321 &
sleep 6
B=http://localhost:4321; J=/tmp/jar.m; rm -f $J
curl -s -o /dev/null -D - -c $J -H "Origin: $B" -d "code=test mentor 01" $B/dashboard | grep -i -E "^HTTP|location"
curl -s -b $J -o /tmp/m.html -w "%{http_code}\n" $B/dashboard/mentor
T=$(grep -o 'name="token" value="[^"]*' /tmp/m.html | head -1 | sed 's/.*value="//')
curl -s -b $J -o /tmp/m.html -w "%{http_code}\n" -H "Origin: $B" --data-urlencode "token=$T" -d "action=team-add&name=Test+Second&code=test-second-01" $B/dashboard/mentor
grep -o 'dash-code">[^<]*' /tmp/m.html
curl -s -b $J $B/dashboard/mentor | grep -c 'dash-code"'
curl -s -b $J -o /tmp/m.html -w "%{http_code}\n" -H "Origin: $B" --data-urlencode "token=$T" -d "action=team-add&name=Test+Third&code=TEST+SECOND+01" $B/dashboard/mentor
grep -o 'class="dash-message">[^<]*' /tmp/m.html; grep -c "SECOND" /tmp/m.html
curl -s -b $J -o /dev/null -D - $B/dashboard/team | grep -i -E "^HTTP|location"
curl -s -o /dev/null -c /tmp/jar.t -H "Origin: $B" -d "code=TEST-SECOND-01" $B/dashboard
curl -s -b /tmp/jar.t -o /dev/null -D - $B/dashboard/mentor | grep -i -E "^HTTP|location"
ID=$(curl -s -b $J $B/dashboard/mentor | grep -o 'name="id" value="[0-9]*' | tail -1 | sed 's/.*value="//')
curl -s -b $J -o /dev/null -w "%{http_code}\n" -H "Origin: $B" --data-urlencode "token=$T" -d "action=code-reset&id=$ID&code=" $B/dashboard/mentor
curl -s -b /tmp/jar.t -o /dev/null -D - $B/dashboard/team | grep -i -E "^HTTP|location"
npx astro dev stop
```

Expected, in order:

```
HTTP/1.1 303 See Other
location: /dashboard/mentor
200
200
dash-code">TEST-SECOND-01
0
422
class="dash-message">That code is in use. Choose another.
0
HTTP/1.1 303 See Other
location: /dashboard/mentor
HTTP/1.1 303 See Other
location: /dashboard/team
200
HTTP/1.1 303 See Other
location: /dashboard?again=1
```

The `0` after the refused code shows that a code that was typed and refused is not sent back in the page.

- [ ] **Step 7: Look at it**

Sign in at `http://localhost:4321/dashboard` with `TEST-MENTOR-01` and check at 375 and 1440 wide: no sideways scroll, one `h1`, the team-name field suggests the names in `src/content/teams/` that have no workspace yet, and "Archived. The team cannot sign in." appears in words on an archived team.

- [ ] **Step 8: Commit**

```bash
git add src/pages/dashboard/mentor.astro src/components/Footer.astro tests/site/dashboard.test.ts
git commit -m "feat: add the mentor page and the sign-in link"
```

### Task 13: Documents and the last check

**Files:**
- Modify: `README.md`
- Modify: `docs/HANDOVER.md`
- Modify: `.claude/launch.json`

**Interfaces:**
- Consumes: every command from Task 8.
- Produces: nothing that code relies on.

- [ ] **Step 1: Correct the README where the build changed**

In `README.md`, under "For whoever maintains the code", replace the command block with:

````markdown
```bash
npm install            # once
npm run dev            # local preview at http://localhost:4321
npm run build          # production build. The public pages go into dist/client/
npm run check          # type check
npm test               # unit tests
npm run test:dashboard # dashboard tests. They need no database installed.
npm run test:site      # builds the site, then tests the pages in dist/client/
npm run test:all       # all three
npm run check:publish  # lists sample content
```
````

Add these rows to the table of folders:

```markdown
| `src/lib/dashboard` | The team dashboard's logic. Only `runtime.ts` imports from Astro. |
| `src/pages/dashboard` | The only pages rendered on request. Every other page is built ahead of time. |
| `src/styles/dashboard.css` | Every dashboard style, in one file, because the dashboard's forms share them. |
| `supabase/migrations` | The dashboard's tables, as numbered SQL files. |
| `tests/dashboard` | Dashboard tests that use a database inside the test process. |
```

Replace the "**Deployment**" sentence with:

```markdown
**Deployment**: connect the GitHub repository to Vercel. `vercel.json` sets the framework and the daily job that keeps the database awake. The Vercel adapter decides where the build is written.
```

- [ ] **Step 2: Add a section on the dashboard to the README**

Add this section before "For whoever maintains the code":

````markdown
## The team dashboard

Teams and mentors sign in at `/dashboard` with an access code. The link is in the footer.

| Who | Sees |
|---|---|
| A team | Its own workspace: deliverables, the next deadline, tasks, a status note and links |
| A mentor | Every team, with forms to add a team, reset a code and archive a team |

**Codes.** A mentor chooses a team's code or leaves the field empty to have one made. A code is shown once. Only its hash is stored, so a lost code cannot be looked up: reset it. Resetting a code signs out everyone who used the old one. Never write a code in this repository.

**The next deadline** comes from the season file. See "How to update the season".

**What is stored.** Team names, statuses, tasks, notes and links. No names or email addresses of pupils. A task is owned by a role, not a person.

### Settings

These are set in Vercel, under Settings, Environment Variables. On your own computer they go in `.env`, which git ignores. `.env.example` lists them.

| Name | What it is |
|---|---|
| `DATABASE_URL` | The Supabase pooler address in transaction mode. It ends in `:6543/postgres`. |
| `SESSION_SECRET` | 32 characters or more, made at random. Changing it signs everyone out. |
| `MENTOR_CODE_HASH` | The hash of the mentor code, from `npm run dashboard:hash`. To change the mentor code, make a new hash and deploy again. |
| `CRON_SECRET` | Vercel sets this itself. |

### Working on the dashboard

```bash
npm run dashboard:db      # a database on this computer. Leave it running.
cp .env.example .env      # once. Then fill it in as the file says.
npm run dashboard:hash    # makes MENTOR_CODE_HASH from a code you type
npm run dev
```

The local database is kept in `.dashboard-db/`. Delete that folder to start again.

### Changing the tables

Add a file to `supabase/migrations/` with the next number, for example `0002_mentor_notes.sql`. Switch row level security on for every new table. Then, with `DATABASE_URL` in `.env` naming the database you mean:

```bash
npm run dashboard:migrate
```

It prints the host of the database before it runs anything, and it runs each file once.
````

- [ ] **Step 3: Point the preview entries at what works now**

`astro preview` does not serve pages rendered on request with the Vercel adapter. In `.claude/launch.json`, remove the `astro-preview` and `rebuild-preview` entries and keep `astro-dev`. `rebuild-preview` pointed at a temporary folder that is gone.

- [ ] **Step 4: Note the change in the hand-over**

Add this section to the top of `docs/HANDOVER.md`, under the title:

```markdown
## Team dashboard, stage 1

Added on the branch `team-dashboard`. The spec is `docs/superpowers/specs/2026-09-27-team-dashboard-design.md` and the plan is `docs/superpowers/plans/2026-09-27-team-dashboard-stage-1.md`.

- The site now uses the Vercel adapter. The public pages are still built ahead of time, into `dist/client/`.
- Pages under `/dashboard` are rendered on request and need the four settings in the README.
- Stages 2 and 3 are not built: the mentor overview table, mentor notes, announcements and streaks.
```

- [ ] **Step 5: Run the whole check**

```bash
npm run check
npm run test:all
npm run check:publish
git status --short
git log --oneline main..HEAD
```

Expected: `npm run check` reports 0 errors and 0 warnings. `npm run test:all` passes, with 9 skipped. `git status` lists nothing but `outputs/`, which was there before this work. `.env` and `.dashboard-db/` are not listed.

Then check that no code was committed:

```bash
git grep -n -i -E "MENTOR_CODE_HASH=scrypt|DATABASE_URL=postgres(ql)?://[^p]" -- . ':!docs' ':!.env.example' ; echo "exit $?"
```

Expected: no lines, and `exit 1`.

- [ ] **Step 6: Commit**

```bash
git add README.md docs/HANDOVER.md .claude/launch.json
git commit -m "docs: describe the team dashboard"
```

---

## Going live

These steps change things outside the repository. Each needs the user, and none is done without the user saying so.

| Step | Who | What |
|---|---|---|
| 1 | User | Choose the Supabase project. Two projects in the account have the default name and are paused: one in Tokyo, one in Seoul. A paused project cannot be looked inside, so it must be restored in the Supabase dashboard before anyone can confirm it is empty. A project paused for more than 90 days cannot be restored; then a new project is made. |
| 2 | User | Rename the project to `tbs-stem-racing` in the Supabase dashboard, under Project Settings, General. |
| 3 | Claude, once the user confirms the project | Check that the project's `public` schema holds no tables. If it holds any, stop and ask. |
| 4 | User | Copy the pooler connection string, transaction mode, from the Supabase dashboard into `.env` as `DATABASE_URL`. It holds the database password, so it is not pasted into chat. |
| 5 | Claude | Run `npm run dashboard:migrate` and read out the host it names before it runs. |
| 6 | User | In Vercel, set `DATABASE_URL`, `SESSION_SECRET` and `MENTOR_CODE_HASH`. Make the hash with `npm run dashboard:hash`, typing the mentor code. |
| 7 | User | Say whether to merge `team-dashboard` into `main` and push. Vercel builds from `main`. |
| 8 | User | Sign in at `/dashboard` with the mentor code and add the seven teams, typing each team's code. |
| 9 | User | Ask the school whether a tool that pupils sign in to needs approval, before giving out the codes. |

One thing to weigh before step 6. The codes were pasted into a chat. Anyone who can read that chat can sign in. Choosing new codes costs nothing before the teams have them.

