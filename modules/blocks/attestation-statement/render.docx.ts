import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const eng = ctx.engagement, tb = t.blocks['attestation-statement'], at = eng.attestation ?? {}, fmt = (h as any).fmt;
  const out: Block[] = [h.h1(tb.title, { numbered: false, pageBreak: false })];
  out.push(...(at.statement ? h.md(at.statement) : [h.p(tb.statement.replaceAll('{provider}', theme.provider.name).replaceAll('{client}', eng.client.name).replaceAll('{start}', fmt.period_start).replaceAll('{end}', fmt.period_end))]));
  if (eng.retest) out.push(h.p(tb.statement_retest.replaceAll('{retest_date}', fmt.retest_date).replaceAll('{of_version}', eng.retest.of_version)));
  out.push(h.h2(tb.scope_title, { numbered: false }));
  for (const s of eng.scope) out.push(h.p([h.run('• '), h.mono(s.asset), h.run(s.description ? ` — ${s.description}` : '')]));
  if (at.scope_note) out.push(...h.md(at.scope_note));
  out.push(h.h2(tb.method_title, { numbered: false }));
  for (const s of ctx.standards) out.push(h.p(`• ${s.name}${s.version && !s.name.includes(s.version) ? ` (${s.version})` : ''}`));
  out.push(h.p(`• ${t.core.risk_model[eng.risk_model]}`));
  out.push(h.h2(tb.limits_title, { numbered: false }), h.p(tb.limits.replaceAll('{client}', eng.client.name).replace('..', '.')));
  return out;
}
