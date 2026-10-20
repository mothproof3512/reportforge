// Reportforge Typst library: page setup, typography and the building blocks
// every block renderer uses. Blocks never pick colours or fonts themselves;
// they read them from `theme`, which is generated from theme.yaml.

// ---------------------------------------------------------------- helpers
#let sev-color(theme, sev) = theme.colors.severity.at(sev, default: theme.colors.muted)
#let sev-text-color(theme, sev) = theme.colors.severityText.at(sev, default: white)

#let mm-of(len) = {
  // theme.page.text_width is a number in mm (computed in TS)
  len
}

// Available text width in mm (page width minus margins), computed in TS.
#let text-width(theme) = theme.page.text_width_mm * 1mm

// ---------------------------------------------------------------- style options
// Every visual primitive reads its variant from theme.options.<x>_style, so a
// theme chooses a look without touching the blocks. Six variants each.
#let opt(theme, key, default) = theme.at("options", default: (:)).at(key, default: default)
#let badge-style(theme) = {
  let s = opt(theme, "badge_style", none)
  if s != none { s } else if opt(theme, "severity_shapes", false) { "shapes" } else { "solid" }
}

// ---------------------------------------------------------------- severity badge
// Small shape per severity (diamond, triangle, square, circle, dash) so the
// class stays recognisable in greyscale print and for colour-blind readers.
#let sev-shape(sev, fill, size: 5pt) = box(baseline: 10%, width: size, height: size, align(center + horizon, {
  if sev == "critical" { polygon(fill: fill, (size / 2, 0pt), (size, size / 2), (size / 2, size), (0pt, size / 2)) }
  else if sev == "high" { polygon(fill: fill, (size / 2, 0pt), (size, size), (0pt, size)) }
  else if sev == "medium" { rect(fill: fill, width: size * 0.85, height: size * 0.85) }
  else if sev == "low" { circle(fill: fill, radius: size / 2) }
  else { rect(fill: fill, width: size, height: size * 0.3) }
}))

// Badge variants: solid | shapes | outline | pill | dot | tag
#let badge(theme, sev, label, size: 7.5pt, style: none) = {
  let st = if style == none { badge-style(theme) } else { style }
  let col = sev-color(theme, sev)
  let fg = sev-text-color(theme, sev)
  if st == "shapes" {
    box(fill: col, radius: 3pt, inset: (x: 5pt, y: 2.6pt), baseline: 25%, [#sev-shape(sev, fg, size: size * 0.7)#h(0.45em)#text(fill: fg, size: size, weight: "bold", label)])
  } else if st == "outline" {
    box(stroke: 0.8pt + col, radius: 2pt, inset: (x: 5pt, y: 2.4pt), baseline: 25%, text(fill: col, size: size, weight: "bold", tracking: 0.04em, upper(label)))
  } else if st == "pill" {
    box(fill: col, radius: 20pt, inset: (x: 7pt, y: 2.6pt), baseline: 25%, text(fill: fg, size: size, weight: "semibold", label))
  } else if st == "dot" {
    box(baseline: 25%, [#box(baseline: 15%, circle(radius: size * 0.42, fill: col))#h(0.4em)#text(fill: theme.colors.ink, size: size, weight: "semibold", label)])
  } else if st == "tag" {
    box(fill: theme.colors.surface, radius: 2pt, clip: true, baseline: 25%, stack(dir: ltr, box(fill: col, width: 4pt, height: size * 1.9), box(inset: (x: 5pt, y: 2.6pt), text(fill: theme.colors.ink, size: size, weight: "bold", tracking: 0.03em, upper(label)))))
  } else {
    box(fill: col, radius: 2pt, inset: (x: 5pt, y: 2.6pt), baseline: 25%, text(fill: fg, size: size, weight: "bold", tracking: 0.04em, upper(label)))
  }
}

// Outlined status pill (Open / Opgelost / …)
#let pill(theme, label, color: none, size: 7.5pt, filled: false) = {
  let col = if color == none { theme.colors.muted } else { color }
  box(
    stroke: 0.7pt + col,
    fill: if filled { col } else { none },
    radius: 10pt,
    inset: (x: 6pt, y: 2.4pt),
    baseline: 25%,
    text(fill: if filled { white } else { col }, size: size, weight: "semibold", label),
  )
}

// Retest/remediation status → (label, colour)
#let status-pill(theme, t, f, size: 7.5pt) = {
  let c = theme.colors
  let st = if f.at("retest", default: none) != none { f.retest.status } else { "open" }
  let col = if st == "resolved" { c.severity.low } else if st == "partially-resolved" { c.severity.medium } else if st == "risk-accepted" { c.muted } else { c.severity.high }
  let label = if st == "resolved" { t.core.resolved } else if st == "partially-resolved" { t.core.partially_resolved } else if st == "risk-accepted" { t.core.retest_status.at("risk-accepted") } else { t.core.open }
  pill(theme, label, color: col, size: size)
}

#let chip(theme, body, fill: none, stroke: none, size: 8pt) = box(
  fill: if fill == none { theme.colors.surface } else { fill },
  stroke: stroke,
  radius: 2pt,
  inset: (x: 5pt, y: 2.6pt),
  baseline: 25%,
  text(size: size, fill: theme.colors.ink, body),
)

