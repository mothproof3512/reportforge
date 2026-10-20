import { useEffect, useRef, useState } from 'react';
import { api, type Client, type Diagnostic, type Engagement, type Meta } from '../api';
import { Diagnostics, Field, LinesEditor, SubTable, confirmDialog, go, relTime, useToast } from '../ui';
import { FindingsWorkbench } from './findings';
import { IntakeTab, TestplanTab, DocumentsTab } from './process';

export function EngagementPage({ id, tab, meta }: { id: number; tab: string; meta: Meta }) {
  const [eng, setEng] = useState<Engagement | null>(null);
  const toast = useToast();
  const reload = () => api.get<Engagement>(`/api/engagements/${id}`).then(setEng).catch((e) => toast(e.message, true));
  useEffect(() => { reload(); }, [id]);
  if (!eng) return null;
  const setStep = async (step: number) => { const e = await api.put(`/api/engagements/${id}`, { step }); setEng(e); };

  if (tab === 'findings') return <FindingsWorkbench eng={eng} meta={meta} />;
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>{eng.title}</h1><div className="sub"><span className="mono">{eng.reference}</span> · {eng.data.client?.name || 'eindklant onbekend'} · voor {eng.client_name} · bijgewerkt {relTime(eng.updated_at)}</div></div>
        <div className="actions">
          <a className="btn" href={`/api/engagements/${id}/export`}>Exporteer map (.tar)</a>
          <button className="btn danger" onClick={async () => { if (confirmDialog('Opdracht en alle bevindingen verwijderen?')) { await api.del(`/api/engagements/${id}`); go('/engagements'); } }}>Verwijderen</button>
        </div>
      </div>
      <div className="steps">{meta.steps.map((s, i) => <button key={s} className={i + 1 < eng.step ? 'done' : i + 1 === eng.step ? 'current' : ''} onClick={() => setStep(i + 1)} title={`Stap ${i + 1}`}><b>{i + 1}</b><span>{s}</span></button>)}</div>
      <div className="tabs">
        {[['overview', 'Opdracht'], ['intake', 'Intake'], ['testplan', 'Testplan'], ['findings', 'Bevindingen'], ['documents', 'Documenten']].map(([k, l]) => <a key={k} href={`#/engagements/${id}/${k}`} className={tab === k ? 'active' : ''}>{l}</a>)}
      </div>
      {tab === 'intake' ? <IntakeTab eng={eng} onSaved={setEng} /> : tab === 'testplan' ? <TestplanTab eng={eng} meta={meta} onSaved={setEng} /> : tab === 'documents' || tab === 'report' ? <DocumentsTab eng={eng} meta={meta} onSaved={setEng} /> : <Overview eng={eng} meta={meta} onSaved={setEng} />}
    </div>
  );
}

