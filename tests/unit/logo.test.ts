import { describe, expect, it } from 'vitest';
import { LOGO_MIN_HEIGHT, logoHeight } from '../../src/lib/logo';

describe('logoHeight', () => {
  it('keeps a height that is large enough', () => {
    expect(logoHeight(56)).toBe(56);
  });

  it('never goes below the minimum', () => {
    expect(LOGO_MIN_HEIGHT).toBe(32);
    expect(logoHeight(24)).toBe(32);
    expect(logoHeight(0)).toBe(32);
    expect(logoHeight(-10)).toBe(32);
  });

  it('rounds to whole pixels and survives bad input', () => {
    expect(logoHeight(47.6)).toBe(48);
    expect(logoHeight(Number.NaN)).toBe(32);
  });
});
