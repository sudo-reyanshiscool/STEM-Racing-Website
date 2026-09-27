# TBS STEM Racing website rebuild: design

Date: 2026-09-27
Status: approved on 2026-09-27. Amended while planning: see "Changes made while planning" at the end.

## Purpose

Rebuild the STEM Racing website for The British School, New Delhi (TBS) from scratch so that it follows the official STEM Racing Brand Identity Guidelines v1.3 (March 2026).

Audience:

1. TBS students competing in STEM Racing. They need the season timeline, the process, resources and contacts.
2. Competition judges. They need to see a credible, on-brand programme with a record of teams and results.

Success means a judge or student who opens the site sees something that reads as part of the STEM Racing family (stemracing.com is the reference), and a non-coder at TBS can update teams, dates and results by editing plain files.

## Decisions already made

| Topic | Decision |
|---|---|
| Scope | Full rebuild. New layout, components and styles. Nothing from the current `src/` is kept. |
| Brand | STEM Racing brand, Secondary division theme. |
| Logo | The "STEM Racing / The British School" lockup from `Logos/TBS/`, taken from the supplied PNG files. |
| Fonts | Self-hosted from the brand pack. The user has confirmed they hold the licence. |
| Graphics | Official supplied files only. No logo, mesh gradient, track shape or pattern is recreated in code. |
| Reference | stemracing.com for structure and section patterns. |
| Hosting | Static site on Vercel, as now. |

## Brand rules the build must follow

Source: `STEM Racing Brand Guidelines V1.3`.

Colour (Secondary theme on a Carbon Shadow core; no blues or greens anywhere):

| Token | Hex |
|---|---|
| Carbon Shadow | `#05000B` |
| Carbon Shadow 70% tint | `#2E2347` |
| Carbon Shadow tints | `#261A3D`, `#5B5376`, `#A39FB8`, `#D7D6E3` |
| Ignite Indigo | `#312783` |
| Chicane Violet | `#961B81` |
| Pitlane Pink | `#E6007E` |
| Burnout Orange | `#ED6D05` |
| Podium Gold | `#FCBC00` |
| Light surface | `#F3F3F7` |

The tints and the light surface are sampled from the guide, which gives no hex values for them.

Gradients:

- Core background: Carbon Shadow to Carbon Shadow 70% tint.
- Secondary linear: Indigo, Violet, Pink, Orange, Gold. Used for the call to action band and accent rules.
- Heading: Violet, Pink, Orange, as in the guide's own headlines. Used to fill H2 text and numerals on dark surfaces. The violet stop sits at -15% so that every visible part of a heading has 3:1 contrast on Carbon Shadow.

Typography:

- H1 and H2: Magistral Bold Italic. Magistral is never used upright and never for paragraphs.
- H3 to H5: MachoModular Bold.
- Lead, body and small print: MachoModular. Small print is uppercase with letter spacing.
- Paragraphs are left aligned, never justified, never bold throughout.
- Verdana is not used as a named fallback. The fallback stack is `system-ui, sans-serif`.

Logo:

- Full colour white variant on dark backgrounds is the default. The header and footer use it.
- Mono white variant is used over any mesh gradient or photo.
- Minimum height 32px. The guide's minimum is 24px high and 70px wide; this lockup is 2.44 times as wide as it is high, so 32px is the smallest height that keeps it 70px wide.
- Clear space of half the logo height on all sides.
- No stretching, rotation, shadow, stroke or recolouring.
- The "Supported by Formula 1" lockup is not used. It requires explicit permission.

Graphic devices:

- Text tracks: the headline once in solid white, repeated in outline on either side. Three words at most.
- Gradients: the supplied "SR gradient", "Hot" and "Pink Orange" PNGs only.
- Track shapes: the supplied "Pink" and "Yellow" colour SVGs on dark surfaces, and the supplied "Black 1" SVG over the hero gradient.
- Patterns: the supplied "Jagged" PNG.

## Known gap in the brand pack

