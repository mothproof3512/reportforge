/**
 * Reportforge web server.
 *   RF_DATA   data directory (default <repo>/data)
 *   RF_PORT   default 3000
 *   RF_HOST   default 0.0.0.0
 */
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { openDb } from './db.ts';
import { buildApi, validToken } from './api.ts';
import { paths } from './materialize.ts';
import { listen, serveStatic, HttpError } from './http.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const DATA = resolve(process.env.RF_DATA ?? join(ROOT, 'data'));
const PORT = Number(process.env.RF_PORT ?? 3000);
const HOST = process.env.RF_HOST ?? '0.0.0.0';
const DIST = join(ROOT, 'apps/web/dist');

const db = openDb(join(DATA, 'reportforge.sqlite'));
const p = paths(ROOT, DATA);
const api = buildApi(db, p);

const PUBLIC = new Set(['/api/auth/status', '/api/auth/login', '/api/auth/setup']);

listen(PORT, HOST, async (req, res) => {
  if (req.path.startsWith('/api/')) {
    const m = api.match(req.method, req.path);
    if (!m) throw new HttpError(404, `Onbekende route ${req.method} ${req.path}`);
    if (!PUBLIC.has(req.path)) {
      if (!validToken(db, req.cookies.rf_session)) throw new HttpError(401, 'Niet ingelogd');
    }
    req.params = m.params;
    await m.h(req, res);
    return;
  }
  if (!existsSync(DIST)) { res.text('apps/web/dist ontbreekt — draai `npm run web:build`', 503); return; }
  if (!serveStatic(DIST, req, res)) res.text('Niet gevonden', 404);
});

console.log(`Reportforge draait op http://${HOST}:${PORT}  (data: ${DATA})`);