// ---------------------------------------------------------------- overview / metadata form
function Overview({ eng, meta, onSaved }: { eng: Engagement; meta: Meta; onSaved: (e: Engagement) => void }) {
  const [d, setD] = useState<any>(structuredClone(eng.data));
  const [title, setTitle] = useState(eng.title);
  const [reference, setReference] = useState(eng.reference);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState(eng.client_id);
  const [dirty, setDirty] = useState(false);
  const toast = useToast();
  useEffect(() => { api.get<Client[]>('/api/clients').then(setClients); }, []);
  const set = (k: string, v: any) => { setD((x: any) => ({ ...x, [k]: v })); setDirty(true); };
  const setClient = (k: string, v: any) => set('client', { ...(d.client ?? {}), [k]: v });
  const save = async () => {
    try { const e = await api.put(`/api/engagements/${eng.id}`, { title, reference, client_id: clientId, data: d }); onSaved(e); setDirty(false); toast('Opgeslagen'); } catch (e: any) { toast(e.message, true); }
  };
  useEffect(() => { const f = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); } }; addEventListener('keydown', f); return () => removeEventListener('keydown', f); });
  const lang = d.language ?? eng.client_language;
  const md = (key: string, label: string, hint?: string, rows = 8) => <Field label={label} hint={hint}><textarea className="mono" rows={rows} value={d[key] ?? ''} onChange={(e) => set(key, e.target.value)} /></Field>;

  return (
    <div>
      <div className="actions" style={{ position: 'sticky', top: 0, background: 'var(--bg)', padding: '6px 0 10px', zIndex: 5 }}>
        <button className="btn primary" onClick={save} disabled={!dirty}>Opslaan</button>
        <span className="muted small">{dirty ? 'Niet-opgeslagen wijzigingen (Ctrl+S)' : 'Alles opgeslagen'}</span>
      </div>
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Rapport</h2>
        <div className="grid2">
          <Field label="Titel"><input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} /></Field>
          <Field label="Ondertitel"><input type="text" value={d.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value)} /></Field>
        </div>
        <div className="grid3">
          <Field label="Referentie"><input type="text" value={reference} onChange={(e) => { setReference(e.target.value); setDirty(true); }} /></Field>
          <Field label="Versie"><input type="text" value={d.version ?? ''} onChange={(e) => set('version', e.target.value)} /></Field>
          <Field label="Datum"><input type="date" value={d.date ?? ''} onChange={(e) => set('date', e.target.value)} /></Field>
        </div>
        <div className="grid3">
          <Field label="Opdrachtgever (huisstijl)"><select value={clientId} onChange={(e) => { setClientId(Number(e.target.value)); setDirty(true); }}>{clients.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.theme}</option>)}</select></Field>
          <Field label="Taal"><select value={d.language ?? eng.client_language} onChange={(e) => set('language', e.target.value)}><option value="nl">Nederlands</option><option value="en">English</option></select></Field>
          <Field label="Risicomodel"><select value={d.risk_model ?? eng.client_risk_model} onChange={(e) => set('risk_model', e.target.value)}>{meta.riskModels.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></Field>
        </div>
        <div className="grid3">
          <Field label="Sjabloon"><select value={d.template ?? 'pentest-report'} onChange={(e) => set('template', e.target.value)}>{meta.templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
          <Field label="Classificatie"><input type="text" value={d.classification ?? ''} onChange={(e) => set('classification', e.target.value)} /></Field>
          <Field label="Type test"><select value={d.type ?? ''} onChange={(e) => set('type', e.target.value)}><option value="">—</option>{['web', 'api', 'infra', 'mobile', 'cloud', 'wifi', 'social', 'red-team'].map((t) => <option key={t}>{t}</option>)}</select></Field>
        </div>
        <div className="grid3">
          <Field label="Prefix bevindingsnummers" hint="Standaard F (F-01, F-02, …); bijv. CS voor CS-01."><input type="text" value={d.finding_prefix ?? ''} placeholder="F" maxLength={6} onChange={(e) => set('finding_prefix', e.target.value.toUpperCase() || undefined)} /></Field>
        </div>
        <div className="grid2">
          <Field label="Testperiode van"><input type="date" value={d.period?.start ?? ''} onChange={(e) => set('period', { ...(d.period ?? {}), start: e.target.value })} /></Field>
          <Field label="tot en met"><input type="date" value={d.period?.end ?? ''} onChange={(e) => set('period', { ...(d.period ?? {}), end: e.target.value })} /></Field>
        </div>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Eindklant</h2>
        <Field label="Naam"><input type="text" value={d.client?.name ?? ''} onChange={(e) => setClient('name', e.target.value)} /></Field>
        <div className="field-label">Contactpersonen</div>
        <SubTable rows={d.client?.contact ?? []} onChange={(r) => setClient('contact', r)} columns={[{ key: 'name', label: 'Naam' }, { key: 'role', label: 'Rol' }, { key: 'email', label: 'E-mail' }]} blank={() => ({ name: '', role: '', email: '' })} />
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Team</h2>
        <div className="field-label">Auteurs</div>
        <SubTable rows={d.authors ?? []} onChange={(r) => set('authors', r)} columns={[{ key: 'name', label: 'Naam' }, { key: 'role', label: 'Rol' }]} blank={() => ({ name: '', role: '' })} />
        <div className="field-label">Testers</div>
        <SubTable rows={d.testers ?? []} onChange={(r) => set('testers', r)} columns={[{ key: 'name', label: 'Naam' }, { key: 'role', label: 'Rol' }]} blank={() => ({ name: '', role: '' })} />
        <div className="field-label">Reviewers</div>
        <SubTable rows={d.reviewers ?? []} onChange={(r) => set('reviewers', r)} columns={[{ key: 'name', label: 'Naam' }, { key: 'role', label: 'Rol' }]} blank={() => ({ name: '', role: '' })} />
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Scope</h2>
        <SubTable rows={d.scope ?? []} onChange={(r) => set('scope', r)} columns={[{ key: 'asset', label: 'Asset', width: '34%' }, { key: 'type', label: 'Type', type: 'select', options: ['web', 'api', 'infra', 'mobile', 'cloud', 'other'], width: '12%' }, { key: 'environment', label: 'Omgeving', width: '14%' }, { key: 'access', label: 'Toegang', width: '14%' }, { key: 'description', label: 'Toelichting' }]} blank={() => ({ asset: '', type: 'web', environment: '', access: '', description: '' })} />
        <div className="field-label">Testaccounts</div>
        <SubTable rows={d.accounts ?? []} onChange={(r) => set('accounts', r)} columns={[{ key: 'role', label: 'Rol', width: '30%' }, { key: 'account', label: 'Account', width: '30%' }, { key: 'rights', label: 'Rechten' }]} blank={() => ({ role: '', account: '', rights: '' })} />
        <Field label="Buiten scope" hint="Eén regel per onderdeel"><LinesEditor value={d.out_of_scope ?? []} onChange={(v) => set('out_of_scope', v)} /></Field>
        {md('limitations', 'Beperkingen (markdown, optioneel)', undefined, 4)}
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Standaarden en tooling</h2>
        <div className="checks" style={{ marginBottom: 14 }}>{meta.standards.map((s) => <label key={s.id}><input type="checkbox" checked={(d.standards ?? []).includes(s.id)} onChange={(e) => set('standards', e.target.checked ? [...(d.standards ?? []), s.id] : (d.standards ?? []).filter((x: string) => x !== s.id))} /> {s.short} <span className="muted">{s.version ?? ''}</span></label>)}</div>
        <div className="field-label">Tooling</div>
        <SubTable rows={d.tools ?? []} onChange={(r) => set('tools', r)} columns={[{ key: 'name', label: 'Naam', width: '30%' }, { key: 'version', label: 'Versie', width: '15%' }, { key: 'purpose', label: 'Doel' }]} blank={() => ({ name: '', version: '', purpose: '' })} />
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Teksten</h2>
        {md('executive_summary', 'Managementsamenvatting (markdown)', 'Leeg laten geeft een automatisch gegenereerde samenvatting met de kerncijfers.', 12)}
        {md('test_approach', 'Aanpak (markdown, optioneel)', 'Vervangt de standaardtekst in het hoofdstuk Aanpak en methodiek.', 5)}
        {md('conclusion', 'Conclusie (markdown)', undefined, 8)}
        {md('recommendations', 'Aanbevelingen op hoofdlijnen (markdown, optioneel)', undefined, 6)}
        {md('positives', 'Wat goed gaat (markdown, optioneel)', 'Positieve observaties; eigen hoofdstuk in het uitgebreide sjabloon.', 5)}
        {md('roadmap', 'Roadmap (markdown, optioneel)', 'Groepen met ### koppen, bijv. "### 0 – 30 dagen"; elke groep wordt een kader in de conclusie.', 6)}
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Versiehistorie</h2>
        <SubTable rows={d.document_history ?? []} onChange={(r) => set('document_history', r)} columns={[{ key: 'version', label: 'Versie', width: '10%' }, { key: 'date', label: 'Datum', type: 'date', width: '18%' }, { key: 'author', label: 'Auteur', width: '22%' }, { key: 'change', label: 'Wijziging' }]} blank={() => ({ version: '', date: d.date ?? '', author: d.authors?.[0]?.name ?? '', change: '' })} />
        <div className="muted small">Taal van het rapport: {lang === 'en' ? 'English' : 'Nederlands'}.</div>
      </div>
    </div>
  );
}

