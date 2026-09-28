import { describe, expect, it } from 'vitest';
import { isCurrent, navItems } from '../../src/lib/nav';

describe('navItems', () => {
  it('lists the pages in the agreed order', () => {
    expect(navItems(false)).toEqual([
      { href: '/school', label: 'Our School' },
      { href: '/programme', label: 'Programme' },
      { href: '/teams', label: 'Teams' },
      { href: '/season', label: 'Season' },
      { href: '/resources', label: 'Resources' },
      { href: '/support', label: 'Support' },
      { href: '/dashboard', label: 'Team Login' },
    ]);
  });

  it('adds Event at the end only when the event is enabled', () => {
    expect(navItems(true).at(-1)).toEqual({ href: '/event', label: 'Event' });
    expect(navItems(true)).toHaveLength(8);
    expect(navItems(false).some((item) => item.href === '/event')).toBe(false);
  });

  it('returns a fresh list each time', () => {
    navItems(false).push({ href: '/x', label: 'X' });
    expect(navItems(false)).toHaveLength(7);
  });
});

describe('isCurrent', () => {
  it('matches with or without a trailing slash', () => {
    expect(isCurrent('/school', '/school')).toBe(true);
    expect(isCurrent('/school/', '/school')).toBe(true);
  });

  it('does not match other pages or the home page', () => {
    expect(isCurrent('/schools', '/school')).toBe(false);
    expect(isCurrent('/', '/school')).toBe(false);
  });
});
