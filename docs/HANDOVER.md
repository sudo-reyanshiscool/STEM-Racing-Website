# Hand-over: TBS STEM Racing rebuild

## Team dashboard, stage 1

Added on the branch `team-dashboard`. The spec is `docs/superpowers/specs/2026-09-27-team-dashboard-design.md` and the plan is `docs/superpowers/plans/2026-09-27-team-dashboard-stage-1.md`.

- The site now uses the Vercel adapter. The public pages are still built ahead of time, into `dist/client/`.
- Pages under `/dashboard` are rendered on request and need the four settings in the README.
- Stages 2 and 3 were added on 2026-09-28: the mentor overview, mentor notes, announcements, posting a task to every team, holidays and streaks. They were built straight from the spec, with no plan document. The tests are in `tests/dashboard/stage2.test.ts` and `tests/unit/dashboard/streak.test.ts`.
- A security review on 2026-09-28 found four important faults. All four are fixed. Its three minor findings: two are fixed, and one stands: refreshing the page that shows a new code sends the form again, after the browser asks.
- On 2026-09-28 the live dashboard hung, and sign-in with it. The cause: a page asks several things of the database at once, and statements sent together down one connection to Supabase's pooler are never answered. The stuck connection then held up every later request. `src/lib/dashboard/db.ts` now asks one statement at a time, gives each 5 seconds, and asks once more on a new connection. A first attempt at a fix, which only added the 5 seconds, made the mentor page show "unavailable" and was live for about 15 minutes.
- The dashboard has not had a visual design pass. The user wants one.

Written 2026-09-27. This one file replaces the session summary, the review report and the notes that were spread across the workspace. Read this first, then the ledger if you need the detail.

## Update after the fix pass

Findings 4–8 were completed on 2026-09-27. The review now has no open Critical or Important findings.

| # | Fix | Commit |
|---|---|---|
| 4 | Prevent narrow team cards and timeline entries from overflowing | `588f32f` |
| 5 | Derive the World Finals count from World Finals result entries | `c41f1fb` |
| 6 | Make the optional MachoModular Regular switch safe | `7679287` |
| 7 | Pin the reviewed invariants with broader automated coverage | `ef2ee8f` |
| 8 | Enforce the logo clear-space dimensions | `39c0506` |

Final verification: `npm run check` reports 0 errors, warnings and hints; 190 unit tests pass; 212 site tests pass and 9 event-state tests are skipped while the event is off. At 375px, the Teams and Season pages have no horizontal overflow. At 1440px, the header is 112px high and both header and footer logos are 56px high.

## Where things are

| What | Where |
|---|---|
| The rebuilt site | Branch `rebuild`. `main` is unchanged at `9e52817`. Nothing is pushed or merged. |
| Spec (the authority) | `docs/superpowers/specs/2026-09-27-tbs-stem-racing-rebuild-design.md` |
| Plan (15 tasks, all done) | `docs/superpowers/plans/2026-09-27-tbs-stem-racing-rebuild.md` |
| Guide for editors | `README.md` |
| Ledger of every task and ruling | `.superpowers/sdd/2026-09-27-tbs-stem-racing-rebuild/progress.md` (not in git) |
| Task briefs and logs beside the ledger | Copies of plan sections and test output. Scratch. Safe to delete when the branch is finished. |
| Brand pack, brand guide, TBS documents | Paths are in the project memory, `brand-pack-locations` |

## State on 2026-09-27

- All 15 plan tasks are committed. A fresh reviewer then read the whole branch. All eight Important findings selected for the fix pass are fixed and committed.
- Working tree clean after the fix pass. Last implementation commit: `39c0506`.
- `npm run check`: 0 errors, 0 warnings, 0 hints.
- `npm test`: 190 unit tests pass.
- `npm run test:site`: 8 pages built, 212 tests pass, 9 skipped. The 9 are the event on/off split.

Measured after Task 15, before the review fixes:

| Check | Result |
|---|---|
| Build warnings | 0 |
| Empty states, with no teams, season or results | 6 of 6 messages shown |
| Layout at 375, 768 and 1440 wide, 8 pages | 24 of 24 as expected: no sideways scroll, one `h1`, logo 44 by 108 or 56 by 137 |
| Phone menu, scripts off, header on scroll, date refresh | As expected |
| Reduced motion | Nothing moves or hides. Checked in headless Chrome with `--force-prefers-reduced-motion`, because the browser pane has no switch. |
| Lighthouse, mobile, 8 pages | Performance 99 to 100, accessibility 100, layout shift 0. `/404` was scored in place of a missing address, which Lighthouse refuses. |

## Viewing the site

