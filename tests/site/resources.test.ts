import { describe, expect, it } from 'vitest';
import { clean, contentFiles, contentJson, page, texts } from '../helpers/site';

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
});
