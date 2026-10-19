import type { Block, Helpers } from '@reportforge/render-docx';
import { Paragraph, TextRun, BorderStyle } from 'docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const eng = ctx.engagement, tb = t.blocks['intake-details'], it = eng.intake ?? {}, c = theme.colors;
  const out: Block[] = [];
  const rules = () => {
    if (it.test_window) out.push(h.h2(tb.test_window), h.p(it.test_window));
    if (it.allowed?.length || it.not_allowed?.length) {
      out.push(h.box([h.p([h.run(tb.allowed, { bold: true } as any)]), ...(it.allowed ?? []).map((a: string) => h.p(`• ${a}`))], { accent: c.severity.low }), h.spacer(4));
      out.push(h.box([h.p([h.run(tb.not_allowed, { bold: true } as any)]), ...(it.not_allowed ?? []).map((a: string) => h.p(`• ${a}`))], { accent: c.severity.high }), h.spacer(4));
    }
    if (it.emergency_contact) out.push(h.h2(tb.emergency), h.p(it.emergency_contact));
  };
  if (opts.rules_only) { out.push(h.h1(tb.rules)); rules(); return out; }
  out.push(h.h1(tb.title));
  const sec = (title: string, md?: string) => { if (md) out.push(h.h2(title), ...h.md(md)); };
  sec(tb.goal, it.goal); sec(tb.background, it.background);
  if (it.test_type) out.push(h.h2(tb.test_type), h.p(tb.types[it.test_type] ?? it.test_type));
  sec(tb.credentials, it.credentials);
  sec(tb.preconditions, it.preconditions);
  out.push(h.h2(tb.rules)); rules();
  if (it.deliverables?.length) out.push(h.h2(tb.deliverables), ...it.deliverables.map((d: string) => h.p(`• ${d}`)));
  if (it.notes) sec(t.core.notes, it.notes);
  out.push(h.h2(tb.agreement), h.p(tb.agreement_text.replaceAll('{client}', eng.client.name).replaceAll('{provider}', theme.provider.name)));
  out.push(h.table([[[h.muted(t.core.agreed, 8.5)], [h.muted(t.core.agreed, 8.5)]], [[h.run(eng.client.name, { bold: true } as any)], [h.run(theme.provider.name, { bold: true } as any)]], [[h.run(' ')], [h.run(' ')]], [[h.run(' ')], [h.run(' ')]], [[h.muted(`${t.core.name}, ${t.core.place_date}, ${t.core.signature}`, 8)], [h.muted(`${t.core.name}, ${t.core.place_date}, ${t.core.signature}`, 8)]]], { widths: [82, 82], header: false }));
  return out;
}
