export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

export const SEVERITY_RANK: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export interface RiskAssessment {
  model: string;             // 'cvss31' | 'cvss40' | 'matrix'
  severity: Severity;
  score?: number;            // numeric score where the model has one
  label: string;             // e.g. "7.5" or "4 × 3"
  vector?: string;
  details: Record<string, unknown>;
  warnings: string[];
}
