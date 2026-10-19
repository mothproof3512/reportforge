#import "/modules/lib/rf.typ"

#let render(ctx, theme, t, opts) = {
  let eng = ctx.engagement
  let tb = t.blocks.methodology
  rf.chapter(tb.title)
  if eng.at("test_approach", default: none) != none { eng.test_approach } else { tb.intro }
  if ctx.standards.len() > 0 {
    heading(level: 2, tb.standards_title)
    for s in ctx.standards {
      block(above: 0.9em, below: 0.6em, breakable: false, [
        #text(weight: "semibold", s.name)
        #if s.at("version", default: none) != none [ #text(fill: theme.colors.muted, size: 9pt)[(#s.version)]]
        #if s.at("url", default: none) != none [ #h(0.4em) #link(s.url)[#text(size: 8pt)[↗]]]
        #linebreak()
        #s.at("description", default: (:)).at(ctx.lang, default: "")
      ])
    }
  }
  heading(level: 2, tb.risk_title)
  if eng.risk_model == "matrix" { tb.risk_matrix } else { tb.risk_cvss.replace("{model}", t.core.risk_model.at(eng.risk_model)) }
  if eng.at("tools", default: none) != none and eng.tools.len() > 0 { [ ]; tb.tools_ref }
}
