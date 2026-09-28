// Checks a regulations JSON file against its PDF: shape, unique ids, and how much of the PDF's wording made it across.
// Usage: node scripts/check-regulations.mjs <slug> <path-to-pdf>
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const [slug, pdf] = process.argv.slice(2);
const doc = JSON.parse(readFileSync(`src/data/regulations/${slug}.json`, 'utf8'));
const problems = [];
const ids = new Set();
let text = '';
const seenAnchor = (id, where) => {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) problems.push(`${where}: bad id "${id}"`);
  if (ids.has(id)) problems.push(`${where}: duplicate id "${id}"`);
  ids.add(id);
};
const walkBlocks = (blocks = [], where) => {
  for (const b of blocks) {
    if (b.type === 'p' || b.type === 'callout') text += ` ${b.text}`;
    else if (b.type === 'clause') {
      const a = b.id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      seenAnchor(a, `${where} clause ${b.id}`);
      text += ` ${b.id} ${b.text}`;
      walkBlocks(b.blocks, where);
    } else if (b.type === 'list') for (const i of b.items) text += typeof i === 'string' ? ` ${i}` : ` ${i.text} ${(i.items ?? []).join(' ')}`;
    else if (b.type === 'table') text += ` ${b.caption ?? ''} ${b.head.join(' ')} ${b.rows.flat().join(' ')}`;
    else if (b.type === 'figure') {
      text += ` ${b.caption ?? ''}`;
      if (!existsSync(`public${b.src}`)) problems.push(`${where}: missing image ${b.src}`);
      if (!b.alt || b.alt.length < 10) problems.push(`${where}: weak alt text on ${b.src}`);
    } else problems.push(`${where}: unknown block type ${b.type}`);
    if (b.type === 'table' && b.rows.some((r) => r.length !== b.head.length)) problems.push(`${where}: table row width differs from header`);
  }
};
const walk = (sections, where) => {
  for (const s of sections) {
    seenAnchor(s.id, `${where}/${s.id}`);
    text += ` ${s.label ?? ''} ${s.title}`;
    walkBlocks(s.blocks, `${where}/${s.id}`);
    walk(s.children ?? [], `${where}/${s.id}`);
  }
};
walk(doc.sections, slug);
if (!existsSync(`public${doc.pdf}`)) problems.push(`missing PDF at public${doc.pdf}`);
const words = (t) => t.toLowerCase().replace(/[’‘]/g, "'").match(/[a-z0-9]+(?:'[a-z]+)?/g) ?? [];
const src = execFileSync('pdftotext', [pdf, '-'], { maxBuffer: 1 << 26 }).toString();
const have = new Map();
for (const w of words(text)) have.set(w, (have.get(w) ?? 0) + 1);
let missing = 0, total = 0;
const lost = new Map();
for (const w of words(src)) {
  total += 1;
  if ((have.get(w) ?? 0) > 0) have.set(w, have.get(w) - 1);
  else { missing += 1; lost.set(w, (lost.get(w) ?? 0) + 1); }
}
console.log(`${slug}: ${ids.size} anchors, ${total} PDF words, ${missing} not found (${((missing / total) * 100).toFixed(1)}%)`);
console.log('most-missing words:', [...lost.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([w, n]) => `${w}×${n}`).join(' '));
if (problems.length) { console.log('PROBLEMS:\n' + problems.join('\n')); process.exit(1); }
