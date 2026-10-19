import { toMarkdown, clip, fence, parseXml, findAll, childText, type ImportResult, type ImportOptions, type FindingDraft, SEV_ORDER } from '@reportforge/importers';

const SEV = ['info', 'low', 'medium', 'high', 'critical'];

export function importFindings(input: Buffer, opts: ImportOptions = {}): ImportResult {
  const xml = parseXml(input.toString('utf8'));
  const hosts = findAll(xml, 'ReportHost');
  if (!hosts.length) throw new Error('Geen <ReportHost>-elementen gevonden; is dit een .nessus-export?');
  const warnings: string[] = [];
  const groups = new Map<string, Array<{ host: string; item: any }>>();
  for (const h of hosts) {
    const name = h.attrs.name;
    for (const it of findAll(h, 'ReportItem')) groups.set(it.attrs.pluginID, [...(groups.get(it.attrs.pluginID) ?? []), { host: name, item: it }]);
  }
  const minSev = opts.minSeverity ?? 'low';
  const findings = [] as ImportResult['findings'];
  for (const [pid, rs] of groups) {
    const it = rs[0].item;
    const severity = SEV[Number(it.attrs.severity)] ?? 'info';
    if (SEV_ORDER[severity] > SEV_ORDER[minSev]) continue;
    const affected = [...new Set(rs.map((r) => `${r.host}:${r.item.attrs.port}/${r.item.attrs.protocol}${r.item.attrs.svc_name && r.item.attrs.svc_name !== 'general' ? ` (${r.item.attrs.svc_name})` : ''}`))];
    const vector = childText(it, 'cvss3_vector');
    const v31 = vector ? { vector: vector.startsWith('CVSS:3') ? vector : 'CVSS:3.1/' + vector, score: Number(childText(it, 'cvss3_base_score')) || undefined } : undefined;
    const cves = findAll(it, 'cve').map((c) => c.text.trim());
    const refs = [...cves.map((c) => `${c}: https://nvd.nist.gov/vuln/detail/${c}`), ...childText(it, 'see_also').split('\n').map((s) => s.trim()).filter(Boolean)];
    const cwe = findAll(it, 'cwe').map((c) => c.text.trim());
    const out = childText(it, 'plugin_output');
    const d: FindingDraft = {
      title: it.attrs.pluginName, severity, source: 'Nessus', cvss31: v31, cwe, affected,
      description: `${childText(it, 'synopsis')}\n\n${childText(it, 'description')}\n\nPlugin ${pid} (${it.attrs.pluginFamily ?? ''})`,
      recommendation: childText(it, 'solution'),
      evidence: out ? fence(clip(out, opts.maxEvidenceChars ?? 1800)) + (rs.length > 1 ? `\n\n_Output van ${rs[0].host}; ${rs.length} hosts in totaal._` : '') : '',
      references: refs, merged: rs.length,
    };
    findings.push({ markdown: toMarkdown(d, opts.lang), title: d.title, severity, affected, merged: rs.length });
  }
  findings.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
  return { findings, warnings, tool: 'Nessus' };
}
