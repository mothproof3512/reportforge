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

  badge(sev: Severity, size = 7): TextRun { return this.sevBadge(sev, size); }
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
    const st = String((this.theme.options as any)?.table_style ?? 'lines');
    const alignOf = (i: number) => (o.aligns?.[i] === 'right' ? AlignmentType.RIGHT : o.aligns?.[i] === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT);
    const rowFill = (ri: number) => {
      if (header && ri === 0) return st === 'header-dark' ? c.primary : st === 'zebra' ? c.primaryLight : st === 'minimal' || st === 'cards' ? undefined : c.surface;
      if (st === 'zebra') return ri % 2 === 1 ? c.surface : undefined;
      if (st === 'cards') return c.surface;
      return undefined;
    };
    const trs = rows.map((r, ri) => new TableRow({
      tableHeader: header && ri === 0,
      cantSplit: true,
      children: r.map((cellv, ci) => {
        const cell = this.cell(cellv as any, { width: widths[ci], fill: rowFill(ri), bold: header && ri === 0, align: alignOf(ci) });
        return cell;
      }),
    }));
    if (st === 'header-dark' && header && typeof rows[0]?.[0] === 'string') {
      // white header text: rebuild the header row with coloured runs
      trs[0] = new TableRow({ tableHeader: true, cantSplit: true, children: rows[0].map((cellv, ci) => this.cell(typeof cellv === 'string' ? [new TextRun({ text: cellv, bold: true, size: PT(9), font: this.fonts.body, color: hex(c.onPrimary as string) })] : (cellv as any), { width: widths[ci], fill: c.primary, align: alignOf(ci) })) });
    }
    const border = { style: BorderStyle.SINGLE, size: 4, color: hex(c.rule) };
    const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const strong = { style: BorderStyle.SINGLE, size: 8, color: hex(c.ink) };
    const borders = st === 'boxed' ? { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border }
      : st === 'zebra' || st === 'cards' ? { top: none, bottom: none, left: none, right: none, insideHorizontal: st === 'cards' ? { style: BorderStyle.SINGLE, size: 12, color: 'FFFFFF' } : none, insideVertical: none }
      : st === 'minimal' ? { top: none, bottom: border, left: none, right: none, insideHorizontal: none, insideVertical: none }
      : { top: border, bottom: border, left: none, right: none, insideHorizontal: border, insideVertical: none };
    const tbl = new Table({
      rows: trs,
      width: { size: MM(widths.reduce((a, b) => a + b, 0)), type: WidthType.DXA },
      columnWidths: widths.map(MM),
      borders,
    });
    if (st === 'minimal' && header) (trs[0] as any).options.children.forEach((cell: any) => { cell.options.borders = { bottom: strong }; });
    return tbl;
  }
  kv(pairs: Array<[string, string | TextRun[]]>, keyWidth = 40): Table {
    const rows = pairs.map(([k, v]) => [[this.muted(k, 9)], typeof v === 'string' ? [this.run(v, { size: PT(9.5) })] : v]);
    const tbl = this.table(rows as any, { widths: [keyWidth, this.textWidthMm - keyWidth], header: false });
    return tbl;
  }
  /** Shaded box (callout / metadata card). */
  box(children: Block[], o: { fill?: string; accent?: string; width?: number } = {}): Table {
    const c = this.colors;
    const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const w = o.width ?? this.textWidthMm;
    const st = String((this.theme.options as any)?.callout_style ?? 'bar');
    const accent = hex(o.accent ?? c.primary);
    const thin = { style: BorderStyle.SINGLE, size: 6, color: accent };
    const cellBorders = st === 'outline' ? { left: thin, right: thin, top: thin, bottom: thin }
      : st === 'card' ? { left: { ...thin, color: hex(c.rule) }, right: { ...thin, color: hex(c.rule) }, top: { ...thin, color: hex(c.rule) }, bottom: { ...thin, color: hex(c.rule) } }
      : st === 'fill' ? { left: none, top: none, bottom: none, right: none }
      : st === 'quote' ? { left: { style: BorderStyle.SINGLE, size: 6, color: accent }, top: none, bottom: none, right: none }
      : { left: { style: BorderStyle.SINGLE, size: 18, color: accent }, top: none, bottom: none, right: none };
    const shade = st === 'outline' || st === 'quote' || st === 'card' ? undefined : { type: ShadingType.CLEAR, fill: hex(o.fill ?? (st === 'fill' ? c.primaryLight : c.surface)) };
    return new Table({
      rows: [new TableRow({ cantSplit: true, children: [new TableCell({ children, margins: { top: MM(2.5), bottom: MM(2.5), left: MM(3), right: MM(3) }, shading: shade, width: { size: MM(w), type: WidthType.DXA }, borders: cellBorders })] })],
      width: { size: MM(w), type: WidthType.DXA },
      columnWidths: [MM(w)],
      borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
    });
  }
  /** Side-by-side columns (borderless table); widths in mm. */
  columns(cols: Block[][], widths?: number[]): Table {
    const n = cols.length;
    let ws = widths ?? Array(n).fill(this.textWidthMm / n);
    const sum = ws.reduce((a, b) => a + b, 0);
    if (sum > this.textWidthMm - 2) ws = ws.map((w) => (w * (this.textWidthMm - 2)) / sum);   // keep the gutters inside the text column
    const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    return new Table({
      rows: [new TableRow({ children: cols.map((children, i) => new TableCell({ children: children.length ? children : [this.p('')], width: { size: MM(ws[i]), type: WidthType.DXA }, margins: { top: 0, bottom: 0, left: i === 0 ? 0 : MM(3), right: i === n - 1 ? 0 : MM(3) }, verticalAlign: VerticalAlign.TOP })) })],
      width: { size: MM(ws.reduce((a, b) => a + b, 0)), type: WidthType.DXA },
      columnWidths: ws.map(MM),
      borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
    });
  }
  /** Outlined status pill ("Open", "Opgelost"). */
  pill(label: string, color?: string, filled = false): TextRun {
    const col = hex(color ?? this.colors.muted);
    return new TextRun({ text: ` ${label} `, font: this.fonts.body, size: PT(7.5), bold: true, color: filled ? 'FFFFFF' : col, shading: filled ? { type: ShadingType.CLEAR, fill: col } : undefined, border: { style: BorderStyle.SINGLE, size: 6, color: col, space: 1 } });
  }
  /** Severity badge with the shape glyph when the theme asks for it. */
  sevBadge(sev: Severity, size = 7): TextRun {
    const opts = (this.theme.options as any) ?? {};
    const st = String(opts.badge_style ?? (opts.severity_shapes ? 'shapes' : 'solid'));
    const glyph = { critical: '◆', high: '▲', medium: '■', low: '●', info: '▬' }[sev];
    const col = hex(this.colors.severity[sev]);
    if (st === 'outline') return new TextRun({ text: ` ${this.sevLabel(sev).toUpperCase()} `, bold: true, size: PT(size), font: this.fonts.body, color: col, border: { style: BorderStyle.SINGLE, size: 6, color: col, space: 1 } });
    if (st === 'dot') return new TextRun({ text: `● ${this.sevLabel(sev)}`, bold: true, size: PT(size), font: this.fonts.body, color: col });
    if (st === 'tag') return new TextRun({ text: `▌${this.sevLabel(sev).toUpperCase()} `, bold: true, size: PT(size), font: this.fonts.body, color: col, shading: { type: ShadingType.CLEAR, fill: hex(this.colors.surface) } });
    const label = st === 'shapes' ? `${glyph} ${this.sevLabel(sev)}` : st === 'pill' ? this.sevLabel(sev) : this.sevLabel(sev).toUpperCase();
    return new TextRun({ text: ` ${label} `, bold: true, size: PT(size), font: this.fonts.body, color: hex(this.colors.severityText[sev]), shading: { type: ShadingType.CLEAR, fill: col } });
  }
  /** Small accent label above a chapter title or a card ("1 · Managementsamenvatting"). */
  eyebrow(text: string): Paragraph {
    return new Paragraph({ spacing: { after: PT(2) }, children: [new TextRun({ text, font: this.fonts.body, size: PT(7.5), bold: true, color: hex(this.colors.accent) })] });
  }
  /** Chapter subtitle in muted text under the heading. */
  subtitle(text: string): Paragraph {
    return new Paragraph({ spacing: { before: 0, after: PT(10) }, children: [new TextRun({ text, font: this.fonts.body, size: PT(11.5), color: hex(this.colors.muted) })] });
  }
  /** Big number with a caption (stat tile), top rule in the primary colour. */
  stat(value: string, caption: string, color?: string): Block[] {
    return [
      new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 10, color: hex(color ?? this.colors.primary), space: 4 } }, spacing: { after: 0 }, children: [new TextRun({ text: value, font: this.fonts.heading, size: PT(24), bold: true, color: hex(this.colors.headingColor as string) })] }),
      new Paragraph({ spacing: { after: PT(6) }, children: [this.muted(caption, 8.5)] }),
    ];
  }
  /** Status pill for a finding from its retest status (open when none). */
  statusPill(f: any): TextRun {
    const c = this.colors, t = this.t;
    const st = f.retest?.status ?? 'open';
    const col = st === 'resolved' ? c.severity.low : st === 'partially-resolved' ? c.severity.medium : st === 'risk-accepted' ? c.muted : c.severity.high;
    const label = st === 'resolved' ? t.core.resolved : st === 'partially-resolved' ? t.core.partially_resolved : st === 'risk-accepted' ? t.core.retest_status['risk-accepted'] : t.core.open;
    return this.pill(label, col);
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
