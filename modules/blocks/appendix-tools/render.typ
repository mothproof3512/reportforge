#import "/modules/lib/rf.typ"

#let render(ctx, theme, t, opts) = {
  let tb = t.blocks.appendix-tools
  let tools = ctx.engagement.at("tools", default: none)
  if tools == none or tools.len() == 0 { return }
  pagebreak(weak: true)
  heading(level: 1, numbering: none, tb.title)
  tb.intro
  rf.table(theme,
    widths: (40mm, 22mm, 1fr),
    rows: ((t.core.name, t.core.version, t.core.purpose),) + tools.map(x => (x.name, x.at("version", default: ""), x.at("purpose", default: ""))),
  )
}
