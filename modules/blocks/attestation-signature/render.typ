#import "/modules/lib/rf.typ"

#let render(ctx, theme, t, opts) = {
  let eng = ctx.engagement
  let tb = t.blocks.attestation-signature
  let at = eng.at("attestation", default: (:))
  let sig = at.at("signatory", default: (name: eng.authors.at(0, default: (name: "")).name))
  v(2em)
  block(breakable: false, {
    tb.signed.replace("{place}", at.at("place", default: "")).replace("{date}", ctx.fmt.date)
    linebreak()
    tb.on_behalf.replace("{provider}", theme.provider.name)
    v(1.4em)
    if theme.assets.at("signature", default: none) != none { image(theme.assets.signature, height: 18mm) } else { v(14mm) }
    line(length: 70mm, stroke: 0.5pt + theme.colors.ink)
    text(weight: "semibold", sig.at("name", default: ""))
    if sig.at("role", default: none) != none { linebreak(); text(size: 9pt, fill: theme.colors.muted, sig.role) }
  })
}
