import { defineConfig } from 'astro/config';

// Static site. Every page is built to plain HTML at build time.
export default defineConfig({
  output: 'static',
  site: 'https://stemracing-tbs.vercel.app',
  trailingSlash: 'ignore',
});
