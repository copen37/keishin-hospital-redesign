import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const base = 'https://copen37.github.io/keishin-hospital-redesign';
const dist = 'dist';

function walk(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (f === 'index.html') out.push(p.replace(/^dist/, ''));
  }
  return out;
}

const urls = walk(dist)
  .map((p) => p.replace(/\/index\.html$/, '/').replace(/^\//, ''))
  .map((p) => `${base}/${p}`.replace(/\/$/, '/'));

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map((u) => `  <url><loc>${u}</loc></url>`)
  .join('\n')}\n</urlset>\n`;

writeFileSync('dist/sitemap.xml', xml);
