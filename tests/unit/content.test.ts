import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'astro/zod';
import { describe, expect, it } from 'vitest';
import {
  eventSchema,
  heritageSchema,
  programmeSchema,
  resourceSchema,
  resultSchema,
  seasonSchema,
  siteSchema,
  supportSchema,
} from '../../src/lib/schemas';

// Checks every JSON content file against its rules without running a full build.
// Markdown files (teams, school) are checked by the build itself.
const content = join(process.cwd(), 'src/content');
const image = () => z.string();

const collections = {
  seasons: seasonSchema,
  results: resultSchema,
  resources: resourceSchema,
  event: eventSchema,
  heritage: heritageSchema(image),
  site: siteSchema,
  programme: programmeSchema,
  support: supportSchema,
};

const files = Object.entries(collections).flatMap(([name, schema]) =>
  readdirSync(join(content, name))
    .filter((file) => file.endsWith('.json'))
    .map((file) => ({ label: `${name}/${file}`, path: join(content, name, file), schema })),
);

describe('content files', () => {
  it('finds content to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('$label follows the rules for its collection', ({ path, schema }) => {
    const result = schema.safeParse(JSON.parse(readFileSync(path, 'utf8')));
    expect(result.error?.issues ?? []).toEqual([]);
  });
});
