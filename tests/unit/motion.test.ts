import { describe, expect, it } from 'vitest';
import { headerScrolled, relativeShift, trackShift } from '../../src/lib/motion';

describe('headerScrolled', () => {
  it('turns solid after 80 pixels of scroll', () => {
    expect(headerScrolled(0)).toBe(false);
    expect(headerScrolled(80)).toBe(false);
    expect(headerScrolled(81)).toBe(true);
  });
});

describe('trackShift', () => {
  it('runs from -40 as the track enters to +40 as it leaves', () => {
    expect(trackShift(900, 100, 900)).toBe(-40);
    expect(trackShift(400, 100, 900)).toBe(0);
    expect(trackShift(-100, 100, 900)).toBe(40);
  });

  it('stays inside the limits when the track is far off screen', () => {
    expect(trackShift(5000, 100, 900)).toBe(-40);
    expect(trackShift(-5000, 100, 900)).toBe(40);
  });

  it('returns 0 when there is nothing to measure', () => {
    expect(trackShift(0, 0, 0)).toBe(0);
  });
});

describe('relativeShift', () => {
  it('is 0 where the track started, so a headline loads aligned with the text below it', () => {
    expect(relativeShift(12, 12)).toBe(0);
  });

  it('moves with the scroll and stays inside the limits', () => {
    expect(relativeShift(30, 12)).toBe(18);
    expect(relativeShift(40, -40)).toBe(40);
    expect(relativeShift(-40, 40)).toBe(-40);
  });
});
