import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChartNoAxesCombined,
  FileSpreadsheet,
  Image as ImageIcon,
  LayoutDashboard,
  ListChecks,
  Search,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import type { Manifest } from "../types";

type Entry = {
  id: string;
  kind: "command" | "page" | "finding" | "table" | "figure" | "phase" | "metric";
  title: string;
  sub: string;
  to: string;
};

const PHASE_ROUTES: Record<string, string> = {
  P0: "/data-audit",
  P1: "/distributions",
  P2: "/interactions",
  P3: "/temporal",
  P4: "/advanced",
  P5: "/statistics",
  P6: "/features",
  P7: "/model",
  P8: "/artifacts",
};

const COMMANDS: Entry[] = [
  { id: "cmd-walkthrough", kind: "command", title: "Start Guided Project Walkthrough", sub: "Launch 7-stage interactive research narrative", to: "/walkthrough" },
  { id: "cmd-presentation", kind: "command", title: "Launch Executive Presentation Mode", sub: "Full-screen slide deck with speaker notes and charts", to: "/presentation" },
  { id: "cmd-reports", kind: "command", title: "Open Report Composer & Publisher", sub: "Assemble custom reports with Print/PDF & Markdown export", to: "/reports" },
  { id: "cmd-portfolio", kind: "command", title: "Browse Project Portfolio", sub: "Review 7 research project profiles and deliverables", to: "/portfolio" },
  { id: "cmd-contracts", kind: "command", title: "Audit Forensic Data Contracts", sub: "Inspect 0-null schema integrity and coordinate jitter", to: "/data-audit" },
  { id: "cmd-model", kind: "command", title: "Inspect Model Performance & PR-AUC", sub: "Examine LightGBM vs Logistic Regression ablation", to: "/model" },
  { id: "cmd-economics", kind: "command", title: "Analyze Decision Economics & Catch@k", sub: "Evaluate review capacity curves and cost minimization", to: "/economics" },
  { id: "cmd-refresh", kind: "command", title: "Open Data Refresh Center", sub: "Scan project directory, validate contracts and update analytics", to: "/refresh" },
  { id: "cmd-snapshots", kind: "command", title: "Compare Historical Snapshots", sub: "Inspect schema evolution and metric diffs across versions", to: "/snapshots" },
  { id: "cmd-scenarios", kind: "command", title: "Simulate What-If Scenarios", sub: "Model review capacity, thresholds and workload scaling", to: "/scenarios" },
  { id: "cmd-copilot", kind: "command", title: "Ask Analytics Copilot", sub: "Grounded Q&A over verified project evidence and metrics", to: "/copilot" },
];