// ---------------------------------------------------------------- images
// Scales an image to the text width, capped at `max-h` so a tall screenshot
// never runs off the page. w/h are intrinsic pixel sizes (0 if unknown).
#let img(theme, path, w: 0, h: 0, alt: none, max-h: 165mm, caption: none) = {
  let avail = text-width(theme)
  let width = avail
  if w > 0 and h > 0 {
    let ratio = h / w
    let natural = avail * ratio
    if natural > max-h { width = max-h / ratio }
    // Small images (narrow screenshots) are shown at a sensible size, not blown up
    let px-width = w * 0.2646mm  // 96 dpi → mm
    if px-width < avail * 0.6 and px-width > 30mm { width = calc.min(width, px-width * 1.25) }
  }
  block(
    breakable: false,
    width: 100%,
    above: 0.9em,
    below: 1.1em,
    align(center)[
      #box(
        stroke: 0.4pt + theme.colors.rule,
        inset: 0pt,
        clip: true,
        radius: 2pt,
        image(path, width: width, alt: alt),
      )
      #if caption != none {
        v(0.35em)
        text(size: 8pt, fill: theme.colors.muted, caption)
      }
    ],
  )
}

#let missing-image(theme, url) = block(
  width: 100%,
  inset: 10pt,
  stroke: (dash: "dashed", paint: theme.colors.severity.high, thickness: 0.6pt),
  radius: 2pt,
  text(size: 8.5pt, fill: theme.colors.severity.high)[Afbeelding ontbreekt / missing image: #raw(url)],
)

// ---------------------------------------------------------------- code
// Inserts break opportunities into very long unbroken tokens so no line can
// ever run past the margin, whatever a tool printed.
#let code(theme, source, lang: none) = {
  block(
    width: 100%,
    fill: theme.colors.codeBg,
    stroke: (left: 2pt + theme.colors.primary),
    inset: (x: 9pt, y: 8pt),
    radius: 2pt,
    breakable: true,
    above: 0.9em,
    below: 1.0em,
    raw(source, block: true, lang: lang),
  )
}

#let subhead(theme, body, level: 4) = block(
  above: 1.1em,
  below: 0.5em,
  sticky: true,
  text(weight: "bold", size: if level <= 4 { 10pt } else { 9.5pt }, fill: theme.colors.headingColor, body),
)

#let rule(theme) = line(length: 100%, stroke: 0.5pt + theme.colors.rule)

