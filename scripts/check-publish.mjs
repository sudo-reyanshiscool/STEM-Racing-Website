// Lists content that has to be replaced before the site goes public.
// Exit code 0 means the content is ready. Exit code 1 means something is listed.
//
// Usage: node scripts/check-publish.mjs [content folder]
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const contentDir = resolve(process.argv[2] ?? 'src/content');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function frontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  return match ? match[1] : '';
}

const problems = [];

for (const file of walk(contentDir).sort()) {
  if (!/\.(md|json)$/.test(file)) continue;
  const text = readFileSync(file, 'utf8');
  const name = relative(contentDir, file);

  const isSample = file.endsWith('.json')
    ? /"sample"\s*:\s*true/.test(text)
    : /^sample:\s*true\s*$/m.test(frontmatter(text));
  const isHiddenEvent = /(^|[\\/])event\.json$/.test(file) && /"enabled"\s*:\s*false/.test(text);

  if (isSample && !isHiddenEvent) {
    problems.push(`${name}: sample entry. Replace it with real content, then remove "sample".`);
  }
  if (/https?:\/\/(www\.)?example\.(com|org|net)/i.test(text)) {
    problems.push(`${name}: contains an example.com link.`);
  }
}

if (problems.length > 0) {
  console.error(`Not ready to publish. ${problems.length} item(s) to fix:\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log('Ready to publish: no sample entries and no example links.');
