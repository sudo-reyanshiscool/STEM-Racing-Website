// Every content collection on the site. The files live in src/content.
// The rules for each collection are in src/lib/schemas.ts.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import type { Loader } from 'astro/loaders';
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
} from './lib/schemas';

/**
 * Reads a folder of content files, starting from an empty store each time.
 * Astro keeps the last build's entries when a folder has no files in it, so without this
 * a deleted team or season would stay on the site.
 */
function files(pattern: string, base: string): Loader {
  const inner = glob({ pattern, base });
  return {
    ...inner,
    load: async (context) => {
      context.store.clear();
      await inner.load(context);
    },
  };
}

const teams = defineCollection({
  loader: files('*.md', './src/content/teams'),
  schema: ({ image }) => teamSchema(image),
});

const seasons = defineCollection({
  loader: files('*.json', './src/content/seasons'),
  schema: seasonSchema,
});

const results = defineCollection({
  loader: files('*.json', './src/content/results'),
  schema: resultSchema,
});

const resources = defineCollection({
  loader: files('*.json', './src/content/resources'),
  schema: resourceSchema,
});

const event = defineCollection({
  loader: files('event.json', './src/content/event'),
  schema: eventSchema,
});

const heritage = defineCollection({
  loader: files('*.json', './src/content/heritage'),
  schema: ({ image }) => heritageSchema(image),
});

const school = defineCollection({
  loader: files('school.md', './src/content/school'),
  schema: schoolSchema,
});

const site = defineCollection({
  loader: files('site.json', './src/content/site'),
  schema: siteSchema,
});

const programme = defineCollection({
  loader: files('programme.json', './src/content/programme'),
  schema: programmeSchema,
});

const support = defineCollection({
  loader: files('support.json', './src/content/support'),
  schema: supportSchema,
});

export const collections = {
  teams,
  seasons,
  results,
  resources,
  event,
  heritage,
  school,
  site,
  programme,
  support,
};
