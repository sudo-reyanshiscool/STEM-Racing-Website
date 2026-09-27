import { describe, expect, it } from 'vitest';
import { cssRules, siteCss } from '../helpers/site';

const rules = cssRules(siteCss());
const bodies = (selector: string) => rules.filter((rule) => rule.selector === selector).map((rule) => rule.body);

describe('narrow layout', () => {
  it('lets team cards shrink to the width of their grid column', () => {
    expect(bodies('.team').some((body) => /grid-template-columns:minmax\(0,1fr\)/.test(body))).toBe(true);
  });

  it('lets timeline text shrink at phone and wide layouts', () => {
    expect(bodies('.timeline__item').some((body) => /grid-template-columns:minmax\(0,1fr\)/.test(body))).toBe(true);
    expect(bodies('.timeline__item').some((body) => /grid-template-columns:13rem minmax\(0,1fr\)/.test(body))).toBe(
      true,
    );
  });
});
