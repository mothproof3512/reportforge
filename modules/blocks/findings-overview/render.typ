#import "/modules/lib/rf.typ"

#let render(ctx, theme, t, opts) = {
  let c = theme.colors
  let tb = t.blocks.findings-overview
  let has-retest = ctx.findings.any(f => f.at("retest", default: none) != none)
  rf.chapter(tb.title, subtitle: tb.subtitle.replace("{n}", str(ctx.findings.len())).replace("{retest}", if has-retest { tb.subtitle_retest } else { "" }))
  if ctx.findings.len() == 0 { tb.none; return }
  let asset(f) = if f.affected.len() == 0 { "—" } else if f.affected.len() <= 2 { f.affected.join(", ") } else { f.affected.at(0) + " (+" + str(f.affected.len() - 1) + ")" }
  let header = ("ID", t.core.finding, t.core.asset, t.core.severity, t.core.score, tb.at_delivery) + (if has-retest { (tb.after_retest,) } else { () })
  let widths = (13mm, 1fr, 40mm, 24mm, 13mm, 20mm) + (if has-retest { (22mm,) } else { () })
  rf.table(theme, widths: widths, size: 8.5pt,
    rows: (header,) + ctx.findings.map(f => (
      text(font: theme.fonts.mono, size: 8pt, f.id),
      link(label("finding-" + f.id), f.title),
      text(font: theme.fonts.mono, size: 7.5pt, asset(f)),
      rf.badge(theme, f.severity, t.severity.at(f.severity), size: 7pt),
      text(font: theme.fonts.mono, size: 8pt, f.risk.label),
      rf.pill(theme, t.core.open, color: c.severity.high, size: 7pt),
    ) + (if has-retest { (rf.status-pill(theme, t, f, size: 7pt),) } else { () })),
  )
  if opts.at("tiles", default: true) {
    v(1em)
    let st = ctx.stats.bySeverity
    grid(columns: (1fr,) * 4, column-gutter: 6mm,
      rf.stat(theme, str(st.critical), t.severity.critical, color: if st.critical > 0 { c.severity.critical } else { none }),
      rf.stat(theme, str(st.high), t.severity.high, color: if st.high > 0 { c.severity.high } else { none }),
      rf.stat(theme, str(st.medium), t.severity.medium, color: if st.medium > 0 { c.severity.medium } else { none }),
      rf.stat(theme, str(st.low + st.info), tb.low_info),
    )
  }
}
