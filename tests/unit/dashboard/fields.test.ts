import { describe, expect, it } from 'vitest';
import { DELIVERABLES, isDeliverableKey, isStatus, STATUSES } from '../../../src/lib/dashboard/deliverables';
import { checkId, checkLink, checkNote, checkTask, isIsoDate, text } from '../../../src/lib/dashboard/fields';

const ROLES = ['Design and engineering', 'Enterprise', 'Project management'];

describe('deliverables', () => {
  it('lists the ten lines in the order the spec gives', () => {
    expect(DELIVERABLES.map((item) => item.label)).toEqual([
      'Car',
      'Engineering Drawings',
      'Renders',
      'Engineering Portfolio',
      'Enterprise Portfolio',
      'Project Management Portfolio',
      'AI Declaration',
      'Pit Display',
      'Verbal Presentation Script',
      'Verbal Presentation Video',
    ]);
  });

  it('gives each line its own key', () => {
    expect(new Set(DELIVERABLES.map((item) => item.key)).size).toBe(10);
  });

  it('has three statuses', () => {
    expect(STATUSES.map((status) => status.value)).toEqual(['not_started', 'in_progress', 'done']);
  });

  it('knows its keys and statuses from anything else', () => {
    expect(isDeliverableKey('car')).toBe(true);
    expect(isDeliverableKey('Car')).toBe(false);
    expect(isDeliverableKey(undefined)).toBe(false);
    expect(isStatus('done')).toBe(true);
    expect(isStatus('finished')).toBe(false);
    expect(isStatus(null)).toBe(false);
  });
});

describe('text', () => {
  it('trims, and treats a file or a missing field as empty', () => {
    expect(text('  hello  ')).toBe('hello');
    expect(text(null)).toBe('');
    expect(text(undefined)).toBe('');
    expect(text(new Blob(['x']))).toBe('');
  });

  it('drops the null character, which Postgres refuses', () => {
    expect(text('a\u0000b')).toBe('ab');
  });
});

describe('dates', () => {
  it('accepts a date on the calendar', () => {
    expect(isIsoDate('2026-10-02')).toBe(true);
    expect(isIsoDate('2028-02-29')).toBe(true);
  });

  it.each(['2026-09-31', '2026-13-01', '2027-02-29', '02/10/2026', '2026-1-2', '', '2026-10-02T00:00'])(
    'refuses %s',
    (value) => {
      expect(isIsoDate(value)).toBe(false);
    },
  );
});

describe('a task', () => {
  it('passes with a title alone', () => {
    expect(checkTask({ title: ' Book the wind tunnel ', ownerRole: '', dueDate: '' }, ROLES)).toEqual({
      ok: true,
      value: { title: 'Book the wind tunnel', ownerRole: null, dueDate: null },
    });
  });

  it('keeps a role and a date', () => {
    expect(checkTask({ title: 'Render the car', ownerRole: 'Enterprise', dueDate: '2026-10-02' }, ROLES)).toEqual({
      ok: true,
      value: { title: 'Render the car', ownerRole: 'Enterprise', dueDate: '2026-10-02' },
    });
  });

  it('needs a title', () => {
    expect(checkTask({ title: '   ', ownerRole: '', dueDate: '' }, ROLES)).toEqual({
      ok: false,
      errors: { title: 'Give the task a title.' },
    });
    expect(checkTask({ title: undefined, ownerRole: undefined, dueDate: undefined }, ROLES).ok).toBe(false);
  });

  it('allows 120 characters and refuses 121', () => {
    expect(checkTask({ title: 'a'.repeat(120), ownerRole: '', dueDate: '' }, ROLES).ok).toBe(true);
    expect(checkTask({ title: 'a'.repeat(121), ownerRole: '', dueDate: '' }, ROLES)).toEqual({
      ok: false,
      errors: { title: 'Keep the title to 120 characters or fewer.' },
    });
  });

  it('counts an emoji as one character', () => {
    expect(checkTask({ title: '🏁'.repeat(120), ownerRole: '', dueDate: '' }, ROLES).ok).toBe(true);
  });

  it('reports every field that is wrong', () => {
    expect(checkTask({ title: '', ownerRole: 'Driver', dueDate: '2026-09-31' }, ROLES)).toEqual({
      ok: false,
      errors: {
        title: 'Give the task a title.',
        ownerRole: 'Choose a role from the list.',
        dueDate: 'Use a date on the calendar, in the form 2026-10-02.',
      },
    });
  });
});

describe('a note', () => {
  it('may be empty', () => {
    expect(checkNote('')).toEqual({ ok: true, value: '' });
    expect(checkNote(undefined)).toEqual({ ok: true, value: '' });
  });

  it('allows 2,000 characters and refuses 2,001', () => {
    expect(checkNote('a'.repeat(2000)).ok).toBe(true);
    expect(checkNote('a'.repeat(2001))).toEqual({
      ok: false,
      errors: { note: 'Keep the note to 2000 characters or fewer.' },
    });
  });

  it('keeps line breaks inside the note', () => {
    expect(checkNote('one\ntwo')).toEqual({ ok: true, value: 'one\ntwo' });
  });
});

describe('a link', () => {
  it('passes with a name and an https address', () => {
    expect(checkLink({ label: 'Drive folder', url: 'https://drive.google.com/drive/folders/abc' })).toEqual({
      ok: true,
      value: { label: 'Drive folder', url: 'https://drive.google.com/drive/folders/abc' },
    });
  });

  it.each([
    ['http', 'http://example.org'],
    ['javascript', 'javascript:alert(1)'],
    ['data', 'data:text/html,hello'],
    ['no scheme', 'drive.google.com'],
    ['a scheme alone', 'https://'],
    ['a space inside', 'https://example.org/a b'],
    ['a line break inside', 'https://example.org/\nx'],
    ['a name and password', 'https://user:pass@example.org'],
    ['upper case scheme', 'HTTPS://example.org'],
  ])('refuses an address with %s', (_name, url) => {
    expect(checkLink({ label: 'Link', url })).toEqual({
      ok: false,
      errors: { url: 'The address must start with https://' },
    });
  });

  it('needs a name and an address', () => {
    expect(checkLink({ label: '', url: '' })).toEqual({
      ok: false,
      errors: { label: 'Give the link a name.', url: 'Paste the address of the link.' },
    });
  });

  it('allows a name of 60 characters and refuses 61', () => {
    expect(checkLink({ label: 'a'.repeat(60), url: 'https://example.org' }).ok).toBe(true);
    expect(checkLink({ label: 'a'.repeat(61), url: 'https://example.org' })).toEqual({
      ok: false,
      errors: { label: 'Keep the name to 60 characters or fewer.' },
    });
  });

  it('refuses an address longer than 2,000 characters', () => {
    expect(checkLink({ label: 'Link', url: `https://example.org/${'a'.repeat(2000)}` })).toEqual({
      ok: false,
      errors: { url: 'This address is too long.' },
    });
  });
});

describe('an id', () => {
  it('reads a whole number above zero', () => {
    expect(checkId('12')).toBe(12);
  });

  it.each(['', '0', '-1', '1.5', '1e3', ' 12abc', '12345678901', 'abc', undefined, null])('refuses %s', (value) => {
    expect(checkId(value)).toBeUndefined();
  });
});
