// What the team workspace shows, worked out from rows and the season file. No Astro imports.
import { formatDate, SCHOOL_TIME_ZONE, seasonState, type SeasonData } from '../season';
import type { Db } from './db';
import { DELIVERABLES, type DeliverableKey, type Status } from './deliverables';
import {
  activityDays,
  deliverableStatuses,
  getNote,
  listAnnouncements,
  listHolidays,
  listLinks,
  listMentorNotes,
  listTasks,
  type Announcement,
  type Link,
  type MentorNote,
  type Task,
} from './store';
import { streak, type Streak } from './streak';

export interface Deadline {
  title: string;
  /** "2 October 2026" or "Date to be confirmed". */
  when: string;
  /** "12 days left". Empty when the date is not confirmed. */
  left: string;
}

export interface DeliverableLine {
  key: DeliverableKey;
  label: string;
  status: Status;
}

export interface TaskLine extends Task {
  overdue: boolean;
}

/** How many announcements the workspace shows until the team asks for the rest. */
export const ANNOUNCEMENTS_SHOWN = 5;

export interface Workspace {
  streak: Streak;
  announcements: Announcement[];
  /** How many older announcements are not shown. */
  moreAnnouncements: number;
  mentorNotes: MentorNote[];
  deadline: Deadline | undefined;
  deliverables: DeliverableLine[];
  doneCount: number;
  tasks: TaskLine[];
  /** Tasks that are not ticked off. */
  openTasks: number;
  /** Open tasks that are past their due date. */
  overdueCount: number;
  note: string;
  links: Link[];
}

const DAY = 24 * 60 * 60 * 1000;

/** Whole days from one YYYY-MM-DD date to another. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);
}

export function daysLeftText(days: number): string {
  if (days <= 0) return 'Today';
  return days === 1 ? '1 day left' : `${days} days left`;
}

/** The next item in the season timeline. Undefined when there is no season or it is over. */
export function nextDeadline(season: SeasonData | undefined, today: string): Deadline | undefined {
  const state = seasonState(season, today);
  if (state.kind === 'unscheduled') return { title: state.item.title, when: 'Date to be confirmed', left: '' };
  if (state.kind !== 'upcoming' || state.item.date === undefined) return undefined;
  return {
    title: state.item.title,
    when: formatDate(state.item.date),
    left: daysLeftText(daysBetween(today, state.item.date)),
  };
}

export function isOverdue(task: Pick<Task, 'done' | 'dueDate'>, today: string): boolean {
  return !task.done && task.dueDate !== null && task.dueDate < today;
}

/** Mentor tasks first. Inside each group by due date, with undated tasks last, then oldest first. */
export function sortTasks<T extends Pick<Task, 'id' | 'dueDate' | 'createdBy'>>(tasks: readonly T[]): T[] {
  return [...tasks].sort((a, b) => {
    if (a.createdBy !== b.createdBy) return a.createdBy === 'mentor' ? -1 : 1;
    if (a.dueDate !== b.dueDate) {
      if (a.dueDate === null) return 1;
      if (b.dueDate === null) return -1;
      return a.dueDate < b.dueDate ? -1 : 1;
    }
    return a.id - b.id;
  });
}

export function deliverableLines(statuses: Partial<Record<DeliverableKey, Status>>): DeliverableLine[] {
  return DELIVERABLES.map((item) => ({ ...item, status: statuses[item.key] ?? 'not_started' }));
}

export async function loadWorkspace(
  db: Db,
  teamId: number,
  season: SeasonData | undefined,
  today: string,
  options: { allAnnouncements?: boolean } = {},
): Promise<Workspace> {
  const [statuses, tasks, note, links, announcements, mentorNotes, days, holidays] = await Promise.all([
    deliverableStatuses(db, teamId),
    listTasks(db, teamId),
    getNote(db, teamId),
    listLinks(db, teamId),
    listAnnouncements(db, teamId, SCHOOL_TIME_ZONE),
    listMentorNotes(db, teamId, SCHOOL_TIME_ZONE),
    activityDays(db, teamId, SCHOOL_TIME_ZONE),
    listHolidays(db),
  ]);
  const deliverables = deliverableLines(statuses);
  const shown = options.allAnnouncements ? announcements : announcements.slice(0, ANNOUNCEMENTS_SHOWN);
  const lines = sortTasks(tasks).map((task) => ({ ...task, overdue: isOverdue(task, today) }));
  return {
    streak: streak(days, holidays, today),
    announcements: shown,
    moreAnnouncements: announcements.length - shown.length,
    mentorNotes,
    deadline: nextDeadline(season, today),
    deliverables,
    doneCount: deliverables.filter((line) => line.status === 'done').length,
    tasks: lines,
    openTasks: lines.filter((task) => !task.done).length,
    overdueCount: lines.filter((task) => task.overdue).length,
    note,
    links,
  };
}
