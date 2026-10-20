#import "/modules/lib/rf.typ"

// Classic: appendix with score ranges and finding statuses.
// Extended (option layout: extended): numbered chapter "Risicoclassificatie" with
// weighting text, remediation terms per class, the shape legend and status pills.
#let render(ctx, theme, t, opts) = {
  let tb = t.blocks.appendix-severity
  let c = theme.colors
  let model = ctx.engagement.risk_model
  let ext = opts.at("layout", default: "classic") == "extended"
  pagebreak(weak: true)
  let ranges = if model == "matrix" { ("20 – 25", "12 – 19", "6 – 11", "2 – 5", "1") } else { ("9.0 – 10.0", "7.0 – 8.9", "4.0 – 6.9", "0.1 – 3.9", "n.v.t.") }
  if not ext {
    heading(level: 1, numbering: none, tb.title)
    if model == "matrix" { tb.matrix_intro } else { tb.cvss_intro.replace("{model}", t.core.risk_model.at(model)) }
    rf.table(theme,
      widths: (22mm, 24mm, 1fr),
      rows: ((tb.range, tb.level, tb.meaning),) + ctx.severities.enumerate().map(p => (ranges.at(p.at(0)), rf.badge(theme, p.at(1).id, p.at(1).label), tb.at(p.at(1).id))),
    )
    heading(level: 2, numbering: none, tb.status_title)
    list(tb.status_confirmed, tb.status_likely, tb.status_fp)
    return
  }
  heading(level: 1, tb.title_extended)
  rf.chapter-subtitle(tb.subtitle)
  heading(level: 2, numbering: none, outlined: false, tb.weighting)
  let w = opts.at("weights", default: (critical: 25, high: 10, medium: 4, low: 1, info: 0))
  let short = theme.provider.at("short", default: theme.provider.name)
  if model == "matrix" { tb.matrix_intro } else { tb.weighting_text.replace("{model}", t.core.risk_model.at(model)).replace("{provider}", short).replace("{weights}", ctx.severities.map(s => s.label + " " + str(w.at(s.id, default: 0))).join(", ")) }
  heading(level: 2, numbering: none, outlined: false, tb.classes_title)
  let terms = (tb.term_critical, tb.term_high, tb.term_medium, tb.term_low, tb.term_info)
  rf.table(theme,
    widths: (26mm, 24mm, 1fr, 34mm), size: 9pt,
    rows: ((tb.level, t.core.risk_model.at(model), tb.meaning, tb.term),) + ctx.severities.enumerate().map(p => (rf.badge(theme, p.at(1).id, p.at(1).label, size: 7pt), raw(ranges.at(p.at(0))), tb.at(p.at(1).id + "_short"), terms.at(p.at(0)))),
  )
  grid(columns: (1fr, 1fr), column-gutter: 10mm,
    {
      heading(level: 2, numbering: none, outlined: false, tb.shapes_title)
      set text(size: 9.5pt)
      tb.shapes_text
      v(0.5em)
      for s in ctx.severities { rf.badge(theme, s.id, s.label, size: 7pt); h(0.4em) }
    },
    {
      heading(level: 2, numbering: none, outlined: false, tb.status_remediation)
      set text(size: 9.5pt)
      tb.status_remediation_text
      v(0.5em)
      rf.pill(theme, t.core.resolved, color: c.severity.low, size: 7pt); h(0.4em)
      rf.pill(theme, t.core.partially_resolved, color: c.severity.medium, size: 7pt); h(0.4em)
      rf.pill(theme, t.core.open, color: c.severity.high, size: 7pt); h(0.4em)
      rf.pill(theme, t.core.retest_status.at("risk-accepted"), color: c.muted, size: 7pt)
    },
  )
}
