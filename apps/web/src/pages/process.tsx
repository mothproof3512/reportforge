import { useEffect, useMemo, useState } from 'react';
import { api, type Diagnostic, type Engagement, type Meta } from '../api';
import { Diagnostics, Field, LinesEditor, SubTable, confirmDialog, relTime, useToast } from '../ui';

/** Shared: keeps a draft of engagement.data[section] and saves it. */
function useSection(eng: Engagement, key: string, onSaved: (e: Engagement) => void) {
  const [d, setD] = useState<any>(structuredClone(eng.data[key] ?? {}));
  const [dirty, setDirty] = useState(false);
  const toast = useToast();
  const set = (k: string, v: any) => { setD((x: any) => ({ ...x, [k]: v })); setDirty(true); };
  const save = async () => { try { const e = await api.put(`/api/engagements/${eng.id}`, { data: { [key]: d } }); onSaved(e); setDirty(false); toast('Opgeslagen'); } catch (e: any) { toast(e.message, true); } };
  useEffect(() => { const f = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); } }; addEventListener('keydown', f); return () => removeEventListener('keydown', f); });
  return { d, set, setD: (v: any) => { setD(v); setDirty(true); }, dirty, save };
}

const SaveBar = ({ dirty, save, children }: { dirty: boolean; save: () => void; children?: React.ReactNode }) => (
  <div className="actions" style={{ position: 'sticky', top: 0, background: 'var(--bg)', padding: '6px 0 10px', zIndex: 5 }}>
    <button className="btn primary" onClick={save} disabled={!dirty}>Opslaan</button>
    <span className="muted small">{dirty ? 'Niet-opgeslagen wijzigingen (Ctrl+S)' : 'Alles opgeslagen'}</span>{children}
  </div>
);

