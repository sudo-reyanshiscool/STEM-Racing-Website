import { describe, expect, it } from 'vitest';
import { daysWithoutChange, isHolidayWeek, streak, streakText, weekStart } from '../../../src/lib/dashboard/streak';

// 2026-09-28 is a Monday.
const TODAY = '2026-09-30';
const none: never[] = [];

describe('weeks', () => {
  it('start on Monday and end on Sunday', () => {
    expect(weekStart('2026-09-28')).toBe('2026-09-28');
    expect(weekStart('2026-09-30')).toBe('2026-09-28');
    expect(weekStart('2026-10-04')).toBe('2026-09-28');
    expect(weekStart('2026-10-05')).toBe('2026-10-05');
  });

  it('cross a month and a year', () => {
    expect(weekStart('2026-10-01')).toBe('2026-09-28');
    expect(weekStart('2027-01-01')).toBe('2026-12-28');
  });
});

describe('holiday weeks', () => {
  it('is one when every weekday is inside a holiday', () => {
    const holidays = [{ startsOn: '2026-10-19', endsOn: '2026-10-23' }];
    expect(isHolidayWeek('2026-10-19', holidays)).toBe(true);
  });

  it('is not one when a weekday is outside', () => {
    expect(isHolidayWeek('2026-10-19', [{ startsOn: '2026-10-19', endsOn: '2026-10-22' }])).toBe(false);
    expect(isHolidayWeek('2026-10-19', [{ startsOn: '2026-10-20', endsOn: '2026-10-25' }])).toBe(false);
    expect(isHolidayWeek('2026-10-19', none)).toBe(false);
  });

  it('can be covered by two holidays that meet', () => {
    const holidays = [
      { startsOn: '2026-10-17', endsOn: '2026-10-20' },
      { startsOn: '2026-10-21', endsOn: '2026-10-30' },
    ];
    expect(isHolidayWeek('2026-10-19', holidays)).toBe(true);
  });
});

describe('streaks', () => {
  it('is nothing with no activity', () => {
    expect(streak(none, none, TODAY)).toEqual({ current: 0, longest: 0 });
    expect(streakText(0)).toBe('No streak yet');
  });

  it('counts a week once, however many changes were made in it', () => {
    expect(streak(['2026-09-28', '2026-09-29', '2026-09-29', '2026-09-30'], none, TODAY)).toEqual({
      current: 1,
      longest: 1,
    });
    expect(streakText(1)).toBe('1 week streak');
  });

  it('counts weeks in a row, ending at this week', () => {
    expect(streak(['2026-09-14', '2026-09-23', '2026-09-28'], none, TODAY)).toEqual({ current: 3, longest: 3 });
    expect(streakText(3)).toBe('3 week streak');
  });

  it('is not broken by this week until the week is over', () => {
    expect(streak(['2026-09-14', '2026-09-23'], none, TODAY)).toEqual({ current: 2, longest: 2 });
    expect(streak(['2026-09-14', '2026-09-23'], none, '2026-10-04')).toEqual({ current: 2, longest: 2 });
    expect(streak(['2026-09-14', '2026-09-23'], none, '2026-10-05')).toEqual({ current: 0, longest: 2 });
  });

  it('is broken by a week with no change', () => {
    expect(streak(['2026-09-07', '2026-09-08', '2026-09-21', '2026-09-28'], none, TODAY)).toEqual({
      current: 2,
      longest: 2,
    });
  });

  it('keeps the longest streak when the current one is shorter', () => {
    const days = ['2026-08-03', '2026-08-10', '2026-08-17', '2026-08-24', '2026-09-28'];
    expect(streak(days, none, TODAY)).toEqual({ current: 1, longest: 4 });
  });

  it('is neither counted nor broken by a holiday week', () => {
    const holidays = [{ startsOn: '2026-09-21', endsOn: '2026-09-25' }];
    expect(streak(['2026-09-14', '2026-09-28'], holidays, TODAY)).toEqual({ current: 2, longest: 2 });
    expect(streak(['2026-09-14', '2026-09-28'], none, TODAY)).toEqual({ current: 1, longest: 1 });
  });

  it('counts a change made in a holiday week', () => {
    const holidays = [{ startsOn: '2026-09-21', endsOn: '2026-09-25' }];
    expect(streak(['2026-09-14', '2026-09-22', '2026-09-28'], holidays, TODAY)).toEqual({ current: 3, longest: 3 });
  });

  it('survives a holiday of several weeks', () => {
    const holidays = [{ startsOn: '2026-12-14', endsOn: '2027-01-01' }];
    expect(streak(['2026-12-07', '2027-01-05'], holidays, '2027-01-06')).toEqual({ current: 2, longest: 2 });
  });

  it('ignores a day in the future and a day that is not a date', () => {
    expect(streak(['2026-09-28', '2026-11-02', 'soon', ''], none, TODAY)).toEqual({ current: 1, longest: 1 });
  });

  it('takes days in any order', () => {
    expect(streak(['2026-09-28', '2026-09-14', '2026-09-23'], none, TODAY)).toEqual({ current: 3, longest: 3 });
  });
});

describe('days without a change', () => {
  it('counts from the last change to today', () => {
    expect(daysWithoutChange('2026-09-30', none, TODAY)).toBe(0);
    expect(daysWithoutChange('2026-09-16', none, TODAY)).toBe(14);
  });

  it('leaves out days inside a holiday', () => {
    const holidays = [{ startsOn: '2026-09-21', endsOn: '2026-09-25' }];
    expect(daysWithoutChange('2026-09-16', holidays, TODAY)).toBe(9);
  });

  it('is never below zero', () => {
    expect(daysWithoutChange('2026-10-05', none, TODAY)).toBe(0);
  });
});
