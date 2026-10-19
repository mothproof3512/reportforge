import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { api, FINDING_TEMPLATE, SEVERITY_LABEL, type Diagnostic, type Engagement, type FindingRow, type LibraryRow, type Meta } from '../api';
import { Diagnostics, Field, Modal, Sev, confirmDialog, go, useToast } from '../ui';

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4, '': 5 };

export function FindingsWorkbench({ eng, meta }: { eng: Engagement; meta: Meta }) {
  const [rows, setRows] = useState<FindingRow[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState('');
  const [parsed, setParsed] = useState<any>(null);
  const [side, setSide] = useState<'preview' | 'pdf' | 'check' | 'images' | 'versions'>('preview');
  const [pdf, setPdf] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [libOpen, setLibOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [drag, setDrag] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const toast = useToast();
  const riskModel = eng.data.risk_model ?? eng.client_risk_model;
  const dirty = text !== saved;

  const loadRows = useCallback(() => api.get<FindingRow[]>(`/api/engagements/${eng.id}/findings`).then((r) => { setRows(r); return r; }), [eng.id]);
  const loadFiles = useCallback(() => api.get(`/api/engagements/${eng.id}/files`).then(setFiles), [eng.id]);
  useEffect(() => { loadRows().then((r) => { if (r.length && sel === null) select(r[0].id); }); loadFiles(); }, [eng.id]);

  const select = async (id: number) => {
    if (dirty && !confirmDialog('Niet-opgeslagen wijzigingen weggooien?')) return;
    const f = await api.get(`/api/findings/${id}`);
    setSel(id); setText(f.markdown); setSaved(f.markdown); setPdf(null);
    api.get(`/api/findings/${id}/versions`).then(setVersions);
  };

  // live parse (debounced)
  useEffect(() => { const h = setTimeout(() => { if (text.trim()) api.post('/api/parse', { markdown: text, risk_model: riskModel }).then(setParsed).catch(() => {}); else setParsed(null); }, 350); return () => clearTimeout(h); }, [text, riskModel]);

  const save = async () => {
    if (sel === null) return;
    try { const r = await api.put(`/api/findings/${sel}`, { markdown: text }); setSaved(text); loadRows(); api.get(`/api/findings/${sel}/versions`).then(setVersions); toast('Opgeslagen'); } catch (e: any) { toast(e.message, true); }
  };
  useEffect(() => { const f = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); } }; addEventListener('keydown', f); return () => removeEventListener('keydown', f); });

  const addNew = async (markdown = FINDING_TEMPLATE, library_id?: number) => {
    const r = await api.post(`/api/engagements/${eng.id}/findings`, { markdown, library_id });
    const list = await loadRows();
    if (r.created.length > 1) toast(`${r.created.length} bevindingen toegevoegd`);
    await select(r.created[0].id);
    return list;
  };
  const remove = async () => { if (sel !== null && confirmDialog('Bevinding verwijderen?')) { await api.del(`/api/findings/${sel}`); setSel(null); setText(''); setSaved(''); loadRows(); } };
  const toLibrary = async () => { if (sel === null) return; if (dirty) await save(); await api.post(`/api/findings/${sel}/to-library`, { language: eng.data.language ?? eng.client_language }); toast('Opgeslagen in de bibliotheek'); };
  const renderPdf = async () => {
    setPdfBusy(true); setSide('pdf');
    try { const r = await api.post(`/api/engagements/${eng.id}/preview`, { markdown: text }); if (r.pdf) setPdf(r.pdf); else toast('Preview niet mogelijk: ' + r.diagnostics.map((d: Diagnostic) => d.message).join('; '), true); }
    catch (e: any) { toast(e.message, true); } finally { setPdfBusy(false); }
  };

  // images: drop / paste → upload → insert markdown at cursor
  const insertAtCursor = (s: string) => {
    const el = ta.current; if (!el) { setText((t) => t + '\n' + s); return; }
    const start = el.selectionStart, end = el.selectionEnd;
    const next = text.slice(0, start) + s + text.slice(end);
    setText(next);
    requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = start + s.length; });
  };
  const uploadFiles = async (list: FileList | File[]) => {
    for (const f of Array.from(list)) {
      if (!f.type.startsWith('image/')) continue;
      const name = f.name && f.name !== 'image.png' ? f.name : `screenshot-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}.png`;
      try { const r = await api.upload(`/api/engagements/${eng.id}/files?name=${encodeURIComponent(name)}`, f); insertAtCursor(`\n![Beschrijving van de afbeelding](../images/${r.name})\n`); loadFiles(); }
      catch (e: any) { toast(e.message, true); }
    }
  };
  const onPaste = (e: React.ClipboardEvent) => { const imgs = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith('image/')); if (imgs.length) { e.preventDefault(); uploadFiles(imgs); } };
  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Tab') { e.preventDefault(); insertAtCursor('  '); } };

  const sortedRows = useMemo(() => [...rows].sort((a, b) => (SEV_ORDER[a.severity] ?? 5) - (SEV_ORDER[b.severity] ?? 5) || a.position - b.position), [rows]);
  const idOf = (r: FindingRow) => `F-${String(sortedRows.indexOf(r) + 1).padStart(2, '0')}`;
  const missingImages: Diagnostic[] = useMemo(() => {
    const names = new Set(files.map((f: any) => f.name));
    return [...text.matchAll(/!\[[^\]]*\]\(\.\.\/images\/([^)\s]+)\)/g)].map((m) => m[1]).filter((n) => !names.has(n)).map((n) => ({ level: 'error' as const, message: `Afbeelding ${n} is nog niet geüpload: sleep of plak het bestand in de editor, of voeg het toe via "Afbeeldingen".` }));
  }, [text, files]);
  const diags: Diagnostic[] = [...(parsed?.diagnostics ?? []), ...missingImages];
  const nErr = diags.filter((d) => d.level === 'error').length, nWarn = diags.length - nErr;
  const f0 = parsed?.findings?.[0];

  return (
    <div className="workbench">
      <aside className="wb-list">
        <div className="head">
          <div><a href={`#/engagements/${eng.id}/overview`} className="muted small">← {eng.reference}</a><div style={{ fontWeight: 600 }}>Bevindingen <span className="muted">({rows.length})</span></div></div>
          <div className="row-actions"><button className="btn small primary" onClick={() => addNew()}>Nieuw</button><button className="btn small" onClick={() => setPasteOpen(true)} title="Plak markdown met één of meer bevindingen">Plakken</button><button className="btn small" onClick={() => setLibOpen(true)}>Bibliotheek</button><button className="btn small" onClick={() => setImportOpen(true)} title="Nuclei, Burp of Nessus export">Importeren</button></div>
        </div>
        <div className="items">
          {sortedRows.map((r) => <div key={r.id} className={'fitem' + (r.id === sel ? ' active' : '')} onClick={() => select(r.id)}><div><div className="id">{idOf(r)}</div><div className="t">{r.title || '(zonder titel)'}</div></div><Sev s={r.severity} /></div>)}
          {rows.length === 0 && <div className="empty" style={{ margin: 14 }}>Nog geen bevindingen. Plak markdown, kies uit de bibliotheek of begin met een lege bevinding.</div>}
        </div>
        <div className="head" style={{ borderTop: '1px solid var(--line-2)', borderBottom: 0 }}><a className="btn small" href={`#/engagements/${eng.id}/documents`}>Naar documenten →</a></div>
      </aside>

      <section className={'wb-editor' + (drag ? ' drop' : '')} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); uploadFiles(e.dataTransfer.files); }}>
        <div className="toolbar">
          <button className="btn small primary" onClick={save} disabled={sel === null || !dirty}>Opslaan</button>
          <button className="btn small" onClick={renderPdf} disabled={sel === null || pdfBusy}>{pdfBusy ? 'Rendert…' : 'PDF-preview'}</button>
          <button className="btn small" onClick={() => document.getElementById('rf-upload')?.click()} disabled={sel === null}>Afbeelding…</button>
          <input id="rf-upload" type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => { if (e.target.files) uploadFiles(e.target.files); e.target.value = ''; }} />
          <button className="btn small" onClick={toLibrary} disabled={sel === null}>→ Bibliotheek</button>
          {eng.data.retest && <select value={f0?.retest?.status ?? ''} disabled={sel === null} title="Hertest-status" style={{ width: 'auto', padding: '3px 6px' }} onChange={async (e) => { if (!e.target.value || sel === null) return; const note = window.prompt('Toelichting bij de hertest (optioneel):', f0?.retest?.note ?? '') ?? ''; const r = await api.post(`/api/findings/${sel}/retest`, { status: e.target.value, note }); setText(r.markdown); setSaved(r.markdown); loadRows(); }}>
            <option value="">Hertest…</option><option value="resolved">Opgelost</option><option value="partially-resolved">Deels opgelost</option><option value="open">Open</option><option value="not-tested">Niet hergetest</option><option value="risk-accepted">Risico geaccepteerd</option>
          </select>}
          <span className="sp" />
          <button className="btn small ghost danger" onClick={remove} disabled={sel === null}>Verwijderen</button>
        </div>
        <textarea ref={ta} value={text} onChange={(e) => setText(e.target.value)} onPaste={onPaste} onKeyDown={onKey} spellCheck={false} placeholder={rows.length ? 'Kies een bevinding links.' : 'Begin met "Nieuw" of plak een bevinding.'} disabled={sel === null} />
        <div className="statusline">
          <span>{dirty ? 'Gewijzigd' : 'Opgeslagen'}</span>
          {f0?.assessed && <span>{meta.riskModels.find((m) => m.id === riskModel)?.name}: <b>{f0.assessed.label}</b> → {SEVERITY_LABEL[f0.assessed.severity]}</span>}
          {f0?.riskError && <span style={{ color: 'var(--danger)' }}>{f0.riskError}</span>}
          <span style={{ color: nErr ? 'var(--danger)' : nWarn ? 'var(--warn)' : 'var(--ok)' }}>{nErr} fouten · {nWarn} waarschuwingen</span>
          <span className="muted">Sleep of plak screenshots in de editor · Ctrl+S slaat op</span>
        </div>
      </section>

      <aside className="wb-side">
        <div className="tabs">
          {([['preview', 'Preview'], ['pdf', 'PDF'], ['check', `Controle${diags.length ? ` (${diags.length})` : ''}`], ['images', `Afbeeldingen (${files.length})`], ['versions', 'Versies']] as const).map(([k, l]) => <button key={k} className={side === k ? 'active' : ''} onClick={() => setSide(k)}>{l}</button>)}
        </div>
        <div className="body">
          {side === 'preview' && <Preview parsed={f0} eng={eng} fid={sel !== null ? idOf(rows.find((r) => r.id === sel)!) : ''} riskModel={riskModel} meta={meta} />}
          {side === 'pdf' && (pdf ? <iframe className="pdfframe" src={pdf} title="PDF-preview" /> : <p className="muted">{pdfBusy ? 'Rendert…' : 'Klik op PDF-preview om deze bevinding te renderen zoals hij in het rapport komt.'}</p>)}
          {side === 'check' && <Diagnostics items={diags} emptyText="Geen opmerkingen: de bevinding voldoet aan het format." />}
          {side === 'images' && <ImagesPanel eng={eng} files={files} onInsert={(n) => insertAtCursor(`\n![Beschrijving](../images/${n})\n`)} onDeleted={loadFiles} />}
          {side === 'versions' && <ul className="diag">{versions.map((v) => <li key={v.id}>{v.created_at} <span className="muted">({v.size} tekens)</span> <button className="btn small ghost" onClick={async () => { const x = await api.get(`/api/findings/${sel}/versions/${v.id}`); setText(x.markdown); }}>Herstel in editor</button></li>)}</ul>}
        </div>
      </aside>

      <Modal open={pasteOpen} title="Bevinding(en) plakken" onClose={() => setPasteOpen(false)} width={760}><PasteDialog onDone={async (md) => { setPasteOpen(false); await addNew(md); }} /></Modal>
      <Modal open={importOpen} title="Importeren uit tooling" onClose={() => setImportOpen(false)} width={820}><ImportDialog eng={eng} meta={meta} onDone={async (n) => { setImportOpen(false); const list = await loadRows(); toast(`${n} bevinding(en) geïmporteerd; elke bevinding draagt een verificatiemarkering tot je hem hebt nagelopen`); if (list.length && sel === null) select(list[0].id); }} /></Modal>
      <Modal open={libOpen} title="Uit de bibliotheek" onClose={() => setLibOpen(false)} width={760}><LibraryPicker onPick={async (l) => { setLibOpen(false); await addNew(l.markdown!, l.id); }} /></Modal>
    </div>
  );
}

