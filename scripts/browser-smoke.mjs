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

  // Real import with live Home Assistant state updates.
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const live = await context.newPage();
  live.on('pageerror', (error) => errors.push(error.message));
  await live.goto(liveUrl ? `${origin}/` : `${origin}/demo/index.html`, { waitUntil: 'networkidle' });
  const card = live.locator('dashboard-adapter-card');
  const states = (extra = {}) => ({ 'light.salon': { state: 'on' }, 'light.kitchen': { state: 'on' }, 'sensor.power': { state: String(Math.random()) }, ...extra });
  await card.evaluate((element, value) => { element.setConfig({ language: 'en' }); element.hass = { language: 'en', states: value }; }, states());
  const yaml = 'base: &lamp\n  type: button\n  entity: light.living_room\nviews:\n  - cards:\n      - *lamp\n      - <<: *lamp\n        name: Copy\n      - type: tile\n        entity: light.kitchen\n';
  await card.locator('input[type=file]').setInputFiles({ name: 'shared.yaml', mimeType: 'text/yaml', buffer: Buffer.from(yaml) });
  await card.locator('[data-tab=mapping]').click();
  const input = card.locator('input[data-map="light.living_room"]');
  await input.click();
  await input.pressSequentially('light.sal');
  for (let update = 0; update < 5; update++) await card.evaluate((element, value) => { element.hass = { language: 'en', states: value }; }, states());
  await card.evaluate((element, value) => { element.hass = { language: 'en', states: value }; }, states({ 'light.kitchen': { state: 'unavailable' } }));
  assert.equal(await input.inputValue(), 'light.sal', 'typed replacement lost on state update');
  assert(await input.evaluate((element) => element.getRootNode().activeElement === element), 'replacement field lost focus on state update');
  await input.pressSequentially('on');
  await input.press('Enter');
  await card.locator('[data-action=toggle-all]').click();
  assert.equal(await card.locator('input[data-map="light.kitchen"]').count(), 1);
  await card.locator('[data-tab=preview]').click();
  assert.match(await card.locator('pre[data-scroll=adapted]').innerText(), /entity: light\.salon[\s\S]*<<: \*lamp/);
  await card.locator('[data-action=copy]').click();
  await card.locator('[data-action=copy]', { hasText: 'Copied' }).waitFor();
  assert.match(await live.evaluate(() => navigator.clipboard.readText()), /entity: light\.salon/);
  await card.locator('input[type=file]').setInputFiles({ name: 'tagged.yaml', mimeType: 'text/yaml', buffer: Buffer.from('views:\n  - cards:\n      - !include card.yaml\n') });
  assert.match(await card.locator('.error').innerText(), /Unsupported YAML tag/);
  await context.close();
  assert.deepEqual(errors, []);
  console.log('Browser demo: desktop, mapping, download, French, light theme, mobile, live state updates, anchors, remapping, copy and tag errors passed');
} finally {
  await browser?.close();
  server?.kill();
}
