import { describe, expect, it } from 'vitest';
import { contentFiles, page, teamFiles, texts } from '../helpers/site';

const teams = teamFiles();

describe('teams', () => {
  const $ = page('/teams');
  const results = contentFiles('results', '.json');

  it('shows every team once', () => {
    expect(texts($, '.team h3').sort()).toEqual(teams.map((team) => team.name).sort());
  });

  it('labels sample entries, so nobody takes them for real teams', () => {
    expect($('.team .tag--sample')).toHaveLength(teams.filter((team) => team.sample).length);
  });

  it('shows the brand mark when a team has no image', () => {
    for (const card of $('.team').toArray()) {
      expect($(card).find('.team__media img')).toHaveLength(1);
    }
  });

  it('lists every result', () => {
    expect($('.table tbody tr')).toHaveLength(results.length);
  });

  it('lets keyboard users scroll a wide table', () => {
    for (const wrap of $('.table-wrap').toArray()) {
      expect($(wrap).attr('tabindex')).toBe('0');
      expect($(wrap).attr('role')).toBe('region');
      expect($(wrap).attr('aria-label')).toBeTruthy();
    }
  });
});
