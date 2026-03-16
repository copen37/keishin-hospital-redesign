import { chromium, devices } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const baseURL = 'http://127.0.0.1:8080';
const pages = ['/', '/care/', '/hospitalization/', '/facilities/', '/access/', '/news/', '/news/system-update/', '/recruit/'];
const outDir = '_audit_hanamori_style';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const report = [];

for (const mode of ['desktop', 'mobile']) {
  const context = await browser.newContext(mode === 'mobile' ? devices['iPhone 13'] : { viewport: { width: 1440, height: 900 } });
  for (const path of pages) {
    const page = await context.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' });
    const file = `${outDir}/${path === '/' ? 'index' : path.replaceAll('/', '_')}_${mode}.png`;
    await page.screenshot({ path: file, fullPage: true });
    report.push({ path, mode, errors, screenshot: file });
    await page.close();
  }
  await context.close();
}

await browser.close();

const md = ['# Playwright監査レポート（Hanamori Style Refresh）', '', `対象: ${baseURL}`, ''];
for (const r of report) {
  md.push(`## ${r.path} (${r.mode})`);
  md.push(`- screenshot: ${r.screenshot}`);
  md.push(`- console errors: ${r.errors.length}`);
  if (r.errors.length) r.errors.forEach((e) => md.push(`  - ${e}`));
  md.push('');
}

const totalErrors = report.reduce((sum, r) => sum + r.errors.length, 0);
md.unshift(`総エラー数: ${totalErrors}`, '');

writeFileSync(`${outDir}/playwright_audit.md`, md.join('\n'));
writeFileSync(`${outDir}/playwright_audit.json`, JSON.stringify(report, null, 2));
console.log('audit done', outDir, 'totalErrors=', totalErrors);
