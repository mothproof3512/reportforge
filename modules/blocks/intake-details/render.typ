#import "/modules/lib/rf.typ"

#let render(ctx, theme, t, opts) = {
  let eng = ctx.engagement
  let tb = t.blocks.intake-details
  let it = eng.at("intake", default: (:))
  if opts.at("rules_only", default: false) {
    rf.chapter(tb.rules)
    let tw = it.at("test_window", default: none)
    if tw != none { heading(level: 2, tb.test_window); tw }
    let allowed = it.at("allowed", default: ())
    let not-allowed = it.at("not_allowed", default: ())
    if allowed.len() > 0 or not-allowed.len() > 0 {
      grid(columns: (1fr, 1fr), column-gutter: 16pt,
        rf.callout(theme, title: tb.allowed, color: theme.colors.severity.low, list(..allowed.map(a => [#a]))),
        rf.callout(theme, title: tb.not_allowed, color: theme.colors.severity.high, list(..not-allowed.map(a => [#a]))),
      )
    }
    let em = it.at("emergency_contact", default: none)
    if em != none { heading(level: 2, tb.emergency); em }
    return
  }
  rf.chapter(tb.title)
  let sec(title, body) = { if body != none and body != "" and body != () { heading(level: 2, title); body } }
  sec(tb.goal, it.at("goal", default: none))
  sec(tb.background, it.at("background", default: none))
  let tt = it.at("test_type", default: none)
  if tt != none { heading(level: 2, tb.test_type); tb.types.at(tt, default: tt) }
  sec(tb.credentials, it.at("credentials", default: none))
  let tw = it.at("test_window", default: none)
  if tw != none { heading(level: 2, tb.test_window); tw }
  sec(tb.preconditions, it.at("preconditions", default: none))
  let allowed = it.at("allowed", default: ())
  let not-allowed = it.at("not_allowed", default: ())
  if allowed.len() > 0 or not-allowed.len() > 0 {
    heading(level: 2, tb.rules)
    grid(columns: (1fr, 1fr), column-gutter: 16pt,
      rf.callout(theme, title: tb.allowed, color: theme.colors.severity.low, list(..allowed.map(a => [#a]))),
      rf.callout(theme, title: tb.not_allowed, color: theme.colors.severity.high, list(..not-allowed.map(a => [#a]))),
    )
  }
  let del = it.at("deliverables", default: ())
  if del.len() > 0 { heading(level: 2, tb.deliverables); list(..del.map(a => [#a])) }
  let em = it.at("emergency_contact", default: none)
  if em != none { heading(level: 2, tb.emergency); em }
  if it.at("notes", default: none) != none { heading(level: 2, t.core.notes); it.notes }
  // agreement block
  heading(level: 2, tb.agreement)
  tb.agreement_text.replace("{client}", eng.client.name).replace("{provider}", theme.provider.name)
  v(1.5em)
  grid(columns: (1fr, 1fr), column-gutter: 24pt,
    ..((eng.client.name, theme.provider.name).map(n => [
      #text(size: 8.5pt, fill: theme.colors.muted, t.core.agreed) \
      #text(weight: "semibold", n)
      #v(2.2em)
      #line(length: 100%, stroke: 0.5pt + theme.colors.ink)
      #text(size: 8pt, fill: theme.colors.muted)[#t.core.name, #t.core.place_date, #t.core.signature]
    ]))
  )
}
