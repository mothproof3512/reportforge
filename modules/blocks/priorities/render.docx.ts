import { Paragraph, TextRun } from 'docx';
import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const tb = t.blocks.priorities, c = theme.colors;
  const out: Block[] = [h.h1(tb.title, { numbered: false })];
  if (!ctx.findings.length) { out.push(h.p(tb.none)); return out; }
  const n = Math.min(opts.top_n ?? 3, ctx.findings.length);
  out.push(h.h2(tb.top.replace('{n}', String(n)), { numbered: false }));
  const cards = ctx.findings.slice(0, n).map((f: any, i: number) => [
    h.p([new TextRun({ text: String(i + 1), font: h.fonts.heading, size: h.PT(20), bold: true, color: c.accent.replace('#', '') }), h.run('   '), h.mono(f.id), h.run('  '), h.sevBadge(f.severity)]),
    h.p([h.run(tb.what + ' · ', { bold: true, size: h.PT(8.5) } as any), h.run(f.brief?.what ?? '', { size: h.PT(8.5) } as any)]),
    h.p([h.run(tb.todo + ' · ', { bold: true, size: h.PT(8.5) } as any), h.run(f.brief?.action ?? '', { size: h.PT(8.5) } as any)]),
  ]);
  out.push(h.table([cards], { header: false, widths: Array(n).fill(h.textWidthMm / n) }));
  if (opts.matrix !== false) {
    out.push(h.spacer(8), h.h2(tb.matrix_title, { numbered: false }));
    const placed = ctx.findings.filter((f: any) => typeof f.risk.details.impact === 'number' && typeof f.risk.details.likelihood === 'number');
    const rows: any[] = [];
    for (let i = 5; i >= 1; i--) {
      const row: any[] = [[h.muted(String(i), 8)]];
      for (let l = 1; l <= 5; l++) {
        const ids = placed.filter((f: any) => f.risk.details.impact === i && f.risk.details.likelihood === l).map((f: any) => f.id);
        const p = i * l, sev = p >= 20 ? 'critical' : p >= 12 ? 'high' : p >= 6 ? 'medium' : p >= 2 ? 'low' : 'info';
        row.push([new Paragraph({ children: [new TextRun({ text: ids.join(', ') || ' ', font: h.fonts.mono, size: h.PT(7), bold: true, color: c.severityText[sev].replace('#', '') })], shading: { type: 'clear' as any, fill: c.severity[sev].replace('#', '') }, spacing: { after: 0 } })]);
      }
      rows.push(row);
    }
    rows.push([[h.muted('', 8)], ...[1, 2, 3, 4, 5].map((l) => [h.muted(String(l), 8)])]);
    out.push(h.table(rows, { header: false, widths: [8, 15, 15, 15, 15, 15], aligns: ['left', 'center', 'center', 'center', 'center', 'center'] }));
    out.push(h.p([h.muted(`${tb.impact} ↑  ·  ${tb.likelihood} →`, 8)]), h.p(tb.matrix_intro), h.box([h.p([h.run(tb.matrix_note, { size: h.PT(8.5) } as any)])], { accent: c.accent }), h.p([h.muted(tb.deviation_note, 8)]));
    if (placed.some((f: any) => f.risk.details.derived)) out.push(h.p([h.muted(tb.derived_note, 7.5)]));
  }
  return out;
}
