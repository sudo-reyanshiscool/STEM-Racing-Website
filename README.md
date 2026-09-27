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
| `teams` | One JSON file for each team, with its name and stage | JSON |
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

Open `src/content/teams`, copy any JSON file and change its two fields:

```json
{
  "name": "Velocity Racing",
  "stage": "Current Regionals"
}
```

`stage` must be `World Finals`, `Nationals` or `Current Regionals`.

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

- Write the items in the order they happen.
- Leave out `date` when it is not confirmed. The site shows "Date to be confirmed" and keeps the item where you wrote it. For example, when only the World Finals has a date, the Regional and National Finals still come first.
- The site puts the dated items in date order. It dims the ones that have passed and shows the next one on the home page. This is worked out in the visitor's browser each time, so it stays right between updates.
- A date must be on the calendar. The build stops at `2026-09-31`.

3. To open registration, set `"registrationOpen": true`. Add `"registrationDeadline": "2027-09-01"` to show a deadline, and `"registrationUrl": "https://..."` to show a Register button. The day after the deadline, the site shows "Registration closed" and takes the button away by itself. To keep registration open for longer, change the deadline or delete that line.
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
2. Open `src/styles/fonts.css` and delete the two lines that say "Delete this line when MachoModular Regular is installed."

Body copy switches to Regular. Nothing else needs to change.

## The team dashboard

Teams and mentors sign in at `/dashboard` with an access code. The link is in the footer.

| Who | Sees |
|---|---|
| A team | Its own workspace: announcements, the next deadline, deliverables, tasks, notes from mentors, its own status note and links, and its streak |
| A mentor | Every team in one list, with the teams that are behind first. Forms to post an announcement or a task to one team or all, set holidays and add a team. Each team's page has its workspace, notes for the team, and forms to reset its code or archive it. |

**Codes.** A mentor chooses a team's code or leaves the field empty to have one made. A code is shown once. Only its hash is stored, so a lost code cannot be looked up: reset it. Resetting a code signs out everyone who used the old one. Never write a code in this repository.

**The next deadline** comes from the season file. See "How to update the season".

**What is stored.** Team names, statuses, tasks, notes and links. No names or email addresses of pupils. A task is owned by a role, not a person.

### Settings

These are set in Vercel, under Settings, Environment Variables. On your own computer they go in `.env`, which git ignores. `.env.example` lists them.

| Name | What it is |
|---|---|
| `DATABASE_URL` | The Supabase pooler address in transaction mode. It ends in `:6543/postgres`. The site signs in as the role `dashboard_app`, which can read and write the dashboard's tables and nothing else. |
| `SESSION_SECRET` | 32 characters or more, made at random. Changing it signs everyone out. |
| `MENTOR_CODE_HASH` | The hash of the mentor code, from `npm run dashboard:hash`. To change the mentor code, make a new hash, save it in Vercel and deploy again. That signs out every mentor. |
| `CRON_SECRET` | Made at random. Vercel sends it with the daily job that keeps the database awake. |

**Behind.** A team is marked "Behind" when it has an overdue task, or has made no change for 14 days. Days inside a holiday are left out. The list says which.

**Streaks.** A week runs from Monday to Sunday, in New Delhi time, and counts when the team made one change or more. A week that is all holiday neither counts nor breaks the streak. Only the team's own changes count, not a mentor's.

**Holidays** are set by mentors on the mentor page. Add the school's holiday dates before the first break, or streaks will end over it.

**Sign-in limit.** After 20 wrong codes from one address in 15 minutes, that address is refused for the rest of the 15 minutes. A school shares one address, so this limit is shared by everyone at school.

### The database role

The site signs in to Postgres as `dashboard_app`, not as `postgres`. The role is made once, by hand, in the Supabase SQL editor. Its password is made at random and kept in `DATABASE_URL` in Vercel, and nowhere else.

```sql
create role dashboard_app login password '<a long random password>' bypassrls;
grant usage on schema public to dashboard_app;
grant select, insert, update, delete
  on teams, deliverables, tasks, notes, links, activity, signin_failures,
     mentor_notes, announcements, holidays
  to dashboard_app;
```

Every table has row level security switched on with no policies, so Supabase's public API returns nothing. `bypassrls` lets this one role past that. A new table needs a `grant` of its own. Put it in the migration inside a check that the role exists, as `0003_dashboard_stages_2_3.sql` does, because the role is not there in a test database.

In `DATABASE_URL` the user is `dashboard_app.<project ref>`.

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

The database is a Supabase project in Sydney, so `vercel.json` runs the dashboard in Vercel's Sydney region, `syd1`.

## For whoever maintains the code

Built with [Astro](https://astro.build), TypeScript and plain CSS. No UI framework and no Tailwind.

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

| Folder | What it holds |
|---|---|
| `src/lib` | Logic with no Astro imports. Every file has unit tests in `tests/unit`. |
| `src/lib/schemas.ts` | The rules for each content collection. |
| `src/components` | One component in each file, with its own scoped styles. |
| `src/styles/tokens.css` | Every colour, font and size. Components read colours from here only. |
| `src/scripts` | Browser scripts: the menu, the scroll effects and the date refresh. The site works without them. |
| `src/assets/brand` | The official artwork. |
| `tests/site` | Tests that read the built pages, including the brand rules. |
| `src/lib/dashboard` | The team dashboard's logic. Only `runtime.ts` imports from Astro. |
| `src/pages/dashboard` | The only pages rendered on request. Every other page is built ahead of time. |
| `src/styles/dashboard.css` | Every dashboard style, in one file, because the dashboard's forms share them. The layout is a board of readings, then two columns. |
| `supabase/migrations` | The dashboard's tables, as numbered SQL files. |
| `tests/dashboard` | Dashboard tests that use a database inside the test process. |

**Brand artwork** is copied from the brand pack by script and never redrawn:

```bash
node scripts/prepare-brand-assets.mjs "/path/to/STEM RACING BRANDING SHARE"
```

`scripts/convert-fonts.py` converts MachoModular to WOFF2. The instructions are at the top of that file.

**Deployment**: connect the GitHub repository to Vercel. `vercel.json` sets the framework and the daily job that keeps the database awake. The Vercel adapter decides where the build is written.
