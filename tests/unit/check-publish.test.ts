import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const script = join(process.cwd(), 'scripts/check-publish.mjs');
const made: string[] = [];

function contentWith(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'tbs-content-'));
  made.push(dir);
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(join(dir, name, '..'), { recursive: true });
    writeFileSync(join(dir, name), text);
  }
  return dir;
}

function run(dir: string) {
  const result = spawnSync('node', [script, dir], { encoding: 'utf8' });
  return { code: result.status, out: result.stdout + result.stderr };
}

afterEach(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('check-publish', () => {
  it('passes when nothing is marked as a sample', () => {
    const dir = contentWith({
      'teams/velocity.md': '---\nname: Velocity\nstatus: active\n---\n\nA real team.\n',
      'site/site.json': '{ "address": "The British School" }',
    });
    expect(run(dir)).toEqual({
      code: 0,
      out: 'Ready to publish: no sample entries and no example links.\n',
    });
  });

  it('lists a sample team', () => {
    const dir = contentWith({
      'teams/sample-team-a.md': '---\nname: Sample Team A\nsample: true\n---\n\nText.\n',
    });
    const result = run(dir);
    expect(result.code).toBe(1);
    expect(result.out).toContain('teams/sample-team-a.md: sample entry.');
  });

  it('ignores the word sample in the text of a page', () => {
    const dir = contentWith({
      'teams/velocity.md': '---\nname: Velocity\n---\n\nsample: true is how you mark a sample.\n',
    });
    expect(run(dir).code).toBe(0);
  });

  it('lets a sample event through while the event page is switched off', () => {
    const dir = contentWith({ 'event/event.json': '{ "enabled": false, "sample": true }' });
    expect(run(dir).code).toBe(0);
  });

  it('lists a sample event once the event page is switched on', () => {
    const dir = contentWith({ 'event/event.json': '{ "enabled": true, "sample": true }' });
    const result = run(dir);
    expect(result.code).toBe(1);
    expect(result.out).toContain('event/event.json: sample entry.');
  });

  it('lists example.com links', () => {
    const dir = contentWith({
      'resources/guide.json': '{ "fileUrl": "https://example.com/guide.pdf" }',
    });
    const result = run(dir);
    expect(result.code).toBe(1);
    expect(result.out).toContain('resources/guide.json: contains an example.com link.');
  });
});
