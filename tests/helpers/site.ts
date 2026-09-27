// Reads the built site in dist and the content files it was built from.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load, type CheerioAPI } from 'cheerio';

export const root = process.cwd();
export const dist = join(root, 'dist');
export const SITE_URL = 'https://stemracing-tbs.vercel.app';

/** Every page the site builds, apart from the optional event page. */
export const ROUTES = ['/school', '/programme', '/404'];

export function pageFile(route: string): string {
  if (route === '/') return join(dist, 'index.html');
  if (route === '/404') return join(dist, '404.html');
  return join(dist, route.slice(1), 'index.html');
}

export function page(route: string): CheerioAPI {
  const file = pageFile(route);
  if (!existsSync(file)) {
    throw new Error(`${file} is missing. Run "npm run test:site", which builds the site first.`);
  }
  return load(readFileSync(file, 'utf8'));
}

/** All the CSS the site ships: linked files and style blocks inside pages. */
export function siteCss(): string {
  const assets = join(dist, '_astro');
  const linked = existsSync(assets)
    ? readdirSync(assets)
        .filter((name) => name.endsWith('.css'))
        .map((name) => readFileSync(join(assets, name), 'utf8'))
    : [];
  const inline = ROUTES.flatMap((route) => {
    const $ = page(route);
    return $('style')
      .toArray()
      .map((element) => $(element).text());
  });
  return [...linked, ...inline].join('\n');
}

/** Each CSS rule as a selector and a body. Works on the minified CSS that Astro writes. */
export function cssRules(css: string): { selector: string; body: string }[] {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selector: (match[1] ?? '').replace(/\[data-astro-cid-[^\]]+\]/g, '').trim(),
    body: match[2] ?? '',
  }));
}

export function contentJson<T>(path: string): T {
  return JSON.parse(readFileSync(join(root, 'src/content', path), 'utf8')) as T;
}

export function contentFiles(collection: string, extension: string): string[] {
  return readdirSync(join(root, 'src/content', collection))
    .filter((name) => name.endsWith(extension))
    .sort();
}

export interface TeamFile {
  name: string;
  status: string;
  sample: boolean;
}

/** The settings at the top of each team file. Enough for counting: not a full YAML reader. */
export function teamFiles(): TeamFile[] {
  return contentFiles('teams', '.md').map((file) => {
    const text = readFileSync(join(root, 'src/content/teams', file), 'utf8');
    const settings = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? '';
    const value = (key: string) => new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(settings)?.[1]?.trim() ?? '';
    return { name: value('name'), status: value('status'), sample: value('sample') === 'true' };
  });
}

export function eventEnabled(): boolean {
  return contentJson<{ enabled: boolean }>('event/event.json').enabled;
}

export const clean = (text: string) => text.replace(/\s+/g, ' ').trim();

/** The text of every element that matches, tidied. */
export function texts($: CheerioAPI, selector: string): string[] {
  return $(selector)
    .toArray()
    .map((element) => clean($(element).text()));
}
