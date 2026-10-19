import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreCvss31, scoreCvss40, scoreMatrix, assess } from '@reportforge/risk';

// CVSS 3.1: values from the FIRST specification examples and NVD-published scores
const v31: Array<[string, number]> = [
  ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 9.8],
  ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H', 10.0],
  ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N', 5.3],
  ['CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:L/I:L/A:N', 6.4],
  ['CVSS:3.1/AV:L/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N', 0.0],
  ['CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:L/A:N', 4.2],
  ['CVSS:3.1/AV:P/AC:H/PR:H/UI:R/S:C/C:L/I:N/A:N', 1.8],
  ['CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N', 6.1],   // classic reflected XSS
  ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N', 7.5],
  ['CVSS:3.1/AV:A/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H', 8.0],
];
for (const [vec, expected] of v31) {
  test(`cvss31 ${vec} = ${expected}`, () => {
    assert.equal(scoreCvss31(vec).score, expected);
  });
}
test('cvss31 temporal', () => {
  const r = scoreCvss31('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/E:P/RL:O/RC:C');
  assert.equal(r.baseScore, 9.8);
  assert.equal(r.temporalScore, 8.8);
});
test('cvss31 rejects bad vectors', () => {
  assert.throws(() => scoreCvss31('CVSS:3.1/AV:N/AC:L'));
  assert.throws(() => scoreCvss31('CVSS:3.1/AV:Z/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H'));
});

// CVSS 4.0: values produced by the official FIRST reference calculator
const v40: Array<[string, number]> = [
  ['CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N', 9.3],
  ['CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H', 10.0],
  ['CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:N/VA:N/SC:N/SI:N/SA:N', 0.0],
  ['CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:L/VI:N/VA:N/SC:N/SI:N/SA:N', 6.9],
  ['CVSS:4.0/AV:N/AC:L/AT:N/PR:L/UI:N/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N', 5.3],
  ['CVSS:4.0/AV:L/AC:L/AT:N/PR:L/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N', 8.5],
  ['CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:P/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N', 5.3],
  ['CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N/E:U', 8.1],
  ['CVSS:4.0/AV:A/AC:H/AT:P/PR:H/UI:A/VC:L/VI:L/VA:L/SC:L/SI:L/SA:L', 1.0],
];
for (const [vec, expected] of v40) {
  test(`cvss40 ${vec} = ${expected}`, () => {
    assert.equal(scoreCvss40(vec).score, expected);
  });
}

test('matrix', () => {
  assert.equal(scoreMatrix(5, 5).severity, 'critical');
  assert.equal(scoreMatrix(4, 3).severity, 'high');
  assert.equal(scoreMatrix(2, 3).severity, 'medium');
  assert.equal(scoreMatrix(1, 2).severity, 'low');
  assert.equal(scoreMatrix(1, 1).severity, 'info');
  assert.throws(() => scoreMatrix(0, 3));
});

test('assess: explicit severity wins with a warning', () => {
  const r = assess('cvss31', { cvss31: { vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N', score: 5.3 }, severity: 'high' });
  assert.equal(r.severity, 'high');
  assert.equal(r.score, 5.3);
  assert.ok(r.warnings.some((w) => w.includes('wijkt af')));
});

// 400 randomly generated vectors (base + threat + environmental), scored by the
// official FIRST reference implementation; our port must match every one.
import { readFileSync } from 'node:fs';
const ref: Array<[string, number]> = JSON.parse(readFileSync(new URL('./cvss40-reference.json', import.meta.url), 'utf8'));
test('cvss40 matches the FIRST reference implementation on 400 vectors', () => {
  const bad = ref.filter(([vec, s]) => scoreCvss40(vec).score !== s).map(([vec, s]) => `${vec}: expected ${s}, got ${scoreCvss40(vec).score}`);
  assert.deepEqual(bad, []);
});
