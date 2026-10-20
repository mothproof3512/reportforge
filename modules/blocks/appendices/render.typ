#import "/modules/lib/rf.typ"

// Text of the whole report (lower-cased) to decide which glossary terms are relevant.
#let report-text(ctx) = {
  let parts = ()
  for f in ctx.findings { parts.push(f.title); for (k, v) in f.sections { parts.push(repr(v)) } }
  for k in ("executive_summary", "conclusion", "positives", "test_approach") { let v = ctx.engagement.at(k, default: none); if v != none { parts.push(repr(v)) } }
  lower(parts.join(" "))
}

#let render(ctx, theme, t, opts) = {
  let c = theme.colors
  let tb = t.blocks.appendices
  let eng = ctx.engagement
  let has-tools = opts.at("tools", default: true) and eng.at("tools", default: none) != none and eng.tools.len() > 0
  let has-mapping = opts.at("mapping", default: true) and ctx.findings.len() > 0
  let glossary-terms = if not opts.at("glossary", default: true) { () } else if eng.at("glossary", default: none) != none and eng.glossary.len() > 0 { eng.glossary } else { let txt = report-text(ctx); tb.terms.filter(x => x.at("always", default: false) or txt.match(regex(x.match)) != none) }
  let has-disclaimer = opts.at("disclaimer", default: true) and theme.texts.at("disclaimer", default: none) != none
  let enabled = ()
  if has-tools { enabled.push("tools") }
  if has-mapping { enabled.push("mapping") }
  if glossary-terms.len() > 0 { enabled.push("glossary") }
  if has-disclaimer { enabled.push("disclaimer") }
  let section(key, title) = heading(level: 2, numbering: none, outlined: true, [#("A", "B", "C", "D").at(enabled.position(x => x == key)) · #title])
  rf.chapter(tb.title)
  if has-tools {
    section("tools", tb.tools)
    rf.table(theme, widths: (1fr, 1fr), header: false, size: 9pt,
      rows: eng.tools.map(x => (x.name, text(font: theme.fonts.mono, x.at("version", default: "–")))))
  }
  if has-mapping {
    section("mapping", tb.mapping)
    let owasp(f) = { let m = f.mapping.filter(m => m.standard.starts-with("owasp-top10")); if m.len() > 0 { m.map(x => x.item + if x.at("title", default: "") != "" { " " + x.title } else { "" }).join(", ") } else { f.mapping.map(x => x.item).join(", ") } }
    rf.table(theme, widths: (18mm, 40mm, 1fr), size: 8.5pt,
      rows: (("ID", t.core.cwe, tb.owasp_col),) + ctx.findings.map(f => (text(font: theme.fonts.mono, f.id), text(font: theme.fonts.mono, if f.cwe.len() > 0 { f.cwe.join(", ") } else { "–" }), owasp(f))))
  }
  {
    let terms = glossary-terms
    if terms.len() > 0 {
      section("glossary", tb.glossary)
      block(above: 0.8em, std.table(columns: (40mm, 1fr), inset: (x: 6pt, y: 5pt), stroke: none,
        fill: (x, y) => if calc.rem(y, 2) == 1 { c.surface } else { none },
        ..terms.map(x => (text(size: 9pt, fill: c.muted, x.term), text(size: 9pt, x.definition))).flatten()))
    }
  }
  if has-disclaimer {
    let txt = theme.texts.at("disclaimer", default: none)
    if txt != none {
      section("disclaimer", tb.disclaimer)
      show "{client}": eng.client.name
      show "{provider}": theme.provider.name
      set text(size: 9pt)
      txt.at(ctx.lang, default: txt.at("en", default: []))
    }
  }
}
