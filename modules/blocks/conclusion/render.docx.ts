import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const eng = ctx.engagement, tb = t.blocks.conclusion;
  const out: Block[] = [h.h1(tb.title)];
  if (eng.conclusion) out.push(...h.md(eng.conclusion));
  else if (ctx.stats.total === 0) out.push(h.p(tb.auto_none.replace('{provider}', theme.provider.name)));
  else out.push(h.p(tb.auto.replaceAll('{total}', String(ctx.stats.total)).replaceAll('{highest}', h.sevLabel(ctx.stats.highest).toLowerCase()).replaceAll('{provider}', theme.provider.name)));
  if (eng.recommendations) out.push(h.h2(tb.recommendations), ...h.md(eng.recommendations));
  return out;
}
