/**
 * Importer contract and shared helpers. An importer is a folder
 * modules/importers/<id>/ with manifest.yaml and import.ts exporting
 *   importFindings(input: Buffer, opts): ImportResult
 * Every importer produces findings in the markdown contract, so imported
 * findings go through exactly the same parser, assessment and renderers.
 */
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';

export interface ImportedFinding {
  markdown: string;
  title: string;
  severity: string;
  affected: string[];
  /** Same tool-issue across many hosts is grouped into one finding; this is the number of raw items merged. */
  merged: number;
}
export interface ImportResult { findings: ImportedFinding[]; warnings: string[]; tool: string }
export interface ImportOptions { lang?: 'nl' | 'en'; maxEvidenceChars?: number; minSeverity?: string }
export interface ImporterManifest { id: string; name: string; description?: string; formats: string[]; tool: string }
export interface Importer { manifest: ImporterManifest; dir: string; importFindings: (input: Buffer, opts: ImportOptions) => ImportResult | Promise<ImportResult> }

export async function loadImporters(root: string): Promise<Record<string, Importer>> {
  const dir = join(root, 'modules/importers');
  const out: Record<string, Importer> = {};
  if (!existsSync(dir)) return out;
  for (const id of readdirSync(dir).sort()) {
    const mf = join(dir, id, 'manifest.yaml');
    if (!existsSync(mf) || !existsSync(join(dir, id, 'import.ts'))) continue;
    const manifest = parseYaml(readFileSync(mf, 'utf8')) as ImporterManifest;
    manifest.id = manifest.id ?? id;
    const mod = await import(pathToFileURL(join(dir, id, 'import.ts')).href);
    out[manifest.id] = { manifest, dir: join(dir, id), importFindings: mod.importFindings };
  }
  return out;
}

// ---- helpers shared by importers ------------------------------------------
export const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
export const sevLabel = (s: string) => ({ critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', info: 'Info' } as Record<string, string>)[s] ?? 'Info';

export function escapeMd(s: string): string { return s.replace(/\r/g, '').trim(); }

/** Very small HTML → markdown for tool descriptions (Burp, Nessus "see also"). */
export function htmlToMarkdown(html: string): string {
  let s = html.replace(/\r/g, '');
  s = s.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>\s*/gi, '\n\n').replace(/<p[^>]*>/gi, '');
  s = s.replace(/<li[^>]*>/gi, '- ').replace(/<\/li>/gi, '\n').replace(/<\/?[uo]l[^>]*>/gi, '\n');
  s = s.replace(/<(b|strong)>/gi, '**').replace(/<\/(b|strong)>/gi, '**').replace(/<(i|em)>/gi, '*').replace(/<\/(i|em)>/gi, '*');
  s = s.replace(/<code>/gi, '`').replace(/<\/code>/gi, '`');
  s = s.replace(/<a[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/gi, (_, href, text) => (text.trim() && text.trim() !== href ? `[${text.trim()}](${href})` : href));
  s = s.replace(/<h\d[^>]*>/gi, '\n#### ').replace(/<\/h\d>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
  return s.split('\n').map((l) => l.trimEnd()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Cut an evidence block to a sensible size, keeping head and tail. */
export function clip(s: string, max = 3000): string {
  if (s.length <= max) return s;
  const head = s.slice(0, Math.floor(max * 0.7)), tail = s.slice(-Math.floor(max * 0.25));
  return `${head}\n[… ${s.length - head.length - tail.length} tekens weggelaten …]\n${tail}`;
}

export const fence = (body: string, lang = '') => '```' + lang + '\n' + body.replace(/```/g, "'''") .replace(/\n$/, '') + '\n```';

export interface FindingDraft {
  title: string; severity: string; status?: string; source: string;
  cvss31?: { vector: string; score?: number }; cvss40?: { vector: string; score?: number };
  mapping?: string[]; cwe?: string[]; affected: string[];
  description: string; impact?: string; evidence?: string; recommendation?: string; references?: string[];
  merged?: number;
}

/** Render a draft into the markdown contract. */
export function toMarkdown(d: FindingDraft, lang: 'nl' | 'en' = 'nl'): string {
  const meta: string[] = [`**Severity**: ${sevLabel(d.severity)}`];
  if (d.cvss31?.vector) meta.push(`**CVSS 3.1**: ${d.cvss31.score !== undefined ? d.cvss31.score.toFixed(1) : '0.0'} (\`${d.cvss31.vector}\`)`);
  if (d.cvss40?.vector) meta.push(`**CVSS 4.0**: ${d.cvss40.score !== undefined ? d.cvss40.score.toFixed(1) : '0.0'} (\`${d.cvss40.vector}\`)`);
  meta.push(`**Status**: ${d.status ?? 'Likely'}`, `**Source**: ${d.source}`);
  if (d.mapping?.length) meta.push(`**Mapping**: ${d.mapping.join(', ')}`);
  if (d.cwe?.length) meta.push(`**CWE**: ${d.cwe.map((c) => c.replace(/^CWE-/i, '')).join(', ')}`);
  const t = lang === 'en'
    ? { verify: 'Automatically imported; verify manually before reporting.', noImpact: 'To be described after manual verification.', noRec: 'To be described after manual verification.' }
    : { verify: 'Automatisch geïmporteerd; handmatig verifiëren voordat dit wordt gerapporteerd.', noImpact: 'Nader te beschrijven na handmatige verificatie.', noRec: 'Nader te beschrijven na handmatige verificatie.' };
  const lines = [
    `## ${d.title.trim()}`, '', meta.join(' · '), '', '**Affected**:', '',
    ...(d.affected.length ? d.affected.map((a) => `- ${a}`) : ['- ']), '',
    '### Description', '', (d.description || '').trim(), '', `_${t.verify}_`, '',
    '### Impact', '', (d.impact || t.noImpact).trim(), '',
    '### Evidence', '', (d.evidence || '').trim(), '',
    '### Recommendation', '', (d.recommendation || t.noRec).trim(), '',
    '### References', '', ...(d.references?.length ? d.references.map((r) => `- ${r}`) : ['- ']), '',
  ];
  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}

/** Minimal XML reader: enough for Burp and Nessus exports (no namespaces, no entities beyond the basic five). */
export interface XmlNode { name: string; attrs: Record<string, string>; children: XmlNode[]; text: string }
export function parseXml(src: string): XmlNode {
  const root: XmlNode = { name: '#root', attrs: {}, children: [], text: '' };
  const stack: XmlNode[] = [root];
  const re = /<!\[CDATA\[([\s\S]*?)\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/([\w:.-]+)\s*>|<([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  const decode = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&');
  while ((m = re.exec(src))) {
    const cur = stack[stack.length - 1];
    if (m[1] !== undefined) cur.text += m[1];
    else if (m[2]) { if (stack.length > 1) stack.pop(); }
    else if (m[3]) {
      const attrs: Record<string, string> = {};
      for (const a of (m[4] ?? '').matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1]] = decode(a[2] ?? a[3] ?? '');
      const node: XmlNode = { name: m[3], attrs, children: [], text: '' };
      cur.children.push(node);
      if (!m[5]) stack.push(node);
    } else if (m[6] !== undefined) cur.text += decode(m[6]);
  }
  return root;
}
export const findAll = (n: XmlNode, name: string): XmlNode[] => n.children.flatMap((c) => (c.name === name ? [c] : []).concat(findAll(c, name)));
export const child = (n: XmlNode, name: string): XmlNode | undefined => n.children.find((c) => c.name === name);
export const childText = (n: XmlNode, name: string): string => (child(n, name)?.text ?? '').trim();
