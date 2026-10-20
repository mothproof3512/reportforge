import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const eng = ctx.engagement, tb = t.blocks['executive-dashboard'], st = ctx.stats, c = theme.colors, fmt = (h as any).fmt;
  const w = opts.weights ?? { critical: 25, high: 10, medium: 4, low: 1, info: 0 };
  const th = opts.thresholds ?? { excellent: 90, good: 75, moderate: 50 };
  const openF = ctx.findings.filter((f: any) => !f.retest || !['resolved', 'risk-accepted'].includes(f.retest.status));
  const score = Math.max(0, 100 - openF.reduce((a: number, f: any) => a + (w[f.severity] ?? 0), 0));
  const label = score >= th.excellent ? tb.excellent : score >= th.good ? tb.good : score >= th.moderate ? tb.moderate : tb.poor;
  const out: Block[] = [h.h1(tb.title)];
  const left: Block[] = [];
  if (eng.executive_summary) left.push(...h.md(eng.executive_summary));
  else {
    const vars: Record<string, string> = { '{provider}': theme.provider.name, '{client}': eng.client.name, '{start}': fmt.period_start, '{end}': fmt.period_end, '{scope_count}': String(eng.scope.length), '{total}': String(st.total), '{critical}': String(st.bySeverity.critical), '{high}': String(st.bySeverity.high), '{medium}': String(st.bySeverity.medium), '{low}': String(st.bySeverity.low), '{info}': String(st.bySeverity.info) };
    let txt = tb.auto_intro as string; for (const [k, v] of Object.entries(vars)) txt = txt.split(k).join(v);
    left.push(h.p(txt), h.p([h.muted(tb.auto_note, 8.5)]));
  }
  const right: Block[] = [
    h.columns([h.stat(String(st.total), tb.findings_at_delivery), h.stat(String(st.bySeverity.critical), t.severity.critical, st.bySeverity.critical ? c.severity.critical : undefined)], [28, 28]),
    h.columns([h.stat(String(st.bySeverity.high), t.severity.high, st.bySeverity.high ? c.severity.high : undefined), h.stat(String(openF.length), tb.open_findings)], [28, 28]),
  ];
  if (opts.score !== false) right.push(h.box([h.p([h.run(tb.score_title.replace('{provider}', theme.provider.short ?? theme.provider.name), { bold: true, size: h.PT(9.5) } as any)]), h.p([h.run(String(score), { bold: true, size: h.PT(24), color: (c.headingColor as string).replace('#', '') } as any), h.run('   '), h.muted(label, 9)])], { accent: c.accent, width: 58 }));
  const sev = (h as any).severities as Array<{ id: string; label: string; count: number; open: number }>;
  const mx = Math.max(1, ...sev.map((s) => s.count));
  right.push(h.spacer(4), h.p([h.run(tb.per_severity, { bold: true, size: h.PT(9.5) } as any)]));
  right.push(h.table(sev.map((s) => [[h.sevBadge(s.id as any)], [h.run('█'.repeat(Math.max(1, Math.round((s.count / mx) * 12))), { color: c.severity[s.id].replace('#', ''), size: h.PT(8) } as any), h.run('  ' + s.count, { bold: true, size: h.PT(9) } as any)]]), { widths: [20, 36], header: false }));
  out.push(h.columns([left, right], [98, 64]));
  return out;
}
