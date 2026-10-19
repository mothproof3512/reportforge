#import "/modules/lib/rf.typ"

#let render(ctx, theme, t, opts) = {
  let tb = t.blocks.attestation-findings
  if ctx.findings.len() == 0 { return }
  heading(level: 1, numbering: none, tb.title)
  tb.intro
  let has-retest = ctx.engagement.at("retest", default: none) != none
  rf.table(theme, widths: (14mm, 1fr, 22mm, 30mm), size: 8.5pt,
    rows: (("ID", t.core.finding, t.core.severity, if has-retest { t.core.retest } else { t.core.status }),) + ctx.findings.map(f => (
      text(weight: "semibold", f.id), f.title, rf.badge(theme, f.severity, t.severity.at(f.severity), size: 7pt),
      if has-retest { if f.at("retest", default: none) != none { t.core.retest_status.at(f.retest.status, default: f.retest.status) } else { "—" } } else { f.status },
    )))
}
