/**
 * Fills in / verifies the CVSS 3.1 scores in modules/library/<lang>/*.md from their vectors
 * and validates every file against the markdown contract.
 *   npx tsx scripts/library-scores.ts          # rewrite scores
 *   npx tsx scripts/library-scores.ts --check  # only report
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreCvss31, severityFromScore } from '@reportforge/risk';
import { loadLibrary, libraryLanguages } from '@reportforge/core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
let problems = 0, changed = 0, total = 0;
for (const lang of libraryLanguages(ROOT)) {
  const dir = join(ROOT, 'modules/library', lang);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    total++;
    const src = readFileSync(join(dir, file), 'utf8');
    const out = src.replace(/\*\*CVSS 3\.1\*\*:\s*([\d.]+)\s*\(`(CVSS:3\.1\/[^`]+)`\)/g, (m, score, vector) => {
      const r = scoreCvss31(vector);
      if (r.warnings?.length) { problems++; console.log(`✖ ${lang}/${file}: ${r.warnings.join('; ')}`); }
      if (Number(score) !== r.score) { changed++; if (check) { problems++; console.log(`✖ ${lang}/${file}: score ${score} ≠ ${r.score}`); } }
      return `**CVSS 3.1**: ${r.score.toFixed(1)} (\`${vector}\`)`;
    });
    if (!check && out !== src) writeFileSync(join(dir, file), out);
  }
  for (const e of loadLibrary(ROOT, lang)) {
    for (const d of e.diagnostics) { if (d.level === 'error') problems++; console.log(`${d.level === 'error' ? '✖' : '⚠'} ${lang}/${e.file}: ${d.message}`); }
    if (!e.tags) { problems++; console.log(`✖ ${lang}/${e.file}: geen **Tags**`); }
    const m = e.markdown.match(/\*\*CVSS 3\.1\*\*:\s*([\d.]+)/);
    if (m) { const sev = severityFromScore(Number(m[1])); const explicit = e.severity; if (sev !== explicit) console.log(`ℹ ${lang}/${e.file}: severity ${explicit} (CVSS zegt ${sev}, ${m[1]}) — bewuste keuze?`); }
  }
}
console.log(`${total} bestanden, ${changed} scores ${check ? 'afwijkend' : 'bijgewerkt'}, ${problems} problemen`);
process.exit(problems ? 1 : 0);
