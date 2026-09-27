// The numbers behind the scroll effects. The DOM work is in src/scripts/motion.ts.

export const HEADER_SCROLL_THRESHOLD = 80;
export const TRACK_MAX_SHIFT = 40;

export function headerScrolled(scrollY: number): boolean {
  return scrollY > HEADER_SCROLL_THRESHOLD;
}

/** Drift measured from where the track sat when the page loaded, so a headline starts aligned. */
export function relativeShift(raw: number, base: number, max: number = TRACK_MAX_SHIFT): number {
  return Math.min(max, Math.max(-max, raw - base));
}

export function trackShift(top: number, height: number, viewportHeight: number, max: number = TRACK_MAX_SHIFT): number {
  const span = viewportHeight + height;
  if (span <= 0) return 0;
  const progress = Math.min(1, Math.max(0, (viewportHeight - top) / span));
  return (progress - 0.5) * 2 * max;
}
