import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { clean, contentJson, eventEnabled, page, pageFile, ROUTES } from '../helpers/site';

interface EventData {
  enabled: boolean;
  name: string;
  schedule: { time: string; activity: string }[];
  whatToBring: string[];
}

const event = contentJson<EventData>('event/event.json');

// This file checks whichever state event.json is in. The plan checks the other state by hand.
describe.runIf(!eventEnabled())('event switched off', () => {
  it('builds no event page', () => {
    expect(existsSync(pageFile('/event'))).toBe(false);
  });

  it.each(ROUTES)('%s has no link to it', (route) => {
    expect(page(route)('a[href="/event"]')).toHaveLength(0);
  });
});

describe.runIf(eventEnabled())('event switched on', () => {
  it('builds the event page with the schedule and the list of things to bring', () => {
    const $ = page('/event');
    expect($('h1')).toHaveLength(1);
    expect(clean($('#event-title').text())).toBe(event.name);
    expect($('.table tbody tr')).toHaveLength(event.schedule.length);
    expect($('.event-list li')).toHaveLength(event.whatToBring.length);
  });

  it.each(ROUTES)('%s links to it from the navigation', (route) => {
    expect(page(route)('nav[aria-label="Main"] a[href="/event"]')).toHaveLength(1);
  });
});
