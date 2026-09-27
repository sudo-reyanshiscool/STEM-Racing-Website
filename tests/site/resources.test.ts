import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { clean, contentFiles, contentJson, page, root, texts } from '../helpers/site';

describe('resources', () => {
  const $ = page('/resources');
  const resources = contentFiles('resources', '.json').map((file) =>
    contentJson<{ title: string; fileUrl: string; category: string }>(`resources/${file}`),
  );

  it('links every resource', () => {
    for (const resource of resources) {
      const link = $(`main a[href="${resource.fileUrl}"]`);
      expect(link, resource.title).toHaveLength(1);
      expect(clean(link.text())).toContain(resource.title);
    }
  });

  it('groups them under a heading for each category', () => {
    expect(texts($, 'main h2')).toEqual([...new Set(resources.map((r) => r.category))].sort());
  });

  it.each([
    '/downloads/stem-racing-world-finals-2026-technical-regulations.pdf',
    '/downloads/stem-racing-world-finals-2026-competition-regulations-revision-1.pdf',
  ])('publishes the official regulation PDF at %s', (fileUrl) => {
    expect(resources.some((resource) => resource.fileUrl === fileUrl)).toBe(true);
    const bytes = readFileSync(join(root, 'public', fileUrl));
    expect(bytes.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(1_000_000);
  });
});
