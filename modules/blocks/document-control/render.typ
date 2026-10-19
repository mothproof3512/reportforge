#import "/modules/lib/rf.typ"

#let people(ps) = ps.map(p => if p.at("role", default: none) != none [#p.name #text(fill: gray)[(#p.role)]] else [#p.name]).join(", ")

#let render(ctx, theme, t, opts) = {
  let eng = ctx.engagement
  let tb = t.blocks.document-control
  pagebreak(weak: true)
  heading(level: 1, numbering: none, outlined: false, tb.title)
  let pairs = (
    (t.core.client, eng.client.name),
    (t.core.provider, theme.provider.name),
    (t.core.reference, eng.reference),
    (t.core.version, eng.version),
    (t.core.date, ctx.fmt.date),
    (t.core.period, ctx.fmt.period_start + " – " + ctx.fmt.period_end),
    (t.core.authors, people(eng.authors)),
  )
  if eng.at("testers", default: none) != none and eng.testers.len() > 0 { pairs.push((t.core.testers, people(eng.testers))) }
  if eng.at("reviewers", default: none) != none and eng.reviewers.len() > 0 { pairs.push((t.core.reviewers, people(eng.reviewers))) }
  if eng.at("classification", default: none) != none { pairs.push((t.core.classification, eng.classification)) }
  rf.kv(theme, pairs)
  v(1.2em)
  if ctx.fmt.history.len() > 0 {
    heading(level: 2, numbering: none, outlined: false, tb.history)
    rf.table(theme,
      widths: (18mm, 32mm, 42mm, 1fr),
      rows: ((t.core.version, t.core.date, t.core.author, t.core.change),) + ctx.fmt.history.map(h => (h.version, h.date, h.author, h.change)),
    )
  }
  v(0.6em)
  heading(level: 2, numbering: none, outlined: false, tb.distribution)
  tb.distribution_text.replace("{client}", eng.client.name)
  if eng.client.at("contact", default: none) != none and eng.client.contact.len() > 0 {
    v(0.4em)
    list(..eng.client.contact.map(p => [#p.name#if p.at("role", default: none) != none [, #p.role]#if p.at("email", default: none) != none [ — #raw(p.email)]]))
  }
}
