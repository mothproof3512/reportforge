import { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, AlignmentType } from 'docx';
import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const eng = ctx.engagement, tb = t.blocks['executive-summary'], st = ctx.stats, c = theme.colors;
  const hx = (s: string) => s.replace('#', '');
  const out: Block[] = [h.h1(tb.title)];
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const tiles = new Table({
    rows: [new TableRow({ children: (h as any).severities.map((s: any) => new TableCell({
      width: { size: h.MM(34), type: WidthType.DXA }, margins: { top: h.MM(2), bottom: h.MM(2), left: h.MM(2.5), right: h.MM(2.5) },
      shading: { type: ShadingType.CLEAR, fill: hx(s.count > 0 ? c.severity[s.id] : c.surface) },
      borders: { top: none, bottom: none, left: { style: BorderStyle.SINGLE, size: 24, color: 'FFFFFF' }, right: { style: BorderStyle.SINGLE, size: 24, color: 'FFFFFF' } },
      children: [
        new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: String(s.count), bold: true, size: h.PT(20), color: hx(s.count > 0 ? c.severityText[s.id] : c.muted), font: h.fonts.body })] }),
        new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: s.label.toUpperCase(), bold: true, size: h.PT(7), characterSpacing: 30, color: hx(s.count > 0 ? c.severityText[s.id] : c.muted), font: h.fonts.body })] }),
      ],
    })) })],
    width: { size: h.MM(170), type: WidthType.DXA }, columnWidths: [34, 34, 34, 34, 34].map(h.MM),
    borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
  });
  out.push(tiles, h.spacer(8));
  if (eng.executive_summary) out.push(...h.md(eng.executive_summary));
  else {
    const vars: Record<string, string> = { provider: theme.provider.name, client: eng.client.name, start: (h as any).fmt.period_start, end: (h as any).fmt.period_end, scope_count: String(eng.scope.length), total: String(st.total), critical: String(st.bySeverity.critical), high: String(st.bySeverity.high), medium: String(st.bySeverity.medium), low: String(st.bySeverity.low), info: String(st.bySeverity.info) };
    let s = tb.auto_intro; for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
    out.push(h.p(s), h.p([h.muted(tb.auto_note, 8.5)]));
  }
  const top = ctx.findings.filter((f: any) => f.severity !== 'info').slice(0, opts.top_n ?? 5);
  if (top.length) {
    out.push(h.h2(tb.top_findings, { numbered: false }));
    out.push(h.table([['ID', t.core.finding, t.core.severity, t.core.score], ...top.map((f: any) => [[h.run(f.id, { bold: true, size: h.PT(9) } as any)], [h.run(f.title, { size: h.PT(9) } as any)], [h.badge(f.severity)], [h.run(f.risk.label, { size: h.PT(9) } as any)]])], { widths: [16, 112, 24, 18], aligns: ['left', 'left', 'left', 'right'] }));
  } else if (st.total === 0) out.push(h.box([h.p(tb.no_findings)], { accent: c.severity.low }));
  return out;
}