function PasteDialog({ onDone }: { onDone: (md: string) => void }) {
  const [md, setMd] = useState('');
  const [chk, setChk] = useState<any>(null);
  useEffect(() => { const h = setTimeout(() => { if (md.trim()) api.post('/api/parse', { markdown: md }).then(setChk); }, 300); return () => clearTimeout(h); }, [md]);
  return (
    <div>
      <p className="muted small">Plak de markdown-export (één of meer bevindingen, elke begint met <code>## Titel</code>). Afbeeldingen voeg je daarna toe in de editor.</p>
      <textarea className="mono" rows={16} value={md} onChange={(e) => setMd(e.target.value)} autoFocus />
      {chk && <p className="small" style={{ marginTop: 8 }}>{chk.findings.length} bevinding(en) herkend · {chk.diagnostics.filter((d: Diagnostic) => d.level === 'error').length} fouten, {chk.diagnostics.filter((d: Diagnostic) => d.level === 'warning').length} waarschuwingen</p>}
      <div className="actions"><button className="btn primary" disabled={!md.trim()} onClick={() => onDone(md)}>Toevoegen</button></div>
    </div>
  );
}

function LibraryPicker({ onPick }: { onPick: (l: LibraryRow) => void }) {
  const [q, setQ] = useState(''); const [rows, setRows] = useState<LibraryRow[]>([]); const [cur, setCur] = useState<LibraryRow | null>(null);
  useEffect(() => { const h = setTimeout(() => api.get<LibraryRow[]>(`/api/library?q=${encodeURIComponent(q)}`).then(setRows), 200); return () => clearTimeout(h); }, [q]);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div>
        <input type="text" placeholder="Zoek op titel, tag, CWE…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        <div style={{ maxHeight: 360, overflow: 'auto', marginTop: 8 }}>{rows.map((r) => <div key={r.id} className={'fitem' + (cur?.id === r.id ? ' active' : '')} onClick={() => api.get<LibraryRow>(`/api/library/${r.id}`).then(setCur)}><div><div className="t">{r.title}</div><div className="muted small">{r.language} · {r.tags || '—'} · {r.used_count}× gebruikt</div></div><Sev s={r.severity} /></div>)}{rows.length === 0 && <p className="muted small">Niets gevonden.</p>}</div>
      </div>
      <div>{cur ? <><div className="lib-md">{cur.markdown}</div><button className="btn primary" style={{ marginTop: 10 }} onClick={() => onPick(cur)}>Gebruik in deze opdracht</button></> : <p className="muted small">Kies links een bevinding om te bekijken.</p>}</div>
    </div>
  );
}

