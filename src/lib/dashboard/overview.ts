// The mentor overview: one row for each team, with the teams that are behind first.
import { SCHOOL_TIME_ZONE } from '../season';
import type { Db } from './db';
import { DELIVERABLES } from './deliverables';
import {
  activityDaysByTeam,
  deliverableStatusesByTeam,
  listHolidays,
  listTeams,
  teamTotals,
  type Team,
} from './store';
import { daysWithoutChange, streak, type Holiday, type Streak } from './streak';
import { deliverableLines, type DeliverableLine } from './workspace';

/** A team with no change for this many days, holidays left out, is behind. */
export const IDLE_DAYS = 14;

export interface OverviewRow {
  team: Team;
  /** The ten deliverables with their statuses, for the grid strip. */
  lines: DeliverableLine[];
  doneCount: number;
  total: number;
  overdue: number;
  streak: Streak;
  /** YYYY-MM-DD. Null when the team has never made a change. */
  lastActive: string | null;
  behind: boolean;
  /** Why the team is behind, in words. Empty when it is not. */
  reasons: string[];
}

export function behindReasons(overdue: number, idleDays: number): string[] {
  const reasons: string[] = [];
  if (overdue > 0) reasons.push(overdue === 1 ? '1 task overdue' : `${overdue} tasks overdue`);
  if (idleDays >= IDLE_DAYS) reasons.push(`No change for ${idleDays} days`);
  return reasons;
}

export async function loadOverview(db: Db, today: string): Promise<OverviewRow[]> {
  const [teams, statuses, totals, days, holidays] = await Promise.all([
    listTeams(db),
    deliverableStatusesByTeam(db),
    teamTotals(db, today, SCHOOL_TIME_ZONE),
    activityDaysByTeam(db, SCHOOL_TIME_ZONE),
    listHolidays(db),
  ]);
  const rows = teams.map((team) => ({
    ...row(team, totals, days.get(team.id) ?? [], holidays, today),
    lines: deliverableLines(statuses.get(team.id) ?? {}),
  }));
  // listTeams gives open teams first, by name. Teams that are behind move to the front.
  return rows.sort((a, b) => Number(b.behind) - Number(a.behind));
}

function row(
  team: Team,
  totals: Awaited<ReturnType<typeof teamTotals>>,
  days: readonly string[],
  holidays: readonly Holiday[],
  today: string,
): Omit<OverviewRow, 'lines'> {
  const total = totals.find((entry) => entry.teamId === team.id);
  const overdue = total?.overdue ?? 0;
  const lastActive = days.at(-1) ?? null;
  // A team that has never made a change has been idle since the day it was made.
  const idleDays = daysWithoutChange(lastActive ?? total?.createdOn ?? today, holidays, today);
  // An archived team is closed, so nothing is expected of it.
  const reasons = team.archived ? [] : behindReasons(overdue, idleDays);
  return {
    team,
    doneCount: total?.doneCount ?? 0,
    total: DELIVERABLES.length,
    overdue,
    streak: streak(days, holidays, today),
    lastActive,
    behind: reasons.length > 0,
    reasons,
  };
}
