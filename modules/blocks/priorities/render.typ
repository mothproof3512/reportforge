#import "/modules/lib/rf.typ"

#let card(theme, t, tb, n, f) = {
  let c = theme.colors
  block(width: 100%, stroke: 0.5pt + c.rule, radius: 3pt, inset: (x: 10pt, y: 9pt), breakable: false, {
    grid(columns: (auto, 1fr), column-gutter: 8pt, align: (left + top, left + top),
      text(size: 26pt, weight: "bold", fill: c.accent, font: theme.fonts.heading, str(n)),
      {
        v(2pt)
        text(font: theme.fonts.mono, size: 9pt, fill: c.ink, f.id)
        h(0.6em)
        rf.badge(theme, f.severity, t.severity.at(f.severity), size: 7pt)
        v(0.5em)
        set par(justify: false, leading: 0.55em)
        set text(size: 8.5pt)
        if f.at("brief", default: none) != none {
          [#text(weight: "bold", tb.what) · #f.brief.what]
          v(0.5em)
          [#text(weight: "bold", tb.todo) · #f.brief.action]
        }
      },
    )
  })
}

// 5×5 likelihood (x) × impact (y) matrix with the finding ids in the cells.
#let matrix(ctx, theme, t, tb) = {
  let c = theme.colors
  let n = 5
  let placed = ctx.findings.filter(f => f.risk.details.at("impact", default: none) != none and f.risk.details.at("likelihood", default: none) != none)
  let cell(i, l) = {
    let ids = placed.filter(f => f.risk.details.impact == i and f.risk.details.likelihood == l).map(f => f.id)
    let p = i * l
    let sev = if p >= 20 { "critical" } else if p >= 12 { "high" } else if p >= 6 { "medium" } else if p >= 2 { "low" } else { "info" }
    box(width: 100%, height: 10.5mm, fill: rf.sev-color(theme, sev), inset: 2pt,
      align(center + horizon, text(size: 6.8pt, weight: "semibold", font: theme.fonts.mono, fill: rf.sev-text-color(theme, sev), ids.join(linebreak()))))
  }
  let rows = range(n, 0, step: -1).map(i => ((text(size: 8pt, fill: c.muted, str(i)),) + range(1, n + 1).map(l => cell(i, l)))).flatten()
  block(breakable: false, {
    grid(
      columns: (6mm,) + (1fr,) * n, column-gutter: 2pt, row-gutter: 2pt, align: center + horizon,
      ..rows,
      [], ..range(1, n + 1).map(l => text(size: 8pt, fill: c.muted, str(l))),
    )
    v(4pt)
    grid(columns: (6mm, 1fr), [], align(center, text(size: 8pt, fill: c.muted)[#tb.impact ↑ #h(0.5em) · #h(0.5em) #tb.likelihood →]))
  })
}

#let render(ctx, theme, t, opts) = {
  let c = theme.colors
  let tb = t.blocks.priorities
  pagebreak(weak: true)
  heading(level: 1, numbering: none, outlined: false, tb.title)
  if ctx.findings.len() == 0 { tb.none; return }
  let n = calc.min(opts.at("top_n", default: 3), ctx.findings.len())
  let top = ctx.findings.slice(0, n)
  heading(level: 2, numbering: none, outlined: false, tb.top.replace("{n}", str(n)))
  grid(columns: (1fr,) * n, column-gutter: 5mm, ..top.enumerate().map(p => card(theme, t, tb, p.at(0) + 1, p.at(1))))
  if opts.at("matrix", default: true) {
    v(1.2em)
    heading(level: 2, numbering: none, outlined: false, tb.matrix_title)
    grid(columns: (78mm, 1fr), column-gutter: 9mm,
      matrix(ctx, theme, t, tb),
      {
        set text(size: 9pt)
        tb.matrix_intro
        v(0.7em)
        for s in ctx.severities { rf.badge(theme, s.id, s.label, size: 7pt); h(0.4em) }
        v(0.4em)
        rf.callout(theme, color: c.accent, text(size: 8.5pt, tb.matrix_note))
        text(size: 8pt, fill: c.muted, tb.deviation_note)
        if ctx.findings.any(f => f.risk.details.at("derived", default: false)) { v(0.3em); text(size: 7.5pt, fill: c.muted, tb.derived_note) }
      },
    )
  }
}
