// @vitest-environment happy-dom
// Runs src/scripts/dates.ts against pages the site has built, on a day the test chooses.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { BUILD_TIMEOUT, copySite, type SiteCopy } from '../helpers/sandbox';
import { page, root, ROUTES } from '../helpers/site';

/** Puts the body of a built page in the document, as the browser has it just before the scripts run. */
function open(html: string): void {
  const body = /<body[^>]*>([\s\S]*)<\/body>/.exec(html)?.[1] ?? '';
  document.body.innerHTML = body.replace(/<script\b[\s\S]*?<\/script>/g, '');
}

/** Runs the script as if the page were opened on the given day, at 11:30 in New Delhi. */
async function runOn(day: string): Promise<void> {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${day}T06:00:00Z`));
  vi.resetModules();
  await import('../../src/scripts/dates.ts');
}

const text = (selector: string) => document.querySelector(selector)?.textContent?.trim();
const registerLinks = () => document.querySelectorAll('[data-season-status] a');

afterEach(() => {
  vi.useRealTimers();
});

it('ships the date-refresh code on every page', () => {
  for (const route of ROUTES) {
    const src = page(route)('script[type="module"][src]').attr('src');
    expect(src, route).toBeTruthy();
    const bundle = readFileSync(join(root, 'dist', 'client', src?.replace(/^\//, '') ?? ''), 'utf8');
    expect(bundle, route).toContain('data-season-status');
    expect(bundle, route).toContain('data-dim-past');
  }
});

describe('a season with a registration deadline', () => {
  let copy: SiteCopy;

  beforeAll(() => {
    copy = copySite();
    copy.empty('seasons');
    copy.write(
      'seasons/2998-99.json',
      JSON.stringify({
        year: '2998-99',
        registrationOpen: true,
        registrationDeadline: '2998-10-02',
        registrationUrl: 'https://example.org/register',
        timeline: [{ date: '2998-10-02', title: 'Registration closes', description: '' }],
      }),
    );
    copy.build();
  }, BUILD_TIMEOUT);

  afterAll(() => {
    copy.remove();
  });

  it('is built with the Register button while the deadline is ahead', () => {
    open(copy.html('/season'));
    expect(text('[data-status="registration"]')).toBe('Registration open until 2 October 2998');
    expect(registerLinks()).toHaveLength(1);
  });

  it('keeps the button on the day of the deadline', async () => {
    open(copy.html('/season'));
    await runOn('2998-10-02');
    expect(text('[data-status="registration"]')).toBe('Registration open until 2 October 2998');
    expect(registerLinks()).toHaveLength(1);
  });

  it('says closed and takes the button away once the deadline has passed', async () => {
    open(copy.html('/season'));
    await runOn('2998-10-03');
    expect(text('[data-status="registration"]')).toBe('Registration closed');
    expect(registerLinks()).toHaveLength(0);
  });
});
