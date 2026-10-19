/**
 * ReportContext → DOCX via docx-js. Same block model as the Typst renderer:
 * every block folder may provide render.docx.ts exporting
 *   render(ctx, theme, t, opts, h): Block[]
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import {
  Document, Packer, Paragraph, TextRun, Header, Footer, AlignmentType, PageNumber, LevelFormat, BorderStyle, ImageRun, TabStopType, HeadingLevel, LineRuleType,
} from 'docx';
import { buildDictionary, formatDate, severityLabel, type Modules, type ReportContext, type Lang } from '@reportforge/core';
import { Helpers, PT, MM, PX, type Block } from './helpers.ts';

export type { Block } from './helpers.ts';
export { Helpers } from './helpers.ts';

export interface DocxRenderResult { docx: string; warnings: string[] }

const hex = (c: string) => c.replace('#', '').toUpperCase();

async function toPng(abs: string): Promise<Buffer> {
  if (extname(abs).toLowerCase() === '.svg') return sharp(readFileSync(abs), { density: 300 }).png().toBuffer();
  if (['.png'].includes(extname(abs).toLowerCase())) return readFileSync(abs);
  return sharp(abs).png().toBuffer();
}

export async function renderDocx(mods: Modules, ctx: ReportContext, outDocx: string): Promise<DocxRenderResult> {
  const warnings: string[] = [];
  const lang = ctx.lang as Lang;
  const c = ctx.theme.colors;
  const eng = ctx.engagement;
  const sevs = ['critical', 'high', 'medium', 'low', 'info'] as const;
  const dict = buildDictionary(mods, lang) as Record<string, any>;
  const t = { ...dict, severity: Object.fromEntries(sevs.map((s) => [s, severityLabel(s, lang)])) };

  // Images as PNG buffers (Word has no SVG fallback we want to rely on)
  const imageMeta: Record<string, { abs: string; width: number; height: number; png?: Buffer }> = {};
  for (const [url, info] of Object.entries(ctx.images)) {
    try { imageMeta[url] = { ...info, png: await toPng(info.abs) }; } catch (e: any) { warnings.push(`Afbeelding ${url} kon niet naar PNG worden omgezet: ${e.message}`); }
  }
  let logoPng: Buffer | undefined;
  const logoSrc = ctx.theme.assets.logo_mono ?? ctx.theme.assets.logo;
  if (logoSrc) { try { logoPng = await toPng(logoSrc); } catch (e: any) { warnings.push(`Logo niet converteerbaar: ${e.message}`); } }
  let logoColorPng: Buffer | undefined;
  if (ctx.theme.assets.logo) { try { logoColorPng = await toPng(ctx.theme.assets.logo); } catch { /* reported above */ } }

  const h = new Helpers(ctx, ctx.theme, t, imageMeta);
  (h as any).logo = logoColorPng;
  (h as any).fmt = {
    date: formatDate(eng.date, lang), period_start: formatDate(eng.period.start, lang), period_end: formatDate(eng.period.end, lang),
    retest_date: eng.retest ? formatDate(eng.retest.date, lang) : '',
    history: (eng.document_history ?? []).map((x) => ({ ...x, date: formatDate(x.date, lang) })),
  };
  (h as any).severities = sevs.map((s) => ({ id: s, label: severityLabel(s, lang), count: ctx.stats.bySeverity[s], open: ctx.stats.openBySeverity[s] }));

  // Blocks
  const children: Block[] = [];
  for (const [i, tb] of ctx.template.blocks.entries()) {
    const block = mods.blocks[tb.type];
    if (!block) { warnings.push(`Blok "${tb.type}" bestaat niet; overgeslagen.`); continue; }
    if (!block.hasDocx) { warnings.push(`Blok "${tb.type}" heeft geen render.docx.ts; overgeslagen in DOCX.`); continue; }
    const mod = await import(pathToFileURL(join(block.dir, 'render.docx.ts')).href);
    const opts = { ...(block.manifest.options ?? {}), ...(tb.options ?? {}), _index: i };
    if (block.manifest.each === 'findings') {
      for (const [fi, f] of ctx.findings.entries()) children.push(...(await mod.render(ctx, ctx.theme, t, { ...opts, item: f, item_index: fi }, h)));
    } else {
      children.push(...(await mod.render(ctx, ctx.theme, t, opts, h)));
    }
  }

  const fonts = h.fonts;
  const headerRight = logoPng ? new ImageRun({ type: 'png', data: logoPng, transformation: { width: PX(28), height: PX(28 * (await sharp(logoPng).metadata().then((m) => (m.height ?? 1) / (m.width ?? 1)))) }, altText: { title: 'logo', description: 'logo', name: 'logo' } })
    : new TextRun({ text: ctx.theme.provider.name, bold: true, size: PT(7.5), color: hex(c.muted), font: fonts.body });

  const doc = new Document({
    creator: ctx.theme.provider.name,
    title: eng.title,
    description: `${eng.reference} v${eng.version}`,
    features: { updateFields: true },
    styles: {
      default: {
        document: { run: { font: fonts.body, size: PT(10), color: hex(c.ink) }, paragraph: { spacing: { line: 276, lineRule: LineRuleType.AUTO, after: PT(5) } } },
        heading1: { run: { font: fonts.heading, size: PT(18), bold: true, color: hex(c.headingColor as string) }, paragraph: { spacing: { before: PT(0), after: PT(12) }, keepNext: true, outlineLevel: 0 } },
        heading2: { run: { font: fonts.heading, size: PT(12.5), bold: true, color: hex(c.headingColor as string) }, paragraph: { spacing: { before: PT(14), after: PT(5) }, keepNext: true, outlineLevel: 1 } },
        heading3: { run: { font: fonts.heading, size: PT(10.5), bold: true, color: hex(c.headingColor as string) }, paragraph: { spacing: { before: PT(10), after: PT(3) }, keepNext: true, outlineLevel: 2 } },
        hyperlink: { run: { color: hex(c.primary), underline: { type: 'single', color: hex(c.rule) } } },
      },
      paragraphStyles: [
        { id: 'Caption', name: 'Caption', basedOn: 'Normal', run: { size: PT(8), color: hex(c.muted) }, paragraph: { alignment: AlignmentType.CENTER } },
      ],
    },
    numbering: {
      config: [
        { reference: 'headings', levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: '%1', alignment: AlignmentType.LEFT, style: { run: { color: hex(c.accent), size: PT(11) }, paragraph: { indent: { left: 0, hanging: 0 } } }, suffix: 'space' as any },
          { level: 1, format: LevelFormat.DECIMAL, text: '%1.%2', alignment: AlignmentType.LEFT, style: { run: { color: hex(c.accent), size: PT(9.5) }, paragraph: { indent: { left: 0, hanging: 0 } } }, suffix: 'space' as any },
        ] },
        { reference: 'bullets', levels: [0, 1, 2].map((l) => ({ level: l, format: LevelFormat.BULLET, text: ['•', '–', '·'][l], alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: MM(6 + l * 6), hanging: MM(4) } } } })) },
        { reference: 'numbers', levels: [0, 1, 2].map((l) => ({ level: l, format: LevelFormat.DECIMAL, text: '%' + (l + 1) + '.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: MM(6 + l * 6), hanging: MM(5) } } } })) },
      ],
    },
    sections: [{
      properties: {
        page: { size: { width: MM(210), height: MM(297) }, margin: { top: MM(22), bottom: MM(22), left: MM(20), right: MM(20), header: MM(10), footer: MM(10) } },
        titlePage: true,
      },
      headers: {
        default: new Header({ children: [new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: MM(170) }],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: hex(c.rule), space: 4 } },
          children: [new TextRun({ text: `${eng.title}   |   ${eng.client.name}`, size: PT(7.5), color: hex(c.muted), font: fonts.body }), new TextRun({ text: '\t' }), headerRight],
        })] }),
        first: new Header({ children: [new Paragraph({ children: [] })] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: MM(170) }],
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: hex(c.rule), space: 4 } },
          children: [
            new TextRun({ text: `${eng.classification ?? ''}   |   ${eng.reference}   |   v${eng.version}`, size: PT(7.5), color: hex(c.muted), font: fonts.body }),
            new TextRun({ text: '\t', size: PT(7.5) }),
            new TextRun({ children: [PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES], size: PT(7.5), color: hex(c.muted), font: fonts.body }),
          ],
        })] }),
        first: new Footer({ children: [new Paragraph({ children: [] })] }),
      },
      children,
    }],
  });
  mkdirSync(join(outDocx, '..'), { recursive: true });
  writeFileSync(outDocx, await Packer.toBuffer(doc));
  return { docx: outDocx, warnings };
}