The guide specifies MachoModular Regular for body copy. The pack contains MachoModular Thin, Light, Medium and Bold only. The `Macho_*` files are a different family and are not used.

Until a Regular file is supplied, body copy uses MachoModular Medium. The `@font-face` block is written so that adding `MachoModular-Regular.woff2` and one rule switches body copy to Regular with no other change.

## Site map

Navigation order: Our School, Programme, Teams, Season, Resources, Support. The logo links home. The Event link appears only when the event is enabled.

### Home (`/`)

1. Hero. Full viewport height. "SR gradient" background, which is dark at the top and glows at the bottom, as on stemracing.com. Full colour white TBS lockup in the header, text track reading "Accelerating Futures", one lead sentence, and buttons to the Programme and Teams pages.
2. What STEM Racing is. Two short paragraphs on a light surface.
3. The journey. Three cards: Form a team, Design and make, Compete. Links to the Programme page.
4. TBS in numbers, on the "Hot" mesh gradient with Carbon Shadow text. The figures come from `site.json`.
5. Season status. Next timeline item and registration state, from the current season file.
6. Current teams. Up to three team cards.
7. Call to action band on the Secondary linear gradient.

### Our School (`/school`)

1. Text track header: "Our School". Every inner page opens with a text track on the "Pink Orange" mesh gradient, as the section pages of the guide do.
2. About The British School, New Delhi. Copy lives in `src/content/school/school.md`.
3. Why TBS runs STEM Racing.
4. Heritage timeline. One entry per TBS team since 2014, from `src/content/heritage/`.

Seed entries for the heritage timeline, taken from the "TBS Success" slide of the parent orientation deck. The selection letter to parents says that eight TBS teams have represented India at the World Finals, so each entry carries that note:

| Year | Team |
|---|---|
| 2014 | Team Ignite |
| 2018 | Team Impulse |
| 2019 | Team Stallion |
| 2020-21 | GDR |
| 2020-21 | Blaze |
| 2022 | Launchpad Racing |
| 2023 | Team Blaze |
| 2025 | SuperCharged |

### Programme (`/programme`)

1. Text track header: "Our Strategy".
2. The 12 Steps to Success, as a numbered grid: Form a team, Business and sponsorship, Design, Analyse, Make, Test, Pit booth, Scrutineering, Engineering judging, Verbal presentation, Portfolios, Race.
3. Team roles: Design and Engineering, Enterprise, Project Management.
4. What judges score.

### Teams (`/teams`)

Current season teams as cards (name, car name, category, members with roles, car image). Archived teams below under "Hall of fame". Results below that, as one table for each season.

### Season (`/season`)

Vertical timeline for the current season, sorted by date, with past items dimmed. A timeline item may have no date yet: it shows "Date to be confirmed" and keeps its written place, ahead of the next dated item written after it, or last when no dated item follows. Registration state, deadline and button. Once the deadline has passed the state is "Registration closed" and the button is removed. How selection works: form a team, submit a proposal booklet, interview.

### Resources (`/resources`)

Downloads grouped by category. Each item links out.

### Support (`/support`)

Three sections from the parent orientation deck: Coordinator's role (3 points), Mentor's role (3 points), Parents' support (6 points). Contacts below.

### Event (`/event`, optional)

Built only when `event.json` has `enabled: true`. Schedule, scrutineering information, what to bring, contact.

### Page not found (`/404`)

A text track and a link home.

## Architecture

Astro, TypeScript, plain CSS. No UI framework and no Tailwind. Work happens on a `rebuild` branch.

```
src/
  assets/brand/        logos, gradients, shapes, patterns (processed by Astro)
  content/             teams, seasons, results, resources, event, heritage, school, site, programme, support
  content.config.ts    schemas
  components/          one file per unit, listed below
  layouts/Base.astro   head, font preload, header, footer
  lib/                 logic with no Astro imports, one file for each concern, all unit tested
  scripts/             browser scripts: menu, motion, dates
  pages/               one file per route
  styles/
    tokens.css         colour, type scale, spacing, gradients
    fonts.css          @font-face rules
    global.css         reset and element defaults
public/
  fonts/               woff2 files
  favicon-32.png, favicon-192.png, apple-touch-icon.png
scripts/               asset preparation, font conversion, publish check
tests/                 unit tests and tests that read the built pages
```

