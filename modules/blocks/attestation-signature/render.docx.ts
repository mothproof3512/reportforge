import { Paragraph, TextRun, BorderStyle } from 'docx';
import type { Block, Helpers } from '@reportforge/render-docx';
export async function render(ctx: any, theme: any, t: any, opts: any, h: Helpers): Promise<Block[]> {
  const eng = ctx.engagement, tb = t.blocks['attestation-signature'], at = eng.attestation ?? {}, sig = at.signatory ?? { name: eng.authors?.[0]?.name ?? '' };
  return [
    h.spacer(14),
    h.p(tb.signed.replace('{place}', at.place ?? '').replace('{date}', (h as any).fmt.date)),
    h.p(tb.on_behalf.replace('{provider}', theme.provider.name)),
    h.spacer(30),
    new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '15202B', space: 4 } }, children: [new TextRun(' ')], spacing: { after: h.PT(4) }, indent: { right: h.MM(90) } }),
    h.p([h.run(sig.name, { bold: true } as any)], { spacing: { after: 0 } }),
    ...(sig.role ? [h.p([h.muted(sig.role, 9)])] : []),
  ];
}
