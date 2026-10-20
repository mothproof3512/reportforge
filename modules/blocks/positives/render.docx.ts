import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const eng = ctx.engagement, tb = t.blocks.positives;
  if (!eng.positives) return [];
  return [h.h1(tb.title), h.subtitle(tb.subtitle), ...h.md(eng.positives)];
}
