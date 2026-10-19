/**
 * API smoke test: starts the web server on a scratch data dir, creates a client,
 * an engagement, uploads findings + screenshots, renders PDF+DOCX, uses the library.
 *   npm run test:e2e
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = 3000 + Math.floor(Math.random() * 2000);
const DATA = mkdtempSync(join(tmpdir(), 'rf-smoke-'));
const BASE = `http://127.0.0.1:${PORT}`;
let cookie = '';

async function api(method: string, path: string, body?: any, raw?: Buffer, headers: Record<string, string> = {}) {
  const res = await fetch(BASE + path, { method, headers: { ...(raw ? {} : { 'content-type': 'application/json' }), cookie, ...headers }, body: (raw ? new Uint8Array(raw) : body ? JSON.stringify(body) : undefined) as any });
  const sc = res.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
  const ct = res.headers.get('content-type') ?? '';
  const data = ct.includes('json') ? await res.json() : await res.arrayBuffer();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  return data as any;
}

const server = spawn(process.execPath, ['--import', 'tsx', 'apps/web/server/index.ts'], { cwd: ROOT, env: { ...process.env, RF_DATA: DATA, RF_PORT: String(PORT), RF_HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'] });
server.stderr.on('data', (d) => { const s = String(d); if (!s.includes('ExperimentalWarning') && !s.includes('trace-warnings')) process.stderr.write(s); });

async function main() {
  for (let i = 0; i < 50; i++) { try { await fetch(BASE + '/api/auth/status'); break; } catch { await new Promise((r) => setTimeout(r, 200)); } }
  const t0 = Date.now();
  assert.equal((await api('GET', '/api/auth/status')).configured, false);
  await api('POST', '/api/auth/setup', { password: 'smoke-test-password' });
  await api('POST', '/api/auth/logout');
  cookie = '';
  await assert.rejects(api('GET', '/api/meta'), /401/);
  await api('POST', '/api/auth/login', { password: 'smoke-test-password' });
  const meta = await api('GET', '/api/meta');
  assert.ok(meta.themes.length >= 2 && meta.standards.length >= 8);

  const client = await api('POST', '/api/clients', { name: 'Northwind Assurance', theme: 'example-client', language: 'nl' });
  const ex = join(ROOT, 'examples/acme-webshop');
  const eng = await api('POST', '/api/engagements', { client_id: client.id, reference: 'SMOKE-001', title: 'Smoke test', end_client: 'Voorbeeldwebshop B.V.' });
  const { parse } = await import('yaml');
  const y = parse(readFileSync(join(ex, 'engagement.yaml'), 'utf8'));
  y.executive_summary = readFileSync(join(ex, 'summary.md'), 'utf8'); y.conclusion = readFileSync(join(ex, 'conclusion.md'), 'utf8');
  delete y.reference; delete y.title; delete y.theme;
  await api('PUT', `/api/engagements/${eng.id}`, { data: y, step: 3 });

  // screenshots
  for (const f of readdirSync(join(ex, 'images'))) await api('POST', `/api/engagements/${eng.id}/files?name=${f}`, undefined, readFileSync(join(ex, 'images', f)), { 'content-type': 'application/octet-stream' });
  assert.equal((await api('GET', `/api/engagements/${eng.id}/files`)).length, 3);
  // findings: one file with five findings → five rows
  const multi = readFileSync(join(ex, 'findings/04-medium-low.md'), 'utf8');
  const created = await api('POST', `/api/engagements/${eng.id}/findings`, { markdown: multi });
  assert.equal(created.created.length, 5);
  for (const f of ['01-idor-orders.md', '02-sqli-search.md', '03-infra.md']) await api('POST', `/api/engagements/${eng.id}/findings`, { markdown: readFileSync(join(ex, 'findings', f), 'utf8') });
  const list = await api('GET', `/api/engagements/${eng.id}/findings`);
  assert.equal(list.length, 8);
  // edit + versions
  const first = await api('GET', `/api/findings/${list[0].id}`);
  const upd = await api('PUT', `/api/findings/${list[0].id}`, { markdown: first.markdown + '\n\nExtra regel.\n' });
  assert.ok(upd.markdown.endsWith('Extra regel.\n'));
  assert.equal((await api('GET', `/api/findings/${list[0].id}/versions`)).length, 2);
  // parse/assess
  const parsed = await api('POST', '/api/parse', { markdown: first.markdown, risk_model: 'cvss31' });
  assert.ok(parsed.findings[0].assessed.score > 0);
  // preview
  const pv = await api('POST', `/api/engagements/${eng.id}/preview`, { markdown: first.markdown });
  assert.ok(pv.pdf, 'preview pdf');
  // render
  const r = await api('POST', `/api/engagements/${eng.id}/render`, { formats: ['pdf', 'docx'] });
  assert.ok(r.ok, 'render ok: ' + JSON.stringify(r.diagnostics.filter((d: any) => d.level === 'error')));
  const pdf = await api('GET', r.pdf);
  assert.ok(pdf.byteLength > 50000, 'pdf size');
  const docx = await api('GET', r.docx);
  assert.ok(docx.byteLength > 20000, 'docx size');
  assert.equal((await api('GET', `/api/engagements/${eng.id}/renders`)).length, 1);
  // english render with default theme
  const r2 = await api('POST', `/api/engagements/${eng.id}/render`, { formats: ['pdf'], language: 'en', theme: '_default' });
  assert.ok(r2.ok);
  // library
  const lib = await api('POST', `/api/findings/${list[1].id}/to-library`, { tags: 'web,xss' });
  assert.ok(!lib.markdown.includes('](../images/'), 'images stripped');
  assert.equal((await api('GET', '/api/library?q=xss')).length, 1);
  const fromLib = await api('POST', `/api/engagements/${eng.id}/findings`, { markdown: lib.markdown, library_id: lib.id });
  assert.equal(fromLib.created.length, 1);
  assert.equal((await api('GET', `/api/library/${lib.id}`)).used_count, 1);
  // theme preview + export
  const tp = await api('POST', '/api/themes/example-client/preview', { language: 'en' });
  assert.ok(tp.pdf);
  const tar = await api('GET', `/api/engagements/${eng.id}/export`);
  assert.ok(tar.byteLength > 1000);
  // delete cascade
  await api('DELETE', `/api/engagements/${eng.id}`);
  assert.equal((await api('GET', '/api/engagements')).length, 0);
  console.log(`✔ smoke test geslaagd in ${Date.now() - t0} ms`);
}

main().then(() => { server.kill(); rmSync(DATA, { recursive: true, force: true }); process.exit(0); }).catch((e) => { console.error('✖', e.message); server.kill(); process.exit(1); });
