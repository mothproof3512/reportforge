#import "/modules/lib/rf.typ"

#let render(ctx, theme, t, opts) = {
  let c = theme.colors
  let tb = t.blocks.retest-overview
  let eng = ctx.engagement
  rf.chapter(tb.title)
  if eng.at("retest", default: none) != none { tb.intro.replace("{date}", ctx.fmt.retest_date).replace("{version}", eng.retest.of_version) }
  let statuses = ("resolved", "partially-resolved", "open", "not-tested", "risk-accepted")
  let count(st) = ctx.findings.filter(f => f.at("retest", default: none) != none and f.retest.status == st).len()
  v(0.8em)
  grid(
    columns: (1fr,) * statuses.len(), column-gutter: 6pt,
    ..statuses.map(st => block(width: 100%, inset: (x: 8pt, y: 8pt), radius: 3pt, fill: c.surface, {
      text(size: 18pt, weight: "bold", fill: c.headingColor, str(count(st)))
      v(-0.2em)
      text(size: 7pt, weight: "semibold", tracking: 0.06em, fill: c.muted, upper(t.core.retest_status.at(st)))
    })),
  )
  rf.table(theme,
    widths: (13mm, 1fr, 22mm, 32mm),
    size: 8.5pt,
    rows: (("ID", t.core.finding, t.core.severity, t.core.retest),) + ctx.findings.map(f => (
      text(weight: "semibold", f.id),
      link(label("finding-" + f.id), f.title),
      rf.badge(theme, f.severity, t.severity.at(f.severity), size: 7pt),
      if f.at("retest", default: none) != none { t.core.retest_status.at(f.retest.status, default: f.retest.status) } else { "—" },
    )),
  )
}
