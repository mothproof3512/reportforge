import type { Block, Helpers } from '@reportforge/render-docx';
const people = (ps: any[] = []) => ps.map((p) => (p.role ? `${p.name} (${p.role})` : p.name)).join(', ');
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const eng = ctx.engagement, tb = t.blocks['document-control'], fmt = (h as any).fmt;
  const out: Block[] = [h.h1(tb.title, { numbered: false, pageBreak: false })];
  const pairs: Array<[string, string]> = [
    [t.core.client, eng.client.name], [t.core.provider, theme.provider.name], [t.core.reference, eng.reference], [t.core.version, eng.version], [t.core.date, fmt.date],
    [t.core.period, `${fmt.period_start} – ${fmt.period_end}`], [t.core.authors, people(eng.authors)],
  ];
  if (eng.testers?.length) pairs.push([t.core.testers, people(eng.testers)]);
  if (eng.reviewers?.length) pairs.push([t.core.reviewers, people(eng.reviewers)]);
  if (eng.classification) pairs.push([t.core.classification, eng.classification]);
  out.push(h.kv(pairs), h.spacer(8));
  if (fmt.history.length) {
    out.push(h.h2(tb.history, { numbered: false }));
    out.push(h.table([[t.core.version, t.core.date, t.core.author, t.core.change], ...fmt.history.map((x: any) => [x.version, x.date, x.author, x.change])], { widths: [18, 32, 42, 78] }), h.spacer(6));
  }
  out.push(h.h2(tb.distribution, { numbered: false }), h.p(tb.distribution_text.replace('{client}', eng.client.name)));
  for (const p of eng.client.contact ?? []) out.push(h.p(`• ${p.name}${p.role ? ', ' + p.role : ''}${p.email ? ' — ' + p.email : ''}`));
  out.push(h.pageBreak());
  return out;
}
