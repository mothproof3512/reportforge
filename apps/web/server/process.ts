/** Process routes: checklist generation, delivery (version freeze + hashes), retest. */
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { loadModules } from '@reportforge/core';
import { Router, HttpError } from './http.ts';
import { now, type Db } from './db.ts';
import { engagementRow, type Paths } from './materialize.ts';

/** Which standards a scope type suggests for the checklist. */
export const CHECKLIST_SUGGESTIONS: Record<string, string[]> = {
  web: ['wstg-4.2'], api: ['owasp-api-top10-2023'], mobile: ['masvs-2'], infra: [], cloud: [], other: [],
};

export function registerProcess(r: Router, db: Db, p: Paths) {
  const id = (req: any) => Number(req.params.id);
  const saveData = (eid: number, data: any) => db.prepare('UPDATE engagements SET data = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(data), now(), eid);

  // ---- checklist generation
  r.get('/api/engagements/:id/checklists/suggest', (req, res) => {
    const e = engagementRow(db, id(req));
    const types = new Set<string>((e.data.scope ?? []).map((s: any) => String(s.type ?? 'web')));
    const suggested = new Set<string>();
    for (const ty of types) for (const s of CHECKLIST_SUGGESTIONS[ty] ?? []) suggested.add(s);
    for (const s of e.data.standards ?? []) if (['asvs-4.0.3'].includes(s)) suggested.add(s);
    res.json({ suggested: [...suggested], available: Object.values(loadModules(p.root).standards).filter((s) => ['methodology', 'verification', 'classification'].includes(s.kind)).map((s) => ({ id: s.id, name: s.name, items: s.items.length })) });
  });
  r.post('/api/engagements/:id/checklists/generate', async (req, res) => {
    const e = engagementRow(db, id(req));
    const { standards } = await req.json() as { standards: string[] };
    const mods = loadModules(p.root);
    const tp = e.data.testplan ?? {};
    const existing: any[] = tp.checklists ?? [];
    for (const sid of standards ?? []) {
      const std = mods.standards[sid];
      if (!std) throw new HttpError(400, `Onbekende standaard ${sid}`);
      if (existing.some((c) => c.standard === sid)) continue;
      existing.push({ standard: sid, items: std.items.map((it) => ({ id: it.id, status: 'not-tested' })) });
    }
    tp.checklists = existing;
    if (!tp.per_scope?.length) tp.per_scope = (e.data.scope ?? []).map((s: any) => ({ asset: s.asset, approach: '' }));
    e.data.testplan = tp;
    saveData(e.id, e.data);
    res.json(engagementRow(db, e.id));
  });

  // ---- delivery: freeze a successful render, hash it, store under data/deliveries
  r.get('/api/engagements/:id/deliveries', (req, res) => res.json((db.prepare('SELECT * FROM deliveries WHERE engagement_id = ? ORDER BY id DESC').all(id(req)) as any[]).map((d) => ({ ...d, pdf: d.pdf ? `/api/file?path=${encodeURIComponent(d.pdf)}&download=1` : null, docx: d.docx ? `/api/file?path=${encodeURIComponent(d.docx)}&download=1` : null }))));
  r.post('/api/engagements/:id/deliver', async (req, res) => {
    const e = engagementRow(db, id(req));
    const b = await req.json();
    const rnd = db.prepare('SELECT * FROM renders WHERE id = ? AND engagement_id = ?').get(b.render_id, e.id) as any;
    if (!rnd) throw new HttpError(404, 'Render niet gevonden');
    if (!rnd.ok) throw new HttpError(400, 'Deze render heeft fouten en kan niet worden opgeleverd');
    const dir = join(p.renders, '_deliveries', String(e.reference).replace(/[^\w.-]+/g, '_'), `v${rnd.version}-${rnd.document}-${rnd.language}`);
    mkdirSync(dir, { recursive: true });
    const sha = (f: string) => createHash('sha256').update(readFileSync(f)).digest('hex');
    const copy = (src: string | null) => { if (!src || !existsSync(src)) return null; const dst = join(dir, basename(src)); copyFileSync(src, dst); return dst; };
    const pdf = copy(rnd.pdf), docx = copy(rnd.docx);
    const info = db.prepare('INSERT INTO deliveries (engagement_id, render_id, document, version, language, pdf, docx, sha256_pdf, sha256_docx, note) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(e.id, rnd.id, rnd.document, rnd.version, rnd.language, pdf, docx, pdf ? sha(pdf) : null, docx ? sha(docx) : null, b.note ?? '');
    const d = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(info.lastInsertRowid) as any;
    // delivery note next to the files
    const lines = [`Reportforge — oplevering / delivery`, `Referentie: ${e.reference}`, `Document: ${rnd.document} (${rnd.template})`, `Versie: ${rnd.version}`, `Taal: ${rnd.language}`, `Datum: ${d.created_at}`, ''];
    if (pdf) lines.push(`${basename(pdf)}  sha256 ${d.sha256_pdf}`);
    if (docx) lines.push(`${basename(docx)}  sha256 ${d.sha256_docx}`);
    if (b.note) lines.push('', b.note);
    writeFileSync(join(dir, 'DELIVERY.txt'), lines.join('\n') + '\n');
    // advance the process: delivery of a retest report/TPM = step 9, otherwise step 6
    const step = e.data.retest ? 9 : 6;
    if (e.step < step) db.prepare('UPDATE engagements SET step = ?, updated_at = ? WHERE id = ?').run(step, now(), e.id);
    res.json({ ...d, note_file: join(dir, 'DELIVERY.txt') }, 201);
  });

  // ---- retest
  r.post('/api/engagements/:id/retest/start', async (req, res) => {
    const e = engagementRow(db, id(req));
    const b = await req.json().catch(() => ({}));
    if (e.data.retest) throw new HttpError(409, 'Er loopt al een hertest voor deze opdracht');
    const cur = String(e.data.version ?? '1.0');
    const major = parseInt(cur.split('.')[0], 10) || 1;
    const next = `${major + 1}.0`;
    const date = b.date ?? new Date().toISOString().slice(0, 10);
    e.data.retest = { of_version: cur, date };
    e.data.version = next;
    e.data.date = date;
    e.data.status = 'concept';
    e.data.document_history = [...(e.data.document_history ?? []), { version: next, date, author: e.data.authors?.[0]?.name ?? '', change: e.data.language === 'en' ? `Retest of version ${cur}` : `Hertest van versie ${cur}` }];
    saveData(e.id, e.data);
    // mark every finding as "not retested" unless it already carries a Retest field
    const findings = db.prepare('SELECT id, markdown FROM findings WHERE engagement_id = ?').all(e.id) as any[];
    for (const f of findings) {
      if (/\*\*Retest\*\*\s*:/i.test(f.markdown)) continue;
      const md = f.markdown.replace(/^(\*\*Severity\*\*[^\n]*)$/m, '$1 · **Retest**: Not tested');
      db.prepare('UPDATE findings SET markdown = ?, updated_at = ? WHERE id = ?').run(md, now(), f.id);
      db.prepare('INSERT INTO finding_versions (finding_id, markdown) VALUES (?, ?)').run(f.id, md);
    }
    db.prepare('UPDATE engagements SET step = 7, updated_at = ? WHERE id = ?').run(now(), e.id);
    res.json(engagementRow(db, e.id));
  });
  /** Set the retest status of one finding by rewriting its metadata line. */
  r.post('/api/findings/:id/retest', async (req, res) => {
    const f = db.prepare('SELECT * FROM findings WHERE id = ?').get(id(req)) as any;
    if (!f) throw new HttpError(404, 'Niet gevonden');
    const { status, note } = await req.json();
    const label = ({ resolved: 'Resolved', 'partially-resolved': 'Partially resolved', open: 'Open', 'not-tested': 'Not tested', 'risk-accepted': 'Risk accepted' } as Record<string, string>)[status];
    if (!label) throw new HttpError(400, 'Onbekende hertest-status');
    const value = note ? `${label} (${note})` : label;
    let md: string = f.markdown;
    if (/\*\*Retest\*\*\s*:/i.test(md)) md = md.replace(/\*\*Retest\*\*\s*:\s*[^·\n]*/i, `**Retest**: ${value} `).replace(/ {2,}(·|\n)/g, ' $1');
    else md = md.replace(/^(\*\*Severity\*\*[^\n]*)$/m, `$1 · **Retest**: ${value}`);
    db.prepare('UPDATE findings SET markdown = ?, updated_at = ? WHERE id = ?').run(md, now(), f.id);
    db.prepare('INSERT INTO finding_versions (finding_id, markdown) VALUES (?, ?)').run(f.id, md);
    res.json(db.prepare('SELECT * FROM findings WHERE id = ?').get(f.id));
  });
}
