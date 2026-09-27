// One schema per content collection. Every object is strict: a misspelt or unknown field
// fails the build and the error names the file and the field.
import { z } from 'astro/zod';

const DATE_FORM = /^\d{4}-\d{2}-\d{2}$/;

/** False for a date such as 31 September. Text in the wrong form is left to the rule before this one. */
function onCalendar(value: string): boolean {
  if (!DATE_FORM.test(value)) return true;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const text = z.string().trim().min(1, 'This field cannot be empty');
const isoDate = z
  .string()
  .regex(DATE_FORM, 'Use YYYY-MM-DD, for example 2026-10-02')
  .refine(onCalendar, 'This date is not on the calendar. Check the day and the month');
const link = z
  .string()
  .regex(/^(https:\/\/|mailto:|\/)/, 'Start with https://, mailto: or / (for a file in the public folder)');
const point = z.strictObject({ title: text, body: text });

/** Astro passes an image() helper to collection schemas. Tests pass a stand-in. */
export const teamSchema = <T extends z.ZodType>(image: () => T) =>
  z.strictObject({
    name: text,
    carName: text.optional(),
    season: text,
    category: z.enum(['Development', 'Professional']),
    members: z.array(text).min(1, 'List at least one member'),
    status: z.enum(['active', 'archived']),
    heroImage: image().optional(),
    sample: z.boolean().default(false),
  });

export const seasonSchema = z.strictObject({
  year: z.string().regex(/^\d{4}-\d{2}$/, 'Use the form 2026-27'),
  name: text.optional(),
  registrationOpen: z.boolean(),
  registrationDeadline: isoDate.optional(),
  registrationUrl: link.optional(),
  timeline: z.array(
    z.strictObject({
      date: isoDate.optional(),
      title: text,
      description: z.string(),
    }),
  ),
});

export const resultSchema = z.strictObject({
  season: text,
  team: text,
  event: z.enum(['Regionals', 'Nationals', 'World Finals']),
  placing: text,
  awards: z.array(text).default([]),
});

export const resourceSchema = z.strictObject({
  title: text,
  description: text,
  fileUrl: link,
  category: text,
});

export const eventSchema = z.strictObject({
  enabled: z.boolean(),
  sample: z.boolean().default(false),
  name: text,
  dates: text,
  venue: text,
  schedule: z.array(z.strictObject({ time: text, activity: text })),
  scrutineeringInfo: text,
  whatToBring: z.array(text),
  contact: text,
});

export const heritageSchema = <T extends z.ZodType>(image: () => T) =>
  z.strictObject({
    year: text,
    team: text,
    note: text.optional(),
    image: image().optional(),
  });

export const schoolSchema = z.strictObject({
  title: text,
  lead: text,
});

export const siteSchema = z.strictObject({
  address: text,
  schoolUrl: link,
  stats: z.array(z.strictObject({ value: text, label: text })).min(1).max(4),
  contacts: z.array(z.strictObject({ name: text, role: text, email: z.email().optional() })),
});

export const programmeSchema = z.strictObject({
  steps: z.array(point).length(12, 'The programme has exactly 12 steps'),
  roles: z.array(point).min(1),
  judging: z.array(point).min(1),
});

export const supportSchema = z.strictObject({
  coordinator: z.array(text).min(1),
  mentor: z.array(text).min(1),
  parents: z.array(text).min(1),
});
