# TBS STEM Racing Website Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the TBS STEM Racing website from scratch in the official STEM Racing brand, with content that people who do not code can edit.

**Architecture:** A static Astro site. All logic lives in plain TypeScript files in `src/lib` that import nothing from Astro, so the same code runs in the build, in the browser and in unit tests. Astro components own their markup and scoped CSS and read colours from one token file. Content lives in `src/content` behind strict schemas. Brand artwork is copied from the official pack by script and is never redrawn.

**Tech Stack:** Astro 7.3, TypeScript, plain CSS, Zod 4 (through `astro/zod`), sharp, Vitest 5, cheerio. No UI framework, no Tailwind.

**Spec:** `docs/superpowers/specs/2026-09-27-tbs-stem-racing-rebuild-design.md`

## How this plan was checked

Every code block below was built and run in a throwaway sandbox on 2026-09-27, against the versions this project has installed (Astro 7.3.2, Vite 8.3.0, Zod 4.6.4, sharp 0.35.4) with Vitest 5.0.2 and cheerio 1.2.0.

| Check | Result in the sandbox |
|---|---|
| `astro check` | 0 errors, 0 warnings, 0 hints |
| `astro build` | 8 pages, and 9 with the event switched on |
| Unit tests | 160 passed |
| Tests on the built pages | 179 passed, 9 skipped |
| Event page | Checked switched on and switched off |
| Empty states | Checked with no teams, no season and no results |
| Pages viewed | 1440px and 375px wide, and with scripts off |

Copy the code as written. If a step fails, read the error before you change the code: the cause is more likely the environment than the code.

## Conventions

| Name | Meaning |
|---|---|
| `$REPO` | `/Users/rg/Documents/STEM Racing Website` |
| `$PACK` | `/Users/rg/Documents/STEM Racing/STEM RACING BRANDING SHARE` |
| `$SCRATCH` | Your session scratchpad directory. Never a folder inside `$REPO`. |

- Run every command from `$REPO` unless the step says otherwise.
- The shell is zsh. A glob that matches nothing stops the whole command, so the commands here name files in full. Keep it that way.
- Start servers with the harness preview tool: `preview_start` with a name from `.claude/launch.json`. Never with a shell command.
- End every commit message with the attribution trailer from the session's system reminder. On 2026-09-27 that is `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. The commit commands below pass it as a second `-m`.
- Never push. Never commit to `main`. Never merge.

## Global Constraints

Every task's requirements include this section.

**Stack**

- Astro `^7.3.2`, TypeScript, plain CSS. No UI framework. No Tailwind.
- Node `>=22.12.0`.
- All work happens on the branch `rebuild`.

**Colour.** Secondary division theme on a Carbon Shadow core. No blues or greens anywhere.

| Token | Hex |
|---|---|
| Carbon Shadow | `#05000B` |
| Carbon Shadow tints | `#261A3D`, `#2E2347` (the 70% tint), `#5B5376`, `#A39FB8`, `#D7D6E3` |
| Light surface | `#F3F3F7` |
| Ignite Indigo | `#312783` |
| Chicane Violet | `#961B81` |
| Pitlane Pink | `#E6007E` |
| Burnout Orange | `#ED6D05` |
| Podium Gold | `#FCBC00` |

- Components read colours from `src/styles/tokens.css` only. No hex value and no `rgb()` in a component.
- Body text contrast is at least 4.5:1. Pitlane Pink and Chicane Violet are not used for body text on dark surfaces.
- Gradient text is used for headings and numerals of 32px and above only.

**Type**

- H1, H2, text tracks, numerals and buttons: Magistral Italic. Bold for H1 and H2.
- Magistral is never used upright and never for paragraphs.
- H3 to H5: MachoModular Bold. All other text: MachoModular.
- Paragraphs are left aligned. Never justified. Never bold throughout.
- Verdana is never named. The fallback stack is `system-ui, sans-serif`.

**Logo**

- Official supplied files only. No stretch, rotation, shadow, stroke or recolour.
- Full colour white variant on dark backgrounds. Mono white over a mesh gradient or a photo.
- Smallest height 32px. Clear space of half the logo height on every side.
- The "Supported by Formula 1" lockup and wording are not used.

**Graphics**

- Supplied files only: "SR gradient", "Hot" and "Pink Orange" gradients; "Pink", "Yellow" and "Black 1" track shapes; "Jagged" pattern. Nothing is recreated in code.
- A text track takes three words at most.
- "Accelerating Futures" is never reworded.

**Copy and content**

- British English. Sentence case for headings.
- No invented facts. A content entry that is not taken from a TBS document carries `sample: true`.
- No student names and no personal email addresses in seed content.

**Behaviour**

- The site works with JavaScript off. Scripts add motion, the menu toggle and the date refresh, and nothing else.
- All motion is off under `prefers-reduced-motion: reduce`.
- One `h1` on each page, headings in order, a skip link, a visible focus ring in Podium Gold.
- `npm run check` and `npm run build` finish with no errors and no warnings.

## Review Focus

The spec says what the site must do. These are the conditions it implies but does not spell out, most likely first. Each one has a test in the task named.

1. **A visitor opens the site weeks after it was last built.** They expect "Next up" to name something in the future, and past items to be dimmed as of today. Pinned in Task 2 (`seasonView` with a later `today`), Task 11 (the page carries each date) and Task 14 (the home page carries the season).
2. **An editor leaves out or deletes content**: a team with no image or car name, a milestone with no date, a season with no deadline, a contact with no email, or no teams, season or results at all. They expect a sensible page, and they expect deleted content to go. Pinned in Task 2, Task 5 (schemas accept the gaps, and the loader starts from an empty store), Task 10, Task 12 and Task 15 (the empty states).
3. **An editor types unusual text**: a four-word headline, a very long team name, a member with no role, a name with accents or in another script. They expect nothing clipped, and a clear error when a rule is broken. Pinned in Task 3 (`trackLines`, `parseMember`) and Task 6 (`overflow-wrap` on headings).
4. **An editor makes a typo in a content file**: a misspelt field, a date such as "2 Oct 2026", a category such as "Pro", a link with no `https://`. They expect the build to stop and name the file and the field. Pinned in Task 5.
5. **A visitor has JavaScript off, or has asked for less motion.** They expect every section visible and the navigation usable. Pinned in Task 6 (only a class added by script can hide content) and Task 7 (nothing is hidden in the markup).

## File Structure

```
astro.config.mjs                 unchanged
package.json                     scripts, engines, test tools
vitest.config.ts                 test runner settings
.claude/launch.json              dev and preview servers
README.md                        guide for editors and maintainers

scripts/
  prepare-brand-assets.mjs       copies artwork from the brand pack
  convert-fonts.py               MachoModular OTF to WOFF2
  check-publish.mjs              lists sample content before going public

public/
  fonts/                         five WOFF2 files
  favicon-32.png, favicon-192.png, apple-touch-icon.png

src/
  content.config.ts              the ten collections
  content/                       teams, seasons, results, resources, event,
                                 heritage, school, site, programme, support
  assets/brand/                  logo, signifier, gradients, shapes, patterns
  lib/
    season.ts                    dates, next item, registration text
    nav.ts                       navigation items and current page
    logo.ts                      smallest logo size
    results.ts                   results grouped by season
    teams.ts                     "Name (Role)" parsing
    track.ts                     text track lines and the three word rule
    motion.ts                    scroll threshold and drift maths
    schemas.ts                   one strict schema for each collection
    content.ts                   thin wrappers around astro:content
  scripts/
    menu.ts                      mobile menu toggle
    motion.ts                    header state, track drift, section reveal
    dates.ts                     refreshes past and next items in the browser
  styles/
    tokens.css                   colours, fonts, sizes
    fonts.css                    @font-face rules
    global.css                   base rules and shared utilities
  layouts/Base.astro             head, header, main, footer, scripts
  components/
    Logo.astro  Header.astro  Footer.astro  Section.astro  TextTrack.astro
    Button.astro  StepCard.astro  StatBand.astro  RoleList.astro
    Timeline.astro  SeasonStatus.astro  TeamCard.astro
  pages/
    index.astro  school.astro  programme.astro  teams.astro  season.astro
    resources.astro  support.astro  [event].astro  404.astro

tests/
  helpers/contrast.ts            WCAG contrast maths
  helpers/site.ts                reads the built pages and the content
  unit/                          one file for each file in src/lib, plus
                                 assets, content, tokens, check-publish, project
  site/                          structure and brand rules on every page,
                                 plus one file for each page
```

Rules that hold across the structure:

- A file in `src/lib` never imports from Astro, except `content.ts`, and `schemas.ts` which imports `z` from `astro/zod`.
- A component owns its styles in a scoped `<style>` block. Rules that must reach slotted content use `:global()`.
- `src/styles/global.css` holds only base element rules and utilities that more than one component uses.

---

### Task 1: Branch, clean slate and test harness

**Files:**
- Delete: `src/` (all of it), `public/favicon.svg`, and the ignored build folders `dist/` and `.astro/`
- Modify: `package.json`, `package-lock.json`, `.claude/launch.json`
- Create: `vitest.config.ts`
- Test: `tests/unit/project.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: the branch `rebuild`. npm scripts `test` (unit tests), `test:site` (builds, then tests `dist`), `test:all`, `assets:prepare`, `check:publish`. Launch configurations `astro-dev` on port 4321 and `astro-preview` on port 4322.

- [ ] **Step 1: Confirm the starting state**

```bash
git branch --show-current
git status --short
```

Expected: `main`, then one line, `?? docs/`.

If `.claude/launch.json` is also listed as modified, it holds an entry named `rebuild-preview` that this plan did not write. Ask the user whether to keep it before you go on. Step 10 keeps whatever entries are there.

If anything else is listed, stop and ask.

- [ ] **Step 2: Create the branch and commit the spec and this plan**

```bash
git checkout -b rebuild
git add docs
git commit -m "docs: add rebuild spec and plan" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 3: Remove the old site**

```bash
git rm -r -q src public/favicon.svg
rm -rf dist .astro
ls
```

Expected: the list has no `src` and no `dist`. `README.md` stays until Task 15 replaces it.

- [ ] **Step 4: Install the test tools**

```bash
npm install --save-dev vitest@^5.0.2 cheerio@^1.2.0 sharp@^0.35.4 @types/node@^24.19.0
```

Expected: the command ends without `ERR!`. `sharp` is already in `node_modules` because Astro uses it; this makes the project depend on it by name.

- [ ] **Step 5: Add the test runner settings**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 6: Write the failing test**

Create `tests/unit/project.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));

describe('project setup', () => {
  it('asks for a version of Node that Astro 7 supports', () => {
    expect(pkg.engines.node).toBe('>=22.12.0');
  });

  it('has the scripts the README describes', () => {
    expect(Object.keys(pkg.scripts)).toEqual(
      expect.arrayContaining(['dev', 'build', 'preview', 'check', 'test', 'test:site', 'test:all', 'check:publish']),
    );
  });

  it('adds no UI framework and no Tailwind', () => {
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    expect(names.filter((name) => /react|vue|svelte|solid|preact|tailwind/i.test(name))).toEqual([]);
  });
});
```

- [ ] **Step 7: Run the test to verify it fails**

Run: `npx vitest run tests/unit`
Expected: FAIL. The first test reports `Cannot read properties of undefined (reading 'node')` and the second lists the missing scripts.

- [ ] **Step 8: Add the scripts and the Node version**

```bash
npm pkg set version=2.0.0 engines.node=">=22.12.0" scripts.test="vitest run tests/unit" scripts.test:site="astro build && vitest run tests/site" scripts.test:all="npm run test && npm run test:site" scripts.assets:prepare="node scripts/prepare-brand-assets.mjs" scripts.check:publish="node scripts/check-publish.mjs"
```

- [ ] **Step 9: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, 3 tests.

- [ ] **Step 10: Add a server for the production build**

This adds one entry to `.claude/launch.json` and keeps the entries that are already there:

```bash
node -e "
const fs = require('node:fs');
const file = '.claude/launch.json';
const config = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!config.configurations.some((entry) => entry.name === 'astro-preview')) {
  config.configurations.push({
    name: 'astro-preview',
    runtimeExecutable: 'npm',
    runtimeArgs: ['run', 'preview', '--', '--port', '4322'],
    port: 4322,
  });
}
fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\\n');
console.log(config.configurations.map((entry) => entry.name + ' ' + entry.port).join('\\n'));
"
```

Expected: the list includes `astro-dev 4321` and `astro-preview 4322`.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: clear the old site and add the test harness" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Season logic

**Files:**
- Create: `src/lib/season.ts`
- Test: `tests/unit/season.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces, all exported from `src/lib/season.ts`:
  - `interface TimelineItem { date?: string | undefined; title: string; description: string }`
  - `interface SeasonData { year: string; name?: string | undefined; registrationOpen: boolean; registrationDeadline?: string | undefined; registrationUrl?: string | undefined; timeline: TimelineItem[] }`
  - `type SeasonState`, a union on `kind`: `'none' | 'upcoming' | 'unscheduled' | 'complete'`
  - `interface SeasonView { heading: string; nextLabel: string; nextTitle: string; nextDate: string; registration: string; canRegister: boolean }`
  - `todayIso(now?: Date, timeZone?: string): string` returns `YYYY-MM-DD` in `Asia/Kolkata`
  - `formatDate(iso: string): string` returns `16 September 2026`
  - `isPast(date: string | undefined, today: string): boolean`
  - `sortTimeline(items: readonly TimelineItem[]): TimelineItem[]`
  - `pickCurrentSeason<T extends { year: string }>(seasons: readonly T[]): T | undefined`
  - `seasonState(season: SeasonData | undefined, today: string): SeasonState`
  - `seasonHeading(season: SeasonData): string`
  - `registrationText(season: SeasonData, today: string): string`
  - `seasonView(season: SeasonData | undefined, today: string): SeasonView`

This task pins Review Focus 1 and 2. The test named "shows a future item as next, even when the site was built weeks earlier" is the one that matters most.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/season.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  formatDate,
  isPast,
  pickCurrentSeason,
  registrationText,
  seasonHeading,
  seasonState,
  seasonView,
  sortTimeline,
  todayIso,
  type SeasonData,
} from '../../src/lib/season';

const season: SeasonData = {
  year: '2026-27',
  name: 'Season 9',
  registrationOpen: false,
  timeline: [
    { title: 'Regional Finals', description: '' },
    { date: '2026-09-16', title: "Parents' briefing", description: '' },
    { date: '2026-09-03', title: 'Interview invitations', description: '' },
    { title: 'National Finals', description: '' },
  ],
};

describe('todayIso', () => {
  it('uses the school time zone, not the time zone of the build server', () => {
    // 20:00 UTC on 27 September is 01:30 on 28 September in New Delhi.
    expect(todayIso(new Date('2026-09-27T20:00:00Z'))).toBe('2026-09-28');
  });

  it('pads months and days', () => {
    expect(todayIso(new Date('2027-01-05T06:00:00Z'))).toBe('2027-01-05');
  });
});

describe('formatDate', () => {
  it('writes dates the British way', () => {
    expect(formatDate('2026-09-16')).toBe('16 September 2026');
  });
});

describe('isPast', () => {
  it('is true for a date before today', () => {
    expect(isPast('2026-09-16', '2026-09-27')).toBe(true);
  });

  it('is false for today and for later dates', () => {
    expect(isPast('2026-09-27', '2026-09-27')).toBe(false);
    expect(isPast('2027-01-23', '2026-09-27')).toBe(false);
  });

  it('is false when there is no date', () => {
    expect(isPast(undefined, '2026-09-27')).toBe(false);
    expect(isPast('', '2026-09-27')).toBe(false);
  });
});

describe('sortTimeline', () => {
  it('puts dated items first in date order, then undated items in written order', () => {
    expect(sortTimeline(season.timeline).map((item) => item.title)).toEqual([
      'Interview invitations',
      "Parents' briefing",
      'Regional Finals',
      'National Finals',
    ]);
  });

  it('does not change the list it is given', () => {
    const before = season.timeline.map((item) => item.title);
    sortTimeline(season.timeline);
    expect(season.timeline.map((item) => item.title)).toEqual(before);
  });
});

describe('pickCurrentSeason', () => {
  it('picks the latest year label', () => {
    expect(pickCurrentSeason([{ year: '2025-26' }, { year: '2026-27' }, { year: '2024-25' }])).toEqual({
      year: '2026-27',
    });
  });

  it('returns undefined when there are no seasons', () => {
    expect(pickCurrentSeason([])).toBeUndefined();
  });
});

describe('seasonState', () => {
  it('reports the next dated item', () => {
    expect(seasonState(season, '2026-09-10')).toEqual({
      kind: 'upcoming',
      item: { date: '2026-09-16', title: "Parents' briefing", description: '' },
    });
  });

  it('counts an item dated today as upcoming', () => {
    expect(seasonState(season, '2026-09-16').kind).toBe('upcoming');
  });

  it('falls back to the first undated item once every dated item has passed', () => {
    expect(seasonState(season, '2026-09-27')).toEqual({
      kind: 'unscheduled',
      item: { title: 'Regional Finals', description: '' },
    });
  });

  it('reports the most recent item when the season is over', () => {
    const finished: SeasonData = { ...season, timeline: season.timeline.filter((item) => item.date) };
    expect(seasonState(finished, '2027-06-01')).toEqual({
      kind: 'complete',
      item: { date: '2026-09-16', title: "Parents' briefing", description: '' },
    });
  });

  it('reports none for a missing season and for an empty timeline', () => {
    expect(seasonState(undefined, '2026-09-27')).toEqual({ kind: 'none' });
    expect(seasonState({ ...season, timeline: [] }, '2026-09-27')).toEqual({ kind: 'none' });
  });
});

describe('seasonHeading', () => {
  it('leads with the season name when there is one', () => {
    expect(seasonHeading(season)).toBe('Season 9 · 2026-27');
  });

  it('uses the year alone when there is no name', () => {
    expect(seasonHeading({ ...season, name: undefined })).toBe('Season 2026-27');
  });
});

describe('registrationText', () => {
  const open: SeasonData = { ...season, registrationOpen: true, registrationDeadline: '2026-10-02' };

  it('says closed', () => {
    expect(registrationText(season, '2026-09-27')).toBe('Registration closed');
  });

  it('gives the deadline while it is ahead', () => {
    expect(registrationText(open, '2026-09-27')).toBe('Registration open until 2 October 2026');
    expect(registrationText(open, '2026-10-02')).toBe('Registration open until 2 October 2026');
  });

  it('never shows a deadline that has passed', () => {
    expect(registrationText(open, '2026-10-03')).toBe('Registration open, late entries accepted');
  });

  it('works without a deadline', () => {
    expect(registrationText({ ...open, registrationDeadline: undefined }, '2026-09-27')).toBe('Registration open');
  });
});

describe('seasonView', () => {
  it('shows a future item as next, even when the site was built weeks earlier', () => {
    // Built on 10 September, opened on 27 September: the briefing has passed by then.
    expect(seasonView(season, '2026-09-10').nextTitle).toBe("Parents' briefing");
    expect(seasonView(season, '2026-09-27')).toEqual({
      heading: 'Season 9 · 2026-27',
      nextLabel: 'Next up',
      nextTitle: 'Regional Finals',
      nextDate: 'Date to be confirmed',
      registration: 'Registration closed',
      canRegister: false,
    });
  });

  it('formats the date of a dated item', () => {
    expect(seasonView(season, '2026-09-10').nextDate).toBe('16 September 2026');
  });

  it('shows Season complete with the most recent item', () => {
    const finished: SeasonData = { ...season, timeline: season.timeline.filter((item) => item.date) };
    const view = seasonView(finished, '2027-06-01');
    expect(view.nextLabel).toBe('Season complete');
    expect(view.nextTitle).toBe("Parents' briefing");
    expect(view.nextDate).toBe('16 September 2026');
  });

  it('shows Dates to be announced when there is no season', () => {
    const view = seasonView(undefined, '2026-09-27');
    expect(view.nextLabel).toBe('Dates to be announced');
    expect(view.canRegister).toBe(false);
  });

  it('only offers the Register button when registration is open and a link exists', () => {
    expect(seasonView({ ...season, registrationOpen: true }, '2026-09-27').canRegister).toBe(false);
    expect(
      seasonView({ ...season, registrationOpen: true, registrationUrl: 'https://example.org/form' }, '2026-09-27')
        .canRegister,
    ).toBe(true);
    expect(
      seasonView({ ...season, registrationUrl: 'https://example.org/form' }, '2026-09-27').canRegister,
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/season.test.ts`
Expected: FAIL. The file cannot be loaded: the error names `../../src/lib/season`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/season.ts`:

```ts
// Season logic. No Astro imports, so the same code runs in the build, in the browser and in tests.

export interface TimelineItem {
  /** YYYY-MM-DD. Left out when the date is not confirmed yet. */
  date?: string | undefined;
  title: string;
  description: string;
}

export interface SeasonData {
  year: string;
  name?: string | undefined;
  registrationOpen: boolean;
  registrationDeadline?: string | undefined;
  registrationUrl?: string | undefined;
  timeline: TimelineItem[];
}

export type SeasonState =
  | { kind: 'none' }
  | { kind: 'upcoming'; item: TimelineItem }
  | { kind: 'unscheduled'; item: TimelineItem }
  | { kind: 'complete'; item: TimelineItem | undefined };

export interface SeasonView {
  heading: string;
  nextLabel: string;
  nextTitle: string;
  nextDate: string;
  registration: string;
  canRegister: boolean;
}

const SCHOOL_TIME_ZONE = 'Asia/Kolkata';

