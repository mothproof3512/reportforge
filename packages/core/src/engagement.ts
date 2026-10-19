/**
 * Loads an engagement folder:
 *
 *   engagement.yaml        metadata, scope, texts (markdown inline or "file.md")
 *   findings/*.md          findings in the markdown contract (one or more per file)
 *   images/                screenshots referenced from the findings
 *   theme/theme.yaml       optional engagement-local theme override
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname, isAbsolute } from 'node:path';
import { z } from 'zod';
import sharp from 'sharp';
import { parseFindings, type Diagnostic, type ParsedFinding } from '@reportforge/markdown';
import { assess, SEVERITY_RANK, type Severity } from '@reportforge/risk';
import { readYaml, resolveMapping } from './modules.ts';
import { resolveTheme } from './theme.ts';
import type { Engagement, Finding, ImageInfo, Modules, ReportContext, Lang } from './types.ts';

const person = z.object({ name: z.string(), role: z.string().optional(), email: z.string().optional() });
const dateStr = z.union([z.string(), z.date()]).transform((d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d));

export const EngagementSchema = z.object({
  reference: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  language: z.enum(['nl', 'en']).default('nl'),
  theme: z.string().default('_default'),
  template: z.string().default('pentest-report'),
  risk_model: z.enum(['cvss31', 'cvss40', 'matrix']).default('cvss31'),
  type: z.string().optional(),
  version: z.union([z.string(), z.number()]).transform(String).default('1.0'),
  date: dateStr,
  classification: z.string().optional(),
  status: z.string().optional(),
  client: z.object({ name: z.string(), contact: z.array(person).optional(), address: z.array(z.string()).optional() }),
  provider: z.object({ name: z.string(), address: z.array(z.string()).optional(), website: z.string().optional(), email: z.string().optional(), phone: z.string().optional() }).optional(),
  period: z.object({ start: dateStr, end: dateStr }),
  authors: z.array(person).default([]),
  testers: z.array(person).optional(),
  reviewers: z.array(person).optional(),
  scope: z.array(z.object({ asset: z.string(), type: z.string().optional(), description: z.string().optional(), environment: z.string().optional() })).default([]),
  out_of_scope: z.array(z.string()).optional(),
  standards: z.array(z.string()).default([]),
  tools: z.array(z.object({ name: z.string(), version: z.union([z.string(), z.number()]).transform(String).optional(), purpose: z.string().optional() })).optional(),
  test_approach: z.string().optional(),
  executive_summary: z.string().optional(),
  conclusion: z.string().optional(),
  limitations: z.string().optional(),
  recommendations: z.string().optional(),
  document_history: z.array(z.object({ version: z.union([z.string(), z.number()]).transform(String), date: dateStr, author: z.string(), change: z.string() })).optional(),
  retest: z.object({ of_version: z.string(), date: dateStr }).optional(),
}).passthrough();

export interface LoadResult {
  ctx: ReportContext;
  diagnostics: Diagnostic[];
  dir: string;
}

const MD_FIELDS = ['test_approach', 'executive_summary', 'conclusion', 'limitations', 'recommendations'];

function readMdField(dir: string, value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  if (/^[\w./-]+\.md$/.test(v) && existsSync(join(dir, v))) return readFileSync(join(dir, v), 'utf8');
  return value;
}

export async function loadEngagement(mods: Modules, engagementDir: string, opts: { lang?: Lang; document?: string; template?: string; theme?: string } = {}): Promise<LoadResult> {
  const dir = resolve(engagementDir);
  const file = join(dir, 'engagement.yaml');
  if (!existsSync(file)) throw new Error(`Geen engagement.yaml in ${dir}`);
  const diagnostics: Diagnostic[] = [];
  const parsed = EngagementSchema.safeParse(readYaml(file));
  if (!parsed.success) {
    throw new Error('engagement.yaml ongeldig:\n' + parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n'));
  }
  const eng = parsed.data as unknown as Engagement;
  for (const f of MD_FIELDS) (eng as any)[f] = readMdField(dir, (eng as any)[f]);
  const lang = opts.lang ?? eng.language;

  // Theme
  const themeRef = opts.theme ?? (existsSync(join(dir, 'theme', 'theme.yaml')) && eng.theme === '_default' ? join(dir, 'theme') : eng.theme);
  const { theme, warnings: tw } = resolveTheme(mods, themeRef, dir);
  for (const w of tw) diagnostics.push({ level: 'warning', message: w.message, file: 'theme' });
  if (eng.provider) theme.provider = { ...theme.provider, ...eng.provider };

  // Template
  const templateId = opts.template ?? eng.template;
  const template = mods.templates[templateId];
  if (!template) throw new Error(`Sjabloon "${templateId}" niet gevonden (beschikbaar: ${Object.keys(mods.templates).join(', ')})`);

  // Standards
  const standards = eng.standards.map((id) => {
    const s = mods.standards[id];
    if (!s) diagnostics.push({ level: 'warning', message: `Standaard "${id}" niet gevonden in modules/standards.`, file: 'engagement.yaml' });
    return s;
  }).filter(Boolean);

  // Findings
  const findingsDir = join(dir, 'findings');
  const parsedFindings: ParsedFinding[] = [];
  if (existsSync(findingsDir)) {
    for (const f of readdirSync(findingsDir).filter((f) => f.endsWith('.md')).sort()) {
      const p = join(findingsDir, f);
      const r = parseFindings(readFileSync(p, 'utf8'), p);
      diagnostics.push(...r.diagnostics);
      parsedFindings.push(...r.findings);
    }
  } else {
    diagnostics.push({ level: 'warning', message: 'Geen findings/-map gevonden.', file: dir });
  }

  const images: Record<string, ImageInfo> = {};
  const findings: Finding[] = [];
  for (const pf of parsedFindings) {
    let risk;
    try {
      risk = assess(eng.risk_model, { cvss31: pf.cvss31, cvss40: pf.cvss40, risk: pf.risk, severity: pf.severity });
    } catch (e: any) {
      diagnostics.push({ level: 'error', message: `Risico kon niet bepaald worden: ${e.message}`, file: pf.file, line: pf.line, finding: pf.title });
      continue;
    }
    for (const w of risk.warnings) diagnostics.push({ level: 'warning', message: w, file: pf.file, line: pf.line, finding: pf.title });
    const mapping = pf.mapping.map((raw) => resolveMapping(mods, raw, eng.standards) ?? ({ standard: '', item: raw, raw } as any));
    for (const m of mapping) if (!m.standard) diagnostics.push({ level: 'warning', message: `Mapping "${m.raw}" is in geen enkele standaard gevonden.`, file: pf.file, line: pf.line, finding: pf.title });
    findings.push({
      id: pf.id ?? '', index: 0, title: pf.title, severity: risk.severity, status: pf.status, source: pf.source, risk,
      affected: pf.affected, sections: pf.sections, mapping, cwe: pf.cwe, retest: pf.retest, file: pf.file, line: pf.line,
    });
    // images
    for (const md of Object.values(pf.sections)) {
      for (const m of md.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
        const url = m[1];
        if (images[url] || /^https?:/.test(url)) continue;
        const abs = isAbsolute(url) ? url : [join(dirname(pf.file ?? dir), url), join(dir, url)].find((p) => existsSync(p));
        if (!abs || !existsSync(abs)) { diagnostics.push({ level: 'error', message: `Afbeelding niet gevonden: ${url}`, file: pf.file, line: pf.line, finding: pf.title }); continue; }
        try {
          const meta = await sharp(abs).metadata();
          images[url] = { abs, width: meta.width ?? 0, height: meta.height ?? 0, format: meta.format ?? '', bytes: statSync(abs).size };
        } catch (e: any) {
          diagnostics.push({ level: 'error', message: `Afbeelding onleesbaar: ${url} (${e.message})`, file: pf.file, line: pf.line, finding: pf.title });
        }
      }
    }
  }

  // Order: severity, then score desc, then title; number F-01..
  findings.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || (b.risk.score ?? 0) - (a.risk.score ?? 0) || a.title.localeCompare(b.title));
  findings.forEach((f, i) => { f.index = i + 1; if (!f.id) f.id = `F-${String(i + 1).padStart(2, '0')}`; });
  const dup = findings.map((f) => f.id).filter((id, i, a) => a.indexOf(id) !== i);
  for (const d of new Set(dup)) diagnostics.push({ level: 'error', message: `Dubbel bevindings-ID ${d}.` });

  const sevs: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
  const bySeverity = Object.fromEntries(sevs.map((s) => [s, findings.filter((f) => f.severity === s).length])) as Record<Severity, number>;
  const isOpen = (f: Finding) => !f.retest || !['resolved', 'opgelost', 'fixed', 'closed'].includes(f.retest.status);
  const openBySeverity = Object.fromEntries(sevs.map((s) => [s, findings.filter((f) => f.severity === s && isOpen(f)).length])) as Record<Severity, number>;
  const byStatus: Record<string, number> = {};
  for (const f of findings) byStatus[f.status] = (byStatus[f.status] ?? 0) + 1;

  // Coverage: checklist states from the test plan, joined with findings mapped to the same item
  const coverage: ReportContext['coverage'] = [];
  for (const cl of eng.testplan?.checklists ?? []) {
    const std = mods.standards[cl.standard];
    if (!std) { diagnostics.push({ level: 'warning', message: `Checklist verwijst naar onbekende standaard "${cl.standard}".`, file: 'engagement.yaml' }); continue; }
    for (const it of cl.items ?? []) {
      const def = std.items.find((x) => x.id === it.id);
      const mapped = findings.filter((f) => f.mapping.some((m) => m.standard === cl.standard && m.item === it.id)).map((f) => f.id);
      coverage.push({ standard: cl.standard, item: it.id, title: def?.title ?? it.id, category: def?.category, status: mapped.length ? 'finding' : it.status ?? 'not-tested', note: it.note, findings: mapped });
    }
  }

  const ctx: ReportContext = {
    document: opts.document ?? template.document, lang, engagement: eng, theme, template, findings,
    stats: { total: findings.length, bySeverity, openBySeverity, byStatus, highest: findings[0]?.severity },
    standards, images, coverage,
    generated: { at: new Date().toISOString(), tool: 'reportforge 0.1.0' },
  };
  return { ctx, diagnostics, dir };
}
