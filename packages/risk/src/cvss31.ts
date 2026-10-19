/**
 * CVSS v3.1 — implemented from the FIRST specification (section 7, "Scoring").
 * https://www.first.org/cvss/v3.1/specification-document
 */
import type { Severity } from './types.ts';

export interface Cvss31Result {
  version: '3.1';
  vector: string;
  baseScore: number;
  temporalScore?: number;
  score: number;           // temporal if present, else base
  severity: Severity;
  metrics: Record<string, string>;
  impact: number;
  exploitability: number;
  warnings: string[];
}

const BASE = ['AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A'];
const ALLOWED: Record<string, string[]> = {
  AV: ['N', 'A', 'L', 'P'], AC: ['L', 'H'], PR: ['N', 'L', 'H'], UI: ['N', 'R'], S: ['U', 'C'],
  C: ['H', 'L', 'N'], I: ['H', 'L', 'N'], A: ['H', 'L', 'N'],
  E: ['X', 'U', 'P', 'F', 'H'], RL: ['X', 'O', 'T', 'W', 'U'], RC: ['X', 'U', 'R', 'C'],
  CR: ['X', 'L', 'M', 'H'], IR: ['X', 'L', 'M', 'H'], AR: ['X', 'L', 'M', 'H'],
  MAV: ['X', 'N', 'A', 'L', 'P'], MAC: ['X', 'L', 'H'], MPR: ['X', 'N', 'L', 'H'], MUI: ['X', 'N', 'R'], MS: ['X', 'U', 'C'],
  MC: ['X', 'H', 'L', 'N'], MI: ['X', 'H', 'L', 'N'], MA: ['X', 'H', 'L', 'N'],
};

const W = {
  AV: { N: 0.85, A: 0.62, L: 0.55, P: 0.2 },
  AC: { L: 0.77, H: 0.44 },
  UI: { N: 0.85, R: 0.62 },
  CIA: { H: 0.56, L: 0.22, N: 0 },
  E: { X: 1, U: 0.91, P: 0.94, F: 0.97, H: 1 },
  RL: { X: 1, O: 0.95, T: 0.96, W: 0.97, U: 1 },
  RC: { X: 1, U: 0.92, R: 0.96, C: 1 },
} as const;

function pr(v: string, changed: boolean): number {
  if (v === 'N') return 0.85;
  if (v === 'L') return changed ? 0.68 : 0.62;
  return changed ? 0.5 : 0.27;
}

/** Round up to one decimal, per spec Appendix A (integer arithmetic to avoid float artefacts). */
export function roundUp(x: number): number {
  const i = Math.round(x * 100000);
  if (i % 10000 === 0) return i / 100000;
  return (Math.floor(i / 10000) + 1) / 10;
}

export function severityFromScore(score: number): Severity {
  if (score === 0) return 'info';
  if (score < 4) return 'low';
  if (score < 7) return 'medium';
  if (score < 9) return 'high';
  return 'critical';
}

export function parseVector31(vector: string): { metrics: Record<string, string>; warnings: string[] } {
  const v = vector.trim();
  if (!/^CVSS:3\.[01]\//.test(v)) throw new Error(`Geen CVSS 3.x vector: "${vector}"`);
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
  if (v.startsWith('CVSS:3.0')) warnings.push('CVSS 3.0-vector gescoord volgens de 3.1-formule (identieke uitkomst, afrondingsregel 3.1).');
  return { metrics, warnings };
}

export function scoreCvss31(vector: string): Cvss31Result {
  const { metrics: m, warnings } = parseVector31(vector);
  const changed = m.S === 'C';
  const iss = 1 - (1 - W.CIA[m.C as keyof typeof W.CIA]) * (1 - W.CIA[m.I as keyof typeof W.CIA]) * (1 - W.CIA[m.A as keyof typeof W.CIA]);
  const impact = changed ? 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15) : 6.42 * iss;
  const exploitability = 8.22 * W.AV[m.AV as keyof typeof W.AV] * W.AC[m.AC as keyof typeof W.AC] * pr(m.PR, changed) * W.UI[m.UI as keyof typeof W.UI];
  let baseScore = 0;
  if (impact > 0) baseScore = changed ? roundUp(Math.min(1.08 * (impact + exploitability), 10)) : roundUp(Math.min(impact + exploitability, 10));

  let temporalScore: number | undefined;
  if (m.E || m.RL || m.RC) {
    const e = W.E[(m.E ?? 'X') as keyof typeof W.E], rl = W.RL[(m.RL ?? 'X') as keyof typeof W.RL], rc = W.RC[(m.RC ?? 'X') as keyof typeof W.RC];
    temporalScore = roundUp(baseScore * e * rl * rc);
  }
  if (Object.keys(m).some((k) => k.startsWith('M') || ['CR', 'IR', 'AR'].includes(k))) {
    warnings.push('Environmental metrics zijn gelezen maar niet meegenomen in de score (basis + temporal wordt gerapporteerd).');
  }
  const score = temporalScore ?? baseScore;
  return { version: '3.1', vector: vector.trim(), baseScore, temporalScore, score, severity: severityFromScore(score), metrics: m, impact, exploitability, warnings };
}

/** Human-readable metric values, for the appendix. */
export const CVSS31_LABELS: Record<string, { nl: string; en: string; values: Record<string, { nl: string; en: string }> }> = {
  AV: { nl: 'Aanvalsvector', en: 'Attack Vector', values: { N: { nl: 'Netwerk', en: 'Network' }, A: { nl: 'Aangrenzend', en: 'Adjacent' }, L: { nl: 'Lokaal', en: 'Local' }, P: { nl: 'Fysiek', en: 'Physical' } } },
  AC: { nl: 'Aanvalscomplexiteit', en: 'Attack Complexity', values: { L: { nl: 'Laag', en: 'Low' }, H: { nl: 'Hoog', en: 'High' } } },
  PR: { nl: 'Vereiste rechten', en: 'Privileges Required', values: { N: { nl: 'Geen', en: 'None' }, L: { nl: 'Laag', en: 'Low' }, H: { nl: 'Hoog', en: 'High' } } },
  UI: { nl: 'Gebruikersinteractie', en: 'User Interaction', values: { N: { nl: 'Geen', en: 'None' }, R: { nl: 'Vereist', en: 'Required' } } },
  S: { nl: 'Scope', en: 'Scope', values: { U: { nl: 'Ongewijzigd', en: 'Unchanged' }, C: { nl: 'Gewijzigd', en: 'Changed' } } },
  C: { nl: 'Vertrouwelijkheid', en: 'Confidentiality', values: { H: { nl: 'Hoog', en: 'High' }, L: { nl: 'Laag', en: 'Low' }, N: { nl: 'Geen', en: 'None' } } },
  I: { nl: 'Integriteit', en: 'Integrity', values: { H: { nl: 'Hoog', en: 'High' }, L: { nl: 'Laag', en: 'Low' }, N: { nl: 'Geen', en: 'None' } } },
  A: { nl: 'Beschikbaarheid', en: 'Availability', values: { H: { nl: 'Hoog', en: 'High' }, L: { nl: 'Laag', en: 'Low' }, N: { nl: 'Geen', en: 'None' } } },
};
