import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const tp = ctx.engagement.testplan ?? {}, tb = t.blocks['testplan-approach'];
  const out: Block[] = [h.h1(tb.title), ...(tp.approach ? h.md(tp.approach) : [h.p(tb.none)])];
  if (tp.per_scope?.length) out.push(h.h2(tb.per_scope), h.table([[t.core.asset, tb.title], ...tp.per_scope.map((p: any) => [[h.mono(p.asset)], p.approach])], { widths: [60, 110] }));
  if (tp.planning?.length) out.push(h.h2(tb.planning), h.table([[tb.phase, tb.from, tb.to, t.core.notes], ...tp.planning.map((p: any) => [p.phase, p.start ?? '', p.end ?? '', p.notes ?? ''])], { widths: [60, 28, 28, 54] }));
  if (tp.go_nogo) out.push(h.h2(tb.go_nogo), ...h.md(tp.go_nogo));
  return out;
}
