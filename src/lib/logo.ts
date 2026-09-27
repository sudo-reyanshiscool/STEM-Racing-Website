// Logo rules from the brand guide, as code.

export type LogoVariant = 'colour-white' | 'colour-black' | 'mono-white' | 'mono-black';
/** The brand minimum is 24px high and 70px wide. This lockup is 2.44 times as wide as it is
 *  high, so 32px is the smallest height that keeps the width above 70px. */
export const LOGO_MIN_HEIGHT = 32;

export function logoHeight(requested: number): number {
  if (!Number.isFinite(requested)) return LOGO_MIN_HEIGHT;
  return Math.max(LOGO_MIN_HEIGHT, Math.round(requested));
}
