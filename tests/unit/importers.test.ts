import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadImporters, htmlToMarkdown, parseXml } from '@reportforge/importers';
import { parseFindings } from '@reportforge/markdown';

const ROOT = resolve(import.meta.dirname, '../..');
const fx = (f: string) => readFileSync(resolve(ROOT, 'tests/fixtures/imports', f));

test('importers are discovered as modules', async () => {
  const imps = await loadImporters(ROOT);
  assert.deepEqual(Object.keys(imps).sort(), ['burp', 'nessus', 'nuclei']);
});

test('nuclei: groups by template, keeps cvss/cwe/refs, output parses as findings', async () => {
  const { nuclei } = await loadImporters(ROOT);
  const r = await nuclei.importFindings(fx('nuclei.jsonl'), {});
  assert.equal(r.findings.length, 3);
  const apache = r.findings[0];
  assert.equal(apache.severity, 'high');
  assert.equal(apache.affected.length, 2);
  assert.equal(apache.merged, 2);
  const parsed = parseFindings(apache.markdown);
  assert.equal(parsed.diagnostics.filter((d) => d.level === 'error').length, 0);
  assert.equal(parsed.findings[0].cvss31?.vector, 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N');
  assert.deepEqual(parsed.findings[0].cwe, ['CWE-22']);
  assert.ok(parsed.findings[0].sections.references.includes('CVE-2021-41773'));
  assert.ok(apache.markdown.includes('root:x:0:0'));
});

test('burp: merges same type, confidence → status, html → markdown, base64 request decoded', async () => {
  const { burp } = await loadImporters(ROOT);
  const r = await burp.importFindings(fx('burp.xml'), {});
  assert.equal(r.findings.length, 3);
  const sqli = r.findings[0];
  assert.equal(sqli.title, 'SQL injection');
  assert.equal(sqli.severity, 'high');
  assert.equal(sqli.merged, 2);
  assert.deepEqual(sqli.affected, ['https://shop.voorbeeldwebshop.nl/search', 'https://shop.voorbeeldwebshop.nl/api/suggest']);
  assert.ok(sqli.markdown.includes('**Status**: Confirmed'));
  assert.ok(sqli.markdown.includes('**CWE**: 89'));
  assert.ok(sqli.markdown.includes('GET /search?q=laptop'), 'base64 request decoded');
  assert.ok(sqli.markdown.includes('- Use parameterized queries.'), 'html list converted');
  assert.ok(!/<[a-z]+>/.test(sqli.markdown.split('### Evidence')[0]), 'no html tags left in description');
  assert.equal(parseFindings(sqli.markdown).diagnostics.filter((d) => d.level === 'error').length, 0);
});

test('nessus: plugins merged across hosts, severity 0 skipped by default, cvss3 vector normalised', async () => {
  const { nessus } = await loadImporters(ROOT);
  const r = await nessus.importFindings(fx('scan.nessus'), {});
  assert.deepEqual(r.findings.map((f) => f.severity), ['critical', 'medium', 'low']);
  const apache = r.findings[0];
  assert.equal(apache.merged, 2);
  assert.deepEqual(apache.affected, ['203.0.113.4:443/tcp (www)', '203.0.113.5:443/tcp (www)']);
  const parsed = parseFindings(apache.markdown).findings[0];
  assert.equal(parsed.cvss31?.vector, 'CVSS:3.0/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H');
  assert.ok(apache.markdown.includes('CVE-2021-42013'));
  const all = await nessus.importFindings(fx('scan.nessus'), { minSeverity: 'info' });
  assert.equal(all.findings.length, 4);
});

test('html → markdown and xml reader basics', () => {
  assert.equal(htmlToMarkdown('<p>A <b>b</b> &amp; <a href="https://x">y</a></p><ul><li>one</li></ul>'), 'A **b** & [y](https://x)\n\n- one');
  const x = parseXml('<a x="1"><b>t&amp;</b><c/><![CDATA[<raw>]]></a>');
  assert.equal(x.children[0].attrs.x, '1');
  assert.equal(x.children[0].children[0].text, 't&');
  assert.equal(x.children[0].text, '<raw>');
});
