# Team dashboard: design

Written 2026-09-27. Approved in conversation by Reyansh; this file is the authority for the build.

## Purpose

Give each TBS STEM Racing team a private workspace to track its season, and give mentors one place to see every team and spot who is behind.

Success looks like this:

- A team opens its workspace with its code and can see what is done, what is due and what mentors have asked for.
- A mentor opens the overview and can tell within a few seconds which teams are behind.
- The public site is unchanged for visitors and stays static.

## Decisions made by the user

| Matter | Decision |
|---|---|
| Who it serves | Teams (workspace) and mentors (overview) |
| Sign-in | One shared code per team, one mentor code. No personal accounts. |
| Workspace content | Deliverables checklist, deadlines, own tasks, notes and links |
| Mentor input | Mentors can add tasks, notes and announcements to one team or to all teams |
| Streaks | Wanted. Weekly, as proposed and not objected to. |
| Deliverables | The list below, given by the user |
| Database | Supabase. Neon was proposed and refused. |
| Codes | Chosen by the user, in the form of a word, a hyphen and four characters. The user supplied one for mentors and one for each of seven teams. |
| Making teams | A mentor makes a new team from the mentor pages. |

## Out of scope

- Sending email or notifications.
- Personal accounts, names or email addresses of pupils.
- File uploads. Teams save links to files held elsewhere.
- Changes to public pages, other than one "Team sign-in" link in the footer.
- History of who changed what. A shared code cannot tell members apart.

## Architecture

- Astro stays the framework. `astro.config.mjs` gains the `@astrojs/vercel` adapter. `output` stays `'static'`.
- Every page and route under `src/pages/dashboard/` sets `export const prerender = false`. No other page does.
- Data is held in a Supabase project, which is Postgres. The connection string is the `DATABASE_URL` environment variable and points at Supabase's connection pooler in transaction mode.
- Queries use the `postgres` package with SQL written by hand and prepared statements off, as the pooler requires. No ORM, and no Supabase client library.
- Only the server talks to the database. The browser is never given a Supabase address or key. Supabase Auth is not used; sign-in is the shared codes below.
- Row level security is switched on for every table with no policies, so Supabase's public API returns nothing even if its public key is found.
- The tables are made by SQL files in `supabase/migrations/`, not by hand in the table editor.
- Supabase pauses a free project after a week with no activity. A Vercel cron job calls `/dashboard/api/keep-awake` once a day, which runs `select 1`. The route accepts only requests carrying Vercel's `CRON_SECRET`.
- Dashboard pages use `src/layouts/Base.astro`, the tokens in `src/styles/tokens.css` and the existing components. Every colour is a token, as the site tests require.
- Forms post to server routes and the page reloads. The dashboard works with scripts off. A small script may add in-place updates later; it is not part of this build.

### Units

| Unit | File | Job | Depends on |
|---|---|---|---|
| Database access | `src/lib/dashboard/db.ts` | One `sql` function. The only file that reads `DATABASE_URL`. | `postgres` package |
| Codes | `src/lib/dashboard/codes.ts` | Make a code, hash it, compare it | `node:crypto` |
| Sessions | `src/lib/dashboard/session.ts` | Sign, read and clear the cookie | `node:crypto` |
| Rate limit | `src/lib/dashboard/limit.ts` | Count failed sign-ins by address | `db.ts` |
| Streaks | `src/lib/dashboard/streak.ts` | Pure function: activity dates and holidays in, streak out | Nothing |
| Deliverables | `src/lib/dashboard/deliverables.ts` | The fixed list | Nothing |
| Store | `src/lib/dashboard/store.ts` | Every query, each taking a team id as its first argument | `db.ts` |
| Guard | `src/middleware.ts` | Reads the session for `/dashboard` paths and sends others to sign-in | `session.ts` |

`streak.ts`, `codes.ts`, `session.ts` and `deliverables.ts` hold no database code, so unit tests run them without a database.

## Sign-in

