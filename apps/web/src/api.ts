export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }

async function call<T = any>(method: string, path: string, body?: unknown, raw?: Blob | ArrayBuffer): Promise<T> {
  const res = await fetch(path, { method, headers: raw ? { 'content-type': 'application/octet-stream' } : body !== undefined ? { 'content-type': 'application/json' } : {}, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  const ct = res.headers.get('content-type') ?? '';
  const data = ct.includes('json') ? await res.json() : await res.text();
  if (res.status === 401 && !path.startsWith('/api/auth/')) { window.dispatchEvent(new Event('rf:unauthenticated')); }
  if (!res.ok) throw new ApiError(res.status, (data && data.error) || `${method} ${path} → ${res.status}`);
  return data as T;
}
export const api = {
  get: <T = any>(p: string) => call<T>('GET', p),
  post: <T = any>(p: string, b?: unknown) => call<T>('POST', p, b),
  put: <T = any>(p: string, b?: unknown) => call<T>('PUT', p, b),
  del: <T = any>(p: string) => call<T>('DELETE', p),
  upload: <T = any>(p: string, file: Blob) => call<T>('POST', p, undefined, file),
};

export interface Meta { themes: Array<{ slug: string; name: string; provider?: string; primary?: string }>; standards: Array<{ id: string; name: string; short: string; version?: string; kind: string; items: number }>; templates: Array<{ id: string; name: string; document: string; blocks: string[] }>; blocks: any[]; riskModels: Array<{ id: string; name: string }>; languages: string[]; steps: string[]; typst: string | null }
export interface Client { id: number; name: string; slug: string; theme: string; language: string; risk_model: string; notes: string; engagements?: number }
export interface EngagementRow { id: number; reference: string; title: string; step: number; client_name: string; client_id: number; end_client: string; version: string; date: string; findings: number; updated_at: string }
export interface Engagement { id: number; client_id: number; reference: string; title: string; step: number; data: any; client_slug: string; client_theme: string; client_language: string; client_risk_model: string; client_name: string; updated_at: string }
export interface FindingRow { id: number; position: number; title: string; severity: string; library_id: number | null; updated_at: string; size: number }
export interface Diagnostic { level: 'error' | 'warning'; message: string; line?: number; file?: string; finding?: string }
export interface LibraryRow { id: number; title: string; language: string; tags: string; severity: string; used_count: number; updated_at: string; markdown?: string }

export const SEVERITY_LABEL: Record<string, string> = { critical: 'Kritiek', high: 'Hoog', medium: 'Middel', low: 'Laag', info: 'Info' };
export const fmtDate = (s?: string) => (s ? s.slice(0, 10) : '');
export const FINDING_TEMPLATE = `## Titel van de bevinding

**Severity**: Medium · **CVSS 3.1**: 5.3 (\`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N\`) · **Status**: Confirmed · **Source**: Burp Suite · **Mapping**: A05:2021, WSTG-CONF-01 · **CWE**: 16

**Affected**:

- https://example.com/

### Description

Wat er mis is en waar.

### Impact

Wat een aanvaller ermee kan.

### Evidence

\`\`\`
$ commando
output
\`\`\`

### Recommendation

Hoe het op te lossen.

### References

- https://
`;
