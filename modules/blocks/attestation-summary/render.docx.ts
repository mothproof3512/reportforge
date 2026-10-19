import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const eng = ctx.engagement, tb = t.blocks['attestation-summary'], st = ctx.stats, c = theme.colors, sev = (h as any).severities as any[];
  const hasRetest = !!eng.retest;
  const out: Block[] = [h.h1(tb.title, { numbered: false, pageBreak: false })];
  if (!st.total) { out.push(h.p(tb.none)); return out; }
  const openTotal = sev.reduce((a, s) => a + s.open, 0);
  out.push(h.p(hasRetest ? tb.intro_retest.replace('{total}', String(st.total)).replace('{resolved}', String(st.total - openTotal)).replace('{open}', String(openTotal)) : tb.intro.replace('{total}', String(st.total))));
  const rows: any[] = [[t.core.severity, tb.found, ...(hasRetest ? [tb.open_after] : [])], ...sev.map((s) => [[h.badge(s.id)], String(s.count), ...(hasRetest ? [String(s.open)] : [])]), [[h.run(t.core.total, { bold: true } as any)], [h.run(String(st.total), { bold: true } as any)], ...(hasRetest ? [[h.run(String(openTotal), { bold: true } as any)]] : [])]];
  out.push(h.table(rows, { widths: hasRetest ? [40, 30, 34] : [40, 30], aligns: ['left', 'right', 'right'] }), h.spacer(6));
  const nHigh = hasRetest ? st.openBySeverity.critical + st.openBySeverity.high : st.bySeverity.critical + st.bySeverity.high;
  const at = eng.attestation ?? {};
  if (at.conclusion) out.push(...h.md(at.conclusion));
  else out.push(h.box([h.p(nHigh === 0 ? tb.conclusion_none_high : tb.conclusion_open_high.replace('{n}', String(nHigh)).replace('{provider}', theme.provider.name))], { accent: nHigh === 0 ? c.severity.low : c.severity.high }), h.spacer(6));
  return out;
}
