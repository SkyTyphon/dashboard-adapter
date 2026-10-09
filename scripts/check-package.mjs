import { readFile, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
const manifest = JSON.parse(await readFile('hacs.json', 'utf8'));
assert.equal(manifest.filename, 'dashboard-adapter.js');
assert((await stat(`dist/${manifest.filename}`)).size > 1000);
const output = await readFile(`dist/${manifest.filename}`, 'utf8');
assert(output.includes('dashboard-adapter-card'));
console.log('HACS artifact present:', manifest.filename);
