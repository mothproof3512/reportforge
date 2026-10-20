import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  return [h.h1(t.blocks['style-gallery'].title, { numbered: false }), h.p(t.blocks['style-gallery'].intro)];
}