const PAGES: { title: string; sub: string; to: string }[] = [
  { title: "Overview", sub: "Run-level evidence and headline results", to: "/" },
  { title: "Story walkthrough", sub: "Interactive 7-stage guided project research narrative", to: "/walkthrough" },
  { title: "Presentation mode", sub: "Distraction-free 10-slide executive presentation", to: "/presentation" },
  { title: "Report composer", sub: "Assemble custom analytical reports with Print/PDF and Markdown export", to: "/reports" },
  { title: "Project portfolio", sub: "Seven research project dossiers, deliverables and risk ratings", to: "/portfolio" },
  { title: "Insights", sub: "Deterministic, source-linked findings and anomaly watch", to: "/insights" },
  { title: "Program profile", sub: "One research program, nine phase dossiers and reproducibility", to: "/program" },
  { title: "Data audit", sub: "Schema, contracts, missingness and generator forensics", to: "/data-audit" },
  { title: "Distributions", sub: "Amounts, categories and the class imbalance", to: "/distributions" },
  { title: "Interactions", sub: "Cards, geography and categorical structure", to: "/interactions" },
  { title: "Temporal structure", sub: "Weekly drift, survival and the train/test boundary", to: "/temporal" },
  { title: "Advanced visualisation", sub: "Embeddings, clusters and anomaly detectors", to: "/advanced" },
  { title: "Statistical tests", sub: "Effect sizes, Cramér's V and robust logits", to: "/statistics" },
  { title: "Feature lab", sub: "Velocity, combinations and target encoding", to: "/features" },
  { title: "Model performance", sub: "Ablation, walk-forward validation and drift", to: "/model" },
  { title: "Review economics", sub: "Capture@k, thresholds and segment errors", to: "/economics" },
  { title: "Experiments", sub: "Compare variants with compatibility rules and absolute deltas", to: "/experiments" },
  { title: "Evidence map", sub: "Lineage across sources, cells, findings and artifacts", to: "/lineage" },
  { title: "Run logs", sub: "Warnings, exports, sections and measurement lines", to: "/logs" },
  { title: "Data explorer", sub: "Profile any generated table directly", to: "/explore" },
  { title: "Metric catalog", sub: "Definitions, formulas, sources and validation checks", to: "/metrics" },
  { title: "Findings ledger", sub: "All 64 graded findings and audit notes", to: "/findings" },
  { title: "Artifacts & notebook", sub: "129 figures, 46 tables, 66 cells and run evidence", to: "/artifacts" },
  { title: "Data refresh center", sub: "Discover sources, validate contracts and trigger refresh", to: "/refresh" },
  { title: "Historical snapshots", sub: "Dataset versions, schema evolution and metric comparison", to: "/snapshots" },
  { title: "What-if scenario lab", sub: "Capacity, threshold and workload simulation", to: "/scenarios" },
  { title: "Analytics copilot", sub: "Evidence-grounded conversational analytics assistant", to: "/copilot" },
];

const PROJECTS = [
  { id: "PROJ-01", title: "Data Integrity, Forensic Verification & Contract Audit", sub: "Data Quality & Forensics · Schema, jitter forensics, contracts" },
  { id: "PROJ-02", title: "Behavioral Patterns, Multi-Way Interactions & Temporal Dynamics", sub: "Exploratory Data Science · Categorical risk, hour/day seasonality" },
  { id: "PROJ-03", title: "Advanced Spatio-Temporal Topology, Embeddings & Clustering", sub: "Spatial & Graph Analytics · t-SNE, UMAP, geographic clusters" },
  { id: "PROJ-04", title: "Statistical Hypothesis Testing & Rigorous Effect Size Estimation", sub: "Statistical Validation · Mann-Whitney, Cliff's delta, Cramér's V" },
  { id: "PROJ-05", title: "Feature Engineering, Attribution Ranking & Mutual Information", sub: "Feature Lab · 72 engineered features, velocity, ratios" },
  { id: "PROJ-06", title: "Model Architecture, Benchmark Cross-Validation & Decision Economics", sub: "Machine Learning · XGBoost, LightGBM, CatBoost, PR-AUC" },
  { id: "PROJ-07", title: "Artifact Lineage, Execution Telemetry & Forensic Reproducibility", sub: "MLOps & Governance · Directed acyclic graph, execution logs" },
];

