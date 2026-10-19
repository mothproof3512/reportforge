/**
 * CVSS v4.0 — scoring per the FIRST specification, using the official
 * MacroVector lookup tables (vendored, BSD-2-Clause) and an independent
 * TypeScript port of the reference interpolation algorithm.
 * https://www.first.org/cvss/v4.0/specification-document
 */
import { CVSS40_LOOKUP, CVSS40_MAX_COMPOSED, CVSS40_MAX_SEVERITY } from './vendor/cvss40-data.ts';
import type { Severity } from './types.ts';

export interface Cvss40Result {
  version: '4.0';
  vector: string;
  score: number;
  severity: Severity;
  nomenclature: 'CVSS-B' | 'CVSS-BT' | 'CVSS-BE' | 'CVSS-BTE';
  macroVector: string;
  metrics: Record<string, string>;
  warnings: string[];
}

const BASE = ['AV', 'AC', 'AT', 'PR', 'UI', 'VC', 'VI', 'VA', 'SC', 'SI', 'SA'];
const ALLOWED: Record<string, string[]> = {
  AV: ['N', 'A', 'L', 'P'], AC: ['L', 'H'], AT: ['N', 'P'], PR: ['N', 'L', 'H'], UI: ['N', 'P', 'A'],
  VC: ['H', 'L', 'N'], VI: ['H', 'L', 'N'], VA: ['H', 'L', 'N'], SC: ['H', 'L', 'N'], SI: ['H', 'L', 'N'], SA: ['H', 'L', 'N'],
  E: ['X', 'A', 'P', 'U'],
  CR: ['X', 'H', 'M', 'L'], IR: ['X', 'H', 'M', 'L'], AR: ['X', 'H', 'M', 'L'],
  MAV: ['X', 'N', 'A', 'L', 'P'], MAC: ['X', 'L', 'H'], MAT: ['X', 'N', 'P'], MPR: ['X', 'N', 'L', 'H'], MUI: ['X', 'N', 'P', 'A'],
  MVC: ['X', 'H', 'L', 'N'], MVI: ['X', 'H', 'L', 'N'], MVA: ['X', 'H', 'L', 'N'], MSC: ['X', 'H', 'L', 'N'], MSI: ['X', 'S', 'H', 'L', 'N'], MSA: ['X', 'S', 'H', 'L', 'N'],
  S: ['X', 'N', 'P'], AU: ['X', 'N', 'Y'], R: ['X', 'A', 'U', 'I'], V: ['X', 'D', 'C'], RE: ['X', 'L', 'M', 'H'], U: ['X', 'Clear', 'Green', 'Amber', 'Red'],
};
const THREAT = ['E'];
const ENV = ['CR', 'IR', 'AR', 'MAV', 'MAC', 'MAT', 'MPR', 'MUI', 'MVC', 'MVI', 'MVA', 'MSC', 'MSI', 'MSA'];

const LEVELS: Record<string, Record<string, number>> = {
  AV: { N: 0.0, A: 0.1, L: 0.2, P: 0.3 }, PR: { N: 0.0, L: 0.1, H: 0.2 }, UI: { N: 0.0, P: 0.1, A: 0.2 },
  AC: { L: 0.0, H: 0.1 }, AT: { N: 0.0, P: 0.1 },
  VC: { H: 0.0, L: 0.1, N: 0.2 }, VI: { H: 0.0, L: 0.1, N: 0.2 }, VA: { H: 0.0, L: 0.1, N: 0.2 },
  SC: { H: 0.1, L: 0.2, N: 0.3 }, SI: { S: 0.0, H: 0.1, L: 0.2, N: 0.3 }, SA: { S: 0.0, H: 0.1, L: 0.2, N: 0.3 },
  CR: { H: 0.0, M: 0.1, L: 0.2 }, IR: { H: 0.0, M: 0.1, L: 0.2 }, AR: { H: 0.0, M: 0.1, L: 0.2 },
};

export function parseVector40(vector: string): { metrics: Record<string, string>; warnings: string[] } {
  const v = vector.trim();
  if (!v.startsWith('CVSS:4.0/')) throw new Error(`Geen CVSS 4.0 vector: "${vector}"`);
  const metrics: Record<string, string> = {};
  const warnings: string[] = [];
  for (const part of v.split('/').slice(1)) {
    const [k, val] = part.split(':');
    if (!k || val === undefined) throw new Error(`Ongeldig vectoronderdeel "${part}"`);
    if (!ALLOWED[k]) { warnings.push(`Onbekende metric "${k}" genegeerd`); continue; }
    if (!ALLOWED[k].includes(val)) throw new Error(`Ongeldige waarde "${val}" voor ${k}`);
    if (metrics[k]) throw new Error(`Metric ${k} komt twee keer voor`);
    metrics[k] = val;
  }
  for (const b of BASE) if (!metrics[b]) throw new Error(`Verplichte metric ${b} ontbreekt`);
  for (const k of Object.keys(ALLOWED)) if (!metrics[k]) metrics[k] = 'X';
  return { metrics, warnings };
}

