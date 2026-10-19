#import "/modules/lib/rf.typ"

#let status-chip(theme, t, st) = {
  let c = theme.colors
  let col = if st == "tested" { c.severity.low } else if st == "finding" { c.severity.high } else if st == "n/a" { c.muted } else { c.rule }
  let fg = if st == "not-tested" { c.ink } else { white }
  box(fill: col, radius: 2pt, inset: (x: 4pt, y: 2pt), text(size: 7pt, weight: "bold", fill: fg, upper(t.core.checklist_status.at(st, default: st))))
}

#let render(ctx, theme, t, opts) = {
  let tb = t.blocks.checklist
  let mode = opts.at("mode", default: "coverage")
  let cov = ctx.coverage
  if cov.len() == 0 { return }
  pagebreak(weak: true)
  heading(level: 1, numbering: if mode == "plan" { "1.1" } else { none }, if mode == "plan" { tb.title_plan } else { tb.title_coverage })
  if mode == "plan" { tb.intro_plan } else { tb.intro_coverage }
  let stds = ctx.standards.filter(s => cov.any(c => c.standard == s.id))
  for sd in stds {
    let items = cov.filter(c => c.standard == sd.id)
    heading(level: 2, numbering: none, sd.name + if sd.at("version", default: none) != none { " " + sd.version } else { "" })
    if mode != "plan" {
      let n(st) = items.filter(i => i.status == st).len()
      text(size: 9pt, fill: theme.colors.muted, tb.summary.replace("{tested}", str(n("tested") + n("finding"))).replace("{total}", str(items.len())).replace("{finding}", str(n("finding"))).replace("{na}", str(n("n/a"))).replace("{nottested}", str(n("not-tested"))))
    }
    let has-cat = items.any(i => i.at("category", default: none) != none)
    let rows = ()
    let last-cat = none
    for i in items {
      let cat = i.at("category", default: none)
      if has-cat and cat != last-cat and cat != none {
        rows.push((std.table.cell(colspan: 4, inset: (x: 6pt, y: 4pt), text(weight: "semibold", size: 8.5pt, fill: theme.colors.headingColor, cat)),))
        last-cat = cat
      }
      let note = i.at("note", default: none)
      let fnd = i.findings.join(", ")
      rows.push((
        raw(i.item),
        i.title,
        if mode == "plan" { box(width: 9pt, height: 9pt, stroke: 0.6pt + theme.colors.muted, radius: 1pt) } else { status-chip(theme, t, i.status) },
        if mode == "plan" { [] } else { [#if note != none { note } #if fnd != "" { text(weight: "semibold", fnd) }] },
      ))
    }
    rf.table(theme, widths: (28mm, 1fr, 22mm, 44mm), size: 8.5pt, rows: ((t.core.item, "", t.core.status, t.core.notes),) + rows)
  }
}
