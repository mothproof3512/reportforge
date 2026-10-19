/**
 * Impact × likelihood risk matrix. Both axes run 1..5 by default.
 * The mapping from product to severity is configurable per client.
 */
import type { Severity } from './types.ts';

export interface MatrixConfig {
  scale: number;                 // 5 → axes 1..5
  /** Ordered thresholds on the product impact*likelihood (inclusive lower bounds), highest first. */
  thresholds: Array<{ min: number; severity: Severity }>;
  labels?: { impact?: Record<string, { nl: string; en: string }>; likelihood?: Record<string, { nl: string; en: string }> };
}

export const DEFAULT_MATRIX: MatrixConfig = {
  scale: 5,
  thresholds: [
    { min: 20, severity: 'critical' },
    { min: 12, severity: 'high' },
    { min: 6, severity: 'medium' },
    { min: 2, severity: 'low' },
    { min: 0, severity: 'info' },
  ],
};

export interface MatrixResult {
  impact: number;
  likelihood: number;
  product: number;
  severity: Severity;
}

export function scoreMatrix(impact: number, likelihood: number, cfg: MatrixConfig = DEFAULT_MATRIX): MatrixResult {
  for (const [name, v] of [['impact', impact], ['likelihood', likelihood]] as const) {
    if (!Number.isInteger(v) || v < 1 || v > cfg.scale) throw new Error(`${name} moet een geheel getal zijn tussen 1 en ${cfg.scale}`);
  }
  const product = impact * likelihood;
  const hit = [...cfg.thresholds].sort((a, b) => b.min - a.min).find((t) => product >= t.min);
  return { impact, likelihood, product, severity: hit?.severity ?? 'info' };
}
