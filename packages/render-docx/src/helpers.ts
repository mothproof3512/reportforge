/**
 * Helpers handed to every block's render.docx.ts. Blocks compose Word content
 * from these so that styling stays consistent and theme-driven.
 */
import {
  LineRuleType,
  Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, ShadingType, BorderStyle,
  ExternalHyperlink, ImageRun, PageBreak, HeadingLevel, TabStopType, VerticalAlign, type IParagraphOptions, type ITableCellOptions,
} from 'docx';
import { readFileSync } from 'node:fs';
import type { ReportContext, ResolvedTheme, Severity } from '@reportforge/core';
import { mdToDocx, type MdContext } from './md.ts';

export type Block = Paragraph | Table;

export const PT = (n: number) => n * 2;                 // half-points
export const MM = (n: number) => Math.round(n * 56.7);  // twips (1 mm = 56.7 twips)
export const PX = (mm: number) => Math.round(mm / 25.4 * 96);
const hex = (c: string) => c.replace('#', '').toUpperCase();

export interface DocxFonts { body: string; heading: string; mono: string }

export class Helpers {
  readonly colors: ResolvedTheme['colors'];
  readonly fonts: DocxFonts;
  readonly textWidthMm: number;
  readonly PT = PT;
  readonly MM = MM;
  readonly PX = PX;
  private imgCache = new Map<string, Buffer>();

  constructor(readonly ctx: ReportContext, readonly theme: ResolvedTheme, readonly t: Record<string, any>, readonly imageMeta: Record<string, { abs: string; width: number; height: number; png?: Buffer }>) {
    this.colors = theme.colors;
    const f = theme.fonts as any;
    this.fonts = { body: f.docx_body ?? 'Calibri', heading: f.docx_heading ?? f.docx_body ?? 'Calibri', mono: f.docx_mono ?? 'Consolas' };
    this.textWidthMm = 170;
  }

  tr(key: string): string {
    return key.split('.').reduce<any>((o, k) => (o && typeof o === 'object' ? o[k] : undefined), this.t) ?? key;
  }
  sevLabel(s: Severity): string { return this.t.severity?.[s] ?? s; }

  // ---- text ----------------------------------------------------------------
  run(text: string, o: Partial<ConstructorParameters<typeof TextRun>[0] & object> = {}): TextRun {
    return new TextRun({ text, font: this.fonts.body, ...(o as object) });
  }
  p(content: string | TextRun[] | ExternalHyperlink[] | (TextRun | ExternalHyperlink)[], o: IParagraphOptions = {}): Paragraph {
    const children = typeof content === 'string' ? [this.run(content)] : content;
    return new Paragraph({ children, spacing: { after: PT(5), line: 276, lineRule: LineRuleType.AUTO }, ...o });
  }
  muted(text: string, size = 8): TextRun { return new TextRun({ text, font: this.fonts.body, color: hex(this.colors.muted), size: PT(size) }); }
  label(text: string): TextRun { return new TextRun({ text: text.toUpperCase(), font: this.fonts.body, color: hex(this.colors.muted), size: PT(7), characterSpacing: 20 }); }
  mono(text: string, o: object = {}): TextRun { return new TextRun({ text, font: this.fonts.mono, size: PT(8.5), shading: { type: ShadingType.CLEAR, fill: hex(this.colors.codeBg) }, ...o }); }