// ---------------------------------------------------------------- tables
// Table variants: lines | zebra | minimal | boxed | header-dark | cards
#let table(theme, rows: (), align: (), header: true, widths: auto, size: 9pt, style: none) = {
  if rows.len() == 0 { return }
  let c = theme.colors
  let st = if style == none { opt(theme, "table_style", "lines") } else { style }
  let n = rows.at(0).len()
  let cols = if widths == auto { (1fr,) * n } else { widths }
  let al = if align.len() == n { align.map(a => if a == "right" { right } else if a == "center" { center } else { left }) } else { left }
  let body = rows.map(r => r.map(c => c))
  let head-fg = if st == "header-dark" { c.onPrimary } else { c.ink }
  let header-cells = body.at(0).map(cl => text(weight: "semibold", fill: head-fg, cl))
  let stroke = if st == "lines" { (x, y) => (bottom: if header and y == 0 { 0.8pt + c.primary } else { 0.4pt + c.rule }) }
    else if st == "zebra" { none }
    else if st == "minimal" { (x, y) => (bottom: if header and y == 0 { 0.6pt + c.ink } else if y == body.len() - 1 { 0.4pt + c.rule } else { none }) }
    else if st == "boxed" { 0.4pt + c.rule }
    else if st == "header-dark" { (x, y) => (bottom: 0.4pt + c.rule) }
    else { none }
  let fill = if st == "lines" { (x, y) => if header and y == 0 { c.surface } else { none } }
    else if st == "zebra" { (x, y) => if header and y == 0 { c.primaryLight } else if calc.odd(y) { c.surface } else { none } }
    else if st == "boxed" { (x, y) => if header and y == 0 { c.surface } else { none } }
    else if st == "header-dark" { (x, y) => if header and y == 0 { c.primary } else { none } }
    else if st == "cards" { (x, y) => if header and y == 0 { none } else { c.surface } }
    else { none }
  set text(size: size)
  block(
    width: 100%,
    above: 0.8em,
    below: 1.0em,
    std.table(
      columns: cols,
      align: al,
      inset: (x: 6pt, y: if st == "cards" { 6pt } else { 5pt }),
      stroke: stroke,
      fill: fill,
      row-gutter: if st == "cards" { 3pt } else { 0pt },
      ..if header {
        (std.table.header(..header-cells),) + body.slice(1).flatten()
      } else {
        body.flatten()
      },
    ),
  )
}

// Key/value grid used in metadata blocks
#let kv(theme, pairs, key-width: 38mm) = {
  grid(
    columns: (key-width, 1fr),
    row-gutter: 5pt,
    column-gutter: 8pt,
    ..pairs.map(p => (text(size: 9pt, fill: theme.colors.muted, p.at(0)), text(size: 9.5pt, p.at(1)))).flatten(),
  )
}

#let eyebrow(theme, body, size: 7.5pt) = text(size: size, weight: "bold", fill: theme.colors.accent, tracking: 0.02em, body)

