import { z } from 'astro/zod';
import { describe, expect, it } from 'vitest';
import {
  eventSchema,
  heritageSchema,
  programmeSchema,
  resourceSchema,
  resultSchema,
  schoolSchema,
  seasonSchema,
  siteSchema,
  supportSchema,
  teamSchema,
} from '../../src/lib/schemas';

// Astro supplies image() at build time. A plain string stands in for it here.
const image = () => z.string();
const team = teamSchema(image);

const validTeam = {
  name: 'Velocity',
  season: '2026-27',
  category: 'Development',
  members: ['Priya Sharma (Team Principal)'],
  status: 'active',
};

function issues(result: { success: boolean; error?: z.ZodError }) {
  return (result.error?.issues ?? []).map((issue) => ({
    path: issue.path.join('.'),
    code: issue.code,
    message: issue.message,
  }));
}

describe('team', () => {
  it('accepts a team with no car name and no image', () => {
    const result = team.safeParse(validTeam);
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ sample: false });
  });

  it('rejects the old colours field, so a team cannot bring its own colours', () => {
    const result = team.safeParse({ ...validTeam, colours: ['#19c6d1'] });
    expect(issues(result)).toEqual([
      { path: '', code: 'unrecognized_keys', message: 'Unrecognized key: "colours"' },
    ]);
  });

  it('names a misspelt field', () => {
    const result = team.safeParse({ ...validTeam, carname: 'Falcon' });
    expect(issues(result)[0]?.message).toBe('Unrecognized key: "carname"');
  });

  it('names the field when the category is wrong', () => {
    const result = team.safeParse({ ...validTeam, category: 'Pro' });
    expect(issues(result)[0]?.path).toBe('category');
  });

  it('needs at least one member', () => {
    const result = team.safeParse({ ...validTeam, members: [] });
    expect(issues(result)).toEqual([{ path: 'members', code: 'too_small', message: 'List at least one member' }]);
  });

  it('rejects a blank name', () => {
    const result = team.safeParse({ ...validTeam, name: '   ' });
    expect(issues(result)).toEqual([{ path: 'name', code: 'too_small', message: 'This field cannot be empty' }]);
  });
});

describe('season', () => {
  const validSeason = {
    year: '2026-27',
    registrationOpen: false,
    timeline: [{ title: 'Regional Finals', description: '' }],
  };

  it('accepts a milestone with no date and a season with no deadline', () => {
    expect(seasonSchema.safeParse(validSeason).success).toBe(true);
  });

  it('says how to write a date, and which one is wrong', () => {
    const result = seasonSchema.safeParse({
      ...validSeason,
      timeline: [
        { date: '2026-09-16', title: 'Briefing', description: '' },
        { date: '2 Oct 2026', title: 'Deadline', description: '' },
      ],
    });
    expect(issues(result)).toEqual([
      { path: 'timeline.1.date', code: 'invalid_format', message: 'Use YYYY-MM-DD, for example 2026-10-02' },
    ]);
  });

  it.each(['2026-09-31', '2027-02-29', '2026-13-45', '2026-00-10'])(
    'rejects %s, which has the right form but is not on the calendar',
    (date) => {
      const milestone = seasonSchema.safeParse({
        ...validSeason,
        timeline: [{ date, title: 'Regional Finals', description: '' }],
      });
      expect(issues(milestone)).toEqual([
        { path: 'timeline.0.date', code: 'custom', message: 'This date is not on the calendar. Check the day and the month' },
      ]);

      const deadline = seasonSchema.safeParse({ ...validSeason, registrationDeadline: date });
      expect(issues(deadline)).toEqual([
        {
          path: 'registrationDeadline',
          code: 'custom',
          message: 'This date is not on the calendar. Check the day and the month',
        },
      ]);
    },
  );

  it('accepts 29 February in a leap year', () => {
    expect(seasonSchema.safeParse({ ...validSeason, registrationDeadline: '2028-02-29' }).success).toBe(true);
  });

  it('checks the form of the year label', () => {
    const result = seasonSchema.safeParse({ ...validSeason, year: '2026/27' });
    expect(issues(result)[0]).toMatchObject({ path: 'year', message: 'Use the form 2026-27' });
  });
});

describe('result', () => {
  it('only accepts the three event names', () => {
    const base = { season: '2025', team: 'SuperCharged', placing: 'Represented India' };
    expect(resultSchema.safeParse({ ...base, event: 'World Finals' }).data?.awards).toEqual([]);
    expect(issues(resultSchema.safeParse({ ...base, event: 'Worlds' }))[0]?.path).toBe('event');
  });
});

