import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Download, FilterX, Gauge, Search, Sigma, SlidersHorizontal } from "lucide-react";
import { useAsync } from "../lib/useAsync";
import { loadMetrics } from "../lib/data";
import { PageHeader, Panel, Callout, EmptyState, SourceNote } from "../components/ui";
import { Drawer, FilterPills, SourceChip } from "../components/phase2";
import { downloadCsv } from "../lib/csv";
import { fmtInt } from "../lib/format";
import type { Phase2Metric } from "../types";

const LAYER_LABELS: Record<string, string> = {
  KPI: "Headline KPIs",
  FND: "Finding metrics",
  MOD: "Model metrics",
  ECO: "Economics",
  DRF: "Drift",
  DAT: "Data quality",
  TMP: "Temporal",
  FEAT: "Feature",
  QUA: "Quality",
  OPS: "Operations",
};

export default function Metrics() {
  const metrics = useAsync(loadMetrics, []);
  const [params, setParams] = useSearchParams();
  const layer = params.get("layer") ?? "all";
  const confidence = params.get("confidence") ?? "all";
  const query = params.get("q") ?? "";
  const openId = params.get("metric");
  const data = metrics.data;

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    setParams(next, { replace: true });
  };

  const items = data?.items ?? [];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((metric) => {
      if (layer !== "all" && metric.layer !== layer) return false;
      if (confidence !== "all" && metric.confidence !== confidence) return false;
      if (!needle) return true;
      return `${metric.id} ${metric.metric} ${metric.definition} ${metric.formula} ${metric.sourceFile}`.toLowerCase().includes(needle);
    });
  }, [items, layer, confidence, query]);

  const open = items.find((metric) => metric.id === openId) ?? null;
  const [limit, setLimit] = useState(50);
  const layers = useMemo(() => {
    const counts = new Map<string, number>();
    for (const metric of items) counts.set(metric.layer, (counts.get(metric.layer) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const exportCatalog = () => {
    downloadCsv(
      "fraud_metric_catalog.csv",
      filtered.map((metric) => ({
        metric_id: metric.id,
        layer: metric.layer,
        metric: metric.metric,
        value: metric.value,
        unit: metric.unit,
        definition: metric.definition,
        formula: metric.formula,
        source_file: metric.sourceFile,
        source_locator: metric.sourceLocator,
        app_pages: metric.appPages,
        validation_checks: metric.validationChecks,
        confidence: metric.confidence,
        caveat: metric.caveat,
      })),
    );
  };

  return (
    <>
      <PageHeader
        eyebrow={<><Sigma size={13} /> Semantic layer</>}
        title={<>One definition <em>per metric.</em></>}
        description="The catalogue behind every number in this console: definition, formula, source file, source locator, validation check, confidence and caveat. The same catalogue drives the Power BI measure pack so the two cannot silently drift."
        actions={
          <div className="row wrap">
            <SourceChip to="/artifacts?tab=run">Power BI pack</SourceChip>
            <button type="button" className="btn btn-sm btn-primary" onClick={exportCatalog}><Download /> Export {fmtInt(filtered.length)} metrics</button>
          </div>
        }
        meta={data ? (
          <div className="header-meta">
            <span className="status-line"><Gauge /> {fmtInt(data.count)} metrics</span>
            <span className="status-line"><SlidersHorizontal /> {fmtInt(data.validated)} with validation checks</span>
            <span className="status-line"><Sigma /> {layers.length} layers</span>
          </div>
        ) : null}
      />

      <div className="filter-bar mt-16">
        <div className="filter-search">
          <Search />
          <input value={query} onChange={(event) => update({ q: event.target.value || null })} placeholder="Search metric, formula or source" aria-label="Search metrics" />
        </div>
        <FilterPills
          label="Metric layer"
          value={layer}
          onChange={(value) => update({ layer: value === "all" ? null : value })}
          options={[
            { value: "all", label: "All layers", count: items.length },
            ...layers.map(([key, count]) => ({ value: key, label: LAYER_LABELS[key] ?? key, count })),
          ]}
        />
        <select className="select" value={confidence} onChange={(event) => update({ confidence: event.target.value === "all" ? null : event.target.value })} aria-label="Filter by confidence">
          <option value="all">Any confidence</option>
          {Array.from(new Set(items.map((metric) => metric.confidence))).filter(Boolean).map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        {query || layer !== "all" || confidence !== "all" ? (
          <button type="button" className="btn btn-sm" onClick={() => setParams({}, { replace: true })}><FilterX /> Clear</button>
        ) : null}
      </div>

      {metrics.error ? <Callout tone="danger" title="Metric catalogue unavailable"><p>{metrics.error}</p></Callout> : null}

      <Panel
        className="mt-16"
        title={layer === "all" ? "All metrics" : LAYER_LABELS[layer] ?? layer}
        subtitle="Values are transcribed from the source tables; the console does not recompute them here."
        action={<span className="tiny muted">{fmtInt(filtered.length)} shown</span>}
      >
        {metrics.loading ? <div className="skeleton" style={{ height: 320 }} /> : null}
        {!metrics.loading && filtered.length === 0 ? <EmptyState title="No metrics match" text="Clear the filters to see the full catalogue." /> : null}
        {filtered.length ? (
          <div className="metric-table-wrap">
            <table className="data-table metric-table">
              <caption className="sr-only">Metric catalogue</caption>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Metric</th>
                  <th scope="col">Value</th>
                  <th scope="col">Unit</th>
                  <th scope="col">Confidence</th>
                  <th scope="col">Validation</th>
                  <th scope="col">Source</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, limit).map((metric) => (
                  <tr key={metric.id}>
                    <th scope="row">
                      <button type="button" className="link-button mono" onClick={() => update({ metric: metric.id })}>{metric.id}</button>
                    </th>
                    <td>{metric.metric}{metric.caveat ? <span className="caveat-flag" title={metric.caveat}>caveat</span> : null}</td>
                    <td className="num">{metric.value}</td>
                    <td>{metric.unit || "—"}</td>
                    <td><span className={`confidence ${metric.confidence}`}>{metric.confidence || "unspecified"}</span></td>
                    <td>{metric.validationChecks || "—"}</td>
                    <td>{metric.sourceTableId ? <Link className="inline-link" to={metric.sourceHref}>{metric.sourceFile}</Link> : metric.sourceFile}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {limit < filtered.length ? (
          <div className="row" style={{ justifyContent: "center", marginTop: 12 }}>
            <button type="button" className="btn btn-sm" onClick={() => setLimit((value) => value + 50)}>
              Show 50 more of {fmtInt(filtered.length - limit)} remaining
            </button>
          </div>
        ) : null}
        {filtered.length > 50 ? <SourceNote>Showing the first {Math.min(limit, filtered.length)} of {fmtInt(filtered.length)} matching metrics. Export the CSV for the complete selection.</SourceNote> : null}
      </Panel>

      <div className="grid grid-3 mt-16">
        <div className="panel pad">
          <h3 className="panel-title">Consistency rules</h3>
          <ul className="boundary-list">
            <li><Sigma /> A metric id resolves to exactly one definition, formula and source locator.</li>
            <li><Gauge /> Validation check ids point at the automated validator that re-checks the value.</li>
            <li><SlidersHorizontal /> Caveats travel with the metric; they are not stored in a separate report.</li>
          </ul>
        </div>
        <div className="panel pad">
          <h3 className="panel-title">Power BI parity</h3>
          <p className="panel-sub">
            The measure library in <span className="mono">powerbi/</span> mirrors these definitions. The pack is import-ready CSV plus DAX — no native PBIX or PBIP file exists in this workspace.
          </p>
          <Link className="btn btn-sm" to="/artifacts?tab=run">Open the run record <ArrowUpRight /></Link>
        </div>
        <div className="panel pad">
          <h3 className="panel-title">Known gaps</h3>
          <p className="panel-sub">
            {items.filter((metric) => !metric.validationChecks).length} catalogue entries have no automated validation check, and{" "}
            {items.filter((metric) => metric.caveat).length} carry a caveat that qualifies reuse.
          </p>
        </div>
      </div>

      <Drawer
        open={Boolean(open)}
        onClose={() => update({ metric: null })}
        eyebrow={open ? `${open.id} · ${LAYER_LABELS[open.layer] ?? open.layer}` : undefined}
        title={open?.metric ?? ""}
        footer={open ? (
          <div className="row-between wrap">
            <Link className="btn btn-sm btn-primary" to={open.sourceHref}>Open source <ArrowUpRight /></Link>
            <span className="tiny muted">Catalogue: reports/metric_catalog.csv</span>
          </div>
        ) : null}
      >
        {open ? <MetricDetail metric={open} /> : null}
      </Drawer>
    </>
  );
}

function MetricDetail({ metric }: { metric: Phase2Metric }) {
  return (
    <div className="metric-detail">
      <div className="detail-stat-grid">
        <div><b>{metric.value}</b><span>value</span></div>
        <div><b>{metric.unit || "—"}</b><span>unit</span></div>
        <div><b>{metric.confidence || "—"}</b><span>confidence</span></div>
        <div><b>{metric.validationChecks || "—"}</b><span>validation</span></div>
      </div>
      <h4 className="detail-heading">Definition</h4>
      <p>{metric.definition || "No definition recorded."}</p>
      <h4 className="detail-heading">Formula</h4>
      <pre className="formula-block">{metric.formula || "—"}</pre>
      <h4 className="detail-heading">Source</h4>
      <dl className="kv-list">
        <div><dt>File</dt><dd>{metric.sourceFile || "—"}</dd></div>
        <div><dt>Locator</dt><dd>{metric.sourceLocator || "—"}</dd></div>
        <div><dt>Shown on</dt><dd>{metric.appPages || "—"}</dd></div>
      </dl>
      {metric.caveat ? (
        <>
          <h4 className="detail-heading">Caveat</h4>
          <Callout tone="warn" title="Qualification"><p>{metric.caveat}</p></Callout>
        </>
      ) : null}
      <SourceNote>Transcribed from the metric catalogue; values are not recomputed by the interface.</SourceNote>
    </div>
  );
}
