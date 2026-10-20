import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const tb = t.blocks['retest-overview'], eng = ctx.engagement;
  if (opts.layout === 'extended') {
    const out: Block[] = [h.h1(tb.title_extended), h.subtitle(tb.subtitle)];
    out.push(h.table([['ID', t.core.status, tb.verification, t.core.notes], ...ctx.findings.map((f: any) => [[h.mono(f.id)], [h.statusPill(f)], f.retest ? (h as any).fmt.retest_date : '–', f.retest?.note ?? ''])], { widths: [16, 28, 42, 84] }));
    out.push(h.h2(tb.procedure, { numbered: false }), h.p(eng.retest ? tb.intro.replace('{date}', (h as any).fmt.retest_date).replace('{version}', eng.retest.of_version) : tb.procedure_text.replace('{provider}', theme.provider.name)));
    return out;
  }
  const out: Block[] = [h.h1(tb.title)];
  if (eng.retest) out.push(h.p(tb.intro.replace('{date}', (h as any).fmt.retest_date).replace('{version}', eng.retest.of_version)));
  const statuses = ['resolved', 'partially-resolved', 'open', 'not-tested', 'risk-accepted'];
  const count = (st: string) => ctx.findings.filter((f: any) => f.retest?.status === st).length;
  out.push(h.table([statuses.map((s) => t.core.retest_status[s]), statuses.map((s) => [h.run(String(count(s)), { bold: true, size: h.PT(14) } as any)])], { widths: [34, 34, 34, 34, 34], aligns: ['center', 'center', 'center', 'center', 'center'] }), h.spacer(6));
  out.push(h.table([['ID', t.core.finding, t.core.severity, t.core.retest], ...ctx.findings.map((f: any) => [[h.run(f.id, { bold: true, size: h.PT(9) } as any)], [h.run(f.title, { size: h.PT(9) } as any)], [h.badge(f.severity)], [h.run(f.retest ? (t.core.retest_status[f.retest.status] ?? f.retest.status) : '—', { size: h.PT(9) } as any)]])], { widths: [14, 100, 22, 34] }));
  return out;
}
