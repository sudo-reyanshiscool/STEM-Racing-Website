import { describe, expect, it } from 'vitest';
import type { SeasonData } from '../../../src/lib/season';
import {
  daysBetween,
  daysLeftText,
  deliverableLines,
  isOverdue,
  nextDeadline,
  sortTasks,
} from '../../../src/lib/dashboard/workspace';

const season = (timeline: SeasonData['timeline']): SeasonData => ({
  year: '2026-27',
  registrationOpen: false,
  timeline,
});

describe('days', () => {
  it('counts whole days, across a month and a leap day', () => {
    expect(daysBetween('2026-09-28', '2026-09-28')).toBe(0);
    expect(daysBetween('2026-09-28', '2026-10-02')).toBe(4);
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
  });

  it('says how long is left', () => {
    expect(daysLeftText(0)).toBe('Today');
    expect(daysLeftText(1)).toBe('1 day left');
    expect(daysLeftText(12)).toBe('12 days left');
  });
});

describe('the next deadline', () => {
  it('is the first item dated today or later', () => {
    const data = season([
      { date: '2026-09-16', title: 'Briefing', description: '' },
      { date: '2026-10-02', title: 'Portfolio draft', description: '' },
      { date: '2026-11-20', title: 'Regional Finals', description: '' },
    ]);
    expect(nextDeadline(data, '2026-09-28')).toEqual({
      title: 'Portfolio draft',
      when: '2 October 2026',
      left: '4 days left',
    });
    expect(nextDeadline(data, '2026-10-02')).toEqual({ title: 'Portfolio draft', when: '2 October 2026', left: 'Today' });
    expect(nextDeadline(data, '2026-10-03')?.title).toBe('Regional Finals');
  });

  it('is the next undated item when no later item has a date', () => {
    const data = season([
      { date: '2026-09-16', title: 'Briefing', description: '' },
      { title: 'Regional Finals', description: '' },
    ]);
    expect(nextDeadline(data, '2026-09-28')).toEqual({
      title: 'Regional Finals',
      when: 'Date to be confirmed',
      left: '',
    });
  });

  it('is nothing with no season, an empty timeline or a season that is over', () => {
    expect(nextDeadline(undefined, '2026-09-28')).toBeUndefined();
    expect(nextDeadline(season([]), '2026-09-28')).toBeUndefined();
    expect(nextDeadline(season([{ date: '2026-09-16', title: 'Briefing', description: '' }]), '2026-09-28')).toBeUndefined();
  });
});

describe('tasks', () => {
  it('is overdue the day after it was due, unless it is done', () => {
    expect(isOverdue({ done: false, dueDate: '2026-09-28' }, '2026-09-28')).toBe(false);
    expect(isOverdue({ done: false, dueDate: '2026-09-28' }, '2026-09-29')).toBe(true);
    expect(isOverdue({ done: true, dueDate: '2026-09-28' }, '2026-09-29')).toBe(false);
    expect(isOverdue({ done: false, dueDate: null }, '2026-09-29')).toBe(false);
  });

  it('puts mentor tasks first, then sorts by date with undated tasks last', () => {
    const sorted = sortTasks([
      { id: 1, dueDate: null, createdBy: 'team' },
      { id: 2, dueDate: '2026-10-05', createdBy: 'team' },
      { id: 3, dueDate: '2026-11-01', createdBy: 'mentor' },
      { id: 4, dueDate: '2026-10-01', createdBy: 'team' },
      { id: 5, dueDate: null, createdBy: 'mentor' },
      { id: 6, dueDate: '2026-10-01', createdBy: 'team' },
    ] as const);
    expect(sorted.map((task) => task.id)).toEqual([3, 5, 4, 6, 2, 1]);
  });

  it('leaves the list it was given as it was', () => {
    const tasks = [
      { id: 1, dueDate: null, createdBy: 'team' as const },
      { id: 2, dueDate: '2026-10-05', createdBy: 'mentor' as const },
    ];
    sortTasks(tasks);
    expect(tasks.map((task) => task.id)).toEqual([1, 2]);
  });
});

describe('deliverable lines', () => {
  it('shows all ten, not started unless the team said otherwise', () => {
    const lines = deliverableLines({ car: 'done', renders: 'in_progress' });
    expect(lines).toHaveLength(10);
    expect(lines[0]).toEqual({ key: 'car', label: 'Car', status: 'done' });
    expect(lines[2]?.status).toBe('in_progress');
    expect(lines.filter((line) => line.status === 'not_started')).toHaveLength(8);
  });
});