describe('resource', () => {
  const base = { title: 'Downloads', description: 'Documents.', category: 'Official' };

  it('accepts a web link and a file in the public folder', () => {
    expect(resourceSchema.safeParse({ ...base, fileUrl: 'https://www.stemracing.com/downloads' }).success).toBe(true);
    expect(resourceSchema.safeParse({ ...base, fileUrl: '/downloads/booklet.pdf' }).success).toBe(true);
  });

  it('rejects a link with no https://', () => {
    const result = resourceSchema.safeParse({ ...base, fileUrl: 'www.stemracing.com/downloads' });
    expect(issues(result)[0]).toMatchObject({
      path: 'fileUrl',
      message: 'Start with https://, mailto: or / (for a file in the public folder)',
    });
  });
});

describe('site', () => {
  const base = {
    address: 'The British School',
    schoolUrl: 'https://www.british-school.org/',
    stats: [{ value: '8', label: 'Teams' }],
    contacts: [{ name: 'Ms Sonica Puri', role: 'Coordinator' }],
  };

  it('accepts a contact with no email address', () => {
    expect(siteSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a badly formed email address', () => {
    const result = siteSchema.safeParse({
      ...base,
      contacts: [{ name: 'A', role: 'B', email: 'not-an-address' }],
    });
    expect(issues(result)[0]?.path).toBe('contacts.0.email');
  });

  it('takes one to four figures', () => {
    expect(siteSchema.safeParse({ ...base, stats: [] }).success).toBe(false);
    const five = Array.from({ length: 5 }, () => ({ value: '1', label: 'x' }));
    expect(siteSchema.safeParse({ ...base, stats: five }).success).toBe(false);
  });
});

describe('programme', () => {
  const point = { title: 'Step', body: 'Text.' };

  it('needs exactly 12 steps, because the page says 12', () => {
    const eleven = Array.from({ length: 11 }, () => point);
    const result = programmeSchema.safeParse({ steps: eleven, roles: [point], judging: [point] });
    expect(issues(result)[0]).toMatchObject({ path: 'steps', message: 'The programme has exactly 12 steps' });
  });
});

describe('support, heritage and event', () => {
  it('needs at least one point for each role', () => {
    expect(supportSchema.safeParse({ coordinator: ['a'], mentor: ['b'], parents: [] }).success).toBe(false);
  });

  it('accepts a heritage entry with only a year and a team', () => {
    expect(heritageSchema(image).safeParse({ year: '2014', team: 'Team Ignite' }).success).toBe(true);
  });

  it('marks an event as real unless it says sample', () => {
    const result = eventSchema.safeParse({
      enabled: false,
      name: 'Regional Finals',
      dates: 'To be confirmed',
      venue: 'The British School',
      schedule: [],
      scrutineeringInfo: 'Bring the car.',
      whatToBring: [],
      contact: 'The coordinator',
    });
    expect(result.data?.sample).toBe(false);
  });
});

describe('strict collection schemas', () => {
  const point = { title: 'Step', body: 'Text.' };
  const cases = [
    ['season', seasonSchema, { year: '2026-27', registrationOpen: false, timeline: [] }],
    ['result', resultSchema, { season: '2025', team: 'Team', event: 'World Finals', placing: '1st', awards: [] }],
    ['resource', resourceSchema, { title: 'Guide', description: 'Text.', fileUrl: '/guide.pdf', category: 'Official' }],
    [
      'event',
      eventSchema,
      {
        enabled: false,
        name: 'Finals',
        dates: 'TBC',
        venue: 'School',
        schedule: [],
        scrutineeringInfo: 'Details.',
        whatToBring: [],
        contact: 'Coordinator',
      },
    ],
    ['heritage', heritageSchema(image), { year: '2014', team: 'Team Ignite' }],
    ['school', schoolSchema, { title: 'The British School', lead: 'Introduction.' }],
    [
      'site',
      siteSchema,
      {
        address: 'The British School',
        schoolUrl: 'https://www.british-school.org/',
        stats: [{ value: '8', label: 'Teams' }],
        contacts: [],
      },
    ],
    ['programme', programmeSchema, { steps: Array.from({ length: 12 }, () => point), roles: [point], judging: [point] }],
    ['support', supportSchema, { coordinator: ['a'], mentor: ['b'], parents: ['c'] }],
  ] as const;

  it.each(cases)('%s rejects an unknown field', (_name, schema, valid) => {
    const result = schema.safeParse({ ...valid, unexpected: true });
    expect(issues(result)).toEqual([
      { path: '', code: 'unrecognized_keys', message: 'Unrecognized key: "unexpected"' },
    ]);
  });
});
