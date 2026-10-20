#import "/modules/lib/rf.typ"

#let render(ctx, theme, t, opts) = {
  let eng = ctx.engagement
  let tb = t.blocks.conclusion
  rf.chapter(tb.title)
  if opts.at("subheads", default: false) { heading(level: 2, numbering: none, outlined: false, tb.main_conclusion) }
  if eng.at("conclusion", default: none) != none {
    eng.conclusion
  } else if ctx.stats.total == 0 {
    tb.auto_none.replace("{provider}", theme.provider.name)
  } else {
    tb.auto.replace("{total}", str(ctx.stats.total)).replace("{highest}", lower(t.severity.at(ctx.stats.highest))).replace("{provider}", theme.provider.name)
  }
  if eng.at("recommendations", default: none) != none {
    heading(level: 2, tb.recommendations)
    eng.recommendations
  }
  let rm = ctx.fmt.at("roadmap", default: ())
  if rm.len() > 0 {
    heading(level: 2, numbering: none, outlined: false, tb.roadmap)
    for g in rm { rf.callout(theme, color: theme.colors.accent, title: if g.title != "" { g.title } else { none }, g.body) }
  }
}
