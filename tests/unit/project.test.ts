import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));

describe('project setup', () => {
  it('asks for a version of Node that Astro 7 supports', () => {
    expect(pkg.engines.node).toBe('>=22.12.0');
  });

  it('has the scripts the README describes', () => {
    expect(Object.keys(pkg.scripts)).toEqual(
      expect.arrayContaining(['dev', 'build', 'preview', 'check', 'test', 'test:site', 'test:all', 'check:publish']),
    );
  });

  it('adds no UI framework and no Tailwind', () => {
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    expect(names.filter((name) => /react|vue|svelte|solid|preact|tailwind/i.test(name))).toEqual([]);
  });
});
