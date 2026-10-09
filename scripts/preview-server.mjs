import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve('.');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const path = resolve(root, `.${pathname === '/' ? '/preview/index.html' : pathname}`);
  if (path !== root && !path.startsWith(root + sep)) { response.writeHead(403); response.end(); return; }
  try { response.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream' }); response.end(await readFile(path)); }
  catch { response.writeHead(404); response.end(); }
}).listen(Number(process.env.DASHBOARD_ADAPTER_PREVIEW_PORT || 4173), '127.0.0.1', () => console.log('Preview ready'));