/** Effective metric value: environmental overrides, worst-case defaults for X. */
function m(sel: Record<string, string>, metric: string): string {
  const v = sel[metric];
  if (metric === 'E' && v === 'X') return 'A';
  if ((metric === 'CR' || metric === 'IR' || metric === 'AR') && v === 'X') return 'H';
  const mod = sel['M' + metric];
  if (mod !== undefined && mod !== 'X') return mod;
  return v;
}

export function macroVector40(sel: Record<string, string>): string {
  const AV = m(sel, 'AV'), PR = m(sel, 'PR'), UI = m(sel, 'UI'), AC = m(sel, 'AC'), AT = m(sel, 'AT');
  const VC = m(sel, 'VC'), VI = m(sel, 'VI'), VA = m(sel, 'VA'), SC = m(sel, 'SC'), SI = m(sel, 'SI'), SA = m(sel, 'SA');
  const E = m(sel, 'E'), CR = m(sel, 'CR'), IR = m(sel, 'IR'), AR = m(sel, 'AR');
  const eq1 = AV === 'N' && PR === 'N' && UI === 'N' ? 0 : (AV === 'N' || PR === 'N' || UI === 'N') && AV !== 'P' ? 1 : 2;
  const eq2 = AC === 'L' && AT === 'N' ? 0 : 1;
  const eq3 = VC === 'H' && VI === 'H' ? 0 : VC === 'H' || VI === 'H' || VA === 'H' ? 1 : 2;
  const eq4 = m(sel, 'MSI') === 'S' || m(sel, 'MSA') === 'S' ? 0 : SC === 'H' || SI === 'H' || SA === 'H' ? 1 : 2;
  const eq5 = E === 'A' ? 0 : E === 'P' ? 1 : 2;
  const eq6 = (CR === 'H' && VC === 'H') || (IR === 'H' && VI === 'H') || (AR === 'H' && VA === 'H') ? 0 : 1;
  return `${eq1}${eq2}${eq3}${eq4}${eq5}${eq6}`;
}

function extract(metric: string, str: string): string {
  const re = new RegExp(`(?:^|/)${metric}:([A-Za-z]+)`);
  const r = str.match(re);
  return r ? r[1] : '';
}

export function scoreCvss40(vector: string): Cvss40Result {
  const { metrics: sel, warnings } = parseVector40(vector);
  const hasT = THREAT.some((k) => sel[k] !== 'X');
  const hasE = ENV.some((k) => sel[k] !== 'X');
  const nomenclature = hasT && hasE ? 'CVSS-BTE' : hasT ? 'CVSS-BT' : hasE ? 'CVSS-BE' : 'CVSS-B';
  const mv = macroVector40(sel);

  const finish = (score: number): Cvss40Result => ({ version: '4.0', vector: vector.trim(), score, severity: severity40(score), nomenclature, macroVector: mv, metrics: sel, warnings });

  if (['VC', 'VI', 'VA', 'SC', 'SI', 'SA'].every((k) => m(sel, k) === 'N')) return finish(0);

  const value = CVSS40_LOOKUP[mv];
  const [eq1, eq2, eq3, eq4, eq5, eq6] = mv.split('').map(Number);
  const L = (s: string) => CVSS40_LOOKUP[s];

  const sEq1 = L(`${eq1 + 1}${eq2}${eq3}${eq4}${eq5}${eq6}`);
  const sEq2 = L(`${eq1}${eq2 + 1}${eq3}${eq4}${eq5}${eq6}`);
  let sEq3eq6: number | undefined;
  if (eq3 === 1 && eq6 === 1) sEq3eq6 = L(`${eq1}${eq2}${eq3 + 1}${eq4}${eq5}${eq6}`);
  else if (eq3 === 0 && eq6 === 1) sEq3eq6 = L(`${eq1}${eq2}${eq3 + 1}${eq4}${eq5}${eq6}`);
  else if (eq3 === 1 && eq6 === 0) sEq3eq6 = L(`${eq1}${eq2}${eq3}${eq4}${eq5}${eq6 + 1}`);
  else if (eq3 === 0 && eq6 === 0) {
    const left = L(`${eq1}${eq2}${eq3}${eq4}${eq5}${eq6 + 1}`), right = L(`${eq1}${eq2}${eq3 + 1}${eq4}${eq5}${eq6}`);
    sEq3eq6 = left > right ? left : right;
  } else sEq3eq6 = L(`${eq1}${eq2}${eq3 + 1}${eq4}${eq5}${eq6 + 1}`);
  const sEq4 = L(`${eq1}${eq2}${eq3}${eq4 + 1}${eq5}${eq6}`);
  const sEq5 = L(`${eq1}${eq2}${eq3}${eq4}${eq5 + 1}${eq6}`);

  const maxes = (eq: number) => CVSS40_MAX_COMPOSED['eq' + eq][mv[eq - 1]] as string[];
  const eq3eq6Maxes = (CVSS40_MAX_COMPOSED.eq3[mv[2]] as Record<string, string[]>)[mv[5]];
  const maxVectors: string[] = [];
  for (const a of maxes(1)) for (const b of maxes(2)) for (const c of eq3eq6Maxes) for (const d of maxes(4)) for (const e of maxes(5)) maxVectors.push(a + b + c + d + e);

  const dist: Record<string, number> = {};
  let found = false;
  for (const mx of maxVectors) {
    const d: Record<string, number> = {};
    let ok = true;
    for (const k of Object.keys(LEVELS)) {
      d[k] = LEVELS[k][m(sel, k)] - LEVELS[k][extract(k, mx)];
      if (d[k] < 0) { ok = false; }
    }
    Object.assign(dist, d);
    if (ok) { found = true; break; }
  }
  if (!found) warnings.push('Geen passende max-vector gevonden; score is een benadering.');

  const cur1 = dist.AV + dist.PR + dist.UI;
  const cur2 = dist.AC + dist.AT;
  const cur36 = dist.VC + dist.VI + dist.VA + dist.CR + dist.IR + dist.AR;
  const cur4 = dist.SC + dist.SI + dist.SA;
  const step = 0.1;
  const ms = CVSS40_MAX_SEVERITY;
  const max1 = ms.eq1[eq1] * step, max2 = ms.eq2[eq2] * step, max36 = ms.eq3eq6[eq3][eq6] * step, max4 = ms.eq4[eq4] * step;

  let n = 0, total = 0;
  const add = (lower: number | undefined, cur: number, max: number) => {
    if (lower === undefined || Number.isNaN(lower)) return;
    n++;
    total += (value - lower) * (max === 0 ? 0 : cur / max);
  };
  add(sEq1, cur1, max1); add(sEq2, cur2, max2); add(sEq3eq6, cur36, max36); add(sEq4, cur4, max4);
  if (sEq5 !== undefined && !Number.isNaN(sEq5)) { n++; }
  const mean = n === 0 ? 0 : total / n;
  let score = value - mean;
  if (score < 0) score = 0;
  if (score > 10) score = 10;
  return finish(Math.round(score * 10) / 10);
}

