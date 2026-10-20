#import "/modules/lib/rf.typ"

#let render(ctx, theme, t, opts) = {
  let eng = ctx.engagement
  let tb = t.blocks.positives
  if eng.at("positives", default: none) == none { return }
  rf.chapter(tb.title, subtitle: tb.subtitle)
  eng.positives
}
