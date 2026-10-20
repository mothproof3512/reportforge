#import "/modules/lib/rf.typ"

// Phase timeline: dots on a line with phase name and date range below.
#let timeline(ctx, theme, t, phases) = {
  let c = theme.colors
  let n = phases.len()
  block(breakable: false, above: 0.8em, below: 1.2em, {
    grid(columns: (1fr,) * n, column-gutter: 3pt, align: left + top,
      ..phases.enumerate().map(p => {
        let i = p.at(0); let ph = p.at(1)
        let last = i == n - 1
        stack(dir: ttb, spacing: 5pt,
          box(width: 100%, height: 4mm, {
            place(left + horizon, dx: 2mm, line(length: 100% - 2mm, stroke: 0.8pt + c.rule))
            place(left + horizon, circle(radius: 2mm, fill: if last { c.accent } else { white }, stroke: 1pt + if last { c.accent } else { c.rule }))
          }),
          text(size: 8pt, weight: "semibold", hyphenate: false, ph.phase),
          {
            let a = ph.at("start_short", default: "")
            let b = ph.at("end_short", default: "")
            let range-txt = if a == "" { "" } else if b != "" and b != a { "[" + a + " – " + b + "]" } else { "[" + a + "]" }
            text(size: 7.5pt, fill: c.muted, font: theme.fonts.mono, range-txt)
          },
        )
      }),
    )
  })
}

#let extended(ctx, theme, t, opts) = {
  let eng = ctx.engagement
  let tb = t.blocks.methodology
  let c = theme.colors
  rf.chapter(tb.title)
  let tp = eng.at("testplan", default: (:))
  if tp == none { tp = (:) }
  if eng.at("test_approach", default: none) != none { eng.test_approach } else if tp.at("approach", default: none) != none { tp.approach } else { tb.intro }
  let phases = ctx.fmt.at("planning", default: ())
  if phases.len() > 0 {
    heading(level: 2, numbering: none, outlined: false, tb.course)
    timeline(ctx, theme, t, phases)
  }
  grid(columns: (1fr, 1fr), column-gutter: 10mm,
    {
      heading(level: 2, numbering: none, outlined: false, tb.framework)
      set text(size: 9.5pt)
      list(spacing: 0.5em, ..ctx.standards.map(s => [#s.name#if s.at("version", default: none) != none [ #text(fill: c.muted)[(#s.version)]]]) + ([#t.core.risk_model.at(eng.risk_model) #tb.for_scoring],))
    },
    if eng.at("tools", default: none) != none and eng.tools.len() > 0 {
      heading(level: 2, numbering: none, outlined: false, t.core.tools)
      block(above: 0.8em, { set par(justify: false, leading: 1.1em); eng.tools.map(x => box(stroke: (left: 1.5pt + c.accent), fill: c.surface, inset: (x: 5pt, y: 3pt), baseline: 25%, text(font: theme.fonts.mono, size: 8pt, x.name))).join(h(5pt, weak: true)) })
    },
  )
  heading(level: 2, numbering: none, outlined: false, tb.limitations)
  if eng.at("limitations", default: none) != none { eng.limitations } else { tb.limitations_text }
}

#let render(ctx, theme, t, opts) = {
  if opts.at("layout", default: "classic") == "extended" { return extended(ctx, theme, t, opts) }
  let eng = ctx.engagement
  let tb = t.blocks.methodology
  rf.chapter(tb.title)
  if eng.at("test_approach", default: none) != none { eng.test_approach } else { tb.intro }
  if ctx.standards.len() > 0 {
    heading(level: 2, tb.standards_title)
    for s in ctx.standards {
      block(above: 0.9em, below: 0.6em, breakable: false, [
        #text(weight: "semibold", s.name)
        #if s.at("version", default: none) != none [ #text(fill: theme.colors.muted, size: 9pt)[(#s.version)]]
        #if s.at("url", default: none) != none [ #h(0.4em) #link(s.url)[#text(size: 8pt)[↗]]]
        #linebreak()
        #s.at("description", default: (:)).at(ctx.lang, default: "")
      ])
    }
  }
  heading(level: 2, tb.risk_title)
  if eng.risk_model == "matrix" { tb.risk_matrix } else { tb.risk_cvss.replace("{model}", t.core.risk_model.at(eng.risk_model)) }
  if eng.at("tools", default: none) != none and eng.tools.len() > 0 { [ ]; tb.tools_ref }
}
