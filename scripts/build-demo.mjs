import { copyFile, stat } from 'node:fs/promises';

await stat('dist/dashboard-adapter.js');
await copyFile('dist/dashboard-adapter.js', 'demo/dashboard-adapter.js');
console.log('Demo bundle ready');
