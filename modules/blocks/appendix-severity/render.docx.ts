import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const tb = t.blocks['appendix-severity'], model = ctx.engagement.risk_model;
  const ranges = model === 'matrix' ? ['20 – 25', '12 – 19', '6 – 11', '2 – 5', '1'] : ['9.0 – 10.0', '7.0 – 8.9', '4.0 – 6.9', '0.1 – 3.9', '0.0'];
  const out: Block[] = [h.h1(tb.title, { numbered: false }), h.p(model === 'matrix' ? tb.matrix_intro : tb.cvss_intro.replace('{model}', t.core.risk_model[model]))];
  out.push(h.table([[tb.range, tb.level, tb.meaning], ...(h as any).severities.map((s: any, i: number) => [ranges[i], [h.badge(s.id)], tb[s.id]])], { widths: [24, 26, 120] }));
  out.push(h.h2(tb.status_title, { numbered: false }));
  for (const k of ['status_confirmed', 'status_likely', 'status_fp']) out.push(h.p(`• ${tb[k]}`));
  return out;
}
