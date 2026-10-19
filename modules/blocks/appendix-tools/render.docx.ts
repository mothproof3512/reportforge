import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const tb = t.blocks['appendix-tools'], tools = ctx.engagement.tools ?? [];
  if (!tools.length) return [];
  return [h.h1(tb.title, { numbered: false }), h.p(tb.intro), h.table([[t.core.name, t.core.version, t.core.purpose], ...tools.map((x: any) => [x.name, x.version ?? '', x.purpose ?? ''])], { widths: [44, 24, 102] })];
}
