import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

const chrome = process.env.CHROME_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome');
if (!existsSync(chrome)) throw new Error(`Chrome not found at ${chrome}. Set CHROME_PATH.`);
const port = 4174;
const liveUrl = process.env.DEMO_URL;
const origin = liveUrl ? liveUrl.replace(/\/$/, '') : `http://127.0.0.1:${port}`;
const server = liveUrl ? null : spawn(process.execPath, ['scripts/preview-server.mjs'], {
  env: { ...process.env, DASHBOARD_ADAPTER_PREVIEW_PORT: String(port) },
  stdio: 'ignore',
});
let browser;
try {
  let available = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { const response = await fetch(liveUrl ? origin : `${origin}/demo/index.html`); available = response.ok; if (available) break; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert(available, 'Local demo server did not start');
  browser = await chromium.launch({ executablePath: chrome, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(liveUrl ? `${origin}/` : `${origin}/demo/index.html`, { waitUntil: 'networkidle' });
  await page.locator('dashboard-adapter-card .entity-row').first().waitFor();
  assert.equal(await page.locator('dashboard-adapter-card .entity-row').count(), 5);
  assert.match(await page.locator('dashboard-adapter-card .status-line').innerText(), /4 Missing/);
  mkdirSync('preview', { recursive: true });
  await page.screenshot({ path: 'preview/demo-desktop.png', fullPage: true });

  await page.locator('#example-map').click();
  assert.match(await page.locator('dashboard-adapter-card .code-grid').innerText(), /light\.salon/);
  const downloadEvent = page.waitForEvent('download');
  await page.locator('dashboard-adapter-card button[data-action="download"]').click();
  const download = await downloadEvent;
  assert.equal(download.suggestedFilename(), 'shared-home-demo-adapted.yaml');

  await page.locator('#language').click();
  assert.match(await page.locator('#headline').innerText(), /Adapté à ta maison/);
  await page.locator('#theme').click();
  assert(await page.locator('body').evaluate((element) => element.classList.contains('light')));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#reset').click();
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  assert(width <= 391, `Mobile page overflows: ${width}px`);
  await page.screenshot({ path: 'preview/demo-mobile.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('Browser demo: desktop, mapping, download, French, light theme and mobile passed');
} finally {
  await browser?.close();
  server?.kill();
}
