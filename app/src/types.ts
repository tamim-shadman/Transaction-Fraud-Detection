export type Row = Record<string, any>;

export interface Kpi {
  id: string;
  label: string;
  value: number | null;
  format: string;
  tone?: string;
  eyebrow?: string;
  definition: string;
  formula: string;
  source: string;
  verification: string;
  context: string;
}

export interface Phase {
  id: string;
  num: string;
  name: string;
  short_name: string;
  section: string;
  output_prefix: string | null;
  ledger_phase: string | null;
  cell_start: number;
  cell_end: number;
  purpose: string;
  description: string;
  methods: string[];
  key_metric: { label: string; value: number; format: string };
  key_findings: string[];
  limitations: string[];
  accent: string;
  figureCount: number;
  tableCount: number;
  interactiveCount: number;
  artifactCount: number;
  findingCount: number;
  strongCount: number;
  caveatCount: number;
  rqs: string[];
  cells: number[];
}

export interface Finding {
  id: string;
  rq: string;
  rqText: string;
  phase: string;
  phaseName: string;
  grade: "strong" | "supports" | "weak" | "caveat";
  finding: string;
  evidence: string;
  sourceFile: string;
  sourceRow: number;
  ledgerPhase: string;
  cellRange: string;
  auditNoteId: string | null;
  auditStatus: string | null;
}

export interface Figure {
  id: string;
  type: "figure" | "interactive";
  title: string;
  caption: string;
  phase: string;
  group: string;
  bytes: number;
  width?: number | null;
  height?: number | null;
  thumb: string | null;
  full: string;
  source: string;
}

export interface ColumnMeta {
  key: string;
  type: string;
  missing: number;
  unique: number;
  min?: number | null;
  max?: number | null;
  mean?: number | null;
  median?: number | null;
}

export interface TableCatalog {
  id: string;
  title: string;
  category: string;
  description: string;
  phase: string;
  rows: number;
  cols: number;
  missing_cells: number;
  bytes: number;
  source: string;
  columns: ColumnMeta[];
}

export interface AuditNote {
  id: string;
  title: string;
  status: string;
  claim: string;
  observation: string;
  implication: string;
  sources: string[];
  phase: string;
}

export interface Issue {
  id: string;
  title: string;
  severity: string;
  category: string;
  scope: string;
  status: string;
  confidence: string;
  summary: string;
  evidence: string[];
  impact: string;
  action: string;
  sources: string[];
  phase: string;
}

export interface RqSummary {
  id: string;
  question: string;
  findings: number;
  strong: number;
  supports: number;
  caveat: number;
  weak: number;
  phases: string[];
}

export interface NotebookCell {
  index: number;
  type: "code" | "markdown";
  is_code: boolean;
  exec: number | null;
  phase: string;
  source: string;
  source_first: string;
  output: string;
  output_chars: number;
  images: number;
  has_output: boolean;
}

export interface Manifest {
  meta: { generatedAt: string; build: string; sourceRoot: string; note: string };
  project: Record<string, any>;
  run: Record<string, any>;
  notebook: Record<string, any>;
  counts: Record<string, number>;
  gradeCounts: Record<string, number>;
  kpis: Kpi[];
  phases: Phase[];
  rqs: RqSummary[];
  findings: Finding[];
  figures: Figure[];
  htmlArtifacts: Figure[];
  tables: TableCatalog[];
  dataQuality: {
    summary: Record<string, number>;
    missing: { column: string; dtype: string; missingPct: number; nonNull: number; unique: number; role: string }[];
    contracts: { contract: string; actual: string; status: string }[];
    generator: { metric: string; value: any }[];
    classBalance: Row[];
  };
  experiments: Row[];
  environment: Record<string, any>;
  warnings: { id: string; severity: string; category: string; message: string; detail: string; cell: number; phase: string; source: string }[];
  issues: Issue[];
  auditNotes: AuditNote[];
  graph: { nodes: Row[]; links: Row[] };
  gradeDefs: { grade: string; label: string; definition: string; interpretation: string; color: string }[];
  sources: { name: string; role: string; present: boolean; bytes: number; hash: string | null; note: string }[];
}

export interface Analysis {
  [key: string]: any;
  class_balance: Row[];
  contracts: Row[];
  generator: Row[];
  schema: Row[];
  quantiles: Row[];
  category_table: Row[];
  covid: Row[];
  cards: Row[];
  cities: Row[];
  dist_rate: Row[];
  mi: Row[];
  money: Row[];
  zip3: Row[];
  weekly: Row[];
  anomaly: Row[];
  dbscan: Row[];
  kmeans: Row[];
  separability: Row[];
  posthoc: Row[];
  category_rates: Row[];
  chi2: Row[];
  logit: Row[];
  effect_sizes: Row[];
  hazard: Row[];
  combos: Row[];
  hour_encoding: Row[];
  merchants_eb: Row[];
  speed: Row[];
  ablation: Row[];
  calibration_temp: Row[];
  capture: Row[];
  cost: Row[];
  ensemble: Row[];
  learning: Row[];
  leave_card: Row[];
  monotonic: Row[];
  psi: Row[];
  segments: Row[];
  thresholds: Row[];
  time_decay: Row[];
  walkforward: Row[];
  wf_vs_test: Row[];
  checklist: Row[];
  cards_summary: {
    cards: number;
    never: number;
    ever: number;
    neverPct: number;
    everPct: number;
    allFraud: number;
    meanRate: number;
    medianRate: number;
    histogram: { bin: string; count: number }[];
    scatter: { n: number; k: number; rate: number; cc: string }[];
  };
  weekly_series: Row[];
  merchant_top: Row[];
  merchant_volume_top: Row[];
  city_top: Row[];
  zip3_top: Row[];
  experiments: Row[];
  supervised_models: Row[];
}

