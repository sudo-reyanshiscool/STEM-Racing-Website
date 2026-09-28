import { describe, expect, it } from 'vitest';
import { navItems } from '../../src/lib/nav';
import { clean, contentJson, eventEnabled, page, ROUTES, SITE_URL } from '../helpers/site';

interface Site {
  address: string;
  schoolUrl: string;
  contacts: { name: string; role: string; email?: string }[];
}

const site = contentJson<Site>('site/site.json');
const expectedNav = navItems(eventEnabled());

describe.each(ROUTES)('%s', (route) => {
  const $ = page(route);

  it('is written in British English', () => {
    expect($('html').attr('lang')).toBe('en-GB');
  });

  it('has one h1 with text in it', () => {
    expect($('h1')).toHaveLength(1);
    expect(clean($('h1 .sr-only').text() || $('h1').text())).not.toBe('');
  });

  it('never skips a heading level', () => {
    const levels = $('h1, h2, h3, h4, h5, h6')
      .toArray()
      .map((heading) => Number(heading.tagName.slice(1)));
    expect(levels[0]).toBe(1);
    levels.forEach((level, index) => {
      if (index > 0) expect(level - (levels[index - 1] ?? 0)).toBeLessThanOrEqual(1);
    });
  });

  it('starts with a skip link to the main content', () => {
    const first = $('body').children().first();
    expect(first.is('a.skip-link')).toBe(true);
    expect(first.attr('href')).toBe('#main');
    expect($('main#main')).toHaveLength(1);
  });

  it('lists the pages in the agreed order', () => {
    const links = $('nav[aria-label="Main"] a')
      .toArray()
      .map((link) => ({ href: $(link).attr('href'), label: clean($(link).text()) }));
    expect(links).toEqual(expectedNav);
  });

  it('marks the current page in the navigation', () => {
    const current = $('nav[aria-label="Main"] a[aria-current="page"]')
      .toArray()
      .map((link) => $(link).attr('href'));
    expect(current).toEqual(route === '/' || route === '/404' ? [] : [route.startsWith('/regulations') ? '/resources' : route]);
  });

  it('gives every image a text alternative and a size', () => {
    for (const image of $('img').toArray()) {
      expect($(image).attr('alt'), $.html(image)).toBeDefined();
      expect(Number($(image).attr('width')), $.html(image)).toBeGreaterThan(0);
      expect(Number($(image).attr('height')), $.html(image)).toBeGreaterThan(0);
    }
  });

  it('gives every link and button a name', () => {
    for (const element of $('a, button').toArray()) {
      const name = clean($(element).text()) || $(element).attr('aria-label') || $(element).find('img').attr('alt');
      expect(name, $.html(element)).toBeTruthy();
    }
  });

  it('protects links that open in a new tab', () => {
    for (const link of $('a[target="_blank"]').toArray()) {
      expect($(link).attr('rel')).toContain('noopener');
      expect(clean($(link).text())).toContain('(opens in a new tab)');
    }
  });

  it('has a title, a description, a canonical address and a social share preview', () => {
    expect(clean($('title').text())).toMatch(/STEM Racing/);
    expect(($('meta[name="description"]').attr('content') ?? '').length).toBeGreaterThan(20);
    const path = route === '/' ? '/' : route;
    expect($('link[rel="canonical"]').attr('href')).toBe(`${SITE_URL}${path}`);
    expect($('meta[property="og:image"]').attr('content')).toBe(`${SITE_URL}/og-image.png`);
    expect($('meta[property="og:image:width"]').attr('content')).toBe('1200');
    expect($('meta[property="og:image:height"]').attr('content')).toBe('630');
    expect($('meta[name="twitter:card"]').attr('content')).toBe('summary_large_image');
    expect($('meta[name="twitter:image"]').attr('content')).toBe(`${SITE_URL}/og-image.png`);
  });

  it('loads the two main fonts early', () => {
    const preloads = $('link[rel="preload"][as="font"]')
      .toArray()
      .map((link) => ({ href: $(link).attr('href'), crossorigin: $(link).attr('crossorigin') !== undefined }));
    expect(preloads).toEqual([
      { href: '/fonts/Magistral-BoldItalic.woff2', crossorigin: true },
      { href: '/fonts/MachoModular-Medium.woff2', crossorigin: true },
    ]);
  });

  it('shows the contacts and the address in the footer', () => {
    const footer = clean($('footer').text());
    expect(footer).toContain(site.address);
    for (const contact of site.contacts) {
      expect(footer).toContain(contact.name);
      expect(footer).toContain(contact.role);
    }
    expect($(`footer a[href="${site.schoolUrl}"]`)).toHaveLength(1);
  });

  it('keeps the approved footer tagline word for word', () => {
    expect(clean($('.site-footer__tagline').text())).toBe('Accelerating Futures');
  });

  it('works before any script runs: nothing is hidden in the markup', () => {
    expect($('[hidden]')).toHaveLength(0);
    expect($('.reveal-pending')).toHaveLength(0);
    expect($('nav[aria-label="Main"]').attr('class')).not.toContain('is-open');
  });
});
