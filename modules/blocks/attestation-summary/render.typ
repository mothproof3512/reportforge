#import "/modules/lib/rf.typ"

#let render(ctx, theme, t, opts) = {
  let eng = ctx.engagement
  let tb = t.blocks.attestation-summary
  let st = ctx.stats
  let has-retest = eng.at("retest", default: none) != none
  heading(level: 1, numbering: none, tb.title)
  if st.total == 0 { tb.none; return }
  let open-total = ctx.severities.map(s => s.open).sum()
  if has-retest { tb.intro_retest.replace("{total}", str(st.total)).replace("{resolved}", str(st.total - open-total)).replace("{open}", str(open-total)) } else { tb.intro.replace("{total}", str(st.total)) }
  let header = (t.core.severity, tb.found) + if has-retest { (tb.open_after,) } else { () }
  rf.table(theme, widths: (40mm, 30mm) + if has-retest { (34mm,) } else { () }, align: ("left", "right", "right"),
    rows: (header,) + ctx.severities.map(s => (rf.badge(theme, s.id, s.label), str(s.count)) + if has-retest { (str(s.open),) } else { () }) + ((text(weight: "semibold", t.core.total), text(weight: "semibold", str(st.total))) + if has-retest { (text(weight: "semibold", str(open-total)),) } else { () },))
  let n-high = if has-retest { st.openBySeverity.critical + st.openBySeverity.high } else { st.bySeverity.critical + st.bySeverity.high }
  let at = eng.at("attestation", default: (:))
  if at.at("conclusion", default: none) != none { at.conclusion }
  else if n-high == 0 { rf.callout(theme, color: theme.colors.severity.low, tb.conclusion_none_high) }
  else { rf.callout(theme, color: theme.colors.severity.high, tb.conclusion_open_high.replace("{n}", str(n-high)).replace("{provider}", theme.provider.name)) }
}