/** Today's date as YYYY-MM-DD in the school's time zone. */
export function todayIso(now: Date = new Date(), timeZone: string = SCHOOL_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/** "2026-09-16" becomes "16 September 2026". */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

/** An item with no date is never in the past. */
export function isPast(date: string | undefined, today: string): boolean {
  return date !== undefined && date !== '' && date < today;
}

/** Dated items first, oldest first. Undated items follow in the order they were written. */
export function sortTimeline(items: readonly TimelineItem[]): TimelineItem[] {
  const dated = items.filter((item) => item.date !== undefined);
  const undated = items.filter((item) => item.date === undefined);
  dated.sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
  return [...dated, ...undated];
}

/** The current season is the one with the latest year label: "2026-27" beats "2025-26". */
export function pickCurrentSeason<T extends { year: string }>(seasons: readonly T[]): T | undefined {
  return [...seasons].sort((a, b) => b.year.localeCompare(a.year))[0];
}

export function seasonState(season: SeasonData | undefined, today: string): SeasonState {
  if (!season || season.timeline.length === 0) return { kind: 'none' };
  const sorted = sortTimeline(season.timeline);
  const upcoming = sorted.find((item) => item.date !== undefined && item.date >= today);
  if (upcoming) return { kind: 'upcoming', item: upcoming };
  const unscheduled = sorted.find((item) => item.date === undefined);
  if (unscheduled) return { kind: 'unscheduled', item: unscheduled };
  const dated = sorted.filter((item) => item.date !== undefined);
  return { kind: 'complete', item: dated[dated.length - 1] };
}

export function seasonHeading(season: SeasonData): string {
  return season.name ? `${season.name} · ${season.year}` : `Season ${season.year}`;
}

export function registrationText(season: SeasonData, today: string): string {
  if (!season.registrationOpen) return 'Registration closed';
  if (season.registrationDeadline === undefined) return 'Registration open';
  if (isPast(season.registrationDeadline, today)) return 'Registration open, late entries accepted';
  return `Registration open until ${formatDate(season.registrationDeadline)}`;
}

/** Everything the status panel shows, as plain text. */
export function seasonView(season: SeasonData | undefined, today: string): SeasonView {
  if (!season) {
    return {
      heading: 'Next season',
      nextLabel: 'Dates to be announced',
      nextTitle: 'The timeline appears here when the season is confirmed.',
      nextDate: '',
      registration: 'Registration closed',
      canRegister: false,
    };
  }
  const shared = {
    heading: seasonHeading(season),
    registration: registrationText(season, today),
    canRegister: season.registrationOpen && season.registrationUrl !== undefined,
  };
  const state = seasonState(season, today);
  switch (state.kind) {
    case 'none':
      return {
        ...shared,
        nextLabel: 'Dates to be announced',
        nextTitle: 'The timeline appears here when dates are confirmed.',
        nextDate: '',
      };
    case 'upcoming':
      return {
        ...shared,
        nextLabel: 'Next up',
        nextTitle: state.item.title,
        nextDate: state.item.date ? formatDate(state.item.date) : '',
      };
    case 'unscheduled':
      return { ...shared, nextLabel: 'Next up', nextTitle: state.item.title, nextDate: 'Date to be confirmed' };
    case 'complete':
      return {
        ...shared,
        nextLabel: 'Season complete',
        nextTitle: state.item?.title ?? '',
        nextDate: state.item?.date ? formatDate(state.item.date) : '',
      };
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/season.test.ts`
Expected: PASS, 26 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/season.ts tests/unit/season.test.ts
git commit -m "feat: add season logic" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Small helpers

**Files:**
- Create: `src/lib/nav.ts`, `src/lib/logo.ts`, `src/lib/results.ts`, `src/lib/teams.ts`, `src/lib/track.ts`, `src/lib/motion.ts`
- Test: `tests/unit/nav.test.ts`, `tests/unit/logo.test.ts`, `tests/unit/results.test.ts`, `tests/unit/teams.test.ts`, `tests/unit/track.test.ts`, `tests/unit/motion.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `src/lib/nav.ts`: `interface NavItem { href: string; label: string }`, `NAV_ITEMS`, `navItems(eventEnabled: boolean): NavItem[]`, `isCurrent(pathname: string, href: string): boolean`
  - `src/lib/logo.ts`: `type LogoVariant = 'colour-white' | 'colour-black' | 'mono-white' | 'mono-black'`, `LOGO_MIN_HEIGHT = 32`, `logoHeight(requested: number): number`
  - `src/lib/results.ts`: `type ResultEvent = 'Regionals' | 'Nationals' | 'World Finals'`, `interface ResultData { season: string; team: string; event: ResultEvent; placing: string; awards: string[] }`, `interface SeasonResults { season: string; rows: ResultData[] }`, `groupResultsBySeason(results: readonly ResultData[]): SeasonResults[]`
  - `src/lib/teams.ts`: `interface Member { name: string; role: string | undefined }`, `parseMember(text: string): Member`
  - `src/lib/track.ts`: `type TrackLayout = 'banner' | 'stacked'`, `TRACK_MAX_WORDS = 3`, `interface TrackLines { lines: string[]; chars: number }`, `trackLines(text: string, layout: TrackLayout): TrackLines`. It throws when the text is empty or has more than three words.
  - `src/lib/motion.ts`: `HEADER_SCROLL_THRESHOLD = 80`, `TRACK_MAX_SHIFT = 40`, `headerScrolled(scrollY: number): boolean`, `trackShift(top: number, height: number, viewportHeight: number, max?: number): number`, `relativeShift(raw: number, base: number, max?: number): number`

This task pins Review Focus 3.

- [ ] **Step 1: Write the six failing tests**

Create `tests/unit/nav.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { isCurrent, navItems } from '../../src/lib/nav';

describe('navItems', () => {
  it('lists the pages in the agreed order', () => {
    expect(navItems(false)).toEqual([
      { href: '/school', label: 'Our School' },
      { href: '/programme', label: 'Programme' },
      { href: '/teams', label: 'Teams' },
      { href: '/season', label: 'Season' },
      { href: '/resources', label: 'Resources' },
      { href: '/support', label: 'Support' },
    ]);
  });

  it('adds Event at the end only when the event is enabled', () => {
    expect(navItems(true).at(-1)).toEqual({ href: '/event', label: 'Event' });
    expect(navItems(true)).toHaveLength(7);
    expect(navItems(false).some((item) => item.href === '/event')).toBe(false);
  });

  it('returns a fresh list each time', () => {
    navItems(false).push({ href: '/x', label: 'X' });
    expect(navItems(false)).toHaveLength(6);
  });
});

describe('isCurrent', () => {
  it('matches with or without a trailing slash', () => {
    expect(isCurrent('/school', '/school')).toBe(true);
    expect(isCurrent('/school/', '/school')).toBe(true);
  });

  it('does not match other pages or the home page', () => {
    expect(isCurrent('/schools', '/school')).toBe(false);
    expect(isCurrent('/', '/school')).toBe(false);
  });
});
```

Create `tests/unit/logo.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { LOGO_MIN_HEIGHT, logoHeight } from '../../src/lib/logo';

describe('logoHeight', () => {
  it('keeps a height that is large enough', () => {
    expect(logoHeight(56)).toBe(56);
  });

  it('never goes below the minimum', () => {
    expect(LOGO_MIN_HEIGHT).toBe(32);
    expect(logoHeight(24)).toBe(32);
    expect(logoHeight(0)).toBe(32);
    expect(logoHeight(-10)).toBe(32);
  });

  it('rounds to whole pixels and survives bad input', () => {
    expect(logoHeight(47.6)).toBe(48);
    expect(logoHeight(Number.NaN)).toBe(32);
  });
});
```

Create `tests/unit/results.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { groupResultsBySeason, type ResultData } from '../../src/lib/results';

const result = (season: string, team: string, event: ResultData['event']): ResultData => ({
  season,
  team,
  event,
  placing: 'Represented India',
  awards: [],
});

describe('groupResultsBySeason', () => {
  it('puts the newest season first, whatever form the label takes', () => {
    const groups = groupResultsBySeason([
      result('2014', 'Team Ignite', 'World Finals'),
      result('2025', 'SuperCharged', 'World Finals'),
      result('2020-21', 'GDR', 'World Finals'),
      result('2026-27', 'Sample Team A', 'Regionals'),
    ]);
    expect(groups.map((group) => group.season)).toEqual(['2026-27', '2025', '2020-21', '2014']);
  });

  it('orders a season by event, then by team name', () => {
    const [group] = groupResultsBySeason([
      result('2020-21', 'GDR', 'Regionals'),
      result('2020-21', 'GDR', 'World Finals'),
      result('2020-21', 'Blaze', 'World Finals'),
      result('2020-21', 'GDR', 'Nationals'),
    ]);
    expect(group?.rows.map((row) => `${row.event} ${row.team}`)).toEqual([
      'World Finals Blaze',
      'World Finals GDR',
      'Nationals GDR',
      'Regionals GDR',
    ]);
  });

  it('returns an empty list when there are no results', () => {
    expect(groupResultsBySeason([])).toEqual([]);
  });
});
```

Create `tests/unit/teams.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseMember } from '../../src/lib/teams';

describe('parseMember', () => {
  it('splits the name from the role in brackets', () => {
    expect(parseMember('Priya Sharma (Team Principal)')).toEqual({ name: 'Priya Sharma', role: 'Team Principal' });
  });

  it('accepts a member with no role', () => {
    expect(parseMember('Priya Sharma')).toEqual({ name: 'Priya Sharma', role: undefined });
  });

  it('keeps accents and other scripts', () => {
    expect(parseMember('Zoë Müller (Design Engineer)')).toEqual({ name: 'Zoë Müller', role: 'Design Engineer' });
    expect(parseMember('प्रिया शर्मा (Enterprise Manager)')).toEqual({ name: 'प्रिया शर्मा', role: 'Enterprise Manager' });
  });

  it('tidies stray spaces', () => {
    expect(parseMember('  Priya Sharma   ( Team Principal )  ')).toEqual({
      name: 'Priya Sharma',
      role: 'Team Principal',
    });
  });

  it('treats brackets that are not at the end as part of the name', () => {
    expect(parseMember('Sam (Sammy) Lee')).toEqual({ name: 'Sam (Sammy) Lee', role: undefined });
  });

  it('does not lose text when the brackets are empty', () => {
    expect(parseMember('Priya Sharma ()')).toEqual({ name: 'Priya Sharma ()', role: undefined });
  });
});
```

Create `tests/unit/track.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { trackLines } from '../../src/lib/track';

describe('trackLines', () => {
  it('keeps a banner on one line', () => {
    expect(trackLines('Our Strategy', 'banner')).toEqual({ lines: ['Our Strategy'], chars: 12 });
  });

  it('puts each word of a stacked track on its own line', () => {
    expect(trackLines('Accelerating Futures', 'stacked')).toEqual({
      lines: ['Accelerating', 'Futures'],
      chars: 12,
    });
  });

  it('ignores extra spaces', () => {
    expect(trackLines('  Our   School ', 'banner')).toEqual({ lines: ['Our School'], chars: 10 });
  });

  it('counts accented letters as one character each', () => {
    expect(trackLines('Café', 'banner').chars).toBe(4);
  });

  it('refuses more than three words and says why', () => {
    expect(() => trackLines('Four words are many', 'banner')).toThrow(
      'TextTrack: "Four words are many" has 4 words. A text track takes 3 words at most.',
    );
  });

  it('refuses empty text', () => {
    expect(() => trackLines('   ', 'banner')).toThrow('TextTrack: the text is empty.');
  });
});
```

Create `tests/unit/motion.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { headerScrolled, relativeShift, trackShift } from '../../src/lib/motion';

describe('headerScrolled', () => {
  it('turns solid after 80 pixels of scroll', () => {
    expect(headerScrolled(0)).toBe(false);
    expect(headerScrolled(80)).toBe(false);
    expect(headerScrolled(81)).toBe(true);
  });
});

describe('trackShift', () => {
  it('runs from -40 as the track enters to +40 as it leaves', () => {
    expect(trackShift(900, 100, 900)).toBe(-40);
    expect(trackShift(400, 100, 900)).toBe(0);
    expect(trackShift(-100, 100, 900)).toBe(40);
  });

  it('stays inside the limits when the track is far off screen', () => {
    expect(trackShift(5000, 100, 900)).toBe(-40);
    expect(trackShift(-5000, 100, 900)).toBe(40);
  });

  it('returns 0 when there is nothing to measure', () => {
    expect(trackShift(0, 0, 0)).toBe(0);
  });
});

describe('relativeShift', () => {
  it('is 0 where the track started, so a headline loads aligned with the text below it', () => {
    expect(relativeShift(12, 12)).toBe(0);
  });

  it('moves with the scroll and stays inside the limits', () => {
    expect(relativeShift(30, 12)).toBe(18);
    expect(relativeShift(40, -40)).toBe(40);
    expect(relativeShift(-40, 40)).toBe(-40);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL. Six files cannot be loaded, each naming a missing file in `src/lib`. The project and season files still pass.

- [ ] **Step 3: Write the six implementations**

Create `src/lib/nav.ts`:

```ts
// The main navigation. The order is fixed by the design.

export interface NavItem {
  href: string;
  label: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/school', label: 'Our School' },
  { href: '/programme', label: 'Programme' },
  { href: '/teams', label: 'Teams' },
  { href: '/season', label: 'Season' },
  { href: '/resources', label: 'Resources' },
  { href: '/support', label: 'Support' },
];

export function navItems(eventEnabled: boolean): NavItem[] {
  return eventEnabled ? [...NAV_ITEMS, { href: '/event', label: 'Event' }] : [...NAV_ITEMS];
}

export function isCurrent(pathname: string, href: string): boolean {
  const clean = (value: string) => (value.length > 1 ? value.replace(/\/+$/, '') : value);
  return clean(pathname) === clean(href);
}
```

Create `src/lib/logo.ts`:

```ts
// Logo rules from the brand guide, as code.

export type LogoVariant = 'colour-white' | 'colour-black' | 'mono-white' | 'mono-black';
/** The brand minimum is 24px high and 70px wide. This lockup is 2.44 times as wide as it is
 *  high, so 32px is the smallest height that keeps the width above 70px. */
export const LOGO_MIN_HEIGHT = 32;

export function logoHeight(requested: number): number {
  if (!Number.isFinite(requested)) return LOGO_MIN_HEIGHT;
  return Math.max(LOGO_MIN_HEIGHT, Math.round(requested));
}
```

Create `src/lib/results.ts`:

```ts
// Groups competition results for the table on the Teams page.

export type ResultEvent = 'Regionals' | 'Nationals' | 'World Finals';

export interface ResultData {
  season: string;
  team: string;
  event: ResultEvent;
  placing: string;
  awards: string[];
}

export interface SeasonResults {
  season: string;
  rows: ResultData[];
}

const EVENT_ORDER: Record<ResultEvent, number> = { 'World Finals': 0, Nationals: 1, Regionals: 2 };

export function groupResultsBySeason(results: readonly ResultData[]): SeasonResults[] {
  const seasons = [...new Set(results.map((result) => result.season))].sort((a, b) => b.localeCompare(a));
  return seasons.map((season) => ({
    season,
    rows: results
      .filter((result) => result.season === season)
      .sort((a, b) => EVENT_ORDER[a.event] - EVENT_ORDER[b.event] || a.team.localeCompare(b.team)),
  }));
}
```

Create `src/lib/teams.ts`:

```ts
// Team members are written as "Name (Role)" in the content files.

export interface Member {
  name: string;
  role: string | undefined;
}

export function parseMember(text: string): Member {
  const trimmed = text.trim();
  const match = /^(.+?)\s*\(([^()]+)\)$/.exec(trimmed);
  if (!match || match[1] === undefined || match[2] === undefined) return { name: trimmed, role: undefined };
  return { name: match[1].trim(), role: match[2].trim() };
}
```

Create `src/lib/track.ts`:

```ts
// Text tracks: the headline once in solid type, repeated in outline.

export type TrackLayout = 'banner' | 'stacked';
export const TRACK_MAX_WORDS = 3;

export interface TrackLines {
  lines: string[];
  chars: number;
}

export function trackLines(text: string, layout: TrackLayout): TrackLines {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) throw new Error('TextTrack: the text is empty.');
  if (words.length > TRACK_MAX_WORDS) {
    throw new Error(
      `TextTrack: "${text}" has ${words.length} words. A text track takes ${TRACK_MAX_WORDS} words at most.`,
    );
  }
  const lines = layout === 'stacked' ? words : [words.join(' ')];
  return { lines, chars: Math.max(...lines.map((line) => [...line].length)) };
}
```

Create `src/lib/motion.ts`:

```ts
// The numbers behind the scroll effects. The DOM work is in src/scripts/motion.ts.

export const HEADER_SCROLL_THRESHOLD = 80;
export const TRACK_MAX_SHIFT = 40;

export function headerScrolled(scrollY: number): boolean {
  return scrollY > HEADER_SCROLL_THRESHOLD;
}

/** Drift measured from where the track sat when the page loaded, so a headline starts aligned. */
export function relativeShift(raw: number, base: number, max: number = TRACK_MAX_SHIFT): number {
  return Math.min(max, Math.max(-max, raw - base));
}

export function trackShift(top: number, height: number, viewportHeight: number, max: number = TRACK_MAX_SHIFT): number {
  const span = viewportHeight + height;
  if (span <= 0) return 0;
  const progress = Math.min(1, Math.max(0, (viewportHeight - top) / span));
  return (progress - 0.5) * 2 * max;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, 58 tests in 8 files.

- [ ] **Step 5: Commit**

```bash
git add src/lib tests/unit
git commit -m "feat: add navigation, logo, results, team, track and motion helpers" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Brand artwork and fonts

**Files:**
- Create: `scripts/prepare-brand-assets.mjs`, `scripts/convert-fonts.py`
- Create, by running the scripts: 12 files under `src/assets/brand/`, 5 files under `public/fonts/`, and `public/favicon-32.png`, `public/favicon-192.png`, `public/apple-touch-icon.png`
- Test: `tests/unit/assets.test.ts`

**Interfaces:**
- Consumes: the brand pack at `$PACK`.
- Produces these files, which later tasks import by these exact paths:
  - `src/assets/brand/logo/tbs-colour-white.png`, `tbs-colour-black.png`, `tbs-mono-white.png`, `tbs-mono-black.png`. Each is 1200 by 492 pixels.
  - `src/assets/brand/signifier/signifier-colour.png`
  - `src/assets/brand/gradients/sr-gradient.png` (3200 by 2000), `mesh-hot.png` and `mesh-pink-orange.png` (1237 by 1751)
  - `src/assets/brand/shapes/shape-pink.svg`, `shape-yellow.svg`, `shape-black-1.svg`
  - `src/assets/brand/patterns/pattern-jagged.png`
  - `public/fonts/Magistral-BoldItalic.woff2`, `Magistral-MediumItalic.woff2`, `MachoModular-Light.woff2`, `MachoModular-Medium.woff2`, `MachoModular-Bold.woff2`

Why the logos come from the PNG files and not the SVG files: the mono SVGs hold live text that only renders with Magistral installed, and the full colour SVGs hold embedded pictures.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/assets.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const brand = join(root, 'src/assets/brand');
const fonts = join(root, 'public/fonts');

function walk(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => !name.startsWith('.'))
    .flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [relative(brand, path)];
    });
}

const logos = ['tbs-colour-white.png', 'tbs-colour-black.png', 'tbs-mono-white.png', 'tbs-mono-black.png'];

describe('brand artwork', () => {
  it('holds the approved files and nothing else', () => {
    expect(walk(brand).sort()).toEqual([
      'gradients/mesh-hot.png',
      'gradients/mesh-pink-orange.png',
      'gradients/sr-gradient.png',
      'logo/tbs-colour-black.png',
      'logo/tbs-colour-white.png',
      'logo/tbs-mono-black.png',
      'logo/tbs-mono-white.png',
      'patterns/pattern-jagged.png',
      'shapes/shape-black-1.svg',
      'shapes/shape-pink.svg',
      'shapes/shape-yellow.svg',
      'signifier/signifier-colour.png',
    ]);
  });

  it.each(logos)('%s is cropped to the artwork, 1200 wide, with a clear background', async (name) => {
    const image = sharp(join(brand, 'logo', name));
    const meta = await image.metadata();
    expect([meta.width, meta.height]).toEqual([1200, 492]);
    expect(meta.hasAlpha).toBe(true);

    // Cropped tight: trimming again removes almost nothing.
    const { info } = await image.trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
    expect(info.width).toBeGreaterThanOrEqual(1196);
    expect(info.height).toBeGreaterThanOrEqual(488);
  });

  it.each(['mesh-hot.png', 'mesh-pink-orange.png'])('%s has no see-through edge', async (name) => {
    const image = sharp(join(brand, 'gradients', name));
    const meta = await image.metadata();
    expect([meta.width, meta.height]).toEqual([1237, 1751]);
    expect((await image.stats()).isOpaque).toBe(true);
  });

  it('keeps the hero gradient at its supplied size', async () => {
    const meta = await sharp(join(brand, 'gradients/sr-gradient.png')).metadata();
    expect([meta.width, meta.height]).toEqual([3200, 2000]);
  });

  it('keeps the pattern see-through, so it can sit on a gradient', async () => {
    expect((await sharp(join(brand, 'patterns/pattern-jagged.png')).stats()).isOpaque).toBe(false);
  });

  it.each([
    ['shape-pink.svg', ['#961b81', '#e6007e', '#ed6d05']],
    ['shape-yellow.svg', ['#e84610', '#ed630c', '#f9ad03']],
    ['shape-black-1.svg', ['#05000b']],
  ])('%s is the supplied file, unchanged', (name, colours) => {
    const svg = readFileSync(join(brand, 'shapes', name), 'utf8');
    expect(svg).toContain('viewBox="0 0 801.43 878.01"');
    expect(svg.match(/<path /g)).toHaveLength(1);
    for (const hex of colours) expect(svg).toContain(hex);
  });
});

describe('fonts', () => {
  const files = [
    'MachoModular-Bold.woff2',
    'MachoModular-Light.woff2',
    'MachoModular-Medium.woff2',
    'Magistral-BoldItalic.woff2',
    'Magistral-MediumItalic.woff2',
  ];

  it('holds the five brand font files and nothing else', () => {
    expect(
      readdirSync(fonts)
        .filter((name) => !name.startsWith('.'))
        .sort(),
    ).toEqual(files);
  });

  it.each(files)('%s is a WOFF2 file of a sensible size', (name) => {
    const bytes = readFileSync(join(fonts, name));
    expect(bytes.subarray(0, 4).toString('latin1')).toBe('wOF2');
    expect(bytes.length).toBeGreaterThan(20_000);
    expect(bytes.length).toBeLessThan(60_000);
  });
});

describe('favicons', () => {
  it.each([
    ['favicon-32.png', 32],
    ['favicon-192.png', 192],
    ['apple-touch-icon.png', 180],
  ])('%s is a %i pixel square', async (name, size) => {
    const meta = await sharp(join(root, 'public', name)).metadata();
    expect([meta.width, meta.height]).toEqual([size, size]);
  });

  it('gives the touch icon a solid Carbon Shadow background', async () => {
    const image = sharp(join(root, 'public/apple-touch-icon.png'));
    expect((await image.stats()).isOpaque).toBe(true);
    const { data } = await sharp(join(root, 'public/apple-touch-icon.png'))
      .extract({ left: 2, top: 2, width: 1, height: 1 })
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect([data[0], data[1], data[2]]).toEqual([5, 0, 11]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/assets.test.ts`
Expected: FAIL with `ENOENT: no such file or directory`, naming `src/assets/brand`.

- [ ] **Step 3: Write the artwork script**

Create `scripts/prepare-brand-assets.mjs`:

```js
// Copies the official STEM Racing files from the brand pack into the project.
// Nothing is redrawn. Logos are cropped to their artwork and resized, mesh gradients lose
// the 2 pixel soft edge from their export, and every other file is copied byte for byte.
//
// Usage: node scripts/prepare-brand-assets.mjs "/path/to/STEM RACING BRANDING SHARE"
import { existsSync } from 'node:fs';
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pack = resolve(process.argv[2] ?? join(root, '..', 'STEM Racing', 'STEM RACING BRANDING SHARE'));
const graphics = join(pack, 'Graphic Assets');
const brand = join(root, 'src', 'assets', 'brand');
const pub = join(root, 'public');

if (!existsSync(graphics)) {
  console.error(`Brand pack not found at ${pack}`);
  console.error('Pass its path: node scripts/prepare-brand-assets.mjs "/path/to/STEM RACING BRANDING SHARE"');
  process.exit(1);
}

async function target(path) {
  await mkdir(dirname(path), { recursive: true });
  return path;
}

function done(path) {
  console.log(`wrote ${relative(root, path)}`);
}

async function copy(from, to) {
  await copyFile(from, await target(to));
  done(to);
}

// 1. Logos. All four variants are cropped to one shared box, so they are the same size
//    and swapping one for another never stretches or shifts the artwork.
const LOGO_WIDTH = 1200;
const logos = {
  'tbs-colour-white.png': 'TBS_Full Colour White.png',
  'tbs-colour-black.png': 'TBS_Full Colour Black.png',
  'tbs-mono-white.png': 'TBS_White_White.png',
  'tbs-mono-black.png': 'TBS_Black.png',
};
const logoSource = (name) => join(graphics, 'Logos', 'TBS', name);

const boxes = [];
for (const name of Object.values(logos)) {
  const { info } = await sharp(logoSource(name)).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  const left = Math.abs(info.trimOffsetLeft ?? 0);
  const top = Math.abs(info.trimOffsetTop ?? 0);
  boxes.push({ left, top, right: left + info.width, bottom: top + info.height });
}
const box = {
  left: Math.min(...boxes.map((b) => b.left)),
  top: Math.min(...boxes.map((b) => b.top)),
  right: Math.max(...boxes.map((b) => b.right)),
  bottom: Math.max(...boxes.map((b) => b.bottom)),
};

for (const [name, source] of Object.entries(logos)) {
  const to = await target(join(brand, 'logo', name));
  await sharp(logoSource(source))
    .extract({ left: box.left, top: box.top, width: box.right - box.left, height: box.bottom - box.top })
    .resize({ width: LOGO_WIDTH })
    .png({ compressionLevel: 9 })
    .toFile(to);
  done(to);
}

// 2. Signifier, and the favicons made from it.
const signifier = join(graphics, 'Logos', 'Signifier', 'RGB', 'STEM Racing Signifier_RGB.png');
const clear = { r: 0, g: 0, b: 0, alpha: 0 };
const carbonShadow = '#05000B';
await copy(signifier, join(brand, 'signifier', 'signifier-colour.png'));

for (const size of [32, 192]) {
  const to = await target(join(pub, `favicon-${size}.png`));
  await sharp(signifier).resize({ width: size, height: size, fit: 'contain', background: clear }).png().toFile(to);
  done(to);
}

const touchIcon = await target(join(pub, 'apple-touch-icon.png'));
const mark = await sharp(signifier)
  .resize({ width: 124, height: 124, fit: 'contain', background: clear })
  .png()
  .toBuffer();
await sharp({ create: { width: 180, height: 180, channels: 3, background: carbonShadow } })
  .composite([{ input: mark, left: 28, top: 28 }])
  .png()
  .toFile(touchIcon);
done(touchIcon);

// 3. Gradients.
const gradients = join(graphics, 'Gradients', 'RGB', 'PNG');
await copy(join(gradients, 'SR gradient@2x.png'), join(brand, 'gradients', 'sr-gradient.png'));

const meshes = {
  'mesh-hot.png': 'STEM Racing Gradients_Hot RGB.png',
  'mesh-pink-orange.png': 'STEM Racing Gradients_Pink Orange RGB.png',
};
for (const [name, source] of Object.entries(meshes)) {
  const from = join(gradients, source);
  const to = await target(join(brand, 'gradients', name));
  const { width, height } = await sharp(from).metadata();
  await sharp(from)
    .extract({ left: 2, top: 2, width: width - 4, height: height - 4 })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(to);
  done(to);
}

// 4. Track shapes and pattern.
const shapes = join(graphics, 'Shapes', 'RGB', 'SVG');
await copy(join(shapes, 'Colour', 'STEM Racing Shapes_Pink RGB.svg'), join(brand, 'shapes', 'shape-pink.svg'));
await copy(join(shapes, 'Colour', 'STEM Racing Shapes_Yellow RGB.svg'), join(brand, 'shapes', 'shape-yellow.svg'));
await copy(join(shapes, 'Black', 'STEM Racing Shapes_Black 1 RGB.svg'), join(brand, 'shapes', 'shape-black-1.svg'));
await copy(
  join(graphics, 'Patterns', 'RGB', 'PNG', 'STEM Racing Patterns_Jagged RGB.png'),
  join(brand, 'patterns', 'pattern-jagged.png'),
);

// 5. Magistral is supplied as WOFF2. MachoModular is converted by scripts/convert-fonts.py.
for (const name of ['Magistral-BoldItalic.woff2', 'Magistral-MediumItalic.woff2']) {
  await copy(join(pack, 'Fonts', 'Magistral', name), join(pub, 'fonts', name));
}

console.log('\nBrand assets are in place. Next: convert MachoModular with scripts/convert-fonts.py');
```

- [ ] **Step 4: Write the font script**

Create `scripts/convert-fonts.py`:

```python
"""Converts the MachoModular OTF files in the brand pack to WOFF2 for the web.

Run it in a throwaway virtual environment, outside the project folder:

    python3 -m venv "$SCRATCH/fontenv"
    "$SCRATCH/fontenv/bin/pip" install fonttools brotli
    "$SCRATCH/fontenv/bin/python" scripts/convert-fonts.py "/path/to/STEM RACING BRANDING SHARE"
"""
import os
import sys

from fontTools.ttLib import TTFont

root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
default_pack = os.path.join(root, '..', 'STEM Racing', 'STEM RACING BRANDING SHARE')
pack = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else default_pack)
source_dir = os.path.join(pack, 'Fonts', 'Machomodular')
target_dir = os.path.join(root, 'public', 'fonts')

if not os.path.isdir(source_dir):
    sys.exit(f'MachoModular folder not found at {source_dir}')

os.makedirs(target_dir, exist_ok=True)

for weight in ('Light', 'Medium', 'Bold'):
    matches = [name for name in os.listdir(source_dir) if name.endswith(f'MachoModular_{weight}.otf')]
    if len(matches) != 1:
        sys.exit(f'Expected one MachoModular {weight} file in {source_dir}, found {len(matches)}')

    font = TTFont(os.path.join(source_dir, matches[0]))
    family = font['name'].getDebugName(1) or ''
    if 'MachoModular' not in family:
        sys.exit(f'{matches[0]} is "{family}", not MachoModular')

    target = os.path.join(target_dir, f'MachoModular-{weight}.woff2')
    font.flavor = 'woff2'
    font.save(target)
    print(f'wrote {os.path.relpath(target, root)} ({os.path.getsize(target)} bytes)')
```

- [ ] **Step 5: Copy the artwork**

```bash
node scripts/prepare-brand-assets.mjs "/Users/rg/Documents/STEM Racing/STEM RACING BRANDING SHARE"
```

Expected: 17 lines that start with `wrote`, then `Brand assets are in place.`

- [ ] **Step 6: Convert MachoModular**

Set `SCRATCH` to your session scratchpad directory first. The virtual environment must not be inside the project.

```bash
python3 -m venv "$SCRATCH/fontenv"
"$SCRATCH/fontenv/bin/pip" install --quiet fonttools brotli
"$SCRATCH/fontenv/bin/python" scripts/convert-fonts.py "/Users/rg/Documents/STEM Racing/STEM RACING BRANDING SHARE"
```

Expected: three lines that start with `wrote public/fonts/MachoModular-`, each between 40,000 and 45,000 bytes.

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx vitest run tests/unit/assets.test.ts`
Expected: PASS, 22 tests.

- [ ] **Step 8: Look at what was made**

Open `src/assets/brand/logo/tbs-colour-white.png` and `public/apple-touch-icon.png` with the Read tool.

Expected: the first shows the STEM Racing signifier and "THE BRITISH SCHOOL", tight to the edges. It may look empty on a white viewer because the wordmark is white: that is correct. The second shows the signifier on a near-black square.

- [ ] **Step 9: Commit**

```bash
git add scripts/prepare-brand-assets.mjs scripts/convert-fonts.py src/assets public tests/unit/assets.test.ts
git commit -m "feat: add official brand artwork and fonts" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Content collections

**Files:**
- Create: `src/lib/schemas.ts`, `src/content.config.ts`, `scripts/check-publish.mjs`
- Create: 27 content files under `src/content/` (listed in Steps 6 to 9)
- Test: `tests/unit/schemas.test.ts`, `tests/unit/content.test.ts`, `tests/unit/check-publish.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `src/lib/schemas.ts` exports `teamSchema(image)`, `heritageSchema(image)`, `seasonSchema`, `resultSchema`, `resourceSchema`, `eventSchema`, `schoolSchema`, `siteSchema`, `programmeSchema`, `supportSchema`. The first two are functions that take Astro's `image()` helper. Every object is a `z.strictObject`.
  - Ten collections, named `teams`, `seasons`, `results`, `resources`, `event`, `heritage`, `school`, `site`, `programme`, `support`.
  - Entry ids for the single-file collections are `event`, `school`, `site`, `programme` and `support`.
  - `node scripts/check-publish.mjs [content folder]` exits with 0 when nothing is marked as a sample, and with 1 and a list when something is.

This task pins Review Focus 2 and 4.

`src/content.config.ts` reads every folder through a small function, `files()`, and not through Astro's `glob()` directly. Astro keeps the entries of the last build when a folder has no files in it, so a deleted team or season would stay on the site. `files()` empties the store first. Do not replace it with `glob()`.

Where the seed content comes from. Do not add to it and do not embellish it.

| Content | Source |
|---|---|
| The eight heritage teams and years | The "TBS Success" slide of the parent orientation deck |
| "Represented India at the World Finals" | The selection letter to parents: "8 teams that have represented India at the World Finals" |
| "Season 9", the two dated timeline items, the three selection steps | The Season 9 interview invitation and selection letter |
| Coordinator, mentor and parent roles, the 12 step titles | The parent orientation deck |
| "Ms Sonica Puri, Coordinator, STEM Racing TBS" | Her name card in the parent orientation deck |
| School address, 1,270 students, 60 nationalities, the curriculum stages | british-school.org, read on 2026-09-27 |
| The four resource links | stemracing.com, read on 2026-09-27 |
| The two teams, the event | Samples. Marked `sample: true`. |

- [ ] **Step 1: Write the three failing tests**

Create `tests/unit/schemas.test.ts`:

```ts
import { z } from 'astro/zod';
import { describe, expect, it } from 'vitest';
import {
  eventSchema,
  heritageSchema,
  programmeSchema,
  resourceSchema,
  resultSchema,
  seasonSchema,
  siteSchema,
  supportSchema,
  teamSchema,
} from '../../src/lib/schemas';

// Astro supplies image() at build time. A plain string stands in for it here.
const image = () => z.string();
const team = teamSchema(image);

const validTeam = {
  name: 'Velocity',
  season: '2026-27',
  category: 'Development',
  members: ['Priya Sharma (Team Principal)'],
  status: 'active',
};

function issues(result: { success: boolean; error?: z.ZodError }) {
  return (result.error?.issues ?? []).map((issue) => ({
    path: issue.path.join('.'),
    code: issue.code,
    message: issue.message,
  }));
}

describe('team', () => {
  it('accepts a team with no car name and no image', () => {
    const result = team.safeParse(validTeam);
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ sample: false });
  });

  it('rejects the old colours field, so a team cannot bring its own colours', () => {
    const result = team.safeParse({ ...validTeam, colours: ['#19c6d1'] });
    expect(issues(result)).toEqual([
      { path: '', code: 'unrecognized_keys', message: 'Unrecognized key: "colours"' },
    ]);
  });

  it('names a misspelt field', () => {
    const result = team.safeParse({ ...validTeam, carname: 'Falcon' });
    expect(issues(result)[0]?.message).toBe('Unrecognized key: "carname"');
  });

  it('names the field when the category is wrong', () => {
    const result = team.safeParse({ ...validTeam, category: 'Pro' });
    expect(issues(result)[0]?.path).toBe('category');
  });

  it('needs at least one member', () => {
    const result = team.safeParse({ ...validTeam, members: [] });
    expect(issues(result)).toEqual([{ path: 'members', code: 'too_small', message: 'List at least one member' }]);
  });

  it('rejects a blank name', () => {
    const result = team.safeParse({ ...validTeam, name: '   ' });
    expect(issues(result)).toEqual([{ path: 'name', code: 'too_small', message: 'This field cannot be empty' }]);
  });
});

describe('season', () => {
  const validSeason = {
    year: '2026-27',
    registrationOpen: false,
    timeline: [{ title: 'Regional Finals', description: '' }],
  };

  it('accepts a milestone with no date and a season with no deadline', () => {
    expect(seasonSchema.safeParse(validSeason).success).toBe(true);
  });

  it('says how to write a date, and which one is wrong', () => {
    const result = seasonSchema.safeParse({
      ...validSeason,
      timeline: [
        { date: '2026-09-16', title: 'Briefing', description: '' },
        { date: '2 Oct 2026', title: 'Deadline', description: '' },
      ],
    });
    expect(issues(result)).toEqual([
      { path: 'timeline.1.date', code: 'invalid_format', message: 'Use YYYY-MM-DD, for example 2026-10-02' },
    ]);
  });

  it('checks the form of the year label', () => {
    const result = seasonSchema.safeParse({ ...validSeason, year: '2026/27' });
    expect(issues(result)[0]).toMatchObject({ path: 'year', message: 'Use the form 2026-27' });
  });
});

describe('result', () => {
  it('only accepts the three event names', () => {
    const base = { season: '2025', team: 'SuperCharged', placing: 'Represented India' };
    expect(resultSchema.safeParse({ ...base, event: 'World Finals' }).data?.awards).toEqual([]);
    expect(issues(resultSchema.safeParse({ ...base, event: 'Worlds' }))[0]?.path).toBe('event');
  });
});

describe('resource', () => {
  const base = { title: 'Downloads', description: 'Documents.', category: 'Official' };

  it('accepts a web link and a file in the public folder', () => {
    expect(resourceSchema.safeParse({ ...base, fileUrl: 'https://www.stemracing.com/downloads' }).success).toBe(true);
    expect(resourceSchema.safeParse({ ...base, fileUrl: '/downloads/booklet.pdf' }).success).toBe(true);
  });

  it('rejects a link with no https://', () => {
    const result = resourceSchema.safeParse({ ...base, fileUrl: 'www.stemracing.com/downloads' });
    expect(issues(result)[0]).toMatchObject({
      path: 'fileUrl',
      message: 'Start with https://, mailto: or / (for a file in the public folder)',
    });
  });
});

describe('site', () => {
  const base = {
    address: 'The British School',
    schoolUrl: 'https://www.british-school.org/',
    stats: [{ value: '8', label: 'Teams' }],
    contacts: [{ name: 'Ms Sonica Puri', role: 'Coordinator' }],
  };

  it('accepts a contact with no email address', () => {
    expect(siteSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a badly formed email address', () => {
    const result = siteSchema.safeParse({
      ...base,
      contacts: [{ name: 'A', role: 'B', email: 'not-an-address' }],
    });
    expect(issues(result)[0]?.path).toBe('contacts.0.email');
  });

  it('takes one to four figures', () => {
    expect(siteSchema.safeParse({ ...base, stats: [] }).success).toBe(false);
    const five = Array.from({ length: 5 }, () => ({ value: '1', label: 'x' }));
    expect(siteSchema.safeParse({ ...base, stats: five }).success).toBe(false);
  });
});

describe('programme', () => {
  const point = { title: 'Step', body: 'Text.' };

  it('needs exactly 12 steps, because the page says 12', () => {
    const eleven = Array.from({ length: 11 }, () => point);
    const result = programmeSchema.safeParse({ steps: eleven, roles: [point], judging: [point] });
    expect(issues(result)[0]).toMatchObject({ path: 'steps', message: 'The programme has exactly 12 steps' });
  });
});

describe('support, heritage and event', () => {
  it('needs at least one point for each role', () => {
    expect(supportSchema.safeParse({ coordinator: ['a'], mentor: ['b'], parents: [] }).success).toBe(false);
  });

  it('accepts a heritage entry with only a year and a team', () => {
    expect(heritageSchema(image).safeParse({ year: '2014', team: 'Team Ignite' }).success).toBe(true);
  });

  it('marks an event as real unless it says sample', () => {
    const result = eventSchema.safeParse({
      enabled: false,
      name: 'Regional Finals',
      dates: 'To be confirmed',
      venue: 'The British School',
      schedule: [],
      scrutineeringInfo: 'Bring the car.',
      whatToBring: [],
      contact: 'The coordinator',
    });
    expect(result.data?.sample).toBe(false);
  });
});
```

Create `tests/unit/content.test.ts`:

```ts
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'astro/zod';
import { describe, expect, it } from 'vitest';
import {
  eventSchema,
  heritageSchema,
  programmeSchema,
  resourceSchema,
  resultSchema,
  seasonSchema,
  siteSchema,
  supportSchema,
} from '../../src/lib/schemas';

// Checks every JSON content file against its rules without running a full build.
// Markdown files (teams, school) are checked by the build itself.
const content = join(process.cwd(), 'src/content');
const image = () => z.string();

const collections = {
  seasons: seasonSchema,
  results: resultSchema,
  resources: resourceSchema,
  event: eventSchema,
  heritage: heritageSchema(image),
  site: siteSchema,
  programme: programmeSchema,
  support: supportSchema,
};

const files = Object.entries(collections).flatMap(([name, schema]) =>
  readdirSync(join(content, name))
    .filter((file) => file.endsWith('.json'))
    .map((file) => ({ label: `${name}/${file}`, path: join(content, name, file), schema })),
);

describe('content files', () => {
  it('finds content to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('$label follows the rules for its collection', ({ path, schema }) => {
    const result = schema.safeParse(JSON.parse(readFileSync(path, 'utf8')));
    expect(result.error?.issues ?? []).toEqual([]);
  });
});
```

Create `tests/unit/check-publish.test.ts`:

```ts
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const script = join(process.cwd(), 'scripts/check-publish.mjs');
const made: string[] = [];

function contentWith(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'tbs-content-'));
  made.push(dir);
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(join(dir, name, '..'), { recursive: true });
    writeFileSync(join(dir, name), text);
  }
  return dir;
}

