// The dashboard's styles are sent with its pages, so the brand tests in tests/site, which read
// the public site's CSS, never see them. These read the source.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const css = readFileSync(join(root, 'src/styles/dashboard.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

function astroFiles(folder: string): string[] {
  return readdirSync(join(root, folder), { recursive: true, encoding: 'utf8' })
    .filter((name) => name.endsWith('.astro'))
    .map((name) => join(folder, name));
}

const sources = [...astroFiles('src/pages/dashboard'), ...astroFiles('src/components/dashboard')];

describe('dashboard styles', () => {
  it('takes every colour from a token', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/\b(?:rgb|rgba|hsl|hsla|oklch|color-mix)\(/i);
    const declarations = [
      ...css.matchAll(/(?:^|[;{\s])(?:color|background(?:-color)?|border(?:-[\w-]+)?-color|outline|box-shadow|fill|stroke):([^;}]+)/g),
    ].map((match) => (match[1] ?? '').trim());
    expect(declarations.length).toBeGreaterThan(10);
    for (const value of declarations) {
      expect(value, `non-token colour: ${value}`).toMatch(/var\(--|^(?:transparent|currentColor|inherit|none)$/i);
    }
  });

  it('names a token in every border', () => {
    for (const match of css.matchAll(/border(?:-[\w-]+)?:\s*([^;}]+)/g)) {
      const value = (match[1] ?? '').trim();
      if (/^(?:0|none|inherit|999px|var\(--radius\)|0\.25rem)$/.test(value)) continue;
      expect(value, `border: ${value}`).toMatch(/var\(--/);
    }
  });

  it('uses only tokens that exist', () => {
    const tokens = readFileSync(join(root, 'src/styles/tokens.css'), 'utf8');
    // These are set by Section.astro for the surface the dashboard sits on.
    const surface = ['--fg', '--fg-strong', '--fg-muted', '--fg-inverse', '--rule', '--card-bg', '--card-border', '--stack'];
    for (const match of css.matchAll(/var\((--[\w-]+)/g)) {
      const name = match[1] ?? '';
      if (surface.includes(name)) continue;
      expect(tokens, name).toContain(`${name}:`);
    }
  });

  it('leaves the display font to headlines and buttons', () => {
    expect(css).not.toMatch(/--font-display/);
  });

  it('never names Verdana, and never justifies or right-aligns text', () => {
    expect(css).not.toMatch(/verdana/i);
    expect(css).not.toMatch(/text-align:\s*(justify|right|end)/);
  });

  it('keeps every dashboard style in one file', () => {
    expect(sources.length).toBeGreaterThanOrEqual(5);
    for (const file of sources) expect(readFileSync(join(root, file), 'utf8'), file).not.toMatch(/<style/);
  });

  it('sets nothing but a width in a style attribute', () => {
    for (const file of sources) {
      for (const match of readFileSync(join(root, file), 'utf8').matchAll(/\sstyle=\{?["'`]([^"'`]*)/g)) {
        expect(match[1], file).toMatch(/^width: \$\{percent\}%$/);
      }
    }
  });

  it('gives the ghost button a clear background, which a button element does not have by default', () => {
    const button = readFileSync(join(root, 'src/components/Button.astro'), 'utf8');
    expect(button).toMatch(/\.btn--ghost \{[^}]*background: transparent;/);
  });

  it('marks overdue and refused entries in words, not by colour alone', () => {
    const workspace = readFileSync(join(root, 'src/components/dashboard/Workspace.astro'), 'utf8');
    expect(workspace).toMatch(/tag--overdue">Overdue</);
    expect(workspace).toMatch(/tag--mentor">From your mentor</);
  });
});
