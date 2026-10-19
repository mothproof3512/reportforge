/**
 * Markdown → mdast with a small GFM pipe-table extension.
 *
 * We deliberately keep the dependency surface tiny: mdast-util-from-markdown
 * for CommonMark, plus our own pipe-table pre-pass. Tables are the only GFM
 * construct pentesters use in findings; everything else is CommonMark.
 */
import { fromMarkdown } from 'mdast-util-from-markdown';
import type { Root, RootContent, PhrasingContent, Table, TableRow, TableCell } from 'mdast';

export type { Root, RootContent, PhrasingContent, Table, TableRow, TableCell };

const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_SEP = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

interface Segment {
  kind: 'md' | 'table';
  lines: string[];
  startLine: number;
}

/** Split markdown into plain segments and pipe-table segments. */
function segment(src: string): Segment[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const out: Segment[] = [];
  let i = 0;
  let inFence = false;
  let cur: Segment = { kind: 'md', lines: [], startLine: 0 };
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (!inFence && TABLE_ROW.test(line) && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
      if (cur.lines.length) out.push(cur);
      const tbl: Segment = { kind: 'table', lines: [line, lines[i + 1]], startLine: i };
      i += 2;
      while (i < lines.length && TABLE_ROW.test(lines[i])) tbl.lines.push(lines[i++]);
      out.push(tbl);
      cur = { kind: 'md', lines: [], startLine: i };
      continue;
    }
    cur.lines.push(line);
    i++;
  }
  if (cur.lines.length) out.push(cur);
  return out;
}

function splitCells(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  const cells: string[] = [];
  let buf = '';
  let inCode = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '`') inCode = !inCode;
    if (ch === '\\' && s[i + 1] === '|') { buf += '|'; i++; continue; }
    if (ch === '|' && !inCode) { cells.push(buf.trim()); buf = ''; continue; }
    buf += ch;
  }
  cells.push(buf.trim());
  return cells;
}

function parseAlign(sep: string): Array<'left' | 'center' | 'right' | null> {
  return splitCells(sep).map((c) => {
    const l = c.startsWith(':'), r = c.endsWith(':');
    return l && r ? 'center' : r ? 'right' : l ? 'left' : null;
  });
}

function inline(text: string): PhrasingContent[] {
  const root = fromMarkdown(text);
  const first = root.children[0];
  if (!first) return [];
  if (first.type === 'paragraph') return first.children;
  return [{ type: 'text', value: text }];
}

function buildTable(seg: Segment): Table {
  const align = parseAlign(seg.lines[1]);
  const ncol = align.length;
  const rows: TableRow[] = [];
  for (const [idx, line] of seg.lines.entries()) {
    if (idx === 1) continue;
    const cells = splitCells(line);
    while (cells.length < ncol) cells.push('');
    rows.push({
      type: 'tableRow',
      children: cells.slice(0, ncol).map((c): TableCell => ({ type: 'tableCell', children: inline(c) })),
    });
  }
  return { type: 'table', align, children: rows };
}

/** Parse markdown (CommonMark + pipe tables) into an mdast Root. */
export function parseMarkdown(src: string): Root {
  const children: RootContent[] = [];
  for (const seg of segment(src)) {
    if (seg.kind === 'table') {
      children.push(buildTable(seg));
    } else {
      const text = seg.lines.join('\n');
      if (!text.trim()) continue;
      children.push(...fromMarkdown(text).children);
    }
  }
  return { type: 'root', children };
}

/** Plain-text rendering of an mdast subtree (for lengths, previews, DOCX alt text). */
export function toPlainText(node: any): string {
  if (!node) return '';
  if (typeof node.value === 'string') return node.value;
  if (Array.isArray(node.children)) return node.children.map(toPlainText).join(node.type === 'root' ? '\n' : '');
  return '';
}
