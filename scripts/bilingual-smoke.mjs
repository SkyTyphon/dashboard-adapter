import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const live = process.env.DEMO_URL;
const base = live ? live.replace(/\/$/, '') : 'http://127.0.0.1:4175/demo';
const server = live ? null : spawn(process.execPath, ['scripts/preview-server.mjs'], { env: { ...process.env, DASHBOARD_ADAPTER_PREVIEW_PORT: '4175' }, stdio: ['ignore', 'ignore', 'inherit'] });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(`${base}/en/index.html`)).ok) break; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  await mkdir('preview', { recursive: true });
  for (const language of ['en', 'fr']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 950 }, acceptDownloads: true });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto(`${base}/${language}/index.html`, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('html').getAttribute('lang'), language);
    await page.locator('dashboard-adapter-card .entity-row').first().waitFor();
    assert.match(await page.locator('dashboard-adapter-card .hero h1').innerText(), language === 'fr' ? /Adapte/ : /Make/);
    await page.locator('#example-map').click();
    assert.match(await page.locator('dashboard-adapter-card .code-grid').innerText(), /light\.salon/);
    const downloaded = page.waitForEvent('download');
    await page.locator('dashboard-adapter-card [data-action=download]').click();
    assert.equal((await downloaded).suggestedFilename(), 'shared-home-demo-adapted.yaml');
    await page.locator('[data-step=mapping]').click();
    await page.locator('dashboard-adapter-card').evaluate((card) => {
      const style = document.createElement('style');
      style.textContent = '.entity-info strong,.map-row input{font-size:17px}.entity-info small{font-size:12px}.map-row{padding:18px}';
      card.shadowRoot.append(style);
    });
    const mapping = await page.locator('dashboard-adapter-card .map-row').first().screenshot();
    await page.screenshot({ path: `preview/card-${language}.png`, fullPage: true });

    const graphic = await browser.newPage({ viewport: { width: 1200, height: 670 } });
    const t = language === 'fr' ? { title: 'Un dashboard partagé, adapté à tes appareils', steps: '1. Importer le YAML   ·   2. Choisir tes entités   ·   3. Télécharger la copie', before: 'Chez l’auteur', after: 'Chez toi', note: 'Capture réelle de la carte · Données fictives · Remplacements choisis par l’utilisateur', caption: 'La même référence est corrigée dans toutes les occurrences prises en charge.' } : { title: 'A shared dashboard, adapted to your devices', steps: '1. Import YAML   ·   2. Choose your entities   ·   3. Download a copy', before: 'Shared dashboard', after: 'Your home', note: 'Real card screenshot · Fictional data · User-selected replacements', caption: 'The same reference is adapted across all supported occurrences.' };
    await graphic.setContent(`<html><body style="margin:0;background:#0d1925;color:#e4f0f4;font-family:Segoe UI,Arial;padding:40px"><div style="color:#6cdeca;font-size:16px;font-weight:700">DASHBOARD ADAPTER</div><h1 style="font-size:35px;letter-spacing:-1px;margin:12px 0">${t.title}</h1><p style="font-size:20px;color:#aebfcb">${t.steps}</p><div style="margin-top:24px;border:1px solid #365363;border-radius:14px;overflow:hidden"><img style="display:block;width:100%" src="data:image/png;base64,${mapping.toString('base64')}"></div><div style="display:flex;gap:24px;margin-top:24px"><div style="flex:1;border:1px solid #365363;border-radius:14px;padding:24px"><b style="color:#ed939d">${t.before}</b><pre style="font-size:23px;line-height:1.65;margin-bottom:0">entities:\n  - light.living_room</pre></div><div style="flex:1;border:1px solid #61cbb8;border-radius:14px;padding:24px"><b style="color:#6cdeca">${t.after}</b><pre style="font-size:23px;line-height:1.65;margin-bottom:0">entities:\n  - light.salon</pre></div></div><p style="font-size:18px;color:#aebfcb">${t.caption}</p><p style="font-size:13px;color:#8ea5b5">${t.note}</p></body></html>`);
    await graphic.screenshot({ path: `preview/how-it-works-${language}.png` });
    await graphic.close();

    // The explicit auto setting must follow HA's user-interface language and its changes.
    await page.locator('dashboard-adapter-card').evaluate((card) => { card.setConfig({ language: 'auto' }); card.hass = { language: 'fr-FR', states: {} }; });
    assert.match(await page.locator('dashboard-adapter-card .hero h1').innerText(), /Adapte/);
    await page.locator('dashboard-adapter-card').evaluate((card) => { card.hass = { language: 'en', states: {} }; });
    assert.match(await page.locator('dashboard-adapter-card .hero h1').innerText(), /Make/);
    await page.locator('dashboard-adapter-card').evaluate((card) => { card.setConfig({ language: 'en' }); card.hass = { language: 'fr', states: {} }; });
    assert.match(await page.locator('dashboard-adapter-card .hero h1').innerText(), /Make/);
    await page.locator('dashboard-adapter-card').evaluate((card) => { card.setConfig({}); card.hass = { language: 'fr', states: {} }; });
    assert.match(await page.locator('dashboard-adapter-card .hero h1').innerText(), /Adapte/);
    await page.locator('dashboard-adapter-card').evaluate((card) => { card.hass = { language: 'de', states: {} }; });
    assert.match(await page.locator('dashboard-adapter-card .hero h1').innerText(), /Make/);
    await page.locator('dashboard-adapter-card').evaluate((card, language) => card.setConfig({ language }), language);
    await page.locator('dashboard-adapter-card input[type=file]').setInputFiles({ name: 'invalid.yaml', mimeType: 'text/yaml', buffer: Buffer.from('views: nope') });
    await page.locator('dashboard-adapter-card [role=alert]').waitFor();
    assert.match(await page.locator('dashboard-adapter-card [role=alert]').innerText(), language === 'fr' ? /tableau views/ : /views array/);
    await page.locator('#reset').click();
    await page.locator('#theme').click();
    await page.setViewportSize({ width: 390, height: 844 });
    assert((await page.evaluate(() => document.documentElement.scrollWidth)) <= 391);
    await page.screenshot({ path: `preview/mobile-${language}.png`, fullPage: true });
    await page.locator('#language').click();
    const other = language === 'en' ? 'fr' : 'en';
    await page.waitForURL(`**/${other}/index.html`);
    await page.locator('dashboard-adapter-card .entity-row').first().waitFor();
    assert.equal(await page.locator('html').getAttribute('lang'), other);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('EN/FR pages, forced languages, HA auto language, export, localized errors, mobile and language navigation passed');
} finally { await browser.close(); server?.kill(); }
