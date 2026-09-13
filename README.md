# STEM Racing at The British School, New Delhi

This is the website for the STEM Racing programme at TBS. It is a static site: every page is built from plain text files, so you do not need to know how to code to keep it up to date.

All the content you will ever need to change lives in one folder: `src/content`. Each subfolder is a "collection", and each file in it is one entry.

```
src/content/
  teams/       one file per team (Markdown)
  seasons/     one file per season (JSON)
  results/     one file per result (JSON)
  resources/   one file per download (JSON)
  event/       a single event.json for the next big event
```

Once you edit a file and push it to GitHub, Vercel rebuilds and publishes the site automatically within a minute or two.

## Two file formats you will meet

**Markdown (`.md`)**. The block between the two `---` lines is a list of settings, one per line. Anything below the second `---` is free text that appears on the page.

**JSON (`.json`)**. Values are wrapped in double quotes and separated by commas. Lists sit inside square brackets. Rules that trip people up:

- Every line inside a list or object ends with a comma, except the last one.
- Use straight double quotes, not curly ones. If you paste from Word, check the quotes.
- Dates are always written as `YYYY-MM-DD`, for example `2026-10-02`.

If a file has a mistake, the build fails and Vercel keeps the old version of the site online. The error message names the file and the field, so it is easy to fix.

## How to add a team

1. Open `src/content/teams` and duplicate any existing file, for example `aeroflux.md`.
2. Rename the copy using lower case letters and hyphens, for example `velocity-racing.md`. The file name is not shown on the site.
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
heroImage: ""
---

A short paragraph about the team. This is optional.
```

- `category` must be exactly `Development` or `Professional`.
- `status` must be exactly `active` or `archived`. When a season ends, change every team from that season to `archived` and they move under the Archive heading on the Teams page.
- `heroImage` is the car render. Leave it as `""` to show a labelled placeholder box. To use a real image, put the file in the `public/teams` folder and write the path, for example `heroImage: "/teams/falcon.png"`.
- `colours` is optional. Delete the whole line if you do not need it.

## How to update the season timeline

1. Open `src/content/seasons`. The site treats the file with the latest year label as the current season, so `2026-27.json` beats `2025-26.json`.
2. Each item in `timeline` looks like this:

```json
{
  "date": "2027-01-23",
  "title": "Regional Finals, New Delhi",
  "description": "First race of the season."
}
```

Add, remove or edit items freely. The site sorts them by date, and the home page shows the next item that has not yet happened.

3. To open or close registration, change `"registrationOpen": true` to `false` or back. The button on the Season page switches between "Register" and "Registration closed", and the home page status strip updates too.
4. `registrationDeadline` is the date shown next to the button.

**Starting a new season**: duplicate the current file, rename it to the new year label, update the label inside the file, replace the timeline dates, and set `registrationOpen` to `true`. Then set the teams from the old season to `archived`.

## How to add a result

1. Open `src/content/results` and duplicate any file.
2. Rename it so it is easy to find later, for example `2026-27-aeroflux-regionals.json`.
3. Edit the contents:

```json
{
  "season": "2026-27",
  "team": "Aeroflux",
  "event": "Regionals",
  "placing": "1st, Professional class",
  "awards": ["Fastest Car", "Best Engineered Car"]
}
```

- `event` must be exactly `Regionals`, `Nationals` or `World Finals`.
- `placing` is free text, so write whatever reads best.
- If there were no awards, write `"awards": []`.

Nationals and World Finals results automatically appear as highlight cards at the top of the Results page.

## How to add a resource

Duplicate a file in `src/content/resources` and edit `title`, `description`, `fileUrl` and `category`. The `fileUrl` can be any web link, such as a Google Drive share link. Resources are grouped by `category` on the page, and you can invent new categories just by typing a new name.

## How to enable the event page

Open `src/content/event/event.json` and change `"enabled": false` to `"enabled": true`. The Event page appears and a link to it is added to the navigation. Set it back to `false` after the event and both disappear.

While you are in the file, update `name`, `dates`, `venue`, the `schedule` list, `scrutineeringInfo`, `whatToBring` and `contact`.

## Contacts and copy that are not in the content folder

The two named contacts on the Programme page and in the footer, and the placeholder emails, live in `src/pages/programme.astro` and `src/components/Footer.astro`. They are near the top of each file and safe to edit as plain text.

## For whoever maintains the code

- Built with [Astro](https://astro.build), TypeScript and plain CSS. No UI framework, no Tailwind.
- Colours and fonts are all defined as CSS variables in `src/styles/global.css`.
- Content schemas are in `src/content.config.ts`. Change them if you want a new field.
- The event page is `src/pages/[event].astro`. Its `getStaticPaths` returns nothing when the event is disabled, so the route is simply not built.

```bash
npm install      # once
npm run dev      # local preview at http://localhost:4321
npm run build    # production build into dist/
npm run check    # type check
```

Deployment: connect the GitHub repository to Vercel. `vercel.json` sets the framework and output directory, so no further configuration is needed.
