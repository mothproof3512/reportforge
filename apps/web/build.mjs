// Bundles the React app with esbuild. `node apps/web/build.mjs` or `--watch`.
import * as esbuild from 'esbuild';
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes('--watch');
mkdirSync(join(dir, 'dist'), { recursive: true });
cpSync(join(dir, 'public'), join(dir, 'dist'), { recursive: true });
cpSync(join(dir, '../../assets/fonts'), join(dir, 'dist/fonts'), { recursive: true });
const opts = {
  entryPoints: [join(dir, 'src/main.tsx')],
  bundle: true, outfile: join(dir, 'dist/app.js'), format: 'esm', sourcemap: true, minify: !watch,
  jsx: 'automatic', target: ['es2022'], logLevel: 'info', define: { 'process.env.NODE_ENV': watch ? '"development"' : '"production"' },
};
if (watch) { const ctx = await esbuild.context(opts); await ctx.watch(); console.log('watching…'); } else await esbuild.build(opts);
