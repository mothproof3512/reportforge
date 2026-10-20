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

// ---------------------------------------------------------------- shared pieces for the other layouts
#let all-sections(theme, t, tb, s, section-fn) = {
  section-fn(tb.summary, s.at("summary", default: none))
  section-fn(t.core.description, s.at("description", default: none))
  section-fn(tb.classification, s.at("classification", default: none))
  section-fn(t.core.evidence, s.at("evidence", default: none))
  section-fn(t.core.impact, s.at("impact", default: none))
  section-fn(tb.likelihood, s.at("likelihood", default: none))
  section-fn(t.core.recommendation, s.at("recommendation", default: none))
  section-fn(tb.notes, s.at("notes", default: none))
  for (k, v) in s.pairs() {
    if k not in ("summary", "description", "classification", "impact", "likelihood", "evidence", "recommendation", "notes", "references") { section-fn(upper(k.slice(0, 1)) + k.slice(1), v) }
  }
  section-fn(t.core.references, s.at("references", default: none))
}
#let mapping-text(f) = f.mapping.map(m => m.item).join(", ")
#let affected-text(f) = if f.affected.len() == 0 { "—" } else { f.affected.join(", ") }
#let page-break-for(opts, f) = if opts.at("new_page", default: true) and not (opts.at("first_inline", default: false) and f.index == 1) { pagebreak(weak: true) } else { v(1.4em) }