// Callout variants: bar | outline | fill | ribbon | quote | card
#let callout(theme, body, title: none, color: none, fill: none, style: none) = {
  let c = if color == none { theme.colors.primary } else { color }
  let st = if style == none { opt(theme, "callout_style", "bar") } else { style }
  let bg = if fill == none { theme.colors.at("calloutBg", default: theme.colors.surface) } else { fill }
  let title-run(size: 9.5pt, fill: c) = if title != none { text(weight: "bold", fill: fill, size: size, title); v(0.4em) }
  if st == "ribbon" {
    block(width: 100%, above: 1em, below: 1em, breakable: true, {
      if title != none { box(fill: c, radius: (top: 3pt), inset: (x: 9pt, y: 4pt), text(fill: white, weight: "bold", size: 8.5pt, title)) }
      block(width: 100%, fill: bg, radius: (bottom: 3pt, top-right: 3pt), inset: (x: 11pt, y: 9pt), breakable: true, body)
    })
  } else if st == "outline" {
    block(width: 100%, stroke: 0.8pt + c, radius: 3pt, inset: (x: 11pt, y: 9pt), above: 1em, below: 1em, breakable: true, [#title-run()#body])
  } else if st == "fill" {
    block(width: 100%, fill: c.lighten(88%), radius: 3pt, inset: (x: 11pt, y: 9pt), above: 1em, below: 1em, breakable: true, [#title-run(fill: c.darken(10%))#body])
  } else if st == "quote" {
    block(width: 100%, stroke: (left: 1pt + c), inset: (left: 11pt, y: 3pt), above: 1em, below: 1em, breakable: true, [#if title != none { text(weight: "semibold", fill: c, size: 9pt, style: "italic", title); v(0.3em) }#body])
  } else if st == "card" {
    block(width: 100%, fill: white, stroke: 0.5pt + theme.colors.rule, radius: 4pt, inset: (x: 12pt, y: 10pt), above: 1em, below: 1em, breakable: true, {
      if title != none { grid(columns: (auto, 1fr), column-gutter: 6pt, align: horizon, box(width: 6pt, height: 6pt, fill: c, radius: 1pt), text(weight: "bold", fill: theme.colors.ink, size: 9.5pt, title)); v(0.5em) }
      body
    })
  } else {
    block(width: 100%, fill: bg, stroke: (left: 2.5pt + c), inset: (x: 11pt, y: 9pt), radius: 2pt, above: 1em, below: 1em, breakable: true, [#title-run()#body])
  }
}

#let chapter-subtitle(body) = block(above: -0.2em, below: 1.4em, text(size: 11.5pt, fill: rgb("#5B6B7C"), body))
#let chapter(body, subtitle: none, numbering: "1.1", outlined: true) = {
  pagebreak(weak: true)
  heading(level: 1, numbering: numbering, outlined: outlined, body)
  if subtitle != none { chapter-subtitle(subtitle) }
}

// Big number + caption, as in dashboards ("7  bevindingen bij oplevering")
#let stat(theme, value, caption, color: none, size: 26pt) = block(width: 100%, breakable: false, {
  line(length: 100%, stroke: 1.2pt + if color == none { theme.colors.primary } else { color })
  v(5pt)
  text(size: size, weight: "bold", fill: theme.colors.headingColor, font: theme.fonts.heading, value)
  v(-0.1em)
  text(size: 8.5pt, fill: theme.colors.muted, caption)
})

// Chapter (level-1) title variants: rule | eyebrow | big-number | bar | sidebar | underline
#let chapter-title(theme, number, body, style: "rule") = {
  let c = theme.colors
  if style == "eyebrow" {
    set text(size: 24pt, weight: "bold")
    block(above: 1.6em, below: 1.0em, breakable: false, [
      #text(size: 7.5pt, weight: "bold", fill: c.accent, tracking: 0.02em)[#if number != none [#number · ]#body]
      #v(0.1em)
      #body
    ])
  } else if style == "big-number" {
    block(above: 1.8em, below: 1.2em, breakable: false, grid(columns: (auto, 1fr), column-gutter: 14pt, align: (left + top, left + bottom),
      if number != none { text(size: 40pt, weight: "bold", fill: c.accent.lighten(55%), font: theme.fonts.heading, number) } else { none },
      text(size: 20pt, weight: "bold", body)))
  } else if style == "bar" {
    block(above: 1.4em, below: 1.2em, breakable: false, width: 100%, fill: c.primary, inset: (x: 12pt, y: 10pt), radius: 3pt,
      [#if number != none { text(size: 10pt, fill: c.onPrimary.transparentize(30%), weight: "semibold", number); h(0.8em) }#text(size: 18pt, weight: "bold", fill: c.onPrimary, body)])
  } else if style == "sidebar" {
    block(above: 1.8em, below: 1.2em, breakable: false, stroke: (left: 4pt + c.accent), inset: (left: 12pt, y: 2pt),
      [#if number != none { text(size: 9.5pt, fill: c.muted, weight: "semibold", tracking: 0.1em, upper(number)); linebreak() }#text(size: 20pt, weight: "bold", body)])
  } else if style == "underline" {
    block(above: 1.8em, below: 1.2em, breakable: false, width: 100%, [
      #grid(columns: (auto, 1fr), column-gutter: 10pt, align: horizon,
        if number != none { box(fill: c.accent, radius: 2pt, inset: (x: 6pt, y: 3pt), text(size: 11pt, weight: "bold", fill: white, number)) } else { none },
        text(size: 19pt, weight: "bold", body))
      #v(0.4em)
      #line(length: 100%, stroke: 2pt + c.accent)
    ])
  } else {
    set text(size: 18pt, weight: "bold")
    block(above: 2.4em, below: 1.1em, breakable: false, [
      #if number != none { text(fill: c.accent, size: 11pt, weight: "semibold", tracking: 0.08em, number); v(0.2em) }
      #body
      #v(0.35em)
      #line(length: 28mm, stroke: 1.6pt + c.accent)
    ])
  }
}

// Severity distribution chart variants: bars | columns | donut | tiles | dots | stacked
// `sevs` = ctx.severities (id, label, count, open).
#let severity-chart(theme, sevs, style: none, total-label: none) = {
  let c = theme.colors
  let st = if style == none { opt(theme, "chart_style", "bars") } else { style }
  let total = sevs.map(s => s.count).sum()
  let mx = calc.max(1, ..sevs.map(s => s.count))
  if st == "columns" {
    let h = 26mm
    block(width: 100%, breakable: false, grid(columns: (1fr,) * sevs.len(), column-gutter: 6pt, align: center + bottom,
      ..sevs.map(s => stack(dir: ttb, spacing: 3pt,
        text(size: 9pt, weight: "bold", str(s.count)),
        box(width: 9mm, height: calc.max(1mm, h * s.count / mx), fill: if s.count > 0 { sev-color(theme, s.id) } else { c.surface }, radius: (top: 2pt)),
        text(size: 7.5pt, fill: c.muted, s.label)))))
  } else if st == "donut" {
    let r = 15mm
    block(width: 100%, breakable: false, grid(columns: (36mm, 1fr), column-gutter: 8mm, align: horizon,
      box(width: 2 * r + 4mm, height: 2 * r + 4mm, {
        place(center + horizon, circle(radius: r, stroke: 5mm + c.surface))
        let acc = 0
        if total > 0 {
          for s in sevs {
            if s.count == 0 { continue }
            let a0 = -90deg + 360deg * acc / total
            let a1 = -90deg + 360deg * (acc + s.count) / total
            let steps = calc.max(2, calc.ceil((a1 - a0) / 4deg))
            let pts = range(0, steps + 1).map(i => { let a = a0 + (a1 - a0) * i / steps; (r + 2mm + r * calc.cos(a), r + 2mm + r * calc.sin(a)) })
            place(top + left, curve(stroke: (paint: sev-color(theme, s.id), thickness: 5mm, cap: "butt"), curve.move(pts.at(0)), ..pts.slice(1).map(p => curve.line(p))))
            acc += s.count
          }
        }
        place(center + horizon, stack(dir: ttb, spacing: 2pt, text(size: 18pt, weight: "bold", fill: c.headingColor, str(total)), if total-label != none { text(size: 6.5pt, fill: c.muted, total-label) }))
      }),
      stack(dir: ttb, spacing: 5pt, ..sevs.map(s => grid(columns: (8pt, 1fr, auto), column-gutter: 6pt, align: horizon, box(width: 8pt, height: 8pt, fill: sev-color(theme, s.id), radius: 2pt), text(size: 9pt, s.label), text(size: 9pt, weight: "semibold", str(s.count)))))))
  } else if st == "tiles" {
    grid(columns: (1fr,) * sevs.len(), column-gutter: 6pt,
      ..sevs.map(s => block(width: 100%, inset: (x: 8pt, y: 9pt), radius: 3pt, fill: if s.count > 0 { sev-color(theme, s.id) } else { c.surface }, {
        let fg = if s.count > 0 { sev-text-color(theme, s.id) } else { c.muted }
        text(size: 20pt, weight: "bold", fill: fg, str(s.count)); v(-0.25em)
        text(size: 7.5pt, weight: "semibold", tracking: 0.08em, fill: fg, upper(s.label)) })))
  } else if st == "dots" {
    block(width: 100%, breakable: false, grid(columns: (24mm, 1fr, 10mm), row-gutter: 6pt, column-gutter: 8pt, align: (left + horizon, left + horizon, right + horizon),
      ..sevs.map(s => (text(size: 9pt, s.label),
        { set par(leading: 0.4em); range(0, s.count).map(_ => box(width: 3.2mm, height: 3.2mm, fill: sev-color(theme, s.id), radius: 1.6mm, baseline: 20%)).join(h(1.6mm)) },
        text(size: 9pt, weight: "semibold", str(s.count)))).flatten()))
  } else if st == "stacked" {
    block(width: 100%, breakable: false, {
      box(width: 100%, height: 9mm, radius: 3pt, clip: true, stack(dir: ltr, ..sevs.filter(s => s.count > 0).map(s => box(width: 100% * s.count / calc.max(1, total), height: 9mm, fill: sev-color(theme, s.id), align(center + horizon, text(size: 8pt, weight: "bold", fill: sev-text-color(theme, s.id), str(s.count)))))))
      if total == 0 { box(width: 100%, height: 9mm, fill: c.surface, radius: 3pt) }
      v(5pt)
      sevs.map(s => [#box(width: 7pt, height: 7pt, fill: sev-color(theme, s.id), radius: 2pt, baseline: 10%) #text(size: 8pt, s.label)]).join(h(1.2em))
    })
  } else {
    grid(columns: (22mm, 1fr, 10mm), row-gutter: 6pt, column-gutter: 8pt, align: (left + horizon, left + horizon, right + horizon),
      ..sevs.map(s => (text(size: 9pt, s.label),
        block(width: 100%, height: 9pt, fill: c.surface, radius: 2pt, align(left, box(width: calc.max(0.5%, 100% * s.count / mx), height: 9pt, fill: sev-color(theme, s.id), radius: 2pt))),
        text(size: 9pt, weight: "semibold", str(s.count)))).flatten())
  }
}

// ---------------------------------------------------------------- page setup
#let setup(theme, ctx, t, doc) = {
  let c = theme.colors
  let eng = ctx.engagement
  set document(title: eng.title + " — " + eng.reference + " v" + eng.version, author: theme.provider.name, keywords: (ctx.generated.tool,))
  set text(
    font: theme.fonts.body,
    size: eval(theme.fonts.base_size),
    fill: c.ink,
    lang: ctx.lang,
    region: if ctx.lang == "nl" { "NL" } else { "GB" },
    hyphenate: true,
  )
  set par(justify: true, leading: 0.62em, spacing: 0.95em, first-line-indent: 0pt)
  set page(
    paper: theme.page.size,
    margin: (
      top: eval(theme.page.margin.top),
      bottom: eval(theme.page.margin.bottom),
      left: eval(theme.page.margin.left),
      right: eval(theme.page.margin.right),
    ),
    header-ascent: 35%,
    footer-descent: 35%,
    header: context {
      if counter(page).get().first() <= 1 { return }
      set text(size: 7.5pt, fill: c.muted)
      let hc = theme.page.at("header", default: (:))
      let pos = hc.at("logo", default: "right")
      let lh = eval(str(hc.at("logo_height", default: "5.5mm")))
      let mode = hc.at("text", default: "both")
      let src = theme.assets.at("logo_header", default: theme.assets.at("logo_mono", default: theme.assets.at("logo", default: none)))
      let logo = if pos == "none" { none } else if src != none { image(src, height: lh) } else { text(weight: "semibold", theme.provider.name) }
      let cls = eng.at("classification", default: none)
      if hc.at("classification", default: "none") == "pill" and cls != none {
        let p = pill(theme, cls, color: c.primary, size: 7pt, filled: true)
        logo = if logo == none { p } else { [#logo #h(0.6em) #p] }
        if pos == "none" { pos = "right" }
      }
      let txt = if mode == "none" { [] } else if mode == "title" { [#ctx.fmt.header_title] } else if mode == "client" { [#ctx.fmt.header_client] } else { [#ctx.fmt.header_title #h(0.6em) #text(fill: c.rule)[|] #h(0.6em) #ctx.fmt.header_client] }
      let txtbox = box(height: 1.1em, clip: true, text(hyphenate: false, txt))
      if pos == "left" {
        grid(columns: (auto, 1fr), column-gutter: 3mm, align: (left + horizon, right + horizon), logo, txtbox)
      } else if pos == "none" {
        grid(columns: (1fr,), align: (left + horizon,), txtbox)
      } else {
        grid(columns: (1fr, auto), align: (left + horizon, right + horizon), txtbox, logo)
      }
      v(-0.4em)
      line(length: 100%, stroke: 0.4pt + c.rule)
    },
    footer: context {
      if counter(page).get().first() <= 1 { return }
      set text(size: 7.5pt, fill: c.muted)
      line(length: 100%, stroke: 0.4pt + c.rule)
      v(-0.3em)
      let fstyle = theme.page.at("footer", default: (:)).at("style", default: "default")
      if fstyle == "website" {
        grid(
          columns: (1fr, auto, 1fr),
          align: (left, center, right),
          [#theme.provider.at("website", default: theme.provider.name)],
          [#text(font: theme.fonts.mono, size: 7pt)[Ref. #eng.reference · v#eng.version]],
          [#t.core.page #counter(page).display("1") #t.core.of #context counter(page).final().first()],
        )
      } else {
        grid(
          columns: (1fr, auto, 1fr),
          align: (left, center, right),
          [#eng.at("classification", default: "") #h(0.6em) #text(fill: c.rule)[|] #h(0.6em) #eng.reference #h(0.6em) #text(fill: c.rule)[|] #h(0.6em) v#eng.version],
          [],
          [#counter(page).display("1") / #context counter(page).final().first()],
        )
      }
    },
    background: context {
      let deco = theme.page.at("decoration", default: "none")
      if deco == "arcs" and counter(page).get().first() > 1 {
        let tint = c.primary.lighten(90%)
        if calc.rem(counter(page).get().first(), 2) == 1 {
          place(bottom + right, dx: 40mm, dy: 40mm, circle(radius: 62mm, stroke: 24mm + tint))
        } else {
          place(bottom + left, dx: -58mm, dy: 20mm, circle(radius: 62mm, stroke: 22mm + tint))
        }
      }
    },
  )
  set heading(numbering: "1.1")
  let hstyle = opt(theme, "heading_style", "rule")
  let htrack = eval(str(opt(theme, "heading_tracking", "0em")))
  show heading: set text(font: theme.fonts.heading, fill: c.headingColor, tracking: htrack)
  show heading.where(level: 1): it => chapter-title(theme, if it.numbering != none { counter(heading).display(it.numbering) } else { none }, it.body, style: hstyle)
  show heading.where(level: 2): it => {
    set text(size: 12.5pt, weight: "bold")
    block(above: 1.6em, below: 0.7em, [
      #if it.numbering != none { text(fill: c.accent, size: 9.5pt, weight: "semibold")[#counter(heading).display(it.numbering)] ; h(0.6em) }
      #it.body
    ])
  }
  show heading.where(level: 3): it => {
    set text(size: 10.5pt, weight: "bold")
    block(above: 1.3em, below: 0.5em, it.body)
  }
  show raw: set text(font: theme.fonts.mono, size: 8.4pt)
  show raw.where(block: false): it => box(fill: c.codeBg, inset: (x: 2pt, y: 0pt), outset: (y: 2.5pt), radius: 2pt, it)
  show raw.where(block: true): set par(justify: false, leading: 0.55em)
  show raw.where(block: true): set text(size: 7.9pt)
  show link: set text(fill: c.primary)
  show link: underline.with(stroke: 0.4pt + c.rule, offset: 2pt)
  set list(indent: 0.6em, body-indent: 0.6em, marker: ([•], [–], [·]))
  set enum(indent: 0.6em, body-indent: 0.6em)
  show quote.where(block: true): it => block(inset: (left: 1em), stroke: (left: 1.5pt + c.rule), it.body)
  set std.table(inset: 5pt)
  set figure(gap: 0.6em)
  show figure.caption: set text(size: 8pt, fill: c.muted)
  doc
}
