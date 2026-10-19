/**
 * mdast → Typst markup.
 *
 * Output is always wrapped by the caller in a content block `[ ... ]`.
 * Text is escaped so that no markdown content can ever be interpreted as
 * Typst syntax; code blocks and links use the function form with string
 * literals, which is immune to escaping mistakes.
 */
import { parseMarkdown } from './ast.ts';
import type { Root } from 'mdast';

export interface ImageRef {
  /** Path as Typst should load it (relative to the generated .typ file or absolute from --root). */
  path: string;
  width?: number;  // intrinsic pixels
  height?: number;
}

export interface TypstOptions {
  /** Resolve a markdown image URL to a file Typst can load; return undefined to drop it with a placeholder. */
  resolveImage?: (url: string) => ImageRef | undefined;
  /** Headings inside markdown bodies are rendered as run-in sub-headings, never as outline headings. */
  subheadFn?: string; // default "rf.subhead"
  /** Unbroken tokens longer than this get zero-width break opportunities (narrow contexts use a smaller value). */
  tokenMax?: number;
}

/** Escape a string for use inside a Typst string literal "...". */
export function typstString(s: string): string {
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '').replace(/\t/g, '\\t') + '"';
}

/**
 * Insert zero-width break opportunities into unbroken runs longer than `max`
 * characters (long URLs, hashes, base64) so code blocks can always wrap.
 */
export function softBreaks(s: string, max = 72): string {
  const re = new RegExp(`\\S{${max + 1},}`, 'g');
  return s.split('\n').map((line) => line.replace(re, (run) => {
    let out = '';
    for (let i = 0; i < run.length; i++) {
      out += run[i];
      const next = run[i + 1];
      if (next && /[\/\\?&=.,;:_\-+]/.test(run[i])) out += '\u200B';
      else if (next && (i + 1) % max === 0) out += '\u200B';
    }
    return out;
  })).join('\n');
}

/** Escape plain text for Typst markup mode. */
export function escapeMarkup(s: string, tokenMax = 40): string {
  let out = softBreaks(s, tokenMax).replace(/[\\*_`#$<>@\[\]~]/g, (c) => '\\' + c);
  // Constructs that only matter at the start of a line
  out = out.replace(/^(\s*)([-+=/])/gm, '$1\\$2');
  out = out.replace(/^(\s*\d+)\./gm, '$1\\.');
  // "--" and "---" become dashes; keep them literal
  out = out.replace(/--/g, '-\\-');
  return out;
}

function inlineChildren(nodes: any[], o: TypstOptions): string {
  return nodes.map((n) => inlineNode(n, o)).join('');
}

function inlineNode(n: any, o: TypstOptions): string {
  switch (n.type) {
    case 'text': return escapeMarkup(n.value, o.tokenMax ?? 40);
    case 'emphasis': return `#emph[${inlineChildren(n.children, o)}]`;
    case 'strong': return `#strong[${inlineChildren(n.children, o)}]`;
    case 'delete': return `#strike[${inlineChildren(n.children, o)}]`;
    case 'inlineCode': return `#raw(${typstString(n.value)})`;
    case 'break': return ' \\\n';
    case 'link': {
      const text = n.children?.length ? inlineChildren(n.children, o) : escapeMarkup(n.url);
      return `#link(${typstString(n.url)})[${text}]`;
    }
    case 'image': return imageNode(n, o);
    case 'html': return escapeMarkup(n.value);
    case 'footnoteReference': return '';
    default:
      return n.children ? inlineChildren(n.children, o) : (typeof n.value === 'string' ? escapeMarkup(n.value) : '');
  }
}

function imageNode(n: any, o: TypstOptions): string {
  const ref = o.resolveImage?.(n.url);
  const alt = n.alt ? typstString(n.alt) : 'none';
  if (!ref) return `#rf.missing-image(theme, ${typstString(n.url)})`;
  const w = ref.width ?? 0, h = ref.height ?? 0;
  return `#rf.img(theme, ${typstString(ref.path)}, w: ${w}, h: ${h}, alt: ${alt})`;
}

function blockNodes(nodes: any[], o: TypstOptions): string {
  return nodes.map((n) => blockNode(n, o)).filter(Boolean).join('\n\n');
}

function blockNode(n: any, o: TypstOptions): string {
  switch (n.type) {
    case 'paragraph': {
      // A paragraph that is only an image becomes a figure-like block
      if (n.children.length === 1 && n.children[0].type === 'image') return imageNode(n.children[0], o);
      return inlineChildren(n.children, o);
    }
    case 'heading':
      return `#${o.subheadFn ?? 'rf.subhead'}(theme, level: ${n.depth})[${inlineChildren(n.children, o)}]`;
    case 'code':
      return `#rf.code(theme, ${typstString(softBreaks(n.value))}, lang: ${n.lang ? typstString(n.lang) : 'none'})`;
    case 'blockquote':
      return `#quote(block: true)[${blockNodes(n.children, o)}]`;
    case 'thematicBreak':
      return '#rf.rule(theme)';
    case 'list': {
      const items = n.children.map((li: any) => `[${blockNodes(li.children, o)}]`).join(', ');
      const tight = !n.spread;
      if (n.ordered) return `#enum(start: ${n.start ?? 1}, tight: ${tight}, ${items})`;
      return `#list(tight: ${tight}, ${items})`;
    }
    case 'table': {
      const to = { ...o, tokenMax: 14 };
      const rows = n.children.map((r: any) => '(' + r.children.map((c: any) => `[${inlineChildren(c.children, to)}]`).join(', ') + ',)');
      const align = (n.align ?? []).map((a: any) => (a ? a : 'left'));
      return `#rf.table(theme, align: (${align.map((a: string) => `"${a}"`).join(', ')}${align.length === 1 ? ',' : ''}), rows: (${rows.join(', ')}${rows.length === 1 ? ',' : ''}))`;
    }
    case 'html':
      return escapeMarkup(n.value);
    case 'definition': case 'footnoteDefinition':
      return '';
    default:
      return n.children ? blockNodes(n.children, o) : '';
  }
}

export function mdastToTypst(root: Root, o: TypstOptions = {}): string {
  return blockNodes(root.children as any[], o);
}

export function markdownToTypst(md: string, o: TypstOptions = {}): string {
  if (!md || !md.trim()) return '';
  return mdastToTypst(parseMarkdown(md), o);
}
