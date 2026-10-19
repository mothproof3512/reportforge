/**
 * Module loader: reads modules/{blocks,templates,standards,themes,i18n}.
 * A module is a folder with a manifest; nothing in the core needs to change
 * to add one.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { Modules, BlockModule, BlockManifest, Template, Standard, Lang } from './types.ts';

export function readYaml<T = any>(file: string): T {
  return parseYaml(readFileSync(file, 'utf8')) as T;
}

function dirs(path: string): string[] {
  if (!existsSync(path)) return [];
  return readdirSync(path).filter((d) => !d.startsWith('.') && !d.startsWith('_') && statSync(join(path, d)).isDirectory()).sort();
}

export function loadModules(root: string): Modules {
  root = resolve(root);
  const mods: Modules = { root, blocks: {}, templates: {}, standards: {}, themes: {}, i18n: { nl: {}, en: {} } };

  for (const id of dirs(join(root, 'modules/blocks'))) {
    const dir = join(root, 'modules/blocks', id);
    const mf = join(dir, 'manifest.yaml');
    if (!existsSync(mf)) continue;
    const manifest = readYaml<BlockManifest>(mf);
    manifest.id = manifest.id ?? id;
    const i18n: Record<Lang, Record<string, string>> = { nl: {}, en: {} };
    for (const lang of ['nl', 'en'] as Lang[]) {
      const f = join(dir, 'i18n', `${lang}.yaml`);
      if (existsSync(f)) i18n[lang] = readYaml(f) ?? {};
    }
    const schemaFile = join(dir, 'schema.json');
    mods.blocks[manifest.id] = {
      manifest, dir, i18n,
      schema: existsSync(schemaFile) ? JSON.parse(readFileSync(schemaFile, 'utf8')) : undefined,
      hasTypst: existsSync(join(dir, 'render.typ')),
      hasDocx: existsSync(join(dir, 'render.docx.ts')),
    };
  }

  for (const id of dirs(join(root, 'modules/templates'))) {
    const dir = join(root, 'modules/templates', id);
    const f = join(dir, 'template.yaml');
    if (!existsSync(f)) continue;
    const t = readYaml<any>(f);
    mods.templates[t.id ?? id] = {
      id: t.id ?? id, name: t.name ?? id, document: t.document ?? 'report', dir,
      blocks: (t.blocks ?? []).map((b: any) => (typeof b === 'string' ? { type: b } : { type: b.type, options: b.options ?? Object.fromEntries(Object.entries(b).filter(([k]) => k !== 'type')) })),
    };
  }

  const stdDir = join(root, 'modules/standards');
  if (existsSync(stdDir)) {
    for (const f of readdirSync(stdDir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml')).sort()) {
      const s = readYaml<Standard>(join(stdDir, f));
      s.items = s.items ?? [];
      mods.standards[s.id] = s;
    }
  }

  for (const id of [...dirs(join(root, 'modules/themes')), ...(existsSync(join(root, 'modules/themes/_default')) ? ['_default'] : [])]) {
    if (existsSync(join(root, 'modules/themes', id, 'theme.yaml'))) mods.themes[id] = join(root, 'modules/themes', id);
  }

  for (const lang of ['nl', 'en'] as Lang[]) {
    const f = join(root, 'modules/i18n', `${lang}.yaml`);
    if (existsSync(f)) mods.i18n[lang] = readYaml(f) ?? {};
  }
  return mods;
}

/** Merge core i18n + every block's i18n into one dictionary for a language: t.core.*, t.blocks.<id>.* */
export function buildDictionary(mods: Modules, lang: Lang): Record<string, unknown> {
  const blocks: Record<string, unknown> = {};
  for (const [id, b] of Object.entries(mods.blocks)) blocks[id] = { ...b.i18n.en, ...b.i18n[lang] };
  return { ...mods.i18n.en, ...mods.i18n[lang], blocks };
}

/** Find the item of a standard that a mapping string refers to, e.g. "WSTG-ATHN-03" or "A07:2021". */
export function resolveMapping(mods: Modules, raw: string, preferred: string[] = []) {
  const needle = raw.trim();
  const order = [...preferred, ...Object.keys(mods.standards).filter((s) => !preferred.includes(s))];
  for (const sid of order) {
    const std = mods.standards[sid];
    if (!std) continue;
    const item = std.items.find((it) => it.id.toLowerCase() === needle.toLowerCase() || it.id.toLowerCase().endsWith(needle.toLowerCase()) || (needle.toLowerCase().startsWith(std.short.toLowerCase()) && needle.toLowerCase().replace(/^[a-z0-9 ]+[-: ]/, '') === it.id.toLowerCase()));
    if (item) return { standard: sid, item: item.id, title: item.title, url: item.url ?? std.url, raw };
  }
  return undefined;
}
