import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const tb = t.blocks['findings-intro'];
  if (opts.layout === 'extended') return [h.h1(tb.title_extended), h.p([h.muted(ctx.findings.length ? tb.intro_short : tb.none, 9.5)])];
  return [h.h1(tb.title), h.p(ctx.findings.length ? tb.intro : tb.none)];
}
