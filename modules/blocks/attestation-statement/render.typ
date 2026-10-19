#import "/modules/lib/rf.typ"

#let render(ctx, theme, t, opts) = {
  let eng = ctx.engagement
  let tb = t.blocks.attestation-statement
  let at = eng.at("attestation", default: (:))
  heading(level: 1, numbering: none, tb.title)
  if at.at("statement", default: none) != none { at.statement } else {
    tb.statement.replace("{provider}", theme.provider.name).replace("{client}", eng.client.name).replace("{start}", ctx.fmt.period_start).replace("{end}", ctx.fmt.period_end)
  }
  if eng.at("retest", default: none) != none { [ ]; tb.statement_retest.replace("{retest_date}", ctx.fmt.retest_date).replace("{of_version}", eng.retest.of_version) }
  heading(level: 2, numbering: none, tb.scope_title)
  list(..eng.scope.map(s => [#raw(s.asset)#if s.at("description", default: none) != none [ — #s.description]]))
  if at.at("scope_note", default: none) != none { at.scope_note }
  heading(level: 2, numbering: none, tb.method_title)
  list(..ctx.standards.map(s => [#s.name#if s.at("version", default: none) != none and not s.name.contains(s.version) [ (#s.version)]]), [#t.core.risk_model.at(eng.risk_model)])
  heading(level: 2, numbering: none, tb.limits_title)
  tb.limits.replace("{client}", eng.client.name).replace("..", ".")
}
