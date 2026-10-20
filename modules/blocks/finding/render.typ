#import "/modules/lib/rf.typ"

// One finding. Rendered once per item (manifest: each: findings).
//
// Layout:
//   F-01  Title                                   ← heading (level 2, unnumbered, in outline)
//   ┌ severity ─ score ─ status ─ source ───────┐
//   │ vector · standards · CWE                  │  ← metadata card, never splits over pages
//   └───────────────────────────────────────────┘
//   Affected systems
//   Description / Impact / Evidence / Recommendation / References

#let meta-card(ctx, theme, t, f) = {
  let c = theme.colors
  let model-name = t.core.risk_model.at(f.risk.model, default: f.risk.model)
  let cells = (
    (t.core.severity, rf.badge(theme, f.severity, t.severity.at(f.severity))),
    (model-name, text(weight: "bold", size: 11pt, f.risk.label)),
    (t.core.status, f.status),
  )
  if f.at("source", default: none) != none { cells.push((t.core.source, f.source)) }
  block(
    width: 100%,
    fill: c.surface,
    radius: 3pt,
    inset: (x: 11pt, y: 9pt),
    breakable: false,
    above: 0.6em,
    below: 1.1em,
    {
      grid(
        columns: cells.map(_ => auto) + (1fr,),
        column-gutter: 16pt,
        align: left + horizon,
        ..cells.map(cl => stack(spacing: 4pt, text(size: 7pt, fill: c.muted, tracking: 0.08em, upper(cl.at(0))), cl.at(1))),
        [],
      )
      let extras = ()
      if f.risk.at("vector", default: none) != none { extras.push(raw(f.risk.vector)) }
      for m in f.mapping { extras.push(if m.at("url", default: none) != none { link(m.url, raw(m.item)) } else { raw(m.item) }) }
      for cwe in f.cwe { extras.push(link("https://cwe.mitre.org/data/definitions/" + cwe.replace("CWE-", "") + ".html", raw(cwe))) }
      if extras.len() > 0 {
        v(6pt)
        line(length: 100%, stroke: 0.4pt + c.rule)
        v(4pt)
        set text(size: 8pt, fill: c.muted)
        extras.join(h(0.5em) + text(fill: c.rule)[|] + h(0.5em))
      }
    },
  )
}

#let section(theme, t, title, body) = {
  if body == none { return }
  heading(level: 3, numbering: none, outlined: false, title)
  body
}

#let retest-card(ctx, theme, t, f) = {
  let c = theme.colors
  let r = f.retest
  let col = if r.status == "resolved" { c.severity.low } else if r.status == "partially-resolved" { c.severity.medium } else if r.status == "open" { c.severity.high } else { c.muted }
  rf.callout(theme, color: col, title: t.core.retest + " — " + t.core.retest_status.at(r.status, default: r.status), if r.at("note", default: none) != none { r.note } else { [] })
}

// ---------------------------------------------------------------- extended layout
// Title row with badge + status pill, hairlined metadata grid (CVSS, CWE, OWASP,
// likelihood × impact, asset), then Summary / Description / classification
// rationale / Evidence / Impact & Likelihood / Recommendation / Notes / References / Retest.
#let meta-grid(ctx, theme, t, tb, f) = {
  let c = theme.colors
  let lbl(s) = text(size: 7pt, fill: c.muted, tracking: 0.06em, upper(s))
  let mono(s) = text(font: theme.fonts.mono, size: 8.5pt, s)
  let model-name = t.core.risk_model.at(f.risk.model, default: f.risk.model)
  let score = if f.risk.at("score", default: none) != none and f.risk.model != "matrix" { f.risk.label } else { t.core.n_a }
  let vec = if f.risk.at("vector", default: none) != none { f.risk.vector.replace("CVSS:3.1/", "").replace("CVSS:4.0/", "") } else { none }
  let owasp = f.mapping.filter(m => m.standard.starts-with("owasp") or m.standard.starts-with("masvs"))
  let other = f.mapping.filter(m => not (m.standard.starts-with("owasp") or m.standard.starts-with("masvs")))
  let d = f.risk.details
  let ki = if d.at("likelihood", default: none) != none { str(d.likelihood) + " × " + str(d.impact) } else { "—" }
  block(width: 100%, above: 0.8em, below: 1.2em, breakable: false, {
    line(length: 100%, stroke: 0.5pt + c.rule)
    v(6pt)
    grid(columns: (1.4fr, 1fr, 1fr), column-gutter: 8pt, row-gutter: 9pt, align: left + top,
      stack(spacing: 4pt, lbl(model-name), mono(score + if vec != none { " · " + vec } else { "" })),
      stack(spacing: 4pt, lbl(t.core.cwe), if f.cwe.len() > 0 { mono(f.cwe.join(", ")) } else { mono("—") }),
      stack(spacing: 4pt, lbl(if owasp.len() > 0 { "OWASP" } else { t.core.mapping }),
        if owasp.len() > 0 { text(size: 8.5pt, owasp.map(m => if m.at("title", default: none) != none and m.title != "" { m.title } else { m.item }).join(", ")) }
        else if other.len() > 0 { mono(other.map(m => m.item).join(", ")) } else { mono("—") }),
      stack(spacing: 4pt, lbl(tb.likelihood_impact), mono(ki)),
      grid.cell(colspan: 2, stack(spacing: 4pt, lbl(t.core.asset), mono(if f.affected.len() == 0 { "—" } else { f.affected.join(", ") }))),
    )
    v(6pt)
    line(length: 100%, stroke: 0.5pt + c.rule)
  })
}

