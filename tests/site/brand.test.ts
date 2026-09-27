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

  it('fills text with a gradient only on large headings and numerals', () => {
    const clipped = rules.filter((rule) => /background-clip:\s*text/.test(rule.body)).map((rule) => rule.selector);
    expect(clipped).toContain('.on-dark h2');
    for (const selector of clipped) expect(['.on-dark h2', '.step__num']).toContain(selector);
  });

  it('puts no effect on the logo', () => {
    const logo = rules.filter((rule) => rule.selector.includes('.brand-logo'));
    expect(logo.length).toBeGreaterThan(0);
    for (const rule of logo) {
      expect(rule.body).not.toMatch(/transform|filter|box-shadow|text-shadow|outline|border|opacity/);
    }
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
