#import "/modules/lib/rf.typ"

// Severity tiles: one per severity, count large, label small.
#let tiles(ctx, theme, t) = {
  let c = theme.colors
  grid(
    columns: (1fr,) * 5,
    column-gutter: 6pt,
    ..ctx.severities.map(s => block(
      width: 100%,
      inset: (x: 8pt, y: 9pt),
      radius: 3pt,
      fill: if s.count > 0 { rf.sev-color(theme, s.id) } else { c.surface },
      {
        let fg = if s.count > 0 { rf.sev-text-color(theme, s.id) } else { c.muted }
        text(size: 20pt, weight: "bold", fill: fg, str(s.count))
        v(-0.25em)
        text(size: 7.5pt, weight: "semibold", tracking: 0.08em, fill: fg, upper(s.label))
      },
    )),
  )
}

#let render(ctx, theme, t, opts) = {
  let c = theme.colors
  let eng = ctx.engagement
  let tb = t.blocks.executive-summary
  let st = ctx.stats
  rf.chapter(tb.title)
  if rf.opt(theme, "chart_style", "bars") in ("bars", "tiles") { tiles(ctx, theme, t) } else { rf.severity-chart(theme, ctx.severities, total-label: t.core.findings) }
  v(1.2em)
  if eng.at("executive_summary", default: none) != none {
    eng.executive_summary
  } else {
    let vars = (
      ("{provider}", theme.provider.name), ("{client}", eng.client.name), ("{start}", ctx.fmt.period_start), ("{end}", ctx.fmt.period_end),
      ("{scope_count}", str(eng.scope.len())), ("{total}", str(st.total)),
      ("{critical}", str(st.bySeverity.critical)), ("{high}", str(st.bySeverity.high)), ("{medium}", str(st.bySeverity.medium)), ("{low}", str(st.bySeverity.low)), ("{info}", str(st.bySeverity.info)),
    )
    let s = tb.auto_intro
    for (k, v) in vars { s = s.replace(k, v) }
    s
    v(0.6em)
    text(size: 8.5pt, fill: c.muted, style: "italic", tb.auto_note)
  }
  let n = opts.at("top_n", default: 5)
  let top = ctx.findings.filter(f => f.severity != "info").slice(0, calc.min(n, ctx.findings.filter(f => f.severity != "info").len()))
  if top.len() > 0 {
    v(0.4em)
    heading(level: 2, numbering: none, outlined: false, tb.top_findings)
    rf.table(theme,
      widths: (14mm, 1fr, 24mm, 18mm),
      align: ("left", "left", "left", "right"),
      rows: (("ID", t.core.finding, t.core.severity, t.core.score),) + top.map(f => (
        text(weight: "semibold", f.id),
        link(label("finding-" + f.id), f.title),
        rf.badge(theme, f.severity, t.severity.at(f.severity)),
        f.risk.label,
      )),
    )
  } else if st.total == 0 {
    v(0.6em)
    rf.callout(theme, tb.no_findings, color: c.severity.low)
  }
}
