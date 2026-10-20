#import "/modules/lib/rf.typ"

#let render(ctx, theme, t, opts) = {
  let tb = t.blocks.findings-intro
  if opts.at("layout", default: "classic") == "extended" {
    rf.chapter(tb.title_extended)
    if ctx.findings.len() == 0 { tb.none } else { text(size: 9.5pt, fill: theme.colors.muted, tb.intro_short); v(0.4em) }
    return
  }
  rf.chapter(tb.title)
  if ctx.findings.len() == 0 { tb.none } else { tb.intro }
}
