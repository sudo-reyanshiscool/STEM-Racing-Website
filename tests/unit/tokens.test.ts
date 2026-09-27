import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrast, hexToRgb, mix } from '../helpers/contrast';

const styles = join(process.cwd(), 'src/styles');
const tokensCss = readFileSync(join(styles, 'tokens.css'), 'utf8');
const fontsCss = readFileSync(join(styles, 'fonts.css'), 'utf8');
const globalCss = readFileSync(join(styles, 'global.css'), 'utf8');

const tokens = Object.fromEntries(
  [...tokensCss.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((match) => [match[1], match[2]]),
);
const colour = (name: string) => {
  const hex = tokens[name];
  if (!hex) throw new Error(`tokens.css has no colour called --${name}`);
  return hexToRgb(hex);
};
const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('colour tokens', () => {
  it('match the brand guide', () => {
    expect(tokens).toMatchObject({
      'carbon-shadow': '#05000B',
      'ignite-indigo': '#312783',
      'chicane-violet': '#961B81',
      'pitlane-pink': '#E6007E',
      'burnout-orange': '#ED6D05',
      'podium-gold': '#FCBC00',
    });
  });

  it('use the tints sampled from the guide', () => {
    expect(tokens).toMatchObject({
      'carbon-800': '#261A3D',
      'carbon-700': '#2E2347',
      'carbon-500': '#5B5376',
      'carbon-300': '#A39FB8',
      'carbon-100': '#D7D6E3',
      'surface-light': '#F3F3F7',
    });
  });

  it('hold no colour from the Discovery or Primary divisions', () => {
    const forbidden = ['#008A3F', '#95C11F', '#005CA9', '#009FE3'];
    for (const css of [tokensCss, fontsCss, globalCss]) {
      for (const hex of forbidden) expect(css.toUpperCase()).not.toContain(hex);
    }
  });
});

describe('contrast', () => {
  it.each([
    ['body text on dark', 'carbon-100', 'carbon-shadow'],
    ['muted text on dark', 'carbon-300', 'carbon-shadow'],
    ['muted text on a dark card', 'carbon-300', 'carbon-700'],
    ['body text on light', 'carbon-shadow', 'surface-light'],
    ['muted text on light', 'carbon-500', 'surface-light'],
    ['violet heading on light', 'chicane-violet', 'surface-light'],
    ['button text on violet', 'white', 'chicane-violet'],
    ['button text on indigo', 'white', 'ignite-indigo'],
    ['dark text on orange mesh', 'carbon-shadow', 'burnout-orange'],
    ['dark text on gold', 'carbon-shadow', 'podium-gold'],
  ])('%s is at least 4.5:1', (_label, text, surface) => {
    expect(contrast(colour(text), colour(surface))).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps every visible part of a gradient heading at 3:1 or better on dark', () => {
    const start = /--gradient-heading:[^;]*var\(--chicane-violet\)\s*(-?\d+)%[^;]*var\(--pitlane-pink\)\s*(\d+)%/.exec(
      tokensCss,
    );
    expect(start).not.toBeNull();
    const violetAt = Number(start?.[1]);
    const pinkAt = Number(start?.[2]);
    // The heading box starts at 0%. Work out the colour there.
    const leftEdge = mix(colour('chicane-violet'), colour('pitlane-pink'), (0 - violetAt) / (pinkAt - violetAt));
    expect(contrast(leftEdge, colour('carbon-shadow'))).toBeGreaterThanOrEqual(3);
    expect(contrast(colour('pitlane-pink'), colour('carbon-shadow'))).toBeGreaterThanOrEqual(3);
    expect(contrast(colour('burnout-orange'), colour('carbon-shadow'))).toBeGreaterThanOrEqual(3);
  });

  it('keeps a gradient heading readable on a white card', () => {
    expect(contrast(colour('burnout-orange'), colour('white'))).toBeGreaterThanOrEqual(3);
  });
});

describe('fonts', () => {
  const faces = [...withoutComments(fontsCss).matchAll(/@font-face\s*\{([^}]*)\}/g)].map((match) => match[1] ?? '');
  const family = (face: string) => /font-family:\s*'([^']+)'/.exec(face)?.[1];

  it('declares Magistral in italic only, so it can never appear upright', () => {
    const magistral = faces.filter((face) => family(face) === 'Magistral');
    expect(magistral).toHaveLength(2);
    for (const face of magistral) expect(face).toMatch(/font-style:\s*italic/);
  });

  it('declares MachoModular Light, Medium and Bold', () => {
    const weights = faces
      .filter((face) => family(face) === 'MachoModular')
      .map((face) => /font-weight:\s*(\d+)/.exec(face)?.[1]);
    const regularInstalled = existsSync(join(process.cwd(), 'public/fonts/MachoModular-Regular.woff2'));
    expect(weights).toEqual(regularInstalled ? ['300', '400', '500', '700'] : ['300', '500', '700']);
  });

  it('keeps the Regular rule ready for the day the file arrives', () => {
    expect(fontsCss).toContain("url('/fonts/MachoModular-Regular.woff2')");
  });

  it('enables the Regular rule by deleting two marker lines without exposing prose as CSS', () => {
    const marker = 'Delete this line when MachoModular Regular is installed.';
    expect(fontsCss.split('\n').filter((line) => line.includes(marker))).toHaveLength(2);
    const enabled = fontsCss
      .split('\n')
      .filter((line) => !line.includes(marker))
      .join('\n');
    const enabledFaces = [...withoutComments(enabled).matchAll(/@font-face\s*\{([^}]*)\}/g)].map(
      (match) => match[1] ?? '',
    );
    expect(enabledFaces.some((face) => family(face) === 'MachoModular' && /font-weight:\s*400/.test(face))).toBe(
      true,
    );
  });

  it('swaps in the brand font as soon as it loads', () => {
    for (const face of faces.filter((f) => !family(f)?.endsWith('Fallback'))) {
      expect(face).toMatch(/font-display:\s*swap/);
    }
  });

  it('never names Verdana', () => {
    for (const css of [tokensCss, fontsCss, globalCss]) expect(css).not.toMatch(/verdana/i);
  });

  it('falls back to system-ui', () => {
    expect(tokens['font-display']).toBeUndefined();
    expect(tokensCss).toMatch(/--font-display:\s*'Magistral', 'Magistral Fallback', system-ui, sans-serif;/);
    expect(tokensCss).toMatch(/--font-body:\s*'MachoModular', 'MachoModular Fallback', system-ui, sans-serif;/);
  });
});

