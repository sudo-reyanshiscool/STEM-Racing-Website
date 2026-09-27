import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

// Static site. Every page is built to plain HTML at build time.
export default defineConfig({
  output: 'static',
  adapter: vercel(),
  site: vercelHost ? `https://${vercelHost}` : 'https://stemracing-tbs.vercel.app',
  trailingSlash: 'ignore',
});
