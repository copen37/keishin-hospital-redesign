import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'https://copen37.github.io/keishin-hospital-redesign/';
const OUT_DIR = process.env.OUT_DIR || '_audit_links';
const PREFIX = new URL(BASE).pathname.replace(/\/$/, '') + '/';

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext();
const request = context.request;

const queue = [BASE];
const visited = new Set();
const pages = [];
const transitions = [];
const broken = [];

function normalize(url, from) {
  if (!url) return null;
  if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('javascript:')) return null;
  try {
    const u = new URL(url, from);
    u.hash = '';
    return u.toString();
  } catch {
    return null;
  }
}

function classifyTarget(u) {
  try {
    const url = new URL(u);
    const base = new URL(BASE);
    if (url.origin !== base.origin) return 'external';
    if (url.pathname.startsWith(PREFIX)) return 'internal';
    return 'same-origin-outside-prefix';
  } catch {
    return 'invalid';
  }
}

async function statusOf(url) {
  try {
    const res = await request.get(url, { timeout: 20000 });
    return { status: res.status(), ok: res.ok() };
  } catch (e) {
    return { status: 0, ok: false, error: String(e) };
  }
}

while (queue.length) {
  const url = queue.shift();
  if (visited.has(url)) continue;
  visited.add(url);

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', m => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  let pageStatus = 0;
  try {
    const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    pageStatus = res?.status() || 0;
  } catch {
    pageStatus = 0;
  }

  const items = await page.evaluate(() => {
    const out = [];
    const clickables = Array.from(document.querySelectorAll('a,button,[onclick]'));
    for (const el of clickables) {
      const tag = el.tagName.toLowerCase();
      const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120);
      const href = el.getAttribute('href');
      const onclick = el.getAttribute('onclick');
      let nav = null;
      if (href) nav = href;
      else if (onclick) {
        const m = onclick.match(/(?:location\.href|window\.location|location)\s*=\s*['\"]([^'\"]+)['\"]/);
        if (m) nav = m[1];
      }
      out.push({ tag, text, href: href || null, onclick: onclick || null, nav });
    }
    return out;
  });

  pages.push({ url, status: pageStatus, consoleErrors, clickableCount: items.length });

  for (const item of items) {
    const target = normalize(item.nav, url);
    if (!target) continue;
    const kind = classifyTarget(target);
    const rec = { from: url, text: item.text || '(no-text)', tag: item.tag, raw: item.nav, target, kind };
    transitions.push(rec);
    if (kind === 'internal' && !visited.has(target)) queue.push(target);
    if (kind === 'internal' || kind === 'same-origin-outside-prefix') {
      const st = await statusOf(target);
      rec.status = st.status;
      if (!st.ok || kind === 'same-origin-outside-prefix') {
        broken.push({ ...rec, error: st.error || null, reason: kind === 'same-origin-outside-prefix' ? 'pathPrefix missing' : 'status-not-ok' });
      }
    }
  }

  await page.close();
}

await browser.close();

const uniqBroken = [];
const seen = new Set();
for (const b of broken) {
  const k = `${b.from}|${b.target}|${b.text}`;
  if (!seen.has(k)) {
    seen.add(k);
    uniqBroken.push(b);
  }
}

const summary = {
  base: BASE,
  crawledPages: pages.length,
  transitions: transitions.length,
  brokenCount: uniqBroken.length,
  consoleErrorCount: pages.reduce((a, p) => a + p.consoleErrors.length, 0)
};

writeFileSync(`${OUT_DIR}/link_audit.json`, JSON.stringify({ summary, pages, broken: uniqBroken, transitions }, null, 2));

const md = [
  '# Link Audit Report',
  '',
  `- Base: ${BASE}`,
  `- Crawled pages: ${summary.crawledPages}`,
  `- Clickable transitions: ${summary.transitions}`,
  `- Broken internal links: ${summary.brokenCount}`,
  `- Console errors: ${summary.consoleErrorCount}`,
  ''
];

if (uniqBroken.length) {
  md.push('## Broken links');
  for (const b of uniqBroken) {
    md.push(`- from: ${b.from}`);
    md.push(`  - element: [${b.tag}] ${b.text}`);
    md.push(`  - raw: ${b.raw}`);
    md.push(`  - target: ${b.target}`);
    md.push(`  - status: ${b.status}`);
    if (b.reason) md.push(`  - reason: ${b.reason}`);
  }
} else {
  md.push('## Broken links');
  md.push('なし');
}

writeFileSync(`${OUT_DIR}/link_audit.md`, md.join('\n'));
console.log(JSON.stringify(summary, null, 2));