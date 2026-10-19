#import "/modules/lib/rf.typ"

#let render(ctx, theme, t, opts) = {
  let tb = t.blocks.attestation-coverage
  if ctx.coverage.len() == 0 { return }
  heading(level: 1, numbering: none, tb.title)
  tb.intro
  let stds = ctx.standards.filter(s => ctx.coverage.any(c => c.standard == s.id))
  rf.table(theme, widths: (1fr, 40mm, 40mm), align: ("left", "right", "left"),
    rows: ((t.core.standards, tb.tested, ""),) + stds.map(s => {
      let items = ctx.coverage.filter(c => c.standard == s.id)
      let applicable = items.filter(i => i.status != "n/a")
      let done = applicable.filter(i => i.status == "tested" or i.status == "finding").len()
      let pct = if applicable.len() == 0 { 0 } else { calc.round(100 * done / applicable.len()) }
      (s.name, [#done #tb.of #applicable.len() #tb.items], block(width: 100%, height: 8pt, fill: theme.colors.surface, radius: 2pt, align(left, box(width: calc.max(1%, pct * 1%), height: 8pt, fill: theme.colors.accent, radius: 2pt))))
    }))
}
