import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const tb = t.blocks.appendices, eng = ctx.engagement;
  const out: Block[] = [h.h1(tb.title)];
  let letter = 0;
  const section = (title: string) => h.h2(`${'ABCDEF'[letter++]} · ${title}`, { numbered: false });
  if (opts.tools !== false && eng.tools?.length) {
    out.push(section(tb.tools), h.table(eng.tools.map((x: any) => [x.name, [h.mono(x.version ?? '–')]]), { header: false, widths: [85, 85] }));
  }
  if (opts.mapping !== false && ctx.findings.length) {
    const owasp = (f: any) => { const m = f.mapping.filter((x: any) => x.standard.startsWith('owasp-top10')); return (m.length ? m : f.mapping).map((x: any) => x.item + (m.length && x.title ? ' ' + x.title : '')).join(', '); };
    out.push(section(tb.mapping), h.table([['ID', t.core.cwe, tb.owasp_col], ...ctx.findings.map((f: any) => [[h.mono(f.id)], [h.mono(f.cwe.length ? f.cwe.join(', ') : '–')], owasp(f)])], { widths: [18, 40, 112] }));
  }
  if (opts.glossary !== false) {
    let terms: Array<{ term: string; definition: string }> = eng.glossary?.length ? eng.glossary : [];
    if (!terms.length) {
      const txt = [...ctx.findings.flatMap((f: any) => [f.title, ...Object.values(f.sections)]), eng.executive_summary, eng.conclusion, eng.positives, eng.test_approach].filter(Boolean).join(' ').toLowerCase();
      terms = (tb.terms as any[]).filter((x) => x.always || new RegExp(x.match, 'i').test(txt));
    }
    if (terms.length) out.push(section(tb.glossary), h.table(terms.map((x) => [[h.muted(x.term, 9)], x.definition]), { header: false, widths: [40, 130] }));
  }
  if (opts.disclaimer !== false && theme.texts?.disclaimer) {
    const s = (theme.texts.disclaimer[ctx.lang] ?? theme.texts.disclaimer.en ?? '').replaceAll('{client}', eng.client.name).replaceAll('{provider}', theme.provider.name);
    out.push(section(tb.disclaimer), ...h.md(s));
  }
  return out;
}
