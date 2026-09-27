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
