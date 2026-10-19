export * from './types.ts';
export { scoreCvss31, parseVector31, roundUp, severityFromScore, CVSS31_LABELS } from './cvss31.ts';
export type { Cvss31Result } from './cvss31.ts';
export { scoreCvss40, parseVector40, macroVector40, severity40, CVSS40_LABELS } from './cvss40.ts';
export type { Cvss40Result } from './cvss40.ts';
export { scoreMatrix, DEFAULT_MATRIX } from './matrix.ts';
export type { MatrixConfig, MatrixResult } from './matrix.ts';

import { scoreCvss31 } from './cvss31.ts';
import { scoreCvss40 } from './cvss40.ts';
import { scoreMatrix, DEFAULT_MATRIX, type MatrixConfig } from './matrix.ts';
import type { RiskAssessment, Severity } from './types.ts';

export interface RiskInput {
  cvss31?: { vector: string; score?: number };
  cvss40?: { vector: string; score?: number };
  risk?: { impact: number; likelihood: number };
  severity?: Severity;   // explicit, as written by the tester
}

/**
 * Assess a finding with the engagement's risk model. The tester's explicit
 * severity always wins (senior judgement), but a mismatch with the model is
 * reported as a warning so it is a conscious decision.
 */
export function assess(model: string, input: RiskInput, matrixCfg: MatrixConfig = DEFAULT_MATRIX): RiskAssessment {
  const warnings: string[] = [];
  let r: RiskAssessment;
  switch (model) {
    case 'cvss31': {
      if (!input.cvss31) {
        if (input.cvss40) { r = assess('cvss40', input, matrixCfg); r.warnings.push('Risicomodel is CVSS 3.1 maar alleen een 4.0-vector is opgegeven.'); return r; }
        return fallback(model, input, 'Geen CVSS 3.1-vector opgegeven; explicit severity gebruikt.');
      }
      const s = scoreCvss31(input.cvss31.vector);
      if (input.cvss31.score !== undefined && Math.abs(input.cvss31.score - s.score) > 0.05) warnings.push(`Opgegeven CVSS-score ${input.cvss31.score} wijkt af van berekende ${s.score}; berekende score wordt gebruikt.`);
      r = { model, severity: s.severity, score: s.score, label: s.score.toFixed(1), vector: s.vector, details: { baseScore: s.baseScore, temporalScore: s.temporalScore, metrics: s.metrics }, warnings: [...warnings, ...s.warnings] };
      break;
    }
    case 'cvss40': {
      if (!input.cvss40) {
        if (input.cvss31) { r = assess('cvss31', input, matrixCfg); r.warnings.push('Risicomodel is CVSS 4.0 maar alleen een 3.1-vector is opgegeven.'); return r; }
        return fallback(model, input, 'Geen CVSS 4.0-vector opgegeven; explicit severity gebruikt.');
      }
      const s = scoreCvss40(input.cvss40.vector);
      if (input.cvss40.score !== undefined && Math.abs(input.cvss40.score - s.score) > 0.05) warnings.push(`Opgegeven CVSS-score ${input.cvss40.score} wijkt af van berekende ${s.score}; berekende score wordt gebruikt.`);
      r = { model, severity: s.severity, score: s.score, label: s.score.toFixed(1), vector: s.vector, details: { nomenclature: s.nomenclature, macroVector: s.macroVector, metrics: s.metrics }, warnings: [...warnings, ...s.warnings] };
      break;
    }
    case 'matrix': {
      if (!input.risk) return fallback(model, input, 'Geen impact/waarschijnlijkheid opgegeven; explicit severity gebruikt.');
      const s = scoreMatrix(input.risk.impact, input.risk.likelihood, matrixCfg);
      r = { model, severity: s.severity, score: s.product, label: `${s.impact} × ${s.likelihood}`, details: { impact: s.impact, likelihood: s.likelihood, product: s.product }, warnings };
      break;
    }
    default:
      throw new Error(`Onbekend risicomodel "${model}"`);
  }
  if (input.severity && input.severity !== r.severity) {
    r.warnings.push(`Opgegeven severity "${input.severity}" wijkt af van modeluitkomst "${r.severity}"; opgegeven severity wordt gebruikt.`);
    r.details.modelSeverity = r.severity;
    r.severity = input.severity;
  }
  return r;
}

function fallback(model: string, input: RiskInput, why: string): RiskAssessment {
  if (!input.severity) throw new Error(`${why} En er is ook geen expliciete severity.`);
  return { model, severity: input.severity, label: '—', details: {}, warnings: [why] };
}
