#import "/modules/lib/rf.typ"

// Horizontal bar per severity, proportional to the largest count.
#let bars(ctx, theme, t) = {
  let c = theme.colors
  let mx = calc.max(1, ..ctx.severities.map(s => s.count))
  grid(
    columns: (22mm, 1fr, 10mm),
    row-gutter: 6pt,
    column-gutter: 8pt,
    align: (left + horizon, left + horizon, right + horizon),
    ..ctx.severities.map(s => (
      text(size: 9pt, s.label),
      block(width: 100%, height: 9pt, fill: c.surface, radius: 2pt, align(left, box(width: calc.max(0.5%, 100% * s.count / mx), height: 9pt, fill: rf.sev-color(theme, s.id), radius: 2pt))),
      text(size: 9pt, weight: "semibold", str(s.count)),
    )).flatten(),
  )
}

// 5×5 impact × likelihood matrix with finding ids in the cells.
#let matrix(ctx, theme, t, tb) = {
  let c = theme.colors
  let n = 5
  let cell(i, l) = {
    let ids = ctx.findings.filter(f => f.risk.details.at("impact", default: 0) == i and f.risk.details.at("likelihood", default: 0) == l).map(f => f.id)
    let p = i * l
    let sev = if p >= 20 { "critical" } else if p >= 12 { "high" } else if p >= 6 { "medium" } else if p >= 2 { "low" } else { "info" }
    box(width: 100%, height: 11mm, fill: rf.sev-color(theme, sev).lighten(if ids.len() > 0 { 0% } else { 72% }), inset: 3pt, align(center + horizon, text(size: 7.5pt, weight: "bold", fill: if ids.len() > 0 { rf.sev-text-color(theme, sev) } else { c.muted }, ids.join(", "))))
  }
  let rows = range(n, 0, step: -1).map(i => ((text(size: 8pt, fill: c.muted, str(i)),) + range(1, n + 1).map(l => cell(i, l)))).flatten()
  block(breakable: false, {
    grid(
      columns: (8mm,) + (1fr,) * n,
      column-gutter: 2pt, row-gutter: 2pt,
      align: center + horizon,
      ..rows,
      [], ..range(1, n + 1).map(l => text(size: 8pt, fill: c.muted, str(l))),
    )
    v(2pt)
    grid(columns: (8mm, 1fr), [], align(center, text(size: 8pt, fill: c.muted, tb.likelihood + " →")))
    place(left + horizon, dx: -9mm, rotate(-90deg, text(size: 8pt, fill: c.muted, tb.impact + " →")))
  })
}

#let render(ctx, theme, t, opts) = {
  let c = theme.colors
  let tb = t.blocks.risk-overview
  rf.chapter(tb.title)
  if ctx.findings.len() == 0 { tb.none; return }
  heading(level: 2, tb.distribution)
  bars(ctx, theme, t)
  if ctx.engagement.risk_model == "matrix" {
    heading(level: 2, tb.matrix)
    matrix(ctx, theme, t, tb)
  }
  heading(level: 2, tb.all_findings)
  rf.table(theme,
    widths: (13mm, 1fr, 22mm, 16mm, 24mm),
    align: ("left", "left", "left", "right", "left"),
    size: 8.5pt,
    rows: (("ID", t.core.finding, t.core.severity, t.core.score, t.core.status),) + ctx.findings.map(f => (
      text(weight: "semibold", f.id),
      link(label("finding-" + f.id), f.title),
      rf.badge(theme, f.severity, t.severity.at(f.severity), size: 7pt),
      f.risk.label,
      if f.at("retest", default: none) != none { t.core.retest_status.at(f.retest.status, default: f.retest.status) } else { f.status },
    )),
  )
  if opts.at("by_standard", default: true) {
    let mapped = ctx.findings.filter(f => f.mapping.len() > 0)
    if mapped.len() > 0 {
      heading(level: 2, tb.by_standard)
      let items = (:)
      for f in ctx.findings {
        for m in f.mapping {
          let key = m.item
          let cur = items.at(key, default: (title: m.at("title", default: ""), ids: ()))
          cur.ids.push(f.id)
          items.insert(key, cur)
        }
      }
      rf.table(theme,
        widths: (32mm, 1fr, 40mm),
        size: 8.5pt,
        rows: ((t.core.standards, "", t.core.findings),) + items.pairs().sorted(key: p => p.at(0)).map(p => (raw(p.at(0)), p.at(1).title, p.at(1).ids.join(", "))),
      )
    }
  }
}