function buildEntries(manifest: Manifest): Entry[] {
  const entries: Entry[] = [
    ...COMMANDS,
    ...PAGES.map((page) => ({ ...page, id: page.to, kind: "page" as const })),
  ];
  for (const proj of PROJECTS) {
    entries.push({
      id: proj.id,
      kind: "page",
      title: `${proj.id} · ${proj.title}`,
      sub: proj.sub,
      to: `/portfolio?project=${proj.id}`,
    });
  }
  for (const kpi of manifest.kpis) {
    entries.push({
      id: kpi.id,
      kind: "metric",
      title: kpi.label,
      sub: kpi.context ?? kpi.definition,
      to: `/metrics?metric=${kpi.id}`,
    });
  }
  for (const phase of manifest.phases) {
    entries.push({
      id: phase.id,
      kind: "phase",
      title: `${phase.id} · ${phase.name}`,
      sub: phase.purpose,
      to: PHASE_ROUTES[phase.id] ?? "/",
    });
  }
  for (const finding of manifest.findings) {
    entries.push({
      id: finding.id,
      kind: "finding",
      title: finding.finding,
      sub: `${finding.id} · ${finding.phase} · ${finding.rq} · ${finding.grade}`,
      to: `/findings?finding=${finding.id}`,
    });
  }
  for (const table of manifest.tables) {
    entries.push({
      id: table.id,
      kind: "table",
      title: table.title || table.id,
      sub: `${table.category} · ${table.rows.toLocaleString()} rows · tables/${table.id}.csv`,
      to: `/artifacts?tab=tables&table=${table.id}`,
    });
  }
  for (const figure of [...manifest.figures, ...manifest.htmlArtifacts]) {
    entries.push({
      id: figure.id,
      kind: "figure",
      title: figure.title,
      sub: `${figure.phase} · ${figure.group} · ${figure.caption}`,
      to: `/artifacts?tab=figures&figure=${figure.id}`,
    });
  }
  return entries;
}

const KIND_META = {
  command: { label: "Quick Actions & Commands", icon: Terminal },
  page: { label: "Pages & Projects", icon: LayoutDashboard },
  metric: { label: "Metrics", icon: ChartNoAxesCombined },
  phase: { label: "Phases", icon: ShieldCheck },
  finding: { label: "Findings", icon: ListChecks },
  table: { label: "Tables", icon: FileSpreadsheet },
  figure: { label: "Artifacts", icon: ImageIcon },
} as const;

export function SearchModal({ open, onClose, manifest }: { open: boolean; onClose: () => void; manifest: Manifest }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const entries = useMemo(() => buildEntries(manifest), [manifest]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? entries.filter((entry) => `${entry.title} ${entry.sub} ${entry.id}`.toLowerCase().includes(q))
      : [
          ...COMMANDS.slice(0, 5),
          ...entries.filter((entry) => entry.kind === "page").slice(0, 6),
          ...manifest.findings.slice(0, 4).map((finding) => entries.find((entry) => entry.id === finding.id)!),
        ].filter(Boolean);
    return base.slice(0, 24);
  }, [entries, manifest.findings, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelected(0);
    window.setTimeout(() => inputRef.current?.focus(), 30);
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'input, button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  if (!open) return null;

  const go = (entry: Entry) => {
    navigate(entry.to);
    onClose();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected((value) => Math.min(results.length - 1, value + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected((value) => Math.max(0, value - 1));
    } else if (event.key === "Enter" && results[selected]) {
      event.preventDefault();
      go(results[selected]);
    }
  };

  let lastKind = "";
  return (
    <>
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <div className="modal" role="dialog" aria-modal="true" aria-label="Search the evidence console" ref={modalRef}>
        <div className="search-modal-input">
          <Search />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search findings, tables, figures, phases…"
            aria-label="Search"
          />
          <kbd>ESC</kbd>
        </div>
        <div className="search-results">
          {results.length ? (
            results.map((entry, index) => {
              const meta = KIND_META[entry.kind];
              const Icon = meta.icon;
              const showLabel = entry.kind !== lastKind;
              lastKind = entry.kind;
              return (
                <div key={`${entry.kind}-${entry.id}`}>
                  {showLabel ? <div className="search-group-label">{meta.label}</div> : null}
                  <button
                    type="button"
                    className={`search-result ${entry.kind === "command" ? "is-command" : ""} ${index === selected ? "selected" : ""}`}
                    onMouseEnter={() => setSelected(index)}
                    onClick={() => go(entry)}
                  >
                    <span className="sr-icon"><Icon /></span>
                    <span className="sr-main">
                      <span className="sr-title">{entry.title}</span>
                      <span className="sr-sub">{entry.sub}</span>
                    </span>
                    <BookOpen size={12} style={{ opacity: 0.35 }} />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="search-empty">
              No evidence matched “{query}”. Try a category, phase, table name or finding keyword.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
