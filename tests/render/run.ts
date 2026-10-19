/**
 * Render tests: renders every fixture engagement to PDF (and DOCX), then
 *   1. overflow check — rasterises each page and asserts no ink in the margins
 *      (cover page excluded: it is full-bleed by design)
 *   2. snapshot check — page count + per-page image hash must match
 *      tests/render/snapshots/<fixture>.json  (run with --update to accept)
 *
 *   npm run test:render            check
 *   npm run test:render -- --update
 */
import { readdirSync, existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { loadModules, loadEngagement } from '@reportforge/core';
import { preflight } from '@reportforge/preflight';
import { renderTypst } from '@reportforge/render-typst';
import { renderDocx } from '@reportforge/render-docx';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURES = join(ROOT, 'tests/fixtures');
const SNAP = join(ROOT, 'tests/render/snapshots');
const OUT = join(ROOT, '.rf-cache/test-render');
const update = process.argv.includes('--update');
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);
const DPI = 50;
const MM = DPI / 25.4;

interface PageCheck { page: number; ok: boolean; detail?: string }

async function rasterize(pdf: string, dir: string): Promise<string[]> {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  execFileSync('pdftoppm', ['-r', String(DPI), '-png', pdf, join(dir, 'p')]);
  return readdirSync(dir).filter((f) => f.endsWith('.png')).sort().map((f) => join(dir, f));
}

/** Any non-white pixel in the outer margin bands (excluding the running header/footer zone) is an overflow. */
async function overflowCheck(png: string, page: number, margins: { left: number; right: number; top: number; bottom: number }): Promise<PageCheck> {
  const img = sharp(png).greyscale();
  const { width, height } = await img.metadata();
  const raw = await img.raw().toBuffer();
  const w = width!, h = height!;
  const bands = [
    { name: 'left', x0: 0, x1: Math.floor((margins.left - 1.5) * MM), y0: 0, y1: h },
    { name: 'right', x0: Math.ceil(w - (margins.right - 1.5) * MM), x1: w, y0: 0, y1: h },
    { name: 'top', x0: 0, x1: w, y0: 0, y1: Math.floor(6 * MM) },
    { name: 'bottom', x0: 0, x1: w, y0: Math.ceil(h - 6 * MM), y1: h },
  ];
  for (const b of bands) {
    let dark = 0;
    for (let y = b.y0; y < b.y1; y++) for (let x = b.x0; x < b.x1; x++) if (raw[y * w + x] < 200) dark++;
    if (dark > 3) return { page, ok: false, detail: `${dark} donkere pixels in de ${b.name}-marge` };
  }
  return { page, ok: true };
}

async function main() {
  const mods = loadModules(ROOT);
  const fixtures = readdirSync(FIXTURES).filter((f) => existsSync(join(FIXTURES, f, 'engagement.yaml')) && (!only || f === only));
  mkdirSync(SNAP, { recursive: true });
  let failed = 0;
  const jobs = fixtures.flatMap((name) => {
    const tf = join(FIXTURES, name, 'templates');
    const tpls = existsSync(tf) ? readFileSync(tf, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean) : ['pentest-report'];
    return tpls.map((template) => ({ fixture: name, template, name: template === 'pentest-report' ? name : `${name}--${template}` }));
  });
  for (const job of jobs) {
    const { name } = job;
    const t0 = Date.now();
    const { ctx, diagnostics } = await loadEngagement(mods, join(FIXTURES, job.fixture), { template: job.template });
    const errors = [...diagnostics, ...preflight(mods, ctx)].filter((d) => d.level === 'error');
    if (errors.length) { console.log(`✖ ${name}: ${errors.map((e) => e.message).join('; ')}`); failed++; continue; }
    const outDir = join(OUT, name);
    mkdirSync(outDir, { recursive: true });
    const pdf = renderTypst(mods, ctx, join(outDir, 'report.pdf')).pdf;
    await renderDocx(mods, ctx, join(outDir, 'report-word.docx'));
    const pages = await rasterize(pdf, join(outDir, 'pages'));
    const m = { left: 20, right: 20, top: 22, bottom: 22 };
    const checks: PageCheck[] = [];
    for (const [i, p] of pages.entries()) {
      if (i === 0) continue; // cover is full-bleed
      checks.push(await overflowCheck(p, i + 1, m));
    }
    const overflow = checks.filter((c) => !c.ok);
    // DOCX: convert with LibreOffice (when installed) and run the same margin check
    const docxOverflow: PageCheck[] = [];
    let docxPages = 0;
    try {
      execFileSync('soffice', ['--headless', '--convert-to', 'pdf', '--outdir', outDir, join(outDir, 'report-word.docx')], { stdio: 'ignore', timeout: 180000 });
      const dpages = await rasterize(join(outDir, 'report-word.pdf'), join(outDir, 'docx-pages'));
      docxPages = dpages.length;
      for (const [i, p] of dpages.entries()) { if (i === 0) continue; const c = await overflowCheck(p, i + 1, m); if (!c.ok) docxOverflow.push(c); }
    } catch { /* soffice not available: skipped */ }
    const hashes = pages.map((p) => createHash('sha1').update(readFileSync(p)).digest('hex').slice(0, 12));
    const snapFile = join(SNAP, `${name}.json`);
    const snap = { pages: pages.length, hashes, docxBytes: statSync(join(outDir, 'report-word.docx')).size };
    let snapOk = true, snapDetail = '';
    if (existsSync(snapFile) && !update) {
      const prev = JSON.parse(readFileSync(snapFile, 'utf8'));
      if (prev.pages !== snap.pages) { snapOk = false; snapDetail = `${prev.pages} → ${snap.pages} pagina's`; }
      else {
        const changed = prev.hashes.map((hsh: string, i: number) => (hsh !== snap.hashes[i] ? i + 1 : 0)).filter(Boolean);
        if (changed.length) { snapOk = false; snapDetail = `pagina's gewijzigd: ${changed.join(', ')}`; }
      }
    } else {
      writeFileSync(snapFile, JSON.stringify(snap, null, 2));
      snapDetail = update ? 'snapshot bijgewerkt' : 'snapshot aangemaakt';
    }
    const ok = overflow.length === 0 && docxOverflow.length === 0 && snapOk;
    if (!ok) failed++;
    console.log(`${ok ? '✔' : '✖'} ${name}: PDF ${pages.length} pagina's${docxPages ? `, DOCX ${docxPages} pagina's` : ''}, ${Date.now() - t0} ms${snapDetail ? ' — ' + snapDetail : ''}`);
    for (const o of docxOverflow) console.log(`    DOCX overflow op pagina ${o.page}: ${o.detail}  (${join(outDir, 'docx-pages')})`);
    for (const o of overflow) console.log(`    overflow op pagina ${o.page}: ${o.detail}  (${join(outDir, 'pages')})`);
  }
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
