/**
 * Preflight: everything that can break a layout or embarrass you in front of
 * a client is caught here, before a renderer runs.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Modules, ReportContext } from '@reportforge/core';
import type { Diagnostic } from '@reportforge/markdown';

const LIMITS = {
  title: 110,
  findingTitle: 110,
  affected: 60,
  imageMaxBytes: 8 * 1024 * 1024,
  imageMinWidth: 300,
  imageTallRatio: 2.2,          // height/width above which a screenshot gets shrunk hard
  codeLineLength: 140,
  sectionChars: { description: 6000, impact: 4000, evidence: 40000, recommendation: 6000, references: 3000 } as Record<string, number>,
};

export function preflight(mods: Modules, ctx: ReportContext): Diagnostic[] {
  const d: Diagnostic[] = [];
  const eng = ctx.engagement;
  const warn = (message: string, extra: Partial<Diagnostic> = {}) => d.push({ level: 'warning', message, ...extra });
  const err = (message: string, extra: Partial<Diagnostic> = {}) => d.push({ level: 'error', message, ...extra });

  if (eng.title.length > LIMITS.title) warn(`Titel is ${eng.title.length} tekens; boven ${LIMITS.title} wordt het voorblad druk.`, { file: 'engagement.yaml' });
  if (!eng.classification) warn('Geen classificatie opgegeven (bijv. Vertrouwelijk).', { file: 'engagement.yaml' });
  if (eng.scope.length === 0) warn('Scope is leeg.', { file: 'engagement.yaml' });
  if (!eng.authors?.length) warn('Geen auteurs opgegeven.', { file: 'engagement.yaml' });
  if (!eng.client?.name) err('Naam van de eindklant ontbreekt.', { file: 'engagement.yaml' });
  if (!eng.executive_summary) warn('Geen executive_summary; er wordt een automatische samenvatting gebruikt.', { file: 'engagement.yaml' });
  if (!eng.conclusion) warn('Geen conclusion; er wordt een automatische conclusie gebruikt.', { file: 'engagement.yaml' });
  if (eng.period.start > eng.period.end) err('period.start ligt na period.end.', { file: 'engagement.yaml' });

  // Fonts the theme names must exist in the font dirs
  const fontFiles = ctx.theme.fonts.dirs.flatMap((dir) => (existsSync(dir) ? readdirSync(dir) : [])).map((f) => f.toLowerCase());
  for (const fam of new Set([ctx.theme.fonts.body, ctx.theme.fonts.heading, ctx.theme.fonts.mono])) {
    const key = fam.toLowerCase().replace(/\s+/g, '');
    if (!fontFiles.some((f) => f.replace(/[\s_-]+/g, '').includes(key))) err(`Lettertype "${fam}" niet gevonden in ${ctx.theme.fonts.dirs.join(', ')} (zet de .ttf/.otf in modules/themes/<thema>/fonts/).`, { file: 'theme' });
  }
  if (!ctx.theme.assets.logo) warn('Thema heeft geen logo; de naam van de aanbieder wordt als tekst getoond.', { file: 'theme' });

  // Template blocks exist and support this document type
  for (const tb of ctx.template.blocks) {
    const b = mods.blocks[tb.type];
    if (!b) { err(`Blok "${tb.type}" uit sjabloon ${ctx.template.id} bestaat niet.`); continue; }
    if (!b.manifest.documents.includes(ctx.document)) warn(`Blok "${tb.type}" is niet bedoeld voor "${ctx.document}".`);
  }

  for (const f of ctx.findings) {
    const at = { file: f.file, line: f.line, finding: f.title };
    if (f.title.length > LIMITS.findingTitle) warn(`Titel van ${f.id} is ${f.title.length} tekens (max ${LIMITS.findingTitle} voor een nette kop).`, at);
    if (f.affected.length > LIMITS.affected) warn(`${f.id} heeft ${f.affected.length} betrokken systemen; overweeg een bijlage of samenvatting (bijv. "12 hosts in 10.0.1.0/24").`, at);
    for (const [name, max] of Object.entries(LIMITS.sectionChars)) {
      const s = f.sections[name];
      if (s && s.length > max) warn(`Sectie "${name}" van ${f.id} is ${s.length} tekens (richtlijn max ${max}); overweeg in te korten of bewijs naar een bijlage te verplaatsen.`, at);
    }
    // Code blocks: very long lines are wrapped by the renderer, but flag them
    for (const s of Object.values(f.sections)) {
      const fences = [...s.matchAll(/```[^\n]*\n([\s\S]*?)```/g)];
      for (const m of fences) {
        const lines = m[1].split('\n');
        const long = lines.filter((l) => l.length > LIMITS.codeLineLength).length;
        if (long) warn(`${f.id}: codeblok bevat ${long} regel(s) langer dan ${LIMITS.codeLineLength} tekens; die worden afgebroken. Overweeg output in te korten.`, at);
        if (lines.length > 120) warn(`${f.id}: codeblok van ${lines.length} regels; overweeg alleen het relevante deel op te nemen.`, at);
      }
      if (/<(img|table|div|span)[\s>]/i.test(s)) warn(`${f.id}: HTML in markdown wordt als platte tekst getoond.`, at);
    }
    if (!f.mapping.length && ctx.standards.length) warn(`${f.id} heeft geen mapping naar een standaard (**Mapping**: …).`, at);
  }

  for (const [url, img] of Object.entries(ctx.images)) {
    if (img.bytes > LIMITS.imageMaxBytes) warn(`Afbeelding ${url} is ${(img.bytes / 1048576).toFixed(1)} MB; de PDF wordt groot.`);
    if (img.width && img.width < LIMITS.imageMinWidth) warn(`Afbeelding ${url} is maar ${img.width} px breed en wordt klein weergegeven.`);
    if (img.width && img.height / img.width > LIMITS.imageTallRatio) warn(`Afbeelding ${url} is erg hoog (${img.width}×${img.height}); hij wordt verkleind tot hij op een pagina past. Snij bij voorkeur bij.`);
    if (!['png', 'jpeg', 'jpg', 'svg', 'gif', 'webp'].includes(img.format)) err(`Afbeelding ${url} heeft formaat ${img.format}; gebruik PNG, JPEG of SVG.`);
  }
  return d;
}

export function formatDiagnostics(ds: Diagnostic[]): string {
  if (!ds.length) return '';
  const icon = (l: Diagnostic['level']) => (l === 'error' ? '✖' : '⚠');
  const loc = (x: Diagnostic) => [x.file ? x.file.split('/').slice(-2).join('/') : '', x.line ? `:${x.line}` : ''].join('') + (x.finding ? ` (${x.finding.slice(0, 40)})` : '');
  const sorted = [...ds].sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1));
  return sorted.map((x) => `${icon(x.level)} ${x.message}${loc(x) ? '  — ' + loc(x) : ''}`).join('\n');
}
