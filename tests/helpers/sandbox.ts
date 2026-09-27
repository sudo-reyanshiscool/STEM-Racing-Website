// Builds a copy of the site in a temporary folder, so a test can change the content
// and build again without touching the real files.
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { load, type CheerioAPI } from 'cheerio';
import { root } from './site';

export interface SiteCopy {
  /** The folder that holds the copy. */
  dir: string;
  /** Writes a content file, for example write('teams/velocity.md', text). */
  write(path: string, text: string): void;
  /** Deletes every file in a content folder and leaves the folder in place. */
  empty(collection: string): void;
  /** Builds the copy and returns everything the build printed. Throws when the build fails. */
  build(): string;
  /** The HTML of a built page. */
  html(route: string): string;
  page(route: string): CheerioAPI;
  remove(): void;
}

/** Long enough for two builds of a copy that starts with an empty image cache. */
export const BUILD_TIMEOUT = 240_000;

export function copySite(): SiteCopy {
  // The real path: on macOS the temporary folder is a link, and the build needs one name for each file.
  const dir = mkdtempSync(join(realpathSync(tmpdir()), 'tbs-site-'));
  for (const name of ['src', 'public', 'tsconfig.json', 'package.json']) {
    cpSync(join(root, name), join(dir, name), { recursive: true });
  }
  cpSync(join(root, 'astro.config.mjs'), join(dir, 'astro.base.mjs'));
  // Same settings as the real site. The copy keeps its own cache, so the two never share
  // a content store.
  writeFileSync(
    join(dir, 'astro.config.mjs'),
    "import base from './astro.base.mjs';\n\nexport default { ...base, cacheDir: './.cache' };\n",
  );
  symlinkSync(join(root, 'node_modules'), join(dir, 'node_modules'), 'dir');

  const file = (route: string) =>
    route === '/' ? join(dir, 'dist/index.html') : join(dir, 'dist', route.slice(1), 'index.html');

  return {
    dir,
    write(path, text) {
      const target = join(dir, 'src/content', path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, text);
    },
    empty(collection) {
      const folder = join(dir, 'src/content', collection);
      rmSync(folder, { recursive: true, force: true });
      mkdirSync(folder, { recursive: true });
    },
    build() {
      // The build must not inherit the test runner's settings.
      const env = Object.fromEntries(
        Object.entries(process.env).filter(([name]) => name !== 'NODE_ENV' && !name.startsWith('VITEST')),
      );
      const result = spawnSync(
        process.execPath,
        [join(root, 'node_modules/astro/bin/astro.mjs'), 'build', '--root', dir],
        { cwd: dir, encoding: 'utf8', env: { ...env, NO_COLOR: '1', ASTRO_TELEMETRY_DISABLED: '1' } },
      );
      const output = `${result.stdout}\n${result.stderr}`;
      if (result.status !== 0) throw new Error(`The build of the copy failed.\n${output}`);
      return output;
    },
    html(route) {
      const path = file(route);
      if (!existsSync(path)) throw new Error(`${path} is missing. Build the copy first.`);
      return readFileSync(path, 'utf8');
    },
    page(route) {
      return load(this.html(route));
    },
    remove() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