function run(dir: string) {
  const result = spawnSync('node', [script, dir], { encoding: 'utf8' });
  return { code: result.status, out: result.stdout + result.stderr };
}

afterEach(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('check-publish', () => {
  it('passes when nothing is marked as a sample', () => {
    const dir = contentWith({
      'teams/velocity.md': '---\nname: Velocity\nstatus: active\n---\n\nA real team.\n',
      'site/site.json': '{ "address": "The British School" }',
    });
    expect(run(dir)).toEqual({
      code: 0,
      out: 'Ready to publish: no sample entries and no example links.\n',
    });
  });

  it('lists a sample team', () => {
    const dir = contentWith({
      'teams/sample-team-a.md': '---\nname: Sample Team A\nsample: true\n---\n\nText.\n',
    });
    const result = run(dir);
    expect(result.code).toBe(1);
    expect(result.out).toContain('teams/sample-team-a.md: sample entry.');
  });

  it('ignores the word sample in the text of a page', () => {
    const dir = contentWith({
      'teams/velocity.md': '---\nname: Velocity\n---\n\nsample: true is how you mark a sample.\n',
    });
    expect(run(dir).code).toBe(0);
  });

  it('lets a sample event through while the event page is switched off', () => {
    const dir = contentWith({ 'event/event.json': '{ "enabled": false, "sample": true }' });
    expect(run(dir).code).toBe(0);
  });

  it('lists a sample event once the event page is switched on', () => {
    const dir = contentWith({ 'event/event.json': '{ "enabled": true, "sample": true }' });
    const result = run(dir);
    expect(result.code).toBe(1);
    expect(result.out).toContain('event/event.json: sample entry.');
  });

  it('lists example.com links', () => {
    const dir = contentWith({
      'resources/guide.json': '{ "fileUrl": "https://example.com/guide.pdf" }',
    });
    const result = run(dir);
    expect(result.code).toBe(1);
    expect(result.out).toContain('resources/guide.json: contains an example.com link.');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL. `schemas.test.ts` and `content.test.ts` cannot be loaded and name `../../src/lib/schemas`. All six tests in `check-publish.test.ts` fail because the script does not exist.

- [ ] **Step 3: Write the schemas**

Create `src/lib/schemas.ts`:

```ts
// One schema per content collection. Every object is strict: a misspelt or unknown field
// fails the build and the error names the file and the field.
import { z } from 'astro/zod';

const text = z.string().trim().min(1, 'This field cannot be empty');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD, for example 2026-10-02');
const link = z
  .string()
  .regex(/^(https:\/\/|mailto:|\/)/, 'Start with https://, mailto: or / (for a file in the public folder)');
const point = z.strictObject({ title: text, body: text });

/** Astro passes an image() helper to collection schemas. Tests pass a stand-in. */
export const teamSchema = <T extends z.ZodType>(image: () => T) =>
  z.strictObject({
    name: text,
    carName: text.optional(),
    season: text,
    category: z.enum(['Development', 'Professional']),
    members: z.array(text).min(1, 'List at least one member'),
    status: z.enum(['active', 'archived']),
    heroImage: image().optional(),
    sample: z.boolean().default(false),
  });

export const seasonSchema = z.strictObject({
  year: z.string().regex(/^\d{4}-\d{2}$/, 'Use the form 2026-27'),
  name: text.optional(),
  registrationOpen: z.boolean(),
  registrationDeadline: isoDate.optional(),
  registrationUrl: link.optional(),
  timeline: z.array(
    z.strictObject({
      date: isoDate.optional(),
      title: text,
      description: z.string(),
    }),
  ),
});

export const resultSchema = z.strictObject({
  season: text,
  team: text,
  event: z.enum(['Regionals', 'Nationals', 'World Finals']),
  placing: text,
  awards: z.array(text).default([]),
});

export const resourceSchema = z.strictObject({
  title: text,
  description: text,
  fileUrl: link,
  category: text,
});

export const eventSchema = z.strictObject({
  enabled: z.boolean(),
  sample: z.boolean().default(false),
  name: text,
  dates: text,
  venue: text,
  schedule: z.array(z.strictObject({ time: text, activity: text })),
  scrutineeringInfo: text,
  whatToBring: z.array(text),
  contact: text,
});

export const heritageSchema = <T extends z.ZodType>(image: () => T) =>
  z.strictObject({
    year: text,
    team: text,
    note: text.optional(),
    image: image().optional(),
  });

export const schoolSchema = z.strictObject({
  title: text,
  lead: text,
});

export const siteSchema = z.strictObject({
  address: text,
  schoolUrl: link,
  stats: z.array(z.strictObject({ value: text, label: text })).min(1).max(4),
  contacts: z.array(z.strictObject({ name: text, role: text, email: z.email().optional() })),
});

export const programmeSchema = z.strictObject({
  steps: z.array(point).length(12, 'The programme has exactly 12 steps'),
  roles: z.array(point).min(1),
  judging: z.array(point).min(1),
});

export const supportSchema = z.strictObject({
  coordinator: z.array(text).min(1),
  mentor: z.array(text).min(1),
  parents: z.array(text).min(1),
});
```

- [ ] **Step 4: Write the collection settings**

Create `src/content.config.ts`:

```ts
// Every content collection on the site. The files live in src/content.
// The rules for each collection are in src/lib/schemas.ts.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import type { Loader } from 'astro/loaders';
import {
  eventSchema,
  heritageSchema,
  programmeSchema,
  resourceSchema,
  resultSchema,
  schoolSchema,
  seasonSchema,
  siteSchema,
  supportSchema,
  teamSchema,
} from './lib/schemas';

/**
 * Reads a folder of content files, starting from an empty store each time.
 * Astro keeps the last build's entries when a folder has no files in it, so without this
 * a deleted team or season would stay on the site.
 */
function files(pattern: string, base: string): Loader {
  const inner = glob({ pattern, base });
  return {
    ...inner,
    load: async (context) => {
      context.store.clear();
      await inner.load(context);
    },
  };
}

const teams = defineCollection({
  loader: files('*.md', './src/content/teams'),
  schema: ({ image }) => teamSchema(image),
});

const seasons = defineCollection({
  loader: files('*.json', './src/content/seasons'),
  schema: seasonSchema,
});

const results = defineCollection({
  loader: files('*.json', './src/content/results'),
  schema: resultSchema,
});

const resources = defineCollection({
  loader: files('*.json', './src/content/resources'),
  schema: resourceSchema,
});

const event = defineCollection({
  loader: files('event.json', './src/content/event'),
  schema: eventSchema,
});

const heritage = defineCollection({
  loader: files('*.json', './src/content/heritage'),
  schema: ({ image }) => heritageSchema(image),
});

const school = defineCollection({
  loader: files('school.md', './src/content/school'),
  schema: schoolSchema,
});

const site = defineCollection({
  loader: files('site.json', './src/content/site'),
  schema: siteSchema,
});

const programme = defineCollection({
  loader: files('programme.json', './src/content/programme'),
  schema: programmeSchema,
});

const support = defineCollection({
  loader: files('support.json', './src/content/support'),
  schema: supportSchema,
});

export const collections = {
  teams,
  seasons,
  results,
  resources,
  event,
  heritage,
  school,
  site,
  programme,
  support,
};
```

- [ ] **Step 5: Write the publish check**

Create `scripts/check-publish.mjs`:

```js
// Lists content that has to be replaced before the site goes public.
// Exit code 0 means the content is ready. Exit code 1 means something is listed.
//
// Usage: node scripts/check-publish.mjs [content folder]
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const contentDir = resolve(process.argv[2] ?? 'src/content');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function frontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  return match ? match[1] : '';
}

const problems = [];

for (const file of walk(contentDir).sort()) {
  if (!/\.(md|json)$/.test(file)) continue;
  const text = readFileSync(file, 'utf8');
  const name = relative(contentDir, file);

  const isSample = file.endsWith('.json')
    ? /"sample"\s*:\s*true/.test(text)
    : /^sample:\s*true\s*$/m.test(frontmatter(text));
  const isHiddenEvent = /(^|[\\/])event\.json$/.test(file) && /"enabled"\s*:\s*false/.test(text);

  if (isSample && !isHiddenEvent) {
    problems.push(`${name}: sample entry. Replace it with real content, then remove "sample".`);
  }
  if (/https?:\/\/(www\.)?example\.(com|org|net)/i.test(text)) {
    problems.push(`${name}: contains an example.com link.`);
  }
}

if (problems.length > 0) {
  console.error(`Not ready to publish. ${problems.length} item(s) to fix:\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log('Ready to publish: no sample entries and no example links.');
```

- [ ] **Step 6: Write the two sample teams and the season**

```bash
mkdir -p src/content/teams src/content/seasons src/content/results src/content/resources src/content/event src/content/heritage src/content/school src/content/site src/content/programme src/content/support
```

Create `src/content/teams/sample-team-a.md`:

```md
---
name: Sample Team A
carName: Sample car
season: "2026-27"
category: Professional
members:
  - Student name (Team Principal)
  - Student name (Design Engineer)
  - Student name (Manufacturing Engineer)
  - Student name (Enterprise Manager)
status: active
sample: true
---

This is a sample entry. It shows how a team card looks. Replace it with a real team, then delete the line that says `sample: true`.
```

Create `src/content/teams/sample-team-b.md`. It has no car name and one member with no role, on purpose:

```md
---
name: Sample Team B
season: "2026-27"
category: Development
members:
  - Student name (Team Principal)
  - Student name (Design Engineer)
  - Student name
status: active
sample: true
---

This is a sample entry with no car name and no image. Replace it with a real team, then delete the line that says `sample: true`.
```

Create `src/content/seasons/2026-27.json`. Three items have no date, on purpose: the dates are not known.

```json
{
  "year": "2026-27",
  "name": "Season 9",
  "registrationOpen": false,
  "timeline": [
    {
      "date": "2026-09-03",
      "title": "Interview invitations",
      "description": "Every proposal booklet was reviewed against the published rubric, and teams were invited to interview."
    },
    {
      "date": "2026-09-16",
      "title": "Parents' briefing",
      "description": "3:20 pm in the Innovation Lab. The structure of the competition, the judging categories, the season timeline and how families can help."
    },
    {
      "title": "Regional Finals",
      "description": "The first competition of the season. The organisers set the date and venue."
    },
    {
      "title": "National Finals",
      "description": "For teams that qualify at the Regional Finals."
    },
    {
      "title": "World Finals",
      "description": "For teams that qualify at the National Finals."
    }
  ]
}
```

- [ ] **Step 7: Write the heritage and results files**

One command writes 16 files, a heritage entry and a World Finals result for each of the eight teams:

```bash
while IFS='|' read -r year team slug; do
cat > "src/content/heritage/$year-$slug.json" <<EOF
{
  "year": "$year",
  "team": "$team",
  "note": "Represented India at the World Finals."
}
EOF
cat > "src/content/results/$year-$slug-world-finals.json" <<EOF
{
  "season": "$year",
  "team": "$team",
  "event": "World Finals",
  "placing": "Represented India",
  "awards": []
}
EOF
done <<'LIST'
2014|Team Ignite|team-ignite
2018|Team Impulse|team-impulse
2019|Team Stallion|team-stallion
2020-21|GDR|gdr
2020-21|Blaze|blaze
2022|Launchpad Racing|launchpad-racing
2023|Team Blaze|team-blaze
2025|SuperCharged|supercharged
LIST
ls src/content/heritage src/content/results
```

Expected: eight files in each folder. For example `src/content/heritage/2014-team-ignite.json` holds:

```json
{
  "year": "2014",
  "team": "Team Ignite",
  "note": "Represented India at the World Finals."
}
```

- [ ] **Step 8: Write the resources and the event**

Create `src/content/resources/official-downloads.json`:

```json
{
  "title": "Official downloads",
  "description": "Documents published by STEM Racing for competing teams.",
  "fileUrl": "https://www.stemracing.com/downloads",
  "category": "Official STEM Racing"
}
```

Create `src/content/resources/the-competition.json`:

```json
{
  "title": "The competition explained",
  "description": "How the STEM Racing competition works, from STEM Racing itself.",
  "fileUrl": "https://www.stemracing.com/the-competition",
  "category": "Official STEM Racing"
}
```

Create `src/content/resources/secondary-division.json`:

```json
{
  "title": "Secondary division",
  "description": "The division TBS teams compete in, for students aged 11 to 19.",
  "fileUrl": "https://www.stemracing.com/secondary",
  "category": "Official STEM Racing"
}
```

Create `src/content/resources/marketing-assets.json`:

```json
{
  "title": "Brand and marketing assets",
  "description": "Logos and brand guidance from STEM Racing, for team identity work.",
  "fileUrl": "https://www.stemracing.com/marketing-assets",
  "category": "Brand"
}
```

Create `src/content/event/event.json`. It is switched off and marked as a sample:

```json
{
  "enabled": false,
  "sample": true,
  "name": "Sample event",
  "dates": "Date to be confirmed",
  "venue": "The British School, Dr Jose P Rizal Marg, Chanakyapuri, New Delhi 110021",
  "schedule": [
    { "time": "08:00", "activity": "Team registration and pit booth set-up" },
    { "time": "09:00", "activity": "Scrutineering" },
    { "time": "10:30", "activity": "Judging and verbal presentations" },
    { "time": "14:00", "activity": "Racing" },
    { "time": "16:00", "activity": "Awards" }
  ],
  "scrutineeringInfo": "Bring the car fully assembled. Officials check it against the Technical Regulations for the season before it races.",
  "whatToBring": [
    "Race cars",
    "Printed portfolios",
    "Verbal presentation files",
    "Pit booth display",
    "Team uniform"
  ],
  "contact": "Ms Sonica Puri, Coordinator, STEM Racing TBS"
}
```

- [ ] **Step 9: Write the school, site, programme and support files**

Create `src/content/school/school.md`:

```md
---
title: The British School, New Delhi
lead: An international school in Chanakyapuri, the diplomatic enclave of New Delhi, and the home of STEM Racing TBS.
---

## About the school

The British School, New Delhi is an international school with around 1,270 students from 60 nationalities. Students join in the Early Years Foundation Stage, move through Key Stages 1 to 3, take the IGCSE in Key Stage 4 and finish with the IB Diploma Programme.

The school is on Dr Jose P Rizal Marg in Chanakyapuri. Visit the [school website](https://www.british-school.org/) to find out more.

## Why we run STEM Racing

Over a season, students gain real experience in computer-aided design, aerodynamics, manufacturing, public speaking, teamwork and leadership. They also learn to run a small business, from sponsorship and branding to finance and project management.

The British School has a proud history in the competition. Our teams have represented India at the World Finals and earned a multitude of awards, and each new cohort builds on that record.
```

Create `src/content/site/site.json`. The contacts have no email addresses, on purpose:

```json
{
  "address": "The British School, Dr Jose P Rizal Marg, Chanakyapuri, New Delhi 110021",
  "schoolUrl": "https://www.british-school.org/",
  "stats": [
    { "value": "8", "label": "TBS teams have represented India at the World Finals" },
    { "value": "9", "label": "Seasons of STEM Racing at TBS" },
    { "value": "50+", "label": "Countries take part in STEM Racing" }
  ],
  "contacts": [
    { "name": "Ms Sonica Puri", "role": "Coordinator, STEM Racing TBS" },
    { "name": "Student mentors", "role": "First point of contact for every team" }
  ]
}
```

Create `src/content/programme/programme.json`:

```json
{
  "steps": [
    { "title": "Form a team", "body": "Three to six students agree roles that cover engineering, enterprise and project management." },
    { "title": "Business and sponsorship", "body": "Set a budget, write a sponsorship plan and approach partners who can support the season." },
    { "title": "Design", "body": "Model the car in CAD, working inside the Technical Regulations from the first sketch." },
    { "title": "Analyse", "body": "Use virtual testing to compare ideas before anything is made." },
    { "title": "Make", "body": "Manufacture the car body and its components, then finish and assemble them." },
    { "title": "Test", "body": "Test the car, record the results and improve the design." },
    { "title": "Pit booth", "body": "Design and build the display that presents the team and its work at the event." },
    { "title": "Scrutineering", "body": "Officials measure the car against the Technical Regulations before it races." },
    { "title": "Engineering judging", "body": "Explain the design and manufacturing decisions to the engineering judges." },
    { "title": "Verbal presentation", "body": "Present the season to a panel of judges." },
    { "title": "Portfolios", "body": "Submit the portfolios that document the engineering and enterprise work." },
    { "title": "Race", "body": "Race the car on the 20 metre track." }
  ],
  "roles": [
    { "title": "Design and engineering", "body": "Model, analyse, make and test the car. This group owns the Technical Regulations and the engineering portfolio." },
    { "title": "Enterprise", "body": "Raise sponsorship, manage the budget and build the team identity. This group owns the enterprise portfolio and the pit booth." },
    { "title": "Project management", "body": "Set the schedule, run team meetings, track risks and make sure every deadline is met." }
  ],
  "judging": [
    { "title": "Scrutineering", "body": "The race cars are measured against the Technical Regulations." },
    { "title": "Engineering", "body": "Judges question the team on how the car was designed, analysed, made and tested." },
    { "title": "Portfolios", "body": "Written evidence of the engineering work and of how the team ran its enterprise and its project." },
    { "title": "Pit booth", "body": "The display that presents the team, its identity and its partners." },
    { "title": "Verbal presentation", "body": "A presentation of the season to a panel of judges." },
    { "title": "Racing", "body": "Performance on the 20 metre track." }
  ]
}
```

Create `src/content/support/support.json`:

```json
{
  "coordinator": [
    "Logistics, after-school club support and training provision",
    "Liaison with STEM Racing India",
    "Main contact with parents"
  ],
  "mentor": [
    "First point of contact for the team",
    "Makes sure the team meets every week and manages its project around school assessments",
    "Mediates when a team disagrees, and reports to the coordinators"
  ],
  "parents": [
    "Touch base regularly with your child and ask if they need support",
    "Check emails from the mentors",
    "Act as a critical friend: give feedback, but do not do the work",
    "Accompany students to meetings with sponsors and vendors. No one should travel alone to meet adults",
    "Check with the teachers if you are not sure about your child's request",
    "Monitor the team's social media accounts"
  ]
}
```

- [ ] **Step 10: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, 131 tests in 12 files. `content.test.ts` has 26: one for each of the 25 JSON files, and one that checks the list is not empty.

- [ ] **Step 11: Run the publish check**

Run: `npm run check:publish`
Expected: exit code 1 and this list. That is the intended state until real teams replace the samples.

```
Not ready to publish. 2 item(s) to fix:

  - teams/sample-team-a.md: sample entry. Replace it with real content, then remove "sample".
  - teams/sample-team-b.md: sample entry. Replace it with real content, then remove "sample".
```

- [ ] **Step 12: Commit**

```bash
git add src/lib/schemas.ts src/content.config.ts src/content scripts/check-publish.mjs tests/unit
git commit -m "feat: add content collections with strict schemas and seed content" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Tokens, fonts and base styles

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/fonts.css`, `src/styles/global.css`
- Create: `tests/helpers/contrast.ts`
- Test: `tests/unit/tokens.test.ts`

**Interfaces:**
- Consumes: the font files from Task 4, by URL: `/fonts/Magistral-BoldItalic.woff2` and the four others.
- Produces:
  - Colour tokens: `--carbon-shadow`, `--carbon-800`, `--carbon-700`, `--carbon-500`, `--carbon-300`, `--carbon-100`, `--surface-light`, `--white`, `--ignite-indigo`, `--chicane-violet`, `--pitlane-pink`, `--burnout-orange`, `--podium-gold`
  - Gradient tokens: `--gradient-core`, `--gradient-secondary`, `--gradient-heading`
  - Type tokens: `--font-display`, `--font-body`, `--text-small`, `--text-body`, `--text-lead`, `--text-h3`, `--text-h2`, `--text-h1`, `--text-track`
  - Layout tokens: `--gutter`, `--container`, `--section-y`, `--radius`, `--header-h`
  - Surface variables that a section sets and its contents read: `--fg`, `--fg-strong`, `--fg-muted`, `--fg-inverse`, `--rule`, `--card-bg`, `--card-border`
  - Utility classes: `.container`, `.grid`, `.grid--2`, `.grid--3`, `.grid--4`, `.stack`, `.stack--loose`, `.actions`, `.lead`, `.eyebrow`, `.muted`, `.prose`, `.card`, `.panel`, `.tag`, `.tag--sample`, `.table`, `.table-wrap`, `.sr-only`, `.skip-link`, `.page-head`
  - Tone classes `.on-dark` and `.on-light`, which colour the headings inside them
  - Motion classes `.reveal-pending` and `.is-visible`, which only a script adds
  - `tests/helpers/contrast.ts` exports `hexToRgb`, `luminance`, `contrast`, `mix` and the type `Rgb`

This task pins Review Focus 3 and 5.

Two numbers in these files come from measurement, not from taste:

- The fallback font figures in `fonts.css` come from the font files: MachoModular has an average glyph width of 426.6 units in 1000, ascent 900 and descent 250. Magistral Bold Italic has 479.5, ascent 700, descent 170 and line gap 330.
- The `-15%` in `--gradient-heading` moves the violet stop outside the heading, so the darkest colour that shows has 3.05:1 contrast on Carbon Shadow. Pure Chicane Violet has 2.74:1.

- [ ] **Step 1: Write the contrast helper**

Create `tests/helpers/contrast.ts`:

```ts
// WCAG 2 contrast maths, used to pin the brand colour pairs.

export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match || match[1] === undefined) throw new Error(`Not a six-digit hex colour: ${hex}`);
  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function luminance([r, g, b]: Rgb): number {
  const channel = (value: number) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/** The colour part of the way from one colour to another. 0 is the first, 1 is the second. */
export function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  return from.map((value, index) => Math.round(value + ((to[index] ?? 0) - value) * amount)) as Rgb;
}
```

- [ ] **Step 2: Write the failing test**

Create `tests/unit/tokens.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrast, hexToRgb, mix } from '../helpers/contrast';

const styles = join(process.cwd(), 'src/styles');
const tokensCss = readFileSync(join(styles, 'tokens.css'), 'utf8');
const fontsCss = readFileSync(join(styles, 'fonts.css'), 'utf8');
const globalCss = readFileSync(join(styles, 'global.css'), 'utf8');

const tokens = Object.fromEntries(
  [...tokensCss.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((match) => [match[1], match[2]]),
);
const colour = (name: string) => {
  const hex = tokens[name];
  if (!hex) throw new Error(`tokens.css has no colour called --${name}`);
  return hexToRgb(hex);
};
const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('colour tokens', () => {
  it('match the brand guide', () => {
    expect(tokens).toMatchObject({
      'carbon-shadow': '#05000B',
      'ignite-indigo': '#312783',
      'chicane-violet': '#961B81',
      'pitlane-pink': '#E6007E',
      'burnout-orange': '#ED6D05',
      'podium-gold': '#FCBC00',
    });
  });

  it('use the tints sampled from the guide', () => {
    expect(tokens).toMatchObject({
      'carbon-800': '#261A3D',
      'carbon-700': '#2E2347',
      'carbon-500': '#5B5376',
      'carbon-300': '#A39FB8',
      'carbon-100': '#D7D6E3',
      'surface-light': '#F3F3F7',
    });
  });

  it('hold no colour from the Discovery or Primary divisions', () => {
    const forbidden = ['#008A3F', '#95C11F', '#005CA9', '#009FE3'];
    for (const css of [tokensCss, fontsCss, globalCss]) {
      for (const hex of forbidden) expect(css.toUpperCase()).not.toContain(hex);
    }
  });
});

describe('contrast', () => {
  it.each([
    ['body text on dark', 'carbon-100', 'carbon-shadow'],
    ['muted text on dark', 'carbon-300', 'carbon-shadow'],
    ['muted text on a dark card', 'carbon-300', 'carbon-700'],
    ['body text on light', 'carbon-shadow', 'surface-light'],
    ['muted text on light', 'carbon-500', 'surface-light'],
    ['violet heading on light', 'chicane-violet', 'surface-light'],
    ['button text on violet', 'white', 'chicane-violet'],
    ['button text on indigo', 'white', 'ignite-indigo'],
    ['dark text on orange mesh', 'carbon-shadow', 'burnout-orange'],
    ['dark text on gold', 'carbon-shadow', 'podium-gold'],
  ])('%s is at least 4.5:1', (_label, text, surface) => {
    expect(contrast(colour(text), colour(surface))).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps every visible part of a gradient heading at 3:1 or better on dark', () => {
    const start = /--gradient-heading:[^;]*var\(--chicane-violet\)\s*(-?\d+)%[^;]*var\(--pitlane-pink\)\s*(\d+)%/.exec(
      tokensCss,
    );
    expect(start).not.toBeNull();
    const violetAt = Number(start?.[1]);
    const pinkAt = Number(start?.[2]);
    // The heading box starts at 0%. Work out the colour there.
    const leftEdge = mix(colour('chicane-violet'), colour('pitlane-pink'), (0 - violetAt) / (pinkAt - violetAt));
    expect(contrast(leftEdge, colour('carbon-shadow'))).toBeGreaterThanOrEqual(3);
    expect(contrast(colour('pitlane-pink'), colour('carbon-shadow'))).toBeGreaterThanOrEqual(3);
    expect(contrast(colour('burnout-orange'), colour('carbon-shadow'))).toBeGreaterThanOrEqual(3);
  });

  it('keeps a gradient heading readable on a white card', () => {
    expect(contrast(colour('burnout-orange'), colour('white'))).toBeGreaterThanOrEqual(3);
  });
});

describe('fonts', () => {
  const faces = [...withoutComments(fontsCss).matchAll(/@font-face\s*\{([^}]*)\}/g)].map((match) => match[1] ?? '');
  const family = (face: string) => /font-family:\s*'([^']+)'/.exec(face)?.[1];

  it('declares Magistral in italic only, so it can never appear upright', () => {
    const magistral = faces.filter((face) => family(face) === 'Magistral');
    expect(magistral).toHaveLength(2);
    for (const face of magistral) expect(face).toMatch(/font-style:\s*italic/);
  });

  it('declares MachoModular Light, Medium and Bold', () => {
    const weights = faces
      .filter((face) => family(face) === 'MachoModular')
      .map((face) => /font-weight:\s*(\d+)/.exec(face)?.[1]);
    expect(weights).toEqual(['300', '500', '700']);
  });

  it('keeps the Regular rule ready for the day the file arrives', () => {
    expect(fontsCss).toContain("url('/fonts/MachoModular-Regular.woff2')");
  });

  it('swaps in the brand font as soon as it loads', () => {
    for (const face of faces.filter((f) => !family(f)?.endsWith('Fallback'))) {
      expect(face).toMatch(/font-display:\s*swap/);
    }
  });

  it('never names Verdana', () => {
    for (const css of [tokensCss, fontsCss, globalCss]) expect(css).not.toMatch(/verdana/i);
  });

  it('falls back to system-ui', () => {
    expect(tokens['font-display']).toBeUndefined();
    expect(tokensCss).toMatch(/--font-display:\s*'Magistral', 'Magistral Fallback', system-ui, sans-serif;/);
    expect(tokensCss).toMatch(/--font-body:\s*'MachoModular', 'MachoModular Fallback', system-ui, sans-serif;/);
  });
});

describe('base styles', () => {
  const css = withoutComments(globalCss);

  it('never justifies or right-aligns text', () => {
    expect(css).not.toMatch(/text-align:\s*(justify|right|end)/);
  });

  it('sets body copy at weight 400, so it is never bold throughout', () => {
    expect(/body\s*\{[^}]*\}/.exec(css)?.[0]).toMatch(/font-weight:\s*400/);
  });

  it('sets headings 1 and 2 in the display font, in italic', () => {
    const rule = /h1,\s*h2\s*\{[^}]*\}/.exec(css)?.[0] ?? '';
    expect(rule).toMatch(/font-family:\s*var\(--font-display\)/);
    expect(rule).toMatch(/font-style:\s*italic/);
    expect(rule).toMatch(/font-weight:\s*700/);
  });

  it('sets headings 3 to 5 in the body font, in bold', () => {
    const rule = /h3,\s*h4,\s*h5\s*\{[^}]*\}/.exec(css)?.[0] ?? '';
    expect(rule).toMatch(/font-family:\s*var\(--font-body\)/);
    expect(rule).toMatch(/font-weight:\s*700/);
  });

  it('draws the focus ring in Podium Gold with a dark outer ring', () => {
    const rule = /:focus-visible\s*\{[^}]*\}/.exec(css)?.[0] ?? '';
    expect(rule).toMatch(/outline:\s*3px solid var\(--podium-gold\)/);
    expect(rule).toMatch(/box-shadow:[^;]*var\(--carbon-shadow\)/);
  });

  it('switches motion off for people who ask for less of it', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  });

  it('only hides content with classes that the script adds', () => {
    const hidden = [...css.matchAll(/([^{}]+)\{[^}]*opacity:\s*0[;\s][^}]*\}/g)].map((match) => (match[1] ?? '').trim());
    expect(hidden).toEqual(['.reveal-pending']);
  });

  it('takes every colour from the tokens', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\brgba?\(/);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run tests/unit/tokens.test.ts`
Expected: FAIL with `ENOENT: no such file or directory`, naming `src/styles/tokens.css`.

- [ ] **Step 4: Write the tokens**

Create `src/styles/tokens.css`:

```css
/* Brand tokens. Source: STEM Racing Brand Identity Guidelines v1.3, Secondary division theme.
   Tint values are sampled from the guide. tests/unit/tokens.test.ts reads this file, so keep
   one declaration per line. */
:root {
  /* Core */
  --carbon-shadow: #05000B;
  --carbon-800: #261A3D;
  --carbon-700: #2E2347;
  --carbon-500: #5B5376;
  --carbon-300: #A39FB8;
  --carbon-100: #D7D6E3;
  --surface-light: #F3F3F7;
  --white: #FFFFFF;

  /* Secondary division */
  --ignite-indigo: #312783;
  --chicane-violet: #961B81;
  --pitlane-pink: #E6007E;
  --burnout-orange: #ED6D05;
  --podium-gold: #FCBC00;

  /* Gradients */
  --gradient-core: linear-gradient(90deg, var(--carbon-shadow) 0%, var(--carbon-700) 100%);
  --gradient-secondary: linear-gradient(90deg, var(--ignite-indigo) 0%, var(--chicane-violet) 27%, var(--pitlane-pink) 50%, var(--burnout-orange) 73%, var(--podium-gold) 100%);
  --gradient-heading: linear-gradient(90deg, var(--chicane-violet) -15%, var(--pitlane-pink) 52%, var(--burnout-orange) 100%);

  /* Type */
  --font-display: 'Magistral', 'Magistral Fallback', system-ui, sans-serif;
  --font-body: 'MachoModular', 'MachoModular Fallback', system-ui, sans-serif;
  --text-small: 0.8125rem;
  --text-body: 1.0625rem;
  --text-lead: clamp(1.125rem, 1.05rem + 0.4vw, 1.3125rem);
  --text-h3: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);
  --text-h2: clamp(2rem, 1.55rem + 2vw, 3rem);
  --text-h1: clamp(2.5rem, 1.6rem + 4.5vw, 5rem);
  --text-track: clamp(2.75rem, 1rem + 8.5vw, 7.5rem);

  /* Layout */
  --gutter: clamp(1.25rem, 0.75rem + 2.5vw, 2.5rem);
  --container: 75rem;
  --section-y: clamp(3.5rem, 2.5rem + 5vw, 7rem);
  --radius: 0.5rem;
  --header-h: 6rem;
}

