#import "/modules/lib/rf.typ"
#import "/modules/blocks/cover/render.typ" as cover
#import "/modules/blocks/finding/render.typ" as finding

#let COVERS = ("band", "image", "minimal", "dark", "split", "geometric")
#let HEADINGS = ("rule", "eyebrow", "big-number", "bar", "sidebar", "underline")
#let TABLES = ("lines", "zebra", "minimal", "boxed", "header-dark", "cards")
#let CHARTS = ("bars", "columns", "donut", "tiles", "dots", "stacked")
#let CALLOUTS = ("bar", "outline", "fill", "ribbon", "quote", "card")
#let BADGES = ("solid", "shapes", "outline", "pill", "dot", "tag")
#let FINDINGS = ("classic", "extended", "card", "sidebar", "compact", "table")

#let label-of(theme, tb, name, current) = block(above: 1.2em, below: 0.4em, [#text(font: theme.fonts.mono, size: 8.5pt, fill: theme.colors.ink, name)#if name == current { h(0.5em); rf.pill(theme, tb.current, color: theme.colors.accent, size: 6.5pt, filled: true) }])

#let render(ctx, theme, t, opts) = {
  let c = theme.colors
  let tb = t.blocks.style-gallery
  let cur(key, default) = rf.opt(theme, key, default)
  let sevs = ctx.severities
  let sample-rows = (("ID", t.core.finding, t.core.severity, t.core.score),) + ctx.findings.slice(0, calc.min(3, ctx.findings.len())).map(f => (f.id, f.title, rf.badge(theme, f.severity, t.severity.at(f.severity), size: 7pt), f.risk.label))

  heading(level: 1, numbering: none, tb.title)
  text(size: 9.5pt, fill: c.muted, tb.intro)
  v(0.8em)

  heading(level: 2, numbering: none, tb.headings)
  for st in HEADINGS {
    label-of(theme, tb, st, cur("heading_style", "rule"))
    block(width: 100%, stroke: (dash: "dotted", paint: c.rule, thickness: 0.5pt), inset: 8pt, rf.chapter-title(theme, "3", tb.sample_heading, style: st))
  }

  pagebreak()
  heading(level: 2, numbering: none, tb.badges)
  let cur-badge = rf.badge-style(theme)
  for st in BADGES {
    label-of(theme, tb, st, cur-badge)
    for s in sevs { rf.badge(theme, s.id, s.label, style: st); h(0.6em) }
  }
  v(1em)
  heading(level: 2, numbering: none, tb.callouts)
  for st in CALLOUTS {
    label-of(theme, tb, st, cur("callout_style", "bar"))
    rf.callout(theme, color: c.accent, title: tb.sample_callout_title, style: st, text(size: 9pt, tb.sample_callout))
  }

  pagebreak()
  heading(level: 2, numbering: none, tb.tables)
  for st in TABLES {
    label-of(theme, tb, st, cur("table_style", "lines"))
    rf.table(theme, widths: (14mm, 1fr, 26mm, 16mm), align: ("left", "left", "left", "right"), size: 8.5pt, style: st, rows: sample-rows)
  }

  pagebreak()
  heading(level: 2, numbering: none, tb.charts)
  grid(columns: (1fr, 1fr), column-gutter: 10mm, row-gutter: 4mm,
    ..CHARTS.map(st => block(width: 100%, breakable: false, { label-of(theme, tb, st, cur("chart_style", "bars")); block(width: 100%, inset: (y: 4pt), rf.severity-chart(theme, sevs, style: st, total-label: t.core.findings)) })))

  pagebreak()
  heading(level: 2, numbering: none, tb.covers)
  tb.cover_pages
  for st in COVERS {
    let th = theme
    th.page.insert("cover", st)
    cover.render(ctx, th, t, (show_period: true, gallery_label: [#text(font: theme.fonts.mono, size: 8pt, "page.cover: " + st)#if st == theme.page.at("cover", default: "band") { h(0.4em); rf.pill(theme, tb.current, color: c.accent, size: 6.5pt, filled: true) }]))
  }

  if ctx.findings.len() > 0 {
    pagebreak()
    heading(level: 2, numbering: none, tb.findings)
    tb.finding_pages
    let f = ctx.findings.at(0)
    for st in FINDINGS {
      if st != FINDINGS.at(0) { pagebreak() }
      label-of(theme, tb, st, cur("finding_layout", "classic"))
      finding.render(ctx, theme, t, (item: f, new_page: false, first_inline: true, layout: st))
    }
  }
}
