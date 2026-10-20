/** REST API. All routes under /api; everything except /api/auth/* needs a session. */
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync, statSync, rmSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { parse as parseYaml, stringify as toYaml } from 'yaml';
import { loadModules, resolveTheme, loadLibrary, libraryLanguages, loadPalettes, paletteToThemeColors, VERSION, type Modules } from '@reportforge/core';
import { parseFindings, parseMarkdown } from '@reportforge/markdown';
import { assess, scoreCvss31, scoreCvss40 } from '@reportforge/risk';
import { Router, HttpError, type Req, type Res } from './http.ts';
import { now, type Db } from './db.ts';
import { materialize, renderEngagement, previewFinding, engagementRow, type Paths } from './materialize.ts';
import { registerProcess } from './process.ts';
import { loadImporters } from '@reportforge/importers';

// ---------------------------------------------------------------- auth
function hashPassword(pw: string): string { const salt = randomBytes(16); return salt.toString('hex') + ':' + scryptSync(pw, salt, 64).toString('hex'); }
function verifyPassword(pw: string, stored: string): boolean { const [salt, hash] = stored.split(':'); const h = scryptSync(pw, Buffer.from(salt, 'hex'), 64); return timingSafeEqual(h, Buffer.from(hash, 'hex')); }
const setting = (db: Db, k: string) => (db.prepare('SELECT value FROM settings WHERE key = ?').get(k) as any)?.value as string | undefined;
const setSetting = (db: Db, k: string, v: string) => db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(k, v);
function secret(db: Db): string { let s = setting(db, 'session_secret'); if (!s) { s = randomBytes(32).toString('hex'); setSetting(db, 'session_secret', s); } return s; }
function signToken(db: Db, payload: string): string { return payload + '.' + createHmac('sha256', secret(db)).update(payload).digest('hex'); }
export function validToken(db: Db, token?: string): boolean {
  if (!token) return false;
  const i = token.lastIndexOf('.'); if (i < 0) return false;
  const payload = token.slice(0, i), sig = token.slice(i + 1);
  const expect = createHmac('sha256', secret(db)).update(payload).digest('hex');
  if (sig.length !== expect.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return false;
  const exp = Number(payload.split(':')[1]);
  return exp > Date.now();
}

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 40) || 'client';
const id = (req: Req, k = 'id') => { const n = Number(req.params[k]); if (!Number.isInteger(n)) throw new HttpError(400, 'Ongeldig id'); return n; };

