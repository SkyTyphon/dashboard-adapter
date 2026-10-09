import { copyFile, readFile, mkdir, writeFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const template = await readFile('demo/index.html', 'utf8');
// Evaluate only the maintained translation literal from our own HTML template.
const match = template.match(/const labels = (\{[\s\S]*?\n    \});/);
if (!match) throw new Error('Demo translation dictionary missing');
const messages = runInNewContext(`(${match[1]})`, Object.create(null), { timeout: 1000 });
const ids = { beta: 'beta', kicker: 'kicker', headline: 'headline', intro: 'intro', 'try-link': 'try', 'install-link': 'install', 'demo-title': 'title', 'demo-subtitle': 'subtitle', 'example-map': 'map', reset: 'reset', privacy: 'privacy', 'footer-note': 'footer', 'docs-link': 'docs', 'feedback-link': 'feedback' };
function localized(language) {
  const t = messages[language];
  let html = template.replace('<html lang="en">', `<html lang="${language}">`);
  html = html.replace('<title>Dashboard Adapter · Live demo</title>', `<title>Dashboard Adapter · ${language === 'fr' ? 'Démo interactive' : 'Live demo'}</title>`);
  for (const [id, key] of Object.entries(ids)) {
    const expression = new RegExp(`(<([a-z0-9]+)[^>]*\\bid="${id}"[^>]*>)[\\s\\S]*?(</\\2>)`);
    html = html.replace(expression, (_, open, tag, close) => open + t[key] + close);
  }
  for (const [index, step] of ['dependencies', 'mapping', 'preview'].entries()) {
    html = html.replace(new RegExp(`(data-step="${step}"[^>]*>)[^<]*`), `$1${t.steps[index]}`);
  }
  for (const [index, letter] of ['a', 'b', 'c'].entries()) {
    html = html.replace(new RegExp(`(id="feature-${letter}-title">)[^<]*`), `$1${t.features[index][0]}`);
    html = html.replace(new RegExp(`(id="feature-${letter}-text">)[^<]*`), `$1${t.features[index][1]}`);
  }
  if (language === 'fr') html = html.replace('content="Try Dashboard Adapter with fictional Home Assistant devices. Inspect, map and export a shared dashboard in your browser."', 'content="Essaie Dashboard Adapter avec des appareils fictifs. Vérifie, adapte et exporte un dashboard dans ton navigateur."');
  html = html.replace(/id="language"([^>]*>)[^<]*/, `id="language"$1${language === 'fr' ? 'EN' : 'FR'}`);
  return html;
}
await copyFile('dist/dashboard-adapter.js', 'demo/dashboard-adapter.js');
for (const language of ['en', 'fr']) {
  await mkdir(`demo/${language}`, { recursive: true });
  await writeFile(`demo/${language}/index.html`, localized(language));
  await copyFile('dist/dashboard-adapter.js', `demo/${language}/dashboard-adapter.js`);
}
console.log('English and French demo pages ready');