### Components

| Component | Purpose | Inputs |
|---|---|---|
| `Header` | Logo and navigation, mobile menu | `variant`: `solid` or `overlay` |
| `Footer` | Logo, navigation, contacts, brand line | none |
| `Logo` | Renders the correct lockup file and enforces minimum size | `variant`: `colour-white`, `colour-black`, `mono-white`, `mono-black` |
| `TextTrack` | Headline text track | `text`, `as` (heading level) |
| `Section` | Vertical rhythm and surface | `surface`: `dark`, `light`, `gradient`, `mesh` |
| `Button` | Link styled as a button | `href`, `variant` |
| `StepCard` | One numbered step | `number`, `title`, `body` |
| `TeamCard` | One team | team entry |
| `Timeline` | Dated list | items, `dimPast` |
| `StatBand` | Row of figures | items |
| `RoleList` | Numbered points for the Support page | `title`, items |
| `SeasonStatus` | Season name, registration state and next item | season |

Each component owns its styles in a scoped `<style>` block and reads colours only from `tokens.css`.

### Content

Kept from the current site: `teams`, `seasons`, `results`, `resources`, `event`. Every schema is strict, so a misspelt or unknown field fails the build.

Seed content is of two kinds only: facts taken from TBS documents, and sample entries. A sample entry has `sample: true`, shows a "Sample entry" label on the page, and is listed by `npm run check:publish`. The invented teams, results, dates and links from the old site are not carried over. No student names and no personal email addresses are seeded.

New collections:

- `heritage`: `year` (string), `team` (string), `note` (optional string), `image` (optional).
- `school`: one Markdown file.
- `site`: one JSON file holding contacts, the address and the home page figures. This removes the hard-coded contacts from page files.
- `programme`: one JSON file holding the 12 steps, the team roles and the judged areas.
- `support`: one JSON file holding the coordinator, mentor and parent roles.

Changes to `teams`: the `colours` field is removed so team cards cannot introduce off-brand colours; `carName` is optional; `heroImage` is an image file beside the team file, which Astro resizes; `sample` is added. `category` stays `Development` or `Professional`.

Changes to `seasons`: `name` (for example "Season 9"), `registrationUrl`, and optional `date` and `registrationDeadline`.

### Assets

- Logos: the four supplied PNG files, cropped to the artwork and resized to 1200px wide. The supplied SVG files are not used: the mono SVGs hold live text that only renders with Magistral installed, and the full colour SVGs hold embedded pictures.
- Signifier PNG for the favicons and for team cards with no image.
- Gradients "SR gradient", "Hot" and "Pink Orange" converted to AVIF and WebP by Astro's image pipeline. The two mesh files lose the 2 pixel soft edge from their export.
- Fonts: Magistral Bold Italic and Medium Italic woff2 copied as supplied. MachoModular Light, Medium and Bold converted from OTF to woff2 with fontTools in a throwaway virtual environment. Magistral Bold Italic and MachoModular Medium are preloaded. All faces use `font-display: swap`. Metric-matched fallback faces hold the layout still while the brand fonts load.

## Behaviour

- Header is transparent over the hero and becomes solid Carbon Shadow after 80px of scroll.
- Text tracks drift horizontally on scroll by a small amount.
- Sections fade up once when they enter the viewport.
- All motion is disabled under `prefers-reduced-motion: reduce`.
- Dates are worked out again in the browser, so "Next up" and the dimmed items are right on the day the page is opened, not only on the day it was built.
- The site works with JavaScript disabled. Scripts add motion, the mobile menu toggle and the date refresh. Without JavaScript the header sits in the page flow with the navigation open, and the dates are as they were when the site was built.

