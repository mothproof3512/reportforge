import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const txt = theme.texts?.disclaimer; if (!txt) return [];
  const s = (txt[ctx.lang] ?? txt.en ?? '').replaceAll('{client}', ctx.engagement.client.name);
  return [h.h1(t.blocks.disclaimer.title, { numbered: false }), ...h.md(s)];
}
