# Reportforge

Modular, whitelabel pentest reporting. Markdown findings in, world-class PDF and DOCX out.

- **Blocks**: a report is an ordered list of blocks (`modules/blocks/*`). Each block ships its own Typst and Word renderer, i18n (nl/en) and a schema. Add a folder, and the block exists.
- **Themes**: a client's house style is data (`modules/themes/<client>/theme.yaml`): one colour and a logo is enough; fonts, cover image and texts are optional.
- **Standards**: OWASP Top 10, WSTG, ASVS, API Top 10, MASVS, PTES, NIST SP 800-115 and CWE as YAML catalogues; findings map to them, reports list them.
- **Risk models**: CVSS 3.1, CVSS 4.0 (verified against the FIRST reference implementation) and an impact × likelihood matrix.
- **Layout that cannot break**: images are scaled to the text column and capped in height, code wraps (even 300-character tokens), tables break across pages with repeated headers, and the render tests raster every page and fail on any ink in the margins.

Two ways to work: the **web app** (opdrachtgevers with themes, engagements, a finding editor with live preview, library, one-click PDF/DOCX) and the **CLI** (an engagement folder in, files out). Both read the same engagement-folder format, so nothing is locked inside the app. The app follows the nine-step process: intake → test plan → testing → report → TPM → delivery → retest → updated report/TPM → delivery.

## Quick start

Web app (on the NUC, in Docker — no local Typst needed):

```bash
git clone https://github.com/<you>/reportforge.git && cd reportforge
docker compose -f deploy/docker-compose.yml up -d --build
# → http://<host>:3000 — choose a password on first visit
```

Locally (Node 22+, Typst 0.15+ on PATH or `TYPST_BIN=`):

```bash
npm install
npm run web:build && npm start                # web app on http://localhost:3000, data in ./data
npm run render -- examples/acme-webshop       # CLI: → examples/acme-webshop/out/PT-2026-042-v1.0.{pdf,docx}
npm run check  -- examples/acme-webshop       # parse + preflight only
```

## The web app

- **Opdrachtgevers**: the organisations you report for; each points at a theme. The theme editor covers the quick case (logo + colour) and the full one (fonts, cover image, texts, raw `theme.yaml`), with a one-click proof report in nl or en.
- **Opdrachten**: metadata form (scope, team, standards, tooling, texts, version history), the nine-step status bar, export of the engagement folder as `.tar`.
- **Bevindingen**: three-pane workbench — list sorted by severity, markdown editor (paste or drop screenshots: they are uploaded, resized to ≤ 2400 px and inserted as markdown), and a side panel with live preview styled like the report, PDF preview of just this finding, live format checks with CVSS scoring, images and version history. `Ctrl+S` saves; every save is a version.
- **Plakken**: paste a markdown export with several findings; each `## ` becomes a finding.
- **Bibliotheek**: save any finding as a reusable, genericised template (affected list and screenshots stripped); pick from it when starting a new finding. Usage is counted. It starts filled: `modules/library/nl/` ships 57 findings written the way a senior tester writes them (OWASP Top 10 / API Top 10 / WSTG / ASVS / MASVS / ATT&CK mappings, CWE, CVSS 3.1 vector, business impact incl. AVG, defence-in-depth recommendations, references) with an evidence placeholder to fill per engagement. They are loaded into the database on first start; "Standaardbibliotheek laden" re-imports new ones after a `git pull` (existing titles are skipped). Add your own by dropping a file in that folder (`**Tags**: …` on the meta line becomes the tags); `npx tsx scripts/library-scores.ts` fills the CVSS scores from the vectors and validates every file.
- **Intake** and **Testplan**: forms that become the intake document (with signature block for the rules of engagement) and the test plan. The checklist generator picks standards from the scope types (web → WSTG, api → API Top 10, mobile → MASVS, plus ASVS when selected) and tracks the status per item; items with a mapped finding become "Finding" automatically. The checklist is the "Dekking" appendix in the report and in the test plan.
- **Importeren**: Nuclei (JSON/JSONL), Burp Suite (XML) and Nessus (.nessus) exports become findings in the markdown contract — same issue across hosts merged into one finding, CVSS/CWE/CVE carried over, requests decoded, HTML descriptions converted — with a preview to pick what to add. Imported findings carry a verification line that preflight flags until you remove it. CLI: `npm run rf -- import nessus scan.nessus -o findings/`.
- **Documenten**: render the intake document, test plan, report, TPM (four variants: short, standard, extended with findings on title level, compliance with coverage per standard) and the retest report, in any language and theme. **Opleveren** freezes a render under `data/renders/_deliveries/` with SHA-256 hashes and a DELIVERY.txt, and advances the step. **Hertest starten** bumps the version, extends the version history and marks every finding "Not retested"; the retest status per finding is set from the workbench and feeds the retest report, report v2 and TPM v2.

