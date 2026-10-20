import type { Block, Helpers } from '@reportforge/render-docx';
const people = (ps: any[] = []) => ps.map((p) => (p.role ? `${p.name} (${p.role})` : p.name)).join(', ');
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const eng = ctx.engagement, tb = t.blocks['document-control'], fmt = (h as any).fmt, c = theme.colors;
  const out: Block[] = [h.h1(tb.title, { numbered: false, pageBreak: false })];
  const txt = (key: string, fallback: string) => { const x = theme.texts?.[key]; return x ? (x[ctx.lang] ?? x.en ?? fallback) : fallback; };
  if (opts.layout === 'extended') {
    out.push(h.subtitle(tb.subtitle));
    const hist = fmt.history.length ? fmt.history : [{ version: eng.version, date: fmt.date, author: people(eng.authors), change: eng.status ?? '' }];
    out.push(h.h2(tb.history, { numbered: false }));
    out.push(h.table([[t.core.version, t.core.date, t.core.author, t.core.change], ...hist.map((x: any) => [x.version, x.date, x.author, x.change])], { widths: [16, 36, 40, 78] }), h.spacer(6));
    const contacts: any[] = eng.client.contact ?? [];
    const left: Block[] = [h.h2(tb.distribution, { numbered: false })];
    if (contacts.length) left.push(h.table([[tb.name_role, tb.organisation], ...contacts.map((p) => [p.name + (p.role ? ', ' + p.role : ''), eng.client.name])], { widths: [46, 30] }));
    else left.push(h.p(tb.distribution_text.replace('{client}', eng.client.name)));
    if (eng.reviewers?.length) left.push(h.p([h.muted(`${t.core.reviewers}: ${people(eng.reviewers)}`, 8.5)]));
    const prov = theme.provider;
    const pairs: Array<[string, string]> = [[tb.company, prov.name]];
    if (prov.address) pairs.push([tb.address, prov.address.join(', ')]);
    if (prov.phone) pairs.push([tb.phone, prov.phone]);
    if (prov.email) pairs.push([tb.email, prov.email]);
    if (prov.website) pairs.push([tb.website, prov.website]);
    if (prov.registration) pairs.push([tb.registration, prov.registration]);
    const right: Block[] = [h.h2(tb.contact, { numbered: false }), h.table(pairs.map(([k, v]) => [[h.muted(k, 8.5)], [h.mono(v)]]), { widths: [24, 52], header: false })];
    out.push(h.columns([left, right], [82, 82]), h.spacer(8));
    const cls = eng.classification ?? '—';
    const left2: Block[] = [h.h2(t.core.classification, { numbered: false }), ...h.md(txt('classification_text', tb.classification_text).replace(/\{classification\}/g, cls))];
    const right2: Block[] = [h.h2(tb.about, { numbered: false }), h.box(h.md(txt('about_report', tb.about_text)), { accent: c.accent, width: 76 })];
    out.push(h.columns([left2, right2], [82, 82]));
  } else {
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
      out.push(h.table([[t.core.version, t.core.date, t.core.author, t.core.change], ...fmt.history.map((x: any) => [x.version, x.date, x.author, x.change])], { widths: [16, 36, 40, 78] }), h.spacer(6));
    }
    out.push(h.h2(tb.distribution, { numbered: false }), h.p(tb.distribution_text.replace('{client}', eng.client.name)));
    for (const p of eng.client.contact ?? []) out.push(h.p(`• ${p.name}${p.role ? ', ' + p.role : ''}${p.email ? ' — ' + p.email : ''}`));
  }
  out.push(h.pageBreak());
  return out;
}
