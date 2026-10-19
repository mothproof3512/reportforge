import { Paragraph, TextRun, ImageRun, AlignmentType, BorderStyle } from 'docx';
import type { Block, Helpers } from '@reportforge/render-docx';

export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const eng = ctx.engagement;
  const c = theme.colors;
  const hx = (s: string) => s.replace('#', '');
  const docLabel = ctx.document === 'attestation' ? t.core.attestation : (t.core[`${ctx.document}_report`] ?? t.core.report);
  const out: Block[] = [];
  const logo: Buffer | undefined = (h as any).logo;
  out.push(new Paragraph({ spacing: { before: h.PT(20), after: h.PT(40) }, children: logo ? [new ImageRun({ type: 'png', data: logo, transformation: { width: h.PX(60), height: h.PX(60 * 72 / 420) }, altText: { title: 'logo', description: 'logo', name: 'logo' } })] : [new TextRun({ text: theme.provider.name, bold: true, size: h.PT(16), color: hx(c.primary) })] }));
  out.push(new Paragraph({ spacing: { before: h.PT(60), after: h.PT(10) }, border: { top: { style: BorderStyle.SINGLE, size: 18, color: hx(c.accent), space: 12 } }, children: [new TextRun({ text: docLabel.toUpperCase(), size: h.PT(10.5), bold: true, characterSpacing: 60, color: hx(c.accent), font: h.fonts.body })] }));
  out.push(new Paragraph({ spacing: { after: h.PT(8) }, children: [new TextRun({ text: eng.title, size: h.PT(30), bold: true, color: hx(c.headingColor), font: h.fonts.heading })] }));
  if (eng.subtitle) out.push(new Paragraph({ spacing: { after: h.PT(10) }, children: [new TextRun({ text: eng.subtitle, size: h.PT(14), color: hx(c.ink), font: h.fonts.body })] }));
  out.push(new Paragraph({ spacing: { before: h.PT(10), after: h.PT(50) }, children: [new TextRun({ text: `${t.blocks.cover.for} `, size: h.PT(13) }), new TextRun({ text: eng.client.name, size: h.PT(13), bold: true })] }));
  const meta: Array<[string, string]> = [[t.core.reference, eng.reference], [t.core.version, eng.version], [t.core.date, (h as any).fmt.date]];
  if (opts.show_period !== false) meta.push([t.core.period, `${(h as any).fmt.period_start} – ${(h as any).fmt.period_end}`]);
  if (eng.classification) meta.push([t.core.classification, eng.classification]);
  out.push(h.kv(meta, 40));
  out.push(new Paragraph({ spacing: { before: h.PT(200) }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: hx(c.rule), space: 6 } }, children: [new TextRun({ text: theme.provider.name, bold: true, size: h.PT(8) }), new TextRun({ text: '   ' + (theme.provider.address ?? []).join(' · ') + '   ' + (theme.provider.website ?? '') + '   ' + (theme.provider.email ?? ''), size: h.PT(8), color: hx(c.muted) })] }));
  out.push(h.pageBreak());
  return out;
}