- `astro-preview` in `.claude/launch.json` serves this branch's build on port 4322.
- Port 2026 is a server another session started. It serves an older prototype from a temporary folder, so it does not show changes made on the branch.
- `rebuild-preview` in `.claude/launch.json` still points at that temporary folder. Point it at the repository when the user agrees to restart port 2026.

## Review findings

Verdict: ready to merge with fixes. No critical issues.

### Fixed

| # | Finding | Commit |
|---|---|---|
| 1 | A date such as `2026-09-31` passed the check and showed as 1 October. `2026-13-45` stopped the build and named no file. | `f01d2fa` |
| 2 | After the deadline the site said late entries were accepted and kept the Register button. It now says "Registration closed" and the date script removes the button. | `3f3b472` |
| 3 | With a date on the World Finals only, it jumped ahead of the Regional and National Finals. An item with no date now keeps its written place. | `67e123e` |

### Fixed after the hand-over was resumed

The briefs below are retained as a record of what each completed fix addressed.

**4. A long link clips a team card on phones.**
- Seen at 375 wide: a team body 423px wide inside a 354px card, so the roles are cut off. A long unbroken word in a timeline item made the page 654px wide.
- Fix: `overflow-wrap: anywhere` on `body` and `overflow-wrap: normal` on `.table` in `src/styles/global.css`. `grid-template-columns: minmax(0, 1fr)` on `.team` and `.timeline__item`, and `13rem minmax(0, 1fr)` for the timeline from 48rem.
- Tests: two rule checks in `tests/unit/tokens.test.ts`, and a new `tests/site/layout.test.ts` that reads the built CSS.

**5. The World Finals count is the number of heritage files.**
- `src/pages/school.astro` and `src/pages/teams.astro` print `heritage.length`. A heritage entry for a team that stopped at the National Finals makes the sentence wrong.
- Fix: count results whose `event` is `World Finals`, in a new function in `src/lib/results.ts`. Leave the sentence out when the count is 0. Write "once" for 1.

**6. The README's font switch stops the build.**
- In `src/styles/fonts.css` one comment holds both the explanation and the Regular rule. Removing its marks leaves prose in the CSS.
- After a correct edit two tests fail: the MachoModular weights in `tests/unit/tokens.test.ts` and the list of font files in `tests/unit/assets.test.ts`.
- Fix: put the rule in a comment of its own, between two lines that say "delete this line". Let both tests accept Regular when its file is present.

**7. The tests pin less than the plan says.** Each change below passed every check.

| Change that went unnoticed | Test to add |
|---|---|
| Removing the `dates.ts` import in `Base.astro` | Every page ships the date script. `tests/site/dates-script.test.ts` already runs the script against built pages. |
| Removing `context.store.clear()` in `src/content.config.ts` | Build a copy, delete content, build again. `tests/helpers/sandbox.ts` does the copying. |
| Removing `overflow-wrap: anywhere` | Covered by fix 4 |
| Making nine schemas accept unknown fields | One unknown-field case for each schema |
| Hiding the navigation without the `js` class | In built CSS, every rule that hides the navigation needs `.js` |
| Removing all reduced-motion handling | Check what the media block holds, and run `motion.ts` with reduced motion on |
| Rewording the footer tagline | Check the footer text on every page |
| Adding `#1e90ff` or `green` to a component | Every colour in built CSS is a token |
| A shadow or rotation on the logo's link | Check the logo's parents |

Also: `/event` is never in `ROUTES`, so it gets no structure or brand tests when switched on. `tests/site/home.test.ts` and `tests/site/season.test.ts` throw when there is no season file.

**8. The logo's clear space is short.**
- The brand guide, page 11, asks for half the logo height on every side. A 56px logo in a 96px header has 20px where 28px is needed. On phones, 16px where 22px is needed.
- Fix: `--header-h` of `7rem`, and `5.5rem` on phones, in `src/styles/tokens.css`. `padding-block: calc(var(--logo-h) / 2)` on `.site-header__home`. A gutter of at least `1.375rem`. The footer logo takes the header's sizes.
- This is the only open fix a visitor would see: the header grows by 16px, or 12px on phones.

### Kept as it is

**9. Full colour logo over the hero gradient.** Page 10 of the guide says never to use the full colour logo over a gradient. The code stands, because the guide's own "full colour white" example sits on the same dark gradient, and the logo sits on the dark top of the hero. To change it, show the mono white logo while the header is clear. The user can overrule this.

### Minor findings, not fixed

