# Reportforge

Modular, whitelabel pentest reporting. Markdown findings in, world-class PDF and DOCX out.

- **Blocks**: a report is an ordered list of blocks (`modules/blocks/*`). Each block ships its own Typst and Word renderer, i18n (nl/en) and a schema. Add a folder, and the block exists.
- **Themes**: a client's house style is data (`modules/themes/<client>/theme.yaml`): one colour and a logo is enough; fonts, cover image and texts are optional.
- **Standards**: OWASP Top 10, WSTG, ASVS, API Top 10, MASVS, PTES, NIST SP 800-115 and CWE as YAML catalogues; findings map to them, reports list them.
- **Risk models**: CVSS 3.1, CVSS 4.0 (verified against the FIRST reference implementation) and an impact × likelihood matrix.
- **Layout that cannot break**: images are scaled to the text column and capped in height, code wraps (even 300-character tokens), tables break across pages with repeated headers, and the render tests raster every page and fail on any ink in the margins.

Phase 1 (this repo state) is the CLI renderer. Phase 2 adds the web app, finding library and the process flow (intake → testplan → report → TPM → retest).

## Quick start

```bash
git clone https://github.com/<you>/reportforge.git && cd reportforge
npm install                                  # Node 22+
# Typst 0.15+ on PATH, or TYPST_BIN=/path/to/typst
npm run render -- examples/acme-webshop      # → examples/acme-webshop/out/PT-2026-042-v1.0.{pdf,docx}
npm run check  -- examples/acme-webshop      # parse + preflight only
```

Or in Docker (no local Typst needed):

```bash
docker compose -f deploy/docker-compose.yml build
docker compose -f deploy/docker-compose.yml run --rm rf render /data/acme-webshop
```

## An engagement folder

```
my-engagement/
├─ engagement.yaml      metadata, scope, standards, texts (inline markdown or "file.md")
├─ summary.md           executive summary (referenced from engagement.yaml)
├─ findings/*.md        one or more findings per file, in the format below
├─ images/              screenshots referenced from the findings
└─ theme/theme.yaml     optional: engagement-specific theme override
```

See `examples/acme-webshop/engagement.yaml` for every field.

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

Optional metadata on the same line: `**CVSS 4.0**: 7.1 (\`CVSS:4.0/...\`)`, `**Risk**: impact=3, likelihood=4`, `**Mapping**: A01:2021, WSTG-ATHZ-04`, `**CWE**: 639`, `**Retest**: Resolved (note)`, `**ID**: F-07`.
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
page: { cover: image }
assets: { logo: logo.svg, logo_mono: logo-mono.svg, cover_image: cover.jpg }
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

Standards are one YAML file each in `modules/standards/`; risk models live in `packages/risk`.

## Tests

```bash
npm test               # unit: parser, CVSS 3.1/4.0 (400 reference vectors), matrix
npm run test:render    # renders every tests/fixtures/* engagement to PDF+DOCX, rasters all pages,
                       # fails on ink in the margins or on a changed page (snapshot); --update to accept
```

`tests/fixtures/stress` is the torture test: 30 findings, a 196-character title, 50 affected hosts, 8000×200 and 400×6000 images, a 400-line code block with 220-character lines, 300-character tokens and the matrix model.

## Proxmox

On the PVE host, as root:

```bash
bash deploy/proxmox/create-vm.sh --id 9100 --name reportforge --ip 192.168.1.60/24 --gw 192.168.1.1 \
     --sshkey ~/.ssh/id_ed25519.pub --repo https://github.com/<you>/reportforge.git
```

This downloads the Ubuntu 24.04 cloud image, creates the VM with cloud-init (Docker, git, unattended security updates), clones the repo to `/opt/reportforge` and builds the image. Updating: `cd /opt/reportforge && git pull && docker compose -f deploy/docker-compose.yml build`. Backups: `deploy/backup.sh /mnt/nas/reportforge` from cron.

## Licence

MIT. Bundled fonts: Inter (SIL OFL), JetBrains Mono (SIL OFL). CVSS 4.0 lookup tables: FIRST.ORG / Red Hat, BSD-2-Clause (`packages/risk/src/vendor`).
