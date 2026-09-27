// The main navigation. The order is fixed by the design.

export interface NavItem {
  href: string;
  label: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/school', label: 'Our School' },
  { href: '/programme', label: 'Programme' },
  { href: '/teams', label: 'Teams' },
  { href: '/season', label: 'Season' },
  { href: '/resources', label: 'Resources' },
  { href: '/support', label: 'Support' },
];

export function navItems(eventEnabled: boolean): NavItem[] {
  return eventEnabled ? [...NAV_ITEMS, { href: '/event', label: 'Event' }] : [...NAV_ITEMS];
}

export function isCurrent(pathname: string, href: string): boolean {
  const clean = (value: string) => (value.length > 1 ? value.replace(/\/+$/, '') : value);
  return clean(pathname) === clean(href);
}
