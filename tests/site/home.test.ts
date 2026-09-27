import { describe, expect, it } from 'vitest';
import type { SeasonData } from '../../src/lib/season';
import { clean, contentFiles, contentJson, page, teamFiles, texts } from '../helpers/site';

const seasonFile = contentFiles('seasons', '.json').at(-1);
const season = seasonFile ? contentJson<SeasonData>(`seasons/${seasonFile}`) : undefined;

const current = teamFiles().filter((team) => team.stage === 'Current Regionals');

describe('home', () => {
  const $ = page('/');
  const site = contentJson<{ stats: { value: string; label: string }[] }>('site/site.json');

  it('opens with the brand commitment, word for word', () => {
    expect(clean($('h1 .sr-only').text())).toBe('Accelerating Futures');
    expect(texts($, 'h1 .track__solid')).toEqual(['Accelerating', 'Futures']);
  });

  it('loads the hero background first', () => {
    const image = $('.hero picture img');
    expect(image.attr('loading')).toBe('eager');
    expect(image.attr('fetchpriority')).toBe('high');
    expect(image.attr('alt')).toBe('');
    expect($('.hero picture source[type="image/avif"]')).toHaveLength(1);
  });

  it('puts the header over the hero', () => {
    expect($('header').attr('class')).toContain('site-header--overlay');
  });

  it('shows the figures from site.json', () => {
    expect(texts($, '.stat__value')).toEqual(site.stats.map((stat) => stat.value));
    expect(texts($, '.stat__label')).toEqual(site.stats.map((stat) => stat.label));
  });

  it('shows every current regional team', () => {
    expect(texts($, '.team h3').sort()).toEqual(current.map((team) => team.name).sort());
  });

  it('carries the season data, so the browser can keep Next up correct', () => {
    const panel = $('[data-season-status]');
    expect(panel.attr('data-season') ? JSON.parse(panel.attr('data-season') ?? '{}') : undefined).toEqual(season);
    for (const key of ['registration', 'next-label', 'next-title', 'next-date']) {
      expect(panel.find(`[data-status="${key}"]`)).toHaveLength(1);
    }
  });

  it('leads on to the programme, the teams and the season', () => {
    for (const href of ['/programme', '/teams', '/season', '/resources']) {
      expect($(`main a[href="${href}"]`).length).toBeGreaterThan(0);
    }
  });
});
