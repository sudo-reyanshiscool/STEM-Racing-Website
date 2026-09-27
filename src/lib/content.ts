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
