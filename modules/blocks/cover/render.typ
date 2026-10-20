#import "/modules/lib/rf.typ"

// Cover page. Three styles, chosen by theme.page.cover:
//   band    — full-width colour band with the title, white space below
//   image   — the theme's cover image bleeds across the top half
//   minimal — typographic cover on white
//   dark    — full-page primary colour, logo top-left, title and key/value block bottom-left
//   split   — primary colour column on the left (logo, meta), title on white right
//   geometric — white page, large accent/primary shapes top-right, title bottom-left
#let render(ctx, theme, t, opts) = {
  let c = theme.colors
  let eng = ctx.engagement
  let tb = t.blocks.cover
  let style = theme.page.at("cover", default: "band")
  let doc-label = t.core.at(ctx.document + "_report", default: t.core.report)
  if ctx.document == "attestation" { doc-label = t.core.attestation }
  let logo = theme.assets.at("logo", default: none)
  let has-image = style == "image" and theme.assets.at("cover_image", default: none) != none

  let meta = (
    (t.core.reference, eng.reference),
    (t.core.version, eng.version),
    (t.core.date, ctx.fmt.date),
  )
  if opts.at("show_period", default: true) { meta.push((t.core.period, ctx.fmt.period_start + " – " + ctx.fmt.period_end)) }
  if eng.at("classification", default: none) != none { meta.push((t.core.classification, eng.classification)) }

  let title-block(fg, size: 30pt) = [
    #set par(justify: false)
    #text(size: 10.5pt, weight: "semibold", tracking: 0.14em, fill: fg)[#upper(doc-label)]
    #v(1.4em)
    #block(width: 100%, text(size: size, weight: "bold", fill: fg, font: theme.fonts.heading, hyphenate: false, eng.title))
    #if eng.at("subtitle", default: none) != none {
      v(0.5em)
      text(size: 14pt, fill: fg, eng.subtitle)
    }
    #v(1.4em)
    #text(size: 13pt, fill: fg)[#tb.for #h(0.3em) #text(weight: "semibold", eng.client.name)]
  ]

  let meta-table(pairs) = grid(
    columns: (auto, 1fr),
    row-gutter: 6pt,
    column-gutter: 10mm,
    ..pairs.map(p => (text(size: 8.5pt, fill: c.muted, tracking: 0.06em, upper(p.at(0))), text(size: 10pt, p.at(1)))).flatten(),
  )

  page(
    header: none,
    footer: none,
    margin: 0pt,
    numbering: none,
    {
      if style == "dark" {
        let fg = white
        let dim = white.transparentize(35%)
        place(top + left, rect(width: 100%, height: 100%, fill: c.primary))
        // decorative ring, bottom right, partly off the page
        place(bottom + right, dx: 48mm, dy: 60mm, circle(radius: 78mm, stroke: 30mm + white.transparentize(92%)))
        place(top + left, dx: 20mm, dy: 20mm, if logo != none {
          box(fill: white, radius: 3pt, inset: (x: 8pt, y: 6pt), image(logo, height: 12mm))
        } else {
          box(stroke: (dash: "dashed", paint: dim, thickness: 0.6pt), inset: (x: 10pt, y: 8pt), text(fill: dim, size: 7pt, weight: "semibold", tracking: 0.12em, upper(theme.provider.name)))
        })
        let big = if eng.title.len() > 34 { 30pt } else if eng.title.len() > 22 { 38pt } else { 46pt }
        place(bottom + left, dx: 20mm, dy: -22mm, block(width: 120mm, {
          set par(justify: false, leading: 0.5em)
          text(size: 9pt, weight: "bold", fill: c.accent.lighten(20%), tracking: 0.08em, upper(doc-label))
          v(0.6em)
          block(text(size: big, weight: "bold", fill: fg, font: theme.fonts.heading, tracking: -0.025em, hyphenate: false, eng.title))
          if eng.at("subtitle", default: none) != none { v(0.3em); text(size: 13pt, fill: dim, eng.subtitle) }
          v(0.5em)
          text(size: 17pt, weight: "semibold", fill: fg, eng.client.name)
          v(1.2em)
          line(length: 100%, stroke: 0.6pt + white.transparentize(60%))
          v(0.9em)
          let rows = (
            (t.core.client, eng.client.name),
            (tb.executed_by, theme.provider.name),
            (t.core.reference, [#text(font: theme.fonts.mono, size: 9.5pt)[#eng.reference #h(0.4em) · #h(0.4em) v#eng.version]]),
            (t.core.date, ctx.fmt.date),
          )
          if eng.at("classification", default: none) != none { rows.push((t.core.classification, rf.pill(theme, eng.classification, color: white, size: 7pt))) }
          grid(
            columns: (34mm, 1fr), row-gutter: 8pt, column-gutter: 6mm, align: (left + horizon, left + horizon),
            ..rows.map(r => (text(size: 9.5pt, fill: dim, r.at(0)), text(size: 10pt, fill: fg, r.at(1)))).flatten(),
          )
        }))
      } else if style == "split" {
        let fg = white
        let dim = white.transparentize(35%)
        place(top + left, rect(width: 72mm, height: 100%, fill: c.primary))
        place(top + left, dx: 72mm, rect(width: 2.5pt, height: 100%, fill: c.accent))
        place(top + left, dx: 14mm, dy: 20mm, if logo != none { box(fill: white, radius: 3pt, inset: (x: 8pt, y: 6pt), image(logo, height: 11mm)) } else { text(fill: fg, size: 14pt, weight: "bold", theme.provider.name) })
        place(bottom + left, dx: 14mm, dy: -20mm, block(width: 46mm, {
          set text(fill: fg, size: 9pt)
          set par(justify: false)
          for p in meta { text(size: 7pt, fill: dim, tracking: 0.08em, upper(p.at(0))); linebreak(); text(size: 9.5pt, p.at(1)); v(0.5em) }
          v(1em)
          text(size: 8pt, fill: dim)[#theme.provider.name #linebreak() #theme.provider.at("website", default: "")]
        }))
        place(top + left, dx: 86mm, dy: 96mm, block(width: 108mm, {
          set par(justify: false)
          text(size: 9.5pt, weight: "semibold", tracking: 0.14em, fill: c.accent)[#upper(doc-label)]
          v(1.2em)
          block(text(size: 30pt, weight: "bold", fill: c.headingColor, font: theme.fonts.heading, hyphenate: false, eng.title))
          if eng.at("subtitle", default: none) != none { v(0.5em); text(size: 13pt, fill: c.muted, eng.subtitle) }
          v(1.6em)
          line(length: 24mm, stroke: 1.5pt + c.accent)
          v(1em)
          text(size: 13pt)[#tb.for #h(0.3em) #text(weight: "semibold", eng.client.name)]
        }))
      } else if style == "geometric" {
        place(top + right, dx: 30mm, dy: -40mm, circle(radius: 75mm, fill: c.primary))
        place(top + right, dx: -10mm, dy: 60mm, circle(radius: 30mm, fill: c.accent.transparentize(15%)))
        place(top + right, dx: 48mm, dy: 95mm, circle(radius: 38mm, fill: c.primaryLight))
        place(top + left, dx: 20mm, dy: 20mm, if logo != none { image(logo, height: 12mm) } else { text(size: 16pt, weight: "bold", fill: c.primary, theme.provider.name) })
        place(bottom + left, dx: 20mm, dy: -70mm, block(width: 120mm, title-block(c.headingColor, size: 30pt)))
        place(bottom + left, dx: 20mm, dy: -26mm, block(width: 170mm, meta-table(meta)))
      } else if style == "band" {
        // Colour band across the upper two thirds
        place(top + left, rect(width: 100%, height: 62%, fill: c.primary))
        place(top + left, dx: 0pt, dy: 62% - 3pt, rect(width: 100%, height: 3pt, fill: c.accent))
        place(top + left, dx: 20mm, dy: 18mm, if logo != none {
          box(fill: white, radius: 3pt, inset: (x: 8pt, y: 6pt), image(logo, height: 12mm))
        } else { text(fill: white, size: 16pt, weight: "bold", theme.provider.name) })
        place(top + left, dx: 20mm, dy: 70mm, block(width: 170mm, title-block(white)))
        place(top + left, dx: 20mm, dy: 62% + 16mm, block(width: 170mm, meta-table(meta)))
      } else if has-image {
        place(top + left, box(width: 100%, height: 48%, clip: true, image(theme.assets.cover_image, width: 100%, height: 100%, fit: "cover")))
        place(top + left, dy: 48% - 4pt, rect(width: 100%, height: 4pt, fill: c.accent))
        place(top + left, dx: 20mm, dy: 16mm, if logo != none { box(fill: white, radius: 3pt, inset: (x: 8pt, y: 6pt), image(logo, height: 12mm)) })
        place(top + left, dx: 20mm, dy: 48% + 14mm, block(width: 170mm, title-block(c.headingColor, size: 28pt)))
        place(top + left, dx: 20mm, dy: 48% + 80mm, block(width: 170mm, meta-table(meta)))
      } else {
        place(top + left, dx: 20mm, dy: 20mm, if logo != none { image(logo, height: 12mm) } else { text(size: 16pt, weight: "bold", fill: c.primary, theme.provider.name) })
        place(top + left, dx: 20mm, dy: 78mm, line(length: 28mm, stroke: 2pt + c.accent))
        place(top + left, dx: 20mm, dy: 86mm, block(width: 170mm, title-block(c.headingColor)))
        place(top + left, dx: 20mm, dy: 170mm, block(width: 170mm, meta-table(meta)))
      }
      if opts.at("gallery_label", default: none) != none {
        place(top + right, dx: -8mm, dy: 8mm, box(fill: white, stroke: 0.5pt + c.rule, radius: 3pt, inset: (x: 7pt, y: 4pt), opts.gallery_label))
      }
      // Provider footer, identical for all light styles
      if style not in ("dark", "split") { place(bottom + left, dx: 20mm, dy: -16mm, block(width: 170mm, {
        line(length: 100%, stroke: 0.5pt + c.rule)
        v(6pt)
        set text(size: 8pt, fill: c.muted)
        grid(
          columns: (1fr, auto),
          [#text(weight: "semibold", fill: c.ink, theme.provider.name) #h(0.5em) #theme.provider.at("address", default: ()).join(" · ")],
          [#theme.provider.at("website", default: "") #h(0.8em) #theme.provider.at("email", default: "")],
        )
      })) }
    },
  )
}
