// Saves each regulations document as a branded PDF, using Chrome on this Mac, then puts the supplied cover on it.
// Start the dev server first (npm run dev), then: node scripts/make-regulation-pdfs.mjs [base-url] [out-dir]
// The finished PDFs go in public/regulations/, where the site links to them. Needs pypdf for python3.
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import puppeteer from 'puppeteer-core';

const base = process.argv[2] ?? 'http://localhost:4321';
const out = process.argv[3] ?? 'public/regulations';
const covers = 'scripts/covers/regulations-covers.pdf';
const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// [slug, page of the covers file, title, file name on the site]
const docs = [
  ['competition', 1, 'STEM Racing India National Finals 2026 - Competition Regulations', 'tbs-competition-regulations.pdf'],
  ['technical', 2, 'STEM Racing India National Finals - Technical Regulations', 'tbs-technical-regulations.pdf'],
  ['ai-guidance', 3, 'Using AI Responsibly in STEM Racing 2026', 'tbs-ai-guidance.pdf'],
  ['project-management', 4, 'STEM Racing Project Management Guide 2026', 'tbs-project-management-guide.pdf'],
];

mkdirSync(out, { recursive: true });

// The STEM Racing India logo on every page. Trimmed of its built-in margin, 10mm high, above the brand minimum.
const logo = (
  await sharp('src/assets/brand/logo/stem-racing-india-colour-black.png').trim().resize({ height: 160 }).flatten({ background: '#ffffff' }).jpeg({ quality: 88 }).toBuffer()
).toString('base64');

const headerTemplate = `<div style="width:100%;box-sizing:border-box;padding:7mm 16mm 0;"><img alt="STEM Racing India" style="height:10mm;display:block" src="data:image/jpeg;base64,${logo}" /></div>`;
const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
try {
  for (const [slug, coverPage, name, fileName] of docs) {
    const page = await browser.newPage();
    // Chrome stores WebP pictures uncompressed in a PDF. JPEG goes in as it is, so serve the figures as JPEG.
    await page.setRequestInterception(true);
    page.on('request', async (request) => {
      const url = new URL(request.url());
      if (!url.pathname.endsWith('.webp') || !url.pathname.startsWith('/regulations/')) return request.continue();
      const body = await sharp(join('public', decodeURIComponent(url.pathname)))
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: 88 })
        .toBuffer();
      return request.respond({ status: 200, contentType: 'image/jpeg', body });
    });
    await page.goto(`${base}/regulations/${slug}/print`, { waitUntil: 'load', timeout: 120000 });
    await page.evaluate(() => document.fonts.ready);
    // Figures are lazy-loaded on the site; load them all before printing.
    await page.evaluate(() =>
      Promise.all(
        [...document.images].map((img) => {
          img.loading = 'eager';
          return img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; });
        }),
      ),
    );
    const body = join(out, `.${fileName}.body.pdf`);
    const file = join(out, fileName);
    await page.pdf({
      path: body,
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate: `<div style="width:100%;padding:0 16mm;font:7pt Helvetica,Arial,sans-serif;color:#5B5376;display:flex;justify-content:space-between"><span>${name} · STEM Racing at The British School, New Delhi</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
      outline: true,
      tagged: true,
      timeout: 300000,
    });
    // Page 1 of the print is a placeholder; the supplied cover takes its place, so the bookmarks and links still work.
    execFileSync('python3', ['scripts/put-cover-on-pdf.py', body, covers, String(coverPage), file, name]);
    rmSync(body);
    console.log(`${slug}: ${(statSync(file).size / 1e6).toFixed(1)} MB  ${file}`);
    await page.close();
  }
} finally {
  await browser.close();
}
