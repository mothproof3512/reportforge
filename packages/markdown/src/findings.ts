/**
 * Parser for the Reportforge finding format (the markdown contract).
 *
 *   ## TITLE
 *
 *   **Severity**: Medium · **CVSS 3.1**: 5.3 (`CVSS:3.1/...`) · **Status**: Confirmed · **Source**: nmap
 *
 *   **Affected**:
 *
 *   - host or domain per line
 *
 *   ### Description / Impact / Evidence / Recommendation / References
 *
 * Optional metadata keys: CVSS 4.0, Risk (impact=3, likelihood=4), Mapping, CWE, Retest, ID.
 * Several findings may live in one file; every `## ` heading starts a new one.
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Diagnostic {
  level: 'error' | 'warning';
  message: string;
  line?: number;      // 1-based line in the source file
  file?: string;
  finding?: string;   // finding title
}

export interface ParsedFinding {
  id?: string;
  title: string;
  severity?: Severity;          // explicit severity, as written
  severityRaw?: string;
  status: string;
  source?: string;
  cvss31?: { vector: string; score?: number };
  cvss40?: { vector: string; score?: number };
  risk?: { impact: number; likelihood: number };
  mapping: string[];
  cwe: string[];
  retest?: { status: string; note?: string };
  affected: string[];
  sections: Record<string, string>; // description, impact, evidence, recommendation, references, + extra
  extraMeta: Record<string, string>;
  line: number;                     // start line (1-based)
  file?: string;
}

export interface ParseResult {
  findings: ParsedFinding[];
  diagnostics: Diagnostic[];
}

const SECTION_ALIASES: Record<string, string> = {
  description: 'description', beschrijving: 'description', omschrijving: 'description',
  impact: 'impact', risico: 'impact',
  evidence: 'evidence', bewijs: 'evidence', 'proof of concept': 'evidence', poc: 'evidence',
  recommendation: 'recommendation', recommendations: 'recommendation', aanbeveling: 'recommendation', aanbevelingen: 'recommendation', oplossing: 'recommendation', remediation: 'recommendation',
  references: 'references', referenties: 'references', bronnen: 'references',
  summary: 'summary', samenvatting: 'summary',
  likelihood: 'likelihood', kans: 'likelihood', waarschijnlijkheid: 'likelihood',
  classification: 'classification', classificatie: 'classification', 'toelichting op de classificatie': 'classification', 'toelichting classificatie': 'classification', rationale: 'classification',
  notes: 'notes', kanttekeningen: 'notes', opmerkingen: 'notes', remarks: 'notes',
};

const REQUIRED_SECTIONS = ['description', 'impact', 'evidence', 'recommendation'];

export function normalizeSeverity(raw: string): Severity | undefined {
  const s = raw.trim().toLowerCase();
  const map: Record<string, Severity> = {
    critical: 'critical', kritiek: 'critical', kritisch: 'critical',
    high: 'high', hoog: 'high',
    medium: 'medium', middel: 'medium', gemiddeld: 'medium', moderate: 'medium',
    low: 'low', laag: 'low',
    info: 'info', informational: 'info', informatief: 'info', informative: 'info', none: 'info',
  };
  return map[s];
}

const META_PAIR = /\*\*([^*]+?)\*\*\s*:\s*/g;

/** Parse one metadata line into key/value pairs. Pairs are separated by " · ", " | " or " - ". */
function parseMetaLine(line: string): Record<string, string> {
  const out: Record<string, string> = {};
  const matches = [...line.matchAll(META_PAIR)];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const key = m[1].trim().toLowerCase();
    const start = m.index! + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : line.length;
    let value = line.slice(start, end).trim();
    value = value.replace(/[\s·|\-–—]+$/u, '').trim();
    out[key] = value;
  }
  return out;
}

