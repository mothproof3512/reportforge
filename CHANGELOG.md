# Changelog

Alle wezenlijke wijzigingen per release. Versies volgen [semver](https://semver.org/): *minor* voor nieuwe functionaliteit, *patch* voor fixes; vóór 1.0 kan een minor ook wijzigingen in de engagement-/thema-formaten bevatten (die staan dan expliciet vermeld).

## [Unreleased]

## [0.7.0] — 2026-10-20

- Achtergrondversiering per thema: lagen van SVG/PNG met positie, verschuiving, breedte, rotatie, transparantie, vervaging, kleur en paginakeuze; acht meegeleverde vormen; lageneditor in de thema-editor.

## [0.6.0] — 2026-10-20

- Zes varianten per opmaakelement (voorblad, hoofdstukkoppen, tabellen, grafieken, kaders, severity-badges, bevindingslayout), kiesbaar per thema in het paneel Opmaak; stijlgalerij-PDF (thema-editor en `rf gallery`); DOCX volgt waar Word het toelaat.

## [0.5.0] — 2026-10-20

- Kleurcombinaties van Sanzo Wada (348, top 30 voor rapportage) in de thema-editor; palettemodule `modules/palettes/`, `GET /api/palettes`.

## [0.4.0] — 2026-10-20

- Sjabloon `pentest-report-extended` naar het aangeleverde PDF-template: dashboard-samenvatting met score, prioriteiten en kans×impact-matrix, scope met randvoorwaarden en testaccounts, methodiek met tijdlijn, risicoclassificatie met hersteltermijnen, bevindingentabel, uitgebreide bevindingslayout, "Wat goed gaat", roadmap, hertesttabel, bijlagen A–D met begrippenlijst.
- Thema `navy`: donker voorblad, eyebrow-koppen, classificatiepill, website-voettekst, decoratieve bogen, severity-badges met vorm. Nieuwe thema-opties: `page.cover: dark`, `page.header.classification`, `page.footer.style`, `page.decoration`, `options.heading_style`, `options.severity_shapes`, `colors.calloutBg`.
- Engagement: `positives`, `roadmap`, `accounts`, `scope[].access`, `glossary`, `finding_prefix`. Bevindingssecties `Samenvatting`, `Kans`, `Toelichting op de classificatie`, `Kanttekeningen` (nl/en). Kans × impact afgeleid uit CVSS-metrieken.
- Versiebeheer: `npm run release`, CHANGELOG, versie zichtbaar in app, CLI en documentmetadata.

## [0.3.0] — 2026-10-19

- Instelbare lopende koptekst per thema: apart koptekstlogo, positie links/rechts/geen, hoogte 3–9 mm, tekstvariant (PDF en DOCX).

## [0.2.0] — 2026-10-19

- Standaardbibliotheek: 57 Nederlandse bevindingen (OWASP Top 10, API Top 10, infra/AD, mobile, cloud) met mapping, CWE, CVSS-vector en bewijsplaceholder; automatisch geladen bij eerste start, knop "Standaardbibliotheek laden", `scripts/library-scores.ts`.
- Proxmox-script: DHCP standaard, storage-onafhankelijke schijfkoppeling.

## [0.1.0] — 2026-10-18

- Eerste versie: kern, markdown-contract, CVSS 3.1/4.0 en matrix, Typst- en DOCX-renderers met blokken en thema's, standaarden, webapp met SQLite, bibliotheek, thema-editor, intake/testplan/TPM/hertest-proces, importers (Nuclei, Burp, Nessus), Docker en Proxmox-deploy, render-/unit-/e2e-tests.
