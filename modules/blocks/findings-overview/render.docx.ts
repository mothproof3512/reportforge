import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const tb = t.blocks['findings-overview'], c = theme.colors;
  const hasRetest = ctx.findings.some((f: any) => f.retest);
  const out: Block[] = [h.h1(tb.title), h.subtitle(tb.subtitle.replace('{n}', String(ctx.findings.length)).replace('{retest}', hasRetest ? tb.subtitle_retest : ''))];
  if (!ctx.findings.length) { out.push(h.p(tb.none)); return out; }
  const asset = (f: any) => f.affected.length === 0 ? '—' : f.affected.length <= 2 ? f.affected.join(', ') : `${f.affected[0]} (+${f.affected.length - 1})`;
  const header = ['ID', t.core.finding, t.core.asset, t.core.severity, t.core.score, tb.at_delivery, ...(hasRetest ? [tb.after_retest] : [])];
  const widths = hasRetest ? [13, 44, 36, 24, 13, 20, 20] : [13, 60, 40, 24, 13, 20];
  out.push(h.table([header, ...ctx.findings.map((f: any) => [[h.mono(f.id)], f.title, [h.mono(asset(f))], [h.sevBadge(f.severity)], [h.mono(f.risk.label)], [h.pill(t.core.open, c.severity.high)], ...(hasRetest ? [[h.statusPill(f)]] : [])])], { widths }));
  if (opts.tiles !== false) {
    const st = ctx.stats.bySeverity;
    out.push(h.spacer(8), h.columns([h.stat(String(st.critical), t.severity.critical, st.critical ? c.severity.critical : undefined), h.stat(String(st.high), t.severity.high, st.high ? c.severity.high : undefined), h.stat(String(st.medium), t.severity.medium), h.stat(String(st.low + st.info), tb.low_info)], [40, 40, 40, 40]));
  }
  return out;
}