function parseCvss(value: string): { vector: string; score?: number } | undefined {
  const vec = value.match(/CVSS:(?:3\.[01]|4\.0)\/[A-Z]+:[A-Za-z](?:\/[A-Z]+:[A-Za-z])*/);
  if (!vec) return undefined;
  const score = value.match(/(\d{1,2}(?:\.\d)?)\s*\(/);
  return { vector: vec[0], score: score ? Number(score[1]) : undefined };
}

function parseRisk(value: string): { impact: number; likelihood: number } | undefined {
  const i = value.match(/impact\s*[=:]\s*(\d)/i);
  const l = value.match(/(?:likelihood|probability|waarschijnlijkheid|kans)\s*[=:]\s*(\d)/i);
  if (i && l) return { impact: Number(i[1]), likelihood: Number(l[1]) };
  const two = value.match(/^\s*(\d)\s*[x×\/]\s*(\d)\s*$/);
  if (two) return { impact: Number(two[1]), likelihood: Number(two[2]) };
  return undefined;
}

function splitList(value: string): string[] {
  return value.split(/[,;]/).map((s) => s.trim().replace(/^`|`$/g, '')).filter(Boolean);
}

export function parseFindings(src: string, file?: string): ParseResult {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const diagnostics: Diagnostic[] = [];
  const findings: ParsedFinding[] = [];

  // Split into chunks at "## " headings (outside fences)
  const chunks: Array<{ start: number; end: number }> = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(```|~~~)/.test(lines[i])) inFence = !inFence;
    if (!inFence && /^##\s+\S/.test(lines[i])) {
      if (chunks.length) chunks[chunks.length - 1].end = i;
      chunks.push({ start: i, end: lines.length });
    }
  }
  if (!chunks.length) {
    const nonEmpty = lines.some((l) => l.trim());
    if (nonEmpty) diagnostics.push({ level: 'error', message: 'Geen bevinding gevonden: een bevinding begint met een "## Titel"-kop.', file, line: 1 });
    return { findings, diagnostics };
  }
  if (lines.slice(0, chunks[0].start).some((l) => l.trim())) {
    diagnostics.push({ level: 'warning', message: 'Tekst vóór de eerste "## "-kop wordt genegeerd.', file, line: 1 });
  }

  for (const chunk of chunks) {
    const f = parseChunk(lines, chunk.start, chunk.end, diagnostics, file);
    if (f) findings.push(f);
  }
  return { findings, diagnostics };
}

function parseChunk(lines: string[], start: number, end: number, diags: Diagnostic[], file?: string): ParsedFinding | undefined {
  const title = lines[start].replace(/^##\s+/, '').replace(/\s*#+\s*$/, '').trim();
  const d = (level: Diagnostic['level'], message: string, line: number) => diags.push({ level, message, line: line + 1, file, finding: title });
  const f: ParsedFinding = { title, status: 'Confirmed', mapping: [], cwe: [], affected: [], sections: {}, extraMeta: {}, line: start + 1, file };

  let i = start + 1;
  let inFence = false;
  // Preamble: metadata lines and the Affected list, until the first "### "
  const preamble: number[] = [];
  while (i < end) {
    if (/^\s*(```|~~~)/.test(lines[i])) inFence = !inFence;
    if (!inFence && /^###\s+\S/.test(lines[i])) break;
    preamble.push(i);
    i++;
  }

  let affectedMode = false;
  let sawMeta = false;
  for (const li of preamble) {
    const line = lines[li];
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^\*\*affected\*\*\s*:?/i.test(trimmed) || /^\*\*(getroffen|betreft)\*\*\s*:?/i.test(trimmed)) {
      affectedMode = true;
      const rest = trimmed.replace(/^\*\*[^*]+\*\*\s*:?\s*/, '');
      if (rest) f.affected.push(...splitList(rest));
      continue;
    }
    if (affectedMode && /^[-*+]\s+/.test(trimmed)) {
      f.affected.push(trimmed.replace(/^[-*+]\s+/, '').replace(/^`|`$/g, '').trim());
      continue;
    }
    if (/^\*\*[^*]+\*\*\s*:/.test(trimmed)) {
      affectedMode = false;
      sawMeta = true;
      const meta = parseMetaLine(trimmed);
      for (const [key, value] of Object.entries(meta)) applyMeta(f, key, value, (m) => d('warning', m, li));
      continue;
    }
    d('warning', `Onverwachte regel in de kop van de bevinding, wordt genegeerd: "${trimmed.slice(0, 60)}"`, li);
  }
  if (!sawMeta) d('warning', 'Geen metadata-regel gevonden (**Severity**: … · **Status**: …).', start);
  if (!f.severity && !f.cvss31 && !f.cvss40 && !f.risk) d('error', 'Geen severity, CVSS-vector of risico-waarde opgegeven.', start);
  if (!f.affected.length) d('warning', 'Geen "Affected"-lijst opgegeven.', start);

  // Sections
  let current: string | undefined;
  let buf: string[] = [];
  const flush = () => {
    if (current !== undefined) {
      const text = buf.join('\n').replace(/^\n+|\n+$/g, '');
      if (f.sections[current]) f.sections[current] += '\n\n' + text; else f.sections[current] = text;
    }
    buf = [];
  };
  inFence = false;
  for (; i < end; i++) {
    const line = lines[i];
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const h = !inFence && line.match(/^###\s+(.+?)\s*#*\s*$/);
    if (h) {
      flush();
      const name = h[1].trim().toLowerCase();
      current = SECTION_ALIASES[name] ?? name;
      if (!SECTION_ALIASES[name]) d('warning', `Onbekende sectie "### ${h[1].trim()}" wordt als extra sectie opgenomen.`, i);
      continue;
    }
    buf.push(line);
  }
  flush();
  for (const s of REQUIRED_SECTIONS) {
    if (!f.sections[s] || !f.sections[s].trim()) d(s === 'evidence' ? 'warning' : 'error', `Sectie "${s}" ontbreekt of is leeg.`, start);
  }
  return f;
}

