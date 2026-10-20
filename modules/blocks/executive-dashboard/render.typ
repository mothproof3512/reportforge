#import "/modules/lib/rf.typ"

// Score = 100 − Σ weight(open finding), floored at 0.
#let score-of(ctx, opts) = {
  let w = opts.at("weights", default: (critical: 25, high: 10, medium: 4, low: 1, info: 0))
  let open = ctx.findings.filter(f => f.at("retest", default: none) == none or f.retest.status not in ("resolved", "risk-accepted"))
  let s = 100
  for f in open { s -= w.at(f.severity, default: 0) }
  calc.max(0, s)
}
#let score-label(tb, opts, s) = {
  let th = opts.at("thresholds", default: (excellent: 90, good: 75, moderate: 50))
  if s >= th.excellent { tb.excellent } else if s >= th.good { tb.good } else if s >= th.moderate { tb.moderate } else { tb.poor }
}

#let gauge(theme, s, label, title) = {
  let c = theme.colors
  let col = if s >= 75 { c.accent } else if s >= 50 { c.severity.medium } else { c.severity.high }
  block(width: 100%, stroke: 0.5pt + c.rule, radius: 3pt, inset: 12pt, breakable: false, {
    text(size: 9.5pt, weight: "bold", fill: c.headingColor, title)
    v(0.6em)
    align(center, {
      box(width: 30mm, height: 30mm, {
        place(center + horizon, circle(radius: 13mm, stroke: 2.6mm + c.surface))
        // arc from 12 o'clock clockwise, s% of the circle, as a polyline
        if s > 0 {
          let r = 13mm
          let steps = calc.max(2, calc.ceil(s * 0.72))
          let pts = range(0, steps + 1).map(i => {
            let a = -90deg + 360deg * s / 100 * i / steps
            (15mm + r * calc.cos(a), 15mm + r * calc.sin(a))
          })
          place(top + left, curve(stroke: (paint: col, thickness: 2.6mm, cap: "butt"), curve.move(pts.at(0)), ..pts.slice(1).map(p => curve.line(p))))
        }
        place(center + horizon, text(size: 20pt, weight: "bold", fill: c.headingColor, font: theme.fonts.heading, str(s)))
      })
      v(0.2em)
      text(size: 8.5pt, fill: c.muted, label)
    })
  })
}

#let bar-chart(ctx, theme, t, tb) = {
  let c = theme.colors
  let has-retest = ctx.findings.any(f => f.at("retest", default: none) != none)
  let mx = calc.max(1, ..ctx.severities.map(s => s.count))
  let h = 22mm
  block(width: 100%, stroke: 0.5pt + c.rule, radius: 3pt, inset: 12pt, breakable: false, {
    text(size: 9.5pt, weight: "bold", fill: c.headingColor, tb.per_severity)
    v(0.8em)
    grid(
      columns: (1fr,) * 5, column-gutter: 4pt, align: center + bottom,
      ..ctx.severities.map(s => {
        let bh = calc.max(1.2mm, h * s.count / mx)
        let oh = calc.max(1.2mm, h * s.open / mx)
        stack(dir: ttb, spacing: 3pt,
          if has-retest {
            stack(dir: ltr, spacing: 2pt, box(width: 4.5mm, height: bh, fill: rf.sev-color(theme, s.id).transparentize(45%)), box(width: 4.5mm, height: oh, fill: rf.sev-color(theme, s.id)))
          } else { box(width: 6mm, height: bh, fill: rf.sev-color(theme, s.id)) },
          text(size: 7pt, fill: c.muted, s.label.slice(0, calc.min(5, s.label.len())) + if s.label.len() > 5 { "." } else { "" }),
        )
      }),
    )
    v(0.6em)
    text(size: 7.5pt, fill: c.muted)[#box(width: 6pt, height: 6pt, fill: c.primary, baseline: 1pt) #tb.at_delivery #if has-retest [#h(0.8em) #box(width: 6pt, height: 6pt, fill: c.primary.transparentize(45%), baseline: 1pt) #tb.after_retest]]
  })
}

#let render(ctx, theme, t, opts) = {
  let c = theme.colors
  let eng = ctx.engagement
  let tb = t.blocks.executive-dashboard
  let st = ctx.stats
  rf.chapter(tb.title)
  let open = ctx.findings.filter(f => f.at("retest", default: none) == none or f.retest.status not in ("resolved", "risk-accepted")).len()
  let s = score-of(ctx, opts)
  let short = theme.provider.at("short", default: theme.provider.name)
  grid(
    columns: (1fr, 68mm), column-gutter: 9mm,
    {
      if eng.at("executive_summary", default: none) != none { eng.executive_summary } else {
        let vars = (("{provider}", theme.provider.name), ("{client}", eng.client.name), ("{start}", ctx.fmt.period_start), ("{end}", ctx.fmt.period_end), ("{scope_count}", str(eng.scope.len())), ("{total}", str(st.total)), ("{critical}", str(st.bySeverity.critical)), ("{high}", str(st.bySeverity.high)), ("{medium}", str(st.bySeverity.medium)), ("{low}", str(st.bySeverity.low)), ("{info}", str(st.bySeverity.info)))
        let txt = tb.auto_intro
        for (k, v) in vars { txt = txt.replace(k, v) }
        txt
        v(0.6em)
        text(size: 8.5pt, fill: c.muted, style: "italic", tb.auto_note)
      }
    },
    {
      grid(columns: (1fr, 1fr), column-gutter: 6mm, row-gutter: 4mm,
        rf.stat(theme, str(st.total), tb.findings_at_delivery),
        rf.stat(theme, str(st.bySeverity.critical), t.severity.critical, color: if st.bySeverity.critical > 0 { c.severity.critical } else { none }),
        rf.stat(theme, str(st.bySeverity.high), t.severity.high, color: if st.bySeverity.high > 0 { c.severity.high } else { none }),
        rf.stat(theme, str(open), tb.open_findings),
      )
      v(4mm)
      if opts.at("score", default: true) { gauge(theme, s, score-label(tb, opts, s), tb.score_title.replace("{provider}", short)); v(4mm) }
      bar-chart(ctx, theme, t, tb)
    },
  )
}
