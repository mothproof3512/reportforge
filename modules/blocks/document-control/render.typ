#import "/modules/lib/rf.typ"

#let people(ps) = ps.map(p => if p.at("role", default: none) != none [#p.name #text(fill: gray)[(#p.role)]] else [#p.name]).join(", ")

// Classic layout: key/value block, version history, distribution.
#let classic(ctx, theme, t, opts) = {
  let eng = ctx.engagement
  let tb = t.blocks.document-control
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
      widths: (16mm, 36mm, 40mm, 1fr),
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

// Extended layout (report template): version history, then distribution list
// and provider contact details side by side, then classification text and an
// "about this report" callout.
#let extended(ctx, theme, t, opts) = {
  let eng = ctx.engagement
  let tb = t.blocks.document-control
  let c = theme.colors
  rf.chapter-subtitle(tb.subtitle)
  heading(level: 2, numbering: none, outlined: false, tb.history)
  let hist = if ctx.fmt.history.len() > 0 { ctx.fmt.history } else { ((version: eng.version, date: ctx.fmt.date, author: people(eng.authors), change: eng.at("status", default: "")),) }
  rf.table(theme,
    widths: (16mm, 36mm, 40mm, 1fr),
    rows: ((t.core.version, t.core.date, t.core.author, t.core.change),) + hist.map(h => (h.version, h.date, h.author, h.change)),
  )
  v(0.4em)
  let contacts = eng.client.at("contact", default: ())
  let prov = theme.provider
  let pairs = ((tb.company, prov.name),)
  if prov.at("address", default: none) != none { pairs.push((tb.address, prov.address.join(", "))) }
  if prov.at("phone", default: none) != none { pairs.push((tb.phone, prov.phone)) }
  if prov.at("email", default: none) != none { pairs.push((tb.email, prov.email)) }
  if prov.at("website", default: none) != none { pairs.push((tb.website, prov.website)) }
  if prov.at("registration", default: none) != none { pairs.push((tb.registration, prov.registration)) }
  grid(
    columns: (1fr, 1fr), column-gutter: 10mm,
    {
      heading(level: 2, numbering: none, outlined: false, tb.distribution)
      if contacts.len() > 0 {
        rf.table(theme, widths: (1fr, auto), size: 8.5pt,
          rows: ((tb.name_role, tb.organisation),) + contacts.map(p => ([#p.name#if p.at("role", default: none) != none [, #p.role]], eng.client.name)))
      } else { text(size: 9pt, fill: c.muted, tb.distribution_text.replace("{client}", eng.client.name)) }
      if eng.at("reviewers", default: none) != none and eng.reviewers.len() > 0 {
        v(0.2em); text(size: 8.5pt, fill: c.muted)[#t.core.reviewers: #people(eng.reviewers)]
      }
    },
    {
      heading(level: 2, numbering: none, outlined: false, tb.contact)
      block(above: 0.8em, std.table(columns: (auto, 1fr), inset: (x: 6pt, y: 5pt), stroke: none,
        fill: (x, y) => if calc.rem(y, 2) == 0 { c.surface } else { none },
        ..pairs.map(p => (text(size: 8.5pt, fill: c.muted, p.at(0)), text(size: 9pt, font: theme.fonts.mono, p.at(1)))).flatten()))
    },
  )
  v(0.6em)
  grid(
    columns: (1fr, 1fr), column-gutter: 10mm,
    {
      heading(level: 2, numbering: none, outlined: false, t.core.classification)
      let txt = theme.texts.at("classification_text", default: none)
      show "{classification}": eng.at("classification", default: "—")
      if txt != none { txt.at(ctx.lang, default: txt.at("en", default: [])) } else { tb.classification_text }
    },
    {
      heading(level: 2, numbering: none, outlined: false, tb.about)
      let txt = theme.texts.at("about_report", default: none)
      rf.callout(theme, color: c.accent, if txt != none { txt.at(ctx.lang, default: txt.at("en", default: [])) } else { tb.about_text })
    },
  )
}

#let render(ctx, theme, t, opts) = {
  let tb = t.blocks.document-control
  pagebreak(weak: true)
  heading(level: 1, numbering: none, outlined: false, tb.title)
  if opts.at("layout", default: "classic") == "extended" { extended(ctx, theme, t, opts) } else { classic(ctx, theme, t, opts) }
}
