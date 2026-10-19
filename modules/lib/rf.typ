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
#let badge(theme, sev, label, size: 7.5pt) = box(
  fill: sev-color(theme, sev),
  radius: 2pt,
  inset: (x: 5pt, y: 2.6pt),
  baseline: 25%,
  text(fill: sev-text-color(theme, sev), size: size, weight: "bold", tracking: 0.04em, upper(label)),
)

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

#let callout(theme, body, title: none, color: none) = {
  let c = if color == none { theme.colors.primary } else { color }
  block(
    width: 100%,
    fill: theme.colors.surface,
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
#let chapter(body) = {
  pagebreak(weak: true)
  heading(level: 1, body)
}

// ---------------------------------------------------------------- page setup
#let setup(theme, ctx, t, doc) = {
  let c = theme.colors
  let eng = ctx.engagement
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
      grid(
        columns: (1fr, auto),
        align: (left + horizon, right + horizon),
        [#eng.title #h(0.6em) #text(fill: c.rule)[|] #h(0.6em) #eng.client.name],
        if theme.assets.at("logo_mono", default: none) != none {
          image(theme.assets.logo_mono, height: 5.5mm)
        } else if theme.assets.at("logo", default: none) != none {
          image(theme.assets.logo, height: 5.5mm)
        } else { text(weight: "semibold", theme.provider.name) },
      )
      v(-0.4em)
      line(length: 100%, stroke: 0.4pt + c.rule)
    },
    footer: context {
      if counter(page).get().first() <= 1 { return }
      set text(size: 7.5pt, fill: c.muted)
      line(length: 100%, stroke: 0.4pt + c.rule)
      v(-0.3em)
      grid(
        columns: (1fr, auto, 1fr),
        align: (left, center, right),
        [#eng.at("classification", default: "") #h(0.6em) #text(fill: c.rule)[|] #h(0.6em) #eng.reference #h(0.6em) #text(fill: c.rule)[|] #h(0.6em) v#eng.version],
        [],
        [#counter(page).display("1") / #context counter(page).final().first()],
      )
    },
  )
  set heading(numbering: "1.1")
  show heading: set text(font: theme.fonts.heading, fill: c.headingColor)
  show heading.where(level: 1): it => {
    set text(size: 18pt, weight: "bold")
    block(above: 0pt, below: 1.1em, breakable: false, [
      #if it.numbering != none { text(fill: c.accent, size: 11pt, weight: "semibold", tracking: 0.08em)[#counter(heading).display(it.numbering)]; v(0.2em) }
      #it.body
      #v(0.35em)
      #line(length: 28mm, stroke: 1.6pt + c.accent)
    ])
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
