#import "/modules/lib/rf.typ"

#let render(ctx, theme, t, opts) = {
  let eng = ctx.engagement
  let tb = t.blocks.conclusion
  rf.chapter(tb.title)
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
}