describe('base styles', () => {
  const css = withoutComments(globalCss);

  it('never justifies or right-aligns text', () => {
    expect(css).not.toMatch(/text-align:\s*(justify|right|end)/);
  });

  it('sets body copy at weight 400, so it is never bold throughout', () => {
    expect(/body\s*\{[^}]*\}/.exec(css)?.[0]).toMatch(/font-weight:\s*400/);
  });

  it('wraps long unbroken text before it can widen the page', () => {
    expect(/body\s*\{[^}]*\}/.exec(css)?.[0]).toMatch(/overflow-wrap:\s*anywhere/);
  });

  it('keeps result tables readable instead of breaking words inside cells', () => {
    expect(/\.table\s*\{[^}]*\}/.exec(css)?.[0]).toMatch(/overflow-wrap:\s*normal/);
  });

  it('sets headings 1 and 2 in the display font, in italic', () => {
    const rule = /h1,\s*h2\s*\{[^}]*\}/.exec(css)?.[0] ?? '';
    expect(rule).toMatch(/font-family:\s*var\(--font-display\)/);
    expect(rule).toMatch(/font-style:\s*italic/);
    expect(rule).toMatch(/font-weight:\s*700/);
  });

  it('sets headings 3 to 5 in the body font, in bold', () => {
    const rule = /h3,\s*h4,\s*h5\s*\{[^}]*\}/.exec(css)?.[0] ?? '';
    expect(rule).toMatch(/font-family:\s*var\(--font-body\)/);
    expect(rule).toMatch(/font-weight:\s*700/);
  });

  it('draws the focus ring in Podium Gold with a dark outer ring', () => {
    const rule = /:focus-visible\s*\{[^}]*\}/.exec(css)?.[0] ?? '';
    expect(rule).toMatch(/outline:\s*3px solid var\(--podium-gold\)/);
    expect(rule).toMatch(/box-shadow:[^;]*var\(--carbon-shadow\)/);
  });

  it('switches motion off for people who ask for less of it', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(globalCss).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*animation-duration:\s*0\.01ms !important/);
    expect(globalCss).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.reveal-pending\s*\{[\s\S]*opacity:\s*1[\s\S]*transform:\s*none/);
  });

  it('only hides content with classes that the script adds', () => {
    const hidden = [...css.matchAll(/([^{}]+)\{[^}]*opacity:\s*0[;\s][^}]*\}/g)].map((match) => (match[1] ?? '').trim());
    expect(hidden).toEqual(['.reveal-pending']);
  });

  it('takes every colour from the tokens', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\brgba?\(/);
  });
});

describe('logo clear-space layout', () => {
  it('makes the header twice the logo height at desktop and phone sizes', () => {
    expect(tokensCss).toMatch(/--header-h:\s*7rem/);
    expect(tokensCss).toMatch(/@media \(max-width: 47\.99rem\)[\s\S]*--header-h:\s*5\.5rem/);
  });

  it('keeps the smallest page gutter at least half the phone logo height', () => {
    expect(tokensCss).toMatch(/--gutter:\s*clamp\(1\.375rem,/);
  });
});
