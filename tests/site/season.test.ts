import { describe, expect, it } from 'vitest';
import { formatDate, sortTimeline, type SeasonData } from '../../src/lib/season';
import { contentFiles, contentJson, page, texts } from '../helpers/site';

const season = contentJson<SeasonData>(`seasons/${contentFiles('seasons', '.json').at(-1)}`);

describe('season', () => {
  const $ = page('/season');
  const sorted = sortTimeline(season.timeline);

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

  it('only offers Register when registration is open and has a link', () => {
    const expected = season.registrationOpen && season.registrationUrl ? 1 : 0;
    expect($('[data-season-status] a')).toHaveLength(expected);
  });
});
