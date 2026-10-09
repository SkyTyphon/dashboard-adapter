import YAML from 'yaml';

const ENTITY_ID = /^(?:[a-z][a-z0-9_]*\.)[a-z0-9_]+$/;
const ENTITY_KEYS = new Set(['entity', 'entity_id', 'camera_image', 'default_entity_id']);
const LIST_KEYS = new Set(['entities', 'entity_ids']);
// Jinja ({{ }}, {% %}) and button-card JavaScript ([[[ ]]]) templates.
const TEMPLATE = /\{\{|\{%|\[\[\[/;

export function parseDashboard(text, filename = '') {
  if (text.length > 2_000_000) throw new Error('File exceeds the 2 MB limit');
  const format = filename.toLowerCase().endsWith('.json') ? 'json' : 'yaml';
  let document;
  let data;
  if (format === 'json') {
    data = JSON.parse(text);
  } else {
    document = YAML.parseDocument(text, { uniqueKeys: true, strict: true, merge: true });
    if (document.errors.length) throw new Error(document.errors[0].message);
    const tag = document.warnings.find((warning) => warning.code === 'TAG_RESOLVE_FAILED');
    if (tag) throw new Error(`Unsupported YAML tag ${tag.message.match(/!\S+/)?.[0] || ''}`.trim());
    data = document.toJS();
  }
  if (!data || typeof data !== 'object' || Array.isArray(data) || !Array.isArray(data.views)) {
    throw new Error('Expected a dashboard object with a views array');
  }
  return { format, document, data, original: text };
}

export function entityStatus(states, id) {
  const state = states[id]?.state;
  if (!states[id]) return 'missing';
  return state === 'unavailable' || state === 'unknown' ? 'unavailable' : 'ready';
}

export function analyzeDashboard(data, states = {}) {
  const references = new Map();
  const names = new Map();
  const customCards = new Map();
  const dynamic = [];
  let cardCount = 0;
  const visit = (value, path = []) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, [...path, index]));
      return;
    }
    if (!value || typeof value !== 'object') return;
    if (typeof value.type === 'string' && value.type.startsWith('custom:')) {
      const kind = value.type.slice(7);
      if (!customCards.has(kind)) customCards.set(kind, []);
      customCards.get(kind).push([...path, 'type']);
    }
    const parentKey = typeof path.at(-1) === 'number' ? path.at(-2) : path.at(-1);
    if (typeof value.type === 'string' && (parentKey === 'cards' || path.at(-1) === 'card')) cardCount++;
    for (const [key, item] of Object.entries(value)) {
      const itemPath = [...path, key];
      if (ENTITY_KEYS.has(key)) {
        if (key === 'entity_id' && Array.isArray(item)) item.forEach((entry, index) => collect(entry, [...itemPath, index]));
        else collect(item, itemPath, value);
      }
      else if (LIST_KEYS.has(key) && Array.isArray(item)) {
        item.forEach((entry, index) => {
          if (typeof entry === 'string') collect(entry, [...itemPath, index]);
        });
      }
      if (typeof item === 'string' && TEMPLATE.test(item)) dynamic.push(itemPath);
      visit(item, itemPath);
    }
  };
  // owner is the object holding the entity field: its display name helps suggest a replacement.
  const collect = (item, path, owner) => {
    if (typeof item !== 'string') return;
    const values = item.split(',').map((v) => v.trim());
    if (!values.length || !values.every((v) => ENTITY_ID.test(v))) return;
    const name = typeof owner?.name === 'string' && !TEMPLATE.test(owner.name) ? owner.name.trim() : '';
    for (const id of values) {
      if (!references.has(id)) { references.set(id, []); names.set(id, new Set()); }
      references.get(id).push(path);
      if (name) names.get(id).add(name);
    }
  };
  visit(data);
  const entities = [...references].map(([id, paths]) => ({
    id,
    paths,
    names: [...names.get(id)],
    status: entityStatus(states, id),
  }));
  return { entities, customCards: [...customCards].map(([type, paths]) => ({ type, paths })), dynamic, cardCount, viewCount: data.views.length };
}

const STOPWORDS = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'et', 'en', 'the', 'of', 'and']);
const tokenize = (text) => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .split(/[^a-z0-9]+/).filter((word) => word.length > 1 && !STOPWORDS.has(word));
const tokenCache = new WeakMap();
// Words from the entity ID and its friendly name, cached per Home Assistant states object.
function entityTokens(states, id) {
  let cache = tokenCache.get(states);
  if (!cache) tokenCache.set(states, cache = new Map());
  if (!cache.has(id)) cache.set(id, new Set([...tokenize(id.slice(id.indexOf('.') + 1)), ...tokenize(states[id]?.attributes?.friendly_name || '')]));
  return cache.get(id);
}
const wordMatch = (a, b) => a === b ? 1 : a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a)) ? 0.6 : 0;

export function friendlyName(states, id) {
  return states[id]?.attributes?.friendly_name || '';
}

