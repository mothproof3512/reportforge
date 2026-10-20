import { useEffect, useState } from 'react';
import { api, type Meta } from '../api';
import { Field, confirmDialog, go, useToast } from '../ui';

interface ThemeInfo { slug: string; yaml: string; data: any; resolved: any; warnings: Array<{ message: string }>; assets: string[]; fonts: string[] }

/** Theme editor: the quick fields most clients need, the full YAML for everything else. */
export function ThemePage({ slug, meta, onChanged }: { slug: string; meta: Meta; onChanged: () => void }) {
  const [t, setT] = useState<ThemeInfo | null>(null);
  const [d, setD] = useState<any>({});
  const [yaml, setYaml] = useState('');
  const [mode, setMode] = useState<'form' | 'yaml'>('form');
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const readonly = slug === '_default';
  const load = () => api.get<ThemeInfo>(`/api/themes/${slug}`).then((x) => { setT(x); setD(x.data ?? {}); setYaml(x.yaml); setDirty(false); }).catch((e) => toast(e.message, true));
  useEffect(() => { load(); }, [slug]);
  if (!t) return null;

  const set = (path: string, v: any) => { setD((cur: any) => { const n = structuredClone(cur); const keys = path.split('.'); let o = n; for (const k of keys.slice(0, -1)) o = o[k] ??= {}; if (v === '' || v === undefined) delete o[keys.at(-1)!]; else o[keys.at(-1)!] = v; return n; }); setDirty(true); };
  const get = (path: string) => path.split('.').reduce((o: any, k) => o?.[k], d) ?? '';
  const save = async () => {
    try { await api.put(`/api/themes/${slug}`, mode === 'yaml' ? { yaml } : { data: d }); await load(); onChanged(); toast('Thema opgeslagen'); } catch (e: any) { toast(e.message, true); }
  };
  const upload = async (file: File) => {
    try { await api.upload(`/api/themes/${slug}/assets?name=${encodeURIComponent(file.name)}`, file); await load(); toast(`${file.name} toegevoegd`); } catch (e: any) { toast(e.message, true); }
  };
  const doPreview = async (language: string) => {
    if (dirty) await save();
    setBusy(true);
    try { const r = await api.post(`/api/themes/${slug}/preview`, { language }); setPreview(r.pdf + '&t=' + Date.now()); } catch (e: any) { toast(e.message, true); } finally { setBusy(false); }
  };
  const assetSelect = (key: string, label: string, hint: string) => <Field label={label} hint={hint}><select value={get('assets.' + key)} onChange={(e) => set('assets.' + key, e.target.value)}><option value="">— geen —</option>{t.assets.map((a) => <option key={a} value={a}>{a}</option>)}</select></Field>;
  const fontSelect = (key: string, label: string) => <Field label={label}><input type="text" list="rf-fonts" value={get('fonts.' + key)} onChange={(e) => set('fonts.' + key, e.target.value)} placeholder="Inter" /></Field>;
  const fontFamilies = Array.from(new Set(['Inter', 'JetBrains Mono', 'Source Serif 4', ...t.fonts.map((f) => f.replace(/[-_](Regular|Bold|Italic|Medium|SemiBold|Semibold|Light|It|BoldIt|SemiboldIt|MediumItalic|BoldItalic|SemiBoldItalic).*$/i, '').replace(/\.(ttf|otf)$/i, '').replace(/([a-z])([A-Z])/g, '$1 $2'))]));

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>{d.name ?? slug} <span className="muted mono" style={{ fontSize: 13 }}>{slug}</span></h1><div className="sub">Huisstijl voor rapporten. {readonly ? 'Het standaardthema is alleen-lezen: maak een eigen thema om af te wijken.' : 'Alles wat je hier niet invult, komt uit het standaardthema.'}</div></div>
        <div className="actions">
          <button className="btn" onClick={() => doPreview('nl')} disabled={busy}>{busy ? 'Rendert…' : 'Proefrapport (nl)'}</button>
          <button className="btn" onClick={() => doPreview('en')} disabled={busy}>Proefrapport (en)</button>
          <button className="btn primary" onClick={save} disabled={readonly || !dirty}>Opslaan</button>
          {!readonly && <button className="btn ghost danger" onClick={async () => { if (confirmDialog('Thema verwijderen?')) { try { await api.del(`/api/themes/${slug}`); onChanged(); go('/clients'); } catch (e: any) { toast(e.message, true); } } }}>Verwijderen</button>}
        </div>
      </div>
      {t.warnings.length > 0 && <div className="notice">{t.warnings.map((w, i) => <div key={i}>{w.message}</div>)}</div>}
      <div className="tabs"><button className={mode === 'form' ? 'active' : ''} onClick={() => setMode('form')}>Instellingen</button><button className={mode === 'yaml' ? 'active' : ''} onClick={() => setMode('yaml')}>theme.yaml</button></div>

      {mode === 'yaml' ? <div className="panel"><textarea className="mono" rows={30} value={yaml} onChange={(e) => { setYaml(e.target.value); setDirty(true); }} readOnly={readonly} /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div>
            <div className="panel">
              <h2 style={{ marginTop: 0 }}>Aanbieder (op voorblad en in voettekst)</h2>
              <Field label="Thema-naam"><input type="text" value={get('name')} onChange={(e) => set('name', e.target.value)} readOnly={readonly} /></Field>
              <Field label="Bedrijfsnaam"><input type="text" value={get('provider.name')} onChange={(e) => set('provider.name', e.target.value)} readOnly={readonly} /></Field>
              <Field label="Adres (één regel per onderdeel)"><textarea rows={2} value={(d.provider?.address ?? []).join('\n')} onChange={(e) => set('provider.address', e.target.value.split('\n'))} readOnly={readonly} /></Field>
              <div className="grid2">
                <Field label="Website"><input type="text" value={get('provider.website')} onChange={(e) => set('provider.website', e.target.value)} readOnly={readonly} /></Field>
                <Field label="E-mail"><input type="text" value={get('provider.email')} onChange={(e) => set('provider.email', e.target.value)} readOnly={readonly} /></Field>
              </div>
            </div>
            <div className="panel">
              <h2 style={{ marginTop: 0 }}>Kleuren</h2>
              <div className="grid2">
                <Field label="Primair (koppen, voorblad)"><div style={{ display: 'flex', gap: 8 }}><input type="color" value={get('colors.primary') || '#0B2545'} onChange={(e) => set('colors.primary', e.target.value.toUpperCase())} disabled={readonly} style={{ width: 44, padding: 2 }} /><input type="text" value={get('colors.primary')} onChange={(e) => set('colors.primary', e.target.value)} readOnly={readonly} /></div></Field>
                <Field label="Accent (nummering, lijnen)" hint="Leeg = zelfde als primair"><div style={{ display: 'flex', gap: 8 }}><input type="color" value={get('colors.accent') || get('colors.primary') || '#1F7A8C'} onChange={(e) => set('colors.accent', e.target.value.toUpperCase())} disabled={readonly} style={{ width: 44, padding: 2 }} /><input type="text" value={get('colors.accent')} onChange={(e) => set('colors.accent', e.target.value)} readOnly={readonly} /></div></Field>
              </div>
              {t.resolved && <div className="small muted">Afgeleid: koppen {t.resolved.colors.headingColor}, tint {t.resolved.colors.primaryLight}. Severity-kleuren blijven de standaardkleuren tenzij je ze in theme.yaml overschrijft.</div>}
            </div>
            <div className="panel">
              <h2 style={{ marginTop: 0 }}>Typografie</h2>
              <datalist id="rf-fonts">{fontFamilies.map((f) => <option key={f} value={f} />)}</datalist>
              <div className="grid3">{fontSelect('heading', 'Koppen')}{fontSelect('body', 'Broodtekst')}{fontSelect('mono', 'Code')}</div>
              <Field label="Basisgrootte"><select value={get('fonts.base_size') || '10pt'} onChange={(e) => set('fonts.base_size', e.target.value)} disabled={readonly}>{['9pt', '9.5pt', '10pt', '10.5pt', '11pt'].map((s) => <option key={s}>{s}</option>)}</select></Field>
              <div className="field-label">Fontbestanden in dit thema</div>
              <ul className="small">{t.fonts.map((f) => <li key={f} className="mono">{f} <button className="btn small ghost" onClick={async () => { await api.del(`/api/themes/${slug}/assets/${encodeURIComponent(f)}`); load(); }}>×</button></li>)}{t.fonts.length === 0 && <li className="muted">Geen; Inter, JetBrains Mono en Source Serif 4 zijn altijd beschikbaar.</li>}</ul>
              <div className="small muted">Word gebruikt Calibri/Consolas tenzij je <code>fonts.docx_body</code>, <code>docx_heading</code> en <code>docx_mono</code> opgeeft (fonts worden niet in DOCX ingebed).</div>
            </div>
          </div>
          <div>
            <div className="panel">
              <h2 style={{ marginTop: 0 }}>Voorblad en beelden</h2>
              <Field label="Voorbladstijl"><select value={get('page.cover') || 'band'} onChange={(e) => set('page.cover', e.target.value)} disabled={readonly}><option value="band">Kleurband (standaard)</option><option value="image">Voorbladbeeld</option><option value="minimal">Typografisch, wit</option></select></Field>
              {assetSelect('logo', 'Logo', 'SVG heeft de voorkeur; PNG met transparantie kan ook.')}
              {assetSelect('logo_mono', 'Logo, monochroom (koptekst)', 'Grijze variant voor de kleine koptekst; leeg = het kleurlogo.')}
              {assetSelect('logo_header', 'Logo, koptekst', 'Apart logo voor de lopende koptekst; leeg = monochroom logo, anders het kleurlogo.')}
              <div className="grid3">
                <Field label="Koptekst: logo"><select value={get('page.header.logo') || 'right'} onChange={(e) => set('page.header.logo', e.target.value)} disabled={readonly}><option value="right">Rechts</option><option value="left">Links</option><option value="none">Geen logo</option></select></Field>
                <Field label="Koptekst: logohoogte" hint="4–8 mm"><input type="text" value={get('page.header.logo_height') || '5.5mm'} onChange={(e) => set('page.header.logo_height', e.target.value)} disabled={readonly} /></Field>
                <Field label="Koptekst: tekst"><select value={get('page.header.text') || 'both'} onChange={(e) => set('page.header.text', e.target.value)} disabled={readonly}><option value="both">Titel | klant</option><option value="title">Alleen titel</option><option value="client">Alleen klant</option><option value="none">Geen tekst</option></select></Field>
              </div>
              {assetSelect('cover_image', 'Voorbladbeeld', 'JPEG/PNG, minimaal 2000 px breed; wordt bovenaan het voorblad bijgesneden.')}
              {!readonly && <Field label="Bestand toevoegen" hint="Logo's (svg/png/jpg) en fonts (ttf/otf)."><input type="file" onChange={(e) => { if (e.target.files?.[0]) upload(e.target.files[0]); e.target.value = ''; }} /></Field>}
              <div className="actions">{t.assets.map((a) => <div key={a} className="panel tight" style={{ marginBottom: 0, width: 150 }}><img src={`/api/themes/${slug}/assets/${encodeURIComponent(a)}`} style={{ width: '100%', height: 60, objectFit: 'contain', background: '#F3F5F7' }} /><div className="small mono" style={{ wordBreak: 'break-all' }}>{a}</div>{!readonly && <button className="btn small ghost danger" onClick={async () => { if (confirmDialog(`${a} verwijderen?`)) { await api.del(`/api/themes/${slug}/assets/${encodeURIComponent(a)}`); load(); } }}>Verwijderen</button>}</div>)}</div>
            </div>
            <div className="panel">
              <h2 style={{ marginTop: 0 }}>Teksten</h2>
              <Field label="Disclaimer (nl)" hint="{client} wordt vervangen door de naam van de eindklant."><textarea rows={5} value={get('texts.disclaimer.nl')} onChange={(e) => set('texts.disclaimer.nl', e.target.value)} readOnly={readonly} /></Field>
              <Field label="Disclaimer (en)"><textarea rows={5} value={get('texts.disclaimer.en')} onChange={(e) => set('texts.disclaimer.en', e.target.value)} readOnly={readonly} /></Field>
            </div>
          </div>
        </div>
      )}
      {preview && <div className="panel"><h2 style={{ marginTop: 0 }}>Proefrapport</h2><p className="muted small">De voorbeeldopdracht gerenderd met dit thema; zo zie je direct of logo, kleuren en fonts kloppen.</p><iframe className="pdfframe" src={preview} title="Proefrapport" /></div>}
    </div>
  );
}
