import { describe, expect, it } from 'vitest';
import { clean, page } from '../helpers/site';

describe('page not found', () => {
  const $ = page('/404');

  it('offers the way home', () => {
    expect(clean($('h1 .sr-only').text())).toBe('Off Track');
    expect($('main a[href="/"]')).toHaveLength(1);
  });
});
