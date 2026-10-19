import { useEffect, useState } from 'react';
import { api, type Client, type Meta } from '../api';
import { Field, Modal, confirmDialog, go, useToast } from '../ui';

export function Clients({ meta }: { meta: Meta }) {
  const [rows, setRows] = useState<Client[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [edit, setEdit] = useState<Partial<Client> | null>(null);
  const [newTheme, setNewTheme] = useState<{ slug: string; name: string; primary: string } | null>(null);
  const toast = useToast();
  const load = () => { api.get<Client[]>('/api/clients').then(setRows); api.get('/api/themes').then(setThemes); };
  useEffect(load, []);

  const save = async () => {
    try {
      if (edit!.id) await api.put(`/api/clients/${edit!.id}`, edit); else await api.post('/api/clients', edit);
      setEdit(null); load(); toast('Opgeslagen');
    } catch (e: any) { toast(e.message, true); }
  };
  const createTheme = async () => {
    const slug = newTheme!.slug.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
    try { await api.put(`/api/themes/${slug}`, { data: { name: newTheme!.name, provider: { name: newTheme!.name }, colors: { primary: newTheme!.primary } } }); setNewTheme(null); load(); go(`/themes/${slug}`); } catch (e: any) { toast(e.message, true); }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Opdrachtgevers</h1><div className="sub">De organisaties waarvoor je whitelabel rapporteert, elk met een eigen huisstijl (thema).</div></div>
        <div className="actions"><button className="btn primary" onClick={() => setEdit({ name: '', theme: '_default', language: 'nl', risk_model: 'cvss31', notes: '' })}>Nieuwe opdrachtgever</button></div>
      </div>
      {rows.length === 0 ? <div className="empty">Nog geen opdrachtgevers.</div> : (
        <table className="list"><thead><tr><th>Naam</th><th>Thema</th><th>Taal</th><th>Risicomodel</th><th className="num">Opdrachten</th><th /></tr></thead>
          <tbody>{rows.map((c) => { const t = themes.find((x) => x.slug === c.theme); return <tr key={c.id}><td><b>{c.name}</b>{c.notes && <div className="muted small">{c.notes}</div>}</td><td><span className="swatch" style={{ background: t?.primary }} /><a href={`#/themes/${c.theme}`}>{t?.name ?? c.theme}</a></td><td>{c.language}</td><td>{meta.riskModels.find((r) => r.id === c.risk_model)?.name}</td><td className="num">{c.engagements}</td>
            <td className="row-actions"><button className="btn small" onClick={() => setEdit(c)}>Bewerken</button><button className="btn small ghost danger" onClick={async () => { if (confirmDialog('Opdrachtgever verwijderen?')) { try { await api.del(`/api/clients/${c.id}`); load(); } catch (e: any) { toast(e.message, true); } } }}>Verwijderen</button></td></tr>; })}</tbody></table>
      )}

      <h2>Thema's (huisstijlen)</h2>
      <p className="muted">Een thema is een map in <code>modules/themes/</code>. Een logo en één kleur is genoeg; fonts, voorbladbeeld en teksten zijn optioneel.</p>
      <div className="actions" style={{ marginBottom: 10 }}><button className="btn" onClick={() => setNewTheme({ slug: '', name: '', primary: '#0B2545' })}>Nieuw thema</button></div>
      <table className="list"><thead><tr><th>Thema</th><th>Aanbieder</th><th>Kleur</th><th>Voorblad</th><th /></tr></thead>
        <tbody>{themes.map((t) => <tr key={t.slug} className="row-link" onClick={() => go(`/themes/${t.slug}`)}><td><b>{t.name}</b> <span className="muted mono small">{t.slug}</span></td><td>{t.provider}</td><td><span className="swatch" style={{ background: t.primary }} />{t.primary}</td><td>{t.cover ?? 'band'}</td><td><a href={`#/themes/${t.slug}`}>Openen</a></td></tr>)}</tbody></table>

      <Modal open={!!edit} title={edit?.id ? 'Opdrachtgever bewerken' : 'Nieuwe opdrachtgever'} onClose={() => setEdit(null)}>
        {edit && <>
          <Field label="Naam"><input type="text" value={edit.name ?? ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} autoFocus /></Field>
          <Field label="Thema (huisstijl)"><select value={edit.theme} onChange={(e) => setEdit({ ...edit, theme: e.target.value })}>{themes.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}</select></Field>
          <div className="grid2">
            <Field label="Standaardtaal"><select value={edit.language} onChange={(e) => setEdit({ ...edit, language: e.target.value })}><option value="nl">Nederlands</option><option value="en">English</option></select></Field>
            <Field label="Standaard risicomodel"><select value={edit.risk_model} onChange={(e) => setEdit({ ...edit, risk_model: e.target.value })}>{meta.riskModels.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></Field>
          </div>
          <Field label="Notities"><textarea value={edit.notes ?? ''} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} rows={3} /></Field>
          <div className="actions"><button className="btn primary" onClick={save} disabled={!edit.name}>Opslaan</button><button className="btn" onClick={() => setEdit(null)}>Annuleren</button></div>
        </>}
      </Modal>
      <Modal open={!!newTheme} title="Nieuw thema" onClose={() => setNewTheme(null)}>
        {newTheme && <>
          <Field label="Naam (bedrijfsnaam van de opdrachtgever)"><input type="text" value={newTheme.name} onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value, slug: newTheme.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} autoFocus /></Field>
          <div className="grid2">
            <Field label="Map-naam (id)"><input type="text" value={newTheme.slug} onChange={(e) => setNewTheme({ ...newTheme, slug: e.target.value })} /></Field>
            <Field label="Primaire kleur"><input type="text" value={newTheme.primary} onChange={(e) => setNewTheme({ ...newTheme, primary: e.target.value })} /></Field>
          </div>
          <div className="actions"><button className="btn primary" onClick={createTheme} disabled={!newTheme.name || !newTheme.slug}>Aanmaken en bewerken</button></div>
        </>}
      </Modal>
    </div>
  );
}
