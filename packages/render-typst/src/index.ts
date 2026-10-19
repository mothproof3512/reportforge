/**
 * ReportContext → Typst project → PDF.
 *
 * Generated files (inside <root>/.rf-cache/build/<ref>/):
 *   theme.typ   `theme` dictionary (colours as rgb(), assets as build-relative paths)
 *   ctx.typ     `ctx` and `t` dictionaries; markdown fields become content blocks
 *   main.typ    page setup + one call per template block
 */
import { mkdirSync, writeFileSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { join, relative, basename, extname } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { markdownToTypst, typstString } from '@reportforge/markdown';
import { buildDictionary, formatDate, severityLabel, type Modules, type ReportContext, type Lang } from '@reportforge/core';

export interface TypstRenderOptions {
  typstBin?: string;
  keepBuild?: boolean;
  /** Extra Typst `--input key=value` pairs. */
  inputs?: Record<string, string>;
}

export interface TypstRenderResult {
  pdf: string;
  buildDir: string;
  mainTyp: string;
  warnings: string[];
}

const MARKDOWN_PATHS = [
  /^engagement\.(test_approach|executive_summary|conclusion|limitations|recommendations)$/,
  /^findings\.\d+\.sections\.[^.]+$/,
  /^findings\.\d+\.retest\.note$/,
  /^theme\.texts\.[^.]+\.(nl|en)$/,
  /^engagement\.scope\.\d+\.description$/,
  /^engagement\.intake\.(goal|background|credentials|preconditions|notes)$/,
  /^engagement\.testplan\.(approach|go_nogo)$/,
  /^engagement\.testplan\.per_scope\.\d+\.approach$/,
  /^engagement\.testplan\.planning\.\d+\.notes$/,
  /^engagement\.attestation\.(statement|scope_note|conclusion)$/,
];

const TYPST_KEYWORDS = new Set(['for', 'in', 'let', 'if', 'else', 'not', 'and', 'or', 'none', 'auto', 'true', 'false', 'import', 'include', 'set', 'show', 'return', 'while', 'break', 'continue', 'as', 'context']);
function isIdent(k: string) { return /^[A-Za-z_][A-Za-z0-9_-]*$/.test(k) && !TYPST_KEYWORDS.has(k); }

export class TypstSerializer {
  constructor(private md: (s: string) => string, private colorPaths: RegExp[] = []) {}
  value(v: unknown, path = ''): string {
    if (v === null || v === undefined) return 'none';
    if (typeof v === 'string') {
      if (MARKDOWN_PATHS.some((re) => re.test(path))) return `[\n${this.md(v)}\n]`;
      if (this.colorPaths.some((re) => re.test(path)) && /^#[0-9a-fA-F]{6}$/.test(v)) return `rgb(${typstString(v)})`;
      return typstString(v);
    }
    if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'none';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (Array.isArray(v)) {
      if (v.length === 0) return '()';
      const items = v.map((x, i) => this.value(x, `${path}.${i}`));
      return `(${items.join(', ')}${items.length === 1 ? ',' : ''})`;
    }
    if (typeof v === 'object') {
      const entries = Object.entries(v as Record<string, unknown>).filter(([, x]) => x !== undefined);
      if (!entries.length) return '(:)';
      return `(\n${entries.map(([k, x]) => `  ${isIdent(k) ? k : typstString(k)}: ${this.value(x, path ? `${path}.${k}` : k)},`).join('\n')}\n)`;
    }
    return 'none';
  }
}

export function renderTypst(mods: Modules, ctx: ReportContext, outPdf: string, opts: TypstRenderOptions = {}): TypstRenderResult {
  const typstBin = opts.typstBin ?? process.env.TYPST_BIN ?? 'typst';
  const buildDir = join(mods.root, '.rf-cache', 'build', ctx.engagement.reference.replace(/[^\w.-]+/g, '_'), ctx.document);
  rmSync(buildDir, { recursive: true, force: true });
  mkdirSync(join(buildDir, 'assets'), { recursive: true });
  const warnings: string[] = [];
  // Typst resolves image paths relative to the *calling* file (rf.typ), so use root-absolute paths
  const assetBase = '/' + relative(mods.root, buildDir).replace(/\\/g, '/') + '/assets/';

  // Images: copy into the build dir with stable names; markdown refers to them by url
  const imageMap: Record<string, { path: string; width: number; height: number }> = {};
  let n = 0;
  for (const [url, info] of Object.entries(ctx.images)) {
    const name = `img-${String(++n).padStart(3, '0')}-${basename(info.abs).replace(/[^\w.-]+/g, '_')}`;
    copyFileSync(info.abs, join(buildDir, 'assets', name));
    imageMap[url] = { path: assetBase + name, width: info.width, height: info.height };
  }
  const resolveImage = (url: string) => imageMap[url];
  const md = (s: string) => markdownToTypst(s, { resolveImage });

  // Theme assets
  const assets: Record<string, string> = {};
  for (const [k, abs] of Object.entries(ctx.theme.assets)) {
    if (!abs) continue;
    const name = `theme-${k}${extname(abs)}`;
    copyFileSync(abs, join(buildDir, 'assets', name));
    assets[k] = assetBase + name;
  }
  const textWidthMm = pageTextWidthMm(ctx.theme.page);
  const themeData = {
    id: ctx.theme.id, name: ctx.theme.name, version: ctx.theme.version,
    provider: ctx.theme.provider, colors: ctx.theme.colors,
    fonts: { body: ctx.theme.fonts.body, heading: ctx.theme.fonts.heading, mono: ctx.theme.fonts.mono, base_size: ctx.theme.fonts.base_size },
    page: { ...ctx.theme.page, text_width_mm: textWidthMm }, assets, texts: ctx.theme.texts, options: ctx.theme.options,
  };
  const ser = new TypstSerializer(md, [/^theme\.colors\./]);
  writeFileSync(join(buildDir, 'theme.typ'), `#let theme = ${ser.value(themeData, 'theme')}\n`);

  // Context
  const lang = ctx.lang as Lang;
  const eng = ctx.engagement;
  const dict = buildDictionary(mods, lang);
  const sevs = ['critical', 'high', 'medium', 'low', 'info'] as const;
  const ctxData = {
    document: ctx.document, lang, engagement: eng, findings: ctx.findings, stats: ctx.stats, standards: ctx.standards,
    coverage: ctx.coverage, generated: ctx.generated,
    fmt: {
      date: formatDate(eng.date, lang), period_start: formatDate(eng.period.start, lang), period_end: formatDate(eng.period.end, lang),
      retest_date: eng.retest ? formatDate(eng.retest.date, lang) : '',
      header_title: eng.title.length > 62 ? eng.title.slice(0, 60).replace(/\s+\S*$/, '') + '…' : eng.title,
      header_client: eng.client.name.length > 34 ? eng.client.name.slice(0, 32).replace(/\s+\S*$/, '') + '…' : eng.client.name,
      history: (eng.document_history ?? []).map((h) => ({ ...h, date: formatDate(h.date, lang) })),
    },
    severities: sevs.map((s) => ({ id: s, label: severityLabel(s, lang), count: ctx.stats.bySeverity[s], open: ctx.stats.openBySeverity[s] })),
  };
  const ctxSer = new TypstSerializer(md);
  const tData = { ...dict, severity: Object.fromEntries(sevs.map((s) => [s, severityLabel(s, lang)])) };
  writeFileSync(join(buildDir, 'ctx.typ'), [
    '#import "/modules/lib/rf.typ"',
    '#import "theme.typ": theme',
    `#let ctx = ${ctxSer.value(ctxData, '')}`,
    `#let t = ${new TypstSerializer((s) => s).value(tData, 't')}`,
    '',
  ].join('\n'));

  // Main
  const lines: string[] = [
    '#import "/modules/lib/rf.typ"',
    '#import "theme.typ": theme',
    '#import "ctx.typ": ctx, t',
    '#show: rf.setup.with(theme, ctx, t)',
    '',
  ];
  const imported = new Set<string>();
  for (const [i, tb] of ctx.template.blocks.entries()) {
    const block = mods.blocks[tb.type];
    if (!block) { warnings.push(`Blok "${tb.type}" bestaat niet; overgeslagen.`); continue; }
    if (!block.hasTypst) { warnings.push(`Blok "${tb.type}" heeft geen render.typ; overgeslagen.`); continue; }
    if (!block.manifest.documents.includes(ctx.document)) warnings.push(`Blok "${tb.type}" is niet bedoeld voor document "${ctx.document}".`);
    const alias = `blk_${tb.type.replace(/[^\w]/g, '_')}`;
    if (!imported.has(alias)) { lines.push(`#import "/${relative(mods.root, block.dir).replace(/\\/g, '/')}/render.typ" as ${alias}`); imported.add(alias); }
    const optsLit = new TypstSerializer((s) => s).value({ ...(block.manifest.options ?? {}), ...(tb.options ?? {}), _index: i });
    if (block.manifest.each === 'findings') {
      lines.push(`#for (i, f) in ctx.findings.enumerate() { ${alias}.render(ctx, theme, t, ${optsLit} + (item: f, item_index: i)) }`);
    } else {
      lines.push(`#${alias}.render(ctx, theme, t, ${optsLit})`);
    }
  }
  const mainTyp = join(buildDir, 'main.typ');
  writeFileSync(mainTyp, lines.join('\n') + '\n');

  // Compile
  const fontArgs = ctx.theme.fonts.dirs.flatMap((d) => ['--font-path', d]);
  const inputArgs = Object.entries(opts.inputs ?? {}).flatMap(([k, v]) => ['--input', `${k}=${v}`]);
  mkdirSync(join(outPdf, '..'), { recursive: true });
  const args = ['compile', '--root', mods.root, ...fontArgs, '--ignore-system-fonts', ...inputArgs, mainTyp, outPdf];
  const r = spawnSync(typstBin, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) {
    const err = new Error(`Typst compile mislukt:\n${r.stderr || r.stdout}`);
    (err as any).buildDir = buildDir;
    throw err;
  }
  for (const line of (r.stderr || '').split('\n')) if (line.trim().startsWith('warning')) warnings.push(line.trim());
  return { pdf: outPdf, buildDir, mainTyp, warnings };
}

export function typstVersion(typstBin = process.env.TYPST_BIN ?? 'typst'): string | undefined {
  try { return execFileSync(typstBin, ['--version'], { encoding: 'utf8' }).trim(); } catch { return undefined; }
}

const PAPER_WIDTH_MM: Record<string, number> = { a4: 210, 'us-letter': 215.9, letter: 215.9, a5: 148 };
function toMm(len: string): number {
  const m = String(len).trim().match(/^([\d.]+)\s*(mm|cm|in|pt)$/);
  if (!m) return 20;
  const v = Number(m[1]);
  return m[2] === 'mm' ? v : m[2] === 'cm' ? v * 10 : m[2] === 'in' ? v * 25.4 : v * 0.3528;
}
export function pageTextWidthMm(page: { size: string; margin: { left: string; right: string } }): number {
  const w = PAPER_WIDTH_MM[page.size.toLowerCase()] ?? 210;
  return Math.round((w - toMm(page.margin.left) - toMm(page.margin.right)) * 10) / 10;
}