Storage: `data/reportforge.sqlite` (SQLite via Node's built-in driver — no database server), `data/files/` (screenshots), `data/renders/`, `data/engagements/` (materialised folders). Back up `data/` and `modules/themes/`.

## An engagement folder

```
my-engagement/
├─ engagement.yaml      metadata, scope, standards, texts (inline markdown or "file.md")
├─ summary.md           executive summary (referenced from engagement.yaml)
├─ findings/*.md        one or more findings per file, in the format below
├─ images/              screenshots referenced from the findings
└─ theme/theme.yaml     optional: engagement-specific theme override
```

See `examples/acme-webshop/engagement.yaml` for every field, including `intake`, `testplan` (with checklists) and `attestation`. Templates: `pentest-report`, `pentest-report-extended`, `retest-report`, `intake`, `testplan`, `attestation-short|standard|extended|compliance` (`npm run render -- <dir> -t testplan`).

### The extended report template

`pentest-report-extended` is the structure of a full-service report: documentbeheer with distribution list and provider contact, a dashboard summary (narrative left; count tiles, a *provider score* and a bar chart right), a priorities page (top-3 cards with *what / what to do* and a likelihood × impact matrix with the finding IDs in the cells), scope with conditions and test accounts, methodology with a phase timeline, risk classification with remediation terms, a findings table, findings in the extended layout (title row with badge and status pill, hairlined meta grid, summary, classification rationale, evidence, impact and likelihood side by side, recommendation callout, remarks, retest status), "what is in good order", conclusion with a roadmap, a retest table and lettered appendices (tooling, CWE/OWASP mapping, a glossary that only lists terms occurring in the report, disclaimer). Pair it with the `navy` theme (dark cover, teal eyebrow headings, classification pill in the header, decorative arcs, shaped severity badges) or any other theme — every piece is an option on an existing block, so it also works with the classic look.

It uses a few extra fields: `positives` and `roadmap` (markdown; roadmap groups are `###` headings), `accounts` (test accounts), `access` per scope item, `glossary` (optional; otherwise the built-in list is filtered), `finding_prefix` (`CS` → CS-01, …), and in findings the optional sections `### Samenvatting`, `### Kans`, `### Toelichting op de classificatie` and `### Kanttekeningen` (English: Summary, Likelihood, Classification, Notes). For CVSS findings the matrix position is derived from the base metrics; the *provider score* is 100 − Σ weights of open findings (critical 25, high 10, medium 4, low 1 — options on the `executive-dashboard` block).

## The finding format

```markdown
## Title

**Severity**: Medium · **CVSS 3.1**: 5.3 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N`) · **Status**: Confirmed · **Source**: nmap

**Affected**:

- host, IP or domain per line

