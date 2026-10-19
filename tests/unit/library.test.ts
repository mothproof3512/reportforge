import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLibrary, libraryLanguages, stripTags } from '@reportforge/core';
import { scoreCvss31 } from '@reportforge/risk';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('bundled library: every file parses, has tags, mapping, all sections and a correct CVSS score', () => {
  const langs = libraryLanguages(ROOT);
  assert.ok(langs.includes('nl'));
  const titles = new Set<string>();
  for (const lang of langs) {
    const entries = loadLibrary(ROOT, lang);
    assert.ok(entries.length >= 50, `${lang}: ${entries.length} entries`);
    for (const e of entries) {
      const errors = e.diagnostics.filter((d) => d.level === 'error');
      assert.deepEqual(errors, [], `${e.file}: ${errors.map((d) => d.message).join('; ')}`);
      assert.ok(e.tags.length > 0, `${e.file}: tags`);
      assert.ok(!e.markdown.includes('**Tags**'), `${e.file}: tags stripped`);
      assert.ok(/\*\*Mapping\*\*:/.test(e.markdown), `${e.file}: mapping`);
      for (const h of ['### Description', '### Impact', '### Evidence', '### Recommendation', '### References']) assert.ok(e.markdown.includes(h), `${e.file}: ${h}`);
      const m = e.markdown.match(/\*\*CVSS 3\.1\*\*:\s*([\d.]+)\s*\(`([^`]+)`\)/);
      assert.ok(m, `${e.file}: cvss`);
      assert.equal(Number(m![1]), scoreCvss31(m![2]).score, `${e.file}: score`);
      assert.ok(!titles.has(`${lang}:${e.title}`), `${e.file}: duplicate title`);
      titles.add(`${lang}:${e.title}`);
    }
  }
});

test('stripTags removes only the Tags field', () => {
  const { markdown, tags } = stripTags('## T\n\n**Severity**: Low · **Tags**: web, api · **Status**: Confirmed\n\ntext **Tags** here\n');
  assert.equal(tags, 'web, api');
  assert.equal(markdown, '## T\n\n**Severity**: Low · **Status**: Confirmed\n\ntext **Tags** here\n');
});