export interface TableData {
  id: string;
  columns: string[];
  types: Record<string, string>;
  rows: Row[];
}

export interface NotebookData {
  cells: NotebookCell[];
  stats: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Phase 2 evidence layer
// ---------------------------------------------------------------------------

export interface Phase2Phase {
  id: string;
  num: string;
  name: string;
  shortName: string;
  section: string;
  route: string;
  purpose: string;
  description: string;
  methods: string[];
  keyMetric: { label: string; value: number; format: string };
  keyFindings: string[];
  limitations: string[];
  accent: string;
  cellStart: number;
  cellEnd: number;
  cellRange: string;
  notebookCells: number;
  outputChars: number;
  figureCount: number;
  tableCount: number;
  interactiveCount: number;
  artifactCount: number;
  findingCount: number;
  strongCount: number;
  caveatCount: number;
  rqs: string[];
  topFindings: { id: string; title: string; grade: string; rq: string }[];
  issues: { id: string; title: string; severity: string; status: string }[];
  representativeFigure: string | null;
  representativeThumb: string | null;
  status: string;
  statusNote: string;
}

export interface Phase2Program {
  generatedAt: string;
  project: Record<string, any>;
  run: Record<string, any>;
  counts: Record<string, number>;
  grades: Record<string, number>;
  phaseStatus: { complete: number; total: number };
  phases: Phase2Phase[];
  researchQuestions: (RqSummary & { phaseNames: string[]; topFinding: { id: string; title: string; grade: string } | null })[];
  technologies: string[];
  environment: Record<string, any>;
  sources: Manifest["sources"];
  reproducibility: {
    checklistPassed: number;
    checklistTotal: number;
    checklist: Row[];
    absentSources: Manifest["sources"];
    warnings: number;
    errorOutputs: number;
    cellsWithOutput: number;
    codeCells: number;
  };
  issues: Issue[];
  auditNotes: AuditNote[];
  limits: { title: string; detail: string }[];
  milestones: { phase: string; title: string; cells: string; metric: { label: string; value: number; format: string }; findings: number; artifacts: number }[];
}

export interface Phase2Project {
  id: string;
  title: string;
  shortTitle: string;
  track: string;
  leadRole: string;
  phases: string[];
  phaseRange: string;
  cellRange: string;
  purpose: string;
  objectives: string[];
  keyMetric: { label: string; value: string; interpretation: string };
  riskLevel: "Low" | "Medium" | "High";
  riskNote: string;
  deliverables: string[];
  limitations: string[];
  route: string;
  status: "Complete" | "In Progress" | "Planned";
  findingCount: number;
  strongCount: number;
  supportsCount: number;
  caveatCount: number;
  weakCount: number;
  artifactCount: number;
  figureCount: number;
  tableCount: number;
  rqs: string[];
  topFindings: { id: string; title: string; grade: string; rq: string; phase: string }[];
  phasesDetail: { id: string; name: string; shortName: string; cellRange: string; findings: number; artifacts: number }[];
}

export interface Phase2ProjectsPayload {
  generatedAt: string;
  programTitle: string;
  summary: {
    totalProjects: number;
    completeProjects: number;
    totalTracks: number;
    totalPhases: number;
    totalFindings: number;
    strongFindings: number;
    totalArtifacts: number;
  };
  tracks: string[];
  projects: Phase2Project[];
}


export interface Phase2Experiment {
  id: string;
  family: string;
  group: string;
  groupId: string;
  groupLabel: string;
  label: string;
  description: string;
  metric: string;
  metricLabel: string;
  pr_auc: number | null;
  roc_auc: number | null;
  n_features: number | null;
  split: string;
  n_rows: number | null;
  source: string;
  comparisonNote: string;
  baselineId: string | null;
  deltaVsBaseline: number | null;
  ratioVsBaseline: number | null;
  deltaMode: string;
  rankInGroup: number | null;
  runtimeSeconds: number | null;
  sourceTableId: string | null;
  sourceHref: string;
  href: string;
  comparable: boolean;
}

export interface Phase2ExperimentData {
  generatedAt: string;
  counts: { total: number; groups: number };
  groups: {
    id: string;
    label: string;
    metric: string;
    basis: string;
    limitations: string;
    comparable: boolean;
    count: number;
    members: string[];
    baselineId: string | null;
  }[];
  items: Phase2Experiment[];
  metricNotes: Record<string, string>;
}

export interface Phase2Artifact {
  id: string;
  kind: "figure" | "interactive" | "table";
  title: string;
  caption: string;
  phase: string;
  group: string;
  bytes: number | null;
  width?: number | null;
  height?: number | null;
  rows?: number | null;
  cols?: number | null;
  missingCells?: number | null;
  thumb?: string | null;
  full?: string | null;
  source?: string | null;
  cell: number | null;
  cellLine: string | null;
  cellPhase?: string | null;
  lineageNodeId?: string;
  provenance: "verified" | "inferred";
  relatedFindings: { id: string; title: string; grade: string }[];
  relatedRq: string | null;
  href: string;
  exploreHref?: string;
}

export interface Phase2Artifacts {
  generatedAt: string;
  counts: {
    total: number;
    figures: number;
    interactive: number;
    tables: number;
    verifiedProvenance: number;
    inferredProvenance: number;
  };
  items: Phase2Artifact[];
}

export interface Phase2Insight {
  id: string;
  scope: string;
  phase: string | null;
  rq: string | null;
  priority: number;
  kind: string;
  title: string;
  statement: string;
  detail: string;
  metrics: { label: string; value: any; format: string; source: string }[];
  link: string;
  sourceRefs: string[];
  confidence: string;
  caveat: string;
}

export interface Phase2Insights {
  generatedAt: string;
  count: number;
  items: Phase2Insight[];
  scopes: string[];
}

export interface Phase2Anomaly {
  id: string;
  series: string;
  label: string;
  value: number;
  format: string;
  reference: string;
  method: string;
  threshold: string;
  zScore?: number;
  denominator?: number;
  events?: number;
  severity: string;
  interpretation: string;
  notAProof: string;
  source: string;
  link: string;
}

export interface Phase2Anomalies {
  generatedAt: string;
  summary: {
    weeklyFlagged: number;
    weeklyReference: number;
    psiSevere: number;
    psiModerate: number;
    exportWarnings: number;
    edgeCases: number;
  };
  weekly: Phase2Anomaly[];
  drift: Phase2Anomaly[];
  edgeCases: { id: string; label: string; value: number; zScore: number; reason: string; source: string }[];
  exportExceptions: Phase2Anomaly[];
  methodNotes: string[];
}

export interface Phase2Metric {
  id: string;
  layer: string;
  metric: string;
  value: string;
  numericValue: number | null;
  unit: string;
  definition: string;
  formula: string;
  sourceFile: string;
  sourceLocator: string;
  appPages: string;
  validationChecks: string;
  confidence: string;
  caveat: string;
  sourceTableId: string | null;
  sourceHref: string;
}

export interface Phase2Metrics {
  generatedAt: string;
  count: number;
  validated: number;
  layers: Record<string, number>;
  items: Phase2Metric[];
}

export interface Phase2LogEvent {
  id: string;
  source: string;
  sourceLabel: string;
  cell: number | null;
  line: number | null;
  phase: string;
  raw: string;
  message: string;
  severity: "info" | "warning" | "error" | "notice";
  category: string;
  timestamp: string | null;
  warningId?: string;
  rq?: string;
  grade?: string;
}

export interface Phase2LogPattern {
  id: string;
  signature: string;
  severity: string;
  category: string;
  count: number;
  cells: number[];
  phases: string[];
  example: string;
  firstCell: number | null;
  source: string;
}

export interface Phase2Logs {
  generatedAt: string;
  summary: {
    totalEvents: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    byPhase: Record<string, number>;
    warningCount: number;
    errorCount: number;
    tracebacks: number;
    cellsWithOutput: number;
    codeCells: number;
    artifactWrites: number;
    patterns: number;
    timestampsAvailable: boolean;
    timestampNote: string;
    exportSkips: number;
    uniqueWarningTargets: number;
    rawWarningEvents: number;
    sources: { id: string; label: string; path: string; events: number }[];
  };
  events: Phase2LogEvent[];
  patterns: Phase2LogPattern[];
  warningFamilies: {
    id: string;
    label: string;
    count: number;
    severity: string;
    observations: string;
    evidence: string[];
    targets?: string[];
    interpretation: string;
    links: string[];
  }[];
  severityLegend: Record<string, string>;
}

export interface Phase2LineageNode {
  id: string;
  label: string;
  type: string;
  phase: string;
  route?: string;
  grade?: string;
  severity?: string;
  provenance?: string;
  absent?: boolean;
  meta: Record<string, any>;
}

export interface Phase2LineageLink {
  source: string;
  target: string;
  relation: string;
  verified: boolean;
}

export interface Phase2Lineage {
  generatedAt: string;
  counts: {
    nodes: number;
    links: number;
    verifiedLinks: number;
    inferredLinks: number;
    nodeTypes: Record<string, number>;
  };
  nodes: Phase2LineageNode[];
  links: Phase2LineageLink[];
  notes: string[];
}
