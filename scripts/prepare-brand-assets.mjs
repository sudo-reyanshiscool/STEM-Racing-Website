// Copies the official STEM Racing files from the brand pack into the project.
// Nothing is redrawn. Logos are cropped to their artwork and resized, mesh gradients lose
// the 2 pixel soft edge from their export, and every other file is copied byte for byte.
//
// Usage: node scripts/prepare-brand-assets.mjs "/path/to/STEM RACING BRANDING SHARE"
import { existsSync } from 'node:fs';
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pack = resolve(process.argv[2] ?? join(root, '..', 'STEM Racing', 'STEM RACING BRANDING SHARE'));
const graphics = join(pack, 'Graphic Assets');
const brand = join(root, 'src', 'assets', 'brand');
const pub = join(root, 'public');

if (!existsSync(graphics)) {
  console.error(`Brand pack not found at ${pack}`);
  console.error('Pass its path: node scripts/prepare-brand-assets.mjs "/path/to/STEM RACING BRANDING SHARE"');
  process.exit(1);
}

async function target(path) {
  await mkdir(dirname(path), { recursive: true });
  return path;
}

function done(path) {
  console.log(`wrote ${relative(root, path)}`);
}

async function copy(from, to) {
  await copyFile(from, await target(to));
  done(to);
}

// 1. Logos. All four variants are cropped to one shared box, so they are the same size
//    and swapping one for another never stretches or shifts the artwork.
const LOGO_WIDTH = 1200;
const logos = {
  'tbs-colour-white.png': 'TBS_Full Colour White.png',
  'tbs-colour-black.png': 'TBS_Full Colour Black.png',
  'tbs-mono-white.png': 'TBS_White_White.png',
  'tbs-mono-black.png': 'TBS_Black.png',
};
const logoSource = (name) => join(graphics, 'Logos', 'TBS', name);

const boxes = [];
for (const name of Object.values(logos)) {
  const { info } = await sharp(logoSource(name)).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  const left = Math.abs(info.trimOffsetLeft ?? 0);
  const top = Math.abs(info.trimOffsetTop ?? 0);
  boxes.push({ left, top, right: left + info.width, bottom: top + info.height });
}
const box = {
  left: Math.min(...boxes.map((b) => b.left)),
  top: Math.min(...boxes.map((b) => b.top)),
  right: Math.max(...boxes.map((b) => b.right)),
  bottom: Math.max(...boxes.map((b) => b.bottom)),
};

for (const [name, source] of Object.entries(logos)) {
  const to = await target(join(brand, 'logo', name));
  await sharp(logoSource(source))
    .extract({ left: box.left, top: box.top, width: box.right - box.left, height: box.bottom - box.top })
    .resize({ width: LOGO_WIDTH })
    .png({ compressionLevel: 9 })
    .toFile(to);
  done(to);
}

// 2. Signifier, and the favicons made from it.
const signifier = join(graphics, 'Logos', 'Signifier', 'RGB', 'STEM Racing Signifier_RGB.png');
const clear = { r: 0, g: 0, b: 0, alpha: 0 };
const carbonShadow = '#05000B';
await copy(signifier, join(brand, 'signifier', 'signifier-colour.png'));

for (const size of [32, 192]) {
  const to = await target(join(pub, `favicon-${size}.png`));
  await sharp(signifier).resize({ width: size, height: size, fit: 'contain', background: clear }).png().toFile(to);
  done(to);
}

const touchIcon = await target(join(pub, 'apple-touch-icon.png'));
const mark = await sharp(signifier)
  .resize({ width: 124, height: 124, fit: 'contain', background: clear })
  .png()
  .toBuffer();
await sharp({ create: { width: 180, height: 180, channels: 3, background: carbonShadow } })
  .composite([{ input: mark, left: 28, top: 28 }])
  .png()
  .toFile(touchIcon);
done(touchIcon);

// 3. Gradients.
const gradients = join(graphics, 'Gradients', 'RGB', 'PNG');
await copy(join(gradients, 'SR gradient@2x.png'), join(brand, 'gradients', 'sr-gradient.png'));

const meshes = {
  'mesh-hot.png': 'STEM Racing Gradients_Hot RGB.png',
  'mesh-pink-orange.png': 'STEM Racing Gradients_Pink Orange RGB.png',
};
for (const [name, source] of Object.entries(meshes)) {
  const from = join(gradients, source);
  const to = await target(join(brand, 'gradients', name));
  const { width, height } = await sharp(from).metadata();
  await sharp(from)
    .extract({ left: 2, top: 2, width: width - 4, height: height - 4 })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(to);
  done(to);
}

// 4. Track shapes and pattern.
const shapes = join(graphics, 'Shapes', 'RGB', 'SVG');
await copy(join(shapes, 'Colour', 'STEM Racing Shapes_Pink RGB.svg'), join(brand, 'shapes', 'shape-pink.svg'));
await copy(join(shapes, 'Colour', 'STEM Racing Shapes_Yellow RGB.svg'), join(brand, 'shapes', 'shape-yellow.svg'));
await copy(join(shapes, 'Black', 'STEM Racing Shapes_Black 1 RGB.svg'), join(brand, 'shapes', 'shape-black-1.svg'));
await copy(
  join(graphics, 'Patterns', 'RGB', 'PNG', 'STEM Racing Patterns_Jagged RGB.png'),
  join(brand, 'patterns', 'pattern-jagged.png'),
);

// 5. Magistral is supplied as WOFF2. MachoModular is converted by scripts/convert-fonts.py.
for (const name of ['Magistral-BoldItalic.woff2', 'Magistral-MediumItalic.woff2']) {
  await copy(join(pack, 'Fonts', 'Magistral', name), join(pub, 'fonts', name));
}

console.log('\nBrand assets are in place. Next: convert MachoModular with scripts/convert-fonts.py');
