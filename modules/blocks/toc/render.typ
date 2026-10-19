#import "/modules/lib/rf.typ"

#let render(ctx, theme, t, opts) = {
  let c = theme.colors
  pagebreak(weak: true)
  heading(level: 1, numbering: none, outlined: false, t.blocks.toc.title)
  show outline.entry.where(level: 1): it => {
    v(0.9em, weak: true)
    text(weight: "bold", size: 10.5pt, it)
  }
  show outline.entry.where(level: 2): set text(size: 9.5pt)
  outline(title: none, depth: opts.at("depth", default: 2), indent: 1.2em)
}
