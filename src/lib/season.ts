import { getCollection, type CollectionEntry } from 'astro:content';

export type Season = CollectionEntry<'seasons'>;
export type TimelineItem = Season['data']['timeline'][number];

/** Seasons sorted newest first by their year label, e.g. "2026-27" before "2025-26". */
export async function getSeasonsNewestFirst(): Promise<Season[]> {
  const seasons = await getCollection('seasons');
  return seasons.sort((a, b) => b.data.year.localeCompare(a.data.year));
}

/** The current season is the one with the most recent year label. */
export async function getCurrentSeason(): Promise<Season | undefined> {
  const seasons = await getSeasonsNewestFirst();
  return seasons[0];
}

/** The first timeline item whose date is today or later. */
export function nextTimelineItem(season: Season, today = new Date()): TimelineItem | undefined {
  const start = new Date(today.toISOString().slice(0, 10));
  return [...season.data.timeline]
    .sort((a, b) => a.date.localeCompare(b.date))
    .find((item) => new Date(item.date) >= start);
}

/** "2026-10-02" becomes "2 October 2026". */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function isPast(iso: string, today = new Date()): boolean {
  return new Date(iso) < new Date(today.toISOString().slice(0, 10));
}
