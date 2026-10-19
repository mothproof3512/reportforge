import type { Severity, RiskAssessment } from '@reportforge/risk';

export type Lang = 'nl' | 'en';
export type { Severity };

/** A finding as it lives in the report context (parsed, assessed, numbered). */
export interface Finding {
  id: string;                 // e.g. "F-03"
  index: number;              // 1-based order in the report
  title: string;
  severity: Severity;
  status: string;             // Confirmed, Likely, False positive, ...
  source?: string;
  risk: RiskAssessment;
  affected: string[];
  sections: Record<string, string>;   // markdown per section
  mapping: MappingRef[];
  cwe: string[];
  retest?: { status: string; note?: string };
  file?: string;
  line?: number;
}

export interface MappingRef {
  standard: string;   // standard id, e.g. "wstg-4.2"
  item: string;       // item id, e.g. "WSTG-ATHN-03"
  title?: string;
  url?: string;
  raw: string;
}

export interface ScopeItem {
  asset: string;
  type?: string;        // web, api, infra, mobile, ...
  description?: string;
  environment?: string; // production, acceptance, ...
}

export interface ToolRef { name: string; version?: string; purpose?: string }

export interface Person { name: string; role?: string; email?: string }

export interface HistoryEntry { version: string; date: string; author: string; change: string }

/** engagement.yaml, validated. Dates are ISO strings. */
export interface Engagement {
  reference: string;
  title: string;
  subtitle?: string;
  language: Lang;
  theme: string;                  // theme id (modules/themes/<id>) or a path
  template: string;               // template id
  risk_model: 'cvss31' | 'cvss40' | 'matrix';
  type?: string;                  // web | api | infra | mobile | ...
  version: string;
  date: string;
  classification?: string;
  status?: string;                // concept | definitief
  client: { name: string; contact?: Person[]; address?: string[] };     // the end client the report is about
  provider?: { name: string; address?: string[]; website?: string; email?: string; phone?: string }; // overrides theme.provider
  period: { start: string; end: string };
  authors: Person[];
  testers?: Person[];
  reviewers?: Person[];
  scope: ScopeItem[];
  out_of_scope?: string[];
  standards: string[];
  tools?: ToolRef[];
  test_approach?: string;         // markdown
  executive_summary?: string;     // markdown
  conclusion?: string;            // markdown
  limitations?: string;           // markdown
  recommendations?: string;       // markdown (strategic)
  document_history?: HistoryEntry[];
  retest?: { of_version: string; date: string };
  [extra: string]: unknown;
}

export interface ThemeColors {
  primary: string; primaryDark: string; primaryLight: string; accent: string;
  ink: string; muted: string; rule: string; surface: string; codeBg: string;
  severity: Record<Severity, string>;
  severityText: Record<Severity, string>;
  [k: string]: unknown;
}

export interface ResolvedTheme {
  id: string;
  name: string;
  version: string;
  dir: string;                      // absolute path to theme folder
  provider: { name: string; short?: string; address?: string[]; website?: string; email?: string; phone?: string; registration?: string };
  colors: ThemeColors;
  fonts: { body: string; heading: string; mono: string; dirs: string[]; base_size: string };
  page: { size: string; margin: { top: string; bottom: string; left: string; right: string }; number_format: string; cover: string };
  assets: { logo?: string; logo_mono?: string; cover_image?: string; signature?: string };
  texts: Record<string, Record<Lang, string>>;
  options: Record<string, unknown>;
}

export interface BlockManifest {
  id: string;
  name: string;
  version: string;
  category: 'front' | 'context' | 'risk' | 'finding' | 'closing' | 'appendix' | 'attestation';
  description?: string;
  documents: string[];              // report | retest | attestation | testplan
  each?: string;                    // "findings": repeat per item
  options?: Record<string, unknown>;
}

export interface BlockModule {
  manifest: BlockManifest;
  dir: string;
  schema?: unknown;
  i18n: Record<Lang, Record<string, string>>;
  hasTypst: boolean;
  hasDocx: boolean;
}

export interface TemplateBlock { type: string; options?: Record<string, unknown> }

export interface Template {
  id: string;
  name: string;
  document: string;                 // report | retest | attestation
  blocks: TemplateBlock[];
  dir: string;
}

export interface StandardItem { id: string; title: string; category?: string; description?: string; url?: string }
export interface Standard { id: string; name: string; short: string; version?: string; url?: string; kind: string; items: StandardItem[]; description?: Record<Lang, string> }

export interface Modules {
  root: string;
  blocks: Record<string, BlockModule>;
  templates: Record<string, Template>;
  standards: Record<string, Standard>;
  themes: Record<string, string>;   // id → dir
  i18n: Record<Lang, Record<string, unknown>>;
}

/** Everything a renderer needs. Serialisable (markdown kept as strings). */
export interface ReportContext {
  document: string;
  lang: Lang;
  engagement: Engagement;
  theme: ResolvedTheme;
  template: Template;
  findings: Finding[];
  stats: {
    total: number;
    bySeverity: Record<Severity, number>;
    openBySeverity: Record<Severity, number>;
    byStatus: Record<string, number>;
    highest?: Severity;
  };
  standards: Standard[];
  coverage?: Array<{ standard: string; item: string; status: string; note?: string }>;
  images: Record<string, ImageInfo>;     // key = path as referenced in markdown
  generated: { at: string; tool: string };
}

export interface ImageInfo { abs: string; width: number; height: number; format: string; bytes: number }