function applyMeta(f: ParsedFinding, key: string, value: string, warn: (m: string) => void) {
  switch (key) {
    case 'severity': case 'ernst': case 'risico': {
      f.severityRaw = value;
      const sev = normalizeSeverity(value);
      if (sev) f.severity = sev; else warn(`Onbekende severity "${value}" (gebruik Critical/High/Medium/Low/Info).`);
      break;
    }
    case 'cvss': case 'cvss 3.1': case 'cvss3.1': case 'cvss 3': case 'cvss3': {
      const c = parseCvss(value);
      if (c && c.vector.startsWith('CVSS:4.0')) f.cvss40 = c;
      else if (c) f.cvss31 = c;
      else warn(`CVSS-waarde zonder geldige vector: "${value}".`);
      break;
    }
    case 'cvss 4.0': case 'cvss4.0': case 'cvss 4': case 'cvss4': {
      const c = parseCvss(value);
      if (c) f.cvss40 = c; else warn(`CVSS 4.0-waarde zonder geldige vector: "${value}".`);
      break;
    }
    case 'risk': case 'risico-matrix': case 'matrix': {
      const r = parseRisk(value);
      if (r) f.risk = r; else warn(`Risk-waarde niet herkend: "${value}" (gebruik impact=3, likelihood=4).`);
      break;
    }
    case 'status': f.status = value; break;
    case 'source': case 'bron': f.source = value; break;
    case 'mapping': case 'standards': case 'standaarden': f.mapping.push(...splitList(value)); break;
    case 'cwe': f.cwe.push(...splitList(value).map((c) => (/^\d+$/.test(c) ? `CWE-${c}` : c.toUpperCase()))); break;
    case 'retest': case 'hertest': {
      const m = value.match(/^([A-Za-z\- ]+?)(?:\s*[:(\-–]\s*(.*?))?\)?$/);
      f.retest = { status: (m?.[1] ?? value).trim().toLowerCase().replace(/\s+/g, '-'), note: m?.[2]?.trim() || undefined };
      break;
    }
    case 'id': case 'ref': f.id = value.replace(/`/g, ''); break;
    default: f.extraMeta[key] = value;
  }
}
