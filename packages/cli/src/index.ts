#!/usr/bin/env node
/**
 * reportforge CLI
 *
 *   rf render <engagement-dir> [--out dir] [--format pdf,docx] [--lang nl|en] [--template id]
 *   rf check  <engagement-dir>           parse + preflight only
 *   rf blocks list|check                 module overview / sanity checks
 *   rf standards list
 */
import { Command } from 'commander';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { loadModules, loadEngagement } from '@reportforge/core';
import { preflight, formatDiagnostics } from '@reportforge/preflight';
import { renderTypst, typstVersion } from '@reportforge/render-typst';
import { renderDocx } from '@reportforge/render-docx';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const program = new Command();
program.name('reportforge').description('Modular, whitelabel pentest reporting').version('0.1.0');

program.command('render')
  .argument('<engagement>', 'engagement directory')
  .option('-o, --out <dir>', 'output directory', '')
  .option('-f, --format <list>', 'pdf,docx', 'pdf,docx')
  .option('-l, --lang <lang>', 'nl or en')
  .option('-t, --template <id>', 'template id (overrides engagement.yaml)')
  .option('--strict', 'treat warnings as errors')
  .option('--name <base>', 'output base name (default: <reference>-v<version>)')
  .action(async (engagement: string, o) => {
    const mods = loadModules(ROOT);
    const { ctx, diagnostics, dir } = await loadEngagement(mods, engagement, { lang: o.lang, template: o.template });
    const pf = preflight(mods, ctx);
    const all = [...diagnostics, ...pf];
    if (all.length) console.error(formatDiagnostics(all));
    const errors = all.filter((d) => d.level === 'error' || (o.strict && d.level === 'warning'));
    if (errors.length) { console.error(`\n✖ ${errors.length} fout(en); niet gerenderd.`); process.exit(1); }
    const outDir = resolve(o.out || join(dir, 'out'));
    mkdirSync(outDir, { recursive: true });
    const base = o.name || `${ctx.engagement.reference}-v${ctx.engagement.version}${ctx.document === 'retest' ? '-retest' : ''}`.replace(/[^\w.-]+/g, '_');
    const formats = String(o.format).split(',').map((s) => s.trim());
    const t0 = Date.now();
    if (formats.includes('pdf')) {
      const tv = typstVersion();
      if (!tv) { console.error('✖ typst niet gevonden (zet TYPST_BIN of installeer typst).'); process.exit(1); }
      const r = renderTypst(mods, ctx, join(outDir, `${base}.pdf`));
      for (const w of r.warnings) console.error('  ⚠ ' + w);
      console.log(`✔ PDF  ${r.pdf}`);
    }
    if (formats.includes('docx')) {
      const r = await renderDocx(mods, ctx, join(outDir, `${base}.docx`));
      for (const w of r.warnings) console.error('  ⚠ ' + w);
      console.log(`✔ DOCX ${r.docx}`);
    }
    writeFileSync(join(outDir, `${base}.context.json`), JSON.stringify(ctx, null, 2));
    console.log(`  ${ctx.findings.length} bevindingen, ${Date.now() - t0} ms`);
  });

program.command('check')
  .argument('<engagement>', 'engagement directory')
  .option('-l, --lang <lang>')
  .action(async (engagement: string, o) => {
    const mods = loadModules(ROOT);
    const { ctx, diagnostics } = await loadEngagement(mods, engagement, { lang: o.lang });
    const all = [...diagnostics, ...preflight(mods, ctx)];
    console.log(formatDiagnostics(all) || '✔ geen opmerkingen');
    console.log(`${ctx.findings.length} bevindingen: ` + ctx.findings.map((f) => `${f.id} [${f.severity}${f.risk.score !== undefined ? ' ' + f.risk.label : ''}] ${f.title}`).join('\n  '));
    process.exit(all.some((d) => d.level === 'error') ? 1 : 0);
  });

const blocks = program.command('blocks').description('block modules');
blocks.command('list').action(() => {
  const mods = loadModules(ROOT);
  for (const b of Object.values(mods.blocks)) console.log(`${b.manifest.id.padEnd(20)} ${b.manifest.category.padEnd(10)} typst:${b.hasTypst ? '✔' : '✖'} docx:${b.hasDocx ? '✔' : '✖'}  ${b.manifest.name}`);
});
blocks.command('check').action(() => {
  const mods = loadModules(ROOT);
  let bad = 0;
  for (const b of Object.values(mods.blocks)) {
    const problems: string[] = [];
    if (!b.hasTypst) problems.push('render.typ ontbreekt');
    if (!b.hasDocx) problems.push('render.docx.ts ontbreekt');
    if (!existsSync(join(b.dir, 'i18n/nl.yaml')) || !existsSync(join(b.dir, 'i18n/en.yaml'))) problems.push('i18n nl/en ontbreekt');
    const nl = Object.keys(b.i18n.nl), en = Object.keys(b.i18n.en);
    for (const k of nl) if (!en.includes(k)) problems.push(`i18n en mist "${k}"`);
    for (const k of en) if (!nl.includes(k)) problems.push(`i18n nl mist "${k}"`);
    if (!b.manifest.documents?.length) problems.push('manifest.documents leeg');
    if (problems.length) { bad++; console.log(`✖ ${b.manifest.id}: ${problems.join('; ')}`); } else console.log(`✔ ${b.manifest.id}`);
  }
  for (const [id, tpl] of Object.entries(mods.templates)) {
    const missing = tpl.blocks.filter((tb) => !mods.blocks[tb.type]).map((tb) => tb.type);
    if (missing.length) { bad++; console.log(`✖ template ${id}: onbekende blokken ${missing.join(', ')}`); } else console.log(`✔ template ${id} (${tpl.blocks.length} blokken)`);
  }
  process.exit(bad ? 1 : 0);
});

program.command('standards').description('list standards').action(() => {
  const mods = loadModules(ROOT);
  for (const s of Object.values(mods.standards)) console.log(`${s.id.padEnd(24)} ${String(s.items.length).padStart(4)} items  ${s.name}`);
});

program.parseAsync(process.argv).catch((e) => { console.error('✖ ' + (e.stack || e.message)); process.exit(1); });
