import { parseDashboard, analyzeDashboard, suggestEntities, applyMappings, entityStatus } from './dashboard.js';
import { translate, translateError } from './i18n.js';
import { demoText, demoStates } from './demo.js';
import { styles } from './styles.js';

const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const pathLabel = (path) => path.map((part) => typeof part === 'number' ? `[${part}]` : part).join('.').replace(/\.\[/g, '[');
const STATUS_ORDER = { missing: 0, unavailable: 1, ready: 2 };

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
    this.showAll = false;
    this.copied = false;
    this._report = null;
    this._adapted = null;
    this._signature = '';
  }

  setConfig(config) {
    if (config?.language && !['auto', 'en', 'fr'].includes(config.language)) throw new Error('language: auto, en, fr');
    this.config = config || {};
    this.render();
  }
  static getStubConfig() { return {}; }
  getCardSize() { return 9; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: 9, min_rows: 6 }; }
  set hass(hass) {
    const previous = this._hass;
    this._hass = hass;
    if (!previous || previous.language !== hass.language) { this.render(); return; }
    // Home Assistant sends new states many times per second. Redraw only when a
    // referenced entity changes category or the entity list changes size.
    if (previous.states === hass.states || this.demo || !this.parsed) return;
    if (this.signature() !== this._signature) this.render();
  }
  get language() {
    const configured = this.config?.language;
    return configured && configured !== 'auto' ? configured : this._hass?.language || navigator.language;
  }
  get states() { return this.demo ? demoStates : this._hass?.states || {}; }

  signature() {
    if (!this.parsed) return '';
    const states = this.states;
    const ids = this._report?.parsed === this.parsed ? this._report.value.entities.map((item) => item.id) : [];
    return `${this.demo}|${Object.keys(states).length}|${ids.map((id) => entityStatus(states, id)).join(',')}`;
  }

  get report() {
    if (!this.parsed) return null;
    const signature = this.signature();
    if (this._report?.parsed !== this.parsed || this._report.signature !== signature) {
      const value = analyzeDashboard(this.parsed.data, this.states);
      this._report = { parsed: this.parsed, signature, value };
      this._report.signature = this.signature();
    }
    this._signature = this._report.signature;
    return this._report.value;
  }

  adapted() {
    const key = JSON.stringify(this.mappings);
    if (this._adapted?.parsed !== this.parsed || this._adapted.key !== key) {
      let value;
      try { value = { text: applyMappings(parseDashboard(this.parsed.original, this.filename), this.mappings).text, error: '' }; }
      catch (error) {
        const t = translate(this.language);
        value = { text: this.parsed.original, error: error.message.startsWith('Invalid replacement') ? t.invalidMapping : t.exportError };
      }
      this._adapted = { parsed: this.parsed, key, value };
    }
    return this._adapted.value;
  }

  get exportName() {
    return this.filename.replace(/\.(yaml|yml|json)$/i, '') + '-adapted.' + (this.parsed.format === 'json' ? 'json' : 'yaml');
  }

  start(parsed, filename, demo) {
    this.parsed = parsed;
    this.filename = filename;
    this.mappings = {};
    this.error = '';
    this.demo = demo;
    this.showAll = false;
    this.activeTab = 'dependencies';
  }

  async loadFile(file) {
    if (!file) return;
    try {
      const text = await file.text();
      this.start(parseDashboard(text, file.name), file.name, false);
    } catch (error) {
      this.error = `${translate(this.language).fileError}: ${translateError(error.message, this.language)}`;
    }
    this.render();
  }

  loadDemo() {
    this.start(parseDashboard(demoText, 'demo.yaml'), 'shared-home-demo.yaml', true);
    this.render();
  }

  download() {
    if (!this.parsed) return;
    const result = this.adapted();
    if (result.error) { this.error = result.error; this.render(); return; }
    const blob = new Blob([result.text], { type: this.parsed.format === 'json' ? 'application/json' : 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = this.exportName;
    this.shadowRoot.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async copy() {
    if (!this.parsed) return;
    const t = translate(this.language);
    const result = this.adapted();
    if (result.error) { this.error = result.error; this.render(); return; }
    let done = false;
    try { await navigator.clipboard.writeText(result.text); done = true; } catch {}
    if (!done) {
      // The Clipboard API needs HTTPS; Home Assistant is often served over plain HTTP on the LAN.
      const area = document.createElement('textarea');
      area.value = result.text;
      area.setAttribute('readonly', '');
      area.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      this.shadowRoot.append(area);
      area.select();
      try { done = document.execCommand('copy'); } catch {}
      area.remove();
    }
    if (!done) { this.error = t.copyFailed; this.render(); return; }
    this.copied = true;
    this.render();
    clearTimeout(this._copiedTimer);
    this._copiedTimer = setTimeout(() => { this.copied = false; this.render(); }, 2000);
  }

  render() {
    if (!this.shadowRoot) return;
    // innerHTML replaces every node: keep the replacement being typed and the scroll positions.
    const active = this.shadowRoot.activeElement;
    const focus = active?.dataset?.map ? { map: active.dataset.map, value: active.value, start: active.selectionStart, end: active.selectionEnd } : null;
    const scrolls = Object.fromEntries([...this.shadowRoot.querySelectorAll('[data-scroll]')].map((element) => [element.dataset.scroll, [element.scrollTop, element.scrollLeft]]));

    const t = translate(this.language);
    const report = this.report;
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
      <div class="tabs" role="tablist" aria-label="${t.analysis}">
        ${['dependencies','mapping','preview'].map((tab) => `<button type="button" role="tab" aria-selected="${this.activeTab === tab}" data-tab="${tab}">${t[tab]}${tab === 'mapping' ? ` <small>${resolved}/${missing}</small>` : ''}</button>`).join('')}
      </div>
      <div class="panel" role="tabpanel">${this.renderTab(report, t)}</div>` : `<div class="empty"><div class="empty-icon">▦</div><p>${t.noDashboard}</p><button type="button" data-action="demo">${t.demo} →</button></div>`;
    this.shadowRoot.innerHTML = `<style>${styles}</style><ha-card><div class="shell">
      <header><div class="brand"><div class="logo">◈</div><span>Dashboard Adapter</span><span class="version">${t.beta}</span></div><div class="privacy">◆ ${t.privacy}</div></header>
      <section class="hero"><div><div class="eyebrow">${t.eyebrow}</div><h1>${t.title}</h1><p>${t.subtitle}</p></div><div class="hero-art" aria-hidden="true"><div class="art-card art-a">▥ <i></i><i></i><i></i></div><div class="art-link">⋯ ⋯ ⋯</div><div class="art-card art-b">✓ <i></i><i></i><i></i></div></div></section>
      <section class="workspace"><div class="toolbar"><div class="file"><b>${this.parsed ? escape(this.filename) : t.filename}</b>${this.demo ? `<span class="demo-pill">${t.demoLabel}</span>` : ''}</div><div class="actions"><label class="import-button">${t.import}<input type="file" accept=".yaml,.yml,.json,application/json,text/yaml" aria-label="${t.import}"></label><button type="button" data-action="demo">${t.demo}</button>${this.parsed ? `<button type="button" data-action="reset">${t.reset}</button>` : ''}</div></div>
      ${this.error ? `<div class="error" role="alert">${escape(this.error)}</div>` : ''}
      ${!this._hass && !this.demo ? `<div class="notice">${t.noHass}</div>` : ''}
      ${dash}</section><footer>Dashboard Adapter <span>●</span> ${t.footer}</footer>
      </div></ha-card>`;
    this.bind();

    for (const element of this.shadowRoot.querySelectorAll('[data-scroll]')) {
      const position = scrolls[element.dataset.scroll];
      if (position) [element.scrollTop, element.scrollLeft] = position;
    }
    if (focus) {
      const input = [...this.shadowRoot.querySelectorAll('input[data-map]')].find((element) => element.dataset.map === focus.map);
      if (input) {
        input.value = focus.value;
        input.focus();
        try { input.setSelectionRange(focus.start, focus.end); } catch {}
      }
    }
  }

  renderMapRow(item, t) {
    const candidates = suggestEntities(item.id, this.states, 8);
    const badge = item.status === 'missing' ? '' : ` <span class="badge ${item.status}">${t[item.status]}</span>`;
    return `<div class="map-row"><div class="entity-info"><span class="entity-icon">↳</span><div><strong>${escape(item.id)}${badge}</strong><small>${item.paths.length} × · ${escape(pathLabel(item.paths[0]))}</small></div></div><div class="arrow">→</div><input data-map="${escape(item.id)}" list="choices-${escape(item.id)}" value="${escape(this.mappings[item.id] || '')}" placeholder="${t.choose}" aria-label="${t.choose}: ${escape(item.id)}"><datalist id="choices-${escape(item.id)}">${candidates.map((id) => `<option value="${escape(id)}"></option>`).join('')}</datalist></div>`;
  }

  renderTab(report, t) {
    if (this.activeTab === 'mapping') {
      const missing = report.entities.filter((item) => item.status === 'missing');
      const others = report.entities.filter((item) => item.status !== 'missing').sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
      const list = missing.length ? `<div class="map-list" data-scroll="missing">${missing.map((item) => this.renderMapRow(item, t)).join('')}</div>` : `<div class="success">✓ ${t.noIssues}</div>`;
      const toggle = others.length ? `<button type="button" class="link-button" data-action="toggle-all" aria-expanded="${this.showAll}">${this.showAll ? t.hideOther : `${t.showOther} (${others.length})`}</button>` : '';
      const extra = this.showAll && others.length ? `<div class="map-list" data-scroll="others">${others.map((item) => this.renderMapRow(item, t)).join('')}</div>` : '';
      return `<div class="section-heading"><h2>${t.mapping}</h2><p>${missing.length} ${t.missing.toLowerCase()}</p></div>${list}${toggle}${extra}<p class="note">${t.previewNote}</p>`;
    }
    if (this.activeTab === 'preview') {
      const changes = Object.values(this.mappings).filter(Boolean).length;
      const unresolved = report.entities.filter((item) => item.status === 'missing' && !this.mappings[item.id]).length;
      const result = this.adapted();
      return `<div class="section-heading"><h2>${t.preview}</h2><p>${changes} ${t.changes.toLowerCase()}</p></div>${result.error ? `<div class="error inline" role="alert">${escape(result.error)}</div>` : ''}${unresolved ? `<div class="notice inline">⚠ ${unresolved} ${t.unresolved}</div>` : ''}<div class="code-grid"><div><h3>${t.original}</h3><pre data-scroll="original">${escape(this.parsed.original)}</pre></div><div><h3>${t.adapted}</h3><pre data-scroll="adapted">${escape(result.text)}</pre></div></div><div class="export-row"><p>${t.previewNote}</p><div class="export-actions"><button type="button" data-action="copy"${result.error ? ' disabled' : ''}>${this.copied ? `✓ ${t.copied}` : t.copy}</button><button class="primary" type="button" data-action="download"${result.error ? ' disabled' : ''}>↓ ${t.download}</button></div></div>`;
    }
    const custom = report.customCards.map((item) => `<span class="chip">custom:${escape(item.type)}</span>`).join('');
    const dynamic = report.dynamic.length ? `<div class="dependency"><div><h3>${t.dynamic} <em>${report.dynamic.length}</em></h3><p>${t.dynamicHint}</p></div></div>` : '';
    return `<div class="section-heading"><h2>${t.dependencies}</h2><p>${report.entities.length} ${t.entities.toLowerCase()}</p></div>
      <div class="entity-list" data-scroll="entities">${report.entities.length ? report.entities.map((item) => `<div class="entity-row"><div><span class="dot ${item.status}"></span><strong>${escape(item.id)}</strong><small>${escape(pathLabel(item.paths[0]))}</small></div><span class="badge ${item.status}">${t[item.status]}</span></div>`).join('') : `<div class="success">✓ ${t.noIssues}</div>`}</div>
      <div class="dependency"><div><h3>${t.custom} <em>${report.customCards.length}</em></h3><p>${t.customHint}</p></div><div class="chips">${custom || '—'}</div></div>${dynamic}`;
  }

  bind() {
    this.shadowRoot.querySelector('input[type=file]')?.addEventListener('change', (event) => this.loadFile(event.target.files[0]));
    this.shadowRoot.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => { this.activeTab = button.dataset.tab; this.render(); }));
    this.shadowRoot.querySelectorAll('[data-map]').forEach((input) => input.addEventListener('change', () => {
      const source = input.dataset.map;
      const replacement = input.value.trim();
      if (replacement && replacement !== source && (!this.states[replacement] || replacement.split('.')[0] !== source.split('.')[0])) {
        this.error = translate(this.language).invalidMapping;
      } else { this.mappings[source] = replacement === source ? '' : replacement; this.error = ''; }
      this.render();
    }));
    this.shadowRoot.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => {
      const action = button.dataset.action;
      if (action === 'demo') this.loadDemo();
      if (action === 'download') this.download();
      if (action === 'copy') this.copy();
      if (action === 'toggle-all') { this.showAll = !this.showAll; this.render(); }
      if (action === 'reset') { this.parsed = null; this.error = ''; this.demo = false; this.mappings = {}; this.filename = ''; this.render(); }
    }));
    const surface = this.shadowRoot.querySelector('.workspace');
    surface?.addEventListener('dragover', (event) => { event.preventDefault(); surface.classList.add('dragging'); });
    surface?.addEventListener('dragleave', (event) => { if (!surface.contains(event.relatedTarget)) surface.classList.remove('dragging'); });
    surface?.addEventListener('drop', (event) => { event.preventDefault(); surface.classList.remove('dragging'); this.loadFile(event.dataTransfer.files[0]); });
  }
}

customElements.define('dashboard-adapter-card', DashboardAdapterCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: 'dashboard-adapter-card', name: 'Dashboard Adapter', description: 'Inspect and adapt shared dashboards locally' });
