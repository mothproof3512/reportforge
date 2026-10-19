#import "/modules/lib/rf.typ"

#let render(ctx, theme, t, opts) = {
  let tb = t.blocks.appendix-severity
  let model = ctx.engagement.risk_model
  pagebreak(weak: true)
  heading(level: 1, numbering: none, tb.title)
  let ranges = if model == "matrix" { ("20 – 25", "12 – 19", "6 – 11", "2 – 5", "1") } else { ("9.0 – 10.0", "7.0 – 8.9", "4.0 – 6.9", "0.1 – 3.9", "0.0") }
  if model == "matrix" { tb.matrix_intro } else { tb.cvss_intro.replace("{model}", t.core.risk_model.at(model)) }
  rf.table(theme,
    widths: (22mm, 24mm, 1fr),
    rows: ((tb.range, tb.level, tb.meaning),) + ctx.severities.enumerate().map(p => (ranges.at(p.at(0)), rf.badge(theme, p.at(1).id, p.at(1).label), tb.at(p.at(1).id))),
  )
  heading(level: 2, numbering: none, tb.status_title)
  list(tb.status_confirmed, tb.status_likely, tb.status_fp)
}
