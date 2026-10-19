#import "/modules/lib/rf.typ"

#let render(ctx, theme, t, opts) = {
  let tb = t.blocks.disclaimer
  let txt = theme.texts.at("disclaimer", default: none)
  if txt == none { return }
  pagebreak(weak: true)
  heading(level: 1, numbering: none, tb.title)
  // texts are rendered as content; substitute {client} via show rule
  show "{client}": ctx.engagement.client.name
  txt.at(ctx.lang, default: txt.at("en", default: []))
}
