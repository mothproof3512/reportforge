import { Paragraph, TextRun, HeadingLevel } from 'docx';
import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  if (opts.layout === 'extended') return extended(ctx, theme, t, opts, h);
  const f = opts.item, c = theme.colors, tb = t.blocks.finding;
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
  for (const [k, v] of Object.entries(s)) if (!['description', 'impact', 'evidence', 'recommendation', 'references'].includes(k)) section(tb[k] ?? k[0].toUpperCase() + k.slice(1), v as string);
  section(t.core.references, s.references);
  return out;
}

async function extended(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const f = opts.item, c = theme.colors, tb = t.blocks.finding, s = f.sections;
  const hx = (x: string) => x.replace('#', '');
  const out: Block[] = [];
  out.push(new Paragraph({ pageBreakBefore: opts.new_page !== false && !(opts.first_inline && f.index === 1), spacing: { after: h.PT(2) }, children: [new TextRun({ text: `${t.core.finding} ${f.id}`, font: h.fonts.body, size: h.PT(7.5), bold: true, color: hx(c.accent) })] }));
  out.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: f.id, font: h.fonts.mono, size: h.PT(11), color: hx(c.accent) }), new TextRun({ text: '  ' + f.title, font: h.fonts.heading, size: h.PT(18) })] }));
  out.push(h.p([h.sevBadge(f.severity), h.run('  '), h.statusPill(f)]));
  // meta grid
  const modelName = t.core.risk_model[f.risk.model] ?? f.risk.model;
  const score = f.risk.score != null && f.risk.model !== 'matrix' ? f.risk.label : t.core.n_a;
  const vec = f.risk.vector ? f.risk.vector.replace(/^CVSS:(3\.1|4\.0)\//, '') : '';
  const owasp = f.mapping.filter((m: any) => /^(owasp|masvs)/.test(m.standard));
  const other = f.mapping.filter((m: any) => !/^(owasp|masvs)/.test(m.standard));
  const d = f.risk.details;
  const ki = d.likelihood != null ? `${d.likelihood} × ${d.impact}` : '—';
  const cell = (label: string, value: string, mono = true) => [h.p([h.label(label)], { spacing: { after: h.PT(1) } }), h.p([mono ? new TextRun({ text: value, font: h.fonts.mono, size: h.PT(8.5) }) : h.run(value, { size: h.PT(8.5) } as any)], { spacing: { after: h.PT(3) } })];
  const owaspTxt = owasp.length ? owasp.map((m: any) => m.title || m.item).join(', ') : other.length ? other.map((m: any) => m.item).join(', ') : '—';
  out.push(h.rule());
  out.push(h.columns([cell(modelName, `${score}${vec ? ' · ' + vec : ''}`), cell(t.core.cwe, f.cwe.length ? f.cwe.join(', ') : '—'), cell(owasp.length ? 'OWASP' : t.core.mapping, owaspTxt, !owasp.length)], [66, 50, 54]));
  out.push(h.columns([cell(tb.likelihood_impact, ki), cell(t.core.asset, f.affected.length ? f.affected.join(', ') : '—')], [66, 104]));
  out.push(h.rule());
  const section = (title: string, md?: string) => { if (md) out.push(h.h3(title), ...h.md(md)); };
  section(tb.summary, s.summary);
  section(t.core.description, s.description);
  const modelSev = d.modelSeverity;
  if (s.classification) out.push(h.box([h.p([h.run(tb.classification, { bold: true, color: hx(c.primary) } as any)]), ...h.md(s.classification)], { accent: c.primary }), h.spacer(4));
  else if (modelSev && modelSev !== f.severity) out.push(h.box([h.p([h.run(tb.classification, { bold: true, color: hx(c.primary) } as any)]), h.p(tb.classification_auto.replace('{score}', f.risk.label).replace('{model_severity}', String(t.severity[modelSev]).toLowerCase()).replace('{severity}', String(t.severity[f.severity]).toLowerCase()))], { accent: c.primary }), h.spacer(4));
  section(t.core.evidence, s.evidence);
  if (s.impact && s.likelihood) out.push(h.columns([[h.h3(t.core.impact), ...h.md(s.impact)], [h.h3(tb.likelihood), ...h.md(s.likelihood)]], [82, 82]));
  else { section(t.core.impact, s.impact); section(tb.likelihood, s.likelihood); }
  if (s.recommendation) out.push(h.spacer(2), h.box([h.p([h.run(t.core.recommendation, { bold: true, color: hx(c.accent) } as any)]), ...h.md(s.recommendation)], { fill: c.calloutBg, accent: c.accent }), h.spacer(4));
  section(tb.notes, s.notes);
  for (const [k, v] of Object.entries(s)) if (!['summary', 'description', 'classification', 'impact', 'likelihood', 'evidence', 'recommendation', 'notes', 'references'].includes(k)) section(k[0].toUpperCase() + k.slice(1), v as string);
  if (s.references) { out.push(h.h3(t.core.references)); for (const b of h.md(s.references)) out.push(b); }
  out.push(h.h3(t.core.retest));
  if (f.retest) out.push(h.p([h.statusPill(f), h.run('  '), h.run(f.retest.note ?? '')])); else out.push(h.p(tb.retest_pending));
  return out;
}
