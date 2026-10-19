#import "/modules/lib/rf.typ"

#let render(ctx, theme, t, opts) = {
  let eng = ctx.engagement
  let tb = t.blocks.testplan-approach
  let tp = eng.at("testplan", default: (:))
  rf.chapter(tb.title)
  if tp.at("approach", default: none) != none { tp.approach } else { tb.none }
  let ps = tp.at("per_scope", default: ())
  if ps.len() > 0 {
    heading(level: 2, tb.per_scope)
    rf.table(theme, widths: (56mm, 1fr), rows: ((t.core.asset, tb.title),) + ps.map(p => (raw(p.asset), p.approach)))
  }
  let pl = tp.at("planning", default: ())
  if pl.len() > 0 {
    heading(level: 2, tb.planning)
    rf.table(theme, widths: (1fr, 28mm, 28mm, 50mm), rows: ((tb.phase, tb.from, tb.to, t.core.notes),) + pl.map(p => (p.phase, p.at("start", default: ""), p.at("end", default: ""), p.at("notes", default: ""))))
  }
  if tp.at("go_nogo", default: none) != none { heading(level: 2, tb.go_nogo); tp.go_nogo }
}
