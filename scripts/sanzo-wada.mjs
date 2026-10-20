#!/usr/bin/env node
/**
 * Builds modules/palettes/sanzo-wada.yaml from the open data set of Sanzo Wada's
 * "A Dictionary of Color Combinations" (1933): 159 colours (CMYK) and 348
 * combinations. Source: https://github.com/dblodorn/sanzo-wada (MIT).
 *   node scripts/sanzo-wada.mjs <path-to-clone>/apps/sanzo-wada-alpha/src/colors
 * Every combination gets a "report fit" score: how well it works as
 * primary (headings, cover) + accent (eyebrows, rules) on white paper.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) { console.error('usage: node scripts/sanzo-wada.mjs <colors dir>'); process.exit(1); }
const colors = [];
for (const f of readdirSync(dir).filter((x) => /^swatches_[a-f]\.json$/.test(x)).sort()) for (const v of Object.values(JSON.parse(readFileSync(join(dir, f), 'utf8')))) colors.push(...v);

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const cmykToHex = ([c, m, y, k]) => '#' + [(1 - c / 100) * (1 - k / 100), (1 - m / 100) * (1 - k / 100), (1 - y / 100) * (1 - k / 100)].map((x) => Math.round(clamp01(x) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const lum = (hex) => { const [r, g, b] = rgb(hex).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrastWhite = (hex) => 1.05 / (lum(hex) + 0.05);
const hsl = (hex) => { const [r, g, b] = rgb(hex); const max = Math.max(r, g, b), min = Math.min(r, g, b); const l = (max + min) / 2; if (max === min) return [0, 0, l]; const d = max - min; const s = l > 0.5 ? d / (2 - max - min) : d / (max + min); let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h * 60, s, l]; };
const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

const byName = new Map(colors.map((c) => [c.name, { name: c.name, hex: cmykToHex(c.cmyk), cmyk: c.cmyk }]));
const combos = new Map();
for (const c of colors) for (const n of c.combinations) { if (!combos.has(n)) combos.set(n, []); combos.get(n).push(byName.get(c.name)); }

function assess(cols) {
  // primary: the colour with the best contrast on white (needs ≥ 4.5 for headings)
  const sorted = [...cols].sort((a, b) => contrastWhite(b.hex) - contrastWhite(a.hex));
  const primary = sorted[0];
  const cp = contrastWhite(primary.hex);
  if (cp < 4.5 || cols.length < 2) return null;
  const [hp, sp, lp] = hsl(primary.hex);
  if (lp < 0.1) return null;   // near-black primaries make a dull report
  let best = null;
  for (const c of cols) {
    if (c === primary) continue;
    const ca = contrastWhite(c.hex);
    if (ca < 3) continue;
    const [ha, sa, la] = hsl(c.hex);
    const sep = hueDist(hp, ha);
    const garish = sa > 0.85 && la > 0.42 ? 0.2 : sa > 0.95 ? 0.1 : 0;   // neon accents fight with the severity colours
    // accent should read as a different colour, be chromatic, and still be legible as small text
    const s = Math.min(sep, 120) / 120 * 0.45 + Math.min(sa, 0.8) / 0.8 * 0.25 + Math.min(ca, 7) / 7 * 0.3 - garish;
    if (!best || s > best.s) best = { c, s };
  }
  if (!best) return null;
  // primary: prefer deep, restrained hues (blues, greens, plums, warm browns) over neon or near-black
  let score = best.s * 0.6 + Math.min(cp, 12) / 12 * 0.25 + (lp > 0.12 && lp < 0.4 ? 0.15 : 0.05);
  if (sp > 0.9) score -= 0.08;
  const light = cols.filter((c) => c !== primary && c !== best.c && contrastWhite(c.hex) < 1.6).sort((a, b) => contrastWhite(a.hex) - contrastWhite(b.hex))[0];
  return { primary: primary.hex, accent: best.c.hex, surface: light?.hex, score: Math.round(score * 1000) / 1000 };
}

const out = [];
for (const [n, cols] of [...combos.entries()].sort((a, b) => a[0] - b[0])) {
  const a = assess(cols);
  out.push({ no: n, colors: cols.map((c) => ({ name: c.name, hex: c.hex })), ...(a ? { roles: { primary: a.primary, accent: a.accent, ...(a.surface ? { surface: a.surface } : {}) }, report_fit: a.score } : {}) });
}
const ranked = out.filter((x) => x.report_fit != null).sort((a, b) => b.report_fit - a.report_fit);
ranked.slice(0, 30).forEach((x, i) => { x.top = i + 1; });
const q = (s) => JSON.stringify(s);
const yaml = [
  '# Sanzo Wada, "A Dictionary of Color Combinations" (Haishoku Sōkan, 1933): 159 colours, 348 combinations.',
  '# Data converted from the open data set https://github.com/dblodorn/sanzo-wada (MIT) by scripts/sanzo-wada.mjs.',
  '# `roles` is Reportforge\'s suggestion for primary (headings, cover), accent (eyebrows, rules) and surface',
  '# (light fills); `report_fit` scores legibility and contrast on white paper, `top` ranks the best 30.',
  'id: sanzo-wada', 'name: Sanzo Wada — Dictionary of Color Combinations', 'year: 1933', `colors: ${colors.length}`, 'combinations:',
  ...out.map((x) => `  - { number: ${x.no}${x.top ? `, top: ${x.top}` : ''}, colors: [${x.colors.map((c) => `{ name: ${q(c.name)}, hex: ${q(c.hex)} }`).join(', ')}]${x.roles ? `, roles: { primary: ${q(x.roles.primary)}, accent: ${q(x.roles.accent)}${x.roles.surface ? `, surface: ${q(x.roles.surface)}` : ''} }, report_fit: ${x.report_fit}` : ''} }`),
  '',
].join('\n');
writeFileSync('modules/palettes/sanzo-wada.yaml', yaml);
console.log(`${out.length} combinaties, ${ranked.length} geschikt voor rapportage; top 30:`);
for (const x of ranked.slice(0, 30)) console.log(`  #${String(x.no).padStart(3)}  ${x.roles.primary} / ${x.roles.accent}  ${x.colors.map((c) => c.name).join(' · ')}`);
