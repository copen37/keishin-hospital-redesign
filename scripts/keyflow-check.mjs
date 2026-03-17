import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'https://copen37.github.io/keishin-hospital-redesign/';
const OUT_DIR = process.env.OUT_DIR || '_audit_links/after';
mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

const checks = [];

async function capture(name) {
  await page.screenshot({ path: `${OUT_DIR}/${name}.png`, fullPage: true });
}

async function go(url, name) {
  const res = await page.goto(url, { waitUntil: 'networkidle' });
  checks.push({ step: name, url: page.url(), status: res?.status() || 0 });
  await capture(name);
}

await go(BASE, 'home');

const flows = [
  { name: 'cta_detail', ref: () => page.getByRole('link', { name: '詳しく見る' }).first() },
  { name: 'nav_news', ref: () => page.getByRole('link', { name: 'お知らせ' }).first() },
  { name: 'nav_recruit', ref: () => page.getByRole('link', { name: '採用情報' }).first() },
  { name: 'nav_access', ref: () => page.getByRole('link', { name: 'アクセス' }).first() },
  { name: 'cta_reserve', ref: () => page.getByRole('link', { name: '予約・問合せ' }).first() }
];

for (const f of flows) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const [res] = await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    f.ref().click()
  ]);
  checks.push({ step: f.name, url: page.url(), status: res?.status() || 0 });
  await capture(f.name);
}

await browser.close();

const report = {
  base: BASE,
  checks,
  consoleErrors,
  consoleErrorCount: consoleErrors.length,
  non200: checks.filter(c => c.status !== 200)
};

writeFileSync(`${OUT_DIR}/keyflow_report.json`, JSON.stringify(report, null, 2));
let md = `# Keyflow Check\n\n- Base: ${BASE}\n- Console errors: ${report.consoleErrorCount}\n\n`;
for (const c of checks) md += `- ${c.step}: ${c.status} ${c.url}\n`;
if (report.non200.length) {
  md += '\n## Non-200\n';
  for (const c of report.non200) md += `- ${c.step}: ${c.status} ${c.url}\n`;
}
writeFileSync(`${OUT_DIR}/keyflow_report.md`, md);
console.log(JSON.stringify({ consoleErrorCount: report.consoleErrorCount, non200: report.non200.length }, null, 2));