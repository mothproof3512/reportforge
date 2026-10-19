import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { SEVERITY_LABEL, type Diagnostic } from './api';

// ---- toast
type Toast = { id: number; text: string; error?: boolean };
const ToastCtx = createContext<(text: string, error?: boolean) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (text: string, error = false) => { const id = Date.now() + Math.random(); setToasts((t) => [...t, { id, text, error }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), error ? 7000 : 3500); };
  return <ToastCtx.Provider value={push}>{children}{toasts.map((t, i) => <div key={t.id} className={'toast' + (t.error ? ' error' : '')} style={{ bottom: 18 + i * 52 }}>{t.text}</div>)}</ToastCtx.Provider>;
}

// ---- routing (hash based, no dependency)
export function useHash(): string {
  const [h, setH] = useState(location.hash.slice(1) || '/');
  useEffect(() => { const f = () => setH(location.hash.slice(1) || '/'); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return h;
}
export const go = (path: string) => { location.hash = path; };

// ---- primitives
export const Sev = ({ s }: { s: string }) => <span className={'sev sev-' + (s || '')}>{SEVERITY_LABEL[s] ?? (s || '—')}</span>;

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}{hint && <div className="hint">{hint}</div>}</label>;
}

export function Diagnostics({ items, emptyText }: { items: Diagnostic[]; emptyText?: string }) {
  if (!items.length) return emptyText ? <p className="muted small">{emptyText}</p> : null;
  const sorted = [...items].sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1));
  return <ul className="diag">{sorted.map((d, i) => <li key={i} className={d.level}>{d.message}{(d.line || d.finding) && <div className="loc">{d.finding ? d.finding.slice(0, 60) : d.file ? d.file.split('/').slice(-2).join('/') + (d.line ? `:${d.line}` : '') : ''}</div>}</li>)}</ul>;
}

export function Modal({ open, title, onClose, children, width }: { open: boolean; title: string; onClose: () => void; children: ReactNode; width?: number }) {
  if (!open) return null;
  return (
    <dialog open style={{ position: 'fixed', top: '12vh', left: '50%', transform: 'translateX(-50%)', width, zIndex: 40, margin: 0 }} onClose={onClose}>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,37,69,.35)', zIndex: -1 }} onClick={onClose} />
      <div className="page-head" style={{ marginBottom: 12 }}><h1 style={{ fontSize: 16 }}>{title}</h1><button className="btn ghost small" onClick={onClose}>Sluiten</button></div>
      {children}
    </dialog>
  );
}

export function confirmDialog(text: string): boolean { return window.confirm(text); }

/** Small editable table for lists of objects (scope, tools, authors, history). */
export function SubTable<T extends Record<string, any>>({ rows, onChange, columns, blank }: { rows: T[]; onChange: (rows: T[]) => void; columns: Array<{ key: keyof T & string; label: string; width?: string; type?: 'text' | 'date' | 'select'; options?: string[] }>; blank: () => T }) {
  const set = (i: number, k: string, v: string) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div>
      <table className="subtable">
        <thead><tr>{columns.map((c) => <th key={c.key} className="field-label" style={{ width: c.width, display: "table-cell", textAlign: "left" }}>{c.label}</th>)}<th className="rm" /></tr></thead>
        <tbody>
          {rows.map((r, i) => <tr key={i}>
            {columns.map((c) => <td key={c.key}>{c.type === 'select' ? <select value={r[c.key] ?? ''} onChange={(e) => set(i, c.key, e.target.value)}><option value="">—</option>{c.options?.map((o) => <option key={o}>{o}</option>)}</select> : <input type={c.type ?? 'text'} value={r[c.key] ?? ''} onChange={(e) => set(i, c.key, e.target.value)} />}</td>)}
            <td className="rm"><button className="btn ghost small" title="Verwijderen" onClick={() => onChange(rows.filter((_, j) => j !== i))}>×</button></td>
          </tr>)}
        </tbody>
      </table>
      <button className="btn small" onClick={() => onChange([...rows, blank()])}>+ Regel</button>
    </div>
  );
}

export function LinesEditor({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return <textarea value={(value ?? []).join('\n')} placeholder={placeholder} onChange={(e) => onChange(e.target.value.split('\n'))} onBlur={(e) => onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))} />;
}

export const relTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T') + (iso.endsWith('Z') ? '' : 'Z'));
  const m = (Date.now() - d.getTime()) / 60000;
  if (m < 1) return 'zojuist'; if (m < 60) return `${Math.round(m)} min geleden`; if (m < 36 * 60) return `${Math.round(m / 60)} uur geleden`;
  return d.toLocaleDateString('nl-NL');
};
