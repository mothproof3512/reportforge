#import "/modules/lib/rf.typ"

#let render(ctx, theme, t, opts) = {
  let eng = ctx.engagement
  let tb = t.blocks.scope
  rf.chapter(tb.title)
  tb.period_text.replace("{start}", ctx.fmt.period_start).replace("{end}", ctx.fmt.period_end)
  [ ]
  tb.intro
  let has-env = eng.scope.any(s => s.at("environment", default: none) != none)
  let header = (t.core.asset, t.core.type) + (if has-env { (t.core.environment,) } else { () }) + (t.core.notes,)
  rf.table(theme,
    widths: (52mm, 20mm) + (if has-env { (24mm,) } else { () }) + (1fr,),
    rows: (header,) + eng.scope.map(s => (raw(s.asset), s.at("type", default: ""),) + (if has-env { (s.at("environment", default: ""),) } else { () }) + (s.at("description", default: ""),)),
  )
  if eng.at("out_of_scope", default: none) != none and eng.out_of_scope.len() > 0 {
    heading(level: 2, tb.out_of_scope)
    list(..eng.out_of_scope.map(x => [#x]))
  }
  if eng.at("limitations", default: none) != none {
    heading(level: 2, tb.limitations)
    eng.limitations
  }
}