export function severity40(score: number): Severity {
  if (score === 0) return 'info';
  if (score < 4) return 'low';
  if (score < 7) return 'medium';
  if (score < 9) return 'high';
  return 'critical';
}

export const CVSS40_LABELS: Record<string, { nl: string; en: string; values: Record<string, { nl: string; en: string }> }> = {
  AV: { nl: 'Aanvalsvector', en: 'Attack Vector', values: { N: { nl: 'Netwerk', en: 'Network' }, A: { nl: 'Aangrenzend', en: 'Adjacent' }, L: { nl: 'Lokaal', en: 'Local' }, P: { nl: 'Fysiek', en: 'Physical' } } },
  AC: { nl: 'Aanvalscomplexiteit', en: 'Attack Complexity', values: { L: { nl: 'Laag', en: 'Low' }, H: { nl: 'Hoog', en: 'High' } } },
  AT: { nl: 'Aanvalsvereisten', en: 'Attack Requirements', values: { N: { nl: 'Geen', en: 'None' }, P: { nl: 'Aanwezig', en: 'Present' } } },
  PR: { nl: 'Vereiste rechten', en: 'Privileges Required', values: { N: { nl: 'Geen', en: 'None' }, L: { nl: 'Laag', en: 'Low' }, H: { nl: 'Hoog', en: 'High' } } },
  UI: { nl: 'Gebruikersinteractie', en: 'User Interaction', values: { N: { nl: 'Geen', en: 'None' }, P: { nl: 'Passief', en: 'Passive' }, A: { nl: 'Actief', en: 'Active' } } },
  VC: { nl: 'Vertrouwelijkheid (kwetsbaar systeem)', en: 'Confidentiality (vulnerable system)', values: { H: { nl: 'Hoog', en: 'High' }, L: { nl: 'Laag', en: 'Low' }, N: { nl: 'Geen', en: 'None' } } },
  VI: { nl: 'Integriteit (kwetsbaar systeem)', en: 'Integrity (vulnerable system)', values: { H: { nl: 'Hoog', en: 'High' }, L: { nl: 'Laag', en: 'Low' }, N: { nl: 'Geen', en: 'None' } } },
  VA: { nl: 'Beschikbaarheid (kwetsbaar systeem)', en: 'Availability (vulnerable system)', values: { H: { nl: 'Hoog', en: 'High' }, L: { nl: 'Laag', en: 'Low' }, N: { nl: 'Geen', en: 'None' } } },
  SC: { nl: 'Vertrouwelijkheid (volgend systeem)', en: 'Confidentiality (subsequent system)', values: { H: { nl: 'Hoog', en: 'High' }, L: { nl: 'Laag', en: 'Low' }, N: { nl: 'Geen', en: 'None' } } },
  SI: { nl: 'Integriteit (volgend systeem)', en: 'Integrity (subsequent system)', values: { H: { nl: 'Hoog', en: 'High' }, L: { nl: 'Laag', en: 'Low' }, N: { nl: 'Geen', en: 'None' } } },
  SA: { nl: 'Beschikbaarheid (volgend systeem)', en: 'Availability (subsequent system)', values: { H: { nl: 'Hoog', en: 'High' }, L: { nl: 'Laag', en: 'Low' }, N: { nl: 'Geen', en: 'None' } } },
};
