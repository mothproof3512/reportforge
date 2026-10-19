import { TableOfContents } from 'docx';
import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  return [h.h1(t.blocks.toc.title, { numbered: false, pageBreak: false }), new TableOfContents(t.blocks.toc.title, { hyperlink: true, headingStyleRange: `1-${opts.depth ?? 2}` }) as any, h.spacer(4)];
}
