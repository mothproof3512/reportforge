import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFindings } from '@reportforge/markdown';
import { splitRoadmap } from '@reportforge/core';

test('Dutch/English section aliases of the extended layout map to summary/likelihood/classification/notes', () => {
  const md = `## T

**Severity**: Low · **CVSS 3.1**: 3.1 (\`CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:L/I:N/A:N\`) · **Status**: Confirmed

**Affected**:

- x

### Samenvatting
s
### Beschrijving
d
### Toelichting op de classificatie
c
### Bewijs
e
### Impact
i
### Kans
k
### Aanbeveling
r
### Kanttekeningen
n
### Referenties
ref
`;
  const r = parseFindings(md);
  assert.deepEqual(r.diagnostics.filter((d) => d.level === 'error'), []);
  assert.deepEqual(Object.keys(r.findings[0].sections).sort(), ['classification', 'description', 'evidence', 'impact', 'likelihood', 'notes', 'recommendation', 'references', 'summary']);
});

test('splitRoadmap groups on ### headings', () => {
  const g = splitRoadmap('### 0 – 30 dagen\n\n- a\n- b\n\n### Structureel\n\n- c\n');
  assert.equal(g.length, 2);
  assert.equal(g[0].title, '0 – 30 dagen');
  assert.equal(g[1].body, '- c');
  assert.deepEqual(splitRoadmap(undefined), []);
});
