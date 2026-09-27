// Work streaks. A week runs from Monday to Sunday and counts when the team made one change or
// more in it. No database and no Astro imports: days go in as YYYY-MM-DD in the school's time.
import { isIsoDate } from './fields';

export interface Holiday {
  /** YYYY-MM-DD, the first day of the holiday. */
  startsOn: string;
  /** YYYY-MM-DD, the last day of the holiday. */
  endsOn: string;
}

export interface Streak {
  /** Counted weeks in a row, ending at this week or the last one. */
  current: number;
  longest: number;
}

const DAY = 24 * 60 * 60 * 1000;

function shift(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
}

/** The Monday of the week a day falls in. */
export function weekStart(day: string): string {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
  return shift(day, weekday === 0 ? -6 : 1 - weekday);
}

function inHoliday(day: string, holidays: readonly Holiday[]): boolean {
  return holidays.some((holiday) => holiday.startsOn <= day && day <= holiday.endsOn);
}

/** A week in which every weekday, Monday to Friday, falls inside a holiday. */
export function isHolidayWeek(monday: string, holidays: readonly Holiday[]): boolean {
  return [0, 1, 2, 3, 4].every((offset) => inHoliday(shift(monday, offset), holidays));
}

export function streak(days: readonly string[], holidays: readonly Holiday[], today: string): Streak {
  const thisWeek = weekStart(today);
  const active = new Set(days.filter((day) => isIsoDate(day) && day <= today).map(weekStart));
  if (active.size === 0) return { current: 0, longest: 0 };

  const first = [...active].sort()[0] ?? thisWeek;
  let longest = 0;
  let run = 0;
  for (let week = first; week <= thisWeek; week = shift(week, 7)) {
    if (active.has(week)) run += 1;
    // A holiday week neither counts nor breaks. This week does not break until it is over.
    else if (!isHolidayWeek(week, holidays) && week !== thisWeek) run = 0;
    longest = Math.max(longest, run);
  }
  return { current: run, longest };
}

export function streakText(weeks: number): string {
  return weeks === 0 ? 'No streak yet' : `${weeks} week streak`;
}

/** Days from the last change to today, leaving out the days inside a holiday. */
export function daysWithoutChange(lastChange: string, holidays: readonly Holiday[], today: string): number {
  let count = 0;
  for (let day = shift(lastChange, 1); day <= today; day = shift(day, 1)) {
    if (!inHoliday(day, holidays)) count += 1;
  }
  return count;
}
