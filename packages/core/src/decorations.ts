/**
 * Page decorations: derive a render-ready file per layer. Typst's image()
 * has no opacity, blur or recolouring, so those are baked into the file:
 *   SVG  → wrapped in <g opacity filter=blur>, fills/strokes replaced by the tint
 *   PNG/JPG → sharp: tint (for black-on-transparent shapes), blur, alpha
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import type { Decoration } from './types.ts';

export async function deriveDecoration(d: Decoration, outDir: string): Promise<string> {
  const ext = extname(d.src!).toLowerCase();
  const key = createHash('sha1').update(JSON.stringify({ src: d.src, tint: d.tint, opacity: d.opacity, blur: d.blur })).update(readFileSync(d.src!)).digest('hex').slice(0, 16);
  // a blurred SVG is slow to rasterise on every page in Typst, so it is pre-rendered to PNG once
  const blurred = !!(d.blur && d.blur > 0);
  const out = join(outDir, `${key}${ext === '.svg' && !blurred ? '.svg' : '.png'}`);
  mkdirSync(outDir, { recursive: true });
  if (existsSync(out)) return out;
  if (ext === '.svg') {
    let svg = readFileSync(d.src!, 'utf8');
    const tint = d.tint ?? '#000000';
    // recolour: every explicit fill/stroke colour (not "none"/url) becomes the tint; bare shapes default to black fill → set a root fill
    svg = svg.replace(/(fill|stroke)=(["'])(?!none|url\()[^"']*\2/g, `$1=$2${tint}$2`).replace(/(fill|stroke)\s*:\s*(?!none|url\()[^;"']+/g, `$1: ${tint}`);
    const open = svg.match(/<svg\b[^>]*>/);
    if (!open) return d.src!;
    const blur = d.blur && d.blur > 0 ? `<defs><filter id="rf-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${d.blur}"/></filter></defs>` : '';
    const g = `<g opacity="${d.opacity ?? 0.1}"${blur ? ' filter="url(#rf-blur)"' : ''} fill="${tint}">`;
    const body = svg.slice(open.index! + open[0].length).replace(/<\/svg>\s*$/, '');
    svg = open[0] + blur + g + body + '</g></svg>';
    if (!blurred) { writeFileSync(out, svg); return out; }
    const sharp = (await import('sharp')).default;
    await sharp(Buffer.from(svg), { density: 300 }).resize({ width: 2400, withoutEnlargement: false }).png().toFile(out);
    return out;
  }
  const sharp = (await import('sharp')).default;
  let img = sharp(d.src!).ensureAlpha();
  if (d.tint) { const [r, g, b] = [1, 3, 5].map((i) => parseInt(d.tint!.slice(i, i + 2), 16)); img = img.tint({ r, g, b }); }
  if (d.blur && d.blur > 0) img = img.blur(d.blur);
  // opacity: scale the alpha channel
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const op = d.opacity ?? 0.1;
  for (let i = 3; i < data.length; i += 4) data[i] = Math.round(data[i] * op);
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(out);
  return out;
}
