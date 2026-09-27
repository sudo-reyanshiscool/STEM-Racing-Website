// What the team workspace shows, worked out from rows and the season file. No Astro imports.
import { formatDate, seasonState, type SeasonData } from '../season';
import type { Db } from './db';
import { DELIVERABLES, type DeliverableKey, type Status } from './deliverables';
import { deliverableStatuses, getNote, listLinks, listTasks, type Link, type Task } from './store';

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

export interface Workspace {
  deadline: Deadline | undefined;
  deliverables: DeliverableLine[];
  doneCount: number;
  tasks: TaskLine[];
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
): Promise<Workspace> {
  const [statuses, tasks, note, links] = await Promise.all([
    deliverableStatuses(db, teamId),
    listTasks(db, teamId),
    getNote(db, teamId),
    listLinks(db, teamId),
  ]);
  const deliverables = deliverableLines(statuses);
  return {
    deadline: nextDeadline(season, today),
    deliverables,
    doneCount: deliverables.filter((line) => line.status === 'done').length,
    tasks: sortTasks(tasks).map((task) => ({ ...task, overdue: isOverdue(task, today) })),
    note,
    links,
  };
}
