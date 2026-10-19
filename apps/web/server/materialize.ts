/**
 * Database → engagement folder → render. The folder format is the same one
 * the CLI reads, so anything the web app produces can also be rendered,
 * versioned or archived outside the app.
 */
import { mkdirSync, writeFileSync, rmSync, existsSync, copyFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { stringify as toYaml } from 'yaml';
import { loadModules, loadEngagement, type Modules } from '@reportforge/core';
import { preflight } from '@reportforge/preflight';
import { renderTypst } from '@reportforge/render-typst';
import { renderDocx } from '@reportforge/render-docx';
import type { Diagnostic } from '@reportforge/markdown';
import type { Db } from './db.ts';

export interface Paths { root: string; data: string; engagements: string; files: string; renders: string }

export function paths(root: string, dataDir: string): Paths {
  const p = { root, data: dataDir, engagements: join(dataDir, 'engagements'), files: join(dataDir, 'files'), renders: join(dataDir, 'renders') };
  for (const d of Object.values(p)) mkdirSync(d, { recursive: true });
  return p;
}

export function engagementRow(db: Db, id: number) {
  const e = db.prepare('SELECT e.*, c.slug AS client_slug, c.theme AS client_theme, c.language AS client_language, c.risk_model AS client_risk_model, c.name AS client_name FROM engagements e JOIN clients c ON c.id = e.client_id WHERE e.id = ?').get(id) as any;
  if (!e) throw new Error('Opdracht niet gevonden');
  e.data = JSON.parse(e.data || '{}');
  return e;
}

/** Writes data/engagements/<reference>/ from the database. Returns the folder. */
export function materialize(db: Db, p: Paths, id: number, overrides: { language?: string; theme?: string; template?: string } = {}): string {
  const e = engagementRow(db, id);
  const dir = join(p.engagements, String(e.reference).replace(/[^\w.-]+/g, '_'));
  rmSync(join(dir, 'findings'), { recursive: true, force: true });
  mkdirSync(join(dir, 'findings'), { recursive: true });
  mkdirSync(join(dir, 'images'), { recursive: true });
  const d = e.data;
  const yaml: Record<string, unknown> = {
    reference: e.reference,
    title: e.title,
    subtitle: d.subtitle,
    language: overrides.language ?? d.language ?? e.client_language,
    theme: overrides.theme ?? d.theme ?? e.client_theme,
    template: overrides.template ?? d.template ?? 'pentest-report',
    risk_model: d.risk_model ?? e.client_risk_model,
    type: d.type,
    version: d.version ?? '1.0',
    date: d.date ?? new Date().toISOString().slice(0, 10),
    classification: d.classification,
    status: d.status,
    client: d.client ?? { name: '' },
    provider: d.provider,
    period: d.period ?? { start: d.date, end: d.date },
    authors: d.authors ?? [],
    testers: d.testers,
    reviewers: d.reviewers,
    scope: d.scope ?? [],
    out_of_scope: d.out_of_scope,
    standards: d.standards ?? [],
    tools: d.tools,
    test_approach: d.test_approach,
    executive_summary: d.executive_summary,
    conclusion: d.conclusion,
    limitations: d.limitations,
    recommendations: d.recommendations,
    document_history: d.document_history,
    retest: d.retest,
  };
  for (const k of Object.keys(yaml)) if (yaml[k] === undefined || yaml[k] === null || yaml[k] === '') delete yaml[k];
  writeFileSync(join(dir, 'engagement.yaml'), toYaml(yaml));
  const findings = db.prepare('SELECT * FROM findings WHERE engagement_id = ? ORDER BY position, id').all(id) as any[];
  findings.forEach((f, i) => writeFileSync(join(dir, 'findings', `${String(i + 1).padStart(2, '0')}-${f.id}.md`), f.markdown.replace(/\r\n/g, '\n').trimEnd() + '\n'));
  // images: copy files registered for this engagement
  const srcDir = join(p.files, String(id));
  if (existsSync(srcDir)) for (const f of readdirSync(srcDir)) copyFileSync(join(srcDir, f), join(dir, 'images', f));
  return dir;
}

export interface RenderOutcome { ok: boolean; diagnostics: Diagnostic[]; pdf?: string; docx?: string; durationMs: number; dir: string }

export async function renderEngagement(db: Db, p: Paths, id: number, opts: { formats?: string[]; language?: string; theme?: string; template?: string; mods?: Modules } = {}): Promise<RenderOutcome> {
  const t0 = Date.now();
  const mods = opts.mods ?? loadModules(p.root);
  const dir = materialize(db, p, id, opts);
  let ctx, diagnostics;
  try { ({ ctx, diagnostics } = await loadEngagement(mods, dir)); }
  catch (e: any) {
    const diags: Diagnostic[] = [{ level: 'error', message: e.message }];
    db.prepare('INSERT INTO renders (engagement_id, document, version, language, theme, diagnostics, ok, duration_ms) VALUES (?,?,?,?,?,?,?,?)').run(id, 'report', '?', opts.language ?? '?', opts.theme ?? '?', JSON.stringify(diags), 0, Date.now() - t0);
    return { ok: false, diagnostics: diags, durationMs: Date.now() - t0, dir };
  }
  const all = [...diagnostics, ...preflight(mods, ctx)].map((d) => ({ ...d, file: d.file?.replace(dir + '/', '') }));
  const errors = all.filter((d) => d.level === 'error');
  const formats = opts.formats ?? ['pdf', 'docx'];
  const outDir = join(p.renders, String(id));
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
  const base = `${ctx.engagement.reference}-v${ctx.engagement.version}-${ctx.lang}-${stamp}`.replace(/[^\w.-]+/g, '_');
  const out: RenderOutcome = { ok: errors.length === 0, diagnostics: all, durationMs: 0, dir };
  if (errors.length === 0) {
    try {
      if (formats.includes('pdf')) out.pdf = renderTypst(mods, ctx, join(outDir, `${base}.pdf`)).pdf;
      if (formats.includes('docx')) out.docx = (await renderDocx(mods, ctx, join(outDir, `${base}.docx`))).docx;
    } catch (e: any) {
      out.ok = false;
      out.diagnostics.push({ level: 'error', message: `Renderfout: ${e.message}` });
    }
  }
  out.durationMs = Date.now() - t0;
  db.prepare('INSERT INTO renders (engagement_id, document, version, language, theme, pdf, docx, diagnostics, ok, duration_ms) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(id, ctx.document, ctx.engagement.version, ctx.lang, ctx.theme.id, out.pdf ?? null, out.docx ?? null, JSON.stringify(out.diagnostics), out.ok ? 1 : 0, out.durationMs);
  return out;
}

/** Renders one finding on its own (quick PDF preview in the editor). */
export async function previewFinding(db: Db, p: Paths, engagementId: number, markdown: string, opts: { language?: string; theme?: string } = {}): Promise<{ pdf?: string; diagnostics: Diagnostic[] }> {
  const mods = loadModules(p.root);
  const dir = materialize(db, p, engagementId, opts);
  const pdir = join(p.renders, String(engagementId), 'preview');
  rmSync(pdir, { recursive: true, force: true });
  mkdirSync(join(pdir, 'findings'), { recursive: true });
  copyFileSync(join(dir, 'engagement.yaml'), join(pdir, 'engagement.yaml'));
  if (existsSync(join(dir, 'images'))) { mkdirSync(join(pdir, 'images'), { recursive: true }); for (const f of readdirSync(join(dir, 'images'))) copyFileSync(join(dir, 'images', f), join(pdir, 'images', f)); }
  for (const f of ['summary.md', 'conclusion.md']) if (existsSync(join(dir, f))) copyFileSync(join(dir, f), join(pdir, f));
  writeFileSync(join(pdir, 'findings', '01.md'), markdown);
  let ctx, diagnostics;
  try { ({ ctx, diagnostics } = await loadEngagement(mods, pdir, { template: 'finding-preview' })); }
  catch (e: any) { return { diagnostics: [{ level: 'error', message: e.message }] }; }
  const errors = diagnostics.filter((d) => d.level === 'error');
  if (errors.length) return { diagnostics };
  try {
    const pdf = renderTypst(mods, ctx, join(pdir, 'preview.pdf')).pdf;
    return { pdf, diagnostics };
  } catch (e: any) {
    return { diagnostics: [...diagnostics, { level: 'error', message: e.message }] };
  }
}
