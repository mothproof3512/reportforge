import type { Lang, Severity } from './types.ts';

const MONTHS: Record<Lang, string[]> = {
  nl: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

/** "2026-09-19" → "19 september 2026" / "19 September 2026" */
export function formatDate(iso: string | undefined, lang: Lang, short = false): string {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(iso);
  const [, y, mo, d] = m;
  const month = MONTHS[lang][Number(mo) - 1];
  return short ? `${Number(d)} ${month.slice(0, 3)}` : `${Number(d)} ${month} ${y}`;
}

const SEV: Record<Lang, Record<Severity, string>> = {
  nl: { critical: 'Kritiek', high: 'Hoog', medium: 'Middel', low: 'Laag', info: 'Info' },
  en: { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', info: 'Info' },
};
export function severityLabel(s: Severity, lang: Lang): string {
  return SEV[lang][s];
}

/** Look up "a.b.c" in a nested dictionary; falls back to the key itself. */
export function t(dict: Record<string, unknown>, key: string, vars: Record<string, string | number> = {}): string {
  const v = key.split('.').reduce<any>((o, k) => (o && typeof o === 'object' ? o[k] : undefined), dict);
  let s = typeof v === 'string' ? v : key;
  for (const [k, val] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(val));
  return s;
}