const domainCache = new WeakMap();
// Entities of one domain and how many of them use each word, cached per states object.
function domainStats(states, domain) {
  let cache = domainCache.get(states);
  if (!cache) domainCache.set(states, cache = new Map());
  if (!cache.has(domain)) {
    const ids = Object.keys(states).filter((id) => id.startsWith(`${domain}.`));
    const frequency = new Map();
    for (const id of ids) for (const token of entityTokens(states, id)) frequency.set(token, (frequency.get(token) || 0) + 1);
    cache.set(domain, { ids, frequency });
  }
  return cache.get(domain);
}

// Ranks same-domain entities by the words they share with a missing reference. Rare words
// (a device name) weigh more than common ones (status, battery). Words that no entity of the
// domain uses, such as another home's room names, are left out of the coverage.
// `confident` marks a match good enough to offer as a one-click suggestion.
export function rankEntities(missingId, states, limit = 5, hints = []) {
  const domain = missingId.split('.')[0];
  const { ids, frequency } = domainStats(states, domain);
  const known = new Map();
  const words = new Set([...tokenize(missingId.slice(domain.length + 1)), ...hints.flatMap(tokenize)]);
  for (const word of words) {
    const used = frequency.get(word) || [...frequency.keys()].filter((token) => wordMatch(word, token)).reduce((sum, token) => sum + frequency.get(token), 0);
    if (used) known.set(word, Math.log(1 + ids.length / used));
  }
  const total = [...known.values()].reduce((sum, weight) => sum + weight, 0);
  if (!total) return [];
  const ranked = ids.filter((id) => id !== missingId)
    .map((id) => {
      const tokens = entityTokens(states, id);
      let weighted = 0;
      let matched = 0;
      for (const [word, weight] of known) {
        let best = 0;
        for (const token of tokens) if ((best = Math.max(best, wordMatch(word, token))) === 1) break;
        weighted += best * weight;
        if (best === 1) matched++;
      }
      return { id, score: weighted / total, matched, size: tokens.size };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.size - b.size || a.id.localeCompare(b.id));
  // A one-click suggestion needs most words known in this home, most of them matched exactly,
  // and a clear lead: a leftover entity of a removed device must not look like a replacement.
  const [first, second] = ranked;
  const confident = Boolean(first) && first.score >= 0.6 && first.score - (second?.score || 0) >= 0.15
    && known.size / words.size >= 0.5 && first.matched / known.size >= 0.75 && (first.matched >= 2 || words.size === 1);
  return ranked.slice(0, limit).map(({ id, score }, index) => ({ id, score, confident: index === 0 && confident }));
}

export function suggestEntities(missingId, states, limit = 5, hints = []) {
  return rankEntities(missingId, states, limit, hints).map(({ id }) => id);
}

export function applyMappings(parsed, mappings) {
  const seen = new Set();
  const replace = (value) => value.split(',').map((part) => {
    const id = part.trim();
    if (!ENTITY_ID.test(id) || !Object.hasOwn(mappings, id) || !mappings[id]) return part;
    const destination = mappings[id];
    if (!ENTITY_ID.test(destination) || destination.split('.')[0] !== id.split('.')[0]) {
      throw new Error(`Invalid replacement for ${id}`);
    }
    seen.add(id);
    return part.replace(id, destination);
  }).join(',');

  if (parsed.format !== 'json') {
    // Rewrite the YAML syntax tree in place: comments survive, and an anchored node is
    // rewritten once so every alias pointing at it follows automatically.
    const rewriteNode = (node) => {
      if (YAML.isSeq(node)) node.items.forEach(rewriteNode);
      if (!YAML.isMap(node)) return;
      for (const pair of node.items) {
        const key = YAML.isScalar(pair.key) ? pair.key.value : pair.key;
        const value = pair.value;
        if (ENTITY_KEYS.has(key) && YAML.isScalar(value) && typeof value.value === 'string') value.value = replace(value.value);
        else if ((key === 'entity_id' || LIST_KEYS.has(key)) && YAML.isSeq(value)) {
          value.items.forEach((item) => {
            if (YAML.isScalar(item) && typeof item.value === 'string') item.value = replace(item.value);
            else rewriteNode(item);
          });
        } else rewriteNode(value);
      }
    };
    rewriteNode(parsed.document.contents);
    return { data: parsed.document.toJS(), changed: [...seen], text: String(parsed.document) };
  }

  const rewrite = (node) => {
    if (Array.isArray(node)) return node.map(rewrite);
    if (!node || typeof node !== 'object') return node;
    const output = {};
    for (const [key, value] of Object.entries(node)) {
      if (ENTITY_KEYS.has(key) && typeof value === 'string') output[key] = replace(value);
      else if ((key === 'entity_id' || LIST_KEYS.has(key)) && Array.isArray(value)) {
        output[key] = value.map((entry) => typeof entry === 'string' ? replace(entry) : rewrite(entry));
      } else output[key] = rewrite(value);
    }
    return output;
  };
  const data = rewrite(parsed.data);
  return { data, changed: [...seen], text: JSON.stringify(data, null, 2) + '\n' };
}
