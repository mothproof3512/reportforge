import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const tb = t.blocks['appendix-severity'], model = ctx.engagement.risk_model, c = theme.colors;
  const sev = (h as any).severities as any[];
  const ranges = model === 'matrix' ? ['20 – 25', '12 – 19', '6 – 11', '2 – 5', '1'] : ['9.0 – 10.0', '7.0 – 8.9', '4.0 – 6.9', '0.1 – 3.9', 'n.v.t.'];
  if (opts.layout !== 'extended') {
    const out: Block[] = [h.h1(tb.title, { numbered: false }), h.p(model === 'matrix' ? tb.matrix_intro : tb.cvss_intro.replace('{model}', t.core.risk_model[model]))];
    out.push(h.table([[tb.range, tb.level, tb.meaning], ...sev.map((s: any, i: number) => [ranges[i], [h.badge(s.id)], tb[s.id]])], { widths: [24, 26, 120] }));
    out.push(h.h2(tb.status_title, { numbered: false }));
    for (const k of ['status_confirmed', 'status_likely', 'status_fp']) out.push(h.p(`• ${tb[k]}`));
    return out;
  }
  const w = opts.weights ?? { critical: 25, high: 10, medium: 4, low: 1, info: 0 };
  const short = theme.provider.short ?? theme.provider.name;
  const out: Block[] = [h.h1(tb.title_extended), h.subtitle(tb.subtitle), h.h2(tb.weighting, { numbered: false })];
  out.push(h.p(model === 'matrix' ? tb.matrix_intro : tb.weighting_text.replace('{model}', t.core.risk_model[model]).replace('{provider}', short).replace('{weights}', sev.map((s) => `${s.label} ${w[s.id] ?? 0}`).join(', '))));
  const terms = [tb.term_critical, tb.term_high, tb.term_medium, tb.term_low, tb.term_info];
  out.push(h.h2(tb.classes_title, { numbered: false }), h.table([[tb.level, t.core.risk_model[model], tb.meaning, tb.term], ...sev.map((s, i) => [[h.sevBadge(s.id)], [h.mono(ranges[i])], tb[s.id + '_short'], terms[i]])], { widths: [26, 24, 86, 34] }));
  const left: Block[] = [h.h2(tb.shapes_title, { numbered: false }), h.p(tb.shapes_text), h.p(sev.flatMap((s) => [h.sevBadge(s.id), h.run('  ')]))];
  const right: Block[] = [h.h2(tb.status_remediation, { numbered: false }), h.p(tb.status_remediation_text), h.p([h.pill(t.core.resolved, c.severity.low), h.run('  '), h.pill(t.core.partially_resolved, c.severity.medium), h.run('  '), h.pill(t.core.open, c.severity.high), h.run('  '), h.pill(t.core.retest_status['risk-accepted'], c.muted)])];
  out.push(h.columns([left, right], [82, 82]));
  return out;
}
