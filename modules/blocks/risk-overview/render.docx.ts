import { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle } from 'docx';
import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const tb = t.blocks['risk-overview'], c = theme.colors;
  const hx = (s: string) => s.replace('#', '');
  const out: Block[] = [h.h1(tb.title)];
  if (!ctx.findings.length) { out.push(h.p(tb.none)); return out; }
  out.push(h.h2(tb.distribution));
  // bars: a 3-column table with a shaded cell proportional to the count
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const mx = Math.max(1, ...(h as any).severities.map((s: any) => s.count));
  const rows = (h as any).severities.map((s: any) => {
    const w = Math.max(1, Math.round(120 * s.count / mx));
    return new TableRow({ children: [
      new TableCell({ width: { size: h.MM(24), type: WidthType.DXA }, borders: { top: none, bottom: none, left: none, right: none }, children: [h.p([h.run(s.label, { size: h.PT(9) } as any)], { spacing: { after: 0 } })] }),
      new TableCell({ width: { size: h.MM(w), type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: hx(c.severity[s.id]) }, borders: { top: none, bottom: none, left: none, right: none }, children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: ' ', size: h.PT(8) })] })] }),
      new TableCell({ width: { size: h.MM(146 - w), type: WidthType.DXA }, borders: { top: none, bottom: none, left: none, right: none }, children: [h.p([h.run('  ' + s.count, { bold: true, size: h.PT(9) } as any)], { spacing: { after: 0 } })] }),
    ] });
  });
  out.push(new Table({ rows, width: { size: h.MM(170), type: WidthType.DXA }, borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none } }), h.spacer(6));
  if (ctx.engagement.risk_model === 'matrix') {
    out.push(h.h2(tb.matrix));
    const grid: any[] = [];
    for (let i = 5; i >= 1; i--) {
      const row: any[] = [[h.muted(String(i), 8)]];
      for (let l = 1; l <= 5; l++) {
        const ids = ctx.findings.filter((f: any) => f.risk.details.impact === i && f.risk.details.likelihood === l).map((f: any) => f.id);
        row.push([h.run(ids.join(', '), { bold: true, size: h.PT(7.5) } as any)]);
      }
      grid.push(row);
    }
    grid.push([[h.muted(`${tb.impact} ↑ / ${tb.likelihood} →`, 7)], ...[1, 2, 3, 4, 5].map((l) => [h.muted(String(l), 8)])]);
    out.push(h.table(grid, { widths: [20, 30, 30, 30, 30, 30], header: false, aligns: ['left', 'center', 'center', 'center', 'center', 'center'] }), h.spacer(6));
  }
  out.push(h.h2(tb.all_findings));
  out.push(h.table([['ID', t.core.finding, t.core.severity, t.core.score, t.core.status], ...ctx.findings.map((f: any) => [[h.run(f.id, { bold: true, size: h.PT(9) } as any)], [h.run(f.title, { size: h.PT(9) } as any)], [h.badge(f.severity)], [h.run(f.risk.label, { size: h.PT(9) } as any)], [h.run(f.retest ? (t.core.retest_status[f.retest.status] ?? f.retest.status) : f.status, { size: h.PT(9) } as any)]])], { widths: [14, 90, 22, 16, 28], aligns: ['left', 'left', 'left', 'right', 'left'] }));
  if (opts.by_standard !== false) {
    const items = new Map<string, { title: string; ids: string[] }>();
    for (const f of ctx.findings) for (const m of f.mapping) { const cur = items.get(m.item) ?? { title: m.title ?? "", ids: [] as string[] }; cur.ids.push(f.id); items.set(m.item, cur); }
    if (items.size) {
      out.push(h.h2(tb.by_standard));
      out.push(h.table([[t.core.standards, '', t.core.findings], ...[...items.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [[h.mono(k)], v.title, v.ids.join(', ')])], { widths: [34, 96, 40] }));
    }
  }
  return out;
}
