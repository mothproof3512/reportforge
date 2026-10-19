import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const eng = ctx.engagement, tb = t.blocks.methodology;
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
