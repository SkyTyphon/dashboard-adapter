import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDashboard, analyzeDashboard, suggestEntities, applyMappings } from '../src/dashboard.js';

const source = `# shared dashboard\ntitle: Example\nviews:\n  - title: Main\n    cards:\n      - type: custom:mini-graph-card\n        entity: sensor.old_room\n        entities:\n          - light.old_room\n          - entity: switch.old_plug\n        tap_action:\n          action: toggle\n          target:\n            entity_id: light.old_room\n      - type: markdown\n        content: "{{ states('sensor.old_room') }}"\n`;
const states = {
  'sensor.new_room': { state: '20' },
  'light.new_room': { state: 'on' },
  'switch.new_plug': { state: 'unavailable' },
};

test('parses and analyzes YAML dashboard with nested entity fields', () => {
  const parsed = parseDashboard(source, 'dashboard.yaml');
  const report = analyzeDashboard(parsed.data, states);
  assert.equal(report.viewCount, 1);
  assert.equal(report.cardCount, 2);
  assert.equal(report.entities.length, 3);
  assert.equal(report.entities.find((item) => item.id === 'light.old_room').paths.length, 2);
  assert.deepEqual(report.customCards.map((item) => item.type), ['mini-graph-card']);
  assert.equal(report.dynamic.length, 1);
});

test('replaces only structural entity fields and preserves YAML comments', () => {
  const parsed = parseDashboard(source, 'dashboard.yaml');
  const result = applyMappings(parsed, { 'sensor.old_room': 'sensor.new_room', 'light.old_room': 'light.new_room' });
  assert.match(result.text, /# shared dashboard/);
  assert.match(result.text, /entity: sensor.new_room/);
  assert.match(result.text, /entity_id: light.new_room/);
  assert.match(result.text, /states\('sensor.old_room'\)/);
  assert.deepEqual(result.changed.sort(), ['light.old_room', 'sensor.old_room']);
});

test('JSON import/export and same-domain suggestion', () => {
  const parsed = parseDashboard('{"views":[{"cards":[{"type":"entity","entity":"light.old_room"}]}]}', 'dashboard.json');
  const result = applyMappings(parsed, { 'light.old_room': 'light.new_room' });
  assert.equal(JSON.parse(result.text).views[0].cards[0].entity, 'light.new_room');
  assert.equal(suggestEntities('light.old_room', states)[0], 'light.new_room');
});

test('rejects invalid file and cross-domain mapping', () => {
  assert.throws(() => parseDashboard('views: nope', 'bad.yaml'), /views array/);
  assert.throws(() => parseDashboard('views: []\nviews: []', 'bad.yaml'), /Map keys must be unique/);
  assert.throws(() => applyMappings(parseDashboard(source, 'a.yaml'), { 'light.old_room': 'switch.new_plug' }), /Invalid replacement/);
});

test('distinguishes unavailable from missing entities', () => {
  const report = analyzeDashboard({ views: [{ cards: [{ type: 'entities', entities: ['switch.new_plug', 'light.new_room', 'light.none'] }] }] }, states);
  assert.deepEqual(report.entities.map((entity) => entity.status), ['unavailable', 'ready', 'missing']);
});

test('rewrites an action target entity_id array', () => {
  const parsed = parseDashboard('views:\n  - cards:\n      - type: button\n        tap_action:\n          target:\n            entity_id: [light.old_room, switch.old_plug]\n', 'a.yaml');
  const report = analyzeDashboard(parsed.data, states);
  assert.deepEqual(report.entities.map((entity) => entity.id), ['light.old_room', 'switch.old_plug']);
  const output = applyMappings(parsed, { 'light.old_room': 'light.new_room' });
  assert.match(output.text, /light\.new_room/);
  assert.match(output.text, /switch\.old_plug/);
});

test('rewrites anchored YAML nodes once so aliases follow', () => {
  const parsed = parseDashboard('base: &button\n  type: button\n  entity: light.old_room\nviews:\n  - cards:\n      - *button\n      - <<: *button\n        name: Copy\n', 'a.yaml');
  assert.equal(analyzeDashboard(parsed.data, states).entities[0].paths.length, 3);
  const output = applyMappings(parsed, { 'light.old_room': 'light.new_room' });
  assert.match(output.text, /entity: light\.new_room/);
  assert.match(output.text, /- \*button/);
  assert.match(output.text, /<<: \*button/);
  assert.equal(output.data.views[0].cards[1].entity, 'light.new_room');
  assert.deepEqual(output.changed, ['light.old_room']);
});

test('rejects unresolved Home Assistant YAML tags', () => {
  assert.throws(() => parseDashboard('views:\n  - cards:\n      - !include card.yaml\n', 'a.yaml'), /Unsupported YAML tag !include/);
  assert.throws(() => parseDashboard('views:\n  - cards:\n      - type: iframe\n        url: !secret camera\n', 'a.yaml'), /Unsupported YAML tag !secret/);
});

test('counts cards without tile features or picture elements', () => {
  const parsed = parseDashboard('views:\n  - type: sections\n    sections:\n      - type: grid\n        cards:\n          - type: tile\n            entity: light.a\n            features:\n              - type: light-brightness\n          - type: conditional\n            conditions: []\n            card:\n              type: picture-elements\n              elements:\n                - type: state-icon\n                  entity: light.b\n', 'a.yaml');
  assert.equal(analyzeDashboard(parsed.data).cardCount, 3);
});

test('detects Jinja and button-card JavaScript templates', () => {
  const parsed = parseDashboard("views:\n  - cards:\n      - type: custom:button-card\n        name: '[[[ return states[\"light.a\"].state ]]]'\n      - type: markdown\n        content: '{% if true %}x{% endif %}'\n      - type: markdown\n        content: plain [text]\n", 'a.yaml');
  assert.equal(analyzeDashboard(parsed.data).dynamic.length, 2);
});

test('rewrites present entities in JSON and keeps unmapped ones', () => {
  const parsed = parseDashboard('{"views":[{"cards":[{"type":"entities","entities":["light.new_room","sensor.new_room",{"entity":"light.new_room"}]}]}]}', 'a.json');
  const output = JSON.parse(applyMappings(parsed, { 'light.new_room': 'light.other' }).text);
  assert.deepEqual(output.views[0].cards[0].entities, ['light.other', 'sensor.new_room', { entity: 'light.other' }]);
});
