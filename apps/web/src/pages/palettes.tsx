import { useEffect, useState } from 'react';
import { api } from '../api';

interface Combo { number: number; top?: number; colors: Array<{ name: string; hex: string }>; roles?: { primary: string; accent: string; surface?: string }; report_fit?: number; theme?: { primary: string; accent: string; surface: string; calloutBg: string } }
interface Palette { id: string; name: string; year?: number; colors?: number; combinations: Combo[] }

/** Colour combinations from a palette module (Sanzo Wada), applied to a theme with one click. */
export function PalettePicker({ current, onPick }: { current: { primary: string; accent: string }; onPick: (c: { primary: string; accent: string; surface: string; calloutBg: string }) => void }) {
  const [pals, setPals] = useState<Palette[]>([]);
  const [all, setAll] = useState(false);
  const [q, setQ] = useState('');
  useEffect(() => { api.get<Palette[]>('/api/palettes').then(setPals).catch(() => setPals([])); }, []);
  if (!pals.length) return null;
  const pal = pals[0];
  const fitting = pal.combinations.filter((c) => c.theme);
  let list = all ? fitting.sort((a, b) => (b.report_fit ?? 0) - (a.report_fit ?? 0)) : fitting.filter((c) => c.top).sort((a, b) => a.top! - b.top!);
  if (q.trim()) { const needle = q.trim().toLowerCase(); list = list.filter((c) => String(c.number) === needle || c.colors.some((x) => x.name.toLowerCase().includes(needle))); }
  const isCurrent = (c: Combo) => c.theme && c.theme.primary.toUpperCase() === (current.primary || '').toUpperCase() && c.theme.accent.toUpperCase() === (current.accent || '').toUpperCase();
  return (
    <div style={{ marginTop: 14 }}>
      <div className="field-label">Kleurcombinaties — {pal.name} ({pal.year})</div>
      <div className="muted small" style={{ marginBottom: 8 }}>{all ? `Alle ${fitting.length} combinaties uit het boek die op wit papier werken (donkere kop, leesbaar accent), gesorteerd op geschiktheid.` : 'De 30 combinaties uit het boek die het best passen bij een rapportage: een diepe kleur voor koppen en voorblad, een contrasterend accent voor nummering en kaders, en een lichte tint voor vlakken. Severity-kleuren blijven ongewijzigd.'}</div>
      <div className="actions" style={{ marginBottom: 8 }}>
        <input type="text" placeholder="Zoek op kleurnaam of nummer…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 260 }} />
        <label className="small"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> alle geschikte combinaties</label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
        {list.map((c) => (
          <button key={c.number} type="button" className="btn" title={`Combinatie ${c.number}: ${c.colors.map((x) => x.name).join(' · ')}`} onClick={() => onPick(c.theme!)} style={{ padding: 6, textAlign: 'left', display: 'block', border: isCurrent(c) ? '2px solid var(--accent, #1F7A8C)' : undefined }}>
            <div style={{ display: 'flex', height: 34, borderRadius: 3, overflow: 'hidden' }}>{c.colors.map((x) => <div key={x.name} style={{ flex: 1, background: x.hex }} />)}</div>
            <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
              <span style={{ flex: 2, height: 10, background: c.theme!.primary, borderRadius: 2 }} title={`Primair ${c.theme!.primary}`} />
              <span style={{ flex: 1, height: 10, background: c.theme!.accent, borderRadius: 2 }} title={`Accent ${c.theme!.accent}`} />
              <span style={{ flex: 1, height: 10, background: c.theme!.surface, borderRadius: 2, border: '1px solid #e3e6ea' }} title={`Vlak ${c.theme!.surface}`} />
            </div>
            <div className="small" style={{ marginTop: 4, lineHeight: 1.25 }}><span className="mono muted">#{c.number}</span>{c.top ? <span className="muted"> · top {c.top}</span> : null}<br />{c.colors.map((x) => x.name).join(' · ')}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
