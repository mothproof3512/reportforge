import { toMarkdown, clip, fence, type ImportResult, type ImportOptions, type FindingDraft, SEV_ORDER } from '@reportforge/importers';

interface NucleiResult { 'template-id'?: string; templateID?: string; 'template-path'?: string; info?: any; type?: string; host?: string; 'matched-at'?: string; matched?: string; ip?: string; timestamp?: string; 'curl-command'?: string; request?: string; response?: string; 'extracted-results'?: string[]; 'matcher-name'?: string }

export function importFindings(input: Buffer, opts: ImportOptions = {}): ImportResult {
  const text = input.toString('utf8').trim();
  const warnings: string[] = [];
  let items: NucleiResult[] = [];
  try {
    if (text.startsWith('[')) items = JSON.parse(text);
    else items = text.split('\n').filter((l) => l.trim()).map((l, i) => { try { return JSON.parse(l); } catch { warnings.push(`Regel ${i + 1} is geen geldige JSON en is overgeslagen.`); return null; } }).filter(Boolean) as NucleiResult[];
  } catch (e: any) { throw new Error('Geen geldige Nuclei JSON/JSONL: ' + e.message); }
  const groups = new Map<string, NucleiResult[]>();
  for (const it of items) { const k = it['template-id'] ?? it.templateID ?? it.info?.name ?? 'unknown'; groups.set(k, [...(groups.get(k) ?? []), it]); }
  const findings = [] as ImportResult['findings'];
  for (const [tid, rs] of groups) {
    const info = rs[0].info ?? {};
    const sev = String(info.severity ?? 'info').toLowerCase();
    const severity = SEV_ORDER[sev] !== undefined ? sev : sev === 'unknown' ? 'info' : 'info';
    if (opts.minSeverity && SEV_ORDER[severity] > SEV_ORDER[opts.minSeverity]) continue;
    const affected = [...new Set(rs.map((r) => r['matched-at'] ?? r.matched ?? r.host ?? '').filter(Boolean))];
    const cls = info.classification ?? {};
    const cvss = typeof cls['cvss-metrics'] === 'string' && cls['cvss-metrics'].startsWith('CVSS:3') ? { vector: cls['cvss-metrics'], score: Number(cls['cvss-score']) || undefined } : undefined;
    const cwe = ([] as string[]).concat(cls['cwe-id'] ?? []).map(String);
    const refs = ([] as string[]).concat(info.reference ?? []).map(String);
    const cves = ([] as string[]).concat(cls['cve-id'] ?? []).map(String);
    const ev: string[] = [];
    for (const r of rs.slice(0, 3)) {
      if (r['curl-command']) ev.push(fence(r['curl-command'], 'bash'));
      if (r['extracted-results']?.length) ev.push(fence(r['extracted-results'].join('\n')));
      if (r.request) ev.push(fence(clip(r.request, opts.maxEvidenceChars ?? 1800), 'http'));
      if (r.response) ev.push(fence(clip(r.response, opts.maxEvidenceChars ?? 1800), 'http'));
    }
    if (rs.length > 3) ev.push(`_${rs.length} resultaten in totaal; de eerste drie zijn opgenomen._`);
    const d: FindingDraft = {
      title: info.name ?? tid, severity, source: 'Nuclei', cvss31: cvss, cwe, affected,
      description: `${info.description ?? ''}\n\nTemplate: \`${tid}\`${info.tags ? ` · tags: ${([] as string[]).concat(info.tags).join(', ')}` : ''}`,
      evidence: ev.join('\n\n'), recommendation: info.remediation ?? undefined,
      references: [...cves.map((c) => `${c}: https://nvd.nist.gov/vuln/detail/${c}`), ...refs], merged: rs.length,
    };
    findings.push({ markdown: toMarkdown(d, opts.lang), title: d.title, severity, affected, merged: rs.length });
  }
  findings.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
  return { findings, warnings, tool: 'Nuclei' };
}
