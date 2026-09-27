import { describe, expect, it } from 'vitest';
import { contentJson, page, texts } from '../helpers/site';

interface Point {
  title: string;
  body: string;
}

describe('programme', () => {
  const $ = page('/programme');
  const programme = contentJson<{ steps: Point[]; roles: Point[]; judging: Point[] }>('programme/programme.json');

  it('numbers the 12 steps in order', () => {
    expect(texts($, '.step__num')).toEqual(
      ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
    );
    expect(texts($, '.step h3')).toEqual(programme.steps.map((step) => step.title));
  });

  it('hides the numerals from screen readers, because the list already counts', () => {
    expect($('ol .step')).toHaveLength(12);
    expect($('.step__num[aria-hidden="true"]')).toHaveLength(12);
  });

  it('shows the roles and the judged areas', () => {
    const headings = texts($, 'main h3');
    for (const item of [...programme.roles, ...programme.judging]) expect(headings).toContain(item.title);
  });
});
