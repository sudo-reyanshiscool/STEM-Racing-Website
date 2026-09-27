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
