// Generates the stress fixture: everything that used to break report layouts.
// Run: node tests/fixtures/stress/generate.mjs   (from repo root; needs sharp)
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(dir, 'images'), { recursive: true });
mkdirSync(join(dir, 'findings'), { recursive: true });

const svg = (w, h, label) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#222"/><rect x="2" y="2" width="${w-4}" height="${h-4}" fill="none" stroke="#f55" stroke-width="4"/><text x="20" y="${Math.min(h-10, 60)}" font-family="Arial" font-size="40" fill="#fff">${label} ${w}x${h}</text></svg>`;
await sharp(Buffer.from(svg(8000, 200, 'WIDE'))).png().toFile(join(dir, 'images/wide.png'));
await sharp(Buffer.from(svg(400, 6000, 'TALL'))).png().toFile(join(dir, 'images/tall.png'));
await sharp(Buffer.from(svg(120, 80, 'TINY'))).png().toFile(join(dir, 'images/tiny.png'));
await sharp(Buffer.from(svg(1600, 1600, 'SQUARE'))).jpeg().toFile(join(dir, 'images/square.jpg'));

const longToken = 'A'.repeat(300);
const longUrl = 'https://example.com/' + 'segment/'.repeat(40) + '?token=' + 'x'.repeat(200);
const bigCode = Array.from({ length: 400 }, (_, i) => `${String(i + 1).padStart(4, '0')}  ${i % 7 === 0 ? 'x'.repeat(220) : 'GET /api/v1/items/' + i + ' HTTP/1.1 200 OK 1234 bytes'}`).join('\n');
const sev = ['Critical', 'High', 'Medium', 'Low', 'Info'];
let md = `## This is an extremely long finding title that goes on and on to test how the heading, the table of contents and the overview table cope with wrapping across multiple lines without breaking anything

**Severity**: Critical · **Risk**: impact=5, likelihood=5 · **Status**: Confirmed · **Source**: manual · **Mapping**: A01:2021, WSTG-ATHZ-02, WSTG-ATHZ-03, WSTG-ATHZ-04, WSTG-SESS-01, WSTG-SESS-02, API1:2023, API2:2023, API5:2023 · **CWE**: 639, 284, 285, 862, 863

**Affected**:

${Array.from({ length: 50 }, (_, i) => `- host-${String(i + 1).padStart(2, '0')}.internal.example.com (10.0.${Math.floor(i / 10)}.${i % 10 + 10})`).join('\n')}

### Description

Paragraph with *emphasis*, **strong**, \`inline code\`, a [link](${longUrl}) and an unbroken token ${longToken} that must wrap somewhere sensible. Special characters that mean something in Typst: # $ * _ @ [ ] < > ~ \\ and dashes -- --- and "quotes" and 'single' and 1. not a list and - not a bullet.

#### A fourth-level heading inside the body

> A blockquote with **bold** text that spans more than one line so the border is visible for the whole paragraph.

1. First ordered item
2. Second ordered item
   - nested bullet one
   - nested bullet two with \`code\`
3. Third item with a very long text that wraps across several lines so the hanging indent of the list can be checked properly in both renderers.

| Column A | Column B | A column with a long header |
| --- | ---: | :---: |
| cell | 1.0 | centered |
| \`code cell\` | 22.5 | ${longToken.slice(0, 80)} |

### Impact

${'Long impact paragraph. '.repeat(120)}

### Evidence

![An 8000 pixel wide image](../images/wide.png)

![A 6000 pixel tall image](../images/tall.png)

![A tiny image](../images/tiny.png)

![A square JPEG](../images/square.jpg)

\`\`\`
${bigCode}
\`\`\`

\`\`\`text
${longUrl}
${'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.'.repeat(12)}
\`\`\`

### Recommendation

- fix it

### References

- ${longUrl}

### Notes

An unknown extra section that must be rendered after the standard sections.
`;
for (let i = 2; i <= 30; i++) {
  const s = sev[i % 5];
  md += `
## Generated finding ${i}

**Risk**: impact=${(i % 5) + 1}, likelihood=${((i * 3) % 5) + 1} · **Status**: ${i % 4 === 0 ? 'Likely' : 'Confirmed'} · **Source**: generator · **Mapping**: ${['A01:2021', 'WSTG-INPV-05', 'API4:2023', 'V4', 'MASVS-AUTH'][i % 5]} · **CWE**: ${[79, 89, 22, 287, 200][i % 5]}

**Affected**:

- https://host-${i}.example.com/

### Description

Finding ${i}. ${'Body text. '.repeat(20 + (i * 7) % 60)}

### Impact

${'Impact text. '.repeat(10 + (i * 3) % 30)}

### Evidence

\`\`\`
$ curl -s https://host-${i}.example.com/ | head -${i}
line ${i}
\`\`\`

### Recommendation

Fix finding ${i}.
`;
}
writeFileSync(join(dir, 'findings/all.md'), md);
writeFileSync(join(dir, 'engagement.yaml'), `reference: STRESS-001
title: "Stress test engagement with an unreasonably long title that should still look acceptable on the cover and in the running header of every page"
subtitle: "Thirty generated findings, extreme images, giant code blocks, the risk matrix model and the English language"
language: en
theme: _default
template: pentest-report
risk_model: matrix
version: "2.3"
date: 2026-10-19
classification: Strictly confidential
client:
  name: "Very Long Client Name Holdings International Limited Liability Partnership & Associates"
  contact: []
period: { start: 2026-10-01, end: 2026-10-15 }
authors: [{ name: Tester One }, { name: Tester Two, role: Reviewer }]
scope:
${Array.from({ length: 12 }, (_, i) => `  - { asset: "https://host-${i + 1}.example.com/a/very/long/path/that/keeps/going/${'x'.repeat(30)}", type: web, environment: production, description: "Scope item ${i + 1} with a long description that wraps onto two lines in the scope table" }`).join('\n')}
out_of_scope: [DoS, Social engineering]
standards: [owasp-top10-2021, wstg-4.2, owasp-api-top10-2023, asvs-4.0.3, masvs-2, cwe]
tools: [{ name: Tool, version: "1", purpose: Testing }]
document_history:
${Array.from({ length: 8 }, (_, i) => `  - { version: "0.${i + 1}", date: 2026-10-${String(i + 1).padStart(2, '0')}, author: Tester One, change: "Change ${i + 1} with a long description of what changed in this version of the document" }`).join('\n')}
`);
console.log('stress fixture generated');
