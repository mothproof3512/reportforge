import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFindings, parseMarkdown, markdownToTypst, escapeMarkup } from '@reportforge/markdown';

const sample = `## Titel van de bevinding

**Severity**: Medium · **CVSS 3.1**: 5.3 (\`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N\`) · **Status**: Confirmed · **Source**: nmap · **Mapping**: A05:2021, WSTG-CONF-01 · **CWE**: 16

**Affected**:

- 10.0.0.1
- example.com

### Description

Wat er mis is.

### Impact

Wat een aanvaller kan.

### Evidence

\`\`\`
$ nmap -p 22 10.0.0.1
\`\`\`

### Recommendation

Fix.

### References

- https://example.com
`;

test('parses the canonical finding format', () => {
  const r = parseFindings(sample, 'x.md');
  assert.equal(r.findings.length, 1);
  const f = r.findings[0];
  assert.equal(f.title, 'Titel van de bevinding');
  assert.equal(f.severity, 'medium');
  assert.equal(f.cvss31?.vector, 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N');
  assert.equal(f.cvss31?.score, 5.3);
  assert.equal(f.status, 'Confirmed');
  assert.equal(f.source, 'nmap');
  assert.deepEqual(f.mapping, ['A05:2021', 'WSTG-CONF-01']);
  assert.deepEqual(f.cwe, ['CWE-16']);
  assert.deepEqual(f.affected, ['10.0.0.1', 'example.com']);
  assert.equal(f.sections.description, 'Wat er mis is.');
  assert.ok(f.sections.evidence.includes('nmap'));
  assert.equal(r.diagnostics.filter((d) => d.level === 'error').length, 0);
});

test('multiple findings per file, Dutch section names, matrix risk, retest', () => {
  const md = `## Een\n\n**Severity**: Laag · **Risk**: impact=2, likelihood=3 · **Status**: Confirmed · **Retest**: Resolved (fixed in 1.2)\n\n**Affected**:\n\n- a\n\n### Beschrijving\n\nx\n\n### Impact\n\ny\n\n### Bewijs\n\nz\n\n### Aanbeveling\n\nw\n\n## Twee\n\n**Severity**: High\n\n### Description\n\nx\n\n### Impact\n\ny\n\n### Recommendation\n\nw\n`;
  const r = parseFindings(md);
  assert.equal(r.findings.length, 2);
  assert.equal(r.findings[0].severity, 'low');
  assert.deepEqual(r.findings[0].risk, { impact: 2, likelihood: 3 });
  assert.deepEqual(r.findings[0].retest, { status: 'resolved', note: 'fixed in 1.2' });
  assert.equal(r.findings[0].sections.recommendation, 'w');
  assert.equal(r.findings[1].severity, 'high');
  assert.ok(r.diagnostics.some((d) => d.message.includes('Affected')), 'warns about missing affected list');
});

test('reports errors for missing sections and severity', () => {
  const r = parseFindings('## Kaal\n\n**Status**: Confirmed\n\n### Description\n\nx\n');
  const msgs = r.diagnostics.map((d) => d.level + ':' + d.message);
  assert.ok(msgs.some((m) => m.startsWith('error:') && m.includes('severity')));
  assert.ok(msgs.some((m) => m.startsWith('error:') && m.includes('impact')));
});

test('pipe tables are parsed', () => {
  const root = parseMarkdown('| a | b |\n| --- | ---: |\n| 1 | 2 |\n');
  assert.equal(root.children[0].type, 'table');
});

test('typst escaping neutralises markup', () => {
  const out = escapeMarkup('# $ * _ @ [ ] < > ~ \\ --\n1. x');
  assert.ok(!out.includes('\n#'));
  for (const ch of ['\\#', '\\$', '\\*', '\\_', '\\@', '\\[', '\\]', '\\<', '\\>', '\\~', '\\\\', '-\\-', '1\\.']) assert.ok(out.includes(ch), ch);
});

test('markdown → typst uses function forms for code and links', () => {
  const t = markdownToTypst('Zie [docs](https://x.y/z?a=1) en `code`.\n\n```http\nGET / HTTP/1.1\n```\n');
  assert.ok(t.includes('#link("https://x.y/z?a=1")[docs]'));
  assert.ok(t.includes('#raw("code")'));
  assert.ok(t.includes('#rf.code(theme, "GET / HTTP/1.1", lang: "http")'));
});
