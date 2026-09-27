// WCAG 2 contrast maths, used to pin the brand colour pairs.

export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match || match[1] === undefined) throw new Error(`Not a six-digit hex colour: ${hex}`);
  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function luminance([r, g, b]: Rgb): number {
  const channel = (value: number) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/** The colour part of the way from one colour to another. 0 is the first, 1 is the second. */
export function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  return from.map((value, index) => Math.round(value + ((to[index] ?? 0) - value) * amount)) as Rgb;
}
