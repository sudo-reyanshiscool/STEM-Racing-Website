// Checks on what a person typed into a dashboard form. No database and no Astro imports.

export const LIMITS = {
  title: 120,
  note: 2000,
  linkLabel: 60,
  url: 2000,
  tasks: 200,
  links: 30,
} as const;

export type Errors = Record<string, string>;
export type Checked<T> = { ok: true; value: T } | { ok: false; errors: Errors };

export interface TaskFields {
  title: string;
  /** A role title from the programme page. Null when the task has no owner. */
  ownerRole: string | null;
  /** YYYY-MM-DD. Null when the task has no due date. */
  dueDate: string | null;
}

export interface LinkFields {
  label: string;
  url: string;
}

/** A form field as text. A file or a missing field is empty text. */
export function text(value: unknown): string {
  // Postgres refuses the null character, and no one types it.
  return typeof value === 'string' ? value.replaceAll('\u0000', '').trim() : '';
}

/** Counts characters as a person does: an emoji is one, not two. */
function length(value: string): number {
  return [...value].length;
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function checkTask(
  input: { title: unknown; ownerRole: unknown; dueDate: unknown },
  roles: readonly string[],
): Checked<TaskFields> {
  const title = text(input.title);
  const ownerRole = text(input.ownerRole);
  const dueDate = text(input.dueDate);
  const errors: Errors = {};
  if (title === '') errors.title = 'Give the task a title.';
  else if (length(title) > LIMITS.title) errors.title = `Keep the title to ${LIMITS.title} characters or fewer.`;
  if (ownerRole !== '' && !roles.includes(ownerRole)) errors.ownerRole = 'Choose a role from the list.';
  if (dueDate !== '' && !isIsoDate(dueDate)) errors.dueDate = 'Use a date on the calendar, in the form 2026-10-02.';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { title, ownerRole: ownerRole || null, dueDate: dueDate || null } };
}

export function checkNote(input: unknown): Checked<string> {
  const note = text(input);
  if (length(note) > LIMITS.note) {
    return { ok: false, errors: { note: `Keep the note to ${LIMITS.note} characters or fewer.` } };
  }
  return { ok: true, value: note };
}

function isHttpsUrl(value: string): boolean {
  if (!value.startsWith('https://') || /\s/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname !== '' && url.username === '' && url.password === '';
  } catch {
    return false;
  }
}

export function checkLink(input: { label: unknown; url: unknown }): Checked<LinkFields> {
  const label = text(input.label);
  const url = text(input.url);
  const errors: Errors = {};
  if (label === '') errors.label = 'Give the link a name.';
  else if (length(label) > LIMITS.linkLabel) errors.label = `Keep the name to ${LIMITS.linkLabel} characters or fewer.`;
  if (url === '') errors.url = 'Paste the address of the link.';
  else if (length(url) > LIMITS.url) errors.url = 'This address is too long.';
  else if (!isHttpsUrl(url)) errors.url = 'The address must start with https://';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { label, url } };
}

/** A whole number above zero from a form field, for the id of a task or a link. */
export function checkId(input: unknown): number | undefined {
  const value = text(input);
  if (!/^[1-9]\d{0,8}$/.test(value)) return undefined;
  return Number(value);
}