// ---------------------------------------------------------------- intake
export function IntakeTab({ eng, onSaved }: { eng: Engagement; onSaved: (e: Engagement) => void }) {
  const { d, set, dirty, save } = useSection(eng, 'intake', onSaved);
  const md = (key: string, label: string, hint?: string, rows = 5) => <Field label={label} hint={hint}><textarea className="mono" rows={rows} value={d[key] ?? ''} onChange={(e) => set(key, e.target.value)} /></Field>;
  return (
    <div>
      <SaveBar dirty={dirty} save={save} />
      <div className="notice">De intake wordt het intakedocument (stap 1) en voedt het testplan en de rapporten: scope, periode en contactpersonen staan op het tabblad Opdracht.</div>
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Doel en context</h2>
        {md('goal', 'Doel van het onderzoek (markdown)', 'Welke vraag moet de test beantwoorden en wat is de aanleiding?')}
        {md('background', 'Achtergrond en omgeving (markdown)', 'Architectuur, hosting, wat buiten scope valt en waarom.')}
        <div className="grid2">
          <Field label="Soort test"><select value={d.test_type ?? ''} onChange={(e) => set('test_type', e.target.value)}><option value="">—</option><option value="black-box">Black-box</option><option value="grey-box">Grey-box</option><option value="white-box">White-box</option></select></Field>
          <Field label="Testvenster"><input type="text" value={d.test_window ?? ''} onChange={(e) => set('test_window', e.target.value)} placeholder="Werkdagen 08:00–18:00 op acceptatie" /></Field>
        </div>
        {md('credentials', 'Accounts en toegang (markdown)', undefined, 3)}
        {md('preconditions', 'Randvoorwaarden (markdown)', 'Whitelisting, testdata, meldafspraken.', 4)}
      </div>
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Spelregels</h2>
        <div className="grid2">
          <Field label="Toegestaan (één per regel)"><LinesEditor value={d.allowed ?? []} onChange={(v) => set('allowed', v)} /></Field>
          <Field label="Niet toegestaan (één per regel)"><LinesEditor value={d.not_allowed ?? []} onChange={(v) => set('not_allowed', v)} /></Field>
        </div>
        <Field label="Contact bij incidenten"><input type="text" value={d.emergency_contact ?? ''} onChange={(e) => set('emergency_contact', e.target.value)} /></Field>
      </div>
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Oplevering</h2>
        <Field label="Op te leveren (één per regel)"><LinesEditor value={d.deliverables ?? ['Rapportage (PDF en DOCX)', 'Third Party Memorandum', 'Hertest']} onChange={(v) => set('deliverables', v)} /></Field>
        {md('notes', 'Overige afspraken (markdown)', undefined, 3)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- test plan
export function TestplanTab({ eng, meta, onSaved }: { eng: Engagement; meta: Meta; onSaved: (e: Engagement) => void }) {
  const { d, set, setD, dirty, save } = useSection(eng, 'testplan', onSaved);
  const [suggest, setSuggest] = useState<{ suggested: string[]; available: Array<{ id: string; name: string; items: number }> } | null>(null);
  const [pick, setPick] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'not-tested'>('all');
  const toast = useToast();
  useEffect(() => { api.get(`/api/engagements/${eng.id}/checklists/suggest`).then((s) => { setSuggest(s); setPick(s.suggested); }); }, [eng.id]);
  const generate = async () => {
    if (dirty) await save();
    try { const e = await api.post(`/api/engagements/${eng.id}/checklists/generate`, { standards: pick }); onSaved(e); setD(structuredClone(e.data.testplan ?? {})); toast('Checklist aangemaakt'); } catch (e: any) { toast(e.message, true); }
  };
  const [stdDefs, setStdDefs] = useState<Record<string, any>>({});
  useEffect(() => { for (const cl of d.checklists ?? []) if (!stdDefs[cl.standard]) api.get(`/api/standards/${cl.standard}`).then((s) => setStdDefs((x) => ({ ...x, [cl.standard]: s }))); }, [d.checklists?.length]);
  const setItem = (ci: number, ii: number, patch: any) => { const cls = structuredClone(d.checklists); cls[ci].items[ii] = { ...cls[ci].items[ii], ...patch }; set('checklists', cls); };
  const bulk = (ci: number, status: string) => { const cls = structuredClone(d.checklists); cls[ci].items = cls[ci].items.map((i: any) => (i.status === 'not-tested' ? { ...i, status } : i)); set('checklists', cls); };
  const removeCl = (ci: number) => { if (confirmDialog('Checklist verwijderen?')) set('checklists', d.checklists.filter((_: any, j: number) => j !== ci)); };
  const md = (key: string, label: string, rows = 5) => <Field label={label}><textarea className="mono" rows={rows} value={d[key] ?? ''} onChange={(e) => set(key, e.target.value)} /></Field>;

  return (
    <div>
      <SaveBar dirty={dirty} save={save} />
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Aanpak</h2>
        {md('approach', 'Algemene aanpak (markdown)', 5)}
        <div className="field-label">Aanpak per onderdeel</div>
        <SubTable rows={d.per_scope ?? (eng.data.scope ?? []).map((s: any) => ({ asset: s.asset, approach: '' }))} onChange={(r) => set('per_scope', r)} columns={[{ key: 'asset', label: 'Asset', width: '34%' }, { key: 'approach', label: 'Aanpak' }]} blank={() => ({ asset: '', approach: '' })} />
        <div className="field-label" style={{ marginTop: 12 }}>Planning</div>
        <SubTable rows={d.planning ?? []} onChange={(r) => set('planning', r)} columns={[{ key: 'phase', label: 'Fase', width: '34%' }, { key: 'start', label: 'Van', type: 'date', width: '16%' }, { key: 'end', label: 'Tot en met', type: 'date', width: '16%' }, { key: 'notes', label: 'Toelichting' }]} blank={() => ({ phase: '', start: '', end: '', notes: '' })} />
        {md('go_nogo', 'Go / no-go (markdown)', 2)}
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Checklists</h2>
        <p className="muted">Gegenereerd uit de standaarden; de status houd je tijdens de test bij. Onderdelen met een gekoppelde bevinding (via <code>**Mapping**</code>) krijgen automatisch de status "Bevinding". De checklist komt als bijlage "Dekking" in het rapport en in het testplan.</p>
        {suggest && <div className="actions" style={{ marginBottom: 14 }}>
          {suggest.available.map((s) => <label key={s.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={pick.includes(s.id)} disabled={(d.checklists ?? []).some((c: any) => c.standard === s.id)} onChange={(e) => setPick(e.target.checked ? [...pick, s.id] : pick.filter((x) => x !== s.id))} /> {s.name} <span className="muted small">({s.items})</span></label>)}
          <button className="btn" onClick={generate} disabled={!pick.length}>Checklist genereren</button>
        </div>}
        {(d.checklists ?? []).map((cl: any, ci: number) => {
          const def = stdDefs[cl.standard];
          const counts = cl.items.reduce((a: any, i: any) => ((a[i.status] = (a[i.status] ?? 0) + 1), a), {});
          let lastCat: string | undefined;
          return <div key={cl.standard} style={{ marginBottom: 22 }}>
            <div className="page-head" style={{ marginBottom: 8 }}>
              <div><h3 style={{ margin: 0 }}>{def?.name ?? cl.standard}</h3><div className="muted small">{counts.tested ?? 0} getest · {counts['n/a'] ?? 0} n.v.t. · {counts['not-tested'] ?? 0} nog niet getest</div></div>
              <div className="row-actions"><select value={filter} onChange={(e) => setFilter(e.target.value as any)} style={{ width: 'auto' }}><option value="all">Alles</option><option value="not-tested">Alleen niet getest</option></select><button className="btn small" onClick={() => bulk(ci, 'tested')} title="Zet alle nog niet geteste onderdelen op Getest">Rest → getest</button><button className="btn small" onClick={() => bulk(ci, 'n/a')}>Rest → n.v.t.</button><button className="btn small ghost danger" onClick={() => removeCl(ci)}>Verwijderen</button></div>
            </div>
            <table className="list">
              <thead><tr><th style={{ width: 130 }}>ID</th><th>Onderdeel</th><th style={{ width: 130 }}>Status</th><th style={{ width: '32%' }}>Toelichting</th></tr></thead>
              <tbody>{cl.items.map((it: any, ii: number) => {
                if (filter === 'not-tested' && it.status !== 'not-tested') return null;
                const idef = def?.items?.find((x: any) => x.id === it.id);
                const catRow = idef?.category && idef.category !== lastCat ? (lastCat = idef.category, <tr key={'c' + ii}><td colSpan={4} style={{ background: 'var(--surface-2)', fontWeight: 600, fontSize: 12 }}>{idef.category}</td></tr>) : null;
                return <>{catRow}<tr key={it.id}><td className="mono small">{it.id}</td><td>{idef?.title ?? ''}</td>
                  <td><select value={it.status} onChange={(e) => setItem(ci, ii, { status: e.target.value })} style={{ padding: '3px 6px' }}><option value="not-tested">Niet getest</option><option value="tested">Getest</option><option value="n/a">N.v.t.</option></select></td>
                  <td><input type="text" value={it.note ?? ''} onChange={(e) => setItem(ci, ii, { note: e.target.value })} style={{ padding: '3px 6px' }} /></td></tr></>;
              })}</tbody>
            </table>
          </div>;
        })}
        {!(d.checklists ?? []).length && <div className="empty">Nog geen checklist. Kies hierboven de standaarden en genereer.</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- documents: render, deliver, retest
const DOC_KINDS: Array<{ document: string; label: string; step: number; hint: string }> = [
  { document: 'intake', label: 'Intakedocument', step: 1, hint: 'Voor akkoord van de eindklant vóór de test.' },
  { document: 'testplan', label: 'Testplan', step: 2, hint: 'Aanpak, planning, standaarden en checklist.' },
  { document: 'report', label: 'Rapportage', step: 4, hint: 'Het volledige rapport met alle bevindingen.' },
  { document: 'attestation', label: 'TPM / attestation', step: 5, hint: 'Verklaring voor derden, zonder technische details.' },
  { document: 'retest', label: 'Hertestrapport', step: 8, hint: 'Status per bevinding na de hertest.' },
];

export function DocumentsTab({ eng, meta, onSaved }: { eng: Engagement; meta: Meta; onSaved: (e: Engagement) => void }) {
  const [renders, setRenders] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [last, setLast] = useState<any>(null);
  const [language, setLanguage] = useState(eng.data.language ?? eng.client_language);
  const [theme, setTheme] = useState(eng.data.theme ?? eng.client_theme);
  const [templates, setTemplates] = useState<Record<string, string>>({ report: eng.data.template ?? 'pentest-report', attestation: eng.data.attestation?.variant ? `attestation-${eng.data.attestation.variant}` : 'attestation-standard', retest: 'retest-report', intake: 'intake', testplan: 'testplan' });
  const att = useSection(eng, 'attestation', onSaved);
  const toast = useToast();
  const load = () => { api.get(`/api/engagements/${eng.id}/renders`).then(setRenders); api.get(`/api/engagements/${eng.id}/deliveries`).then(setDeliveries); };
  useEffect(load, [eng.id]);

  const render = async (document: string, formats: string[]) => {
    if (document === 'attestation' && att.dirty) await att.save();
    setBusy(document);
    try {
      const r = await api.post(`/api/engagements/${eng.id}/render`, { formats, language, theme, template: templates[document] });
      setLast({ ...r, document }); load();
      toast(r.ok ? `${DOC_KINDS.find((k) => k.document === document)?.label} gerenderd in ${(r.durationMs / 1000).toFixed(1)} s` : 'Niet gerenderd: los eerst de fouten op', !r.ok);
    } catch (e: any) { toast(e.message, true); } finally { setBusy(null); }
  };
  const deliver = async (renderId: number) => {
    const note = window.prompt('Opmerking bij de oplevering (optioneel):', '') ?? '';
    try { await api.post(`/api/engagements/${eng.id}/deliver`, { render_id: renderId, note }); load(); const e = await api.get(`/api/engagements/${eng.id}`); onSaved(e); toast('Opgeleverd: bestanden bevroren en gehasht'); } catch (e: any) { toast(e.message, true); }
  };
  const startRetest = async () => {
    const date = window.prompt('Datum van de hertest (JJJJ-MM-DD):', new Date().toISOString().slice(0, 10));
    if (!date) return;
    try { const e = await api.post(`/api/engagements/${eng.id}/retest/start`, { date }); onSaved(e); toast(`Hertest gestart: versie ${e.data.version}; elke bevinding staat op "Niet hergetest"`); } catch (e: any) { toast(e.message, true); }
  };
  const kinds = DOC_KINDS.filter((k) => k.document !== 'retest' || eng.data.retest);
  const okRenders = renders.filter((r) => r.ok);

  return (
    <div>
      <div className="panel">
        <div className="grid2">
          <Field label="Taal"><select value={language} onChange={(e) => setLanguage(e.target.value)}><option value="nl">Nederlands</option><option value="en">English</option></select></Field>
          <Field label="Thema"><select value={theme} onChange={(e) => setTheme(e.target.value)}>{meta.themes.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}</select></Field>
        </div>
        <table className="list">
          <thead><tr><th>Document</th><th>Sjabloon</th><th>Laatste render</th><th /></tr></thead>
          <tbody>{kinds.map((k) => {
            const opts = meta.templates.filter((t) => t.document === k.document);
            const lastR = renders.find((r) => r.document === k.document);
            return <tr key={k.document}>
              <td><b>{k.label}</b><div className="muted small">Stap {k.step} · {k.hint}</div></td>
              <td>{opts.length > 1 ? <select value={templates[k.document]} onChange={(e) => setTemplates({ ...templates, [k.document]: e.target.value })} style={{ width: 'auto' }}>{opts.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select> : <span className="muted small">{opts[0]?.name}</span>}</td>
              <td className="small">{lastR ? <>{relTime(lastR.created_at)} · v{lastR.version} · {lastR.language} {lastR.ok ? <span style={{ color: 'var(--ok)' }}>OK</span> : <span style={{ color: 'var(--danger)' }}>fout</span>}<div className="row-actions" style={{ marginTop: 4 }}>{lastR.pdf && <a className="btn small" href={lastR.pdf} target="_blank">PDF</a>}{lastR.docx && <a className="btn small" href={lastR.docx + '&download=1'}>DOCX</a>}{lastR.ok && <button className="btn small" onClick={() => deliver(lastR.id)}>Opleveren</button>}</div></> : <span className="muted">—</span>}</td>
              <td className="row-actions"><button className="btn small primary" disabled={busy !== null || !meta.typst} onClick={() => render(k.document, ['pdf', 'docx'])}>{busy === k.document ? 'Bezig…' : 'Renderen'}</button></td>
            </tr>;
          })}</tbody>
        </table>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>TPM / attestation</h2>
        <div className="grid3">
          <Field label="Ondertekenaar"><input type="text" value={att.d.signatory?.name ?? ''} onChange={(e) => att.set('signatory', { ...(att.d.signatory ?? {}), name: e.target.value })} /></Field>
          <Field label="Functie"><input type="text" value={att.d.signatory?.role ?? ''} onChange={(e) => att.set('signatory', { ...(att.d.signatory ?? {}), role: e.target.value })} /></Field>
          <Field label="Plaats"><input type="text" value={att.d.place ?? ''} onChange={(e) => att.set('place', e.target.value)} /></Field>
        </div>
        <Field label="Eigen verklaringstekst (markdown, optioneel)" hint="Leeg = de standaardverklaring met aanbieder, eindklant, periode en standaarden."><textarea className="mono" rows={4} value={att.d.statement ?? ''} onChange={(e) => att.set('statement', e.target.value)} /></Field>
        <Field label="Eigen conclusie (markdown, optioneel)" hint="Leeg = automatische conclusie op basis van de open bevindingen van niveau hoog/kritiek."><textarea className="mono" rows={3} value={att.d.conclusion ?? ''} onChange={(e) => att.set('conclusion', e.target.value)} /></Field>
        <div className="actions"><button className="btn" onClick={att.save} disabled={!att.dirty}>Opslaan</button></div>
      </div>

      {last && <div className="panel">
        <h2 style={{ marginTop: 0 }}>{last.ok ? 'Resultaat' : 'Niet gerenderd'}</h2>
        {last.ok && <div className="actions" style={{ marginBottom: 12 }}>{last.pdf && <a className="btn" href={last.pdf} target="_blank">Open PDF</a>}{last.pdf && <a className="btn" href={last.pdf + '&download=1'}>Download PDF</a>}{last.docx && <a className="btn" href={last.docx + '&download=1'}>Download DOCX</a>}{last.renderId && <button className="btn primary" onClick={() => deliver(last.renderId)}>Opleveren (bevriezen)</button>}</div>}
        <Diagnostics items={last.diagnostics as Diagnostic[]} emptyText="Preflight: geen opmerkingen." />
        {last.ok && last.pdf && <iframe className="pdfframe" src={last.pdf} title="PDF" style={{ marginTop: 14, height: '70vh' }} />}
      </div>}

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Opgeleverd</h2>
        <p className="muted small">Een oplevering bevriest de bestanden van een render en legt de SHA-256 vast; zo weet je later exact wat de klant heeft gekregen. Bestanden staan in <code>data/renders/_deliveries/</code> met een DELIVERY.txt.</p>
        {deliveries.length === 0 ? <div className="empty">Nog niets opgeleverd.</div> : <table className="list"><thead><tr><th>Wanneer</th><th>Document</th><th>Versie</th><th>Bestanden</th><th>SHA-256</th><th>Opmerking</th></tr></thead>
          <tbody>{deliveries.map((d) => <tr key={d.id}><td>{relTime(d.created_at)}</td><td>{DOC_KINDS.find((k) => k.document === d.document)?.label ?? d.document}</td><td>v{d.version} · {d.language}</td><td className="row-actions">{d.pdf && <a className="btn small" href={d.pdf}>PDF</a>}{d.docx && <a className="btn small" href={d.docx}>DOCX</a>}</td><td className="mono small">{d.sha256_pdf?.slice(0, 16)}…<br />{d.sha256_docx?.slice(0, 16)}…</td><td className="small">{d.note}</td></tr>)}</tbody></table>}
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Hertest</h2>
        {eng.data.retest ? <p>Hertest gestart op {eng.data.retest.date} van versie {eng.data.retest.of_version}; dit is nu versie {eng.data.version}. Zet per bevinding de hertest-status in de werkbank (knop "Hertest" in de editor) en render daarna het hertestrapport, het volledige rapport v{eng.data.version} en de TPM.</p>
          : <><p className="muted">Start de hertest zodra de klant de maatregelen heeft doorgevoerd. De versie wordt opgehoogd, de versiehistorie aangevuld en elke bevinding krijgt de status "Niet hergetest" totdat je hem beoordeelt.</p><button className="btn" onClick={startRetest} disabled={!okRenders.length}>Hertest starten</button>{!okRenders.length && <span className="muted small"> — render en lever eerst versie {eng.data.version} op</span>}</>}
      </div>

      {renders.length > 0 && <><h2>Alle renders</h2>
        <table className="list"><thead><tr><th>Wanneer</th><th>Document</th><th>Versie</th><th>Taal</th><th>Thema</th><th>Status</th><th>Bestanden</th></tr></thead>
          <tbody>{renders.map((r) => <tr key={r.id}><td>{relTime(r.created_at)}</td><td>{r.template}</td><td>v{r.version}</td><td>{r.language}</td><td>{r.theme}</td><td>{r.ok ? 'OK' : <span style={{ color: 'var(--danger)' }}>fout</span>} <span className="muted small">{(r.duration_ms / 1000).toFixed(1)} s</span></td><td className="row-actions">{r.pdf && <a className="btn small" href={r.pdf} target="_blank">PDF</a>}{r.docx && <a className="btn small" href={r.docx + '&download=1'}>DOCX</a>}{r.ok && <button className="btn small ghost" onClick={() => deliver(r.id)}>Opleveren</button>}</td></tr>)}</tbody></table></>}
    </div>
  );
}