- `/dashboard` shows one field, "Access code", and a button.
- A team code opens `/dashboard/team`. The mentor code opens `/dashboard/mentor`.
- A mentor types the code for a team when making the team or resetting its code. Leaving the field empty makes a code of 10 characters in three groups, from letters and digits that are not easily confused (no `0`, `O`, `1`, `I`, `L`), in the form `K7QM-X4P-9RT`.
- A code holds 6 to 32 letters and digits. Case, spaces and hyphens are ignored when it is typed and when it is compared, so `word 2abc` and `WORD-2ABC` are one code.
- No two teams may hold the same code, and no team may hold the mentor code. The form refuses a code that is in use.
- Codes are stored as scrypt hashes with a salt for each code. A code is shown once, on the page that follows making or resetting it. No code is written to the repository, a log or a test.
- The mentor code is set from the `MENTOR_CODE_HASH` environment variable, so that it cannot be changed from the dashboard. `npm run dashboard:hash` asks for a code without showing it and prints its hash.
- The user's codes are shorter than a generated one, and each begins with a word. The limit on failed attempts is what protects them.
- The session cookie is `HttpOnly`, `Secure`, `SameSite=Lax`, limited to `/dashboard`, and lasts 30 days. It holds the role, the team id and an expiry, signed with HMAC-SHA-256 using `SESSION_SECRET`.
- Resetting a team's code changes that team's `code_version`. A cookie with an older version is refused, so a reset signs everyone out.
- Five failed attempts from one address in 15 minutes block that address for 15 minutes. The message does not say whether the code was close.
- Every form that changes data carries a token tied to the session, checked on the server.

## Data

All tables are in one schema. Times are stored in UTC. A "week" is Monday to Sunday in the school's timezone, which is `Asia/Kolkata`, as in `src/lib/season.ts`.

| Table | Columns |
|---|---|
| `teams` | `id`, `slug` (matches the file name in `src/content/teams/`), `name`, `code_hash`, `code_version`, `archived`, `created_at` |
| `deliverables` | `team_id`, `key`, `status` (`not_started`, `in_progress`, `done`), `updated_at`. One row for each team and key. |
| `tasks` | `id`, `team_id`, `title`, `owner_role`, `due_date`, `done`, `created_by` (`team` or `mentor`), `created_at`, `updated_at` |
| `notes` | `team_id`, `status_note`, `updated_at`. One row for each team. |
| `links` | `id`, `team_id`, `label`, `url`, `created_at` |
| `mentor_notes` | `id`, `team_id`, `body`, `created_at`. Written by mentors, read by the team. |
| `announcements` | `id`, `team_id` (empty means all teams), `body`, `created_at` |
| `activity` | `id`, `team_id`, `kind`, `happened_at`. One row for each change a team makes. |
| `holidays` | `id`, `label`, `starts_on`, `ends_on` |
| `signin_failures` | `address_hash`, `happened_at` |

Limits: title 120 characters, note 2,000, announcement 1,000, link label 60. Links must start with `https://`. A team may hold 200 tasks and 30 links.

### Deliverables

Ten lines. The user's list has eight items; "3 Portfolios" is tracked as three lines so that each can have its own status.

| Key | Label |
|---|---|
| `car` | Car |
| `engineering-drawings` | Engineering Drawings |
| `renders` | Renders |
| `portfolio-engineering` | Engineering Portfolio |
| `portfolio-enterprise` | Enterprise Portfolio |
| `portfolio-project-management` | Project Management Portfolio |
| `ai-declaration` | AI Declaration |
| `pit-display` | Pit Display |
| `verbal-presentation-script` | Verbal Presentation Script |
| `verbal-presentation-video` | Verbal Presentation Video |

The three portfolio names follow the site's published programme content and the TBS Project Management Guide. The user is to confirm them when reviewing this file.

### Which teams get a workspace

- Mentors add teams from the mentor pages. Nothing is made without a mentor's action.
- The "Add a team" form takes a name and a code. It suggests the names in `src/content/teams/` and accepts any other name.
- The `slug` is made from the name: lower case, with each run of other characters turned into one hyphen. `N!TRO` becomes `n-tro`. A name whose slug is in use is refused.
- No team, code or task is seeded with invented content. A new database is empty.

## Rules

| Action | Team | Mentor |
|---|---|---|
| Read own workspace | Yes | Yes, any team |
| Change a deliverable's status | Yes | Yes |
| Add, edit, delete own tasks | Yes | Yes |
| Tick off a mentor task | Yes | Yes |
| Edit or delete a mentor task | No | Yes |
| Edit status note and links | Yes | No |
| Add, edit, delete mentor notes and announcements | No | Yes |
| Add or archive a team, reset a code, set holidays | No | Yes |

The team id for every query comes from the session on the server. No route accepts a team id from a team's browser. Mentor routes take the team id from the address and check the role first.

Only changes made by a team write to `activity`. A mentor's changes do not count toward a team's streak.

## Screens

### Team workspace, `/dashboard/team`

In this order:

