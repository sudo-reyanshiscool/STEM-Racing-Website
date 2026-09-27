import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const brand = join(root, 'src/assets/brand');
const fonts = join(root, 'public/fonts');

function walk(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => !name.startsWith('.'))
    .flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [relative(brand, path)];
    });
}

const logos = ['tbs-colour-white.png', 'tbs-colour-black.png', 'tbs-mono-white.png', 'tbs-mono-black.png'];

describe('brand artwork', () => {
  it('holds the approved files and nothing else', () => {
    expect(walk(brand).sort()).toEqual([
      'gradients/mesh-hot.png',
      'gradients/mesh-pink-orange.png',
      'gradients/sr-gradient.png',
      'logo/tbs-colour-black.png',
      'logo/tbs-colour-white.png',
      'logo/tbs-mono-black.png',
      'logo/tbs-mono-white.png',
      'patterns/pattern-jagged.png',
      'shapes/shape-black-1.svg',
      'shapes/shape-pink.svg',
      'shapes/shape-yellow.svg',
      'signifier/signifier-colour.png',
    ]);
  });

  it.each(logos)('%s is cropped to the artwork, 1200 wide, with a clear background', async (name) => {
    const image = sharp(join(brand, 'logo', name));
    const meta = await image.metadata();
    expect([meta.width, meta.height]).toEqual([1200, 492]);
    expect(meta.hasAlpha).toBe(true);

    // Cropped tight: trimming again removes almost nothing.
    const { info } = await image.trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
    expect(info.width).toBeGreaterThanOrEqual(1196);
    expect(info.height).toBeGreaterThanOrEqual(488);
  });

  it.each(['mesh-hot.png', 'mesh-pink-orange.png'])('%s has no see-through edge', async (name) => {
    const image = sharp(join(brand, 'gradients', name));
    const meta = await image.metadata();
    expect([meta.width, meta.height]).toEqual([1237, 1751]);
    expect((await image.stats()).isOpaque).toBe(true);
  });

  it('keeps the hero gradient at its supplied size', async () => {
    const meta = await sharp(join(brand, 'gradients/sr-gradient.png')).metadata();
    expect([meta.width, meta.height]).toEqual([3200, 2000]);
  });

  it('keeps the pattern see-through, so it can sit on a gradient', async () => {
    expect((await sharp(join(brand, 'patterns/pattern-jagged.png')).stats()).isOpaque).toBe(false);
  });

  it.each([
    ['shape-pink.svg', ['#961b81', '#e6007e', '#ed6d05']],
    ['shape-yellow.svg', ['#e84610', '#ed630c', '#f9ad03']],
    ['shape-black-1.svg', ['#05000b']],
  ])('%s is the supplied file, unchanged', (name, colours) => {
    const svg = readFileSync(join(brand, 'shapes', name), 'utf8');
    expect(svg).toContain('viewBox="0 0 801.43 878.01"');
    expect(svg.match(/<path /g)).toHaveLength(1);
    for (const hex of colours) expect(svg).toContain(hex);
  });
});

describe('fonts', () => {
  const files = [
    'MachoModular-Bold.woff2',
    'MachoModular-Light.woff2',
    'MachoModular-Medium.woff2',
    'Magistral-BoldItalic.woff2',
    'Magistral-MediumItalic.woff2',
  ];

  it('holds the five brand font files and nothing else', () => {
    const actual = readdirSync(fonts)
      .filter((name) => !name.startsWith('.'))
      .sort();
    const withRegular = [...files, 'MachoModular-Regular.woff2'].sort();
    expect([files, withRegular]).toContainEqual(actual);
  });

  it.each(files)('%s is a WOFF2 file of a sensible size', (name) => {
    const bytes = readFileSync(join(fonts, name));
    expect(bytes.subarray(0, 4).toString('latin1')).toBe('wOF2');
    expect(bytes.length).toBeGreaterThan(20_000);
    expect(bytes.length).toBeLessThan(60_000);
  });
});

describe('favicons', () => {
  it.each([
    ['favicon-32.png', 32],
    ['favicon-192.png', 192],
    ['apple-touch-icon.png', 180],
  ])('%s is a %i pixel square', async (name, size) => {
    const meta = await sharp(join(root, 'public', name)).metadata();
    expect([meta.width, meta.height]).toEqual([size, size]);
  });

  it('gives the touch icon a solid Carbon Shadow background', async () => {
    const image = sharp(join(root, 'public/apple-touch-icon.png'));
    expect((await image.stats()).isOpaque).toBe(true);
    const { data } = await sharp(join(root, 'public/apple-touch-icon.png'))
      .extract({ left: 2, top: 2, width: 1, height: 1 })
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect([data[0], data[1], data[2]]).toEqual([5, 0, 11]);
  });
});
