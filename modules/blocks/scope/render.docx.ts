import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const eng = ctx.engagement, tb = t.blocks.scope, fmt = (h as any).fmt;
  const out: Block[] = [h.h1(tb.title), h.p(tb.period_text.replace('{start}', fmt.period_start).replace('{end}', fmt.period_end) + ' ' + tb.intro)];
  const hasEnv = eng.scope.some((s: any) => s.environment);
  const header = [t.core.asset, t.core.type, ...(hasEnv ? [t.core.environment] : []), t.core.notes];
  const widths = hasEnv ? [52, 20, 24, 74] : [52, 20, 98];
  out.push(h.table([header, ...eng.scope.map((s: any) => [[h.mono(s.asset)], s.type ?? '', ...(hasEnv ? [s.environment ?? ''] : []), s.description ?? ''])], { widths }));
  if (eng.out_of_scope?.length) { out.push(h.h2(tb.out_of_scope)); for (const x of eng.out_of_scope) out.push(h.p(`• ${x}`)); }
  if (eng.limitations) out.push(h.h2(tb.limitations), ...h.md(eng.limitations));
  return out;
}
