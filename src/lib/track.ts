// Text tracks: the headline once in solid type, repeated in outline.

export type TrackLayout = 'banner' | 'stacked';
export const TRACK_MAX_WORDS = 3;

export interface TrackLines {
  lines: string[];
  chars: number;
}

export function trackLines(text: string, layout: TrackLayout): TrackLines {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) throw new Error('TextTrack: the text is empty.');
  if (words.length > TRACK_MAX_WORDS) {
    throw new Error(
      `TextTrack: "${text}" has ${words.length} words. A text track takes ${TRACK_MAX_WORDS} words at most.`,
    );
  }
  const lines = layout === 'stacked' ? words : [words.join(' ')];
  return { lines, chars: Math.max(...lines.map((line) => [...line].length)) };
}