1. **Header.** Team name, streak ("4 week streak"), sign out.
2. **Announcements.** Those for this team and for all teams, newest first. The five most recent, with a link to show the rest.
3. **Next deadline.** The first item in the season timeline with a date of today or later, and the days left. If no later item has a date, the next undated item is shown with "Date to be confirmed".
4. **Deliverables.** Ten lines, each with its status as a set of three choices. Above them, "6 of 10 done" and a bar.
5. **Tasks.** Mentor tasks first, labelled "From your mentor", then the team's own, each group by due date. Overdue tasks are labelled "Overdue" in words as well as colour. A form adds a task: title, owner role, due date. Owner role is a choice from the role titles in `src/content/programme/programme.json`, or none.
6. **Mentor notes.** Read-only.
7. **Notes and links.** One status note and the list of links.

### Mentor overview, `/dashboard/mentor`

1. **Teams.** One row for each team: name, deliverables done of 10, overdue tasks, streak, last active. Sorted so that flagged teams come first. Below 48rem the rows become cards.
2. **Post.** Add an announcement or a task, to one team or all teams.
3. **Manage.** Add a team, archive a team, reset a code, set holiday dates.

A team is flagged "Behind" when it has an overdue task or has made no change in 14 days, not counting holidays. The flag is a word, not colour alone.

### Team detail for mentors, `/dashboard/mentor/team/[slug]`

The team's workspace as the team sees it, with controls to add and edit mentor tasks, mentor notes and announcements for that team.

## Streaks

- A week counts when the team made one or more changes in it.
- A holiday week is a week in which every weekday falls inside a holiday. It neither counts nor breaks a streak.
- The streak is the number of counted weeks in a row, ending at this week or the last one. This week does not break a streak until it is over.
- With no activity the workspace shows "No streak yet".
- The longest streak is shown beside the current one in the overview.

## Errors and empty states

| Case | What the person sees |
|---|---|
| Wrong code | "That code was not recognised." The field keeps focus. |
| Too many attempts | "Too many attempts. Try again in 15 minutes." |
| Session expired or code reset | Sent to `/dashboard` with "Please sign in again." |
| Database unreachable | A page in the site's style: "The dashboard is unavailable. Your work is safe. Try again in a few minutes." Status 503. |
| A field too long or a link not `https://` | The form again, with the entry kept and a message beside the field |
| No tasks, links, announcements or teams | One sentence for each, saying what would appear there |
| Archived team signs in | "This workspace is closed. Ask your mentor." |

Dashboard pages send `X-Robots-Tag: noindex` and `Cache-Control: no-store`. They are left out of any sitemap.

## Testing

| Layer | Covers | Where |
|---|---|---|
| Unit | Streaks: gaps, holidays, week edges, timezone, no activity. Codes: form, hash, compare. Sessions: sign, tamper, expiry, old `code_version`. Field limits. | `tests/unit/dashboard/` |
| Routes | Every row of the rules table, as a team and as a mentor. A team asking for another team's data gets nothing. Rate limit. Form token. | `tests/dashboard/`, run against PGlite, which is Postgres inside the test process. Never the Supabase project. |
| Site | The existing 212 site tests still pass. Public pages are still built as static files. Colours in dashboard CSS are tokens. | `tests/site/` |
| By hand | Both screens at 375, 768 and 1440 wide. Scripts off. Keyboard only. | Browser |

`npm run test:dashboard` is added, and `npm run test:all` runs it. It needs no database to be installed.

The adapter moves the built pages from `dist/` to `dist/client/`. The site tests and their helpers are changed to read from there.

## Stages

Each stage is usable when it ends.

| Stage | Delivers |
|---|---|
| 1 | Adapter, database, keep-awake job, sign-in for teams and mentors, team workspace: deliverables, deadline, tasks, notes and links. A mentor page that lists the teams, adds a team, resets a code and archives a team. |
| 2 | Mentor overview table with progress and flags, team detail, mentor tasks, mentor notes, announcements. |
| 3 | Activity log display, streaks, holidays, the "Behind" flag's 14-day rule. The `activity` table is written from stage 1, so streaks have history when they appear. |

## Needed from the user

| What | When |
|---|---|
| Confirm the three portfolio names | On reviewing this file |
| Create the Supabase project, in a region near the school, and put its pooler connection string in Vercel as `DATABASE_URL` | Before stage 1 is deployed. It can be built and tested locally first. |
| Put the hash of the mentor code and a `SESSION_SECRET` in Vercel | Before stage 1 is deployed |
| Add the seven teams from the mentor page, typing each code | After stage 1 is deployed |
| School approval, if the school requires it for a pupil-facing tool | Before teams are given codes |
