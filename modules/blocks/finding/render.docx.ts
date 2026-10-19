import { Paragraph, TextRun } from 'docx';
import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const f = opts.item, c = theme.colors;
  const hx = (s: string) => s.replace('#', '');
  const out: Block[] = [h.findingHeading(f.id, f.title)];
  // metadata card
  const modelName = t.core.risk_model[f.risk.model] ?? f.risk.model;
  const line1: TextRun[] = [h.label(t.core.severity), h.run('  '), h.badge(f.severity, 7.5), h.run('      '), h.label(modelName), h.run('  '), h.run(f.risk.label, { bold: true, size: h.PT(11) } as any), h.run('      '), h.label(t.core.status), h.run('  ' + f.status)];
  if (f.source) line1.push(h.run('      '), h.label(t.core.source), h.run('  ' + f.source));
  const extras: TextRun[] = [];
  const push = (r: TextRun) => { if (extras.length) extras.push(h.muted('   |   ', 8)); extras.push(r); };
  if (f.risk.vector) push(new TextRun({ text: f.risk.vector, font: h.fonts.mono, size: h.PT(7.5), color: hx(c.muted) }));
  for (const m of f.mapping) push(new TextRun({ text: m.item, font: h.fonts.mono, size: h.PT(7.5), color: hx(c.muted) }));
  for (const cwe of f.cwe) push(new TextRun({ text: cwe, font: h.fonts.mono, size: h.PT(7.5), color: hx(c.muted) }));
  const card: Block[] = [new Paragraph({ children: line1, spacing: { after: extras.length ? h.PT(4) : 0 } })];
  if (extras.length) card.push(new Paragraph({ children: extras, spacing: { after: 0 } }));
  out.push(h.box(card, { accent: c.severity[f.severity] }), h.spacer(6));
  if (f.retest) {
    const col = f.retest.status === 'resolved' ? c.severity.low : f.retest.status === 'partially-resolved' ? c.severity.medium : f.retest.status === 'open' ? c.severity.high : c.muted;
    out.push(h.box([h.p([h.run(`${t.core.retest} — ${t.core.retest_status[f.retest.status] ?? f.retest.status}`, { bold: true, color: hx(col) } as any)]), ...h.md(f.retest.note)], { accent: col }), h.spacer(6));
  }
  if (f.affected.length) {
    out.push(h.h3(t.core.affected));
    for (const a of f.affected) out.push(h.p([h.run('•  '), h.mono(a)], { spacing: { after: h.PT(1) } }));
    out.push(h.spacer(3));
  }
  const s = f.sections;
  const section = (title: string, md?: string) => { if (md) out.push(h.h3(title), ...h.md(md)); };
  section(t.core.description, s.description); section(t.core.impact, s.impact); section(t.core.evidence, s.evidence); section(t.core.recommendation, s.recommendation);
  for (const [k, v] of Object.entries(s)) if (!['description', 'impact', 'evidence', 'recommendation', 'references'].includes(k)) section(k[0].toUpperCase() + k.slice(1), v as string);
  section(t.core.references, s.references);
  return out;
}