### Description
### Impact
### Evidence
### Recommendation
### References
```

Optional metadata on the same line: `**CVSS 4.0**: 7.1 (\`CVSS:4.0/...\`)`, `**Risk**: impact=3, likelihood=4`, `**Mapping**: A01:2021, WSTG-ATHZ-04`, `**CWE**: 639`, `**Retest**: Resolved (note)` (statuses: Resolved, Partially resolved, Open, Not tested, Risk accepted), `**ID**: F-07`.
Section headings may also be Dutch (Beschrijving, Impact, Bewijs, Aanbeveling, Referenties). Unknown `###` sections are kept as extra sections. Every `## ` heading starts a new finding.

The explicit **Severity** always wins over the computed one (senior judgement), but a mismatch is reported so it is a conscious decision. Findings are numbered F-01… in order of severity and score.

## Themes

`modules/themes/_default/theme.yaml` is the base; a client theme only lists what differs:

```yaml
id: acme
name: Acme Security
provider: { name: Acme Security B.V., address: [Straat 1, 1234 AB Stad], website: https://acme.example, email: info@acme.example }
colors: { primary: "#7A1E2C", accent: "#C9A227" }
fonts: { body: "Source Sans 3", heading: "Source Serif 4", mono: "JetBrains Mono" }   # .ttf/.otf in modules/themes/acme/fonts/
page: { cover: image, header: { logo: right, logo_height: 5.5mm, text: both, classification: pill }, footer: { style: website }, decoration: arcs }   # cover band|image|minimal|dark; header logo right|left|none, 3–9 mm, text both|title|client|none, classification pill; footer default|website; decoration none|arcs
options: { heading_style: eyebrow, heading_tracking: -0.02em, severity_shapes: true }   # eyebrow = small "1 · Title" above the big chapter title; shapes = ◆▲■●▬ in severity badges
assets: { logo: logo.svg, logo_mono: logo-mono.svg, logo_header: logo-header.svg, cover_image: cover.jpg }   # logo_header is optional: header uses logo_header → logo_mono → logo
texts: { disclaimer: { nl: "...", en: "..." } }
```

Derived colours (tints, heading colour, severity text colour) are computed with WCAG contrast checks; a too-light brand colour is darkened for text automatically. Word uses `fonts.docx_body` / `docx_heading` / `docx_mono` (default Calibri/Consolas) because fonts are not embedded in DOCX.

## Adding a block

```
modules/blocks/my-block/
├─ manifest.yaml       id, name, category, documents: [report, retest, …], options, each: findings (optional)
├─ schema.json         JSON Schema of the content/options the block uses
├─ render.typ          #let render(ctx, theme, t, opts) = { … }     (PDF)
├─ render.docx.ts      export async function render(ctx, theme, t, opts, h) → Block[]   (Word)
└─ i18n/nl.yaml, en.yaml
```

Then list it in a template (`modules/templates/<id>/template.yaml`) and run `npm run blocks:check`. `ctx` is the full report context (engagement, findings, stats, standards), `theme` the resolved theme, `t` the merged dictionary (`t.core.*`, `t.blocks.<id>.*`, `t.severity.*`). Shared Typst helpers (badges, images, code, tables, callouts) live in `modules/lib/rf.typ`; Word helpers in `packages/render-docx/src/helpers.ts`.

Standards are one YAML file each in `modules/standards/` (OWASP Top 10, WSTG, ASVS, API Top 10, MASVS, PTES, NIST SP 800-115, CWE, MITRE ATT&CK); risk models live in `packages/risk`.

## Adding an importer

```
modules/importers/my-tool/
├─ manifest.yaml       id, name, tool, formats, description
└─ import.ts           export function importFindings(input: Buffer, opts): ImportResult
```

Build `FindingDraft` objects and call `toMarkdown()` from `@reportforge/importers` (helpers: `parseXml`, `htmlToMarkdown`, `clip`, `fence`). Because the output is the markdown contract, imported findings get the same parsing, scoring and rendering as hand-written ones. See `modules/importers/nessus/import.ts` for a 40-line example and `tests/unit/importers.test.ts` for the fixtures.

## Tests

```bash
npm test               # unit: parser, CVSS 3.1/4.0 (400 reference vectors), matrix
npm run test:render    # renders every tests/fixtures/* engagement to PDF+DOCX, rasters all pages,
                       # fails on ink in the margins or on a changed page (snapshot); --update to accept
npm run test:e2e       # starts the web server on a scratch dir and drives the whole API
```

`tests/fixtures/stress` is the torture test: 30 findings, a 196-character title, 50 affected hosts, 8000×200 and 400×6000 images, a 400-line code block with 220-character lines, 300-character tokens and the matrix model.

## Proxmox

On the PVE host, as root:

```bash
bash deploy/proxmox/create-vm.sh --id 9100 --name reportforge \
     --sshkey ~/.ssh/id_ed25519.pub --repo https://github.com/<you>/reportforge.git
```

DHCP by default; add `--ip 192.168.1.60/24 --gw 192.168.1.1` for a static address. This downloads the Ubuntu 24.04 cloud image, creates the VM with cloud-init (Docker, git, unattended security updates), clones the repo to `/opt/reportforge` and starts the web app on port 3000. Updating: `cd /opt/reportforge && git pull && docker compose -f deploy/docker-compose.yml up -d --build`. Backups: `deploy/backup.sh /mnt/nas/reportforge` from cron.

## Releases and versioning

Versions follow semver and live in one place: `package.json` (mirrored into `packages/core/src/version.ts` by the release script). The version shows in the app's sidebar, `npm run rf -- --version`, the PDF/DOCX metadata and `CHANGELOG.md`.

```bash
# 1. describe the change under "## [Unreleased]" in CHANGELOG.md, commit your work
# 2. cut the release (bumps the version, dates the changelog entry, commits, tags vX.Y.Z)
npm run release -- 0.5.0 "Short description"
git push && git push --tags
# 3. on the NUC
cd /opt/reportforge && git pull && docker compose -f deploy/docker-compose.yml up -d --build
npm run version:check     # package.json, version.ts and CHANGELOG agree
```

To run a specific version on the NUC: `git checkout v0.4.0` (and `git checkout main` to follow the latest again). GitHub shows every tag under *Releases/Tags*, with the diff between two versions one click away.

## Licence

MIT. Bundled fonts: Inter (SIL OFL), JetBrains Mono (SIL OFL). CVSS 4.0 lookup tables: FIRST.ORG / Red Hat, BSD-2-Clause (`packages/risk/src/vendor`).
