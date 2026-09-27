import { describe, expect, it } from 'vitest';
import { contentFiles, contentJson, page, texts } from '../helpers/site';

describe('our school', () => {
  const $ = page('/school');
  const heritage = contentFiles('heritage', '.json').map((file) =>
    contentJson<{ year: string; team: string; note?: string }>(`heritage/${file}`),
  );

  it('has one timeline entry for each heritage file, oldest first', () => {
    const expected = [...heritage].sort((a, b) => a.year.localeCompare(b.year) || a.team.localeCompare(b.team));
    expect(texts($, '.timeline h3')).toEqual(expected.map((entry) => entry.team));
    expect(texts($, '.timeline__label')).toEqual(expected.map((entry) => entry.year));
  });

  it('shows the school copy', () => {
    expect(texts($, '.prose h2')).toEqual(['About the school', 'Why we run STEM Racing']);
  });

  it('does not dim heritage entries', () => {
    expect($('.timeline[data-dim-past]')).toHaveLength(0);
    expect($('.timeline .is-past')).toHaveLength(0);
  });

  it('states the number of World Finals results, not the number of heritage entries', () => {
    const count = contentFiles('results', '.json')
      .map((file) => contentJson<{ event: string }>(`results/${file}`))
      .filter((result) => result.event === 'World Finals').length;
    const wording = count === 1 ? 'once' : `${count} times`;
    expect(texts($, '#heritage-title + .lead')).toEqual([
      `TBS teams have represented India at the STEM Racing World Finals ${wording}.`,
    ]);
  });
});
