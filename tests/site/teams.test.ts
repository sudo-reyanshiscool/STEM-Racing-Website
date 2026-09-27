import { describe, expect, it } from 'vitest';
import { contentFiles, contentJson, page, teamFiles, texts } from '../helpers/site';

const teams = teamFiles();

describe('teams', () => {
  const $ = page('/teams');
  const results = contentFiles('results', '.json');

  it('shows every team once', () => {
    expect(texts($, '.team h4').sort()).toEqual(teams.map((team) => team.name).sort());
  });

  it('groups teams by their confirmed stage', () => {
    expect(texts($, '#teams-title ~ section > h3')).toEqual(['World Finals', 'Nationals', 'Current Regionals']);
  });

  it('lists every result with Event, Team and Placing columns only', () => {
    expect($('.table tbody tr')).toHaveLength(results.length);
    expect([...new Set(texts($, '.table thead th'))]).toEqual(['Event', 'Team', 'Placing']);
  });

  it('lets keyboard users scroll a wide table', () => {
    for (const wrap of $('.table-wrap').toArray()) {
      expect($(wrap).attr('tabindex')).toBe('0');
      expect($(wrap).attr('role')).toBe('region');
      expect($(wrap).attr('aria-label')).toBeTruthy();
    }
  });

  it('does not invent a division or other team details', () => {
    expect($.text()).not.toContain('Professional');
    expect($.text()).not.toContain('Development');
  });
});
