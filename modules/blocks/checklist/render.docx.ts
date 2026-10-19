import { TextRun, ShadingType } from 'docx';
import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const tb = t.blocks.checklist, mode = opts.mode ?? 'coverage', cov = ctx.coverage ?? [], c = theme.colors;
  if (!cov.length) return [];
  const hx = (s: string) => s.replace('#', '');
  const out: Block[] = [h.h1(mode === 'plan' ? tb.title_plan : tb.title_coverage, { numbered: mode === 'plan' }), h.p(mode === 'plan' ? tb.intro_plan : tb.intro_coverage)];
  const chip = (st: string) => { const col = st === 'tested' ? c.severity.low : st === 'finding' ? c.severity.high : st === 'n/a' ? c.muted : c.rule; return new TextRun({ text: ` ${(t.core.checklist_status[st] ?? st).toUpperCase()} `, bold: true, size: h.PT(7), color: st === 'not-tested' ? hx(c.ink) : 'FFFFFF', shading: { type: ShadingType.CLEAR, fill: hx(col) }, font: h.fonts.body }); };
  for (const sd of ctx.standards.filter((s: any) => cov.some((x: any) => x.standard === s.id))) {
    const items = cov.filter((x: any) => x.standard === sd.id);
    out.push(h.h2(`${sd.name}${sd.version && !sd.name.includes(sd.version) ? ' ' + sd.version : ''}`, { numbered: false }));
    if (mode !== 'plan') { const n = (st: string) => items.filter((i: any) => i.status === st).length; out.push(h.p([h.muted(tb.summary.replace('{tested}', String(n('tested') + n('finding'))).replace('{total}', String(items.length)).replace('{finding}', String(n('finding'))).replace('{na}', String(n('n/a'))).replace('{nottested}', String(n('not-tested'))), 9)])); }
    const rows: any[] = [[t.core.item, '', t.core.status, t.core.notes]];
    let last: string | undefined;
    for (const i of items) {
      if (i.category && i.category !== last) { rows.push([[h.run(i.category, { bold: true, size: h.PT(8.5), color: hx(c.headingColor) } as any)], '', '', '']); last = i.category; }
      rows.push([[h.mono(i.item)], [h.run(i.title, { size: h.PT(9) } as any)], mode === 'plan' ? [h.run('☐')] : [chip(i.status)], [h.run([i.note, i.findings?.join(', ')].filter(Boolean).join(' '), { size: h.PT(8.5) } as any)]]);
    }
    out.push(h.table(rows, { widths: [30, 72, 24, 44] }), h.spacer(6));
  }
  return out;
}
