/**
 * Theme resolution: client theme.yaml layered over _default, colours derived
 * from `primary` where not given, contrast checked (WCAG) so a badly chosen
 * brand colour never produces unreadable text.
 */
import { existsSync } from 'node:fs';
import { join, resolve, isAbsolute } from 'node:path';
import { readYaml } from './modules.ts';
import type { Modules, ResolvedTheme, Severity, ThemeColors } from './types.ts';

export interface ThemeWarning { message: string }

// ---- colour maths -------------------------------------------------------
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`Ongeldige kleur "${hex}" (verwacht #RRGGBB)`);
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
}
export function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
/** Text colour (white or ink) that reads best on the given background. */
export function onColor(bg: string, ink = '#1A1D23'): string {
  return contrast(bg, '#FFFFFF') >= contrast(bg, ink) ? '#FFFFFF' : ink;
}
/** Darken until the colour has at least `ratio` contrast with white. */
export function ensureContrastOnWhite(hex: string, ratio = 4.5): string {
  let c = hex;
  for (let i = 0; i < 20 && contrast(c, '#FFFFFF') < ratio; i++) c = mix(c, '#000000', 0.08);
  return c;
}

const SEVERITY_DEFAULTS: Record<Severity, string> = {
  critical: '#7F1D1D', high: '#C2410C', medium: '#B7791F', low: '#1D4ED8', info: '#4B5563',
};

function deepMerge<T extends Record<string, any>>(base: T, over: Record<string, any> | undefined): T {
  if (!over) return { ...base };
  const out: Record<string, any> = { ...base };
  for (const [k, v] of Object.entries(over)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) out[k] = deepMerge(base[k], v);
    else if (v !== undefined && v !== null) out[k] = v;
  }
  return out as T;
}

export function resolveTheme(mods: Modules, themeRef: string, engagementDir?: string): { theme: ResolvedTheme; warnings: ThemeWarning[] } {
  const warnings: ThemeWarning[] = [];
  const defaultDir = mods.themes['_default'];
  if (!defaultDir) throw new Error('modules/themes/_default ontbreekt');
  let dir = mods.themes[themeRef];
  if (!dir) {
    const candidates = [isAbsolute(themeRef) ? themeRef : '', engagementDir ? resolve(engagementDir, themeRef) : '', resolve(mods.root, themeRef)].filter(Boolean);
    dir = candidates.find((c) => existsSync(join(c, 'theme.yaml'))) ?? '';
  }
  if (!dir) {
    warnings.push({ message: `Thema "${themeRef}" niet gevonden; standaardthema gebruikt.` });
    dir = defaultDir;
  }
  const base = readYaml<any>(join(defaultDir, 'theme.yaml'));
  const own = dir === defaultDir ? {} : readYaml<any>(join(dir, 'theme.yaml'));
  const raw = deepMerge(base, own);

  const primary = raw.colors?.primary ?? '#0F2A44';
  const ink = raw.colors?.ink ?? '#1A1D23';
  const c = raw.colors ?? {};
  const colors: ThemeColors = {
    primary,
    primaryDark: c.primaryDark ?? mix(primary, '#000000', 0.25),
    primaryLight: c.primaryLight ?? mix(primary, '#FFFFFF', 0.88),
    accent: c.accent ?? primary,
    ink,
    muted: c.muted ?? '#5B6472',
    rule: c.rule ?? '#D9DEE5',
    surface: c.surface ?? '#F4F6F9',
    codeBg: c.codeBg ?? '#F1F3F6',
    severity: { ...SEVERITY_DEFAULTS, ...(c.severity ?? {}) },
    severityText: {} as Record<Severity, string>,
  };
  for (const s of Object.keys(colors.severity) as Severity[]) {
    const bg = colors.severity[s];
    if (contrast(bg, '#FFFFFF') < 4.5 && contrast(bg, ink) < 4.5) {
      const fixed = ensureContrastOnWhite(bg);
      warnings.push({ message: `Severity-kleur ${s} (${bg}) heeft te weinig contrast; aangepast naar ${fixed}.` });
      colors.severity[s] = fixed;
    }
    colors.severityText[s] = onColor(colors.severity[s], ink);
  }
  if (contrast(colors.primary, '#FFFFFF') < 3) warnings.push({ message: `Primaire kleur ${colors.primary} is licht; koppen op wit krijgen de donkere variant.` });
  colors.headingColor = contrast(colors.primary, '#FFFFFF') >= 4.5 ? colors.primary : ensureContrastOnWhite(colors.primary);
  colors.onPrimary = onColor(colors.primary, ink);

  const fonts = raw.fonts ?? {};
  const fontDirs = [join(mods.root, 'assets/fonts'), join(defaultDir, 'fonts'), join(dir, 'fonts')].filter((d) => existsSync(d));
  const assets: ResolvedTheme['assets'] = {};
  for (const key of ['logo', 'logo_mono', 'cover_image', 'signature'] as const) {
    const v = raw.assets?.[key];
    if (!v) continue;
    const candidates = [join(dir, v), join(defaultDir, v), isAbsolute(v) ? v : ''].filter(Boolean);
    const found = candidates.find((p) => existsSync(p));
    if (found) assets[key] = found; else warnings.push({ message: `Asset ${key} "${v}" niet gevonden in thema ${themeRef}.` });
  }
  const theme: ResolvedTheme = {
    id: raw.id ?? themeRef, name: raw.name ?? themeRef, version: String(raw.version ?? '1'), dir,
    provider: raw.provider ?? { name: raw.name ?? themeRef },
    colors,
    fonts: { body: fonts.body ?? 'Inter', heading: fonts.heading ?? fonts.body ?? 'Inter', mono: fonts.mono ?? 'JetBrains Mono', dirs: fontDirs, base_size: fonts.base_size ?? '10pt' },
    page: deepMerge({ size: 'a4', margin: { top: '22mm', bottom: '22mm', left: '20mm', right: '20mm' }, number_format: '{page} / {total}', cover: 'band' }, raw.page),
    assets,
    texts: raw.texts ?? {},
    options: raw.options ?? {},
  };
  return { theme, warnings };
}
