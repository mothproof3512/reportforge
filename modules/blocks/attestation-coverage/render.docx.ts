import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const tb = t.blocks['attestation-coverage'], cov = ctx.coverage ?? []; if (!cov.length) return [];
  const rows: any[] = [[t.core.standards, tb.tested, '%']];
  for (const sd of ctx.standards.filter((s: any) => cov.some((x: any) => x.standard === s.id))) {
    const items = cov.filter((x: any) => x.standard === sd.id), appl = items.filter((i: any) => i.status !== 'n/a'), done = appl.filter((i: any) => i.status === 'tested' || i.status === 'finding').length;
    rows.push([sd.name, `${done} ${tb.of} ${appl.length} ${tb.items}`, `${appl.length ? Math.round(100 * done / appl.length) : 0}%`]);
  }
  return [h.h1(tb.title, { numbered: false, pageBreak: false }), h.p(tb.intro), h.table(rows, { widths: [90, 50, 30], aligns: ['left', 'right', 'right'] })];
}
