/** Tiny HTTP toolkit on node:http: router, JSON, cookies, static files. No framework. */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';

export interface Req { raw: IncomingMessage; method: string; path: string; query: URLSearchParams; params: Record<string, string>; cookies: Record<string, string>; body: () => Promise<Buffer>; json: <T = any>() => Promise<T>; session?: any }
export interface Res { raw: ServerResponse; json: (data: unknown, status?: number) => void; text: (s: string, status?: number, type?: string) => void; file: (path: string, download?: string) => void; status: (code: number) => Res; header: (k: string, v: string) => Res; cookie: (name: string, value: string, opts?: { maxAge?: number; httpOnly?: boolean; path?: string }) => Res; end: () => void }
export type Handler = (req: Req, res: Res) => Promise<void> | void;
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }

const MIME: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.ico': 'image/x-icon', '.webp': 'image/webp', '.tar': 'application/x-tar', '.yaml': 'text/yaml; charset=utf-8', '.md': 'text/markdown; charset=utf-8' };

export class Router {
  private routes: Array<{ method: string; re: RegExp; keys: string[]; h: Handler }> = [];
  add(method: string, pattern: string, h: Handler) {
    const keys: string[] = [];
    const re = new RegExp('^' + pattern.replace(/\/:(\w+)/g, (_, k) => { keys.push(k); return '/([^/]+)'; }) + '/?$');
    this.routes.push({ method, re, keys, h });
    return this;
  }
  get(p: string, h: Handler) { return this.add('GET', p, h); }
  post(p: string, h: Handler) { return this.add('POST', p, h); }
  put(p: string, h: Handler) { return this.add('PUT', p, h); }
  delete(p: string, h: Handler) { return this.add('DELETE', p, h); }
  match(method: string, path: string) {
    for (const r of this.routes) {
      if (r.method !== method) continue;
      const m = path.match(r.re);
      if (m) return { h: r.h, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
    }
    return undefined;
  }
}

function parseCookies(h: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (h ?? '').split(';')) { const i = part.indexOf('='); if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); }
  return out;
}

export function wrap(raw: IncomingMessage, rawRes: ServerResponse): { req: Req; res: Res } {
  const url = new URL(raw.url ?? '/', 'http://local');
  let bodyP: Promise<Buffer> | undefined;
  const req: Req = {
    raw, method: raw.method ?? 'GET', path: url.pathname, query: url.searchParams, params: {}, cookies: parseCookies(raw.headers.cookie),
    body: () => bodyP ??= new Promise((resolve, reject) => { const chunks: Buffer[] = []; let size = 0; raw.on('data', (c) => { size += c.length; if (size > 200 * 1024 * 1024) { reject(new HttpError(413, 'Body te groot')); raw.destroy(); } chunks.push(c); }); raw.on('end', () => resolve(Buffer.concat(chunks))); raw.on('error', reject); }),
    json: async () => { const b = await req.body(); if (!b.length) return {} as any; try { return JSON.parse(b.toString('utf8')); } catch { throw new HttpError(400, 'Ongeldige JSON'); } },
  };
  const headers: Record<string, string> = {};
  const cookies: string[] = [];
  let status = 200;
  const send = (body: Buffer | string, type: string) => { if (cookies.length) rawRes.setHeader('Set-Cookie', cookies); for (const [k, v] of Object.entries(headers)) rawRes.setHeader(k, v); rawRes.writeHead(status, { 'Content-Type': type, 'Content-Length': Buffer.byteLength(body) }); rawRes.end(body); };
  const res: Res = {
    raw: rawRes,
    status: (c) => { status = c; return res; },
    header: (k, v) => { headers[k] = v; return res; },
    cookie: (name, value, o = {}) => { cookies.push(`${name}=${encodeURIComponent(value)}; Path=${o.path ?? '/'}; SameSite=Lax${o.httpOnly !== false ? '; HttpOnly' : ''}${o.maxAge !== undefined ? `; Max-Age=${o.maxAge}` : ''}`); return res; },
    json: (data, s) => { if (s) status = s; send(JSON.stringify(data), 'application/json; charset=utf-8'); },
    text: (s, st, type) => { if (st) status = st; send(s, type ?? 'text/plain; charset=utf-8'); },
    end: () => { rawRes.writeHead(status, headers); rawRes.end(); },
    file: (path, download) => {
      if (!existsSync(path) || !statSync(path).isFile()) { status = 404; send('Niet gevonden', 'text/plain'); return; }
      const st = statSync(path);
      const h: Record<string, string> = { 'Content-Type': MIME[extname(path).toLowerCase()] ?? 'application/octet-stream', 'Content-Length': String(st.size), 'Cache-Control': 'no-store', ...headers };
      if (download) h['Content-Disposition'] = `attachment; filename="${download.replace(/[^\w.\- ]+/g, '_')}"`;
      rawRes.writeHead(status, h);
      createReadStream(path).pipe(rawRes);
    },
  };
  return { req, res };
}

export function serveStatic(root: string, req: Req, res: Res, spaIndex = 'index.html'): boolean {
  const rel = normalize(decodeURIComponent(req.path)).replace(/^(\.\.[/\\])+/, '');
  let file = join(root, rel);
  if (!file.startsWith(root)) return false;
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) {
    if (extname(rel)) return false;
    file = join(root, spaIndex);
    if (!existsSync(file)) return false;
  }
  res.file(file);
  return true;
}

export function listen(port: number, host: string, handler: (req: Req, res: Res) => Promise<void>) {
  const server = createServer(async (raw, rawRes) => {
    const { req, res } = wrap(raw, rawRes);
    try { await handler(req, res); }
    catch (e: any) {
      const status = e instanceof HttpError ? e.status : 500;
      if (status === 500) console.error(e);
      if (!rawRes.headersSent) res.json({ error: e.message ?? String(e) }, status);
    }
  });
  server.listen(port, host);
  return server;
}
