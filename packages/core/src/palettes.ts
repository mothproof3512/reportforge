/**
 * Colour palettes: modules/palettes/*.yaml. A palette is a set of named
 * combinations with a suggested role mapping (primary / accent / surface) so a
 * theme can adopt one with a single click. Shipped: Sanzo Wada's
 * "A Dictionary of Color Combinations" (1933).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { mix } from './theme.ts';

export interface PaletteCombination { number: number; top?: number; colors: Array<{ name: string; hex: string }>; roles?: { primary: string; accent: string; surface?: string }; report_fit?: number }
export interface Palette { id: string; name: string; year?: number; colors?: number; combinations: PaletteCombination[] }

export function loadPalettes(root: string): Palette[] {
  const dir = join(root, 'modules/palettes');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort().map((f) => parse(readFileSync(join(dir, f), 'utf8')) as Palette);
}

/** Theme colours for a combination: primary and accent as suggested, light fills as a soft tint of the lightest colour. */
export function paletteToThemeColors(c: PaletteCombination): { primary: string; accent: string; surface: string; calloutBg: string } {
  const roles = c.roles ?? { primary: c.colors[0].hex, accent: (c.colors[1] ?? c.colors[0]).hex };
  const light = roles.surface ?? roles.primary;
  return { primary: roles.primary, accent: roles.accent, surface: mix(light, '#FFFFFF', 0.92), calloutBg: mix(light, '#FFFFFF', 0.94) };
}
