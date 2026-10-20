import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const eng = ctx.engagement, tb = t.blocks.scope, fmt = (h as any).fmt;
  if (opts.layout === 'extended') return extended(ctx, theme, t, h);
  const out: Block[] = [h.h1(tb.title), h.p(tb.period_text.replace('{start}', fmt.period_start).replace('{end}', fmt.period_end) + ' ' + tb.intro)];
  const hasEnv = eng.scope.some((s: any) => s.environment);
  const header = [t.core.asset, t.core.type, ...(hasEnv ? [t.core.environment] : []), t.core.notes];
  const widths = hasEnv ? [52, 20, 24, 74] : [52, 20, 98];
  out.push(h.table([header, ...eng.scope.map((s: any) => [[h.mono(s.asset)], s.type ?? '', ...(hasEnv ? [s.environment ?? ''] : []), s.description ?? ''])], { widths }));
  if (eng.out_of_scope?.length) { out.push(h.h2(tb.out_of_scope)); for (const x of eng.out_of_scope) out.push(h.p(`• ${x}`)); }
  if (eng.limitations) out.push(h.h2(tb.limitations), ...h.md(eng.limitations));
  return out;
}

async function extended(ctx: any, theme: any, t: any, h: Helpers): Promise<Block[]> {
  const eng = ctx.engagement, tb = t.blocks.scope, fmt = (h as any).fmt, intake = eng.intake ?? {};
  const out: Block[] = [h.h1(tb.title_extended)];
  if (intake.goal) out.push(h.h2(tb.objective, { numbered: false }), ...h.md(intake.goal));
  out.push(h.h2(tb.in_scope, { numbered: false }));
  const hasEnv = eng.scope.some((s: any) => s.environment), hasAcc = eng.scope.some((s: any) => s.access), hasDesc = eng.scope.some((s: any) => s.description);
  const header = [t.core.asset, t.core.type, ...(hasEnv ? [t.core.environment] : []), ...(hasAcc ? [tb.access] : []), ...(hasDesc ? [t.core.notes] : [])];
  const widths = [50, 26, ...(hasEnv ? [24] : []), ...(hasAcc ? [30] : [])];
  const used = widths.reduce((a, b) => a + b, 0);
  if (hasDesc) widths.push(h.textWidthMm - used); else widths[widths.length - 1] += h.textWidthMm - used;
  out.push(h.table([header, ...eng.scope.map((s: any) => [[h.mono(s.asset)], s.type ?? '', ...(hasEnv ? [s.environment ?? ''] : []), ...(hasAcc ? [s.access ?? ''] : []), ...(hasDesc ? [s.description ?? ''] : [])])], { widths }));
  const conds: Array<[string, string]> = [];
  if (intake.test_window) conds.push([tb.test_window, intake.test_window]);
  const rt = (fmt.planning as any[]).find((p) => /hertest|retest/i.test(p.phase));
  if (eng.retest) conds.push([t.core.retest, fmt.retest_date]); else if (rt) conds.push([t.core.retest, `${rt.start_short} – ${rt.end_short}`]);
  if (intake.test_type) conds.push([tb.test_type, intake.test_type]);
  for (const p of (eng.client.contact ?? []).slice(0, 2)) conds.push([p.role ?? tb.contact, p.name]);
  if (intake.emergency_contact) conds.push([tb.escalation, intake.emergency_contact]);
  const left: Block[] = [];
  if (eng.out_of_scope?.length) { left.push(h.h2(tb.out_of_scope, { numbered: false })); for (const x of eng.out_of_scope) left.push(h.p(`• ${x}`)); }
  if (eng.limitations) left.push(h.h2(tb.limitations, { numbered: false }), ...h.md(eng.limitations));
  const right: Block[] = conds.length ? [h.h2(tb.conditions, { numbered: false }), h.table(conds.map(([k, v]) => [[h.muted(k, 8.5)], [h.run(v, { size: h.PT(9) } as any)]]), { widths: [30, 50], header: false })] : [];
  out.push(h.spacer(4), h.columns([left, right], [82, 82]));
  if (eng.accounts?.length) out.push(h.h2(tb.accounts, { numbered: false }), h.table([[t.core.role, tb.account, tb.rights], ...eng.accounts.map((a: any) => [a.role, a.account ?? '–', a.rights ?? '–'])], { widths: [28, 28, 28] }));
  else if (intake.credentials) out.push(h.h2(tb.accounts, { numbered: false }), ...h.md(intake.credentials));
  return out;
}
