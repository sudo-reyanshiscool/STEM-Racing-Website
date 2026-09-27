import { describe, expect, it } from 'vitest';
import { groupResultsBySeason, worldFinalsCount, type ResultData } from '../../src/lib/results';

const result = (season: string, team: string, event: ResultData['event']): ResultData => ({
  season,
  team,
  event,
  placing: 'Represented India',
  awards: [],
});

describe('groupResultsBySeason', () => {
  it('puts the newest season first, whatever form the label takes', () => {
    const groups = groupResultsBySeason([
      result('2014', 'Team Ignite', 'World Finals'),
      result('2025', 'SuperCharged', 'World Finals'),
      result('2020-21', 'GDR', 'World Finals'),
      result('2026-27', 'Sample Team A', 'Regionals'),
    ]);
    expect(groups.map((group) => group.season)).toEqual(['2026-27', '2025', '2020-21', '2014']);
  });

  it('orders a season by event, then by team name', () => {
    const [group] = groupResultsBySeason([
      result('2020-21', 'GDR', 'Regionals'),
      result('2020-21', 'GDR', 'World Finals'),
      result('2020-21', 'Blaze', 'World Finals'),
      result('2020-21', 'GDR', 'Nationals'),
    ]);
    expect(group?.rows.map((row) => `${row.event} ${row.team}`)).toEqual([
      'World Finals Blaze',
      'World Finals GDR',
      'Nationals GDR',
      'Regionals GDR',
    ]);
  });

  it('returns an empty list when there are no results', () => {
    expect(groupResultsBySeason([])).toEqual([]);
  });
});

describe('worldFinalsCount', () => {
  it('counts World Finals results rather than every result', () => {
    expect(
      worldFinalsCount([
        result('2025', 'SuperCharged', 'World Finals'),
        result('2025', 'SuperCharged', 'Nationals'),
        result('2024', 'Another team', 'Regionals'),
        result('2023', 'Team Blaze', 'World Finals'),
      ]),
    ).toBe(2);
  });

  it('returns zero when no team reached the World Finals', () => {
    expect(worldFinalsCount([result('2026-27', 'New team', 'Nationals')])).toBe(0);
  });
});
