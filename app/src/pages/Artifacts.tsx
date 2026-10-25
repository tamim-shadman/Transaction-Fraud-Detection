import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  GitBranch,
  Image as ImageIcon,
  Search,
  ShieldAlert,
  Table2,
  Terminal,
  XCircle,
} from "lucide-react";
import type { Figure, NotebookCell, TableData } from "../types";
import { useAnalysis, useManifest } from "../context/AppContext";
import { FigureLightbox } from "../components/Figures";
import { DataTable, type TableColumn } from "../components/DataTable";
import { Callout, EmptyState, PageHeader, Panel, Segmented, SourceNote, Stat, StatusBadge } from "../components/ui";
import { Drawer, ProvenanceBadge } from "../components/phase2";
import { asset, loadArtifacts, loadNotebook, loadTable } from "../lib/data";
import { downloadJson } from "../lib/csv";
import { fmtBytes, fmtDateTime, fmtDuration, fmtInt, titleCase } from "../lib/format";
import { muted } from "../lib/chartTheme";
import { useAsync } from "../lib/useAsync";
import type { NotebookData } from "../types";

const TABS = [
  { id: "figures", label: "Figures", icon: ImageIcon },
  { id: "interactive", label: "Interactive", icon: Boxes },
  { id: "tables", label: "Tables", icon: Table2 },
  { id: "provenance", label: "Provenance", icon: GitBranch },
  { id: "notebook", label: "Notebook", icon: Terminal },
  { id: "run", label: "Run & sources", icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];

const isTab = (value: string | null): value is TabId => TABS.some((tab) => tab.id === value);

const NOTEBOOK_PHASE_ORDER = ["SETUP", "P0", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];

function severityClass(severity: string) {
  if (severity === "High") return "badge badge-caveat";
  if (severity === "Medium") return "badge badge-weak";
  return "badge badge-neutral";
}

function auditStatusClass(status: string) {
  if (status === "contradicted" || status === "discrepancy") return "badge badge-caveat";
  if (status === "method") return "badge badge-weak";
  return "badge badge-neutral";
}

function NotebookCard({ cell }: { cell: NotebookCell }) {
  return (
    <div className="code-cell" id={`cell-${cell.index + 1}`}>
      <div className="code-head">
        <span className="finding-id">CELL {cell.index + 1}</span>
        <span className={`badge ${cell.is_code ? "badge-phase" : "badge-neutral"}`}>{cell.type}</span>
        <span className="badge badge-neutral">{cell.phase}</span>
        {cell.exec != null ? <span className="tiny muted">exec {cell.exec}</span> : null}
        {cell.images ? <span className="badge badge-info">{cell.images} image</span> : null}
        <span className="tiny muted" style={{ marginLeft: "auto" }}>{fmtInt(cell.source.length)} source chars</span>
      </div>
      {cell.is_code ? (
        <pre>{cell.source || "(empty cell)"}</pre>
      ) : (
        <div className="notebook-md">{cell.source || "(empty cell)"}</div>
      )}
      {cell.output ? (
        <details className="notebook-output">
          <summary>
            Output · {fmtInt(cell.output_chars)} chars
            {cell.images ? ` · ${cell.images} embedded image` : ""}
          </summary>
          <pre>{cell.output}</pre>
        </details>
      ) : (
        <div className="code-out">No output recorded.</div>
      )}
    </div>
  );
}

export default function Artifacts() {
  const manifest = useManifest();
  const analysis = useAnalysis();
  const [params, setSearchParams] = useSearchParams();
  const rawTab = params.get("tab");
  const tab: TabId = isTab(rawTab) ? rawTab : "figures";

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [phaseFilter, setPhaseFilter] = useState(params.get("phase") ?? "all");
  const [groupFilter, setGroupFilter] = useState(params.get("group") ?? "all");
  const [figurePage, setFigurePage] = useState(36);
  const [lightboxId, setLightboxId] = useState<string | null>(params.get("figure"));
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [notebook, setNotebook] = useState<NotebookData | null>(null);
  const [notebookLoading, setNotebookLoading] = useState(false);
  const [notebookError, setNotebookError] = useState<string | null>(null);
  const [notebookType, setNotebookType] = useState("all");
  const provenance = useAsync(loadArtifacts, []);
  const [provQuery, setProvQuery] = useState("");
  const [inspectId, setInspectId] = useState<string | null>(params.get("artifact"));
  const cellParam = params.get("cell");

  const tableId = params.get("table");
  const selectedTable =
    manifest.tables.find((table) => table.id === tableId) ??
    manifest.tables.find((table) => table.id === "findings_ledger") ??
    manifest.tables[0];

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };

  const switchTab = (nextTab: TabId) => {
    const next = new URLSearchParams();
    next.set("tab", nextTab);
    setSearchParams(next, { replace: true });
    setQuery("");
    setPhaseFilter("all");
    setGroupFilter("all");
    setNotebookType("all");
    setLightboxId(null);
  };

  const resetFilters = () => {
    setQuery("");
    setPhaseFilter("all");
    setGroupFilter("all");
    setNotebookType("all");
    updateParams({ q: null, phase: null, group: null });
  };

  const figureGroups = useMemo(
    () => Array.from(new Set(manifest.figures.map((figure) => figure.group))).sort((a, b) => a.localeCompare(b)),
    [manifest.figures],
  );
  const tableCategories = useMemo(
    () => Array.from(new Set(manifest.tables.map((table) => table.category))).sort((a, b) => a.localeCompare(b)),
    [manifest.tables],
  );
  const notebookPhases = useMemo(
    () => Array.from(new Set((notebook?.cells ?? []).map((cell) => cell.phase))).sort(
      (a, b) => NOTEBOOK_PHASE_ORDER.indexOf(a) - NOTEBOOK_PHASE_ORDER.indexOf(b),
    ),
    [notebook],
  );

  const filteredFigures = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return manifest.figures.filter((figure) => {
      if (phaseFilter !== "all" && figure.phase !== phaseFilter) return false;
      if (groupFilter !== "all" && figure.group !== groupFilter) return false;
      if (!needle) return true;
      return `${figure.id} ${figure.title} ${figure.caption} ${figure.group} ${figure.phase}`.toLowerCase().includes(needle);
    });
  }, [manifest.figures, query, phaseFilter, groupFilter]);

  useEffect(() => {
    setFigurePage(36);
  }, [query, phaseFilter, groupFilter, tab]);

  const visibleFigures = filteredFigures.slice(0, figurePage);
  const lightboxList = lightboxId && filteredFigures.some((figure) => figure.id === lightboxId) ? filteredFigures : manifest.figures;
  const lightboxIndex = lightboxId ? lightboxList.findIndex((figure) => figure.id === lightboxId) : -1;

  const openFigure = (figure: Figure) => {
    setLightboxId(figure.id);
    updateParams({ tab: "figures", figure: figure.id });
  };

  const closeFigure = () => {
    setLightboxId(null);
    updateParams({ figure: null });
  };

  const filteredTables = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return manifest.tables.filter((table) => {
      if (phaseFilter !== "all" && table.phase !== phaseFilter) return false;
      if (groupFilter !== "all" && table.category !== groupFilter) return false;
      if (!needle) return true;
      return `${table.id} ${table.title} ${table.description} ${table.category} ${table.phase}`.toLowerCase().includes(needle);
    });
  }, [manifest.tables, query, phaseFilter, groupFilter]);

  useEffect(() => {
    if (tab !== "tables") return;
    let active = true;
    setTableLoading(true);
    setTableError(null);
    setTableData(null);
    loadTable(selectedTable.id)
      .then((data) => {
        if (active) {
          setTableData(data);
          setTableLoading(false);
        }
      })
      .catch((error: Error) => {
        if (active) {
          setTableError(error.message);
          setTableLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [tab, selectedTable.id]);

  useEffect(() => {
    if (tab !== "notebook" || notebook) return;
    let active = true;
    setNotebookLoading(true);
    setNotebookError(null);
    loadNotebook()
      .then((data) => {
        if (active) {
          setNotebook(data);
          setNotebookLoading(false);
        }
      })
      .catch((error: Error) => {
        if (active) {
          setNotebookError(error.message);
          setNotebookLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [tab, notebook]);

  const previewColumns = useMemo<TableColumn[]>(() => {
    if (!tableData) return [];
    const numeric = new Set(["integer", "float", "number", "int", "double"]);
    return tableData.columns.map((key) => ({
      key,
      label: titleCase(key),
      align: numeric.has(tableData.types[key]) ? "right" : undefined,
    }));
  }, [tableData]);

  const filteredCells = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (notebook?.cells ?? []).filter((cell) => {
      if (notebookType === "code" && !cell.is_code) return false;
      if (notebookType === "markdown" && cell.is_code) return false;
      if (phaseFilter !== "all" && cell.phase !== phaseFilter) return false;
      if (!needle) return true;
      return `${cell.source} ${cell.output} ${cell.phase} ${cell.type}`.toLowerCase().includes(needle);
    });
  }, [notebook, query, notebookType, phaseFilter]);

  const provRows = useMemo(() => {
    const needle = provQuery.trim().toLowerCase();
    return (provenance.data?.items ?? []).filter((item) =>
      !needle || `${item.id} ${item.title} ${item.phase} ${item.kind} ${item.group}`.toLowerCase().includes(needle),
    );
  }, [provenance.data, provQuery]);

  const inspected = (provenance.data?.items ?? []).find((item) => item.id === inspectId) ?? null;

  useEffect(() => {
    if (tab !== "notebook" || !cellParam || !notebook) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`cell-${cellParam}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [tab, cellParam, notebook]);

  const interactive = useMemo(() => {    const needle = query.trim().toLowerCase();
    if (!needle) return manifest.htmlArtifacts;
    return manifest.htmlArtifacts.filter((figure) =>
      `${figure.id} ${figure.title} ${figure.caption}`.toLowerCase().includes(needle),
    );
  }, [manifest.htmlArtifacts, query]);

  const openTable = (id: string) => {
    updateParams({ tab: "tables", table: id });
    window.setTimeout(() => {
      document.getElementById("table-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const sourceHref = (name: string) => {
    if (name === "fraud_eda_colab.ipynb") return asset("artifacts/notebook/fraud_eda_colab.ipynb");
    if (name === "findings_ledger.json") return asset("artifacts/logs/findings_ledger.json");
    if (name === "findings.md") return asset("artifacts/logs/findings.md");
    return null;
  };

  const sourceRows = manifest.sources.map((source) => ({
    ...source,
    link: sourceHref(source.name),
  }));

  const sourceColumns: TableColumn[] = [
    {
      key: "name",
      label: "Source",
      render: (row) =>
        row.link ? (
          <a className="insight-link" href={row.link} target="_blank" rel="noreferrer">
            {row.name} <ExternalLink size={10} />
          </a>
        ) : (
          <span className="mono">{row.name}</span>
        ),
    },
    { key: "role", label: "Role" },
    { key: "present", label: "Present", render: (row) => <StatusBadge status={row.present ? "present" : "absent"} /> },
    { key: "bytes", label: "Bytes", align: "right", render: (row) => fmtBytes(row.bytes) },
    { key: "hash", label: "SHA-16", render: (row) => <span className="mono tiny">{row.hash ?? "—"}</span> },
    { key: "note", label: "Note" },
  ];

  const warningRows = manifest.warnings;
  const warningColumns: TableColumn[] = [
    { key: "id", label: "ID", render: (row) => <span className="mono">{row.id}</span> },
    { key: "severity", label: "Severity", render: (row) => <span className="badge badge-weak">{row.severity}</span> },
    { key: "category", label: "Category" },
    { key: "message", label: "Message" },
    { key: "phase", label: "Phase", render: (row) => <span className="badge badge-neutral">{row.phase}</span> },
    { key: "cell", label: "Cell", align: "right", render: (row) => (row.cell != null ? `#${row.cell + 1}` : "—") },
  ];

  const checklistPass = analysis.checklist.filter((item) => item.ok).length;

  return (
    <>
      <PageHeader
        eyebrow="P8 · Artifacts & run provenance"
        title={<>Every figure, table and cell — <em>with its receipt.</em></>}
        description="The run produced 129 PNG figures, 7 interactive Plotly artifacts, 46 CSV tables and a 66-cell notebook. Browse the rendered evidence, preview any table, search the notebook, and inspect the sources, warnings and reproducibility checklist behind the dashboard."
        actions={
          <>
            <a className="btn btn-sm" href={asset("artifacts/notebook/fraud_eda_colab.ipynb")} target="_blank" rel="noreferrer">
              <Download />
              Notebook
            </a>
            <button type="button" className="btn btn-sm" onClick={() => downloadJson("fraud_evidence_manifest.json", manifest)}>
              <Download />
              Manifest
            </button>
          </>
        }
        meta={
          <div className="row wrap" style={{ gap: 7 }}>
            <span className="badge badge-phase">P8 report layer</span>
            <span className="badge badge-neutral">129 figures</span>
            <span className="badge badge-neutral">7 interactive</span>
            <span className="badge badge-neutral">46 tables</span>
            <span className="badge badge-neutral">66 notebook cells</span>
          </div>
        }
      />

      <div className="tabs" style={{ marginBottom: 16 }}>
        {TABS.map((item) => {
          const Icon = item.icon;
          const count =
            item.id === "figures"
              ? manifest.counts.figures
              : item.id === "interactive"
                ? manifest.counts.interactive
                : item.id === "tables"
                  ? manifest.counts.tables
                  : item.id === "notebook"
                    ? manifest.notebook.total_cells
                    : null;
          return (
            <button
              type="button"
              key={item.id}
              className={`tab ${tab === item.id ? "active" : ""}`}
              onClick={() => switchTab(item.id)}
              role="tab"
              aria-selected={tab === item.id}
            >
              <Icon size={12} />
              {item.label}
              {count != null ? <span className="count">{count}</span> : null}
            </button>
          );
        })}
      </div>

      {tab === "figures" ? (
        <Panel noBody>
          <div className="artifact-toolbar">
            <label className="field grow">
              <Search />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  updateParams({ q: event.target.value || null });
                }}
                placeholder="Search 129 figures by title, caption or ID…"
                aria-label="Search figures"
              />
            </label>
            <label className="field">
              <span className="tiny muted">Phase</span>
              <select
                value={phaseFilter}
                onChange={(event) => {
                  setPhaseFilter(event.target.value);
                  updateParams({ phase: event.target.value === "all" ? null : event.target.value });
                }}
                aria-label="Filter figures by phase"
              >
                <option value="all">All phases</option>
                {manifest.phases.filter((phase) => phase.figureCount > 0).map((phase) => (
                  <option value={phase.id} key={phase.id}>
                    {phase.id} · {phase.figureCount}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="tiny muted">Group</span>
              <select
                value={groupFilter}
                onChange={(event) => {
                  setGroupFilter(event.target.value);
                  updateParams({ group: event.target.value === "all" ? null : event.target.value });
                }}
                aria-label="Filter figures by group"
              >
                <option value="all">All groups</option>
                {figureGroups.map((group) => (
                  <option value={group} key={group}>{group}</option>
                ))}
              </select>
            </label>
            <button type="button" className="btn btn-sm" onClick={resetFilters} disabled={!query && phaseFilter === "all" && groupFilter === "all"}>
              Reset
            </button>
            <span className="table-count">{filteredFigures.length.toLocaleString()} figures</span>
          </div>
          <div style={{ padding: 16 }}>
            {visibleFigures.length ? (
              <>
                <div className="gallery-grid">
                  {visibleFigures.map((figure) => (
                    <button type="button" className="gallery-card" key={figure.id} onClick={() => openFigure(figure)}>
                      <div className="figure-thumb">
                        {figure.thumb ? <img loading="lazy" src={asset(figure.thumb)} alt="" /> : <div style={{ display: "grid", placeItems: "center", height: "100%" }}><ImageIcon size={22} /></div>}
                        <span className="fig-tag">{figure.phase}</span>
                      </div>
                      <div className="gallery-meta">
                        <div className="gallery-title">{figure.title}</div>
                        <div className="gallery-sub">
                          <span>{figure.group}</span>
                          <span>{fmtBytes(figure.bytes)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="row-between mt-16" style={{ flexWrap: "wrap", gap: 10 }}>
                  <span className="tiny muted">
                    Showing {visibleFigures.length} of {filteredFigures.length} figures. Deep link with <code>?figure=ID</code>.
                  </span>
                  {visibleFigures.length < filteredFigures.length ? (
                    <button type="button" className="btn btn-sm" onClick={() => setFigurePage((page) => page + 36)}>
                      Load 36 more
                    </button>
                  ) : null}
                </div>
              </>
            ) : (
              <EmptyState title="No figures match those filters" text="Clear the search or choose another phase/group." />
            )}
          </div>
          <SourceNote>Thumbnails are WebP derivatives of the original PNGs under <code>figures/</code>; the lightbox links to the original file.</SourceNote>
        </Panel>
      ) : null}

      {tab === "interactive" ? (
        <Panel noBody>
          <div className="artifact-toolbar">
            <label className="field grow">
              <Search />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  updateParams({ q: event.target.value || null });
                }}
                placeholder="Search 7 interactive artifacts…"
                aria-label="Search interactive artifacts"
              />
            </label>
            <span className="table-count">{interactive.length} artifacts</span>
          </div>
          <div style={{ padding: 16 }}>
            <Callout tone="warn" title="These artifacts load Plotly from a CDN">
              <p>
                The 7 HTML artifacts require internet access to <code>cdn.plot.ly</code>. They are otherwise self-contained
                Plotly documents. Seven static PNG exports were skipped because Plotly 5.24.1 is incompatible with Kaleido
                1.5.0; the HTML files are the surviving versions.
              </p>
            </Callout>
            <div className="gallery-grid mt-16">
              {interactive.map((figure) => (
                <div className="html-card" key={figure.id}>
                  <div className="html-icon"><Boxes size={16} /></div>
                  <h4>{figure.title}</h4>
                  <p>{figure.caption || "Interactive Plotly artifact."}</p>
                  <div className="tiny muted mt-8">{figure.phase} · {fmtBytes(figure.bytes)}</div>
                  <a href={asset(figure.full)} target="_blank" rel="noreferrer">
                    Open interactive <ExternalLink size={11} />
                  </a>
                </div>
              ))}
            </div>
            {!interactive.length ? <EmptyState title="No interactive artifacts match that search" /> : null}
          </div>
          <SourceNote>From <code>figures/*.html</code>. These are the artifacts that could not be rendered as static PNGs in the run.</SourceNote>
        </Panel>
      ) : null}

      {tab === "tables" ? (
        <Panel noBody>
          <div className="artifact-toolbar">
            <label className="field grow">
              <Search />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  updateParams({ q: event.target.value || null });
                }}
                placeholder="Search 46 tables by name, category or description…"
                aria-label="Search tables"
              />
            </label>
            <label className="field">
              <span className="tiny muted">Phase</span>
              <select
                value={phaseFilter}
                onChange={(event) => {
                  setPhaseFilter(event.target.value);
                  updateParams({ phase: event.target.value === "all" ? null : event.target.value });
                }}
                aria-label="Filter tables by phase"
              >
                <option value="all">All phases</option>
                {manifest.phases.filter((phase) => phase.tableCount > 0).map((phase) => (
                  <option value={phase.id} key={phase.id}>{phase.id} · {phase.tableCount}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="tiny muted">Category</span>
              <select
                value={groupFilter}
                onChange={(event) => {
                  setGroupFilter(event.target.value);
                  updateParams({ group: event.target.value === "all" ? null : event.target.value });
                }}
                aria-label="Filter tables by category"
              >
                <option value="all">All categories</option>
                {tableCategories.map((category) => (
                  <option value={category} key={category}>{category}</option>
                ))}
              </select>
            </label>
            <button type="button" className="btn btn-sm" onClick={resetFilters} disabled={!query && phaseFilter === "all" && groupFilter === "all"}>
              Reset
            </button>
            <span className="table-count">{filteredTables.length} tables</span>
          </div>
          <div className="table-catalog">
            <div className="table-list">
              {filteredTables.map((table) => (
                <button
                  type="button"
                  key={table.id}
                  className={`table-list-item ${selectedTable.id === table.id ? "active" : ""}`}
                  onClick={() => openTable(table.id)}
                >
                  <div className="tli-title">{table.title}</div>
                  <div className="tli-sub">
                    <span>{table.phase}</span>
                    <span>{table.rows.toLocaleString()} × {table.cols}</span>
                  </div>
                </button>
              ))}
              {!filteredTables.length ? <div className="tiny muted" style={{ padding: 12 }}>No tables match those filters.</div> : null}
            </div>
            <div className="table-detail" id="table-detail">
              <div className="table-detail-head">
                <div className="row-between" style={{ gap: 10, alignItems: "flex-start" }}>
                  <div>
                    <h3>{selectedTable.title}</h3>
                    <p>{selectedTable.description}</p>
                  </div>
                  <div className="row" style={{ gap: 6, flexShrink: 0 }}>
                    <a className="btn btn-sm" href={asset(`artifacts/${selectedTable.source}`)} target="_blank" rel="noreferrer">
                      <Download />
                      CSV
                    </a>
                    <Link className="btn btn-sm" to={`/artifacts?tab=tables&table=${selectedTable.id}`}>
                      <ArrowUpRight />
                      Link
                    </Link>
                  </div>
                </div>
                <div className="table-detail-meta">
                  <span><b>{selectedTable.phase}</b> · {selectedTable.category}</span>
                  <span>{fmtInt(selectedTable.rows)} rows × {selectedTable.cols} cols</span>
                  <span>{fmtBytes(selectedTable.bytes)}</span>
                  <span>{fmtInt(selectedTable.missing_cells)} missing cells</span>
                  <span className="mono">{selectedTable.source}</span>
                </div>
              </div>
              <div className="column-chips">
                {selectedTable.columns.map((column) => (
                  <span className="column-chip" key={column.key}>
                    {column.key}
                    <b>{column.type}</b>
                    {column.missing ? <span title={`${column.missing} missing cells`}> · {column.missing}</span> : null}
                  </span>
                ))}
              </div>
              <div style={{ padding: 16 }}>
                {tableError ? (
                  <Callout tone="danger" title="Could not load table preview">
                    <p>{tableError}</p>
                  </Callout>
                ) : tableLoading || !tableData ? (
                  <div className="stack" style={{ gap: 8 }}>
                    <div className="skeleton" style={{ height: 22 }} />
                    <div className="skeleton" style={{ height: 160 }} />
                    <span className="tiny muted">Loading the processed table JSON…</span>
                  </div>
                ) : (
                  <DataTable
                    key={selectedTable.id}
                    rows={tableData.rows}
                    columns={previewColumns}
                    pageSize={10}
                    maxHeight={430}
                    exportName={`${selectedTable.id}.csv`}
                    searchPlaceholder="Search table rows…"
                    countLabel="preview rows"
                  />
                )}
                <SourceNote>
                  Preview is loaded from <code>data/tables/{selectedTable.id}.json</code>; the CSV link downloads the generated
                  artifact under <code>artifacts/tables/</code>. Raw Kaggle source rows are not present.
                </SourceNote>
              </div>
            </div>
          </div>
        </Panel>
      ) : null}

      {tab === "provenance" ? (
        <>
          <div className="grid grid-12">
            <Panel
              className="span-8"
              title="Provenance index"
              subtitle="Every artifact with the notebook cell that produced it. Verified rows were located in a recorded output line; inferred rows are phase-level matches only."
              action={
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() =>
                    downloadJson(
                      "fraud_artifact_provenance.json",
                      {
                        generatedAt: provenance.data?.generatedAt,
                        counts: provenance.data?.counts,
                        items: provRows.map((item) => ({
                          id: item.id,
                          kind: item.kind,
                          title: item.title,
                          phase: item.phase,
                          group: item.group,
                          provenance: item.provenance,
                          producing_cell: item.cell,
                          cell_line: item.cellLine,
                          source: item.source,
                          bytes: item.bytes,
                          rows: item.rows,
                          related_findings: item.relatedFindings.map((finding) => finding.id),
                        })),
                      },
                    )
                  }
                >
                  <Download /> Export index
                </button>
              }
            >
              <div className="filter-bar" style={{ marginBottom: 12 }}>
                <div className="filter-search">
                  <Search />
                  <input
                    value={provQuery}
                    onChange={(event) => setProvQuery(event.target.value)}
                    placeholder="Search artifact id, title, phase…"
                    aria-label="Search the provenance index"
                  />
                </div>
                <span className="table-count">{provRows.length} artifacts</span>
              </div>
              {provenance.error ? <Callout tone="danger" title="Provenance unavailable"><p>{provenance.error}</p></Callout> : null}
              {provenance.loading ? <div className="skeleton" style={{ height: 300 }} /> : null}
              {!provenance.loading && provRows.length ? (
                <div className="provenance-table-wrap">
                  <table className="data-table provenance-table">
                    <caption className="sr-only">Artifact provenance index</caption>
                    <thead>
                      <tr>
                        <th scope="col">Artifact</th>
                        <th scope="col">Kind</th>
                        <th scope="col">Phase</th>
                        <th scope="col">Provenance</th>
                        <th scope="col">Producing cell</th>
                        <th scope="col">Related findings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {provRows.map((item) => (
                        <tr key={`${item.kind}-${item.id}`}>
                          <th scope="row">
                            <button
                              type="button"
                              className="link-button"
                              onClick={() => {
                                setInspectId(item.id);
                                updateParams({ artifact: item.id });
                              }}
                            >
                              {item.title || item.id}
                            </button>
                            <small>{item.id}</small>
                          </th>
                          <td>{item.kind}</td>
                          <td>{item.phase}</td>
                          <td><ProvenanceBadge value={item.provenance} /></td>
                          <td>{item.cell != null ? `cell ${item.cell}` : "—"}</td>
                          <td>{item.relatedFindings.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {!provenance.loading && provRows.length === 0 ? (
                <EmptyState title="No artifacts match that search" text="Clear the search to see the full index." />
              ) : null}
            </Panel>

            <div className="span-4 stack">
              <Panel title="Provenance coverage" subtitle="How much of the library is traceable to a cell.">
                <div className="stat-grid">
                  <Stat value={fmtInt(provenance.data?.counts.total ?? 0)} label="Artifacts" />
                  <Stat value={fmtInt(provenance.data?.counts.verifiedProvenance ?? 0)} label="Verified" />
                  <Stat value={fmtInt(provenance.data?.counts.inferredProvenance ?? 0)} label="Inferred" />
                </div>
                <SourceNote>
                  A verified edge means the notebook output contains a write line for that file. An inferred edge means the
                  artifact belongs to the phase but no producing cell could be located.
                </SourceNote>
              </Panel>
              <Panel title="Trace a path" subtitle="Open the same graph in the evidence map.">
                <ul className="boundary-list">
                  <li><GitBranch /> Every artifact, finding, phase and source is a node in the evidence map.</li>
                  <li><ShieldAlert /> Inferred edges are drawn dashed so a reader can tell them apart from recorded ones.</li>
                </ul>
                <Link className="btn btn-sm btn-primary" to="/lineage">Open the evidence map <ArrowUpRight /></Link>
              </Panel>
            </div>
          </div>
        </>
      ) : null}

      {tab === "notebook" ? (
        <Panel noBody>
          <div className="artifact-toolbar">
            <label className="field grow">
              <Search />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  updateParams({ q: event.target.value || null });
                }}
                placeholder="Search code, markdown and outputs across 66 cells…"
                aria-label="Search notebook"
              />
            </label>
            <label className="field">
              <span className="tiny muted">Phase</span>
              <select
                value={phaseFilter}
                onChange={(event) => {
                  setPhaseFilter(event.target.value);
                  updateParams({ phase: event.target.value === "all" ? null : event.target.value });
                }}
                aria-label="Filter notebook by phase"
              >
                <option value="all">All phases</option>
                {notebookPhases.map((phase) => (
                  <option value={phase} key={phase}>{phase}</option>
                ))}
              </select>
            </label>
            <Segmented
              ariaLabel="Notebook cell type"
              options={[
                { value: "all", label: "All" },
                { value: "code", label: "Code" },
                { value: "markdown", label: "Markdown" },
              ]}
              value={notebookType}
              onChange={setNotebookType}
            />
            <button type="button" className="btn btn-sm" onClick={resetFilters} disabled={!query && phaseFilter === "all" && notebookType === "all"}>
              Reset
            </button>
            <span className="table-count">{filteredCells.length} cells</span>
          </div>
          <div style={{ padding: 16 }}>
            <div className="stat-grid mb-16">
              <Stat value={fmtInt(manifest.notebook.total_cells)} label="Cells" />
              <Stat value={fmtInt(manifest.notebook.code_cells)} label="Code" />
              <Stat value={fmtInt(manifest.notebook.cells_with_output)} label="With output" />
              <Stat value={fmtInt(manifest.notebook.error_outputs)} label="Errors" />
              <Stat value={fmtInt(manifest.notebook.output_chars)} label="Output chars" />
              <Stat value={fmtInt(manifest.notebook.embedded_images)} label="Embedded images" />
            </div>
            {notebookError ? (
              <Callout tone="danger" title="Could not load the notebook">
                <p>{notebookError}</p>
              </Callout>
            ) : notebookLoading || !notebook ? (
              <div className="stack" style={{ gap: 8 }}>
                <div className="skeleton" style={{ height: 120 }} />
                <div className="skeleton" style={{ height: 120 }} />
                <span className="tiny muted">Loading 66 cells…</span>
              </div>
            ) : filteredCells.length ? (
              <div className="stack" style={{ gap: 12 }}>
                {filteredCells.map((cell) => <NotebookCard cell={cell} key={cell.index} />)}
              </div>
            ) : (
              <EmptyState title="No notebook cells match that search" text="Try a code symbol, a phase, or clear the type filter." />
            )}
          </div>
          <SourceNote>
            Loaded lazily from <code>data/notebook.json</code>. Markdown is displayed as source text; outputs are collapsed
            by default. The original <code>.ipynb</code> is available from the header.
          </SourceNote>
        </Panel>
      ) : null}

      {tab === "run" ? (
        <>
          <div className="grid grid-12">
            <Panel className="span-7" title="Run provenance" subtitle="The notebook and logs are the primary evidence; this dashboard reconstructs from their outputs.">
              <div className="grid grid-2" style={{ gap: 16 }}>
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="t">Run start</div>
                    <div className="h">{fmtDateTime(manifest.run.start)}</div>
                    <div className="d">{manifest.run.platform} · Python {manifest.run.python}</div>
                  </div>
                  <div className="timeline-item">
                    <div className="t">Execution</div>
                    <div className="h">{manifest.run.executedCells} of {manifest.run.codeCells} code cells</div>
                    <div className="d">{manifest.run.cellsWithOutput} with output · {manifest.run.errorOutputs} error outputs</div>
                  </div>
                  <div className="timeline-item">
                    <div className="t">Run end</div>
                    <div className="h">{fmtDateTime(manifest.run.end)}</div>
                    <div className="d">{fmtDuration(manifest.run.durationSeconds)} elapsed · seed {manifest.run.seed}</div>
                  </div>
                  <div className="timeline-item">
                    <div className="t">Artifacts</div>
                    <div className="h">{manifest.counts.figures} figures · {manifest.counts.interactive} interactive</div>
                    <div className="d">{manifest.counts.tables} tables · {manifest.counts.findings} graded findings</div>
                  </div>
                </div>
                <div className="stack" style={{ gap: 2 }}>
                  <div className="stat-row"><span className="k">Run ID</span><span className="v mono">{manifest.run.id}</span></div>
                  <div className="stat-row"><span className="k">Label</span><span className="v">{manifest.run.label}</span></div>
                  <div className="stat-row"><span className="k">Seed</span><span className="v">{manifest.run.seed}</span></div>
                  <div className="stat-row"><span className="k">Smoke run</span><span className="v">{manifest.run.smoke ? "Yes" : "No"}</span></div>
                  <div className="stat-row"><span className="k">Robustness</span><span className="v">{manifest.run.robustness ? "Enabled" : "Disabled"}</span></div>
                  <div className="stat-row"><span className="k">Duration</span><span className="v">{fmtDuration(manifest.run.durationSeconds)}</span></div>
                  <div className="stat-row"><span className="k">Output chars</span><span className="v">{fmtInt(manifest.run.outputChars)}</span></div>
                  <div className="stat-row"><span className="k">Timezone</span><span className="v">{manifest.run.timezoneNote}</span></div>
                </div>
              </div>
              <SourceNote>From <code>logs/findings.md</code>, notebook execution counts and <code>logs/env_snapshot.json</code>.</SourceNote>
            </Panel>

            <Panel className="span-5" title="Source availability" subtitle="What is in the workspace, and what is only referenced.">
              <DataTable rows={sourceRows} columns={sourceColumns} pageSize={6} maxHeight={310} searchPlaceholder="Search sources…" countLabel="sources" />
              <SourceNote>The two raw Kaggle CSVs are referenced by hash and size but are absent. The notebook cannot be rerun end-to-end from this folder alone.</SourceNote>
            </Panel>
          </div>

          <div className="grid grid-12 mt-16">
            <Panel className="span-5" title="Reproducibility checklist" subtitle={`${checklistPass} of ${analysis.checklist.length} checks recorded as passed.`}>
              <div className="stack" style={{ gap: 0 }}>
                {analysis.checklist.map((item) => (
                  <div key={item.item} className="row" style={{ alignItems: "flex-start", gap: 8, padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
                    {item.ok ? <CheckCircle2 size={14} color="#1f8a70" style={{ flex: "0 0 auto", marginTop: 2 }} /> : <XCircle size={14} color="#cb4257" style={{ flex: "0 0 auto", marginTop: 2 }} />}
                    <div style={{ minWidth: 0 }}>
                      <b style={{ fontSize: 11 }}>{item.item}</b>
                      <div className="tiny muted mono" style={{ marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.evidence}>
                        {item.evidence}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <SourceNote>From <code>tables/reproducibility_checklist.csv</code>. A checked item means the notebook records it, not that an external auditor verified it.</SourceNote>
            </Panel>

            <Panel className="span-7" title="Warnings logged during the run" subtitle="Export failures, a dependency conflict and a SHAP subsample." action={<span className="badge badge-weak">{warningRows.length} warnings</span>}>
              <DataTable rows={warningRows} columns={warningColumns} pageSize={5} exportName="run_warnings.csv" searchPlaceholder="Search warnings…" countLabel="warnings" />
              <SourceNote>From notebook stderr/stdout captured in <code>logs/findings.md</code>. Warnings are not failures; the run completed with zero tracebacks.</SourceNote>
            </Panel>
          </div>

          <Panel className="mt-16" title="Curated issues" subtitle="Sixteen reproducibility, model-risk and evidence-quality issues identified in the workspace audit. Expand a row for evidence and action." action={<span className="badge badge-caveat">{manifest.issues.filter((issue) => issue.severity === "High").length} high severity</span>}>
            <div className="stack" style={{ gap: 8 }}>
              {manifest.issues.map((issue) => (
                <details className="finding-row" key={issue.id}>
                  <summary>
                    <div className="finding-top">
                      <span className="finding-id">{issue.id}</span>
                      <span className={severityClass(issue.severity)}>{issue.severity}</span>
                      <span className="badge badge-neutral">{issue.category}</span>
                      <span className="badge badge-neutral">{issue.status}</span>
                      <span className="tiny muted" style={{ marginLeft: "auto" }}>{issue.scope}</span>
                    </div>
                    <div className="finding-text">{issue.title}</div>
                  </summary>
                  <div className="finding-evidence">
                    <p>{issue.summary}</p>
                    {issue.evidence.length ? (
                      <ul style={{ margin: "8px 0 0 16px", padding: 0, color: "var(--text-soft)", fontSize: 10.5, lineHeight: 1.6 }}>
                        {issue.evidence.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    ) : null}
                    <div className="grid grid-2 mt-12" style={{ gap: 10 }}>
                      <div>
                        <div className="drawer-label">Impact</div>
                        <p>{issue.impact}</p>
                      </div>
                      <div>
                        <div className="drawer-label">Recommended action</div>
                        <p>{issue.action}</p>
                      </div>
                    </div>
                    <div className="row wrap mt-8" style={{ gap: 6 }}>
                      {issue.sources.map((source) => <span className="column-chip" key={source}>{source}</span>)}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </Panel>

          <div className="grid grid-12 mt-16">
            <Panel className="span-7" title="Five independent audit notes" subtitle="These notes were written for this reconstruction and do not alter the ledger.">
              <div className="grid grid-2" style={{ gap: 10 }}>
                {manifest.auditNotes.map((note) => (
                  <div className="panel pad" key={note.id} style={{ background: "var(--surface-2)" }}>
                    <div className="row-between" style={{ flexWrap: "wrap", gap: 6 }}>
                      <span className="finding-id">{note.id} · {note.phase}</span>
                      <span className={auditStatusClass(note.status)}>{note.status}</span>
                    </div>
                    <b style={{ display: "block", fontSize: 11.5, marginTop: 6, lineHeight: 1.4 }}>{note.title}</b>
                    <p className="tiny muted mt-8" style={{ lineHeight: 1.5 }}>{note.observation}</p>
                    <div className="row wrap mt-8" style={{ gap: 5 }}>
                      {note.sources.map((source) => <span className="column-chip" key={source}>{source}</span>)}
                    </div>
                  </div>
                ))}
              </div>
              <SourceNote>Full audit notes and linked findings are on the Findings page. AN-05 is note-only because no ledger finding references the artifact-count discrepancy.</SourceNote>
            </Panel>

            <Panel className="span-5" title="Environment" subtitle="The run's own snapshot, not a re-derived environment.">
              <div className="grid grid-2" style={{ gap: 7 }}>
                {Object.entries(manifest.environment).map(([key, value]) => (
                  <div className="panel pad" key={key} style={{ background: "var(--surface-2)", padding: "8px 10px" }}>
                    <div className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 750 }}>{titleCase(key)}</div>
                    <div className="mono" style={{ fontSize: 10.5, marginTop: 2 }}>{String(value)}</div>
                  </div>
                ))}
              </div>
              <SourceNote>From <code>logs/env_snapshot.json</code>. Local Python differs from the run environment; the static app does not depend on it.</SourceNote>
            </Panel>
          </div>

          <Panel className="mt-16" title="Inventory and limits" subtitle="What this console is — and is not.">
            <div className="grid grid-4" style={{ gap: 12 }}>
              <div className="panel pad" style={{ background: "var(--surface-2)" }}>
                <div className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 750 }}>Figures</div>
                <div className="serif" style={{ fontSize: 29, marginTop: 4 }}>{manifest.counts.figures} + {manifest.counts.interactive}</div>
                <p className="tiny muted mt-8">129 PNGs and 7 interactive Plotly HTML artifacts. Thumbnails are WebP derivatives.</p>
              </div>
              <div className="panel pad" style={{ background: "var(--surface-2)" }}>
                <div className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 750 }}>Tables</div>
                <div className="serif" style={{ fontSize: 29, marginTop: 4 }}>{manifest.counts.tables}</div>
                <p className="tiny muted mt-8">Generated CSVs, all previewable and downloadable. No raw source data is embedded.</p>
              </div>
              <div className="panel pad" style={{ background: "var(--surface-2)" }}>
                <div className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 750 }}>Notebook</div>
                <div className="serif" style={{ fontSize: 29, marginTop: 4 }}>{manifest.notebook.total_cells}</div>
                <p className="tiny muted mt-8">33 code cells, 31 with output, 0 tracebacks. 1 embedded image, not extracted to a file.</p>
              </div>
              <div className="panel pad" style={{ background: "var(--surface-2)" }}>
                <div className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 750 }}>Native PBI</div>
                <div className="serif" style={{ fontSize: 29, marginTop: 4 }}>None</div>
                <p className="tiny muted mt-8">No PBIX/PBIP tools or files. This is a React simulation; the reproduction pack is documentation and CSV/DAX assets.</p>
              </div>
            </div>
            <div className="mt-12">
              <Callout tone="danger" title="Source limits travel with every page">
                <p>
                  The folder contains one notebook, generated figures/tables and logs — not the raw <code>fraudTrain.csv</code>{" "}
                  or <code>fraudTest.csv</code>. It also contains no Power BI authoring file. All metrics are transcribed or
                  derived from the generated artifacts; none were recomputed from raw transactions.
                </p>
              </Callout>
            </div>
            <SourceNote>Missing raw data and missing PBIX are confirmed workspace limitations, not dashboard bugs.</SourceNote>
          </Panel>
        </>
      ) : null}

      {lightboxId && lightboxIndex >= 0 ? (
        <FigureLightbox
          figures={lightboxList}
          index={lightboxIndex}
          onClose={closeFigure}
          onIndex={(index) => {
            const next = lightboxList[index];
            if (!next) return;
            setLightboxId(next.id);
            updateParams({ tab: "figures", figure: next.id });
          }}
        />
      ) : null}

      <Drawer
        open={Boolean(inspected)}
        onClose={() => {
          setInspectId(null);
          updateParams({ artifact: null });
        }}
        eyebrow={inspected ? `${inspected.kind} · ${inspected.phase}` : undefined}
        title={inspected?.title ?? ""}
        width={620}
        footer={inspected ? (
          <div className="row-between wrap">
            {inspected.exploreHref ? (
              <Link className="btn btn-sm btn-primary" to={inspected.exploreHref}>Open in data explorer <ArrowUpRight /></Link>
            ) : inspected.full ? (
              <a className="btn btn-sm btn-primary" href={asset(inspected.full)} target="_blank" rel="noreferrer">
                Open the original file <ExternalLink />
              </a>
            ) : null}
            <Link className="btn btn-sm" to={`/lineage?node=${inspected.lineageNodeId ?? `artifact:${inspected.id}`}`}>Trace in evidence map <ArrowUpRight /></Link>
          </div>
        ) : null}
      >
        {inspected ? (
          <div className="artifact-inspector">
            <div className="dossier-detail-top">
              <ProvenanceBadge value={inspected.provenance} />
              <span className="mono">{inspected.id}</span>
              {inspected.cell != null ? <span>produced in cell {inspected.cell}</span> : <span>no producing cell located</span>}
            </div>
            {inspected.caption ? <p className="dossier-purpose">{inspected.caption}</p> : null}
            <div className="detail-stat-grid">
              <div><b>{inspected.kind}</b><span>type</span></div>
              <div><b>{inspected.phase}</b><span>phase</span></div>
              <div><b>{inspected.bytes ? fmtBytes(inspected.bytes) : "—"}</b><span>size</span></div>
              {inspected.rows != null ? <div><b>{fmtInt(inspected.rows)}</b><span>rows</span></div> : null}
              {inspected.width ? <div><b>{inspected.width}×{inspected.height}</b><span>pixels</span></div> : null}
              {inspected.cols != null ? <div><b>{inspected.cols}</b><span>columns</span></div> : null}
            </div>
            {inspected.full ? (
              <img
                className="inspector-preview"
                src={asset(inspected.thumb ?? inspected.full)}
                alt={`Preview of ${inspected.title}`}
                loading="lazy"
              />
            ) : null}
            <h4 className="detail-heading">Recorded source</h4>
            <dl className="kv-list">
              <div><dt>File</dt><dd className="mono">{inspected.source ?? "—"}</dd></div>
              <div><dt>Producing cell</dt><dd>{inspected.cell != null ? `cell ${inspected.cell}` : "not located"}</dd></div>
              <div><dt>Write line</dt><dd className="mono">{inspected.cellLine ?? "—"}</dd></div>
              <div><dt>Group</dt><dd>{inspected.group || "—"}</dd></div>
              <div><dt>Research question</dt><dd>{inspected.relatedRq ?? "—"}</dd></div>
            </dl>
            {inspected.cell != null ? (
              <Link className="btn btn-sm" to={`/artifacts?tab=notebook&cell=${inspected.cell}`}>
                Open notebook cell {inspected.cell} <ArrowUpRight />
              </Link>
            ) : null}
            <h4 className="detail-heading">Related findings (phase level)</h4>
            {inspected.relatedFindings.length ? (
              <ul className="detail-findings">
                {inspected.relatedFindings.map((finding) => (
                  <li key={finding.id}>
                    <Link to={`/findings?finding=${finding.id}`}>{finding.id} · {finding.title}</Link>
                    <span>{finding.grade}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="tiny muted">No findings are recorded for this phase.</p>
            )}
            <SourceNote>
              {inspected.provenance === "verified"
                ? "The notebook output contains a write line for this artifact, so the producing cell is verified."
                : "The artifact belongs to this phase, but no write line was located; the producing cell is inferred."}
            </SourceNote>
          </div>
        ) : null}
      </Drawer>
    </>
  );
}
