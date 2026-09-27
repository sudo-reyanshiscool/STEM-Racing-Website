import { describe, expect, it } from 'vitest';
import { formatDate, seasonView, sortTimeline, todayIso, type SeasonData } from '../../src/lib/season';
import { contentFiles, contentJson, page, texts } from '../helpers/site';

const seasonFile = contentFiles('seasons', '.json').at(-1);
const season = seasonFile ? contentJson<SeasonData>(`seasons/${seasonFile}`) : undefined;

describe('season', () => {
  const $ = page('/season');
  const sorted = sortTimeline(season?.timeline ?? []);

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

  it('only offers Register when registration is open, has a link and has not passed its deadline', () => {
    // The page was built a moment ago, so today is the day it was built.
    const expected = seasonView(season, todayIso()).canRegister ? 1 : 0;
    expect($('[data-season-status] a')).toHaveLength(expected);
    expect($('[data-season-status] [data-status="action"] a')).toHaveLength(expected);
  });
});
