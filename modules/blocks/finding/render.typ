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

#let render(ctx, theme, t, opts) = {
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
    if k not in ("description", "impact", "evidence", "recommendation", "references") { section(theme, t, upper(k.slice(0, 1)) + k.slice(1), v) }
  }
  section(theme, t, t.core.references, s.at("references", default: none))
}
