import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BUILD_TIMEOUT, copySite, type SiteCopy } from '../helpers/sandbox';

describe('content deletion', () => {
  let copy: SiteCopy;

  beforeAll(() => {
    copy = copySite();
    copy.build();
    copy.empty('teams');
    copy.build();
  }, BUILD_TIMEOUT);

  afterAll(() => copy.remove());

  it('clears deleted entries from Astro’s content store on the next build', () => {
    expect(copy.page('/teams')('.team')).toHaveLength(0);
    expect(copy.page('/')('.team')).toHaveLength(0);
  });
});

describe('no season file', () => {
  let copy: SiteCopy;

  beforeAll(() => {
    copy = copySite();
    copy.empty('seasons');
    copy.build();
  }, BUILD_TIMEOUT);

  afterAll(() => copy.remove());

  it('keeps the home and season pages useful without throwing', () => {
    expect(copy.page('/')('[data-status="next-label"]').text().trim()).toBe('Dates to be announced');
    expect(copy.page('/season')('[data-status="next-label"]').text().trim()).toBe('Dates to be announced');
    expect(copy.page('/season')('.timeline').length).toBe(0);
  });
});