  h1(text: string, o: { numbered?: boolean; pageBreak?: boolean } = {}): Paragraph {
    return new Paragraph({ text, heading: HeadingLevel.HEADING_1, pageBreakBefore: o.pageBreak ?? true, numbering: o.numbered === false ? undefined : { reference: 'headings', level: 0 } });
  }
  h2(text: string, o: { numbered?: boolean } = {}): Paragraph {
    return new Paragraph({ text, heading: HeadingLevel.HEADING_2, numbering: o.numbered === false ? undefined : { reference: 'headings', level: 1 } });
  }
  h3(text: string): Paragraph { return new Paragraph({ text, heading: HeadingLevel.HEADING_3 }); }
  /** Finding title: "F-01  Title" as Heading 2 without numbering, with a bookmark for cross references. */
  findingHeading(id: string, title: string): Paragraph {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      pageBreakBefore: true,
      children: [new TextRun({ text: id, color: hex(this.colors.accent), font: this.fonts.heading }), new TextRun({ text: '  ' + title, font: this.fonts.heading })],
    });
  }
  pageBreak(): Paragraph { return new Paragraph({ children: [new PageBreak()] }); }
  spacer(pt = 6): Paragraph { return new Paragraph({ spacing: { before: 0, after: PT(pt) }, children: [] }); }
  rule(): Paragraph { return new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: hex(this.colors.rule) } }, spacing: { after: PT(6) }, children: [] }); }

  badge(sev: Severity, size = 7): TextRun {
    return new TextRun({ text: ` ${this.sevLabel(sev).toUpperCase()} `, bold: true, size: PT(size), font: this.fonts.body, color: hex(this.colors.severityText[sev]), shading: { type: ShadingType.CLEAR, fill: hex(this.colors.severity[sev]) } });
  }
  link(url: string, text?: string): ExternalHyperlink {
    return new ExternalHyperlink({ link: url, children: [new TextRun({ text: text ?? url, style: 'Hyperlink', font: this.fonts.body })] });
  }

  // ---- markdown ------------------------------------------------------------
  md(markdown: string | undefined): Block[] {
    if (!markdown) return [];
    const mc: MdContext = { h: this, resolveImage: (url) => this.image(url) };
    return mdToDocx(markdown, mc);
  }

  /** Image run sized to the text width, capped in height (same rule as the Typst renderer). */
  image(url: string, maxHeightMm = 165): ImageRun | undefined {
    const meta = this.imageMeta[url];
    if (!meta) return undefined;
    let data = this.imgCache.get(url);
    if (!data) { data = meta.png ?? readFileSync(meta.abs); this.imgCache.set(url, data); }
    const w = meta.width || 1200, hgt = meta.height || 800;
    const ratio = hgt / w;
    let widthMm = this.textWidthMm;
    if (widthMm * ratio > maxHeightMm) widthMm = maxHeightMm / ratio;
    const pxW = w * 0.2646;
    if (pxW < this.textWidthMm * 0.6 && pxW > 30) widthMm = Math.min(widthMm, pxW * 1.25);
    return new ImageRun({ type: 'png', data, transformation: { width: PX(widthMm), height: PX(widthMm * ratio) }, altText: { title: url, description: url, name: url } });
  }

  // ---- tables --------------------------------------------------------------
  cell(content: Block[] | string | TextRun[], o: { width?: number; fill?: string; bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; vAlign?: boolean } = {}): TableCell {
    const children = typeof content === 'string' ? [this.p([this.run(content, { bold: o.bold, size: PT(9) })], { alignment: o.align, spacing: { after: 0 } })]
      : Array.isArray(content) && content[0] instanceof TextRun ? [this.p(content as TextRun[], { alignment: o.align, spacing: { after: 0 } })]
      : (content as Block[]);
    const opts: ITableCellOptions = {
      children, verticalAlign: VerticalAlign.CENTER,
      margins: { top: MM(1.4), bottom: MM(1.4), left: MM(2), right: MM(2) },
      shading: o.fill ? { type: ShadingType.CLEAR, fill: hex(o.fill) } : undefined,
      width: o.width ? { size: MM(o.width), type: WidthType.DXA } : undefined,
    };
    return new TableCell(opts);
  }
  /** Table with header row; widths in mm (sum ≤ text width). */
  table(rows: Array<Array<string | TextRun[] | Block[]>>, o: { widths?: number[]; header?: boolean; aligns?: Array<'left' | 'right' | 'center'> } = {}): Table {
    const header = o.header ?? true;
    const n = rows[0]?.length ?? 1;
    const widths = o.widths ?? Array(n).fill(this.textWidthMm / n);
    const c = this.colors;
    const alignOf = (i: number) => (o.aligns?.[i] === 'right' ? AlignmentType.RIGHT : o.aligns?.[i] === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT);
    const trs = rows.map((r, ri) => new TableRow({
      tableHeader: header && ri === 0,
      cantSplit: true,
      children: r.map((cellv, ci) => this.cell(cellv as any, { width: widths[ci], fill: header && ri === 0 ? c.surface : undefined, bold: header && ri === 0, align: alignOf(ci) })),
    }));
    const border = { style: BorderStyle.SINGLE, size: 4, color: hex(c.rule) };
    return new Table({
      rows: trs,
      width: { size: MM(widths.reduce((a, b) => a + b, 0)), type: WidthType.DXA },
      columnWidths: widths.map(MM),
      borders: { top: border, bottom: border, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, insideHorizontal: border, insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
    });
  }
  kv(pairs: Array<[string, string | TextRun[]]>, keyWidth = 40): Table {
    const rows = pairs.map(([k, v]) => [[this.muted(k, 9)], typeof v === 'string' ? [this.run(v, { size: PT(9.5) })] : v]);
    const tbl = this.table(rows as any, { widths: [keyWidth, this.textWidthMm - keyWidth], header: false });
    return tbl;
  }
  /** Shaded box (callout / metadata card). */
  box(children: Block[], o: { fill?: string; accent?: string } = {}): Table {
    const c = this.colors;
    const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    return new Table({
      rows: [new TableRow({ cantSplit: true, children: [new TableCell({ children, margins: { top: MM(2.5), bottom: MM(2.5), left: MM(3), right: MM(3) }, shading: { type: ShadingType.CLEAR, fill: hex(o.fill ?? c.surface) }, width: { size: MM(this.textWidthMm), type: WidthType.DXA }, borders: { left: { style: BorderStyle.SINGLE, size: 18, color: hex(o.accent ?? c.primary) }, top: none, bottom: none, right: none } })] })],
      width: { size: MM(this.textWidthMm), type: WidthType.DXA },
      columnWidths: [MM(this.textWidthMm)],
      borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
    });
  }
  /** Code block: mono runs with explicit line breaks, shaded, left accent. */
  code(source: string): Table {
    const c = this.colors;
    const lines = source.replace(/\n$/, '').split('\n');
    const runs: TextRun[] = [];
    lines.forEach((ln, i) => runs.push(new TextRun({ text: ln, font: this.fonts.mono, size: PT(8), break: i === 0 ? undefined : 1 })));
    const para = new Paragraph({ children: runs, spacing: { after: 0, line: 240, lineRule: LineRuleType.AUTO } });
    return this.box([para], { fill: c.codeBg, accent: c.primary });
  }
}
