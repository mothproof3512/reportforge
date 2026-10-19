import { useEffect, useState } from 'react';
import { api, FINDING_TEMPLATE, type LibraryRow } from '../api';
import { Field, Sev, confirmDialog, relTime, useToast } from '../ui';

export function Library() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<LibraryRow[]>([]);
  const [cur, setCur] = useState<LibraryRow | null>(null);
  const [dirty, setDirty] = useState(false);
  const toast = useToast();
  const load = () => api.get<LibraryRow[]>(`/api/library?q=${encodeURIComponent(q)}`).then(setRows);
  useEffect(() => { const h = setTimeout(load, 200); return () => clearTimeout(h); }, [q]);
  const open = (id: number) => { if (dirty && !confirmDialog('Wijzigingen weggooien?')) return; api.get<LibraryRow>(`/api/library/${id}`).then((r) => { setCur(r); setDirty(false); }); };
  const save = async () => {
    try { const r = cur!.id ? await api.put(`/api/library/${cur!.id}`, cur) : await api.post('/api/library', cur); setCur(r); setDirty(false); load(); toast('Opgeslagen'); } catch (e: any) { toast(e.message, true); }
  };
  return (
    <div className="page wide" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 22 }}>
      <div>
        <div className="page-head"><div><h1>Bibliotheek</h1><div className="sub">Herbruikbare bevindingen, tweetalig.</div></div></div>
        <div className="actions" style={{ marginBottom: 10 }}><input type="text" placeholder="Zoeken…" value={q} onChange={(e) => setQ(e.target.value)} /><button className="btn primary" onClick={() => { setCur({ id: 0, title: '', language: 'nl', tags: '', severity: '', used_count: 0, updated_at: '', markdown: FINDING_TEMPLATE }); setDirty(true); }}>Nieuw</button></div>
        <div className="panel tight" style={{ padding: 0 }}>{rows.map((r) => <div key={r.id} className={'fitem' + (cur?.id === r.id ? ' active' : '')} onClick={() => open(r.id)}><div><div className="t">{r.title}</div><div className="muted small">{r.language} · {r.tags || '—'} · {r.used_count}× · {relTime(r.updated_at)}</div></div><Sev s={r.severity} /></div>)}{rows.length === 0 && <div className="empty" style={{ border: 0 }}>Nog leeg. Sla een bevinding op vanuit een opdracht (knop "→ Bibliotheek") of maak er hier een.</div>}</div>
      </div>
      <div>
        {cur ? <>
          <div className="actions" style={{ marginBottom: 12, marginTop: 30 }}><button className="btn primary" onClick={save} disabled={!dirty}>Opslaan</button>{cur.id > 0 && <button className="btn ghost danger" onClick={async () => { if (confirmDialog('Verwijderen uit bibliotheek?')) { await api.del(`/api/library/${cur.id}`); setCur(null); load(); } }}>Verwijderen</button>}</div>
          <div className="grid3">
            <Field label="Titel (wordt uit de markdown gehaald als leeg)"><input type="text" value={cur.title} onChange={(e) => { setCur({ ...cur, title: e.target.value }); setDirty(true); }} /></Field>
            <Field label="Taal"><select value={cur.language} onChange={(e) => { setCur({ ...cur, language: e.target.value }); setDirty(true); }}><option value="nl">nl</option><option value="en">en</option></select></Field>
            <Field label="Tags (komma-gescheiden)"><input type="text" value={cur.tags} onChange={(e) => { setCur({ ...cur, tags: e.target.value }); setDirty(true); }} /></Field>
          </div>
          <textarea className="mono" rows={28} value={cur.markdown ?? ''} onChange={(e) => { setCur({ ...cur, markdown: e.target.value }); setDirty(true); }} spellCheck={false} />
        </> : <div className="empty" style={{ marginTop: 30 }}>Kies links een bevinding.</div>}
      </div>
    </div>
  );
}
