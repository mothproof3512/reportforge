import { useEffect, useState } from 'react';
import { api, type Client, type EngagementRow, type Meta } from '../api';
import { Field, Modal, go, relTime, useToast } from '../ui';

export function Engagements({ meta }: { meta: Meta }) {
  const [rows, setRows] = useState<EngagementRow[] | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ client_id: 0, reference: '', title: '', end_client: '' });
  const toast = useToast();
  const load = () => api.get<EngagementRow[]>('/api/engagements').then(setRows).catch((e) => toast(e.message, true));
  useEffect(() => { load(); api.get<Client[]>('/api/clients').then((c) => { setClients(c); if (c.length && !form.client_id) setForm((f) => ({ ...f, client_id: c[0].id })); }); }, []);

  const create = async () => {
    try { const e = await api.post('/api/engagements', form); setOpen(false); go(`/engagements/${e.id}/overview`); } catch (e: any) { toast(e.message, true); }
  };
  const suggestRef = () => { const y = new Date().getFullYear(); const n = (rows?.filter((r) => r.reference.startsWith(`PT-${y}-`)).length ?? 0) + 1; return `PT-${y}-${String(n).padStart(3, '0')}`; };

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Opdrachten</h1><div className="sub">Elke opdracht doorloopt de negen stappen van intake tot opgeleverde hertest.</div></div>
        <div className="actions"><button className="btn primary" onClick={() => { if (!clients.length) return toast('Maak eerst een opdrachtgever aan.', true); setForm((f) => ({ ...f, reference: suggestRef() })); setOpen(true); }}>Nieuwe opdracht</button></div>
      </div>
      {rows === null ? null : rows.length === 0 ? <div className="empty">Nog geen opdrachten. Maak een opdrachtgever aan (met huisstijl) en start dan je eerste opdracht.</div> : (
        <table className="list">
          <thead><tr><th>Referentie</th><th>Titel</th><th>Eindklant</th><th>Opdrachtgever</th><th>Stap</th><th className="num">Bevindingen</th><th>Bijgewerkt</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id} className="row-link" onClick={() => go(`/engagements/${r.id}/overview`)}>
            <td className="mono">{r.reference}</td><td>{r.title}<div className="muted small">v{r.version} · {r.date}</div></td><td>{r.end_client}</td><td>{r.client_name}</td>
            <td><span className="muted">{r.step}.</span> {meta.steps[r.step - 1]}</td><td className="num">{r.findings}</td><td className="muted">{relTime(r.updated_at)}</td>
          </tr>)}</tbody>
        </table>
      )}
      <Modal open={open} title="Nieuwe opdracht" onClose={() => setOpen(false)}>
        <Field label="Opdrachtgever (huisstijl)"><select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: Number(e.target.value) })}>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <div className="grid2">
          <Field label="Referentie"><input type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></Field>
          <Field label="Eindklant"><input type="text" value={form.end_client} onChange={(e) => setForm({ ...form, end_client: e.target.value })} placeholder="De organisatie die getest wordt" /></Field>
        </div>
        <Field label="Titel"><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Penetratietest webshop en klantportaal" /></Field>
        <div className="actions"><button className="btn primary" onClick={create} disabled={!form.title || !form.reference}>Aanmaken</button><button className="btn" onClick={() => setOpen(false)}>Annuleren</button></div>
      </Modal>
    </div>
  );
}
