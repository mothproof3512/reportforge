/** List editor for theme.page.decorations: SVG/PNG layers behind the page content. */
export interface DecorationRow { image: string; anchor?: string; dx?: string; dy?: string; width?: string; rotate?: string; opacity?: number; blur?: number; tint?: string; pages?: string }

const ANCHORS: Array<[string, string]> = [['top-left', 'linksboven'], ['top', 'boven'], ['top-right', 'rechtsboven'], ['left', 'links'], ['center', 'midden'], ['right', 'rechts'], ['bottom-left', 'linksonder'], ['bottom', 'onder'], ['bottom-right', 'rechtsonder']];
const PAGES: Array<[string, string]> = [['content', 'alle pagina\'s behalve voorblad'], ['all', 'alle pagina\'s incl. voorblad'], ['odd', 'oneven pagina\'s'], ['even', 'even pagina\'s'], ['cover', 'alleen voorblad'], ['first', 'alleen eerste pagina na voorblad'], ['last', 'alleen laatste pagina']];
const TINTS: Array<[string, string]> = [['primary', 'primaire kleur'], ['accent', 'accentkleur'], ['ink', 'tekstkleur'], ['muted', 'grijs']];

export function DecorationsEditor({ value, onChange, assets, shapes, readonly, builtin, onBuiltin }: { value: DecorationRow[]; onChange: (v: DecorationRow[]) => void; assets: string[]; shapes: string[]; readonly: boolean; builtin: string; onBuiltin: (v: string) => void }) {
  const upd = (i: number, patch: Partial<DecorationRow>) => onChange(value.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, d: number) => { const n = [...value]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); onChange(n); };
  const num = (s: string | undefined, unit: string, dflt: number) => { const m = String(s ?? '').match(/-?\d+(\.\d+)?/); return m ? Number(m[0]) : dflt; };
  const options = [...shapes.map((s) => ({ v: s, l: `${s.replace(/\.(svg|png)$/i, '')} (meegeleverd)` })), ...assets.map((a) => ({ v: a, l: `${a} (thema)` }))];
  return (
    <div>
      <div className="actions" style={{ marginBottom: 8 }}>
        <select value={builtin} onChange={(e) => onBuiltin(e.target.value)} disabled={readonly} style={{ width: 'auto' }}><option value="none">Geen ingebouwde versiering</option><option value="arcs">Ingebouwd: wisselende ringen links/rechts</option></select>
        {!readonly && <button className="btn small" type="button" onClick={() => onChange([...value, { image: shapes[0] ?? assets[0] ?? 'ring.svg', anchor: 'bottom-right', dx: '40mm', dy: '40mm', width: '160mm', rotate: '0deg', opacity: 0.08, blur: 0, tint: 'primary', pages: 'content' }])}>+ Laag</button>}
      </div>
      {value.map((r, i) => (
        <div key={i} className="panel tight" style={{ marginBottom: 8 }}>
          <div className="grid3">
            <label className="small">Afbeelding<select value={r.image} onChange={(e) => upd(i, { image: e.target.value })} disabled={readonly}>{!options.some((o) => o.v === r.image) && <option value={r.image}>{r.image}</option>}{options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></label>
            <label className="small">Pagina's<select value={r.pages ?? 'content'} onChange={(e) => upd(i, { pages: e.target.value })} disabled={readonly}>{PAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label className="small">Kleur<select value={r.tint ?? 'primary'} onChange={(e) => upd(i, { tint: e.target.value })} disabled={readonly}>{TINTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}{/^#/.test(r.tint ?? '') && <option value={r.tint}>{r.tint}</option>}</select></label>
          </div>
          <div className="grid3">
            <label className="small">Positie (anker)<select value={r.anchor ?? 'bottom-right'} onChange={(e) => upd(i, { anchor: e.target.value })} disabled={readonly}>{ANCHORS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label className="small">Verschuiving → (mm)<input type="number" step={5} value={num(r.dx, 'mm', 0)} onChange={(e) => upd(i, { dx: `${e.target.value}mm` })} readOnly={readonly} /></label>
            <label className="small">Verschuiving ↓ (mm)<input type="number" step={5} value={num(r.dy, 'mm', 0)} onChange={(e) => upd(i, { dy: `${e.target.value}mm` })} readOnly={readonly} /></label>
          </div>
          <div className="grid3">
            <label className="small">Breedte (mm)<input type="number" step={10} min={10} max={600} value={num(r.width, 'mm', 120)} onChange={(e) => upd(i, { width: `${e.target.value}mm` })} readOnly={readonly} /></label>
            <label className="small">Rotatie (°)<input type="number" step={5} min={-180} max={180} value={num(r.rotate, 'deg', 0)} onChange={(e) => upd(i, { rotate: `${e.target.value}deg` })} readOnly={readonly} /></label>
            <label className="small">Vervaging (0 = scherp)<input type="number" step={1} min={0} max={50} value={r.blur ?? 0} onChange={(e) => upd(i, { blur: Number(e.target.value) })} readOnly={readonly} /></label>
          </div>
          <label className="small">Transparantie: {Math.round((r.opacity ?? 0.1) * 100)}% zichtbaar<input type="range" min={1} max={100} value={Math.round((r.opacity ?? 0.1) * 100)} onChange={(e) => upd(i, { opacity: Number(e.target.value) / 100 })} disabled={readonly} style={{ width: '100%' }} /></label>
          {!readonly && <div className="actions" style={{ marginTop: 6 }}><button className="btn small ghost" type="button" onClick={() => move(i, -1)} disabled={i === 0}>↑</button><button className="btn small ghost" type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1}>↓</button><button className="btn small ghost danger" type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}>Verwijderen</button></div>}
        </div>
      ))}
      {value.length === 0 && <div className="muted small">Geen lagen. Voeg een laag toe en klik daarna Proefrapport.</div>}
    </div>
  );
}
