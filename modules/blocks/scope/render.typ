#import "/modules/lib/rf.typ"

// Extended layout (report template): objective, in-scope table with access
// column, out-of-scope list next to the conditions/agreements, test accounts.
#let extended(ctx, theme, t, opts) = {
  let eng = ctx.engagement
  let tb = t.blocks.scope
  let c = theme.colors
  let intake = eng.at("intake", default: (:))
  if intake == none { intake = (:) }
  rf.chapter(tb.title_extended)
  if intake.at("goal", default: none) != none { heading(level: 2, numbering: none, outlined: false, tb.objective); intake.goal }
  heading(level: 2, numbering: none, outlined: false, tb.in_scope)
  let has-env = eng.scope.any(s => s.at("environment", default: none) != none)
  let has-acc = eng.scope.any(s => s.at("access", default: none) != none)
  let has-desc = eng.scope.any(s => s.at("description", default: none) != none)
  let header = (t.core.asset, t.core.type) + (if has-env { (t.core.environment,) } else { () }) + (if has-acc { (tb.access,) } else { () }) + (if has-desc { (t.core.notes,) } else { () })
  let widths = (50mm, 26mm) + (if has-env { (24mm,) } else { () }) + (if has-acc { (30mm,) } else { () }) + (if has-desc { (1fr,) } else { () })
  if not has-desc { widths = widths.slice(0, -1) + (1fr,) }
  rf.table(theme, widths: widths, size: 8.5pt,
    rows: (header,) + eng.scope.map(s => (raw(s.asset), s.at("type", default: ""),) + (if has-env { (s.at("environment", default: ""),) } else { () }) + (if has-acc { (s.at("access", default: ""),) } else { () }) + (if has-desc { (s.at("description", default: ""),) } else { () })),
  )
  let conds = ()
  if intake.at("test_window", default: none) != none { conds.push((tb.test_window, intake.test_window)) }
  let rt = (eng.at("testplan", default: (:))).at("planning", default: ()).filter(p => lower(p.phase).contains("hertest") or lower(p.phase).contains("retest"))
  if eng.at("retest", default: none) != none { conds.push((t.core.retest, ctx.fmt.retest_date)) } else if rt.len() > 0 { conds.push((t.core.retest, ctx.fmt.planning.filter(p => p.phase == rt.at(0).phase).at(0).start_short + " – " + ctx.fmt.planning.filter(p => p.phase == rt.at(0).phase).at(0).end_short)) }
  if intake.at("test_type", default: none) != none { conds.push((tb.test_type, intake.test_type)) }
  for p in eng.client.at("contact", default: ()).slice(0, 2) { conds.push((if p.at("role", default: none) != none { p.role } else { tb.contact }, p.name)) }
  if intake.at("emergency_contact", default: none) != none { conds.push((tb.escalation, intake.emergency_contact)) }
  grid(columns: (1fr, 1fr), column-gutter: 10mm,
    {
      if eng.at("out_of_scope", default: none) != none and eng.out_of_scope.len() > 0 {
        heading(level: 2, numbering: none, outlined: false, tb.out_of_scope)
        set text(size: 9.5pt)
        list(spacing: 0.5em, ..eng.out_of_scope.map(x => [#x]))
      }
      if eng.at("limitations", default: none) != none { heading(level: 2, numbering: none, outlined: false, tb.limitations); eng.limitations }
    },
    if conds.len() > 0 {
      heading(level: 2, numbering: none, outlined: false, tb.conditions)
      block(above: 0.8em, std.table(columns: (30mm, 1fr), inset: (x: 6pt, y: 5pt), stroke: none,
        fill: (x, y) => if calc.rem(y, 2) == 0 { c.surface } else { none },
        ..conds.map(p => (text(size: 8.5pt, fill: c.muted, p.at(0)), text(size: 9pt, p.at(1)))).flatten()))
    },
  )
  if eng.at("accounts", default: none) != none and eng.accounts.len() > 0 {
    heading(level: 2, numbering: none, outlined: false, tb.accounts)
    block(width: 50%, rf.table(theme, widths: (1fr, 1fr, 1fr), size: 8.5pt,
      rows: ((t.core.role, tb.account, tb.rights),) + eng.accounts.map(a => (a.role, a.at("account", default: "–"), a.at("rights", default: "–")))))
  } else if intake.at("credentials", default: none) != none {
    heading(level: 2, numbering: none, outlined: false, tb.accounts); intake.credentials
  }
}

#let render(ctx, theme, t, opts) = {
  if opts.at("layout", default: "classic") == "extended" { return extended(ctx, theme, t, opts) }
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
