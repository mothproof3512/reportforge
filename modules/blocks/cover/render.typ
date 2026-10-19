#import "/modules/lib/rf.typ"

// Cover page. Three styles, chosen by theme.page.cover:
//   band    — full-width colour band with the title, white space below
//   image   — the theme's cover image bleeds across the top half
//   minimal — typographic cover on white
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
      if style == "band" {
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
      // Provider footer, identical for all styles
      place(bottom + left, dx: 20mm, dy: -16mm, block(width: 170mm, {
        line(length: 100%, stroke: 0.5pt + c.rule)
        v(6pt)
        set text(size: 8pt, fill: c.muted)
        grid(
          columns: (1fr, auto),
          [#text(weight: "semibold", fill: c.ink, theme.provider.name) #h(0.5em) #theme.provider.at("address", default: ()).join(" · ")],
          [#theme.provider.at("website", default: "") #h(0.8em) #theme.provider.at("email", default: "")],
        )
      }))
    },
  )
}