@media (max-width: 47.99rem) {
  :root {
    --header-h: 4.75rem;
  }
}
```

- [ ] **Step 5: Write the font rules**

Create `src/styles/fonts.css`:

```css
/* Brand fonts, self-hosted from the STEM Racing brand pack.
   Magistral is declared in italic only, so it can never appear upright. */
@font-face {
  font-family: 'Magistral';
  src: url('/fonts/Magistral-BoldItalic.woff2') format('woff2');
  font-weight: 700;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: 'Magistral';
  src: url('/fonts/Magistral-MediumItalic.woff2') format('woff2');
  font-weight: 500;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: 'MachoModular';
  src: url('/fonts/MachoModular-Light.woff2') format('woff2');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}

/* Body copy asks for weight 400. The brand pack has no Regular file, so browsers use
   Medium, the nearest weight. To switch to Regular: put MachoModular-Regular.woff2 in
   public/fonts and remove the comment marks around the rule below. Nothing else changes.

@font-face {
  font-family: 'MachoModular';
  src: url('/fonts/MachoModular-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
*/

@font-face {
  font-family: 'MachoModular';
  src: url('/fonts/MachoModular-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'MachoModular';
  src: url('/fonts/MachoModular-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* Metric-matched stand-ins. They hold the layout still while the brand fonts load.
   Figures come from the font files: average glyph width, ascent, descent and line gap. */
@font-face {
  font-family: 'Magistral Fallback';
  src: local('Arial Bold Italic'), local('Arial-BoldItalicMT');
  font-style: italic;
  font-weight: 500 700;
  size-adjust: 100.53%;
  ascent-override: 69.63%;
  descent-override: 16.91%;
  line-gap-override: 32.82%;
}

@font-face {
  font-family: 'MachoModular Fallback';
  src: local('Arial'), local('ArialMT');
  size-adjust: 96.7%;
  ascent-override: 93.07%;
  descent-override: 25.85%;
  line-gap-override: 0%;
}
```

- [ ] **Step 6: Write the base styles**

Create `src/styles/global.css`:

```css
/* Base rules and shared utilities. Every colour comes from tokens.css. */

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  scroll-padding-top: calc(var(--header-h) + 1rem);
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--carbon-shadow);
  color: var(--carbon-100);
  font-family: var(--font-body);
  font-size: var(--text-body);
  font-weight: 400;
  line-height: 1.6;
  text-align: start;
  overflow-x: clip;
  -webkit-font-smoothing: antialiased;
}

h1,
h2,
h3,
h4,
h5,
p,
ul,
ol,
dl,
dd,
figure {
  margin: 0;
}

ul,
ol {
  padding: 0;
  list-style: none;
}

img,
picture,
svg {
  display: block;
  max-width: 100%;
}

img {
  height: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

h1,
h2 {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
}

h1 {
  font-size: var(--text-h1);
}

h2 {
  font-size: var(--text-h2);
}

h3,
h4,
h5 {
  font-family: var(--font-body);
  font-style: normal;
  font-weight: 700;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

h3 {
  font-size: var(--text-h3);
}

h4 {
  font-size: 1.125rem;
}

h5 {
  font-size: 1rem;
}

a {
  color: inherit;
  text-decoration-line: underline;
  text-decoration-color: var(--pitlane-pink);
  text-decoration-thickness: 0.125em;
  text-underline-offset: 0.22em;
}

a:hover {
  text-decoration-color: currentColor;
}

:focus-visible {
  outline: 3px solid var(--podium-gold);
  outline-offset: 3px;
  box-shadow: 0 0 0 6px var(--carbon-shadow);
}

/* Headings take their colour from the surface they sit on. */
.on-dark h2 {
  width: fit-content;
  max-width: 100%;
  background: var(--gradient-heading);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.on-light h2 {
  color: var(--chicane-violet);
}

.on-dark h3,
.on-light h3,
.on-dark h4,
.on-light h4 {
  color: var(--fg-strong);
}

@media (forced-colors: active) {
  .on-dark h2 {
    background: none;
    color: CanvasText;
  }
}

/* Layout */
.container {
  width: min(100% - 2 * var(--gutter), var(--container));
  margin-inline: auto;
}

.grid {
  display: grid;
  gap: clamp(1rem, 0.5rem + 2vw, 2rem);
}

.grid--2 {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
}

.grid--3 {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
}

.grid--4 {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
}

.stack > * + * {
  margin-block-start: var(--stack, 1.25rem);
}

.stack--loose {
  --stack: 2.5rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
}

/* Text */
.lead {
  max-width: 60ch;
  font-size: var(--text-lead);
  line-height: 1.5;
  color: var(--fg-strong, var(--white));
}

.eyebrow {
  font-size: var(--text-small);
  font-weight: 500;
  letter-spacing: 0.14em;
  line-height: 1.4;
  text-transform: uppercase;
  color: var(--fg-muted, var(--carbon-300));
}

.muted {
  color: var(--fg-muted, var(--carbon-300));
}

.prose {
  max-width: 68ch;
}

.prose > * + * {
  margin-block-start: 1.1em;
}

.prose > h2 {
  margin-block-start: 1.6em;
}

.prose > h2:first-child {
  margin-block-start: 0;
}

.prose code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.9em;
}

/* Surfaces */
.card {
  padding: clamp(1.25rem, 1rem + 1vw, 2rem);
  border: 1px solid var(--card-border, var(--carbon-800));
  border-radius: var(--radius);
  background: var(--card-bg, var(--gradient-core));
}

.panel {
  --fg: var(--carbon-100);
  --fg-strong: var(--white);
  --fg-muted: var(--carbon-300);
  --fg-inverse: var(--carbon-shadow);
  padding: clamp(1.75rem, 1rem + 4vw, 4rem);
  border-radius: var(--radius);
  background: var(--carbon-shadow);
  color: var(--fg);
}

.tag {
  display: inline-block;
  padding: 0.3em 0.75em;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1.3;
  text-transform: uppercase;
}

.tag--sample {
  border-color: var(--podium-gold);
  background: var(--podium-gold);
  color: var(--carbon-shadow);
}

.table-wrap {
  overflow-x: auto;
}

.table th,
.table td {
  padding: 0.85rem 1rem;
  border-block-end: 1px solid var(--rule, var(--carbon-700));
  text-align: start;
  vertical-align: top;
}

.table th {
  font-size: var(--text-small);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--fg-muted, var(--carbon-300));
}

/* Accessibility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.skip-link {
  position: absolute;
  inset-block-start: 0.5rem;
  inset-inline-start: 0.5rem;
  z-index: 100;
  padding: 0.75rem 1rem;
  border-radius: 0.25rem;
  background: var(--white);
  color: var(--carbon-shadow);
  font-weight: 700;
  transform: translateY(-200%);
}

.skip-link:focus {
  transform: none;
}

/* Motion. The script in src/scripts/motion.ts adds these classes, so with JavaScript off
   nothing is ever hidden. */
.reveal-pending {
  opacity: 0;
  transform: translateY(1.5rem);
}

.reveal-pending.is-visible {
  opacity: 1;
  transform: none;
  transition:
    opacity 0.6s ease,
    transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .reveal-pending {
    opacity: 1;
    transform: none;
  }
}

/* The band at the top of every inner page. */
.page-head {
  --text-track: clamp(2.5rem, 1rem + 6vw, 5.5rem);
  padding-block: clamp(2.5rem, 2rem + 3vw, 4.5rem);
}

.page-head > .container {
  display: none;
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, 160 tests in 13 files.

- [ ] **Step 8: Commit**

```bash
git add src/styles tests/helpers/contrast.ts tests/unit/tokens.test.ts
git commit -m "feat: add brand tokens, font rules and base styles" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Site shell and the page-not-found page

**Files:**
- Create: `src/lib/content.ts`
- Create: `src/components/Logo.astro`, `src/components/Button.astro`, `src/components/Section.astro`, `src/components/TextTrack.astro`, `src/components/Header.astro`, `src/components/Footer.astro`
- Create: `src/scripts/menu.ts`, `src/scripts/motion.ts`, `src/scripts/dates.ts`
- Create: `src/layouts/Base.astro`, `src/pages/404.astro`
- Create: `tests/helpers/site.ts`
- Test: `tests/site/structure.test.ts`, `tests/site/brand.test.ts`, `tests/site/not-found.test.ts`

**Interfaces:**
- Consumes: `navItems`, `isCurrent` (Task 3, `src/lib/nav.ts`); `logoHeight`, `LogoVariant` (`src/lib/logo.ts`); `trackLines`, `TrackLayout` (`src/lib/track.ts`); `headerScrolled`, `trackShift`, `relativeShift` (`src/lib/motion.ts`); `isPast`, `seasonView`, `todayIso`, `pickCurrentSeason`, `SeasonData` (Task 2); the artwork paths from Task 4; the collections from Task 5; the tokens and classes from Task 6.
- Produces:
  - `src/lib/content.ts`: `getCurrentSeason(): Promise<SeasonData | undefined>`, `getSite()`, `getProgramme()`, `getSupport()`, `getEvent()` (each returns the entry's data, and `getEvent` returns `undefined` when there is no file), `getSchool()` (returns the whole entry, because the page renders its Markdown), `isEventEnabled(): Promise<boolean>`
  - `<Base title description? header?>`. `header` is `'solid'` (the default) or `'overlay'`.
  - `<Logo variant? height? alt? loading?>`. It renders `img.brand-logo[data-logo]`. Its size on screen comes from the CSS variable `--logo-h` of the place it sits in.
  - `<Button href variant? external?>`. `variant` is `'primary'` or `'ghost'`.
  - `<Section surface? mesh? id? labelledby? priority? class?>`. `surface` is `'dark'`, `'light'`, `'gradient'` or `'mesh'`. `mesh` is `'pink-orange'` or `'hot'`. Content in the default slot sits inside `.container[data-reveal]`. Content in the slot named `bleed` spans the full width.
  - `<TextTrack text as? layout? id?>`. `as` is `'h1'` or `'h2'`. `layout` is `'banner'` or `'stacked'`. It renders `[data-track]` with the text once in `.sr-only` and the visible rows inside `.track__rows[aria-hidden="true"]`.
  - Hooks the scripts read: `[data-header]`, `[data-nav-toggle]`, `#site-nav`, `[data-track]`, `[data-reveal]`, `[data-dim-past]`, `[data-date]`, `[data-season-status]`, `[data-status]`.
  - Classes the scripts add: `is-scrolled` and `is-open` on the header, `is-open` on the navigation, `reveal-pending` and `is-visible` on revealed blocks, `is-past` on timeline items.
  - `tests/helpers/site.ts`: `ROUTES`, `SITE_URL`, `page(route)`, `pageFile(route)`, `siteCss()`, `cssRules(css)`, `contentJson<T>(path)`, `contentFiles(collection, extension)`, `teamFiles()`, `eventEnabled()`, `clean(text)`, `texts($, selector)`.

This task pins Review Focus 5.

Three things in this code look odd and are deliberate. Do not tidy them away.

- `TextTrack.astro` reads `Astro.props as Props`. Without the cast, `astro check` reports that `Props` is unused in this one file.
- `.track` has `overflow: hidden` and `min-width: 0`. Without them, the long unbroken rows make any grid or flex parent as wide as the text, and the page scrolls sideways.
- The header is in the page flow by default and only becomes fixed under `.js`. That is what makes the site usable with scripts off.

- [ ] **Step 1: Write the test helper**

Create `tests/helpers/site.ts`. `ROUTES` holds one route for now. Each later task adds its own.

```ts
// Reads the built site in dist and the content files it was built from.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load, type CheerioAPI } from 'cheerio';

export const root = process.cwd();
export const dist = join(root, 'dist');
export const SITE_URL = 'https://stemracing-tbs.vercel.app';

/** Every page the site builds, apart from the optional event page. */
export const ROUTES = ['/404'];

export function pageFile(route: string): string {
  if (route === '/') return join(dist, 'index.html');
  if (route === '/404') return join(dist, '404.html');
  return join(dist, route.slice(1), 'index.html');
}

export function page(route: string): CheerioAPI {
  const file = pageFile(route);
  if (!existsSync(file)) {
    throw new Error(`${file} is missing. Run "npm run test:site", which builds the site first.`);
  }
  return load(readFileSync(file, 'utf8'));
}

/** All the CSS the site ships: linked files and style blocks inside pages. */
export function siteCss(): string {
  const assets = join(dist, '_astro');
  const linked = existsSync(assets)
    ? readdirSync(assets)
        .filter((name) => name.endsWith('.css'))
        .map((name) => readFileSync(join(assets, name), 'utf8'))
    : [];
  const inline = ROUTES.flatMap((route) => {
    const $ = page(route);
    return $('style')
      .toArray()
      .map((element) => $(element).text());
  });
  return [...linked, ...inline].join('\n');
}

/** Each CSS rule as a selector and a body. Works on the minified CSS that Astro writes. */
export function cssRules(css: string): { selector: string; body: string }[] {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selector: (match[1] ?? '').replace(/\[data-astro-cid-[^\]]+\]/g, '').trim(),
    body: match[2] ?? '',
  }));
}

export function contentJson<T>(path: string): T {
  return JSON.parse(readFileSync(join(root, 'src/content', path), 'utf8')) as T;
}

export function contentFiles(collection: string, extension: string): string[] {
  return readdirSync(join(root, 'src/content', collection))
    .filter((name) => name.endsWith(extension))
    .sort();
}

export interface TeamFile {
  name: string;
  status: string;
  sample: boolean;
}

/** The settings at the top of each team file. Enough for counting: not a full YAML reader. */
export function teamFiles(): TeamFile[] {
  return contentFiles('teams', '.md').map((file) => {
    const text = readFileSync(join(root, 'src/content/teams', file), 'utf8');
    const settings = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? '';
    const value = (key: string) => new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(settings)?.[1]?.trim() ?? '';
    return { name: value('name'), status: value('status'), sample: value('sample') === 'true' };
  });
}

export function eventEnabled(): boolean {
  return contentJson<{ enabled: boolean }>('event/event.json').enabled;
}

export const clean = (text: string) => text.replace(/\s+/g, ' ').trim();

/** The text of every element that matches, tidied. */
export function texts($: CheerioAPI, selector: string): string[] {
  return $(selector)
    .toArray()
    .map((element) => clean($(element).text()));
}
```

- [ ] **Step 2: Write the three failing tests**

Create `tests/site/structure.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { navItems } from '../../src/lib/nav';
import { clean, contentJson, eventEnabled, page, ROUTES, SITE_URL } from '../helpers/site';

interface Site {
  address: string;
  schoolUrl: string;
  contacts: { name: string; role: string; email?: string }[];
}

const site = contentJson<Site>('site/site.json');
const expectedNav = navItems(eventEnabled());

describe.each(ROUTES)('%s', (route) => {
  const $ = page(route);

  it('is written in British English', () => {
    expect($('html').attr('lang')).toBe('en-GB');
  });

  it('has one h1 with text in it', () => {
    expect($('h1')).toHaveLength(1);
    expect(clean($('h1 .sr-only').text() || $('h1').text())).not.toBe('');
  });

  it('never skips a heading level', () => {
    const levels = $('h1, h2, h3, h4, h5, h6')
      .toArray()
      .map((heading) => Number(heading.tagName.slice(1)));
    expect(levels[0]).toBe(1);
    levels.forEach((level, index) => {
      if (index > 0) expect(level - (levels[index - 1] ?? 0)).toBeLessThanOrEqual(1);
    });
  });

  it('starts with a skip link to the main content', () => {
    const first = $('body').children().first();
    expect(first.is('a.skip-link')).toBe(true);
    expect(first.attr('href')).toBe('#main');
    expect($('main#main')).toHaveLength(1);
  });

  it('lists the pages in the agreed order', () => {
    const links = $('nav[aria-label="Main"] a')
      .toArray()
      .map((link) => ({ href: $(link).attr('href'), label: clean($(link).text()) }));
    expect(links).toEqual(expectedNav);
  });

  it('marks the current page in the navigation', () => {
    const current = $('nav[aria-label="Main"] a[aria-current="page"]')
      .toArray()
      .map((link) => $(link).attr('href'));
    expect(current).toEqual(route === '/' || route === '/404' ? [] : [route]);
  });

  it('gives every image a text alternative and a size', () => {
    for (const image of $('img').toArray()) {
      expect($(image).attr('alt'), $.html(image)).toBeDefined();
      expect(Number($(image).attr('width')), $.html(image)).toBeGreaterThan(0);
      expect(Number($(image).attr('height')), $.html(image)).toBeGreaterThan(0);
    }
  });

  it('gives every link and button a name', () => {
    for (const element of $('a, button').toArray()) {
      const name = clean($(element).text()) || $(element).attr('aria-label') || $(element).find('img').attr('alt');
      expect(name, $.html(element)).toBeTruthy();
    }
  });

  it('protects links that open in a new tab', () => {
    for (const link of $('a[target="_blank"]').toArray()) {
      expect($(link).attr('rel')).toContain('noopener');
      expect(clean($(link).text())).toContain('(opens in a new tab)');
    }
  });

  it('has a title, a description and a canonical address', () => {
    expect(clean($('title').text())).toMatch(/STEM Racing/);
    expect(($('meta[name="description"]').attr('content') ?? '').length).toBeGreaterThan(20);
    const path = route === '/' ? '/' : route;
    expect($('link[rel="canonical"]').attr('href')).toBe(`${SITE_URL}${path}`);
  });

  it('loads the two main fonts early', () => {
    const preloads = $('link[rel="preload"][as="font"]')
      .toArray()
      .map((link) => ({ href: $(link).attr('href'), crossorigin: $(link).attr('crossorigin') !== undefined }));
    expect(preloads).toEqual([
      { href: '/fonts/Magistral-BoldItalic.woff2', crossorigin: true },
      { href: '/fonts/MachoModular-Medium.woff2', crossorigin: true },
    ]);
  });

  it('shows the contacts and the address in the footer', () => {
    const footer = clean($('footer').text());
    expect(footer).toContain(site.address);
    for (const contact of site.contacts) {
      expect(footer).toContain(contact.name);
      expect(footer).toContain(contact.role);
    }
    expect($(`footer a[href="${site.schoolUrl}"]`)).toHaveLength(1);
  });

  it('works before any script runs: nothing is hidden in the markup', () => {
    expect($('[hidden]')).toHaveLength(0);
    expect($('.reveal-pending')).toHaveLength(0);
    expect($('nav[aria-label="Main"]').attr('class')).not.toContain('is-open');
  });
});
```

Create `tests/site/brand.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { clean, cssRules, page, ROUTES, siteCss } from '../helpers/site';

const css = siteCss();
const rules = cssRules(css);

describe('brand rules in the CSS', () => {
  it('never names Verdana', () => {
    expect(css).not.toMatch(/verdana/i);
  });

  it('never justifies or right-aligns text', () => {
    expect(css).not.toMatch(/text-align:\s*(justify|right|end)/);
  });

  it('uses no colour from the Discovery or Primary divisions', () => {
    for (const hex of ['#008a3f', '#95c11f', '#005ca9', '#009fe3']) expect(css.toLowerCase()).not.toContain(hex);
  });

  it('sets the display font in italic, and only on headlines, numerals and buttons', () => {
    const allowed =
      /^(h1,\s*h2|\.track|\.btn|\.step__num|\.stat__value|\.roles__num|\.site-footer__tagline)$/;
    const display = rules.filter((rule) => /font-family:\s*var\(--font-display\)/.test(rule.body));
    expect(display.length).toBeGreaterThan(0);
    for (const rule of display) {
      expect(rule.selector).toMatch(allowed);
      expect(rule.body, rule.selector).toMatch(/font-style:\s*italic/);
    }
  });

  it('fills text with a gradient only on large headings and numerals', () => {
    const clipped = rules.filter((rule) => /background-clip:\s*text/.test(rule.body)).map((rule) => rule.selector);
    expect(clipped).toContain('.on-dark h2');
    for (const selector of clipped) expect(['.on-dark h2', '.step__num']).toContain(selector);
  });

  it('puts no effect on the logo', () => {
    const logo = rules.filter((rule) => rule.selector.includes('.brand-logo'));
    expect(logo.length).toBeGreaterThan(0);
    for (const rule of logo) {
      expect(rule.body).not.toMatch(/transform|filter|box-shadow|text-shadow|outline|border|opacity/);
    }
  });

  it('keeps the logo at or above its smallest size', () => {
    const logo = rules.find((rule) => rule.selector === '.brand-logo');
    expect(logo?.body).toMatch(/height:\s*max\(32px,/);
    expect(logo?.body).toMatch(/width:\s*auto/);
  });
});

describe.each(ROUTES)('brand rules on %s', (route) => {
  const $ = page(route);

  it('shows the official logo, unstretched, at a legal size', () => {
    const logos = $('img[data-logo]').toArray();
    expect(logos.length).toBeGreaterThanOrEqual(2);
    for (const logo of logos) {
      const width = Number($(logo).attr('width'));
      const height = Number($(logo).attr('height'));
      expect(height).toBeGreaterThanOrEqual(32);
      expect(width).toBeGreaterThanOrEqual(70);
      expect(Math.abs(width / height - 1200 / 492)).toBeLessThan(0.03);
      expect($(logo).attr('src')).toMatch(/\/_astro\/tbs-(colour|mono)-(white|black)\./);
      expect($(logo).attr('alt')).toBeTruthy();
    }
  });

  it('uses the full colour white logo on the dark header', () => {
    expect($('header img[data-logo]').attr('data-logo')).toBe('colour-white');
  });

  it('never claims the Formula 1 lockup', () => {
    expect(clean($('body').text())).not.toMatch(/supported by (formula 1|f1)/i);
  });

  it('keeps every text track short, and hides the repeated copies from screen readers', () => {
    const tracks = $('[data-track]').toArray();
    expect(tracks.length).toBeGreaterThan(0);
    for (const track of tracks) {
      const text = clean($(track).find('.sr-only').text());
      expect(text.split(' ').length).toBeLessThanOrEqual(3);
      expect($(track).find('.track__rows').attr('aria-hidden')).toBe('true');
      for (const ghost of $(track).find('.track__ghost').toArray()) {
        expect($(ghost).closest('[aria-hidden="true"]')).toHaveLength(1);
      }
      expect($(track).attr('style')).toMatch(/--track-chars:\s*\d+/);
    }
  });
});
```

Create `tests/site/not-found.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { clean, page } from '../helpers/site';

describe('page not found', () => {
  const $ = page('/404');

  it('offers the way home', () => {
    expect(clean($('h1 .sr-only').text())).toBe('Off Track');
    expect($('main a[href="/"]')).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm run test:site`
Expected: FAIL. The build reports `0 page(s) built`, then the tests stop with `dist/404.html is missing`.

- [ ] **Step 4: Write the content wrappers**

Create `src/lib/content.ts`:

```ts
// Thin wrappers around astro:content. The logic they call lives in the other lib files.
import { getCollection, getEntry } from 'astro:content';
import { pickCurrentSeason, type SeasonData } from './season';

function missing(path: string): Error {
  return new Error(`Missing content file: ${path}`);
}

export async function getCurrentSeason(): Promise<SeasonData | undefined> {
  const seasons = await getCollection('seasons');
  return pickCurrentSeason(seasons.map((entry) => entry.data));
}

export async function getSite() {
  const entry = await getEntry('site', 'site');
  if (!entry) throw missing('src/content/site/site.json');
  return entry.data;
}

export async function getProgramme() {
  const entry = await getEntry('programme', 'programme');
  if (!entry) throw missing('src/content/programme/programme.json');
  return entry.data;
}

export async function getSupport() {
  const entry = await getEntry('support', 'support');
  if (!entry) throw missing('src/content/support/support.json');
  return entry.data;
}

export async function getSchool() {
  const entry = await getEntry('school', 'school');
  if (!entry) throw missing('src/content/school/school.md');
  return entry;
}

export async function getEvent() {
  const entry = await getEntry('event', 'event');
  return entry?.data;
}

export async function isEventEnabled(): Promise<boolean> {
  const event = await getEvent();
  return Boolean(event?.enabled);
}
```

- [ ] **Step 5: Write the logo and the button**

Create `src/components/Logo.astro`:

```astro
---
import { Image } from 'astro:assets';
import colourBlack from '../assets/brand/logo/tbs-colour-black.png';
import colourWhite from '../assets/brand/logo/tbs-colour-white.png';
import monoBlack from '../assets/brand/logo/tbs-mono-black.png';
import monoWhite from '../assets/brand/logo/tbs-mono-white.png';
import { logoHeight, type LogoVariant } from '../lib/logo';

interface Props {
  variant?: LogoVariant;
  /** Largest height the logo is shown at, in pixels. Never below the brand minimum. */
  height?: number;
  alt?: string;
  loading?: 'eager' | 'lazy';
}

const {
  variant = 'colour-white',
  height = 56,
  alt = 'STEM Racing, The British School',
  loading = 'lazy',
} = Astro.props;

const files = {
  'colour-white': colourWhite,
  'colour-black': colourBlack,
  'mono-white': monoWhite,
  'mono-black': monoBlack,
};
---

<Image
  class="brand-logo"
  src={files[variant]}
  alt={alt}
  height={logoHeight(height)}
  densities={[1, 2, 3]}
  loading={loading}
  data-logo={variant}
/>

<style>
  /* Official artwork. Only its size changes: no stretch, rotation, shadow, stroke or recolour. */
  .brand-logo {
    display: block;
    width: auto;
    max-width: none;
    height: max(32px, var(--logo-h, 3.5rem));
  }
</style>
```

Create `src/components/Button.astro`:

```astro
---
interface Props {
  href: string;
  variant?: 'primary' | 'ghost';
  /** Opens in a new tab. Use for links that leave the site. */
  external?: boolean;
}

const { href, variant = 'primary', external = false } = Astro.props;
---

<a
  class:list={['btn', `btn--${variant}`]}
  href={href}
  target={external ? '_blank' : undefined}
  rel={external ? 'noopener noreferrer' : undefined}
>
  <slot />{external && <span class="sr-only"> (opens in a new tab)</span>}
</a>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 3rem;
    padding: 0.75rem 1.5rem;
    border: 2px solid transparent;
    border-radius: 0.25rem;
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 500;
    font-size: 0.9375rem;
    letter-spacing: 0.06em;
    line-height: 1.1;
    text-decoration: none;
    text-transform: uppercase;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease,
      color 0.2s ease;
  }

  .btn--primary {
    background: var(--chicane-violet);
    color: var(--white);
  }

  .btn--primary:hover {
    background: var(--ignite-indigo);
  }

  .btn--ghost {
    border-color: var(--fg-strong, var(--white));
    color: var(--fg-strong, var(--white));
  }

  .btn--ghost:hover {
    background: var(--fg-strong, var(--white));
    color: var(--fg-inverse, var(--carbon-shadow));
  }
</style>
```

- [ ] **Step 6: Write the section and the text track**

Create `src/components/Section.astro`:

```astro
---
import { Image, Picture } from 'astro:assets';
import meshHot from '../assets/brand/gradients/mesh-hot.png';
import meshPinkOrange from '../assets/brand/gradients/mesh-pink-orange.png';
import patternJagged from '../assets/brand/patterns/pattern-jagged.png';

interface Props {
  surface?: 'dark' | 'light' | 'gradient' | 'mesh';
  /** Which mesh gradient a mesh surface shows. */
  mesh?: 'pink-orange' | 'hot';
  id?: string;
  /** Id of the heading that names this section. */
  labelledby?: string;
  /** The background image loads first. Use for the band at the top of a page. */
  priority?: boolean;
  class?: string;
}

const {
  surface = 'dark',
  mesh = 'pink-orange',
  id,
  labelledby,
  priority = false,
  class: className,
} = Astro.props;

const tone = surface === 'light' ? 'on-light' : surface === 'dark' ? 'on-dark' : undefined;
const meshFile = mesh === 'hot' ? meshHot : meshPinkOrange;
---

<section
  class:list={[
    'section',
    `section--${surface}`,
    surface === 'mesh' && `section--mesh-${mesh}`,
    tone,
    className,
  ]}
  id={id}
  aria-labelledby={labelledby}
>
  {
    surface === 'mesh' && (
      <Picture
        src={meshFile}
        formats={['avif', 'webp']}
        fallbackFormat="jpg"
        widths={[640, 960, meshFile.width]}
        sizes="100vw"
        alt=""
        loading={priority ? 'eager' : 'lazy'}
        fetchpriority={priority ? 'high' : 'auto'}
        pictureAttributes={{ class: 'section__bg' }}
      />
    )
  }
  {
    surface === 'gradient' && (
      <div class="section__bg section__bg--pattern">
        <Image src={patternJagged} widths={[640, patternJagged.width]} sizes="100vw" alt="" />
      </div>
    )
  }
  <slot name="bleed" />
  <div class="container" data-reveal>
    <slot />
  </div>
</section>

<style>
  .section {
    position: relative;
    isolation: isolate;
    padding-block: var(--section-y);
    background: var(--bg);
    color: var(--fg);
  }

  .section--dark {
    --bg: var(--carbon-shadow);
    --fg: var(--carbon-100);
    --fg-strong: var(--white);
    --fg-muted: var(--carbon-300);
    --fg-inverse: var(--carbon-shadow);
    --rule: var(--carbon-700);
    --card-bg: var(--gradient-core);
    --card-border: var(--carbon-800);
  }

  .section--light {
    --bg: var(--surface-light);
    --fg: var(--carbon-shadow);
    --fg-strong: var(--carbon-shadow);
    --fg-muted: var(--carbon-500);
    --fg-inverse: var(--white);
    --rule: var(--carbon-100);
    --card-bg: var(--white);
    --card-border: var(--carbon-100);
  }

  .section--gradient {
    --bg: var(--gradient-secondary);
    overflow: clip;
  }

  .section--mesh {
    --bg: var(--chicane-violet);
    --fg: var(--white);
    --fg-strong: var(--white);
    --fg-muted: var(--white);
    --fg-inverse: var(--carbon-shadow);
    overflow: clip;
  }

  /* Only the orange and yellow part of the Hot mesh shows, so dark text stays readable. */
  .section--mesh-hot {
    --bg: var(--burnout-orange);
    --fg: var(--carbon-shadow);
    --fg-strong: var(--carbon-shadow);
    --fg-muted: var(--carbon-shadow);
    --fg-inverse: var(--white);
  }

  .section__bg {
    position: absolute;
    inset: 0;
    z-index: -1;
    overflow: clip;
  }

  .section__bg :global(img) {
    width: 100%;
    max-width: none;
    height: 100%;
    object-fit: cover;
  }

  .section--mesh-hot .section__bg :global(img) {
    height: 220%;
    object-position: center top;
  }
</style>
```

Create `src/components/TextTrack.astro`:

```astro
---
import { trackLines, type TrackLayout } from '../lib/track';

interface Props {
  /** Three words at most. */
  text: string;
  as?: 'h1' | 'h2';
  /** banner: one line with outline rows above and below. stacked: one word per line. */
  layout?: TrackLayout;
  id?: string;
}

const { text, as: Tag = 'h1', layout = 'banner', id } = Astro.props as Props;
const { lines, chars } = trackLines(text, layout);
const trailing = [1, 2, 3];
const ghosts = [1, 2, 3, 4, 5];
---

<Tag class:list={['track', `track--${layout}`]} id={id} style={`--track-chars:${chars}`} data-track>
  <span class="sr-only">{text}</span>
  <span class="track__rows" aria-hidden="true">
    {
      layout === 'banner' && (
        <span class="track__row track__row--ghost" style="--dir:-1">
          {ghosts.map(() => (
            <span class="track__ghost">{lines[0]}</span>
          ))}
        </span>
      )
    }
    {
      lines.map((line, index) => (
        <span class="track__row track__row--main" style={`--dir:${index % 2 === 0 ? 1 : -1}`}>
          <span class="track__anchor">
            <span class="track__ghost track__ghost--lead">{line}</span>
            <span class="track__solid">{line}</span>
          </span>
          {trailing.map(() => (
            <span class="track__ghost">{line}</span>
          ))}
        </span>
      ))
    }
    {
      layout === 'banner' && (
        <span class="track__row track__row--ghost track__row--offset" style="--dir:-1">
          {ghosts.map(() => (
            <span class="track__ghost">{lines[0]}</span>
          ))}
        </span>
      )
    }
  </span>
</Tag>

<style>
  /* 0.64em is a safe average glyph width for Magistral Bold Italic, so the solid line always fits. */
  .track {
    min-width: 0;
    margin: 0;
    overflow: hidden;
    color: var(--white);
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: min(var(--text-track), calc((100vw - 2 * var(--gutter)) / (var(--track-chars) * 0.64)));
    line-height: 1.04;
    letter-spacing: -0.01em;
    overflow-wrap: normal;
  }

  .track__rows {
    display: block;
    padding-block: 0.06em;
  }

  .track__row {
    display: flex;
    align-items: baseline;
    gap: 0.24em;
    white-space: nowrap;
    transform: translate3d(calc(var(--track-shift, 0px) * var(--dir, 1)), 0, 0);
  }

  .track__row--main {
    padding-inline-start: max(var(--gutter), calc((100% - var(--container)) / 2));
  }

  .track__row--ghost {
    margin-inline-start: -1.6em;
  }

  .track__row--offset {
    margin-inline-start: -3.1em;
  }

  .track__anchor {
    position: relative;
    flex: none;
  }

  .track__solid {
    display: block;
  }

  .track__ghost {
    flex: none;
    color: transparent;
    -webkit-text-stroke: 1px var(--white);
  }

  .track__ghost--lead {
    position: absolute;
    inset-block-start: 0;
    inset-inline-end: calc(100% + 0.24em);
  }

  @media (prefers-reduced-motion: reduce) {
    .track__row {
      transform: none;
    }
  }
</style>
```

- [ ] **Step 7: Write the header and the footer**

Create `src/components/Header.astro`:

```astro
---
import Logo from './Logo.astro';
import { isCurrent, navItems } from '../lib/nav';

interface Props {
  /** overlay: sits on top of the hero and turns solid after 80px of scroll. */
  variant?: 'solid' | 'overlay';
  eventEnabled?: boolean;
}

const { variant = 'solid', eventEnabled = false } = Astro.props;
const items = navItems(eventEnabled);
const pathname = Astro.url.pathname;
---

<header class:list={['site-header', `site-header--${variant}`]} data-header>
  <div class="container site-header__inner">
    <a class="site-header__home" href="/">
      <Logo variant="colour-white" height={56} alt="STEM Racing at The British School: home" loading="eager" />
    </a>
    <button
      class="site-header__toggle"
      type="button"
      aria-expanded="false"
      aria-controls="site-nav"
      data-nav-toggle
    >
      <span class="sr-only">Menu</span>
      <span class="site-header__bars" aria-hidden="true"></span>
    </button>
    <nav class="site-nav" id="site-nav" aria-label="Main">
      <ul class="site-nav__list">
        {
          items.map((item) => (
            <li>
              <a
                class="site-nav__link"
                href={item.href}
                aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}
              >
                {item.label}
              </a>
            </li>
          ))
        }
      </ul>
    </nav>
  </div>
</header>

<style>
  /* Without JavaScript the header sits in the page flow with the navigation open.
     The rules that start with .js only apply once scripts are running. */
  .site-header {
    --logo-h: 3.5rem;
    position: relative;
    z-index: 50;
    background: var(--carbon-shadow);
    color: var(--white);
  }

  .site-header--solid {
    position: sticky;
    inset-block-start: 0;
  }

  :global(.js) .site-header--overlay {
    position: fixed;
    inset: 0 0 auto;
    background: transparent;
    transition: background-color 0.25s ease;
  }

  :global(.js) .site-header--overlay.is-scrolled,
  :global(.js) .site-header--overlay.is-open {
    background: var(--carbon-shadow);
  }

  .site-header__inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    column-gap: 1.75rem;
    min-height: var(--header-h);
  }

  /* Clear space: nothing sits closer to the logo than half its height. */
  .site-header__home {
    display: block;
    flex: none;
    margin-inline-end: calc(var(--logo-h) / 2);
    padding-block: 0.75rem;
  }

  .site-header__toggle {
    display: none;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    padding: 0;
    border: 2px solid var(--white);
    border-radius: 0.25rem;
    background: transparent;
    color: var(--white);
    cursor: pointer;
  }

  .site-header__bars,
  .site-header__bars::before,
  .site-header__bars::after {
    display: block;
    width: 1.25rem;
    height: 2px;
    background: currentColor;
  }

  .site-header__bars {
    position: relative;
  }

  .site-header__bars::before,
  .site-header__bars::after {
    content: '';
    position: absolute;
    inset-inline-start: 0;
  }

  .site-header__bars::before {
    inset-block-start: -0.4rem;
  }

  .site-header__bars::after {
    inset-block-start: 0.4rem;
  }

  .site-nav {
    flex: 1 0 100%;
    padding-block-end: 1rem;
  }

  .site-nav__list {
    display: flex;
    flex-wrap: wrap;
    gap: 0 1.5rem;
  }

  .site-nav__link {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    border-block-end: 2px solid transparent;
    color: var(--white);
    font-size: var(--text-small);
    font-weight: 500;
    letter-spacing: 0.12em;
    text-decoration: none;
    text-transform: uppercase;
  }

  .site-nav__link:hover {
    border-block-end-color: var(--white);
  }

  .site-nav__link[aria-current='page'] {
    border-block-end-color: var(--pitlane-pink);
  }

  @media (max-width: 59.99rem) {
    :global(.js) .site-header__toggle {
      display: inline-flex;
    }

    :global(.js) .site-nav {
      display: none;
      max-height: calc(100vh - var(--header-h));
      overflow-y: auto;
    }

    :global(.js) .site-nav.is-open {
      display: block;
    }

    :global(.js) .site-nav__list {
      flex-direction: column;
    }

    :global(.js) .site-nav__link {
      width: 100%;
      min-height: 3rem;
    }
  }

  @media (max-width: 47.99rem) {
    .site-header {
      --logo-h: 2.75rem;
    }
  }

  @media (min-width: 60rem) {
    .site-nav {
      flex: 0 1 auto;
      padding-block-end: 0;
    }

    .site-nav__list {
      flex-wrap: nowrap;
      gap: 1.75rem;
    }
  }
</style>
```

Create `src/components/Footer.astro`:

```astro
---
import Logo from './Logo.astro';
import { getSite } from '../lib/content';
import { navItems } from '../lib/nav';

interface Props {
  eventEnabled?: boolean;
}

const { eventEnabled = false } = Astro.props;
const site = await getSite();
const items = [{ href: '/', label: 'Home' }, ...navItems(eventEnabled)];
const year = new Date().getFullYear();
---

<footer class="site-footer">
  <div class="site-footer__rule" aria-hidden="true"></div>
  <div class="container site-footer__grid">
    <div class="site-footer__brand">
      <a class="site-footer__home" href="/">
        <Logo variant="colour-white" height={64} alt="STEM Racing at The British School: home" />
      </a>
      <p class="site-footer__tagline">Accelerating Futures</p>
      <p>{site.address}</p>
      <p><a href={site.schoolUrl}>The British School website</a></p>
    </div>
    <nav aria-label="Footer">
      <p class="eyebrow">Explore</p>
      <ul class="site-footer__list">
        {
          items.map((item) => (
            <li>
              <a href={item.href}>{item.label}</a>
            </li>
          ))
        }
      </ul>
    </nav>
    <div>
      <p class="eyebrow">Contacts</p>
      <ul class="site-footer__list">
        {
          site.contacts.map((contact) => (
            <li>
              <span class="site-footer__name">{contact.name}</span>
              <span class="muted">{contact.role}</span>
              {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
            </li>
          ))
        }
      </ul>
    </div>
  </div>
  <div class="container site-footer__base">
    <p class="eyebrow">&copy; {year} The British School, New Delhi</p>
  </div>
</footer>

<style>
  .site-footer {
    --logo-h: 4rem;
    --fg-muted: var(--carbon-300);
    background: var(--carbon-shadow);
    color: var(--carbon-100);
  }

  .site-footer__rule {
    height: 4px;
    background: var(--gradient-secondary);
  }

  .site-footer__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
    gap: 2.5rem;
    padding-block: clamp(3rem, 2rem + 4vw, 5rem) 2.5rem;
  }

  .site-footer__brand {
    display: grid;
    align-content: start;
    gap: 0.75rem;
  }

  /* Clear space: half the logo height on every side. */
  .site-footer__home {
    display: block;
    width: fit-content;
    margin-block-end: calc(var(--logo-h) / 2);
  }

  .site-footer__tagline {
    color: var(--white);
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: 1.5rem;
    line-height: 1.1;
  }

  .site-footer__list {
    display: grid;
    gap: 0.75rem;
    margin-block-start: 1rem;
  }

  .site-footer__list li {
    display: grid;
    gap: 0.1rem;
  }

  .site-footer__name {
    color: var(--white);
    font-weight: 700;
  }

  .site-footer__base {
    padding-block: 1.5rem 2.5rem;
    border-block-start: 1px solid var(--carbon-700);
  }
</style>
```

- [ ] **Step 8: Write the three browser scripts**

Create `src/scripts/menu.ts`:

```ts
// Small screens: the navigation folds behind the Menu button.
const header = document.querySelector<HTMLElement>('[data-header]');
const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
const nav = document.getElementById('site-nav');

if (header && toggle && nav) {
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    header.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  window.matchMedia('(min-width: 60rem)').addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}
```

Create `src/scripts/motion.ts`:

```ts
// Header state, text track drift and section reveal. All of it is an extra:
// the page is complete without this file.
import { headerScrolled, relativeShift, trackShift } from '../lib/motion';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector<HTMLElement>('[data-header]');
const tracks = Array.from(document.querySelectorAll<HTMLElement>('[data-track]'));
const bases = new Map<HTMLElement, number>();

let queued = false;

function update(): void {
  queued = false;
  header?.classList.toggle('is-scrolled', headerScrolled(window.scrollY));
  for (const track of tracks) {
    if (reduced.matches) {
      track.style.removeProperty('--track-shift');
      continue;
    }
    const box = track.getBoundingClientRect();
    const inView = box.bottom >= 0 && box.top <= window.innerHeight;
    const raw = trackShift(box.top, box.height, window.innerHeight);
    if (!bases.has(track)) bases.set(track, inView ? raw : 0);
    if (!inView) continue;
    const shift = relativeShift(raw, bases.get(track) ?? 0);
    track.style.setProperty('--track-shift', `${shift.toFixed(1)}px`);
  }
}

function queue(): void {
  if (queued) return;
  queued = true;
  window.requestAnimationFrame(update);
}

window.addEventListener('scroll', queue, { passive: true });
window.addEventListener('resize', queue, { passive: true });
reduced.addEventListener('change', queue);
update();

// Fonts change the height of a headline. Measure the starting point again once they are in.
void document.fonts.ready.then(() => {
  bases.clear();
  queue();
});

// Sections that start below the fold fade up once. Sections already on screen are left alone,
// so nothing flickers.
if (!reduced.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );

  for (const element of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
    if (element.getBoundingClientRect().top < window.innerHeight) continue;
    element.classList.add('reveal-pending');
    observer.observe(element);
  }
}
```

Create `src/scripts/dates.ts`:

```ts
// The site is built once and read for weeks. This keeps "Next up" and the dimmed
// past items correct for the day the page is opened.
import { isPast, seasonView, todayIso, type SeasonData } from '../lib/season';

const today = todayIso();

for (const list of document.querySelectorAll<HTMLElement>('[data-dim-past]')) {
  for (const item of list.querySelectorAll<HTMLElement>('[data-date]')) {
    item.classList.toggle('is-past', isPast(item.dataset.date, today));
  }
}

for (const panel of document.querySelectorAll<HTMLElement>('[data-season-status]')) {
  const raw = panel.dataset.season;
  if (!raw) continue;

  let season: SeasonData;
  try {
    season = JSON.parse(raw) as SeasonData;
  } catch {
    continue;
  }

  const view = seasonView(season, today);
  const write = (key: string, value: string) => {
    const element = panel.querySelector<HTMLElement>(`[data-status="${key}"]`);
    if (element) element.textContent = value;
  };
  write('registration', view.registration);
  write('next-label', view.nextLabel);
  write('next-title', view.nextTitle);
  write('next-date', view.nextDate);
}
```

- [ ] **Step 9: Write the layout**

Create `src/layouts/Base.astro`:

```astro
---
import '../styles/tokens.css';
import '../styles/fonts.css';
import '../styles/global.css';
import Footer from '../components/Footer.astro';
import Header from '../components/Header.astro';
import { isEventEnabled } from '../lib/content';

interface Props {
  title: string;
  description?: string;
  /** overlay is for pages that open with a full-height hero. */
  header?: 'solid' | 'overlay';
}

const SITE_NAME = 'STEM Racing at The British School, New Delhi';
const {
  title,
  description = 'STEM Racing at The British School, New Delhi. Students design, build and race a miniature car, and run their team like a business.',
  header = 'solid',
} = Astro.props;

const fullTitle = title === SITE_NAME ? SITE_NAME : `${title} | STEM Racing TBS`;
// Pages are served without a trailing slash, so the canonical address has none either.
const path = Astro.url.pathname.replace(/\/+$/, '') || '/';
const canonical = new URL(path, Astro.site).href;
const eventEnabled = await isEventEnabled();
---

<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <meta name="theme-color" content="#05000B" />
    <link rel="canonical" href={canonical} />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="preload" as="font" type="font/woff2" href="/fonts/Magistral-BoldItalic.woff2" crossorigin />
    <link rel="preload" as="font" type="font/woff2" href="/fonts/MachoModular-Medium.woff2" crossorigin />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content={SITE_NAME} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <script is:inline>
      document.documentElement.classList.add('js');
    </script>
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <Header variant={header} eventEnabled={eventEnabled} />
    <main id="main" tabindex="-1">
      <slot />
    </main>
    <Footer eventEnabled={eventEnabled} />
    <script>
      import '../scripts/menu.ts';
      import '../scripts/motion.ts';
      import '../scripts/dates.ts';
    </script>
  </body>
</html>
```

- [ ] **Step 10: Write the page-not-found page**

Create `src/pages/404.astro`:

```astro
---
import Button from '../components/Button.astro';
import Section from '../components/Section.astro';
import TextTrack from '../components/TextTrack.astro';
import Base from '../layouts/Base.astro';
---

<Base title="Page not found" description="This page does not exist.">
  <Section surface="mesh" priority class="page-head">
    <TextTrack slot="bleed" text="Off Track" />
  </Section>

  <Section surface="dark">
    <div class="stack">
      <p class="lead">That page is not on the circuit. Head back to the start, or use the menu.</p>
      <div class="actions">
        <Button href="/">Back to the start</Button>
      </div>
    </div>
  </Section>
</Base>
```

- [ ] **Step 11: Type-check**

Run: `npm run check`
Expected: `0 errors`, `0 warnings`, `0 hints`.

- [ ] **Step 12: Run the tests to verify they pass**

Run: `npm run test:site`
Expected: the build reports `1 page(s) built`, then PASS, 25 tests in 3 files.

- [ ] **Step 13: Look at the page**

Start the dev server with `preview_start` and the name `astro-dev`. Open `http://localhost:4321/404`. Set the width to 1440 and take a screenshot.

Expected: a black header with the STEM Racing and The British School logo on the left and six links on the right. Below it, an orange and pink band with "Off Track" in solid white and the same words in white outline beside, above and below it. Below that, one sentence and a violet button on black. Then the footer.

If the band shows no text, or the page scrolls sideways, stop and compare `TextTrack.astro` with Step 6.

- [ ] **Step 14: Commit**

```bash
git add src/lib/content.ts src/components src/scripts src/layouts src/pages tests/helpers/site.ts tests/site
git commit -m "feat: add the site shell and the page-not-found page" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Programme page

**Files:**
- Create: `src/components/StepCard.astro`, `src/pages/programme.astro`
- Modify: `tests/helpers/site.ts` (the `ROUTES` line)
- Test: `tests/site/programme.test.ts`

**Interfaces:**
- Consumes: `Base`, `Section`, `TextTrack`, `Button` and `getProgramme()` (Task 7); the classes `.stack`, `.grid`, `.card`, `.lead`, `.actions` (Task 6).
- Produces: `<StepCard number title body?>`. It renders `li.step.card` with `.step__num` (two digits, hidden from screen readers) and an `h3`. Its parent must be an `ol`.

- [ ] **Step 1: Add the route to the tests**

In `tests/helpers/site.ts`, replace the `ROUTES` line with:

```ts
export const ROUTES = ['/programme', '/404'];
```

- [ ] **Step 2: Write the failing test**

Create `tests/site/programme.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contentJson, page, texts } from '../helpers/site';

interface Point {
  title: string;
  body: string;
}

describe('programme', () => {
  const $ = page('/programme');
  const programme = contentJson<{ steps: Point[]; roles: Point[]; judging: Point[] }>('programme/programme.json');

  it('numbers the 12 steps in order', () => {
    expect(texts($, '.step__num')).toEqual(
      ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
    );
    expect(texts($, '.step h3')).toEqual(programme.steps.map((step) => step.title));
  });

  it('hides the numerals from screen readers, because the list already counts', () => {
    expect($('ol .step')).toHaveLength(12);
    expect($('.step__num[aria-hidden="true"]')).toHaveLength(12);
  });

  it('shows the roles and the judged areas', () => {
    const headings = texts($, 'main h3');
    for (const item of [...programme.roles, ...programme.judging]) expect(headings).toContain(item.title);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm run test:site`
Expected: FAIL with `dist/programme/index.html is missing`.

- [ ] **Step 4: Write the step card**

Create `src/components/StepCard.astro`:

```astro
---
interface Props {
  number: number;
  title: string;
  body?: string;
}

const { number, title, body } = Astro.props;
const label = String(number).padStart(2, '0');
---

<li class="step card">
  <span class="step__num" aria-hidden="true">{label}</span>
  <h3 class="step__title">{title}</h3>
  {body && <p>{body}</p>}
</li>

<style>
  .step {
    display: grid;
    align-content: start;
    gap: 0.5rem;
  }

  .step__num {
    width: fit-content;
    background: var(--gradient-heading);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: 2.5rem;
    line-height: 1;
  }

  @media (forced-colors: active) {
    .step__num {
      background: none;
      color: CanvasText;
    }
  }
</style>
```

- [ ] **Step 5: Write the page**

Create `src/pages/programme.astro`:

```astro
---
import Button from '../components/Button.astro';
import Section from '../components/Section.astro';
import StepCard from '../components/StepCard.astro';
import TextTrack from '../components/TextTrack.astro';
import Base from '../layouts/Base.astro';
import { getProgramme } from '../lib/content';

const programme = await getProgramme();
---

<Base
  title="Programme"
  description="How STEM Racing works at The British School, New Delhi: the 12 steps, the team roles and what judges score."
>
  <Section surface="mesh" priority class="page-head">
    <TextTrack slot="bleed" text="Our Strategy" />
  </Section>

  <Section surface="dark" labelledby="steps-title">
    <div class="stack stack--loose">
      <div class="stack">
        <h2 id="steps-title">12 steps to success</h2>
        <p class="lead">Twelve steps take a team from an idea to the start line.</p>
      </div>
      <ol class="grid grid--4">
        {
          programme.steps.map((step, index) => (
            <StepCard number={index + 1} title={step.title} body={step.body} />
          ))
        }
      </ol>
    </div>
  </Section>

  <Section surface="light" labelledby="roles-title">
    <div class="stack stack--loose">
      <div class="stack">
        <h2 id="roles-title">How a team works</h2>
        <p class="lead">
          The work splits into three areas. Every member is expected to contribute to more than one.
        </p>
      </div>
      <ul class="grid grid--3">
        {
          programme.roles.map((role) => (
            <li class="card stack">
              <h3>{role.title}</h3>
              <p>{role.body}</p>
            </li>
          ))
        }
      </ul>
    </div>
  </Section>

  <Section surface="dark" labelledby="judging-title">
    <div class="stack stack--loose">
      <div class="stack">
        <h2 id="judging-title">What judges score</h2>
        <p class="lead">
          Teams are judged on the whole season, not only on the race. The STEM Racing Competition Regulations set
          the marks for each area.
        </p>
      </div>
      <ul class="grid grid--3">
        {
          programme.judging.map((area) => (
            <li class="card stack">
              <h3>{area.title}</h3>
              <p>{area.body}</p>
            </li>
          ))
        }
      </ul>
      <div class="actions">
        <Button href="/resources">Regulations and resources</Button>
      </div>
    </div>
  </Section>
</Base>
```

- [ ] **Step 6: Type-check and run the tests**

Run: `npm run check`
Expected: `0 errors`, `0 warnings`, `0 hints`.

Run: `npm run test:site`
Expected: `2 page(s) built`, then PASS, 45 tests in 4 files.

- [ ] **Step 7: Commit**

```bash
git add src/components/StepCard.astro src/pages/programme.astro tests
git commit -m "feat: add the programme page" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Our School page

**Files:**
- Create: `src/components/Timeline.astro`, `src/pages/school.astro`
- Modify: `tests/helpers/site.ts` (the `ROUTES` line)
- Test: `tests/site/school.test.ts`

**Interfaces:**
- Consumes: `Base`, `Section`, `TextTrack`, `getSchool()` (Task 7); `isPast` (Task 2); the `heritage` collection (Task 5).
- Produces:
  - `interface TimelineEntry { label: string; title: string; description?: string | undefined; date?: string | undefined }`, exported from `Timeline.astro`
  - `<Timeline items dimPast? today?>`. It renders `ol.timeline`. With `dimPast` it adds `data-dim-past="true"`, and an item whose date is before `today` gets the class `is-past`. Each item with a date carries it in `data-date` and in `time[datetime]`.

- [ ] **Step 1: Add the route to the tests**

In `tests/helpers/site.ts`, replace the `ROUTES` line with:

```ts
export const ROUTES = ['/school', '/programme', '/404'];
```

- [ ] **Step 2: Write the failing test**

Create `tests/site/school.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contentFiles, contentJson, page, texts } from '../helpers/site';

describe('our school', () => {
  const $ = page('/school');
  const heritage = contentFiles('heritage', '.json').map((file) =>
    contentJson<{ year: string; team: string; note?: string }>(`heritage/${file}`),
  );

  it('has one timeline entry for each heritage file, oldest first', () => {
    const expected = [...heritage].sort((a, b) => a.year.localeCompare(b.year) || a.team.localeCompare(b.team));
    expect(texts($, '.timeline h3')).toEqual(expected.map((entry) => entry.team));
    expect(texts($, '.timeline__label')).toEqual(expected.map((entry) => entry.year));
  });

  it('shows the school copy', () => {
    expect(texts($, '.prose h2')).toEqual(['About the school', 'Why we run STEM Racing']);
  });

  it('does not dim heritage entries', () => {
    expect($('.timeline[data-dim-past]')).toHaveLength(0);
    expect($('.timeline .is-past')).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm run test:site`
Expected: FAIL with `dist/school/index.html is missing`.

- [ ] **Step 4: Write the timeline**

Create `src/components/Timeline.astro`:

```astro
---
import { isPast } from '../lib/season';

export interface TimelineEntry {
  /** Text shown beside the item: a formatted date, a year, or "Date to be confirmed". */
  label: string;
  title: string;
  description?: string | undefined;
  /** YYYY-MM-DD, when the item has a confirmed date. */
  date?: string | undefined;
}

interface Props {
  items: TimelineEntry[];
  /** Dims items whose date has passed. */
  dimPast?: boolean;
  /** Today as YYYY-MM-DD. Needed when dimPast is on. */
  today?: string;
}

const { items, dimPast = false, today = '' } = Astro.props;
---

<ol class="timeline" data-dim-past={dimPast ? 'true' : undefined}>
  {
    items.map((item) => (
      <li
        class:list={['timeline__item', { 'is-past': dimPast && isPast(item.date, today) }]}
        data-date={item.date}
      >
        {item.date ? (
          <time class="timeline__label" datetime={item.date}>
            {item.label}
          </time>
        ) : (
          <span class="timeline__label">{item.label}</span>
        )}
        <div class="timeline__body">
          <h3>{item.title}</h3>
          {item.description && <p>{item.description}</p>}
        </div>
      </li>
    ))
  }
</ol>

<style>
  .timeline__item {
    position: relative;
    display: grid;
    gap: 0.25rem 2rem;
    padding: 0 0 2rem 1.75rem;
    border-inline-start: 2px solid var(--rule);
  }

  .timeline__item:last-child {
    padding-block-end: 0;
  }

  .timeline__item::before {
    content: '';
    position: absolute;
    inset-block-start: 0.35rem;
    inset-inline-start: -0.4375rem;
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    background: var(--pitlane-pink);
  }

  .timeline__label {
    color: var(--fg-strong);
    font-size: var(--text-small);
    font-weight: 700;
    letter-spacing: 0.12em;
    line-height: 1.6;
    text-transform: uppercase;
  }

  .timeline__body {
    display: grid;
    gap: 0.25rem;
  }

  /* Past items use the muted text colour, which still passes 4.5:1. Opacity is not used. */
  .timeline__item.is-past,
  .timeline__item.is-past .timeline__label,
  .timeline__item.is-past :global(h3) {
    color: var(--fg-muted);
  }

  .timeline__item.is-past::before {
    background: var(--carbon-500);
  }

  @media (min-width: 48rem) {
    .timeline__item {
      grid-template-columns: 13rem 1fr;
    }
  }
</style>
```

- [ ] **Step 5: Write the page**

Create `src/pages/school.astro`:

```astro
---
import { getCollection, render } from 'astro:content';
import Section from '../components/Section.astro';
import TextTrack from '../components/TextTrack.astro';
import Timeline from '../components/Timeline.astro';
import Base from '../layouts/Base.astro';
import { getSchool } from '../lib/content';

const school = await getSchool();
const { Content } = await render(school);
const heritage = (await getCollection('heritage')).sort(
  (a, b) => a.data.year.localeCompare(b.data.year) || a.data.team.localeCompare(b.data.team),
);
const items = heritage.map((entry) => ({
  label: entry.data.year,
  title: entry.data.team,
  description: entry.data.note,
}));
---

<Base title="Our School" description={school.data.lead}>
  <Section surface="mesh" priority class="page-head">
    <TextTrack slot="bleed" text="Our School" />
  </Section>

  <Section surface="dark">
    <div class="stack stack--loose">
      <p class="eyebrow">{school.data.title}</p>
      <p class="lead">{school.data.lead}</p>
      <div class="prose">
        <Content />
      </div>
    </div>
  </Section>

  <Section surface="light" labelledby="heritage-title">
    <div class="stack stack--loose">
      <div class="stack">
        <h2 id="heritage-title">TBS on the world stage</h2>
        <p class="lead">
          TBS teams have represented India at the STEM Racing World Finals {heritage.length} times.
        </p>
      </div>
      <Timeline items={items} />
    </div>
  </Section>
</Base>
```

- [ ] **Step 6: Type-check and run the tests**

Run: `npm run check`
Expected: `0 errors`, `0 warnings`, `0 hints`.

Run: `npm run test:site`
Expected: `3 page(s) built`, then PASS, 65 tests in 5 files.

- [ ] **Step 7: Commit**

```bash
git add src/components/Timeline.astro src/pages/school.astro tests
git commit -m "feat: add the Our School page with the heritage timeline" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Teams page

**Files:**
- Create: `src/components/TeamCard.astro`, `src/pages/teams.astro`
- Modify: `tests/helpers/site.ts` (the `ROUTES` line)
- Test: `tests/site/teams.test.ts`

**Interfaces:**
- Consumes: `Base`, `Section`, `TextTrack`, `getCurrentSeason()` (Task 7); `parseMember` and `groupResultsBySeason` (Task 3); `seasonHeading` (Task 2); `src/assets/brand/signifier/signifier-colour.png` (Task 4); the `teams`, `results` and `heritage` collections (Task 5).
- Produces: `<TeamCard team>`, where `team` is a `CollectionEntry<'teams'>`. It renders `article.team.card` with an `h3`, the tags, and the members. A team with `sample: true` shows `.tag--sample`. A team with no image shows the signifier.

This task pins Review Focus 2.

- [ ] **Step 1: Add the route to the tests**

In `tests/helpers/site.ts`, replace the `ROUTES` line with:

```ts
export const ROUTES = ['/school', '/programme', '/teams', '/404'];
```

- [ ] **Step 2: Write the failing test**

Create `tests/site/teams.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contentFiles, page, teamFiles, texts } from '../helpers/site';

const teams = teamFiles();

describe('teams', () => {
  const $ = page('/teams');
  const results = contentFiles('results', '.json');

  it('shows every team once', () => {
    expect(texts($, '.team h3').sort()).toEqual(teams.map((team) => team.name).sort());
  });

  it('labels sample entries, so nobody takes them for real teams', () => {
    expect($('.team .tag--sample')).toHaveLength(teams.filter((team) => team.sample).length);
  });

  it('shows the brand mark when a team has no image', () => {
    for (const card of $('.team').toArray()) {
      expect($(card).find('.team__media img')).toHaveLength(1);
    }
  });

  it('lists every result', () => {
    expect($('.table tbody tr')).toHaveLength(results.length);
  });

  it('lets keyboard users scroll a wide table', () => {
    for (const wrap of $('.table-wrap').toArray()) {
      expect($(wrap).attr('tabindex')).toBe('0');
      expect($(wrap).attr('role')).toBe('region');
      expect($(wrap).attr('aria-label')).toBeTruthy();
    }
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm run test:site`
Expected: FAIL with `dist/teams/index.html is missing`.

- [ ] **Step 4: Write the team card**

Create `src/components/TeamCard.astro`:

```astro
---
import { Image } from 'astro:assets';
import { render, type CollectionEntry } from 'astro:content';
import signifier from '../assets/brand/signifier/signifier-colour.png';
import { parseMember } from '../lib/teams';

interface Props {
  team: CollectionEntry<'teams'>;
}

const { team } = Astro.props;
const { name, carName, season, category, members, heroImage, sample } = team.data;
const { Content } = await render(team);
const people = members.map(parseMember);
---

<article class="team card">
  <div class="team__media">
    {
      heroImage ? (
        <Image
          src={heroImage}
          alt={carName ? `${carName}, the ${name} car` : `The ${name} car`}
          widths={[400, 800]}
          sizes="(min-width: 60rem) 24rem, 100vw"
        />
      ) : (
        <div class="team__tile">
          <Image src={signifier} alt="" height={96} densities={[1, 2]} />
        </div>
      )
    }
  </div>
  <div class="team__body">
    <p class="team__tags">
      <span class="tag">{category}</span>
      <span class="tag">{season}</span>
      {sample && <span class="tag tag--sample">Sample entry</span>}
    </p>
    <h3>{name}</h3>
    {carName && <p class="muted">Car: {carName}</p>}
    <div class="team__about">
      <Content />
    </div>
    <ul class="team__members">
      {
        people.map((person) => (
          <li>
            <span class="team__person">{person.name}</span>
            {person.role && <span class="muted">{person.role}</span>}
          </li>
        ))
      }
    </ul>
  </div>
</article>

<style>
  .team {
    display: grid;
    align-content: start;
    gap: 1.25rem;
    padding: 0;
    overflow: clip;
  }

  .team__media {
    aspect-ratio: 16 / 9;
    background: var(--carbon-shadow);
  }

  .team__media :global(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .team__tile {
    display: grid;
    place-items: center;
    height: 100%;
  }

  .team__tile :global(img) {
    width: auto;
    height: 6rem;
    object-fit: contain;
  }

  .team__body {
    display: grid;
    gap: 0.6rem;
    padding: 0 clamp(1.25rem, 1rem + 1vw, 2rem) clamp(1.25rem, 1rem + 1vw, 2rem);
  }

  .team__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    color: var(--fg-muted);
  }

  .team__members {
    display: grid;
    gap: 0.4rem;
    margin-block-start: 0.5rem;
    padding-block-start: 1rem;
    border-block-start: 1px solid var(--rule);
  }

  .team__members li {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0 1rem;
  }

  .team__person {
    color: var(--fg-strong);
    font-weight: 700;
    overflow-wrap: anywhere;
  }
</style>
```

- [ ] **Step 5: Write the page**

Create `src/pages/teams.astro`. The `{' '}` before the link keeps a space between the sentence and the link.

```astro
---
import { getCollection } from 'astro:content';
import Section from '../components/Section.astro';
import TeamCard from '../components/TeamCard.astro';
import TextTrack from '../components/TextTrack.astro';
import Base from '../layouts/Base.astro';
import { getCurrentSeason } from '../lib/content';
import { groupResultsBySeason } from '../lib/results';
import { seasonHeading } from '../lib/season';

const teams = (await getCollection('teams')).sort(
  (a, b) => b.data.season.localeCompare(a.data.season) || a.data.name.localeCompare(b.data.name),
);
const active = teams.filter((team) => team.data.status === 'active');
const archived = teams.filter((team) => team.data.status === 'archived');
const heritageCount = (await getCollection('heritage')).length;
const results = groupResultsBySeason((await getCollection('results')).map((entry) => entry.data));
const season = await getCurrentSeason();
---

<Base
  title="Teams"
  description="Current and past STEM Racing teams at The British School, New Delhi, with their results."
>
  <Section surface="mesh" priority class="page-head">
    <TextTrack slot="bleed" text="Our Teams" />
  </Section>

  <Section surface="dark" labelledby="active-title">
    <div class="stack stack--loose">
      <div class="stack">
        <h2 id="active-title">This season</h2>
        {season && <p class="eyebrow">{seasonHeading(season)}</p>}
      </div>
      {
        active.length > 0 ? (
          <div class="grid grid--3">
            {active.map((team) => (
              <TeamCard team={team} />
            ))}
          </div>
        ) : (
          <p class="lead">Teams for this season will be announced here.</p>
        )
      }
    </div>
  </Section>

  <Section surface="dark" labelledby="fame-title">
    <div class="stack stack--loose">
      <h2 id="fame-title">Hall of fame</h2>
      {
        archived.length > 0 ? (
          <div class="grid grid--3">
            {archived.map((team) => (
              <TeamCard team={team} />
            ))}
          </div>
        ) : (
          <p class="lead">
            TBS teams have represented India at the World Finals {heritageCount} times.{' '}
            <a href="/school#heritage-title">See the full roll on Our School</a>.
          </p>
        )
      }
    </div>
  </Section>

  <Section surface="light" labelledby="results-title">
    <div class="stack stack--loose">
      <h2 id="results-title">Results</h2>
      {results.length === 0 && <p class="lead">Results appear here after each competition.</p>}
      {
        results.map((group) => (
          <div class="stack">
            <h3>{group.season}</h3>
            <div class="table-wrap" role="region" aria-label={`Results for ${group.season}`} tabindex="0">
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col">Event</th>
                    <th scope="col">Team</th>
                    <th scope="col">Placing</th>
                    <th scope="col">Awards</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => (
                    <tr>
                      <td>{row.event}</td>
                      <td>{row.team}</td>
                      <td>{row.placing}</td>
                      <td>{row.awards.length > 0 ? row.awards.join(', ') : 'None recorded'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      }
    </div>
  </Section>
</Base>
```

- [ ] **Step 6: Type-check and run the tests**

Run: `npm run check`
Expected: `0 errors`, `0 warnings`, `0 hints`.

Run: `npm run test:site`
Expected: `4 page(s) built`, then PASS, 87 tests in 6 files.

- [ ] **Step 7: Commit**

```bash
git add src/components/TeamCard.astro src/pages/teams.astro tests
git commit -m "feat: add the teams page with results" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: Season page

**Files:**
- Create: `src/components/SeasonStatus.astro`, `src/pages/season.astro`
- Modify: `tests/helpers/site.ts` (the `ROUTES` line)
- Test: `tests/site/season.test.ts`

**Interfaces:**
- Consumes: `Base`, `Section`, `TextTrack`, `Button`, `getCurrentSeason()` (Task 7); `StepCard` (Task 8); `Timeline` (Task 9); `seasonView`, `todayIso`, `formatDate`, `sortTimeline`, `SeasonData` (Task 2); `src/scripts/dates.ts` (Task 7), which reads the hooks this task renders.
- Produces: `<SeasonStatus season>`, where `season` is `SeasonData | undefined`. It renders `[data-season-status]` with the season as JSON in `data-season`, and one element for each of `data-status="registration"`, `"next-label"`, `"next-title"` and `"next-date"`.

This task pins Review Focus 1. The build writes the dates as they stand on the day of the build. `dates.ts` works them out again in the browser from `data-season` and `data-date`.

- [ ] **Step 1: Add the route to the tests**

In `tests/helpers/site.ts`, replace the `ROUTES` line with:

```ts
export const ROUTES = ['/school', '/programme', '/teams', '/season', '/404'];
```

- [ ] **Step 2: Write the failing test**

Create `tests/site/season.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { formatDate, sortTimeline, type SeasonData } from '../../src/lib/season';
import { contentFiles, contentJson, page, texts } from '../helpers/site';

const season = contentJson<SeasonData>(`seasons/${contentFiles('seasons', '.json').at(-1)}`);

describe('season', () => {
  const $ = page('/season');
  const sorted = sortTimeline(season.timeline);

  it('lists the timeline in order', () => {
    expect(texts($, '.timeline h3')).toEqual(sorted.map((item) => item.title));
  });

  it('writes confirmed dates in full and marks the rest as unconfirmed', () => {
    expect(texts($, '.timeline__label')).toEqual(
      sorted.map((item) => (item.date ? formatDate(item.date) : 'Date to be confirmed')),
    );
    expect($('.timeline time[datetime]')).toHaveLength(sorted.filter((item) => item.date).length);
  });

  it('carries each date, so the browser can dim what has passed', () => {
    expect($('.timeline[data-dim-past="true"]')).toHaveLength(1);
    expect($('.timeline [data-date]')).toHaveLength(sorted.filter((item) => item.date).length);
  });

  it('only offers Register when registration is open and has a link', () => {
    const expected = season.registrationOpen && season.registrationUrl ? 1 : 0;
    expect($('[data-season-status] a')).toHaveLength(expected);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm run test:site`
Expected: FAIL with `dist/season/index.html is missing`.

- [ ] **Step 4: Write the status panel**

Create `src/components/SeasonStatus.astro`:

```astro
---
import Button from './Button.astro';
import { seasonView, todayIso, type SeasonData } from '../lib/season';

interface Props {
  season: SeasonData | undefined;
}

const { season } = Astro.props;
const view = seasonView(season, todayIso());
---

<div class="status card" data-season-status data-season={season ? JSON.stringify(season) : undefined}>
  <div class="status__block">
    <p class="eyebrow">Season</p>
    <p class="status__strong">{view.heading}</p>
    <p data-status="registration">{view.registration}</p>
    {
      view.canRegister && season?.registrationUrl && (
        <p class="status__action">
          <Button href={season.registrationUrl} external={season.registrationUrl.startsWith('https://')}>
            Register
          </Button>
        </p>
      )
    }
  </div>
  <div class="status__block">
    <p class="eyebrow" data-status="next-label">{view.nextLabel}</p>
    <p class="status__strong" data-status="next-title">{view.nextTitle}</p>
    <p data-status="next-date">{view.nextDate}</p>
  </div>
</div>

<style>
  .status {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
    gap: 2rem;
  }

  .status__block {
    display: grid;
    align-content: start;
    gap: 0.35rem;
  }

  .status__strong {
    color: var(--fg-strong);
    font-size: var(--text-h3);
    font-weight: 700;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .status__action {
    margin-block-start: 0.75rem;
  }
</style>
```

- [ ] **Step 5: Write the page**

Create `src/pages/season.astro`:

```astro
---
import Section from '../components/Section.astro';
import SeasonStatus from '../components/SeasonStatus.astro';
import StepCard from '../components/StepCard.astro';
import TextTrack from '../components/TextTrack.astro';
import Timeline from '../components/Timeline.astro';
import Base from '../layouts/Base.astro';
import { getCurrentSeason } from '../lib/content';
import { formatDate, sortTimeline, todayIso } from '../lib/season';

const season = await getCurrentSeason();
const today = todayIso();
const items = sortTimeline(season?.timeline ?? []).map((item) => ({
  label: item.date ? formatDate(item.date) : 'Date to be confirmed',
  title: item.title,
  description: item.description,
  date: item.date,
}));

const selection = [
  {
    title: 'Form a team',
    body: 'Find people who cover engineering, enterprise and project management between them.',
  },
  {
    title: 'Submit a proposal booklet',
    body: 'Every booklet is assessed against a published rubric.',
  },
  {
    title: 'Interview',
    body: 'Teams that are invited meet the STEM Racing staff and student mentors.',
  },
];
---

<Base
  title="Season"
  description="The STEM Racing season at The British School, New Delhi: key dates, registration and how selection works."
>
  <Section surface="mesh" priority class="page-head">
    <TextTrack slot="bleed" text="Our Season" />
  </Section>

  <Section surface="dark" labelledby="status-title">
    <div class="stack stack--loose">
      <h2 id="status-title">Where we are</h2>
      <SeasonStatus season={season} />
    </div>
  </Section>

  <Section surface="dark" labelledby="timeline-title">
    <div class="stack stack--loose">
      <div class="stack">
        <h2 id="timeline-title">Timeline</h2>
        <p class="lead">
          Dates for external events are set by the organisers and may change.
        </p>
      </div>
      {
        items.length > 0 ? (
          <Timeline items={items} dimPast today={today} />
        ) : (
          <p class="lead">Dates to be announced.</p>
        )
      }
    </div>
  </Section>

  <Section surface="light" labelledby="selection-title">
    <div class="stack stack--loose">
      <div class="stack">
        <h2 id="selection-title">How selection works</h2>
        <p class="lead">Three steps to a place on the grid.</p>
      </div>
      <ol class="grid grid--3">
        {selection.map((step, index) => <StepCard number={index + 1} title={step.title} body={step.body} />)}
      </ol>
    </div>
  </Section>
</Base>
```

- [ ] **Step 6: Type-check and run the tests**

Run: `npm run check`
Expected: `0 errors`, `0 warnings`, `0 hints`.

Run: `npm run test:site`
Expected: `5 page(s) built`, then PASS, 108 tests in 7 files.

- [ ] **Step 7: Commit**

```bash
git add src/components/SeasonStatus.astro src/pages/season.astro tests
git commit -m "feat: add the season page" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Resources and Support pages

**Files:**
- Create: `src/components/RoleList.astro`, `src/pages/resources.astro`, `src/pages/support.astro`
- Modify: `tests/helpers/site.ts` (the `ROUTES` line)
- Test: `tests/site/resources.test.ts`, `tests/site/support.test.ts`

**Interfaces:**
- Consumes: `Base`, `Section`, `TextTrack`, `Button`, `getSite()`, `getSupport()` (Task 7); `src/assets/brand/shapes/shape-yellow.svg` (Task 4); the `resources` collection (Task 5).
- Produces: `<RoleList title items>`. It renders `section.roles.card` with an `h3` and an `ol` of `.roles__item`. Each item holds a numeral that is hidden from screen readers, then the text in the last `span`.

This task pins Review Focus 2: a contact with no email address shows no link.

- [ ] **Step 1: Add the routes to the tests**

In `tests/helpers/site.ts`, replace the `ROUTES` line with:

```ts
export const ROUTES = ['/school', '/programme', '/teams', '/season', '/resources', '/support', '/404'];
```

- [ ] **Step 2: Write the two failing tests**

Create `tests/site/resources.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { clean, contentFiles, contentJson, page, texts } from '../helpers/site';

describe('resources', () => {
  const $ = page('/resources');
  const resources = contentFiles('resources', '.json').map((file) =>
    contentJson<{ title: string; fileUrl: string; category: string }>(`resources/${file}`),
  );

  it('links every resource', () => {
    for (const resource of resources) {
      const link = $(`main a[href="${resource.fileUrl}"]`);
      expect(link, resource.title).toHaveLength(1);
      expect(clean(link.text())).toContain(resource.title);
    }
  });

  it('groups them under a heading for each category', () => {
    expect(texts($, 'main h2')).toEqual([...new Set(resources.map((r) => r.category))].sort());
  });
});
```

Create `tests/site/support.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { contentJson, page, texts } from '../helpers/site';

describe('support', () => {
  const $ = page('/support');
  const support = contentJson<{ coordinator: string[]; mentor: string[]; parents: string[] }>(
    'support/support.json',
  );
  const site = contentJson<{ contacts: { name: string; email?: string }[] }>('site/site.json');

  it('shows the three roles with every point', () => {
    expect(texts($, '.roles h3')).toEqual(["Coordinator's role", "Mentor's role", "Parents' support"]);
    expect(texts($, '.roles__item span:last-child')).toEqual([
      ...support.coordinator,
      ...support.mentor,
      ...support.parents,
    ]);
  });

  it('shows each contact, with an email link only when one is given', () => {
    expect(texts($, 'main .card h3').filter((name) => site.contacts.some((c) => c.name === name))).toEqual(
      site.contacts.map((contact) => contact.name),
    );
    expect($('main a[href^="mailto:"]')).toHaveLength(site.contacts.filter((contact) => contact.email).length);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm run test:site`
Expected: FAIL with `dist/resources/index.html is missing`.

- [ ] **Step 4: Write the role list**

Create `src/components/RoleList.astro`:

```astro
---
interface Props {
  title: string;
  items: string[];
}

const { title, items } = Astro.props;
const id = `role-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
---

<section class="roles card" aria-labelledby={id}>
  <h3 id={id}>{title}</h3>
  <ol class="roles__list">
    {
      items.map((item, index) => (
        <li class="roles__item">
          <span class="roles__num" aria-hidden="true">
            {index + 1}
          </span>
          <span>{item}</span>
        </li>
      ))
    }
  </ol>
</section>

<style>
  .roles {
    display: grid;
    align-content: start;
    gap: 1.25rem;
  }

  .roles__list {
    display: grid;
    gap: 1rem;
  }

  .roles__item {
    display: grid;
    grid-template-columns: 2.25rem 1fr;
    gap: 0.75rem;
    align-items: baseline;
  }

  .roles__num {
    color: var(--pitlane-pink);
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: 1.75rem;
    line-height: 1;
  }
</style>
```

- [ ] **Step 5: Write the two pages**

Create `src/pages/resources.astro`:

```astro
---
import { getCollection } from 'astro:content';
import Button from '../components/Button.astro';
import Section from '../components/Section.astro';
import TextTrack from '../components/TextTrack.astro';
import Base from '../layouts/Base.astro';

const resources = (await getCollection('resources')).map((entry) => entry.data);
const categories = [...new Set(resources.map((resource) => resource.category))].sort((a, b) => a.localeCompare(b));
const inCategory = (category: string) =>
  resources.filter((resource) => resource.category === category).sort((a, b) => a.title.localeCompare(b.title));
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
---

<Base
  title="Resources"
  description="Regulations, guides and links for STEM Racing teams at The British School, New Delhi."
>
  <Section surface="mesh" priority class="page-head">
    <TextTrack slot="bleed" text="Resources" />
  </Section>

  <Section surface="dark">
    <div class="stack stack--loose">
      <p class="lead">Documents and links for competing teams.</p>
      {categories.length === 0 && <p>Resources will be added here.</p>}
      {
        categories.map((category) => (
          <section class="stack" aria-labelledby={`cat-${slug(category)}`}>
            <h2 id={`cat-${slug(category)}`}>{category}</h2>
            <ul class="grid">
              {inCategory(category).map((resource) => (
                <li class="card resource">
                  <div class="stack">
                    <h3>{resource.title}</h3>
                    <p>{resource.description}</p>
                  </div>
                  <Button href={resource.fileUrl} variant="ghost" external={resource.fileUrl.startsWith('https://')}>
                    Open<span class="sr-only">: {resource.title}</span>
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ))
      }
    </div>
  </Section>
</Base>

<style>
  .resource {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1.25rem 2rem;
  }

  .resource > :global(.stack) {
    --stack: 0.35rem;
    flex: 1 1 18rem;
  }
</style>
```

Create `src/pages/support.astro`:

```astro
---
import shapeYellow from '../assets/brand/shapes/shape-yellow.svg';
import RoleList from '../components/RoleList.astro';
import Section from '../components/Section.astro';
import TextTrack from '../components/TextTrack.astro';
import Base from '../layouts/Base.astro';
import { getSite, getSupport } from '../lib/content';

const support = await getSupport();
const site = await getSite();
---

<Base
  title="Support"
  description="How coordinators, mentors and families support STEM Racing teams at The British School, New Delhi."
>
  <Section surface="mesh" priority class="page-head">
    <TextTrack slot="bleed" text="Our Support" />
  </Section>

  <Section surface="dark" labelledby="roles-title">
    <div class="stack stack--loose">
      <div class="support-intro">
        <div class="stack">
          <h2 id="roles-title">Who does what</h2>
          <p class="lead">Every team is backed by a coordinator, a mentor and their families.</p>
        </div>
        <img
          class="support-intro__shape"
          src={shapeYellow.src}
          width={shapeYellow.width}
          height={shapeYellow.height}
          alt=""
          loading="lazy"
        />
      </div>
      <div class="grid grid--3">
        <RoleList title="Coordinator's role" items={support.coordinator} />
        <RoleList title="Mentor's role" items={support.mentor} />
        <RoleList title="Parents' support" items={support.parents} />
      </div>
    </div>
  </Section>

  <Section surface="light" labelledby="contacts-title">
    <div class="stack stack--loose">
      <h2 id="contacts-title">Contacts</h2>
      <ul class="grid grid--3">
        {
          site.contacts.map((contact) => (
            <li class="card stack">
              <h3>{contact.name}</h3>
              <p class="muted">{contact.role}</p>
              {contact.email && (
                <p>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </p>
              )}
            </li>
          ))
        }
      </ul>
      <p>
        {site.address}. <a href={site.schoolUrl}>The British School website</a>
      </p>
    </div>
  </Section>
</Base>

<style>
  .support-intro {
    display: grid;
    gap: 2rem;
    align-items: center;
  }

  .support-intro__shape {
    display: none;
  }

  @media (min-width: 60rem) {
    .support-intro {
      grid-template-columns: minmax(0, 3fr) minmax(0, 1fr);
    }

    .support-intro__shape {
      display: block;
      width: min(100%, 12rem);
      height: auto;
      margin-inline-start: auto;
    }
  }
</style>
```

- [ ] **Step 6: Type-check and run the tests**

Run: `npm run check`
Expected: `0 errors`, `0 warnings`, `0 hints`.

Run: `npm run test:site`
Expected: `7 page(s) built`, then PASS, 146 tests in 9 files.

- [ ] **Step 7: Commit**

```bash
git add src/components/RoleList.astro src/pages/resources.astro src/pages/support.astro tests
git commit -m "feat: add the resources and support pages" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 13: Event page

**Files:**
- Create: `src/pages/[event].astro`
- Test: `tests/site/event.test.ts`

**Interfaces:**
- Consumes: `Base`, `Section`, `TextTrack`, `getEvent()` (Task 7); `eventEnabled()` and `ROUTES` from `tests/helpers/site.ts`.
- Produces: the route `/event`, built only when `src/content/event/event.json` has `"enabled": true`. The header and footer already add the Event link in that case, through `navItems`.

The test file checks whichever state `event.json` is in, and skips the checks for the other state. The seed has the event switched off, so Step 6 switches it on by hand, checks it, and switches it back.

- [ ] **Step 1: Write the test**

Create `tests/site/event.test.ts`:

```ts
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { clean, contentJson, eventEnabled, page, pageFile, ROUTES } from '../helpers/site';

interface EventData {
  enabled: boolean;
  name: string;
  schedule: { time: string; activity: string }[];
  whatToBring: string[];
}

const event = contentJson<EventData>('event/event.json');

// This file checks whichever state event.json is in. The plan checks the other state by hand.
describe.runIf(!eventEnabled())('event switched off', () => {
  it('builds no event page', () => {
    expect(existsSync(pageFile('/event'))).toBe(false);
  });

  it.each(ROUTES)('%s has no link to it', (route) => {
    expect(page(route)('a[href="/event"]')).toHaveLength(0);
  });
});

describe.runIf(eventEnabled())('event switched on', () => {
  it('builds the event page with the schedule and the list of things to bring', () => {
    const $ = page('/event');
    expect($('h1')).toHaveLength(1);
    expect(clean($('#event-title').text())).toBe(event.name);
    expect($('.table tbody tr')).toHaveLength(event.schedule.length);
    expect($('.event-list li')).toHaveLength(event.whatToBring.length);
  });

  it.each(ROUTES)('%s links to it from the navigation', (route) => {
    expect(page(route)('nav[aria-label="Main"] a[href="/event"]')).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `npm run test:site`
Expected: PASS, 154 tests, 8 skipped. The "switched off" checks already pass, because no event page exists yet. Step 6 is where this task's test can fail.

- [ ] **Step 3: Write the page**

Create `src/pages/[event].astro`:

```astro
---
// This page is only built when src/content/event/event.json has "enabled": true.
import type { GetStaticPaths, InferGetStaticPropsType } from 'astro';
import Section from '../components/Section.astro';
import TextTrack from '../components/TextTrack.astro';
import Base from '../layouts/Base.astro';
import { getEvent } from '../lib/content';

export const getStaticPaths = (async () => {
  const event = await getEvent();
  if (!event || !event.enabled) return [];
  return [{ params: { event: 'event' }, props: { event } }];
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

const { event } = Astro.props;
const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`;
---

<Base title={event.name} description={`${event.name}: schedule, scrutineering and what to bring.`}>
  <Section surface="mesh" priority class="page-head">
    <TextTrack slot="bleed" text="Race Day" />
  </Section>

  <Section surface="dark" labelledby="event-title">
    <div class="stack stack--loose">
      <div class="stack">
        <p class="eyebrow">
          Event {event.sample && <span class="tag tag--sample">Sample entry</span>}
        </p>
        <h2 id="event-title">{event.name}</h2>
        <p class="lead">{event.dates}</p>
        <p>
          {event.venue}. <a href={mapUrl} target="_blank" rel="noopener noreferrer">Open in Google Maps<span class="sr-only"> (opens in a new tab)</span></a>
        </p>
      </div>
      <div class="stack">
        <h3>Schedule</h3>
        <div class="table-wrap" role="region" aria-label="Schedule" tabindex="0">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Activity</th>
              </tr>
            </thead>
            <tbody>
              {
                event.schedule.map((row) => (
                  <tr>
                    <td>{row.time}</td>
                    <td>{row.activity}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Section>

  <Section surface="light">
    <div class="grid grid--2">
      <div class="stack">
        <h2>Scrutineering</h2>
        <p>{event.scrutineeringInfo}</p>
      </div>
      <div class="stack">
        <h2>What to bring</h2>
        <ul class="prose event-list">
          {event.whatToBring.map((item) => <li>{item}</li>)}
        </ul>
      </div>
    </div>
  </Section>

  <Section surface="dark">
    <div class="stack">
      <h2>Contact</h2>
      <p class="lead">Questions about the day go to {event.contact}.</p>
    </div>
  </Section>
</Base>

<style>
  .event-list {
    padding-inline-start: 1.25rem;
    list-style: disc;
  }
</style>
```

- [ ] **Step 4: Type-check**

Run: `npm run check`
Expected: `0 errors`, `0 warnings`, `0 hints`.

- [ ] **Step 5: Check the event switched off**

Run: `npm run test:site`
Expected: `7 page(s) built`, then PASS, 154 tests, 8 skipped.

- [ ] **Step 6: Check the event switched on**

```bash
sed -i '' 's/"enabled": false/"enabled": true/' src/content/event/event.json
npm run test:site
```

Expected: `8 page(s) built`, including `/event/index.html`. Then PASS, 154 tests, 8 skipped: this time the "switched on" checks run and the "switched off" checks are skipped.

If the "switched on" checks fail, fix `src/pages/[event].astro` before you go on.

- [ ] **Step 7: Check that a sample event is caught**

Run: `npm run check:publish`
Expected: exit code 1, and the list now has three items. The first is `event/event.json: sample entry.`

- [ ] **Step 8: Switch the event back off**

```bash
git checkout -- src/content/event/event.json
git status --short src/content
npm run test:site
```

Expected: `git status` prints nothing for `src/content`. Then `7 page(s) built` and PASS, 154 tests, 8 skipped.

- [ ] **Step 9: Commit**

```bash
git add "src/pages/[event].astro" tests/site/event.test.ts
git commit -m "feat: add the optional event page" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 14: Home page

**Files:**
- Create: `src/components/StatBand.astro`, `src/pages/index.astro`
- Modify: `tests/helpers/site.ts` (the `ROUTES` line)
- Test: `tests/site/home.test.ts`

**Interfaces:**
- Consumes: `Base`, `Section`, `TextTrack`, `Button`, `getSite()`, `getCurrentSeason()` (Task 7); `StepCard` (Task 8); `TeamCard` (Task 10); `SeasonStatus` (Task 11); `src/assets/brand/gradients/sr-gradient.png`, `shapes/shape-black-1.svg` and `shapes/shape-pink.svg` (Task 4).
- Produces: `<StatBand items>`, where `items` is `{ value: string; label: string }[]`. It renders `dl.stats` with `.stat__value` and `.stat__label`.

This task pins Review Focus 1: the home page carries the season data for `dates.ts`.

Two things in the hero are deliberate:

- `grid-template-columns: minmax(0, 1fr)` on `.hero` and on `.hero__content`. Without it the grid grows to the width of the text track and the headline lands in the middle of the page.
- `object-position: center bottom` on the background. The glow is at the bottom of the supplied gradient and must stay in view on wide, short screens.

- [ ] **Step 1: Add the route to the tests**

In `tests/helpers/site.ts`, replace the `ROUTES` line with:

```ts
export const ROUTES = ['/', '/school', '/programme', '/teams', '/season', '/resources', '/support', '/404'];
```

- [ ] **Step 2: Write the failing test**

Create `tests/site/home.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { SeasonData } from '../../src/lib/season';
import { clean, contentFiles, contentJson, page, teamFiles, texts } from '../helpers/site';

const season = contentJson<SeasonData>(`seasons/${contentFiles('seasons', '.json').at(-1)}`);

const active = teamFiles().filter((team) => team.status === 'active');

describe('home', () => {
  const $ = page('/');
  const site = contentJson<{ stats: { value: string; label: string }[] }>('site/site.json');

  it('opens with the brand commitment, word for word', () => {
    expect(clean($('h1 .sr-only').text())).toBe('Accelerating Futures');
    expect(texts($, 'h1 .track__solid')).toEqual(['Accelerating', 'Futures']);
  });

  it('loads the hero background first', () => {
    const image = $('.hero picture img');
    expect(image.attr('loading')).toBe('eager');
    expect(image.attr('fetchpriority')).toBe('high');
    expect(image.attr('alt')).toBe('');
    expect($('.hero picture source[type="image/avif"]')).toHaveLength(1);
  });

  it('puts the header over the hero', () => {
    expect($('header').attr('class')).toContain('site-header--overlay');
  });

  it('shows the figures from site.json', () => {
    expect(texts($, '.stat__value')).toEqual(site.stats.map((stat) => stat.value));
    expect(texts($, '.stat__label')).toEqual(site.stats.map((stat) => stat.label));
  });

  it('shows up to three current teams', () => {
    expect($('.team')).toHaveLength(Math.min(3, active.length));
  });

  it('carries the season data, so the browser can keep Next up correct', () => {
    const panel = $('[data-season-status]');
    expect(JSON.parse(panel.attr('data-season') ?? '{}')).toEqual(season);
    for (const key of ['registration', 'next-label', 'next-title', 'next-date']) {
      expect(panel.find(`[data-status="${key}"]`)).toHaveLength(1);
    }
  });

  it('leads on to the programme, the teams and the season', () => {
    for (const href of ['/programme', '/teams', '/season', '/resources']) {
      expect($(`main a[href="${href}"]`).length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm run test:site`
Expected: FAIL with `dist/index.html is missing`.

- [ ] **Step 4: Write the figures band**

Create `src/components/StatBand.astro`:

```astro
---
interface Props {
  items: { value: string; label: string }[];
}

const { items } = Astro.props;
---

<dl class="stats">
  {
    items.map((item) => (
      <div class="stat">
        <dt class="stat__label">{item.label}</dt>
        <dd class="stat__value">{item.value}</dd>
      </div>
    ))
  }
</dl>

<style>
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
    gap: 2rem clamp(1.5rem, 1rem + 3vw, 4rem);
  }

  /* The label comes first in the markup and second on screen. */
  .stat {
    display: flex;
    flex-direction: column-reverse;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .stat__value {
    color: var(--fg-strong);
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 700;
    font-size: clamp(3.5rem, 2.5rem + 5vw, 6rem);
    line-height: 0.95;
  }

  .stat__label {
    max-width: 24ch;
    color: var(--fg);
    font-weight: 700;
    line-height: 1.3;
  }
</style>
```

- [ ] **Step 5: Write the page**

Create `src/pages/index.astro`:

```astro
---
import { Picture } from 'astro:assets';
import { getCollection } from 'astro:content';
import heroGradient from '../assets/brand/gradients/sr-gradient.png';
import shapeBlack from '../assets/brand/shapes/shape-black-1.svg';
import shapePink from '../assets/brand/shapes/shape-pink.svg';
import Button from '../components/Button.astro';
import SeasonStatus from '../components/SeasonStatus.astro';
import Section from '../components/Section.astro';
import StatBand from '../components/StatBand.astro';
import StepCard from '../components/StepCard.astro';
import TeamCard from '../components/TeamCard.astro';
import TextTrack from '../components/TextTrack.astro';
import Base from '../layouts/Base.astro';
import { getCurrentSeason, getSite } from '../lib/content';

const site = await getSite();
const season = await getCurrentSeason();
const teams = (await getCollection('teams'))
  .filter((team) => team.data.status === 'active')
  .sort((a, b) => a.data.name.localeCompare(b.data.name))
  .slice(0, 3);

const journey = [
  {
    title: 'Form a team',
    body: 'Three to six students, with roles across engineering, enterprise and project management.',
  },
  {
    title: 'Design and make',
    body: 'CAD, analysis, manufacturing and testing, backed by a sponsorship and marketing plan.',
  },
  {
    title: 'Compete',
    body: 'Scrutineering, judging, presentations and racing, from the Regional Finals to the World Finals.',
  },
];
---

<Base title="STEM Racing at The British School, New Delhi" header="overlay">
  <section class="hero" aria-labelledby="hero-title">
    <Picture
      src={heroGradient}
      formats={['avif', 'webp']}
      fallbackFormat="jpg"
      widths={[640, 1024, 1600, 2400]}
      sizes="100vw"
      alt=""
      loading="eager"
      fetchpriority="high"
      pictureAttributes={{ class: 'hero__bg' }}
    />
    <img class="hero__shape" src={shapeBlack.src} width={shapeBlack.width} height={shapeBlack.height} alt="" />
    <div class="hero__content">
      <TextTrack text="Accelerating Futures" layout="stacked" id="hero-title" />
      <div class="container hero__copy">
        <p class="lead">
          STEM Racing at The British School, New Delhi. Students design, build and race a miniature car, and run
          their team like a business.
        </p>
        <div class="actions">
          <Button href="/programme">How it works</Button>
          <Button href="/teams" variant="ghost">Meet the teams</Button>
        </div>
      </div>
    </div>
  </section>

  <Section surface="light" labelledby="about-title">
    <div class="stack">
      <h2 id="about-title">What STEM Racing is</h2>
      <div class="prose">
        <p>
          STEM Racing, formerly known as F1 in Schools, is one of the largest STEM competitions in the world, with
          teams from over fifty countries. Teams of students design, engineer, manufacture and race a miniature
          CO2-powered car.
        </p>
        <p>
          At the same time they run the team as a small business: sponsorship, branding, marketing, finance and
          project management. The strongest teams progress from school level through Regional and National Finals
          to the World Finals.
        </p>
      </div>
    </div>
  </Section>

  <Section surface="dark" labelledby="journey-title">
    <div class="stack stack--loose">
      <h2 id="journey-title">The journey</h2>
      <ol class="grid grid--3">
        {journey.map((step, index) => <StepCard number={index + 1} title={step.title} body={step.body} />)}
      </ol>
      <div class="actions">
        <Button href="/programme" variant="ghost">See all 12 steps</Button>
      </div>
    </div>
  </Section>

  <Section surface="mesh" mesh="hot" labelledby="numbers-title">
    <div class="stack stack--loose">
      <h2 id="numbers-title">TBS in numbers</h2>
      <StatBand items={site.stats} />
    </div>
  </Section>

  <Section surface="dark" labelledby="season-title">
    <div class="home-season">
      <div class="stack">
        <h2 id="season-title">This season</h2>
        <SeasonStatus season={season} />
        <div class="actions">
          <Button href="/season" variant="ghost">Full timeline</Button>
        </div>
      </div>
      <img
        class="home-season__shape"
        src={shapePink.src}
        width={shapePink.width}
        height={shapePink.height}
        alt=""
        loading="lazy"
      />
    </div>
  </Section>

  <Section surface="dark" labelledby="teams-title">
    <div class="stack stack--loose">
      <h2 id="teams-title">Our teams</h2>
      {
        teams.length > 0 ? (
          <div class="grid grid--3">
            {teams.map((team) => (
              <TeamCard team={team} />
            ))}
          </div>
        ) : (
          <p class="lead">Teams for this season will be announced here.</p>
        )
      }
      <div class="actions">
        <Button href="/teams" variant="ghost">All teams and results</Button>
      </div>
    </div>
  </Section>

  <Section surface="gradient" labelledby="cta-title">
    <div class="panel on-dark stack">
      <h2 id="cta-title">Your team starts here</h2>
      <p class="lead">
        Selection opens at the start of each school year. See how it works, and what the season holds.
      </p>
      <div class="actions">
        <Button href="/season">How to join</Button>
        <Button href="/resources" variant="ghost">Resources</Button>
      </div>
    </div>
  </Section>
</Base>

<style>
  .hero {
    position: relative;
    isolation: isolate;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: center;
    min-height: 100vh;
    min-height: 100svh;
    padding-block: calc(var(--header-h) + 2rem) clamp(4rem, 12vh, 8rem);
    overflow: clip;
    background: var(--carbon-shadow);
    color: var(--white);
  }

  .hero :global(.hero__bg) {
    position: absolute;
    inset: 0;
    z-index: -2;
  }

  .hero :global(.hero__bg img) {
    width: 100%;
    max-width: none;
    height: 100%;
    object-fit: cover;
    object-position: center bottom;
  }

  /* A supplied track shape, in the black version made for use over gradients. */
  .hero__shape {
    position: absolute;
    inset-block-end: -28%;
    inset-inline-end: -8%;
    z-index: -1;
    width: min(62vw, 52rem);
    max-width: none;
    height: auto;
  }

  .hero__content {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: clamp(1.5rem, 1rem + 2vw, 2.5rem);
  }

  .hero__copy {
    display: grid;
    gap: 1.5rem;
  }

  .home-season {
    display: grid;
    gap: 2.5rem;
    align-items: center;
  }

  .home-season__shape {
    display: none;
  }

  @media (max-width: 47.99rem) {
    .hero__shape {
      inset-block-end: -6%;
      inset-inline-end: -40%;
      width: 95vw;
    }
  }

  @media (min-width: 60rem) {
    .home-season {
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    }

    .home-season__shape {
      display: block;
      width: min(100%, 24rem);
      height: auto;
      margin-inline: auto;
    }
  }
</style>
```

- [ ] **Step 6: Type-check and run the tests**

Run: `npm run check`
Expected: `0 errors`, `0 warnings`, `0 hints`.

Run: `npm run test:site`
Expected: `8 page(s) built`, then PASS, 179 tests, 9 skipped, in 11 files.

- [ ] **Step 7: Commit**

```bash
git add src/components/StatBand.astro src/pages/index.astro tests
git commit -m "feat: add the home page" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 15: Checks in the browser, README and hand-over

**Files:**
- Modify: `README.md` (replaced in full)
- No new code. If a check in this task fails, fix the file that the check names, run `npm run test:all`, and commit the fix on its own.

**Interfaces:**
- Consumes: the whole site, and the launch configuration `astro-preview` from Task 1.
- Produces: a verified branch, a README for editors, and a report for the user.

The automated tests cannot see layout. These checks can. Report what you measure. If a check cannot be run, say so: do not report it as passed.

- [ ] **Step 1: Replace the README**

Replace `README.md` with:

````md
# STEM Racing at The British School, New Delhi

This is the website for the STEM Racing programme at TBS. It is a static site: every page is built from plain text files, so you do not need to know how to code to keep it up to date.

The site follows the STEM Racing Brand Identity Guidelines v1.3, in the Secondary division theme.

## Before you publish

The site ships with a few sample entries so that every page has something to show. Each one carries a gold "Sample entry" label on the page.

Run this before the site goes public:

```bash
npm run check:publish
```

It lists every sample entry and every `example.com` link. Replace each one with real content, delete its `sample` line, and run the command again until it says "Ready to publish".

Also check these by eye, because only you know whether they are right:

- The eight teams on the Our School page and in the Results table.
- The contacts in `src/content/site/site.json`.
- The copy on the Our School page.
- The dates on the Season page.

## Where the content lives

Everything you will need to change is in one folder: `src/content`.

| Folder | What it holds | Format |
|---|---|---|
| `teams` | One file for each team | Markdown |
| `seasons` | One file for each season | JSON |
| `results` | One file for each result | JSON |
| `resources` | One file for each link or download | JSON |
| `heritage` | One file for each team on the Our School timeline | JSON |
| `event` | `event.json`, the next big event | JSON |
| `school` | `school.md`, the copy for the Our School page | Markdown |
| `site` | `site.json`, the contacts, address and home page figures | JSON |
| `programme` | `programme.json`, the 12 steps, team roles and judged areas | JSON |
| `support` | `support.json`, the coordinator, mentor and parent roles | JSON |

When you change a file and push it to GitHub, Vercel rebuilds the site within a minute or two.

## Two file formats

**Markdown (`.md`)**. The block between the two `---` lines is a list of settings, one on each line. Anything below the second `---` is text that appears on the page.

**JSON (`.json`)**. Values sit inside double quotes, with commas between them. Lists sit inside square brackets.

- Every line inside a list or an object ends with a comma, except the last one.
- Use straight double quotes, not curly ones. If you paste from Word, check the quotes.
- Dates are written as `YYYY-MM-DD`, for example `2026-10-02`.

If a file has a mistake, the build fails and Vercel keeps the old version of the site online. The error names the file and the setting. A misspelt setting name, such as `carname` for `carName`, counts as a mistake.

## How to add a team

1. Open `src/content/teams` and copy any file.
2. Rename the copy in lower case with hyphens, for example `velocity-racing.md`.
3. Edit the settings at the top:

```md
---
name: Velocity Racing
carName: Falcon
season: "2026-27"
category: Development
members:
  - Priya Sharma (Team Principal)
  - Arnav Gupta (Design Engineer)
  - Nia Thomas (Enterprise Manager)
status: active
heroImage: ./images/falcon.png
---

A short paragraph about the team.
```

- `category` is `Development` or `Professional`.
- `status` is `active` or `archived`. Archived teams appear under Hall of fame.
- `carName` and `heroImage` can be left out. A team with no image shows the STEM Racing mark.
- For `heroImage`, put the picture in `src/content/teams/images` and write its path starting with `./images/`. Any size works: the site makes the small versions itself.
- Write each member as `Name (Role)`. The role can be left out.
- Check that you have permission to publish each student's name.

## How to update the season

1. Open `src/content/seasons`. The file with the latest year label is the current season: `2026-27.json` beats `2025-26.json`.
2. Each item in `timeline` looks like this:

```json
{
  "date": "2027-01-23",
  "title": "Regional Finals",
  "description": "The first competition of the season."
}
```

- Leave out `date` when it is not confirmed. The site shows "Date to be confirmed" and lists the item after the dated ones.
- The site sorts the items by date. It dims the ones that have passed and shows the next one on the home page. This is worked out in the visitor's browser each time, so it stays right between updates.

3. To open registration, set `"registrationOpen": true`. Add `"registrationDeadline": "2027-09-01"` to show a deadline, and `"registrationUrl": "https://..."` to show a Register button.
4. `name` is optional, for example `"name": "Season 9"`.

**Starting a new season**: copy the current file, rename it to the new year label, change `year` inside it, and replace the timeline. Then set last season's teams to `archived`.

## How to add a result

Copy a file in `src/content/results` and edit it:

```json
{
  "season": "2026-27",
  "team": "Velocity Racing",
  "event": "Regionals",
  "placing": "1st, Development class",
  "awards": ["Fastest Car"]
}
```

- `event` is `Regionals`, `Nationals` or `World Finals`.
- `placing` is free text.
- With no awards, write `"awards": []`.

Results appear in the table on the Teams page, newest season first.

## How to add a resource

Copy a file in `src/content/resources` and edit `title`, `description`, `fileUrl` and `category`.

- `fileUrl` starts with `https://`. For a file of your own, put it in the `public` folder and write its path starting with `/`, for example `/downloads/booklet.pdf`.
- Resources are grouped by `category`. Type a new name to make a new group.

## How to switch the event page on

Open `src/content/event/event.json` and set `"enabled": true`. The Event page appears and a link is added to the navigation. Set it back to `false` after the event and both disappear.

Replace the sample text first, and delete the `"sample": true` line.

## How to change the other pages

| To change | Edit |
|---|---|
| Contacts, address, home page figures | `src/content/site/site.json` |
| The 12 steps, team roles, what judges score | `src/content/programme/programme.json` |
| Coordinator, mentor and parent roles | `src/content/support/support.json` |
| The Our School page | `src/content/school/school.md` |
| The Our School timeline | `src/content/heritage`, one file for each team |

An email address for a contact is optional: add `"email": "name@british-school.org"` to show one.

## Brand rules for editors

- Do not add logos, colours or fonts. The site uses the official STEM Racing files only.
- The large outlined headlines take three words at most. The build stops if one is longer.
- Do not write "Supported by Formula 1". It needs permission from STEM Racing.
- "Accelerating Futures" is the STEM Racing brand commitment. Do not reword it.

## Fonts

Headlines use Magistral Italic. Everything else uses MachoModular.

The brand pack has no MachoModular Regular file, so body copy uses Medium. When you have the Regular file:

1. Convert it to WOFF2 and save it as `public/fonts/MachoModular-Regular.woff2`.
2. Open `src/styles/fonts.css` and remove the comment marks around the Regular rule.

Body copy switches to Regular. Nothing else needs to change.

## For whoever maintains the code

Built with [Astro](https://astro.build), TypeScript and plain CSS. No UI framework and no Tailwind.

```bash
npm install           # once
npm run dev           # local preview at http://localhost:4321
npm run build         # production build into dist/
npm run check         # type check
npm test              # unit tests
npm run test:site     # builds the site, then tests the pages in dist/
npm run test:all      # both
npm run check:publish # lists sample content
```

| Folder | What it holds |
|---|---|
| `src/lib` | Logic with no Astro imports. Every file has unit tests in `tests/unit`. |
| `src/lib/schemas.ts` | The rules for each content collection. |
| `src/components` | One component in each file, with its own scoped styles. |
| `src/styles/tokens.css` | Every colour, font and size. Components read colours from here only. |
| `src/scripts` | Browser scripts: the menu, the scroll effects and the date refresh. The site works without them. |
| `src/assets/brand` | The official artwork. |
| `tests/site` | Tests that read the built pages, including the brand rules. |

**Brand artwork** is copied from the brand pack by script and never redrawn:

```bash
node scripts/prepare-brand-assets.mjs "/path/to/STEM RACING BRANDING SHARE"
```

`scripts/convert-fonts.py` converts MachoModular to WOFF2. The instructions are at the top of that file.

**Deployment**: connect the GitHub repository to Vercel. `vercel.json` sets the framework and the output folder.
````

- [ ] **Step 2: Run everything**

```bash
npm run check
npm run test:all
```

Expected: `0 errors`, `0 warnings`, `0 hints`. Then 160 unit tests pass. Then `8 page(s) built` and 179 tests pass with 9 skipped.

- [ ] **Step 3: Check the build for warnings**

```bash
npm run build > "$SCRATCH/build.log" 2>&1
grep -i -c "warn" "$SCRATCH/build.log"
```

Expected: `0`. If it prints another number, read `$SCRATCH/build.log`, fix the cause and run it again.

- [ ] **Step 4: Check the empty states**

An editor may delete every team, or start a year with no season file. The pages must say so, and must not show what was there before.

Set `SCRATCH` to your session scratchpad directory. Create `$SCRATCH/empty-check.mjs`:

```js
// Reads the built pages and reports whether the empty states are showing.
import { readFileSync } from 'node:fs';

const text = (file) =>
  (/<main[\s\S]*<\/main>/.exec(readFileSync(file, 'utf8'))?.[0] ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');

const checks = {
  'dist/index.html': ['Dates to be announced', 'Teams for this season will be announced here.'],
  'dist/teams/index.html': [
    'Teams for this season will be announced here.',
    'Results appear here after each competition.',
  ],
  'dist/season/index.html': ['Dates to be announced', 'Registration closed'],
};

let missing = 0;
for (const [file, phrases] of Object.entries(checks)) {
  const page = text(file);
  for (const phrase of phrases) {
    const found = page.includes(phrase);
    if (!found) missing += 1;
    console.log(`${found ? 'found  ' : 'MISSING'}  ${file}  "${phrase}"`);
  }
}
process.exit(missing === 0 ? 0 : 1);
```

Move three folders out of the project and build:

```bash
mkdir -p "$SCRATCH/held"
mv src/content/teams "$SCRATCH/held/teams"
mv src/content/seasons "$SCRATCH/held/seasons"
mv src/content/results "$SCRATCH/held/results"
mkdir src/content/teams src/content/seasons src/content/results
npm run build
node "$SCRATCH/empty-check.mjs"
```

Expected: the build prints warnings that the three collections are empty, which is correct here. Then six lines that start with `found`, and exit code 0.

If a line says `MISSING`, the page is showing content from an earlier build. Check that `src/content.config.ts` uses `files()` for every collection.

Put the folders back:

```bash
rmdir src/content/teams src/content/seasons src/content/results
mv "$SCRATCH/held/teams" src/content/teams
mv "$SCRATCH/held/seasons" src/content/seasons
mv "$SCRATCH/held/results" src/content/results
git status --short src/content
npm run test:site
```

Expected: `git status` prints nothing. Then `8 page(s) built` and 179 tests pass with 9 skipped.

- [ ] **Step 5: Start the production build in the browser**

Start the server with `preview_start` and the name `astro-preview`. It serves `dist` at `http://localhost:4322`.

- [ ] **Step 6: Check every page at three widths**

For each width in 375, 768 and 1440, and for each route in `/`, `/school`, `/programme`, `/teams`, `/season`, `/resources`, `/support` and `/no-such-page`: set the width with `resize_window`, open the route, and run this in the page:

```js
(() => {
  const logo = document.querySelector('header .brand-logo').getBoundingClientRect();
  const solid = [...document.querySelectorAll('.track__solid')].map((el) => el.getBoundingClientRect());
  return {
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    h1: document.querySelectorAll('h1').length,
    logoHeight: Math.round(logo.height),
    logoWidth: Math.round(logo.width),
    headlineInView: solid.every((box) => box.left >= 0 && box.right <= window.innerWidth),
  };
})()
```

Expected on every page:

| Key | 375 wide | 768 and 1440 wide |
|---|---|---|
| `overflow` | `false` | `false` |
| `h1` | `1` | `1` |
| `logoHeight` | `44` | `56` |
| `logoWidth` | `108` | `137` |
| `headlineInView` | `true` | `true` |

That is 24 measurements. Record any that differ.

- [ ] **Step 7: Check the menu on a phone**

At 375 wide, on `/`, run:

```js
(() => {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.getElementById('site-nav');
  const shown = () => getComputedStyle(nav).display !== 'none';
  const before = shown();
  toggle.click();
  const opened = { expanded: toggle.getAttribute('aria-expanded'), shown: shown() };
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  const closed = { expanded: toggle.getAttribute('aria-expanded'), shown: shown() };
  return { before, opened, closed, focusOnToggle: document.activeElement === toggle };
})()
```

Expected:

```json
{
  "before": false,
  "opened": { "expanded": "true", "shown": true },
  "closed": { "expanded": "false", "shown": false },
  "focusOnToggle": true
}
```

- [ ] **Step 8: Check the page with scripts off**

The scripts announce themselves by adding the class `js` to the `html` element. Removing it shows the page as a visitor with scripts off sees it. At 375 wide, on `/`, run:

```js
(() => {
  document.documentElement.classList.remove('js');
  window.scrollTo(0, 0);
  const header = document.querySelector('[data-header]');
  return {
    headerPosition: getComputedStyle(header).position,
    navShown: getComputedStyle(document.getElementById('site-nav')).display !== 'none',
    toggleShown: getComputedStyle(document.querySelector('[data-nav-toggle]')).display !== 'none',
    heroStartsBelowHeader:
      Math.round(document.querySelector('.hero').getBoundingClientRect().top) >=
      Math.round(header.getBoundingClientRect().bottom),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  };
})()
```

Expected:

```json
{
  "headerPosition": "relative",
  "navShown": true,
  "toggleShown": false,
  "heroStartsBelowHeader": true,
  "overflow": false
}
```

Reload the page afterwards.

- [ ] **Step 9: Check the header over the hero**

At 1440 wide, on `/`, run:

```js
(async () => {
  const header = document.querySelector('[data-header]');
  const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  window.scrollTo(0, 0);
  await frame();
  const atTop = header.classList.contains('is-scrolled');
  window.scrollTo(0, 81);
  await frame();
  const after81 = header.classList.contains('is-scrolled');
  window.scrollTo(0, 0);
  return { position: getComputedStyle(header).position, atTop, after81 };
})()
```

Expected: `{ "position": "fixed", "atTop": false, "after81": true }`.

- [ ] **Step 10: Check that the browser, not the build, works out the dates**

On `/season`, run:

```js
(async () => {
  const items = [...document.querySelectorAll('.timeline [data-date]')];
  items.forEach((el) => el.classList.remove('is-past'));
  const script = document.querySelector('script[type="module"][src]');
  if (!script) return 'The script is inline. Reload the page and read the classes instead.';
  await import(`${script.src}?again=${Date.now()}`);
  const today = new Date().toISOString().slice(0, 10);
  return items.map((el) => ({
    date: el.dataset.date,
    dimmed: el.classList.contains('is-past'),
    shouldBeDimmed: el.dataset.date < today,
  }));
})()
```

Expected: for every item, `dimmed` equals `shouldBeDimmed`. With the seed content and a date after 16 September 2026, both items are dimmed.

Then on `/`, run:

```js
({
  label: document.querySelector('[data-status="next-label"]').textContent,
  title: document.querySelector('[data-status="next-title"]').textContent,
  date: document.querySelector('[data-status="next-date"]').textContent,
})
```

Expected with the seed content: `{ "label": "Next up", "title": "Regional Finals", "date": "Date to be confirmed" }`.

- [ ] **Step 11: Check reduced motion**

Run on any page:

```js
window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

If it returns `true`, run this and expect `{ "pending": 0, "shifted": 0 }`:

```js
({
  pending: document.querySelectorAll('.reveal-pending').length,
  shifted: [...document.querySelectorAll('[data-track]')].filter((el) => el.style.getPropertyValue('--track-shift')).length,
})
```

If it returns `false`, this browser pane has no switch for reduced motion. Say so in the report. What is verified in that case: `tokens.test.ts` proves the CSS rule exists, and `motion.ts` reads the same media query before it moves anything. The user can see it for themselves by turning on Reduce Motion in macOS Accessibility settings. Do not change system settings yourself.

- [ ] **Step 12: Look at the pages**

Take screenshots of `/` at 1440 and at 375, and of `/programme` and `/teams` at 1440. For each page, scroll to the top first.

Check against the brand guide:

| Look for | Expected |
|---|---|
| Hero | Dark at the top, glowing pink and orange at the bottom, one black track shape at the lower right |
| Headline | "Accelerating Futures" in solid white italic, with outline copies that run off both edges |
| Logo | Full colour on a dark ground, not stretched, nothing within half its height |
| Inner page headers | Three rows of text on the orange and pink mesh, the middle one solid |
| Headings on black | Filled with the violet to orange gradient |
| Headings on the light surface | Solid violet |
| Sample teams | Each shows a gold "Sample entry" label |
| Colours | No blue and no green anywhere |

Show the screenshots to the user.

- [ ] **Step 13: Measure performance and accessibility**

With `astro-preview` still running:

```bash
npx --yes lighthouse http://localhost:4322/ --only-categories=performance,accessibility --form-factor=mobile --screenEmulation.mobile --output=json --output-path="$SCRATCH/lighthouse.json" --chrome-flags="--headless=new" --quiet
node -e "const r=require(process.argv[1]); console.log('performance', Math.round(r.categories.performance.score*100), 'accessibility', Math.round(r.categories.accessibility.score*100), 'layout shift', r.audits['cumulative-layout-shift'].displayValue)" "$SCRATCH/lighthouse.json"
```

Targets from the spec: performance 90 or above, accessibility 100, layout shift 0.

If a score is under its target, open `$SCRATCH/lighthouse.json`, read the failing audits, and fix what they name. If Lighthouse cannot start Chrome, report that the scores were not measured.

- [ ] **Step 14: Stop the server and run the publish check**

Stop the server with `preview_stop`. Then:

```bash
npm run check:publish
```

Expected: exit code 1, listing the two sample teams. This is correct: the samples stay until the user supplies real teams.

- [ ] **Step 15: Commit**

```bash
git add README.md
git commit -m "docs: rewrite the README for the rebuilt site" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git status --short
git log --oneline main..rebuild
```

Expected: `git status` prints nothing. `git log` lists the commits of Tasks 1 to 15.

- [ ] **Step 16: Report to the user**

Do not merge, push or deploy. Tell the user:

1. The site is rebuilt on the branch `rebuild`. `main` is unchanged, so the live site is unchanged.
2. The results of Steps 2 to 13, with the numbers. Name any check that was not run.
3. What is sample content: the two teams and the event. Each is labelled on the page, and `npm run check:publish` lists them.
4. What to confirm before going public:
   - The eight teams on the Our School page each represented India at the World Finals, in the years shown.
   - The three figures on the home page: 8 teams, 9 seasons, 50+ countries.
   - Ms Sonica Puri's name and title, and whether any contact should show an email address.
   - The Our School copy, including "around 1,270 students from 60 nationalities".
5. What to supply: the Season 9 teams with permission to publish names, the dates of the Finals, TBS documents for the Resources page, and a MachoModular Regular font file.
6. How to go live when ready: merge `rebuild` into `main` and push. Vercel builds from `main`.

---

## What this plan does not do

- It does not merge, push or deploy.
- It does not add a CMS, a news section, a contact form or a light theme. The spec rules them out.
- It does not apply the motion blur effect to photographs. The site has no photographs yet.
- It does not publish any student's name or any personal email address.
