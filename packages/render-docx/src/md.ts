/** mdast → docx paragraphs/tables. */
import { Paragraph, TextRun, ExternalHyperlink, ImageRun, AlignmentType, BorderStyle } from 'docx';
import { parseMarkdown } from '@reportforge/markdown';
import type { Helpers, Block } from './helpers.ts';

export interface MdContext {
  h: Helpers;
  resolveImage: (url: string) => ImageRun | undefined;
}

type Inline = TextRun | ExternalHyperlink | ImageRun;
interface Style { bold?: boolean; italics?: boolean; strike?: boolean }

function inlines(nodes: any[], mc: MdContext, st: Style = {}): Inline[] {
  const out: Inline[] = [];
  for (const n of nodes) out.push(...inline(n, mc, st));
  return out;
}

function inline(n: any, mc: MdContext, st: Style): Inline[] {
  const h = mc.h;
  switch (n.type) {
    case 'text': return [h.run(n.value, { ...st, size: h.PT(10) } as any)];
    case 'emphasis': return inlines(n.children, mc, { ...st, italics: true });
    case 'strong': return inlines(n.children, mc, { ...st, bold: true });
    case 'delete': return inlines(n.children, mc, { ...st, strike: true });
    case 'inlineCode': return [h.mono(n.value, st)];
    case 'break': return [new TextRun({ break: 1 })];
    case 'link': {
      const text = n.children?.length ? n.children.map((c: any) => plain(c)).join('') : n.url;
      return [h.link(n.url, text)];
    }
    case 'image': { const img = mc.resolveImage(n.url); return img ? [img] : [h.run(`[${n.url}]`, { italics: true } as any)]; }
    case 'html': return [h.run(n.value)];
    default: return n.children ? inlines(n.children, mc, st) : typeof n.value === 'string' ? [h.run(n.value)] : [];
  }
}

function plain(n: any): string {
  if (typeof n.value === 'string') return n.value;
  return (n.children ?? []).map(plain).join('');
}

function blocks(nodes: any[], mc: MdContext, listLevel = 0): Block[] {
  const out: Block[] = [];
  for (const n of nodes) out.push(...block(n, mc, listLevel));
  return out;
}

function block(n: any, mc: MdContext, listLevel: number): Block[] {
  const h = mc.h;
  switch (n.type) {
    case 'paragraph': {
      if (n.children.length === 1 && n.children[0].type === 'image') {
        const img = mc.resolveImage(n.children[0].url);
        if (!img) return [h.p([h.run(`[afbeelding ontbreekt: ${n.children[0].url}]`, { italics: true } as any)])];
        const out: Block[] = [new Paragraph({ children: [img], alignment: AlignmentType.CENTER, keepNext: !!n.children[0].alt, spacing: { before: h.PT(4), after: h.PT(2) } })];
        if (n.children[0].alt) out.push(new Paragraph({ children: [h.muted(n.children[0].alt, 8)], alignment: AlignmentType.CENTER, spacing: { after: h.PT(8) } }));
        return out;
      }
      return [h.p(inlines(n.children, mc) as any)];
    }
    case 'heading':
      return [new Paragraph({ children: inlines(n.children, mc, { bold: true }) as any, keepNext: true, spacing: { before: h.PT(8), after: h.PT(3) } })];
    case 'code': return [h.code(n.value), h.spacer(4)];
    case 'blockquote': {
      const out: Block[] = [];
      for (const c of n.children) {
        if (c.type === 'paragraph') out.push(new Paragraph({ children: inlines(c.children, mc, { italics: true }) as any, indent: { left: h.MM(6) }, border: { left: { style: BorderStyle.SINGLE, size: 12, color: 'D9DEE5', space: 8 } }, spacing: { after: h.PT(4) } }));
        else out.push(...block(c, mc, listLevel));
      }
      return out;
    }
    case 'thematicBreak': return [h.rule()];
    case 'list': {
      const out: Block[] = [];
      const ref = n.ordered ? 'numbers' : 'bullets';
      for (const li of n.children) {
        const parts = li.children ?? [];
        let first = true;
        for (const part of parts) {
          if (part.type === 'paragraph') {
            out.push(new Paragraph({ children: inlines(part.children, mc) as any, numbering: first ? { reference: ref, level: Math.min(listLevel, 2) } : undefined, indent: first ? undefined : { left: h.MM(6 + listLevel * 6) }, spacing: { after: h.PT(2) } }));
          } else if (part.type === 'list') {
            out.push(...block(part, mc, listLevel + 1));
          } else {
            out.push(...block(part, mc, listLevel));
          }
          first = false;
        }
      }
      out.push(h.spacer(3));
      return out;
    }
    case 'table': {
      const rows = n.children.map((r: any) => r.children.map((c: any) => inlines(c.children, mc) as TextRun[]));
      const aligns = (n.align ?? []).map((a: any) => a ?? 'left');
      return [h.table(rows, { aligns }), h.spacer(4)];
    }
    case 'html': return [h.p(n.value)];
    default: return n.children ? blocks(n.children, mc, listLevel) : [];
  }
}

export function mdToDocx(markdown: string, mc: MdContext): Block[] {
  return blocks(parseMarkdown(markdown).children as any[], mc);
}
