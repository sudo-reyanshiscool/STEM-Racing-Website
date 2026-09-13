// Defines every content collection on the site.
// All editable content lives in src/content. Nothing here needs changing
// unless you want to add a new field to a collection.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const teams = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/teams' }),
  schema: z.object({
    name: z.string(),
    carName: z.string(),
    season: z.string(),
    category: z.enum(['Development', 'Professional']),
    members: z.array(z.string()).min(1),
    status: z.enum(['active', 'archived']),
    heroImage: z.string().optional(),
    colours: z.array(z.string()).optional(),
  }),
});

const seasons = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/seasons' }),
  schema: z.object({
    year: z.string(),
    timeline: z.array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
        title: z.string(),
        description: z.string(),
      }),
    ),
    registrationOpen: z.boolean(),
    registrationDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  }),
});

const results = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/results' }),
  schema: z.object({
    season: z.string(),
    team: z.string(),
    event: z.enum(['Regionals', 'Nationals', 'World Finals']),
    placing: z.string(),
    awards: z.array(z.string()).default([]),
  }),
});

const resources = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/resources' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    fileUrl: z.string(),
    category: z.string(),
  }),
});

const event = defineCollection({
  loader: glob({ pattern: 'event.json', base: './src/content/event' }),
  schema: z.object({
    enabled: z.boolean(),
    name: z.string(),
    dates: z.string(),
    venue: z.string(),
    schedule: z.array(
      z.object({
        time: z.string(),
        activity: z.string(),
      }),
    ),
    scrutineeringInfo: z.string(),
    whatToBring: z.array(z.string()),
    contact: z.string(),
  }),
});

export const collections = { teams, seasons, results, resources, event };
