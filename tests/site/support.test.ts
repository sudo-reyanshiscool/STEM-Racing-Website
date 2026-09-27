import { describe, expect, it } from 'vitest';
import { contentJson, page, texts } from '../helpers/site';

describe('support', () => {
  const $ = page('/support');
  const support = contentJson<{ coordinator: string[]; mentor: string[]; parents: string[] }>(
    'support/support.json',
  );
  const site = contentJson<{ contacts: { name: string; email?: string }[] }>('site/site.json');

  it('shows the three roles with every point', () => {
    expect(texts($, '.roles h3')).toEqual(["Coordinator's role", "Mentor's role", "Parents' support"]);
    expect(texts($, '.roles__item span:last-child')).toEqual([
      ...support.coordinator,
      ...support.mentor,
      ...support.parents,
    ]);
  });

  it('shows each contact, with an email link only when one is given', () => {
    expect(texts($, 'main .card h3').filter((name) => site.contacts.some((c) => c.name === name))).toEqual(
      site.contacts.map((contact) => contact.name),
    );
    expect($('main a[href^="mailto:"]')).toHaveLength(site.contacts.filter((contact) => contact.email).length);
  });
});
