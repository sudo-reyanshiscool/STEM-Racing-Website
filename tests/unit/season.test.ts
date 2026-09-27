import { describe, expect, it } from 'vitest';
import {
  formatDate,
  isPast,
  pickCurrentSeason,
  registrationText,
  seasonHeading,
  seasonState,
  seasonView,
  sortTimeline,
  todayIso,
  type SeasonData,
} from '../../src/lib/season';

const season: SeasonData = {
  year: '2026-27',
  name: 'Season 9',
  registrationOpen: false,
  timeline: [
    { title: 'Regional Finals', description: '' },
    { date: '2026-09-16', title: "Parents' briefing", description: '' },
    { date: '2026-09-03', title: 'Interview invitations', description: '' },
    { title: 'National Finals', description: '' },
  ],
};

describe('todayIso', () => {
  it('uses the school time zone, not the time zone of the build server', () => {
    // 20:00 UTC on 27 September is 01:30 on 28 September in New Delhi.
    expect(todayIso(new Date('2026-09-27T20:00:00Z'))).toBe('2026-09-28');
  });

  it('pads months and days', () => {
    expect(todayIso(new Date('2027-01-05T06:00:00Z'))).toBe('2027-01-05');
  });
});

describe('formatDate', () => {
  it('writes dates the British way', () => {
    expect(formatDate('2026-09-16')).toBe('16 September 2026');
  });
});

describe('isPast', () => {
  it('is true for a date before today', () => {
    expect(isPast('2026-09-16', '2026-09-27')).toBe(true);
  });

  it('is false for today and for later dates', () => {
    expect(isPast('2026-09-27', '2026-09-27')).toBe(false);
    expect(isPast('2027-01-23', '2026-09-27')).toBe(false);
  });

  it('is false when there is no date', () => {
    expect(isPast(undefined, '2026-09-27')).toBe(false);
    expect(isPast('', '2026-09-27')).toBe(false);
  });
});

describe('sortTimeline', () => {
  it('puts dated items first in date order, then undated items in written order', () => {
    expect(sortTimeline(season.timeline).map((item) => item.title)).toEqual([
      'Interview invitations',
      "Parents' briefing",
      'Regional Finals',
      'National Finals',
    ]);
  });

  it('does not change the list it is given', () => {
    const before = season.timeline.map((item) => item.title);
    sortTimeline(season.timeline);
    expect(season.timeline.map((item) => item.title)).toEqual(before);
  });
});

describe('pickCurrentSeason', () => {
  it('picks the latest year label', () => {
    expect(pickCurrentSeason([{ year: '2025-26' }, { year: '2026-27' }, { year: '2024-25' }])).toEqual({
      year: '2026-27',
    });
  });

  it('returns undefined when there are no seasons', () => {
    expect(pickCurrentSeason([])).toBeUndefined();
  });
});

describe('seasonState', () => {
  it('reports the next dated item', () => {
    expect(seasonState(season, '2026-09-10')).toEqual({
      kind: 'upcoming',
      item: { date: '2026-09-16', title: "Parents' briefing", description: '' },
    });
  });

  it('counts an item dated today as upcoming', () => {
    expect(seasonState(season, '2026-09-16').kind).toBe('upcoming');
  });

  it('falls back to the first undated item once every dated item has passed', () => {
    expect(seasonState(season, '2026-09-27')).toEqual({
      kind: 'unscheduled',
      item: { title: 'Regional Finals', description: '' },
    });
  });

  it('reports the most recent item when the season is over', () => {
    const finished: SeasonData = { ...season, timeline: season.timeline.filter((item) => item.date) };
    expect(seasonState(finished, '2027-06-01')).toEqual({
      kind: 'complete',
      item: { date: '2026-09-16', title: "Parents' briefing", description: '' },
    });
  });

  it('reports none for a missing season and for an empty timeline', () => {
    expect(seasonState(undefined, '2026-09-27')).toEqual({ kind: 'none' });
    expect(seasonState({ ...season, timeline: [] }, '2026-09-27')).toEqual({ kind: 'none' });
  });
});

describe('seasonHeading', () => {
  it('leads with the season name when there is one', () => {
    expect(seasonHeading(season)).toBe('Season 9 · 2026-27');
  });

  it('uses the year alone when there is no name', () => {
    expect(seasonHeading({ ...season, name: undefined })).toBe('Season 2026-27');
  });
});

describe('registrationText', () => {
  const open: SeasonData = { ...season, registrationOpen: true, registrationDeadline: '2026-10-02' };

  it('says closed', () => {
    expect(registrationText(season, '2026-09-27')).toBe('Registration closed');
  });

  it('gives the deadline while it is ahead', () => {
    expect(registrationText(open, '2026-09-27')).toBe('Registration open until 2 October 2026');
    expect(registrationText(open, '2026-10-02')).toBe('Registration open until 2 October 2026');
  });

  it('never shows a deadline that has passed', () => {
    expect(registrationText(open, '2026-10-03')).toBe('Registration open, late entries accepted');
  });

  it('works without a deadline', () => {
    expect(registrationText({ ...open, registrationDeadline: undefined }, '2026-09-27')).toBe('Registration open');
  });
});

describe('seasonView', () => {
  it('shows a future item as next, even when the site was built weeks earlier', () => {
    // Built on 10 September, opened on 27 September: the briefing has passed by then.
    expect(seasonView(season, '2026-09-10').nextTitle).toBe("Parents' briefing");
    expect(seasonView(season, '2026-09-27')).toEqual({
      heading: 'Season 9 · 2026-27',
      nextLabel: 'Next up',
      nextTitle: 'Regional Finals',
      nextDate: 'Date to be confirmed',
      registration: 'Registration closed',
      canRegister: false,
    });
  });

  it('formats the date of a dated item', () => {
    expect(seasonView(season, '2026-09-10').nextDate).toBe('16 September 2026');
  });

  it('shows Season complete with the most recent item', () => {
    const finished: SeasonData = { ...season, timeline: season.timeline.filter((item) => item.date) };
    const view = seasonView(finished, '2027-06-01');
    expect(view.nextLabel).toBe('Season complete');
    expect(view.nextTitle).toBe("Parents' briefing");
    expect(view.nextDate).toBe('16 September 2026');
  });

  it('shows Dates to be announced when there is no season', () => {
    const view = seasonView(undefined, '2026-09-27');
    expect(view.nextLabel).toBe('Dates to be announced');
    expect(view.canRegister).toBe(false);
  });

  it('only offers the Register button when registration is open and a link exists', () => {
    expect(seasonView({ ...season, registrationOpen: true }, '2026-09-27').canRegister).toBe(false);
    expect(
      seasonView({ ...season, registrationOpen: true, registrationUrl: 'https://example.org/form' }, '2026-09-27')
        .canRegister,
    ).toBe(true);
    expect(
      seasonView({ ...season, registrationUrl: 'https://example.org/form' }, '2026-09-27').canRegister,
    ).toBe(false);
  });
});
