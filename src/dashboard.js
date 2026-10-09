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
        else collect(item, itemPath);
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
  const collect = (item, path) => {
    if (typeof item !== 'string') return;
    const values = item.split(',').map((v) => v.trim());
    if (!values.length || !values.every((v) => ENTITY_ID.test(v))) return;
    for (const id of values) {
      if (!references.has(id)) references.set(id, []);
      references.get(id).push(path);
    }
  };
  visit(data);
  const entities = [...references].map(([id, paths]) => ({
    id,
    paths,
    status: entityStatus(states, id),
  }));
  return { entities, customCards: [...customCards].map(([type, paths]) => ({ type, paths })), dynamic, cardCount, viewCount: data.views.length };
}

export function suggestEntities(missingId, states, limit = 5) {
  const [domain, ...words] = missingId.split(/[._-]/);
  const target = new Set(words);
  return Object.keys(states).filter((id) => id !== missingId && id.startsWith(`${domain}.`))
    .map((id) => {
      const parts = new Set(id.split(/[._-]/).slice(1));
      const overlap = [...target].filter((word) => parts.has(word)).length;
      const union = new Set([...target, ...parts]).size;
      return { id, score: union ? overlap / union : 0 };
    })
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, limit).map(({ id }) => id);
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