// card: the whole finding in a bordered card with a severity-coloured top edge;
// metadata as a two-column key/value block inside the card.
#let card-layout(ctx, theme, t, opts) = {
  let c = theme.colors
  let f = opts.item
  let tb = t.blocks.finding
  let s = f.sections
  page-break-for(opts, f)
  let model-name = t.core.risk_model.at(f.risk.model, default: f.risk.model)
  block(width: 100%, stroke: 0.5pt + c.rule, radius: 4pt, inset: 0pt, breakable: true, clip: true, {
    block(width: 100%, height: 4pt, fill: rf.sev-color(theme, f.severity))
    block(width: 100%, inset: (x: 13pt, top: 10pt, bottom: 8pt), {
      [#heading(level: 2, numbering: none, outlined: true, [#text(fill: c.accent, f.id) #h(0.5em) #f.title]) #label("finding-" + f.id)]
      v(0.2em)
      [#rf.badge(theme, f.severity, t.severity.at(f.severity)) #h(0.4em) #rf.status-pill(theme, t, f) #h(0.6em) #text(size: 8.5pt, fill: c.muted)[#model-name #text(weight: "bold", fill: c.ink, f.risk.label)]]
      v(0.6em)
      let kv = ((t.core.affected, affected-text(f)), (t.core.status, f.status))
      if f.mapping.len() > 0 { kv.push((t.core.mapping, mapping-text(f))) }
      if f.cwe.len() > 0 { kv.push((t.core.cwe, f.cwe.join(", "))) }
      if f.risk.at("vector", default: none) != none { kv.push((model-name, f.risk.vector)) }
      if f.at("source", default: none) != none { kv.push((t.core.source, f.source)) }
      block(width: 100%, fill: c.surface, radius: 3pt, inset: (x: 9pt, y: 7pt), grid(columns: (auto, 1fr), column-gutter: 10pt, row-gutter: 4pt,
        ..kv.map(p => (text(size: 7.5pt, fill: c.muted, tracking: 0.06em, upper(p.at(0))), text(size: 8.5pt, font: theme.fonts.mono, p.at(1)))).flatten()))
    })
    block(width: 100%, inset: (x: 13pt, bottom: 12pt), {
      let sec(title, body) = { if body == none { return }; block(above: 1em, below: 0.4em, sticky: true, text(weight: "bold", size: 10pt, fill: c.headingColor, title)); body }
      all-sections(theme, t, tb, s, sec)
      if f.at("retest", default: none) != none { retest-card(ctx, theme, t, f) }
    })
  })
}

// sidebar: a narrow left column with severity, score, status, CWE and mapping
// stacked; the sections on the right.
#let sidebar-layout(ctx, theme, t, opts) = {
  let c = theme.colors
  let f = opts.item
  let tb = t.blocks.finding
  let s = f.sections
  page-break-for(opts, f)
  let model-name = t.core.risk_model.at(f.risk.model, default: f.risk.model)
  [#heading(level: 2, numbering: none, outlined: true, [#text(fill: c.accent, f.id) #h(0.5em) #f.title]) #label("finding-" + f.id)]
  let item(label, body) = { text(size: 7pt, fill: c.muted, tracking: 0.08em, upper(label)); linebreak(); body; v(0.7em) }
  grid(columns: (40mm, 1fr), column-gutter: 8mm, align: (left + top, left + top),
    block(width: 100%, stroke: (right: 0.6pt + c.rule), inset: (right: 6mm), {
      set text(size: 8.5pt)
      item(t.core.severity, rf.badge(theme, f.severity, t.severity.at(f.severity)))
      item(model-name, text(size: 16pt, weight: "bold", fill: c.headingColor, f.risk.label))
      item(t.core.status, rf.status-pill(theme, t, f))
      if f.cwe.len() > 0 { item(t.core.cwe, text(font: theme.fonts.mono, f.cwe.join(", "))) }
      if f.mapping.len() > 0 { item(t.core.mapping, text(font: theme.fonts.mono, size: 7.5pt, f.mapping.map(m => m.item).join(linebreak()))) }
      item(t.core.affected, text(font: theme.fonts.mono, size: 7.5pt, f.affected.join(linebreak())))
      if f.risk.at("vector", default: none) != none { item(tb.vector, text(font: theme.fonts.mono, size: 6.8pt, f.risk.vector)) }
    }),
    {
      let sec(title, body) = { if body == none { return }; block(above: 0.9em, below: 0.4em, sticky: true, text(weight: "bold", size: 10pt, fill: c.headingColor, title)); body }
      if f.at("retest", default: none) != none { retest-card(ctx, theme, t, f) }
      all-sections(theme, t, tb, s, sec)
    },
  )
}

// compact: no page break per finding; title with inline chips, sections as
// run-in labels — for reports with many small findings.
#let compact-layout(ctx, theme, t, opts) = {
  let c = theme.colors
  let f = opts.item
  let tb = t.blocks.finding
  let s = f.sections
  if f.index == 1 { v(0.5em) } else { v(1.2em); line(length: 100%, stroke: 0.4pt + c.rule); v(0.6em) }
  block(breakable: false, {
    [#heading(level: 2, numbering: none, outlined: true, [#text(fill: c.accent, f.id) #h(0.5em) #f.title]) #label("finding-" + f.id)]
    v(-0.2em)
    [#rf.badge(theme, f.severity, t.severity.at(f.severity), size: 7pt) #h(0.3em) #rf.chip(theme, [#t.core.risk_model.at(f.risk.model, default: f.risk.model) #text(weight: "bold", f.risk.label)], size: 7.5pt) #h(0.3em) #rf.chip(theme, f.status, size: 7.5pt)#for m in f.mapping [ #h(0.3em) #rf.chip(theme, raw(m.item), size: 7.5pt)]#for w in f.cwe [ #h(0.3em) #rf.chip(theme, raw(w), size: 7.5pt)]]
    v(0.3em)
    text(size: 8.5pt, fill: c.muted)[#t.core.affected: #text(font: theme.fonts.mono, affected-text(f))]
  })
  let sec(title, body) = { if body == none { return }; block(above: 0.7em, below: 0.25em, sticky: true, text(weight: "bold", size: 9pt, fill: c.headingColor, title)); body }
  if f.at("retest", default: none) != none { retest-card(ctx, theme, t, f) }
  all-sections(theme, t, tb, s, sec)
}

// table: a two-column metadata table at the top, sections with numbered
// subheadings (F-01.1 Beschrijving …) — the "audit" look.
#let table-layout(ctx, theme, t, opts) = {
  let c = theme.colors
  let f = opts.item
  let tb = t.blocks.finding
  let s = f.sections
  page-break-for(opts, f)
  let model-name = t.core.risk_model.at(f.risk.model, default: f.risk.model)
  [#heading(level: 2, numbering: none, outlined: true, [#text(fill: c.accent, f.id) #h(0.5em) #f.title]) #label("finding-" + f.id)]
  let rows = (
    (t.core.severity, [#rf.badge(theme, f.severity, t.severity.at(f.severity)) #h(0.6em) #text(size: 8.5pt, fill: c.muted)[#model-name #text(weight: "bold", fill: c.ink, f.risk.label)]]),
    (t.core.status, [#f.status #h(0.6em) #rf.status-pill(theme, t, f)]),
    (t.core.affected, text(font: theme.fonts.mono, size: 8.5pt, affected-text(f))),
  )
  if f.mapping.len() > 0 { rows.push((t.core.mapping, text(font: theme.fonts.mono, size: 8.5pt, mapping-text(f)))) }
  if f.cwe.len() > 0 { rows.push((t.core.cwe, text(font: theme.fonts.mono, size: 8.5pt, f.cwe.join(", ")))) }
  if f.risk.at("vector", default: none) != none { rows.push((tb.vector, text(font: theme.fonts.mono, size: 8pt, f.risk.vector))) }
  if f.at("source", default: none) != none { rows.push((t.core.source, f.source)) }
  rf.table(theme, widths: (34mm, 1fr), header: false, size: 9pt, rows: rows.map(r => (text(weight: "semibold", fill: c.muted, r.at(0)), r.at(1))))
  let n = counter("rf-finding-section")
  n.update(0)
  let sec(title, body) = { if body == none { return }; n.step(); block(above: 1em, below: 0.4em, sticky: true, [#text(size: 8pt, fill: c.accent, weight: "semibold", font: theme.fonts.mono)[#f.id.#context n.display()] #h(0.5em) #text(weight: "bold", size: 10pt, fill: c.headingColor, title)]); body }
  if f.at("retest", default: none) != none { retest-card(ctx, theme, t, f) }
  all-sections(theme, t, tb, s, sec)
}

#let render(ctx, theme, t, opts) = {
  let layout = opts.at("layout", default: "theme")
  if layout == "theme" { layout = rf.opt(theme, "finding_layout", "classic") }
  if layout == "extended" { return extended(ctx, theme, t, opts) }
  if layout == "card" { return card-layout(ctx, theme, t, opts) }
  if layout == "sidebar" { return sidebar-layout(ctx, theme, t, opts) }
  if layout == "compact" { return compact-layout(ctx, theme, t, opts) }
  if layout == "table" { return table-layout(ctx, theme, t, opts) }
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