function ImagesPanel({ eng, files, onInsert, onDeleted }: { eng: Engagement; files: any[]; onInsert: (name: string) => void; onDeleted: () => void }) {
  if (!files.length) return <p className="muted">Nog geen afbeeldingen. Sleep of plak screenshots in de editor; ze worden automatisch verkleind tot maximaal 2400 px breed.</p>;
  return <div>{files.map((f) => <div key={f.name} className="panel tight" style={{ marginBottom: 10 }}>
    <img src={`/api/engagements/${eng.id}/files/${encodeURIComponent(f.name)}`} style={{ width: '100%', border: '1px solid var(--line)' }} />
    <div className="small" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}><span className="mono">{f.name}</span><span className="muted">{f.width}×{f.height}</span></div>
    <div className="row-actions" style={{ marginTop: 6 }}><button className="btn small" onClick={() => onInsert(f.name)}>Invoegen</button><button className="btn small ghost danger" onClick={async () => { if (confirmDialog('Afbeelding verwijderen?')) { await api.del(`/api/engagements/${eng.id}/files/${encodeURIComponent(f.name)}`); onDeleted(); } }}>Verwijderen</button></div>
  </div>)}</div>;
}

/** HTML preview styled like the report's finding block. */
function Preview({ parsed, eng, fid, riskModel, meta }: { parsed: any; eng: Engagement; fid: string; riskModel: string; meta: Meta }) {
  if (!parsed) return <p className="muted">Begin met typen; hier verschijnt de bevinding zoals de lezer hem ziet.</p>;
  const html = (md?: string) => ({ __html: DOMPurify.sanitize(marked.parse((md ?? '').replace(/\]\(\.\.\/images\//g, `](/api/engagements/${eng.id}/files/`), { async: false }) as string) });
  const a = parsed.assessed;
  const sections: Array<[string, string]> = [['Beschrijving', 'description'], ['Impact', 'impact'], ['Bewijs', 'evidence'], ['Aanbeveling', 'recommendation']];
  for (const k of Object.keys(parsed.sections)) if (!['description', 'impact', 'evidence', 'recommendation', 'references'].includes(k)) sections.push([k[0].toUpperCase() + k.slice(1), k]);
  sections.push(['Referenties', 'references']);
  return (
    <div className="fprev">
      <h2><span className="fid">{fid}</span>{parsed.title}</h2>
      <div className="meta">
        <div className="row">
          <div><span className="k">Ernst</span>{a ? <Sev s={a.severity} /> : <Sev s={parsed.severity ?? ''} />}</div>
          {a && <div><span className="k">{meta.riskModels.find((m) => m.id === riskModel)?.name}</span><b>{a.label}</b></div>}
          <div><span className="k">Status</span>{parsed.status}</div>
          {parsed.source && <div><span className="k">Bron</span>{parsed.source}</div>}
        </div>
        {(a?.vector || parsed.mapping.length || parsed.cwe.length) ? <div className="extras">{[a?.vector, ...parsed.mapping, ...parsed.cwe].filter(Boolean).join('   |   ')}</div> : null}
      </div>
      {parsed.affected.length > 0 && <><h3>Betrokken systemen</h3><ul>{parsed.affected.map((x: string, i: number) => <li key={i}><code>{x}</code></li>)}</ul></>}
      {sections.map(([label, key]) => parsed.sections[key] ? <div key={key}><h3>{label}</h3><div dangerouslySetInnerHTML={html(parsed.sections[key])} /></div> : null)}
    </div>
  );
}

function ImportDialog({ eng, meta, onDone }: { eng: Engagement; meta: Meta; onDone: (n: number) => void }) {
  const [importer, setImporter] = useState(meta.importers[0]?.id ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [minSev, setMinSev] = useState('info');
  const [preview, setPreview] = useState<any>(null);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const lang = eng.data.language ?? eng.client_language;
  const run = async (commit: boolean) => {
    if (!file) return;
    setBusy(true);
    try {
      const q = `importer=${importer}&lang=${lang}&min_severity=${minSev}` + (commit ? `&commit=1&only=${[...sel].join(',')}` : '');
      const r = await api.uploadRaw(`/api/engagements/${eng.id}/import?${q}`, await file.arrayBuffer());
      if (commit) onDone(r.created.length);
      else { setPreview(r); setSel(new Set(r.findings.map((f: any) => f.index))); }
    } catch (e: any) { toast(e.message, true); } finally { setBusy(false); }
  };
  const imp = meta.importers.find((i) => i.id === importer);
  return (
    <div>
      <div className="grid3">
        <Field label="Tool"><select value={importer} onChange={(e) => { setImporter(e.target.value); setPreview(null); }}>{meta.importers.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></Field>
        <Field label="Exportbestand"><input type="file" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPreview(null); }} /></Field>
        <Field label="Minimale ernst"><select value={minSev} onChange={(e) => setMinSev(e.target.value)}><option value="info">Alles</option><option value="low">Laag en hoger</option><option value="medium">Middel en hoger</option><option value="high">Hoog en hoger</option></select></Field>
      </div>
      {imp?.description && <p className="muted small">{imp.description}</p>}
      {!preview && <button className="btn primary" disabled={!file || busy} onClick={() => run(false)}>{busy ? 'Bezig…' : 'Analyseren'}</button>}
      {preview && <>
        <p className="small">{preview.findings.length} bevinding(en) uit {preview.tool}; gelijke issues over meerdere hosts zijn samengevoegd. Kies wat je wilt toevoegen.</p>
        {preview.warnings.map((w: string, i: number) => <div key={i} className="notice small">{w}</div>)}
        <div style={{ maxHeight: 360, overflow: 'auto', border: '1px solid var(--line)', borderRadius: 6 }}>
          {preview.findings.map((f: any) => <label key={f.index} className="fitem" style={{ gridTemplateColumns: 'auto 1fr auto' }}><input type="checkbox" checked={sel.has(f.index)} onChange={(e) => { const n = new Set(sel); e.target.checked ? n.add(f.index) : n.delete(f.index); setSel(n); }} /><div><div className="t">{f.title}</div><div className="muted small">{f.affected.slice(0, 3).join(', ')}{f.affected.length > 3 ? ` +${f.affected.length - 3}` : ''}{f.merged > 1 ? ` · ${f.merged} samengevoegd` : ''}</div></div><Sev s={f.severity} /></label>)}
        </div>
        <div className="actions" style={{ marginTop: 12 }}><button className="btn primary" disabled={!sel.size || busy} onClick={() => run(true)}>{sel.size} toevoegen</button><button className="btn" onClick={() => setPreview(null)}>Terug</button></div>
      </>}
    </div>
  );
}