function findingMeta(markdown: string) {
  const r = parseFindings(markdown);
  const f = r.findings[0];
  return { title: f?.title ?? markdown.split('\n')[0].replace(/^#+\s*/, '').slice(0, 120), severity: f?.severity ?? '', count: r.findings.length, diagnostics: r.diagnostics };
}

export function buildApi(db: Db, p: Paths): Router {
  const r = new Router();
  let modsCache: Modules | undefined;
  let importersCache: Awaited<ReturnType<typeof loadImporters>> | undefined;
  loadImporters(p.root).then((i) => { importersCache = i; }).catch((e) => console.error('importers:', e.message));
  const mods = (fresh = false) => (fresh || !modsCache ? (modsCache = loadModules(p.root)) : modsCache);

  // ---- auth
  r.get('/api/auth/status', (req, res) => res.json({ configured: !!setting(db, 'password'), authenticated: validToken(db, req.cookies.rf_session) }));
  r.post('/api/auth/setup', async (req, res) => {
    if (setting(db, 'password')) throw new HttpError(409, 'Wachtwoord is al ingesteld');
    const { password } = await req.json();
    if (!password || password.length < 10) throw new HttpError(400, 'Wachtwoord moet minimaal 10 tekens zijn');
    setSetting(db, 'password', hashPassword(password));
    res.cookie('rf_session', signToken(db, `s:${Date.now() + 30 * 86400000}`), { maxAge: 30 * 86400 }).json({ ok: true });
  });
  r.post('/api/auth/login', async (req, res) => {
    const { password } = await req.json();
    const stored = setting(db, 'password');
    if (!stored || !password || !verifyPassword(password, stored)) { await new Promise((ok) => setTimeout(ok, 400)); throw new HttpError(401, 'Onjuist wachtwoord'); }
    res.cookie('rf_session', signToken(db, `s:${Date.now() + 30 * 86400000}`), { maxAge: 30 * 86400 }).json({ ok: true });
  });
  r.post('/api/auth/logout', (req, res) => res.cookie('rf_session', '', { maxAge: 0 }).json({ ok: true }));
  r.post('/api/auth/password', async (req, res) => {
    const { current, password } = await req.json();
    const stored = setting(db, 'password');
    if (!stored || !verifyPassword(current ?? '', stored)) throw new HttpError(401, 'Huidig wachtwoord onjuist');
    if (!password || password.length < 10) throw new HttpError(400, 'Wachtwoord moet minimaal 10 tekens zijn');
    setSetting(db, 'password', hashPassword(password));
    res.json({ ok: true });
  });

  // ---- meta: modules the UI needs
  r.get('/api/meta', (req, res) => {
    const m = mods(true);
    res.json({
      themes: Object.keys(m.themes).map((slug) => { const y = parseYaml(readFileSync(join(m.themes[slug], 'theme.yaml'), 'utf8')) ?? {}; return { slug, name: y.name ?? slug, provider: y.provider?.name, primary: y.colors?.primary }; }),
      standards: Object.values(m.standards).map((s) => ({ id: s.id, name: s.name, short: s.short, version: s.version, kind: s.kind, items: s.items.length })),
      templates: Object.values(m.templates).filter((t) => !['finding-preview', 'style-gallery'].includes(t.id)).map((t) => ({ id: t.id, name: t.name, document: t.document, blocks: t.blocks.map((b) => b.type) })),
      blocks: Object.values(m.blocks).map((b) => ({ id: b.manifest.id, name: b.manifest.name, category: b.manifest.category, documents: b.manifest.documents, description: b.manifest.description })),
      importers: Object.values(importersCache ?? {}).map((i) => ({ id: i.manifest.id, name: i.manifest.name, formats: i.manifest.formats, description: i.manifest.description })),
      riskModels: [{ id: 'cvss31', name: 'CVSS 3.1' }, { id: 'cvss40', name: 'CVSS 4.0' }, { id: 'matrix', name: 'Risicomatrix (impact × waarschijnlijkheid)' }],
      languages: ['nl', 'en'],
      steps: ['Intake', 'Testplan', 'Test uitvoeren', 'Rapportage', 'TPM/attestation', 'Opleveren', 'Hertest', 'Bijgewerkte rapportage/TPM', 'Opleveren v2'],
      version: VERSION,
      decorationShapes: existsSync(join(p.root, 'assets/decorations')) ? readdirSync(join(p.root, 'assets/decorations')).filter((f) => /\.(svg|png)$/i.test(f)).sort() : [],
      typst: (() => { try { return execFileSync(process.env.TYPST_BIN ?? 'typst', ['--version'], { encoding: 'utf8' }).trim(); } catch { return null; } })(),
    });
  });
  r.get('/api/standards/:id', (req, res) => { const s = mods().standards[req.params.id]; if (!s) throw new HttpError(404, 'Standaard niet gevonden'); res.json(s); });

  // ---- clients (opdrachtgevers)
  r.get('/api/clients', (req, res) => res.json(db.prepare('SELECT c.*, (SELECT COUNT(*) FROM engagements e WHERE e.client_id = c.id) AS engagements FROM clients c ORDER BY name').all()));
  r.post('/api/clients', async (req, res) => {
    const b = await req.json();
    if (!b.name) throw new HttpError(400, 'Naam is verplicht');
    let slug = slugify(b.slug || b.name);
    while (db.prepare('SELECT 1 FROM clients WHERE slug = ?').get(slug)) slug += '-2';
    const theme = b.theme || '_default';
    const info = db.prepare('INSERT INTO clients (name, slug, theme, language, risk_model, notes) VALUES (?,?,?,?,?,?)').run(b.name, slug, theme, b.language || 'nl', b.risk_model || 'cvss31', b.notes || '');
    res.json(db.prepare('SELECT * FROM clients WHERE id = ?').get(info.lastInsertRowid), 201);
  });
  r.get('/api/clients/:id', (req, res) => { const c = db.prepare('SELECT * FROM clients WHERE id = ?').get(id(req)); if (!c) throw new HttpError(404, 'Niet gevonden'); res.json(c); });
  r.put('/api/clients/:id', async (req, res) => {
    const b = await req.json();
    db.prepare('UPDATE clients SET name = ?, theme = ?, language = ?, risk_model = ?, notes = ?, updated_at = ? WHERE id = ?').run(b.name, b.theme || '_default', b.language || 'nl', b.risk_model || 'cvss31', b.notes || '', now(), id(req));
    res.json(db.prepare('SELECT * FROM clients WHERE id = ?').get(id(req)));
  });
  r.delete('/api/clients/:id', (req, res) => {
    if ((db.prepare('SELECT COUNT(*) AS n FROM engagements WHERE client_id = ?').get(id(req)) as any).n > 0) throw new HttpError(409, 'Opdrachtgever heeft nog opdrachten');
    db.prepare('DELETE FROM clients WHERE id = ?').run(id(req)); res.json({ ok: true });
  });

  // ---- themes (file based: modules/themes/<slug>/)
  const themeDir = (slug: string) => { if (!/^[a-z0-9_][a-z0-9_-]*$/.test(slug)) throw new HttpError(400, 'Ongeldige thema-id'); return join(p.root, 'modules/themes', slug); };
  r.get('/api/themes', (req, res) => res.json(Object.keys(mods(true).themes).map((slug) => { const y = parseYaml(readFileSync(join(themeDir(slug), 'theme.yaml'), 'utf8')) ?? {}; return { slug, name: y.name ?? slug, provider: y.provider?.name, primary: y.colors?.primary, cover: y.page?.cover }; })));
  r.get('/api/themes/:slug', (req, res) => {
    const dir = themeDir(req.params.slug);
    if (!existsSync(join(dir, 'theme.yaml'))) throw new HttpError(404, 'Thema niet gevonden');
    const yaml = readFileSync(join(dir, 'theme.yaml'), 'utf8');
    let resolved: any = null, warnings: any[] = [];
    try { const rt = resolveTheme(mods(true), req.params.slug); resolved = { colors: rt.theme.colors, fonts: rt.theme.fonts, page: rt.theme.page, provider: rt.theme.provider }; warnings = rt.warnings; } catch (e: any) { warnings = [{ message: e.message }]; }
    const assets = readdirSync(dir).filter((f) => f !== 'theme.yaml' && statSync(join(dir, f)).isFile());
    const fonts = existsSync(join(dir, 'fonts')) ? readdirSync(join(dir, 'fonts')) : [];
    res.json({ slug: req.params.slug, yaml, data: parseYaml(yaml), resolved, warnings, assets, fonts });
  });
  r.put('/api/themes/:slug', async (req, res) => {
    const dir = themeDir(req.params.slug);
    if (req.params.slug === '_default') throw new HttpError(403, 'Het standaardthema is alleen-lezen; maak een eigen thema.');
    const b = await req.json();
    let yamlText: string;
    if (typeof b.yaml === 'string') { try { parseYaml(b.yaml); } catch (e: any) { throw new HttpError(400, 'YAML ongeldig: ' + e.message); } yamlText = b.yaml; }
    else yamlText = toYaml({ id: req.params.slug, ...b.data });
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'theme.yaml'), yamlText);
    modsCache = undefined;
    res.json({ ok: true });
  });
  r.delete('/api/themes/:slug', (req, res) => {
    if (req.params.slug === '_default') throw new HttpError(403, 'Kan standaardthema niet verwijderen');
    if (db.prepare('SELECT 1 FROM clients WHERE theme = ?').get(req.params.slug)) throw new HttpError(409, 'Thema is in gebruik bij een opdrachtgever');
    rmSync(themeDir(req.params.slug), { recursive: true, force: true }); modsCache = undefined; res.json({ ok: true });
  });
  r.post('/api/themes/:slug/assets', async (req, res) => {
    const dir = themeDir(req.params.slug);
    if (req.params.slug === '_default') throw new HttpError(403, 'Standaardthema is alleen-lezen');
    const name = basename(String(req.query.get('name') ?? '')).replace(/[^\w.\-]+/g, '_');
    if (!name) throw new HttpError(400, 'name ontbreekt');
    const body = await req.body();
    const ext = extname(name).toLowerCase();
    const isFont = ['.ttf', '.otf'].includes(ext);
    const target = isFont ? join(dir, 'fonts', name) : join(dir, name);
    mkdirSync(join(dir, 'fonts'), { recursive: true });
    if (!isFont && !['.svg', '.png', '.jpg', '.jpeg'].includes(ext)) throw new HttpError(400, 'Toegestaan: svg, png, jpg, ttf, otf');
    writeFileSync(target, body);
    modsCache = undefined;
    res.json({ ok: true, name, font: isFont });
  });
  r.get('/api/themes/:slug/assets/:name', (req, res) => { const dir = themeDir(req.params.slug); const n = basename(req.params.name); const f = existsSync(join(dir, n)) ? join(dir, n) : join(dir, 'fonts', n); res.file(f); });
  r.delete('/api/themes/:slug/assets/:name', (req, res) => { const dir = themeDir(req.params.slug); const n = basename(req.params.name); for (const f of [join(dir, n), join(dir, 'fonts', n)]) if (existsSync(f)) unlinkSync(f); modsCache = undefined; res.json({ ok: true }); });
  /** Render the bundled example engagement with this theme, for a quick visual check. */
  r.post('/api/themes/:slug/preview', async (req, res) => {
    const slug = req.params.slug; themeDir(slug);
    const b = await req.json().catch(() => ({}));
    const m = mods(true);
    const { loadEngagement } = await import('@reportforge/core');
    const { renderTypst } = await import('@reportforge/render-typst');
    const template = b.template === 'style-gallery' ? 'style-gallery' : undefined;
    const { ctx, diagnostics } = await loadEngagement(m, join(p.root, 'examples/acme-webshop'), { theme: slug, lang: b.language, template });
    const errors = diagnostics.filter((d) => d.level === 'error');
    if (errors.length) return res.json({ error: errors.map((e) => e.message).join('; ') }, 400);
    const out = join(p.renders, '_theme-preview', `${slug}-${b.language ?? ctx.lang}${template ? '-' + template : ''}.pdf`);
    mkdirSync(join(p.renders, '_theme-preview'), { recursive: true });
    try { renderTypst(m, ctx, out); } catch (e: any) { return res.json({ error: e.message }, 400); }
    res.json({ pdf: `/api/file?path=${encodeURIComponent(out)}`, warnings: diagnostics.map((d) => d.message) });
  });

  // ---- engagements
  r.get('/api/engagements', (req, res) => res.json(db.prepare(`SELECT e.id, e.reference, e.title, e.step, e.updated_at, e.created_at, c.name AS client_name, c.id AS client_id,
      json_extract(e.data, '$.client.name') AS end_client, json_extract(e.data, '$.version') AS version, json_extract(e.data, '$.date') AS date,
      (SELECT COUNT(*) FROM findings f WHERE f.engagement_id = e.id) AS findings
      FROM engagements e JOIN clients c ON c.id = e.client_id ORDER BY e.updated_at DESC`).all()));
  r.post('/api/engagements', async (req, res) => {
    const b = await req.json();
    if (!b.client_id || !b.reference || !b.title) throw new HttpError(400, 'client_id, reference en title zijn verplicht');
    if (db.prepare('SELECT 1 FROM engagements WHERE reference = ?').get(b.reference)) throw new HttpError(409, 'Referentie bestaat al');
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(b.client_id) as any;
    if (!client) throw new HttpError(400, 'Opdrachtgever bestaat niet');
    const today = new Date().toISOString().slice(0, 10);
    const data = { language: client.language, risk_model: client.risk_model, template: 'pentest-report', version: '1.0', date: today, classification: client.language === 'en' ? 'Confidential' : 'Vertrouwelijk', client: { name: b.end_client ?? '' }, period: { start: today, end: today }, authors: [], scope: [], standards: ['owasp-top10-2021', 'wstg-4.2', 'cwe'], tools: [], document_history: [], ...(b.data ?? {}) };
    const info = db.prepare('INSERT INTO engagements (client_id, reference, title, data) VALUES (?,?,?,?)').run(b.client_id, b.reference, b.title, JSON.stringify(data));
    res.json(engagementRow(db, Number(info.lastInsertRowid)), 201);
  });
  r.get('/api/engagements/:id', (req, res) => res.json(engagementRow(db, id(req))));
  r.put('/api/engagements/:id', async (req, res) => {
    const b = await req.json();
    const cur = engagementRow(db, id(req));
    const data = { ...cur.data, ...(b.data ?? {}) };
    db.prepare('UPDATE engagements SET title = ?, reference = ?, client_id = ?, step = ?, data = ?, updated_at = ? WHERE id = ?')
      .run(b.title ?? cur.title, b.reference ?? cur.reference, b.client_id ?? cur.client_id, b.step ?? cur.step, JSON.stringify(data), now(), id(req));
    res.json(engagementRow(db, id(req)));
  });
  r.delete('/api/engagements/:id', (req, res) => { db.prepare('DELETE FROM engagements WHERE id = ?').run(id(req)); rmSync(join(p.files, String(id(req))), { recursive: true, force: true }); res.json({ ok: true }); });

  // ---- findings
  r.get('/api/engagements/:id/findings', (req, res) => res.json(db.prepare('SELECT id, position, title, severity, library_id, updated_at, length(markdown) AS size FROM findings WHERE engagement_id = ? ORDER BY position, id').all(id(req))));
  r.post('/api/engagements/:id/findings', async (req, res) => {
    const eid = id(req);
    engagementRow(db, eid);
    const b = await req.json();
    const md = String(b.markdown ?? '');
    const parsed = parseFindings(md);
    // Several findings pasted at once → one row each (split at "## ")
    const chunks = parsed.findings.length > 1 ? splitFindings(md) : [md];
    const maxPos = (db.prepare('SELECT COALESCE(MAX(position), 0) AS m FROM findings WHERE engagement_id = ?').get(eid) as any).m as number;
    const created: any[] = [];
    chunks.forEach((chunk, i) => {
      const meta = findingMeta(chunk);
      const info = db.prepare('INSERT INTO findings (engagement_id, position, markdown, title, severity, library_id) VALUES (?,?,?,?,?,?)').run(eid, maxPos + i + 1, chunk, meta.title, meta.severity, b.library_id ?? null);
      db.prepare('INSERT INTO finding_versions (finding_id, markdown) VALUES (?, ?)').run(info.lastInsertRowid, chunk);
      created.push(db.prepare('SELECT * FROM findings WHERE id = ?').get(info.lastInsertRowid));
    });
    if (b.library_id) db.prepare('UPDATE library SET used_count = used_count + 1 WHERE id = ?').run(b.library_id);
    db.prepare('UPDATE engagements SET updated_at = ? WHERE id = ?').run(now(), eid);
    res.json({ created, diagnostics: parsed.diagnostics }, 201);
  });
  r.get('/api/findings/:id', (req, res) => { const f = db.prepare('SELECT * FROM findings WHERE id = ?').get(id(req)); if (!f) throw new HttpError(404, 'Niet gevonden'); res.json(f); });
  r.put('/api/findings/:id', async (req, res) => {
    const b = await req.json();
    const cur = db.prepare('SELECT * FROM findings WHERE id = ?').get(id(req)) as any;
    if (!cur) throw new HttpError(404, 'Niet gevonden');
    const md = String(b.markdown ?? cur.markdown);
    const meta = findingMeta(md);
    db.prepare('UPDATE findings SET markdown = ?, title = ?, severity = ?, updated_at = ? WHERE id = ?').run(md, meta.title, meta.severity, now(), id(req));
    if (md !== cur.markdown) db.prepare('INSERT INTO finding_versions (finding_id, markdown) VALUES (?, ?)').run(id(req), md);
    db.prepare('UPDATE engagements SET updated_at = ? WHERE id = ?').run(now(), cur.engagement_id);
    res.json({ ...db.prepare('SELECT * FROM findings WHERE id = ?').get(id(req)), diagnostics: meta.diagnostics });
  });
  r.delete('/api/findings/:id', (req, res) => { db.prepare('DELETE FROM findings WHERE id = ?').run(id(req)); res.json({ ok: true }); });
  r.get('/api/findings/:id/versions', (req, res) => res.json(db.prepare('SELECT id, created_at, length(markdown) AS size FROM finding_versions WHERE finding_id = ? ORDER BY id DESC').all(id(req))));
  r.get('/api/findings/:id/versions/:vid', (req, res) => res.json(db.prepare('SELECT * FROM finding_versions WHERE id = ? AND finding_id = ?').get(id(req, 'vid'), id(req))));
  r.post('/api/engagements/:id/findings/reorder', async (req, res) => {
    const { order } = await req.json() as { order: number[] };
    const upd = db.prepare('UPDATE findings SET position = ? WHERE id = ? AND engagement_id = ?');
    order.forEach((fid, i) => upd.run(i + 1, fid, id(req)));
    res.json({ ok: true });
  });
  r.post('/api/findings/:id/to-library', async (req, res) => {
    const f = db.prepare('SELECT * FROM findings WHERE id = ?').get(id(req)) as any;
    if (!f) throw new HttpError(404, 'Niet gevonden');
    const b = await req.json().catch(() => ({}));
    const md = genericise(f.markdown);
    const info = db.prepare('INSERT INTO library (title, language, tags, markdown, severity) VALUES (?,?,?,?,?)').run(f.title, b.language ?? 'nl', b.tags ?? '', md, f.severity);
    res.json(db.prepare('SELECT * FROM library WHERE id = ?').get(info.lastInsertRowid), 201);
  });

  // ---- import tool exports → markdown findings (preview; commit=1 creates them)
  r.post('/api/engagements/:id/import', async (req, res) => {
    const eid = id(req); engagementRow(db, eid);
    importersCache ??= await loadImporters(p.root);
    const imp = importersCache[String(req.query.get('importer') ?? '')];
    if (!imp) throw new HttpError(400, `Onbekende importer; beschikbaar: ${Object.keys(importersCache).join(', ')}`);
    const body = await req.body();
    let result;
    try { result = await imp.importFindings(body, { lang: (req.query.get('lang') as any) ?? 'nl', minSeverity: req.query.get('min_severity') ?? undefined }); }
    catch (e: any) { throw new HttpError(400, e.message); }
    if (req.query.get('commit') === '1') {
      const only = req.query.get('only')?.split(',').map(Number);
      const maxPos = (db.prepare('SELECT COALESCE(MAX(position), 0) AS m FROM findings WHERE engagement_id = ?').get(eid) as any).m as number;
      const created: any[] = [];
      result.findings.forEach((f, i) => {
        if (only && !only.includes(i)) return;
        const info = db.prepare('INSERT INTO findings (engagement_id, position, markdown, title, severity) VALUES (?,?,?,?,?)').run(eid, maxPos + created.length + 1, f.markdown, f.title, f.severity);
        db.prepare('INSERT INTO finding_versions (finding_id, markdown) VALUES (?, ?)').run(info.lastInsertRowid, f.markdown);
        created.push(db.prepare('SELECT id, title, severity FROM findings WHERE id = ?').get(info.lastInsertRowid));
      });
      db.prepare('UPDATE engagements SET updated_at = ? WHERE id = ?').run(now(), eid);
      return res.json({ created, warnings: result.warnings, tool: result.tool }, 201);
    }
    res.json({ findings: result.findings.map((f, i) => ({ index: i, title: f.title, severity: f.severity, affected: f.affected, merged: f.merged, markdown: f.markdown })), warnings: result.warnings, tool: result.tool });
  });

  // ---- parse / assess (editor side panel)
  r.post('/api/parse', async (req, res) => {
    const b = await req.json();
    const r2 = parseFindings(String(b.markdown ?? ''));
    const model = b.risk_model ?? 'cvss31';
    const out = r2.findings.map((f) => {
      let risk: any = null, riskError: string | undefined;
      try { risk = assess(model, { cvss31: f.cvss31, cvss40: f.cvss40, risk: f.risk, severity: f.severity }); } catch (e: any) { riskError = e.message; }
      return { ...f, assessed: risk, riskError };
    });
    res.json({ findings: out, diagnostics: r2.diagnostics });
  });
  r.post('/api/cvss', async (req, res) => {
    const { vector } = await req.json();
    try { res.json(String(vector).startsWith('CVSS:4.0') ? scoreCvss40(vector) : scoreCvss31(vector)); } catch (e: any) { res.json({ error: e.message }, 400); }
  });

  // ---- files (screenshots) per engagement
  r.get('/api/engagements/:id/files', (req, res) => res.json(db.prepare('SELECT * FROM files WHERE engagement_id = ? ORDER BY name').all(id(req))));
  r.post('/api/engagements/:id/files', async (req, res) => {
    const eid = id(req); engagementRow(db, eid);
    let name = basename(String(req.query.get('name') ?? 'image.png')).replace(/[^\w.\-]+/g, '_');
    const body = await req.body();
    if (!body.length) throw new HttpError(400, 'Leeg bestand');
    const dir = join(p.files, String(eid)); mkdirSync(dir, { recursive: true });
    let out = body, mime = 'image/png', width: number | null = null, height: number | null = null;
    if (extname(name).toLowerCase() === '.svg') { mime = 'image/svg+xml'; }
    else {
      try {
        const img = sharp(body, { failOn: 'none' }).rotate();
        const meta = await img.metadata();
        const keepJpeg = meta.format === 'jpeg';
        const resized = (meta.width ?? 0) > 2400 ? img.resize({ width: 2400 }) : img;
        out = keepJpeg ? await resized.jpeg({ quality: 88 }).toBuffer() : await resized.png({ compressionLevel: 8 }).toBuffer();
        name = name.replace(/\.[^.]+$/, '') + (keepJpeg ? '.jpg' : '.png');
        const m2 = await sharp(out).metadata(); width = m2.width ?? null; height = m2.height ?? null; mime = keepJpeg ? 'image/jpeg' : 'image/png';
      } catch (e: any) { throw new HttpError(400, 'Geen geldige afbeelding: ' + e.message); }
    }
    while (existsSync(join(dir, name)) && req.query.get('overwrite') !== '1') name = name.replace(/(\.\w+)$/, '-2$1');
    writeFileSync(join(dir, name), out);
    db.prepare('INSERT INTO files (engagement_id, name, mime, bytes, width, height) VALUES (?,?,?,?,?,?) ON CONFLICT(engagement_id, name) DO UPDATE SET mime = excluded.mime, bytes = excluded.bytes, width = excluded.width, height = excluded.height').run(eid, name, mime, out.length, width, height);
    res.json({ name, mime, bytes: out.length, width, height, markdown: `![](../images/${name})` }, 201);
  });
  r.get('/api/engagements/:id/files/:name', (req, res) => res.file(join(p.files, String(id(req)), basename(req.params.name))));
  r.delete('/api/engagements/:id/files/:name', (req, res) => { const f = join(p.files, String(id(req)), basename(req.params.name)); if (existsSync(f)) unlinkSync(f); db.prepare('DELETE FROM files WHERE engagement_id = ? AND name = ?').run(id(req), basename(req.params.name)); res.json({ ok: true }); });

  // ---- render / preview / export
  r.post('/api/engagements/:id/render', async (req, res) => {
    const b = await req.json().catch(() => ({}));
    const out = await renderEngagement(db, p, id(req), { formats: b.formats, language: b.language, theme: b.theme, template: b.template, mods: mods(true) });
    res.json({ ...out, pdf: out.pdf ? `/api/file?path=${encodeURIComponent(out.pdf)}` : undefined, docx: out.docx ? `/api/file?path=${encodeURIComponent(out.docx)}` : undefined });
  });
  r.get('/api/engagements/:id/renders', (req, res) => res.json((db.prepare('SELECT * FROM renders WHERE engagement_id = ? ORDER BY id DESC LIMIT 60').all(id(req)) as any[]).map((x) => ({ ...x, diagnostics: JSON.parse(x.diagnostics), pdf: x.pdf ? `/api/file?path=${encodeURIComponent(x.pdf)}` : null, docx: x.docx ? `/api/file?path=${encodeURIComponent(x.docx)}` : null }))));
  r.post('/api/engagements/:id/preview', async (req, res) => {
    const b = await req.json();
    const out = await previewFinding(db, p, id(req), String(b.markdown ?? ''), { language: b.language, theme: b.theme });
    res.json({ pdf: out.pdf ? `/api/file?path=${encodeURIComponent(out.pdf)}&t=${Date.now()}` : undefined, diagnostics: out.diagnostics });
  });
  r.get('/api/engagements/:id/export', (req, res) => {
    const dir = materialize(db, p, id(req));
    const tar = join(p.renders, String(id(req)), 'export.tar');
    mkdirSync(join(p.renders, String(id(req))), { recursive: true });
    execFileSync('tar', ['-cf', tar, '-C', join(dir, '..'), basename(dir)]);
    res.file(tar, `${basename(dir)}.tar`);
  });
  r.get('/api/file', (req, res) => {
    const path = String(req.query.get('path') ?? '');
    if (!path.startsWith(p.renders) || path.includes('..')) throw new HttpError(403, 'Pad niet toegestaan');
    res.header('Content-Disposition', req.query.get('download') ? `attachment; filename="${basename(path)}"` : `inline; filename="${basename(path)}"`).file(path);
  });


  // Bundled library (modules/library/<lang>/*.md): seeded once on first start, re-runnable from the UI (skips existing titles).
  const seedLibrary = (languages?: string[]) => {
    const existing = new Set((db.prepare('SELECT lower(title) AS t, language AS l FROM library').all() as any[]).map((r) => `${r.l}:${r.t}`));
    const ins = db.prepare('INSERT INTO library (title, language, tags, markdown, severity) VALUES (?,?,?,?,?)');
    let added = 0, skipped = 0, errors = 0;
    for (const lang of languages ?? libraryLanguages(p.root)) {
      for (const e of loadLibrary(p.root, lang)) {
        if (e.diagnostics.some((d) => d.level === 'error')) { errors++; continue; }
        if (existing.has(`${lang}:${e.title.toLowerCase()}`)) { skipped++; continue; }
        ins.run(e.title, lang, e.tags, e.markdown, e.severity); added++;
      }
    }
    return { added, skipped, errors };
  };
  if (!setting(db, 'library_seeded')) {
    const r = seedLibrary();
    setSetting(db, 'library_seeded', now());
    if (r.added) console.log(`bibliotheek: ${r.added} standaardbevindingen geladen`);
  }

  // ---- palettes (colour combinations a theme can adopt)
  r.get('/api/palettes', (req, res) => res.json(loadPalettes(p.root).map((pal) => ({ ...pal, combinations: pal.combinations.map((c) => ({ ...c, theme: c.roles ? paletteToThemeColors(c) : undefined })) }))));

  // ---- library
  r.post('/api/library/seed', async (req, res) => { const b = await req.json().catch(() => ({})); res.json(seedLibrary(b.languages)); });
  r.get('/api/library/bundled', (req, res) => res.json(libraryLanguages(p.root).map((l) => ({ language: l, count: loadLibrary(p.root, l).length }))));
  r.get('/api/library', (req, res) => {
    const q = `%${String(req.query.get('q') ?? '').trim()}%`;
    res.json(db.prepare('SELECT id, title, language, tags, severity, used_count, updated_at FROM library WHERE title LIKE ? OR tags LIKE ? OR markdown LIKE ? ORDER BY used_count DESC, title LIMIT 200').all(q, q, q));
  });
  r.post('/api/library', async (req, res) => {
    const b = await req.json();
    const meta = findingMeta(String(b.markdown ?? ''));
    const info = db.prepare('INSERT INTO library (title, language, tags, markdown, severity) VALUES (?,?,?,?,?)').run(b.title || meta.title, b.language ?? 'nl', b.tags ?? '', b.markdown, meta.severity);
    res.json(db.prepare('SELECT * FROM library WHERE id = ?').get(info.lastInsertRowid), 201);
  });
  r.get('/api/library/:id', (req, res) => { const l = db.prepare('SELECT * FROM library WHERE id = ?').get(id(req)); if (!l) throw new HttpError(404, 'Niet gevonden'); res.json(l); });
  r.put('/api/library/:id', async (req, res) => {
    const b = await req.json();
    const meta = findingMeta(String(b.markdown ?? ''));
    db.prepare('UPDATE library SET title = ?, language = ?, tags = ?, markdown = ?, severity = ?, updated_at = ? WHERE id = ?').run(b.title || meta.title, b.language ?? 'nl', b.tags ?? '', b.markdown, meta.severity, now(), id(req));
    res.json(db.prepare('SELECT * FROM library WHERE id = ?').get(id(req)));
  });
  r.delete('/api/library/:id', (req, res) => { db.prepare('DELETE FROM library WHERE id = ?').run(id(req)); res.json({ ok: true }); });

  registerProcess(r, db, p);
  return r;
}

/** Splits a multi-finding markdown document at "## " headings (fence-aware). */
export function splitFindings(md: string): string[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let cur: string[] = [];
  let inFence = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (!inFence && /^##\s+\S/.test(line) && cur.some((l) => l.trim())) { out.push(cur.join('\n').trim() + '\n'); cur = []; }
    cur.push(line);
  }
  if (cur.some((l) => l.trim())) out.push(cur.join('\n').trim() + '\n');
  return out;
}

/** Strip engagement-specific parts (affected list, evidence images) so a finding can be reused. */
function genericise(md: string): string {
  return md
    .replace(/(\*\*Affected\*\*:\s*\n\n)(?:- .*\n?)+/i, '$1- \n')
    .replace(/!\[[^\]]*\]\([^)]+\)\n?/g, '')
    .replace(/(\*\*Status\*\*:\s*)[^·\n]+/i, '$1Confirmed')
    .replace(/(\*\*Retest\*\*:\s*)[^·\n]+·?\s*/i, '');
}
