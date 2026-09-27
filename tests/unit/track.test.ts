import { describe, expect, it } from 'vitest';
import { trackLines } from '../../src/lib/track';

describe('trackLines', () => {
  it('keeps a banner on one line', () => {
    expect(trackLines('Our Strategy', 'banner')).toEqual({ lines: ['Our Strategy'], chars: 12 });
  });

  it('puts each word of a stacked track on its own line', () => {
    expect(trackLines('Accelerating Futures', 'stacked')).toEqual({
      lines: ['Accelerating', 'Futures'],
      chars: 12,
    });
  });

  it('ignores extra spaces', () => {
    expect(trackLines('  Our   School ', 'banner')).toEqual({ lines: ['Our School'], chars: 10 });
  });

  it('counts accented letters as one character each', () => {
    expect(trackLines('Café', 'banner').chars).toBe(4);
  });

  it('refuses more than three words and says why', () => {
    expect(() => trackLines('Four words are many', 'banner')).toThrow(
      'TextTrack: "Four words are many" has 4 words. A text track takes 3 words at most.',
    );
  });

  it('refuses empty text', () => {
    expect(() => trackLines('   ', 'banner')).toThrow('TextTrack: the text is empty.');
  });
});