## Accessibility and performance

- Body text contrast of at least 4.5:1. Pitlane Pink and Chicane Violet are not used for body text on dark surfaces. Gradient text is used for headings of 32px and above only.
- One `h1` per page, ordered headings, skip link, visible focus ring in Podium Gold.
- The repeated outline copies in a text track are `aria-hidden`.
- Targets: Lighthouse performance 90 or above on mobile, accessibility 100, no layout shift from fonts or images.

## Error handling

- Schema violations fail the build with the file and field named. Vercel keeps the previous deployment.
- A team without an image shows the signifier on a Carbon Shadow tile.
- If no season file exists, the Season page and home status block render a "Dates to be announced" state rather than failing.
- If no timeline item is in the future, the home status block shows the most recent item with "Season complete".

## Testing

- `npm run check` and `npm run build` pass with no warnings.
- Every route is opened in the preview at 375px, 768px and 1440px and checked for overflow and logo size.
- Reduced motion is checked with emulation.
- The event route is checked with `enabled` both true and false.
- A brand checklist is run against every page: fonts, italic Magistral only, palette, logo variant against its background, clear space.

## Out of scope

- CMS or admin interface.
- News or blog.
- Contact form. Contacts are shown as email links.
- Photography motion effect. Photos are used as supplied.
- Light theme toggle.

## What the user needs to supply after the build

- Real copy for the Our School page.
- Real team names, members and car images for 2026-27, to replace the two sample teams.
- Confirmed contacts, and email addresses if they should be shown.
- Dates for the Regional, National and World Finals.
- Confirmation that the eight heritage teams and the three home page figures are right.
- TBS documents for the Resources page.
- A MachoModular Regular font file.

## Changes made while planning

These were found while reading the brand pack and the TBS documents closely. Each one is folded into the sections above.

| Change | Reason |
|---|---|
| The hero uses the supplied "SR gradient" and the full colour logo, not the "Hot" mesh and the mono logo. | "SR gradient" is landscape and dark at the top, so the logo, navigation and headline all have strong contrast. It is the look of stemracing.com. White text fails contrast on the yellow parts of "Hot". |
| "Hot" is used for the figures band, with dark text. "Pink Orange" is the band at the top of every inner page. | White display type on "Pink Orange" passes 3:1, as in the guide's own section pages. |
| Logos come from the supplied PNG files. | The mono SVGs hold live text and the colour SVGs hold embedded pictures. |
| The smallest logo height is 32px, not 24px. | At 24px this lockup is 59px wide, under the guide's 70px minimum. |
| Tint values are sampled from the guide. | The guide prints no hex values for tints. |
| Seed content is limited to facts from TBS documents and labelled samples. | The old site's teams, results, dates and links were invented. Some contradict TBS's own documents. |
| A timeline item may have no date. | The dates of the Finals are not known yet, and inventing them would mislead students. |
| Dates are refreshed in the browser. | A static site is read for weeks after it is built. |
| Results are shown on the Teams page. | The first version of this spec kept the collection but gave it no page. |
| Every build reads the content from an empty store. | Astro keeps the last build's entries when a content folder is emptied, so a deleted team or season would have stayed on the site. |
| `programme` and `support` collections, `SeasonStatus` component, 404 page. | So the 12 steps and the role lists can be edited without touching code, and a broken link still lands on a branded page. |

## Changes made after the branch review

A fresh reviewer read the whole branch on 2026-09-27. These changes follow from that review. Each one is folded into the sections above.

| Change | Reason |
|---|---|
| A date must be on the calendar. | `2026-09-31` passed the check and showed as 1 October. |
| Registration shows as closed once the deadline has passed, and the Register button is removed. | The first version said late entries were accepted. No TBS document says so. |
| A timeline item with no date keeps its written place. | The date of the World Finals is often announced first. Under the old rule it jumped ahead of the Regional and National Finals. |
