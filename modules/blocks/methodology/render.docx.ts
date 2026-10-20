import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const eng = ctx.engagement, tb = t.blocks.methodology;
  if (opts.layout === 'extended') return extended(ctx, theme, t, h);
  const out: Block[] = [h.h1(tb.title)];
  out.push(...(eng.test_approach ? h.md(eng.test_approach) : [h.p(tb.intro)]));
  if (ctx.standards.length) {
    out.push(h.h2(tb.standards_title));
    for (const s of ctx.standards) {
      out.push(h.p([h.run(s.name, { bold: true } as any), h.muted(s.version ? ` (${s.version})` : '', 9)], { keepNext: true, spacing: { after: h.PT(1) } }));
      out.push(h.p(s.description?.[ctx.lang] ?? ''));
    }
  }
  out.push(h.h2(tb.risk_title), h.p(eng.risk_model === 'matrix' ? tb.risk_matrix : tb.risk_cvss.replace('{model}', t.core.risk_model[eng.risk_model])));
  if (eng.tools?.length) out.push(h.p(tb.tools_ref));
  return out;
}

async function extended(ctx: any, theme: any, t: any, h: Helpers): Promise<Block[]> {
  const eng = ctx.engagement, tb = t.blocks.methodology, fmt = (h as any).fmt, c = theme.colors, tp = eng.testplan ?? {};
  const out: Block[] = [h.h1(tb.title)];
  out.push(...(eng.test_approach ? h.md(eng.test_approach) : tp.approach ? h.md(tp.approach) : [h.p(tb.intro)]));
  const phases: any[] = fmt.planning ?? [];
  if (phases.length) {
    out.push(h.h2(tb.course, { numbered: false }));
    out.push(h.table([phases.map((p, i) => [h.p([h.run((i === phases.length - 1 ? '● ' : '○ ') + p.phase, { bold: true, size: h.PT(8) } as any)], { spacing: { after: 0 } }), h.p([h.mono(p.start_short ? `[${p.start_short}${p.end_short && p.end_short !== p.start_short ? ' – ' + p.end_short : ''}]` : '')])])], { header: false, widths: Array(phases.length).fill(h.textWidthMm / phases.length) }));
  }
  const left: Block[] = [h.h2(tb.framework, { numbered: false }), ...ctx.standards.map((s: any) => h.p(`• ${s.name}${s.version ? ' (' + s.version + ')' : ''}`)), h.p(`• ${t.core.risk_model[eng.risk_model]} ${tb.for_scoring}`)];
  const right: Block[] = eng.tools?.length ? [h.h2(t.core.tools, { numbered: false }), h.p(eng.tools.flatMap((x: any) => [h.mono(` ${x.name} `), h.run('  ')]))] : [];
  out.push(h.columns([left, right], [82, 82]));
  out.push(h.h2(tb.limitations, { numbered: false }), ...(eng.limitations ? h.md(eng.limitations) : [h.p(tb.limitations_text)]));
  return out;
}
