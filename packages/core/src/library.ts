/**
 * The bundled finding library: modules/library/<lang>/*.md, one finding per
 * file in the markdown contract, plus a `**Tags**:` meta field that becomes
 * the library tags (it is stripped from the stored markdown).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseFindings, type Diagnostic } from '@reportforge/markdown';

export interface LibraryEntry {
  file: string;
  language: string;
  title: string;
  severity: string;
  tags: string;
  markdown: string;
  diagnostics: Diagnostic[];
}

export function libraryLanguages(root: string): string[] {
  const dir = join(root, 'modules/library');
  return existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort() : [];
}

/** Strip the `**Tags**: …` field from the meta line (renderers ignore it, but the stored finding should be clean). */
export function stripTags(markdown: string): { markdown: string; tags: string } {
  let tags = '';
  const out = markdown.replace(/^(\*\*[^\n]*)$/m, (line) => {
    if (!/\*\*Tags\*\*:/.test(line)) return line;
    const parts = line.split(/\s+·\s+/);
    const kept = parts.filter((p) => { const m = p.match(/^\*\*Tags\*\*:\s*(.*)$/); if (m) { tags = m[1].trim(); return false; } return true; });
    return kept.join(' · ');
  });
  return { markdown: out, tags };
}

export function loadLibrary(root: string, language: string): LibraryEntry[] {
  const dir = join(root, 'modules/library', language);
  if (!existsSync(dir)) return [];
  const entries: LibraryEntry[] = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
    const raw = readFileSync(join(dir, file), 'utf8');
    const { markdown, tags } = stripTags(raw);
    const parsed = parseFindings(markdown, file);
    const f = parsed.findings[0];
    entries.push({
      file, language, tags, markdown,
      title: f?.title ?? file,
      severity: f?.severity ?? 'medium',
      diagnostics: parsed.diagnostics.concat(parsed.findings.length !== 1 ? [{ level: 'error', message: `Bibliotheekbestand bevat ${parsed.findings.length} bevindingen; verwacht 1.`, file }] : []),
    });
  }
  return entries;
}
