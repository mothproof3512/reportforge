import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const tb = t.blocks['attestation-findings']; if (!ctx.findings.length) return [];
  const hasRetest = !!ctx.engagement.retest;
  return [h.h1(tb.title, { numbered: false, pageBreak: false }), h.p(tb.intro), h.table([['ID', t.core.finding, t.core.severity, hasRetest ? t.core.retest : t.core.status], ...ctx.findings.map((f: any) => [[h.run(f.id, { bold: true, size: h.PT(9) } as any)], [h.run(f.title, { size: h.PT(9) } as any)], [h.badge(f.severity)], [h.run(hasRetest ? (f.retest ? (t.core.retest_status[f.retest.status] ?? f.retest.status) : '—') : f.status, { size: h.PT(9) } as any)]])], { widths: [14, 100, 22, 34] })];
}
