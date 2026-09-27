// What the build does with the dashboard. How the dashboard behaves is tested in tests/dashboard.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dist, page, pageFile, root, ROUTES, siteCss, texts } from '../helpers/site';

const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('the public site beside the dashboard', () => {
  it.each(ROUTES)('still builds %s as a file', (route) => {
    expect(existsSync(pageFile(route))).toBe(true);
  });

  it('builds no dashboard page ahead of time', () => {
    expect(existsSync(join(dist, 'dashboard'))).toBe(false);
    expect(existsSync(join(dist, 'dashboard.html'))).toBe(false);
  });

  it.each(ROUTES)('links to the sign-in page from the footer of %s', (route) => {
    const $ = page(route);
    expect(texts($, '.site-footer a[href="/dashboard"]')).toEqual(['Team sign-in']);
  });

  it('keeps the dashboard out of the main navigation', () => {
    expect(page('/')('.site-nav a[href^="/dashboard"]')).toHaveLength(0);
  });
});

describe('the dashboard pages', () => {
  const pages = [
    'index.astro',
    'team.astro',
    'mentor/index.astro',
    'mentor/team/[slug].astro',
    'unavailable.astro',
    'sign-out.ts',
    'api/keep-awake.ts',
  ];

  it.each(pages)('renders %s on request', (name) => {
    expect(read(`src/pages/dashboard/${name}`)).toMatch(/^export const prerender = false;$/m);
  });

  it('sets a session cookie that scripts cannot read and that stays inside the dashboard', () => {
    const signIn = read('src/pages/dashboard/index.astro');
    for (const setting of ['httpOnly: true', 'secure: import.meta.env.PROD', "sameSite: 'lax'", "path: '/dashboard'"]) {
      expect(signIn).toContain(setting);
    }
  });

  it('renders no other page on request', () => {
    for (const name of ['index', 'school', 'programme', 'teams', 'season', 'resources', 'support', '404', '[event]']) {
      expect(read(`src/pages/${name}.astro`), name).not.toMatch(/prerender\s*=\s*false/);
    }
  });

  it.each(ROUTES)('keeps its styles off %s', (route) => {
    const $ = page(route);
    const linked = $('link[rel="stylesheet"]')
      .toArray()
      .map((element) => readFileSync(join(dist, $(element).attr('href') ?? ''), 'utf8'));
    const inline = texts($, 'style');
    expect(linked.length + inline.length).toBeGreaterThan(0);
    for (const css of [...linked, ...inline]) expect(css).not.toMatch(/\.dash-/);
  });
});

describe('the settings', () => {
  it('builds a static site with the Vercel adapter', () => {
    const config = read('astro.config.mjs');
    expect(config).toMatch(/output:\s*'static'/);
    expect(config).toMatch(/adapter:\s*vercel\(\)/);
  });

  it('wakes the database once a day', () => {
    const vercel = JSON.parse(read('vercel.json'));
    expect(vercel.crons).toEqual([{ path: '/dashboard/api/keep-awake', schedule: '0 3 * * *' }]);
    // The adapter decides where the build goes. A folder named here would hide the server code.
    expect(vercel).not.toHaveProperty('outputDirectory');
  });

  it('runs the dashboard in the region where the database is', () => {
    const vercel = JSON.parse(read('vercel.json'));
    expect(vercel.regions).toEqual(['syd1']);
  });

  it('keeps secrets out of git', () => {
    const ignored = read('.gitignore').split('\n');
    expect(ignored).toEqual(expect.arrayContaining(['.env', '.dashboard-db/']));
    expect(read('.env.example')).toMatch(/^SESSION_SECRET=$/m);
    expect(read('.env.example')).toMatch(/^MENTOR_CODE_HASH=$/m);
  });

  it('keeps the database driver out of the browser', () => {
    const scripts = join(dist, '_astro');
    expect(existsSync(scripts)).toBe(true);
    expect(siteCss()).not.toMatch(/DATABASE_URL|SESSION_SECRET/);
  });
});
