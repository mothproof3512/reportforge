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

#let badge(theme, sev, label, size: 7.5pt) = {
  let shapes = theme.at("options", default: (:)).at("severity_shapes", default: false)
  let fg = sev-text-color(theme, sev)
  box(
    fill: sev-color(theme, sev),
    radius: if shapes { 3pt } else { 2pt },
    inset: (x: 5pt, y: 2.6pt),
    baseline: 25%,
    if shapes [#sev-shape(sev, fg, size: size * 0.7)#h(0.45em)#text(fill: fg, size: size, weight: "bold", label)]
    else { text(fill: fg, size: size, weight: "bold", tracking: 0.04em, upper(label)) },
  )
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
#let table(theme, rows: (), align: (), header: true, widths: auto, size: 9pt) = {
  if rows.len() == 0 { return }
  let n = rows.at(0).len()
  let cols = if widths == auto { (1fr,) * n } else { widths }
  let al = if align.len() == n { align.map(a => if a == "right" { right } else if a == "center" { center } else { left }) } else { left }
  let body = rows.map(r => r.map(c => c))
  set text(size: size)
  block(
    width: 100%,
    above: 0.8em,
    below: 1.0em,
    std.table(
      columns: cols,
      align: al,
      inset: (x: 6pt, y: 5pt),
      stroke: (x, y) => (
        bottom: if header and y == 0 { 0.8pt + theme.colors.primary } else { 0.4pt + theme.colors.rule },
      ),
      fill: (x, y) => if header and y == 0 { theme.colors.surface } else { none },
      ..if header {
        (std.table.header(..body.at(0).map(c => text(weight: "semibold", c))),) + body.slice(1).flatten()
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

#let callout(theme, body, title: none, color: none, fill: none) = {
  let c = if color == none { theme.colors.primary } else { color }
  block(
    width: 100%,
    fill: if fill == none { theme.colors.at("calloutBg", default: theme.colors.surface) } else { fill },
    stroke: (left: 2.5pt + c),
    inset: (x: 11pt, y: 9pt),
    radius: 2pt,
    above: 1em,
    below: 1em,
    breakable: true,
    [
      #if title != none { text(weight: "bold", fill: c, size: 9.5pt, title); v(0.4em) }
      #body
    ],
  )
}

// Numbered section heading (level 1) that always starts on a new page.
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
  let hstyle = theme.at("options", default: (:)).at("heading_style", default: "rule")
  let htrack = eval(str(theme.at("options", default: (:)).at("heading_tracking", default: "0em")))
  show heading: set text(font: theme.fonts.heading, fill: c.headingColor, tracking: htrack)
  show heading.where(level: 1): it => {
    if hstyle == "eyebrow" {
      // "1 · Title" small in accent, then the big title (as in the extended report template)
      set text(size: 24pt, weight: "bold")
      block(above: 1.6em, below: 1.0em, breakable: false, [
        #text(size: 7.5pt, weight: "bold", fill: c.accent, tracking: 0.02em)[#if it.numbering != none [#counter(heading).display(it.numbering) · ]#it.body]
        #v(0.1em)
        #it.body
      ])
    } else {
      set text(size: 18pt, weight: "bold")
      block(above: 2.4em, below: 1.1em, breakable: false, [
        #if it.numbering != none { text(fill: c.accent, size: 11pt, weight: "semibold", tracking: 0.08em)[#counter(heading).display(it.numbering)]; v(0.2em) }
        #it.body
        #v(0.35em)
        #line(length: 28mm, stroke: 1.6pt + c.accent)
      ])
    }
  }
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
