import { build } from 'esbuild';

await build({
  entryPoints: ['src/card.js'],
  outfile: 'dist/dashboard-adapter.js',
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['es2020'],
  legalComments: 'none',
});
