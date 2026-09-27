import { describe, expect, it } from 'vitest';
import { clean, cssRules, page, ROUTES, siteCss } from '../helpers/site';

const css = siteCss();
const rules = cssRules(css);

describe('brand rules in the CSS', () => {
  it('never names Verdana', () => {
    expect(css).not.toMatch(/verdana/i);
  });

  it('never justifies or right-aligns text', () => {
    expect(css).not.toMatch(/text-align:\s*(justify|right|end)/);
  });

  it('uses no colour from the Discovery or Primary divisions', () => {
    for (const hex of ['#008a3f', '#95c11f', '#005ca9', '#009fe3']) expect(css.toLowerCase()).not.toContain(hex);
  });

  it('sets the display font in italic, and only on headlines, numerals and buttons', () => {
    const allowed =
      /^(h1,\s*h2|\.track|\.btn|\.step__num|\.stat__value|\.roles__num|\.site-footer__tagline)$/;
    const display = rules.filter((rule) => /font-family:\s*var\(--font-display\)/.test(rule.body));
    expect(display.length).toBeGreaterThan(0);
    for (const rule of display) {
      expect(rule.selector).toMatch(allowed);
      expect(rule.body, rule.selector).toMatch(/font-style:\s*italic/);
    }
  });

  it('fills text with a gradient only on large headings and numerals, with room for italic overhang', () => {
    const clippedRules = rules.filter((rule) => /background-clip:\s*text/.test(rule.body));
    const clipped = clippedRules.map((rule) => rule.selector);
    expect(clipped).toContain('.on-dark h2');
    for (const rule of clippedRules) {
      expect(['.on-dark h2', '.step__num']).toContain(rule.selector);
      expect(rule.body, rule.selector).toMatch(/padding-inline-end:\s*0?\.15em/);
    }
  });

  it('puts no effect on the logo', () => {
    const logo = rules.filter((rule) => rule.selector.includes('.brand-logo'));
    expect(logo.length).toBeGreaterThan(0);
    for (const rule of logo) {
      expect(rule.body).not.toMatch(/transform|filter|box-shadow|text-shadow|outline|border|opacity/);
    }
  });

  it('puts no shadow or rotation on either logo link', () => {
    // The dashboard pages ship the same rules in a file of their own, so each is counted once.
    const links = rules
      .filter((rule) => ['.site-header__home', '.site-footer__home'].includes(rule.selector))
      .filter((rule, index, all) => all.findIndex((other) => other.selector === rule.selector && other.body === rule.body) === index);
    expect(links).toHaveLength(2);
    for (const rule of links) expect(rule.body).not.toMatch(/(?:box-shadow|text-shadow|filter|rotate|transform):/);
  });

  it('pads the header logo link by half the logo height', () => {
    const home = rules.find((rule) => rule.selector === '.site-header__home');
    expect(home?.body).toMatch(/padding-block:\s*calc\(var\(--logo-h\)\s*\/\s*2\)/);
  });

  it('uses the header logo sizes in the footer at desktop and phone widths', () => {
    const footer = rules.filter((rule) => rule.selector === '.site-footer');
    expect(footer.some((rule) => /--logo-h:\s*3\.5rem/.test(rule.body))).toBe(true);
    expect(footer.some((rule) => /--logo-h:\s*2\.75rem/.test(rule.body))).toBe(true);
  });

  it('takes every shipped CSS colour from a token', () => {
    const declarations = [...css.matchAll(/(?:^|[;{])(?:color|background(?:-color)?|border(?:-[\w-]+)?-color|outline|box-shadow|text-shadow|fill|stroke):([^;}]+)/g)].map(
      (match) => (match[1] ?? '').trim(),
    );
    for (const value of declarations) {
      expect(value, `non-token colour: ${value}`).toMatch(
        /var\(--|^(?:transparent|#0000|0 0|currentColor|CanvasText|inherit|none)$/i,
      );
    }
  });

  it('only hides the phone navigation after JavaScript has started', () => {
    const hiddenNav = rules.filter(
      (rule) => rule.selector.includes('.site-nav') && /display:\s*none/.test(rule.body),
    );
    expect(hiddenNav.length).toBeGreaterThan(0);
    for (const rule of hiddenNav) expect(rule.selector).toContain('.js');
  });

  it('keeps the logo at or above its smallest size', () => {
    const logo = rules.find((rule) => rule.selector === '.brand-logo');
    expect(logo?.body).toMatch(/height:\s*max\(32px,/);
    expect(logo?.body).toMatch(/width:\s*auto/);
  });
});

describe.each(ROUTES)('brand rules on %s', (route) => {
  const $ = page(route);

  it('shows the official logo, unstretched, at a legal size', () => {
    const logos = $('img[data-logo]').toArray();
    expect(logos.length).toBeGreaterThanOrEqual(2);
    for (const logo of logos) {
      const width = Number($(logo).attr('width'));
      const height = Number($(logo).attr('height'));
      expect(height).toBeGreaterThanOrEqual(32);
      expect(width).toBeGreaterThanOrEqual(70);
      expect(Math.abs(width / height - 1200 / 492)).toBeLessThan(0.03);
      expect($(logo).attr('src')).toMatch(/\/_astro\/tbs-(colour|mono)-(white|black)\./);
      expect($(logo).attr('alt')).toBeTruthy();
    }
  });

  it('uses the full colour white logo on the dark header', () => {
    expect($('header img[data-logo]').attr('data-logo')).toBe('colour-white');
  });

  it('gives the header and footer logos the same intrinsic size', () => {
    expect($('header img[data-logo]').attr('height')).toBe($('footer img[data-logo]').attr('height'));
  });

  it('never claims the Formula 1 lockup', () => {
    expect(clean($('body').text())).not.toMatch(/supported by (formula 1|f1)/i);
  });

  it('keeps every text track short, and hides the repeated copies from screen readers', () => {
    const tracks = $('[data-track]').toArray();
    expect(tracks.length).toBeGreaterThan(0);
    for (const track of tracks) {
      const text = clean($(track).find('.sr-only').text());
      expect(text.split(' ').length).toBeLessThanOrEqual(3);
      expect($(track).find('.track__rows').attr('aria-hidden')).toBe('true');
      for (const ghost of $(track).find('.track__ghost').toArray()) {
        expect($(ghost).closest('[aria-hidden="true"]')).toHaveLength(1);
      }
      expect($(track).attr('style')).toMatch(/--track-chars:\s*\d+/);
    }
  });
});
