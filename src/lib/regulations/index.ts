import type { RegDoc, RegSection } from './types';

const files = import.meta.glob<RegDoc>('../../data/regulations/*.json', { eager: true, import: 'default' });

/** The order the documents appear in on the hub and in the page footer links. */
const ORDER = ['competition', 'technical', 'project-management', 'ai-guidance'];

export function getRegDocs(): RegDoc[] {
  return Object.values(files).sort((a, b) => ORDER.indexOf(a.slug) - ORDER.indexOf(b.slug));
}

export function getRegDoc(slug: string): RegDoc | undefined {
  return getRegDocs().find((doc) => doc.slug === slug);
}

export interface TocEntry {
  id: string;
  label?: string;
  title: string;
  depth: number;
}

/** The table of contents: articles and their titled parts, two levels deep. */
export function tableOfContents(sections: RegSection[]): TocEntry[] {
  const walk = (list: RegSection[], depth: number): TocEntry[] =>
    list.flatMap((section) => [
      { id: section.id, label: section.label, title: section.title, depth },
      ...(depth < 2 ? walk(section.children ?? [], depth + 1) : []),
    ]);
  return walk(sections, 1);
}