#let ext-section(theme, title, body, size: 10pt) = {
  if body == none { return }
  block(above: 1.1em, below: 0.4em, sticky: true, text(weight: "bold", size: size, fill: theme.colors.headingColor, title))
  body
}

#let extended(ctx, theme, t, opts) = {
  let c = theme.colors
  let f = opts.item
  let tb = t.blocks.finding
  let s = f.sections
  if opts.at("new_page", default: true) and not (opts.at("first_inline", default: false) and f.index == 1) { pagebreak(weak: true) } else { v(1.2em) }
  // Big title; the outer level-2 show rule is bypassed by this closer one.
  show heading.where(level: 2): it => block(above: 0.3em, below: 0.6em, text(size: 18pt, weight: "bold", fill: c.headingColor, font: theme.fonts.heading, hyphenate: false, it.body))
  block(breakable: false, {
    context {
      let n = counter(heading).get().first()
      rf.eyebrow(theme, [#if n > 0 [#n · ]#t.core.finding #f.id])
    }
    v(0.2em)
    grid(columns: (1fr, auto), column-gutter: 6mm, align: (left + top, right + top),
      [#heading(level: 2, numbering: none, outlined: true, bookmarked: true, [#text(font: theme.fonts.mono, size: 0.72em, weight: "semibold", fill: c.accent, f.id)#h(0.5em)#f.title]) #label("finding-" + f.id)],
      block(above: 1.1em, [#rf.badge(theme, f.severity, t.severity.at(f.severity)) #h(0.3em) #rf.status-pill(theme, t, f)]),
    )
    meta-grid(ctx, theme, t, tb, f)
  })
  ext-section(theme, tb.summary, s.at("summary", default: none))
  ext-section(theme, t.core.description, s.at("description", default: none))
  let model-sev = f.risk.details.at("modelSeverity", default: none)
  if s.at("classification", default: none) != none {
    rf.callout(theme, color: c.primary, title: tb.classification, s.classification)
  } else if model-sev != none and model-sev != f.severity {
    rf.callout(theme, color: c.primary, title: tb.classification, tb.classification_auto.replace("{score}", f.risk.label).replace("{model_severity}", lower(t.severity.at(model-sev))).replace("{severity}", lower(t.severity.at(f.severity))))
  }
  ext-section(theme, t.core.evidence, s.at("evidence", default: none))
  let imp = s.at("impact", default: none)
  let lik = s.at("likelihood", default: none)
  if imp != none and lik != none {
    grid(columns: (1fr, 1fr), column-gutter: 8mm,
      ext-section(theme, t.core.impact, imp),
      ext-section(theme, tb.likelihood, lik),
    )
  } else {
    ext-section(theme, t.core.impact, imp)
    ext-section(theme, tb.likelihood, lik)
  }
  if s.at("recommendation", default: none) != none {
    rf.callout(theme, color: c.accent, title: t.core.recommendation, s.recommendation)
  }
  ext-section(theme, tb.notes, s.at("notes", default: none))
  for (k, v) in s.pairs() {
    if k not in ("summary", "description", "classification", "impact", "likelihood", "evidence", "recommendation", "notes", "references") { ext-section(theme, upper(k.slice(0, 1)) + k.slice(1), v) }
  }
  if s.at("references", default: none) != none {
    block(above: 1.1em, below: 0.3em, sticky: true, text(weight: "bold", size: 10pt, fill: c.headingColor, t.core.references))
    block(text(size: 8pt, fill: c.muted, s.references))
  }
  block(above: 1.1em, below: 0.3em, sticky: true, text(weight: "bold", size: 10pt, fill: c.headingColor, t.core.retest))
  if f.at("retest", default: none) != none {
    [#rf.status-pill(theme, t, f) #h(0.4em) #if f.retest.at("note", default: none) != none { f.retest.note }]
  } else { tb.retest_pending }
}

#let render(ctx, theme, t, opts) = {
  if opts.at("layout", default: "classic") == "extended" { return extended(ctx, theme, t, opts) }
  let c = theme.colors
  let f = opts.item
  let tb = t.blocks.finding
  if opts.at("new_page", default: true) { pagebreak(weak: true) } else { v(1.5em) }
  block(breakable: false, {
    [#heading(level: 2, numbering: none, outlined: true, [#text(fill: c.accent, f.id) #h(0.5em) #f.title]) #label("finding-" + f.id)]
    meta-card(ctx, theme, t, f)
  })
  if f.at("retest", default: none) != none { retest-card(ctx, theme, t, f) }
  if f.affected.len() > 0 {
    heading(level: 3, numbering: none, outlined: false, t.core.affected)
    if f.affected.len() <= 2 {
      f.affected.map(a => raw(a)).join(", ")
    } else {
      block(above: 0.4em, columns(if f.affected.len() > 6 { 2 } else { 1 }, gutter: 12pt, list(spacing: 0.45em, ..f.affected.map(a => raw(a)))))
    }
  }
  let s = f.sections
  section(theme, t, t.core.description, s.at("description", default: none))
  section(theme, t, t.core.impact, s.at("impact", default: none))
  section(theme, t, t.core.evidence, s.at("evidence", default: none))
  section(theme, t, t.core.recommendation, s.at("recommendation", default: none))
  for (k, v) in s.pairs() {
    if k not in ("description", "impact", "evidence", "recommendation", "references") { section(theme, t, tb.at(k, default: upper(k.slice(0, 1)) + k.slice(1)), v) }
  }
  section(theme, t, t.core.references, s.at("references", default: none))
}
