#import "/modules/lib/rf.typ"

#let render(ctx, theme, t, opts) = {
  let tb = t.blocks.findings-intro
  rf.chapter(tb.title)
  if ctx.findings.len() == 0 { tb.none } else { tb.intro }
}
