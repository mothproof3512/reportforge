import { toMarkdown, clip, fence, htmlToMarkdown, parseXml, findAll, childText, child, type ImportResult, type ImportOptions, type FindingDraft, SEV_ORDER } from '@reportforge/importers';

const SEV: Record<string, string> = { high: 'high', medium: 'medium', low: 'low', information: 'info', info: 'info' };

export function importFindings(input: Buffer, opts: ImportOptions = {}): ImportResult {
  const xml = parseXml(input.toString('utf8'));
  const issues = findAll(xml, 'issue');
  if (!issues.length) throw new Error('Geen <issue>-elementen gevonden; is dit een Burp XML-export?');
  const warnings: string[] = [];
  const groups = new Map<string, any[]>();
  for (const is of issues) {
    const type = childText(is, 'type') || childText(is, 'name');
    groups.set(type, [...(groups.get(type) ?? []), is]);
  }
  const findings = [] as ImportResult['findings'];
  for (const [, iss] of groups) {
    const first = iss[0];
    const name = childText(first, 'name');
    const severity = SEV[childText(first, 'severity').toLowerCase()] ?? 'info';
    if (opts.minSeverity && SEV_ORDER[severity] > SEV_ORDER[opts.minSeverity]) continue;
    const confs = iss.map((i) => childText(i, 'confidence').toLowerCase());
    const status = confs.includes('certain') ? 'Confirmed' : 'Likely';
    const affected = [...new Set(iss.map((i) => { const host = childText(i, 'host'); const path = childText(i, 'path'); return host + path; }))];
    const cwe = [...new Set(iss.flatMap((i) => [...childText(i, 'vulnerabilityClassifications').matchAll(/CWE-(\d+)/g)].map((m) => m[1])))];
    const refs = [...new Set(iss.flatMap((i) => [...childText(i, 'references').matchAll(/href="([^"]+)"/g)].map((m) => m[1])))];
    const ev: string[] = [];
    const detail = htmlToMarkdown(childText(first, 'issueDetail'));
    if (detail) ev.push(detail);
    const rr = findAll(first, 'requestresponse')[0];
    if (rr) {
      for (const k of ['request', 'response'] as const) {
        const n = child(rr, k);
        if (!n) continue;
        const raw = n.attrs.base64 === 'true' ? Buffer.from(n.text.trim(), 'base64').toString('latin1') : n.text;
        ev.push(fence(clip(raw.replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '.'), opts.maxEvidenceChars ?? 1800), 'http'));
      }
    }
    if (iss.length > 1) ev.push(`_${iss.length} instanties; de eerste is als bewijs opgenomen._`);
    const d: FindingDraft = {
      title: name, severity, status, source: 'Burp Suite', cwe, affected,
      description: htmlToMarkdown(childText(first, 'issueBackground')),
      recommendation: htmlToMarkdown(childText(first, 'remediationBackground')) + (childText(first, 'remediationDetail') ? '\n\n' + htmlToMarkdown(childText(first, 'remediationDetail')) : ''),
      evidence: ev.join('\n\n'), references: refs, merged: iss.length,
    };
    findings.push({ markdown: toMarkdown(d, opts.lang), title: name, severity, affected, merged: iss.length });
  }
  findings.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
  return { findings, warnings, tool: 'Burp Suite' };
}