1. If the script file fails to load, the phone menu stays shut. The footer links still work.
2. `npm run check:publish` misses `sample: True`, `sample: true # note` and `example.com` email addresses.
3. Two season files with the same `year` build, and one is ignored. `2026-26` passes as a year label.
4. A heritage `image` is accepted and never shown.
5. The page tests read content files with a simple pattern, so a quoted name in a team file fails a test while the site is right.
6. `rebuild-preview` serves the temporary prototype. See "Viewing the site".
7. With scripts off on a phone the sticky header is 172px tall.
8. The footer year is set when the site is built.
9. The large outlined headlines use title case ("Our Teams"). The guide's own use sentence case ("Our logos").
10. A link may be `//host`, `https://` alone or `mailto:` alone.
11. No empty state for an event with no schedule or list, or a site with no contacts.
12. Resource groups whose names differ only by case share an id. A name in another script gets an empty id.
13. README: `src/lib/content.ts` has no unit test, image formats are not stated, and the example date for the Regional Finals could be copied as real.
14. Each headline puts 16 copies of its text in the page, so find-in-page picks them up.
15. `main` shows a focus ring around the whole page after the skip link.
16. At 320 by 568 the hero headline passes under the clear header between 51px and 80px of scroll.
17. Every results table is a tab stop, even when it does not scroll.

### Set aside by the reviewer, with my ruling

| Matter | Ruling |
|---|---|
| Licence to commit the fonts and artwork | Stands. The user confirmed they hold the licence. Check it covers a public repository before making this one public. |
| Production domain, and the repository having no git remote | For the user. A remote is needed before Vercel can build from `main`. |
| Safari below 16.4 gets the phone layout at every width | Stands. The built CSS uses a newer form of media query. A CSS target in the build settings would change this. |
| Sitemap, robots file, share image, security headers, print styles | Stands. Not in the spec. Printing with scripts on can leave sections blank. |
| Whether the sampled tint values match the guide | For the user's eye. |
| "Formerly known as F1 in Schools" | Stands. The guide restricts the Formula 1 lockup, not this phrase. |
| `astro dev`: a folder that starts empty misses its first file until restart | Stands. It is how Astro works. |
| "This season" lists teams by `status`, not by `season` | Stands. The README says so. |

## Decisions made for the user

| When | Decision | Cost if wrong |
|---|---|---|
| Setup | Work in place on `rebuild`, with no separate worktree | The checkout sits on `rebuild` until switched back |
| Setup | Keep the `rebuild-preview` launch entry, as the user said | One stale entry |
| Setup | Write each file by copying its code block from the plan | None: the tests catch a bad copy |
| Task 1 | Remove two ignored `.DS_Store` files that `git rm` left behind | None |
| Task 5 | Write 28 content files, as the steps say, not 27 as the header says | None |
| Task 13 | One extra test run with the event on, to see the test fail first | One test run |
| Task 15 | Run the header check with a cap on each wait, after fronting the tab | None |
| Task 15 | Check reduced motion in headless Chrome | None |
| Task 15 | Score all eight pages with Lighthouse, and take screenshots | None |
| Review | Keep the full colour logo over the hero (finding 9) | A strict reading of page 10 of the guide |
| Review | Registration closes after the deadline (finding 2) | If TBS takes late entries, an editor deletes the deadline line |
| Review | An item with no date keeps its written place (finding 3) | An editor who wants it last must write it last |
| Review | Make the header twice the logo height (finding 8). Decided, not yet done. | A header 16px taller |
| Review | Add `happy-dom` for tests | One more test package. Nothing ships to visitors. |

## For the user

**Sample content.** Two teams and the event are samples. Each shows a gold "Sample entry" label. `npm run check:publish` lists them.

**To confirm before going public:**
- The eight teams on the Our School page each represented India at the World Finals, in the years shown.
- The three figures on the home page: 8 teams, 9 seasons, 50+ countries.
- Ms Sonica Puri's name and title, and whether any contact should show an email address.
- The Our School copy, including "around 1,270 students from 60 nationalities".

**To supply:** the Season 9 teams with permission to publish names, the dates of the Finals, TBS documents for the Resources page, and a MachoModular Regular font file.

**To go live:** replace or remove the sample content, confirm the factual items above, merge `rebuild` into `main`, and push. Vercel builds from `main`.

## Working rules

- Never push, merge or commit to `main`.
- Ask the user where a file is. Do not search the web or their home folders for brand material.
- Content is a fact from a TBS document, or an entry marked `sample: true`. No student names and no personal email addresses in seed content.
- Start servers with the preview tool and a name from `.claude/launch.json`.
- The shell is zsh: a pattern that matches nothing stops the whole command, so name files in full.

## To resume

The review fix pass is complete. Continue with real content and launch preparation; do not merge or push without the user's request.
