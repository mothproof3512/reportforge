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
  brief?: { what: string; action: string };   // plain-text one-liners for priority cards
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
  access?: string;      // unauthenticated, customer account, ...
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
  intake?: Intake;
  testplan?: TestPlan;
  finding_prefix?: string;        // F (default), CS, …
  positives?: string;             // markdown: what is in good order
  roadmap?: string;               // markdown: ### group headings → remediation roadmap
  glossary?: Array<{ term: string; definition: string }>;
  accounts?: Array<{ role: string; account?: string; rights?: string }>;
  [extra: string]: unknown;
}

export interface Intake {
  goal?: string;                 // markdown: why the test, what question must it answer
  background?: string;           // markdown: system description
  test_type?: string;            // black-box | grey-box | white-box
  credentials?: string;          // markdown: accounts/roles to be provided
  test_window?: string;          // e.g. "werkdagen 09:00–17:00"
  preconditions?: string;        // markdown: whitelisting, contacts, environments
  allowed?: string[];            // allowed techniques
  not_allowed?: string[];        // forbidden (DoS, social engineering, …)
  deliverables?: string[];
  emergency_contact?: string;
  notes?: string;
}

export interface ChecklistItemState { id: string; status: 'tested' | 'not-tested' | 'n/a' | 'finding'; note?: string }
export interface Checklist { standard: string; items: ChecklistItemState[] }

export interface TestPlan {
  approach?: string;             // markdown: overall approach
  per_scope?: Array<{ asset: string; approach: string }>;
  planning?: Array<{ phase: string; start?: string; end?: string; notes?: string }>;
  checklists?: Checklist[];
  go_nogo?: string;              // markdown
}

export interface ThemeColors {
  primary: string; primaryDark: string; primaryLight: string; accent: string;
  ink: string; muted: string; rule: string; surface: string; codeBg: string; calloutBg: string;
  severity: Record<Severity, string>;
  severityText: Record<Severity, string>;
  [k: string]: unknown;
}

/** One background layer: an SVG/PNG placed behind the page content. */
export interface Decoration {
  image: string;                 // file name in the theme folder, or one of assets/decorations/*.svg
  src?: string;                  // resolved absolute path (set by the theme resolver)
  anchor?: 'top-left' | 'top' | 'top-right' | 'left' | 'center' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right';
  dx?: string; dy?: string;      // offsets, e.g. "40mm" / "-20mm" (positive = right/down); may push the shape off the page
  width?: string;                // rendered width, e.g. "160mm"
  rotate?: string;               // e.g. "15deg"
  opacity?: number;              // 0–1 (0.08 = very light)
  blur?: number;                 // 0 = sharp; blur radius in SVG units / px
  tint?: string;                 // "#RRGGBB" or "primary" | "accent" | "ink" | "muted": replaces fills/strokes
  pages?: 'all' | 'odd' | 'even' | 'cover' | 'content' | 'first' | 'last';
}

export interface ResolvedTheme {
  id: string;
  name: string;
  version: string;
  dir: string;                      // absolute path to theme folder
  provider: { name: string; short?: string; address?: string[]; website?: string; email?: string; phone?: string; registration?: string };
  colors: ThemeColors;
  fonts: { body: string; heading: string; mono: string; dirs: string[]; base_size: string };
  page: { size: string; margin: { top: string; bottom: string; left: string; right: string }; number_format: string; cover: string; header: { logo: 'right' | 'left' | 'none'; logo_height: string; text: 'title' | 'client' | 'both' | 'none'; classification?: 'none' | 'pill' }; footer?: { style?: 'default' | 'website' }; decoration?: 'none' | 'arcs'; decorations?: Decoration[] };
  assets: { logo?: string; logo_mono?: string; logo_header?: string; cover_image?: string; signature?: string };
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
  coverage: Array<{ standard: string; item: string; title: string; category?: string; status: string; note?: string; findings: string[] }>;
  images: Record<string, ImageInfo>;     // key = path as referenced in markdown
  generated: { at: string; tool: string };
}

export interface ImageInfo { abs: string; width: number; height: number; format: string; bytes: number }
