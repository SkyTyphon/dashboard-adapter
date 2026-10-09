import { parseDashboard, analyzeDashboard, suggestEntities, applyMappings } from './dashboard.js';
import { translate } from './i18n.js';
import { demoText, demoStates } from './demo.js';
import { styles } from './styles.js';

const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const pathLabel = (path) => path.map((part) => typeof part === 'number' ? `[${part}]` : part).join('.').replace(/\.\[/g, '[');

class DashboardAdapterCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.mappings = {};
    this.activeTab = 'dependencies';
    this._hass = null;
    this.parsed = null;
    this.error = '';
    this.demo = false;
    this.filename = '';
  }

  setConfig(config) {
    this.config = config || {};
    this.render();
  }
  static getStubConfig() { return {}; }
  getCardSize() { return 9; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: 9, min_rows: 6 }; }
  set hass(hass) {
    const previous = this._hass;
    this._hass = hass;
    if (!previous || previous.states !== hass.states || previous.language !== hass.language) this.render();
  }
  get language() { return this.config?.language || this._hass?.language || navigator.language; }
  get states() { return this.demo ? demoStates : this._hass?.states || {}; }

  async loadFile(file) {
    if (!file) return;
    try {
      const text = await file.text();
      this.parsed = parseDashboard(text, file.name);
      this.filename = file.name;
      this.mappings = {};
      this.error = '';
      this.demo = false;
      this.activeTab = 'dependencies';
    } catch (error) {
      this.error = error.message;
    }
    this.render();
  }

  loadDemo() {
    this.parsed = parseDashboard(demoText, 'demo.yaml');
    this.filename = 'shared-home-demo.yaml';
    this.mappings = {};
    this.error = '';
    this.demo = true;
    this.activeTab = 'dependencies';
    this.render();
  }

  download() {
    if (!this.parsed) return;
    const fresh = parseDashboard(this.parsed.original, this.filename);
    let result;
    try { result = applyMappings(fresh, this.mappings); }
    catch (error) { this.error = error.message; this.render(); return; }
    const blob = new Blob([result.text], { type: this.parsed.format === 'json' ? 'application/json' : 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = this.filename.replace(/\.(yaml|yml|json)$/i, '') + '-adapted.' + (this.parsed.format === 'json' ? 'json' : 'yaml');
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  render() {
    if (!this.shadowRoot) return;
    const t = translate(this.language);
    const report = this.parsed ? analyzeDashboard(this.parsed.data, this.states) : null;
    const ready = report?.entities.filter((item) => item.status === 'ready').length || 0;
    const unavailable = report?.entities.filter((item) => item.status === 'unavailable').length || 0;
    const missing = report?.entities.filter((item) => item.status === 'missing').length || 0;
    const resolved = report?.entities.filter((item) => item.status === 'missing' && this.mappings[item.id]).length || 0;
    const score = report?.entities.length ? Math.round((ready / report.entities.length) * 100) : 100;
    const dash = report ? `
      <div class="summary">
        <div class="score" style="--score:${score}%"><div><strong>${score}%</strong><span>${t.health}</span></div></div>
        <div class="metrics">
          <div><b>${report.viewCount}</b><span>${t.views}</span></div><div><b>${report.cardCount}</b><span>${t.cards}</span></div>
          <div><b>${report.entities.length}</b><span>${t.entities}</span></div>
        </div>
        <div class="status-line"><span class="good">● ${ready} ${t.ready}</span><span class="bad">● ${missing} ${t.missing}</span><span class="warn">● ${unavailable} ${t.unavailable}</span></div>
      </div>
      <div class="tabs" role="tablist" aria-label="Dashboard analysis">
        ${['dependencies','mapping','preview'].map((tab) => `<button type="button" role="tab" aria-selected="${this.activeTab === tab}" data-tab="${tab}">${t[tab]}${tab === 'mapping' ? ` <small>${resolved}/${missing}</small>` : ''}</button>`).join('')}
      </div>
      <div class="panel" role="tabpanel">${this.renderTab(report, t)}</div>` : `<div class="empty"><div class="empty-icon">▦</div><p>${t.noDashboard}</p><button type="button" data-action="demo">${t.demo} →</button></div>`;
    this.shadowRoot.innerHTML = `<style>${styles}</style><ha-card><div class="shell">
      <header><div class="brand"><div class="logo">◈</div><span>Dashboard Adapter</span><span class="version">BETA</span></div><div class="privacy">◆ ${t.privacy}</div></header>
      <section class="hero"><div><div class="eyebrow">${t.eyebrow}</div><h1>${t.title}</h1><p>${t.subtitle}</p></div><div class="hero-art" aria-hidden="true"><div class="art-card art-a">▥ <i></i><i></i><i></i></div><div class="art-link">⋯ ⋯ ⋯</div><div class="art-card art-b">✓ <i></i><i></i><i></i></div></div></section>
      <section class="workspace"><div class="toolbar"><div class="file"><b>${this.parsed ? escape(this.filename) : t.filename}</b>${this.demo ? `<span class="demo-pill">${t.demoLabel}</span>` : ''}</div><div class="actions"><label class="import-button">${t.import}<input type="file" accept=".yaml,.yml,.json,application/json,text/yaml" aria-label="${t.import}"></label><button type="button" data-action="demo">${t.demo}</button>${this.parsed ? `<button type="button" data-action="reset">${t.reset}</button>` : ''}</div></div>
      ${this.error ? `<div class="error" role="alert">${t.fileError}: ${escape(this.error)}</div>` : ''}
      ${!this._hass && !this.demo ? `<div class="notice">${t.noHass}</div>` : ''}
      ${dash}</section><footer>Dashboard Adapter <span>●</span> Local-first dashboard migration</footer>
      </div></ha-card>`;
    this.bind();
  }

  renderTab(report, t) {
    if (this.activeTab === 'mapping') {
      const missing = report.entities.filter((item) => item.status === 'missing');
      if (!missing.length) return `<div class="success">✓ ${t.noIssues}</div>`;
      return `<div class="section-heading"><h2>${t.mapping}</h2><p>${missing.length} ${t.missing.toLowerCase()}</p></div><div class="map-list">${missing.map((item) => {
        const candidates = suggestEntities(item.id, this.states, 8);
        return `<div class="map-row"><div class="entity-info"><span class="entity-icon">↳</span><div><strong>${escape(item.id)}</strong><small>${item.paths.length} × · ${escape(pathLabel(item.paths[0]))}</small></div></div><div class="arrow">→</div><input data-map="${escape(item.id)}" list="choices-${escape(item.id)}" value="${escape(this.mappings[item.id] || '')}" placeholder="${t.choose}" aria-label="${t.choose}: ${escape(item.id)}"><datalist id="choices-${escape(item.id)}">${candidates.map((id) => `<option value="${escape(id)}"></option>`).join('')}</datalist></div>`;
      }).join('')}</div><p class="note">${t.previewNote}</p>`;
    }
    if (this.activeTab === 'preview') {
      const changes = Object.values(this.mappings).filter(Boolean).length;
      const unresolved = report.entities.filter((item) => item.status === 'missing' && !this.mappings[item.id]).length;
      let adapted = this.parsed.original;
      try { adapted = applyMappings(parseDashboard(this.parsed.original, this.filename), this.mappings).text; } catch (error) { this.error = error.message; }
      return `<div class="section-heading"><h2>${t.preview}</h2><p>${changes} ${t.changes.toLowerCase()}</p></div>${unresolved ? `<div class="notice">⚠ ${unresolved} ${t.unresolved}</div>` : ''}<div class="code-grid"><div><h3>${t.original}</h3><pre>${escape(this.parsed.original)}</pre></div><div><h3>${t.adapted}</h3><pre>${escape(adapted)}</pre></div></div><div class="export-row"><p>${t.previewNote}</p><button class="primary" type="button" data-action="download">↓ ${t.download}</button></div>`;
    }
    const custom = report.customCards.map((item) => `<span class="chip">custom:${escape(item.type)}</span>`).join('');
    const dynamic = report.dynamic.length ? `<div class="dependency"><div><h3>${t.dynamic} <em>${report.dynamic.length}</em></h3><p>${t.dynamicHint}</p></div></div>` : '';
    return `<div class="section-heading"><h2>${t.dependencies}</h2><p>${report.entities.length} ${t.entities.toLowerCase()}</p></div>
      <div class="entity-list">${report.entities.length ? report.entities.map((item) => `<div class="entity-row"><div><span class="dot ${item.status}"></span><strong>${escape(item.id)}</strong><small>${escape(pathLabel(item.paths[0]))}</small></div><span class="badge ${item.status}">${t[item.status]}</span></div>`).join('') : `<div class="success">✓ ${t.noIssues}</div>`}</div>
      <div class="dependency"><div><h3>${t.custom} <em>${report.customCards.length}</em></h3><p>${t.customHint}</p></div><div class="chips">${custom || '—'}</div></div>${dynamic}`;
  }

  bind() {
    this.shadowRoot.querySelector('input[type=file]')?.addEventListener('change', (event) => this.loadFile(event.target.files[0]));
    this.shadowRoot.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => { this.activeTab = button.dataset.tab; this.render(); }));
    this.shadowRoot.querySelectorAll('[data-map]').forEach((input) => input.addEventListener('change', () => {
      const source = input.dataset.map;
      const replacement = input.value.trim();
      if (replacement && (!this.states[replacement] || replacement.split('.')[0] !== source.split('.')[0])) {
        this.error = translate(this.language).invalidMapping;
      } else { this.mappings[source] = replacement; this.error = ''; }
      this.render();
    }));
    this.shadowRoot.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => {
      if (button.dataset.action === 'demo') this.loadDemo();
      if (button.dataset.action === 'download') this.download();
      if (button.dataset.action === 'reset') { this.parsed = null; this.error = ''; this.demo = false; this.mappings = {}; this.render(); }
    }));
    const surface = this.shadowRoot.querySelector('.workspace');
    surface?.addEventListener('dragover', (event) => { event.preventDefault(); surface.classList.add('dragging'); });
    surface?.addEventListener('dragleave', () => surface.classList.remove('dragging'));
    surface?.addEventListener('drop', (event) => { event.preventDefault(); surface.classList.remove('dragging'); this.loadFile(event.dataTransfer.files[0]); });
  }
}

customElements.define('dashboard-adapter-card', DashboardAdapterCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: 'dashboard-adapter-card', name: 'Dashboard Adapter', description: 'Inspect and adapt shared dashboards locally' });
