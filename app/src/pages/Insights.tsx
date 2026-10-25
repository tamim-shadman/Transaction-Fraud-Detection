import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Copy, Download, FilterX, LineChart, Search, ShieldAlert, Sparkles } from "lucide-react";
import { useManifest } from "../context/AppContext";
import { useAsync } from "../lib/useAsync";
import { loadAnomalies, loadInsights } from "../lib/data";
import { PageHeader, Panel, Callout, SourceNote, EmptyState, StatusBadge } from "../components/ui";
import { AnomalyCard, FilterPills, InsightCard, MiniBar, SourceChip } from "../components/phase2";
import { downloadText } from "../lib/csv";
import { fmtValue } from "../lib/format";

const SCOPE_LABELS: Record<string, string> = {
  data: "Data & splits",
  drift: "Drift",
  economics: "Economics",
  evidence: "Evidence quality",
  features: "Features",
  logs: "Run & logs",
  model: "Model",
  temporal: "Temporal",
};

export default function Insights() {
  const manifest = useManifest();
  const [params, setParams] = useSearchParams();
  const insights = useAsync(loadInsights, []);
  const anomalies = useAsync(loadAnomalies, []);
  const scope = params.get("scope") ?? "all";
  const query = params.get("q") ?? "";

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  };

  const all = insights.data?.items ?? [];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return all
      .filter((insight) => scope === "all" || insight.scope === scope)
      .filter((insight) => !needle || `${insight.title} ${insight.statement} ${insight.detail} ${insight.scope}`.toLowerCase().includes(needle))
      .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
  }, [all, scope, query]);

  const scopeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const insight of all) counts.set(insight.scope, (counts.get(insight.scope) ?? 0) + 1);
    return counts;
  }, [all]);

  const exportBrief = () => {
    const lines = [
      "# Evidence brief",
      "",
      `Generated ${new Date().toISOString().slice(0, 10)} from the Fraud Evidence Console.`,
      `Source run: ${manifest.run.id} · ${manifest.counts.transactions.toLocaleString()} transactions · ${manifest.counts.findings} graded findings.`,
      "",
      `Scope: ${scope === "all" ? "all evidence" : SCOPE_LABELS[scope] ?? scope}`,
      `Insights: ${filtered.length}`,
      "",
    ];
    for (const insight of filtered) {
      lines.push(`## ${insight.id} · ${insight.title}`, "", insight.statement, "", insight.detail, "");
      lines.push("| Metric | Value | Source |", "| --- | --- | --- |");
      for (const metric of insight.metrics) {
        lines.push(`| ${metric.label} | ${fmtValue(metric.value, metric.format)} | ${metric.source} |`);
      }
      lines.push("", `Confidence: ${insight.confidence}. Caveat: ${insight.caveat}`, "", `Open: ${insight.link}`, "");
    }
    lines.push("## Method boundary", "", "These are deterministic statements derived from the run manifest and generated tables. They are not model-generated recommendations.");
    downloadText("fraud_evidence_brief.md", lines.join("\n"), "text/markdown;charset=utf-8");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Clipboard is optional; the URL is still visible in the browser.
    }
  };

  const weekly = anomalies.data?.weekly ?? [];
  const drift = anomalies.data?.drift ?? [];
  const exceptions = anomalies.data?.exportExceptions ?? [];

  return (
    <>
      <PageHeader
        eyebrow={<><Sparkles size={13} /> Investigation intelligence</>}
        title={<>What the evidence <em>actually says.</em></>}
        description="Deterministic, source-linked insights assembled from the run manifest, generated tables and notebook logs. No language model writes the claims and no metric is invented here."
        actions={
          <div className="row wrap">
            <button type="button" className="btn btn-sm" onClick={copyLink}><Copy /> Copy view</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={exportBrief}><Download /> Export brief</button>
          </div>
        }
        meta={
          <div className="header-meta">
            <SourceChip to="/metrics">Semantic layer · {insights.data ? "15 insight rules" : "loading"}</SourceChip>
            <SourceChip to="/logs">Run integrity · {manifest.notebook.error_outputs} tracebacks</SourceChip>
            <SourceChip to="/program">One program · nine phases</SourceChip>
          </div>
        }
      />

      <div className="insight-summary-grid mt-16">
        <div className="summary-tile accent">
          <span>Insights in view</span>
          <b>{filtered.length}</b>
          <small>of {all.length} deterministic rules</small>
        </div>
        <div className="summary-tile">
          <span>Weekly anomalies</span>
          <b>{anomalies.data?.summary.weeklyFlagged ?? "—"}</b>
          <small>robust z ≥ 3.5 · 105 weeks</small>
        </div>
        <div className="summary-tile">
          <span>Severe drift</span>
          <b>{anomalies.data?.summary.psiSevere ?? "—"}</b>
          <small>{anomalies.data?.summary.psiModerate ?? "—"} moderate · PSI rule</small>
        </div>
        <div className="summary-tile">
          <span>Evidence caveats</span>
          <b>{manifest.counts.caveats}</b>
          <small>{manifest.issues.filter((issue) => issue.severity === "High").length} high-severity workspace issues</small>
        </div>
      </div>

      <div className="filter-bar mt-16">
        <div className="filter-search">
          <Search />
          <input
            value={query}
            onChange={(event) => update({ q: event.target.value || null })}
            placeholder="Search insight statements and details"
            aria-label="Search insights"
          />
        </div>
        <FilterPills
          label="Insight scope"
          value={scope}
          onChange={(value) => update({ scope: value === "all" ? null : value })}
          options={[
            { value: "all", label: "All scopes", count: all.length },
            ...Object.keys(SCOPE_LABELS)
              .filter((key) => scopeCounts.get(key))
              .map((key) => ({ value: key, label: SCOPE_LABELS[key], count: scopeCounts.get(key) })),
          ]}
        />
        {query || scope !== "all" ? (
          <button type="button" className="btn btn-sm" onClick={() => setParams({}, { replace: true })}><FilterX /> Clear</button>
        ) : null}
      </div>

      {insights.error ? (
        <Callout tone="danger" title="Insight layer unavailable"><p>{insights.error}</p></Callout>
      ) : null}

      <div className="insight-grid mt-16">
        {insights.loading ? <div className="skeleton" style={{ height: 260, gridColumn: "1 / -1" }} /> : null}
        {!insights.loading && filtered.length === 0 ? (
          <EmptyState title="No insights match this view" text="Clear the search or choose a different scope." icon={<Search />} />
        ) : null}
        {filtered.map((insight) => <InsightCard key={insight.id} insight={insight} />)}
      </div>

      <div className="grid grid-12 mt-16">
        <Panel
          className="span-7"
          title="Anomaly watch"
          subtitle="Flags have explicit reference populations, thresholds and boundaries. A flag is not a defect claim."
          action={<span className="badge badge-neutral">3 rule families</span>}
          source={<>Recomputed from <code>phase3_weekly_rate_table.csv</code>, <code>phase8_psi.csv</code> and the warning register.</>}
        >
          <div className="stack">
            {weekly.map((anomaly) => <AnomalyCard key={anomaly.id} anomaly={anomaly} />)}
            {exceptions.map((anomaly) => <AnomalyCard key={anomaly.id} anomaly={anomaly} />)}
          </div>
          {!anomalies.loading && weekly.length === 0 && exceptions.length === 0 ? (
            <EmptyState title="No anomalies at the chosen thresholds" text="The weekly series and export register are within their documented boundaries." />
          ) : null}
        </Panel>

        <div className="span-5 stack">
          <Panel
            title="Drift register"
            subtitle={`${drift.length} features cross the PSI moderate or severe convention.`}
            action={<Link className="btn btn-sm" to="/model">Model evidence <ArrowUpRight /></Link>}
          >
            <div className="drift-list">
              {drift.slice(0, 8).map((anomaly) => (
                <div className="drift-row" key={anomaly.id}>
                  <div>
                    <b>{anomaly.label}</b>
                    <span>{anomaly.severity} · PSI {anomaly.value.toFixed(3)}</span>
                  </div>
                  <MiniBar value={anomaly.value} max={Math.max(...drift.map((row) => row.value), 1)} color={anomaly.severity === "high" ? "var(--fraud)" : "var(--amber)"} />
                </div>
              ))}
            </div>
            <SourceNote>PSI thresholds are conventions, not hypothesis tests. See the metric definition before reuse.</SourceNote>
          </Panel>

          <Panel title="Method boundaries" subtitle="What this page deliberately does not do.">
            <ul className="boundary-list">
              <li><ShieldAlert /> No anomaly detector is applied to experiment metrics or runtimes where the series is a designed experiment or has too few observations.</li>
              <li><LineChart /> Weekly flags use a robust median/MAD reference; no p-value or causal interpretation is attached.</li>
              <li><StatusBadge status="Verified" /> Every insight links to a source table, notebook cell or manifest record; the exact denominator is kept in the source tables.</li>
            </ul>
          </Panel>

          <Panel title="Where to investigate next" subtitle="Jump from a claim to its underlying workflow.">
            <div className="next-links">
              <Link to="/experiments"><b>Compare model variants</b><span>Absolute deltas with compatibility rules</span><ArrowUpRight /></Link>
              <Link to="/lineage"><b>Trace evidence lineage</b><span>Verified and inferred edges</span><ArrowUpRight /></Link>
              <Link to="/logs"><b>Inspect the run record</b><span>Warnings, exports and cell provenance</span><ArrowUpRight /></Link>
              <Link to="/explore"><b>Open the data explorer</b><span>Profile a generated table directly</span><ArrowUpRight /></Link>
            </div>
          </Panel>
        </div>
      </div>

      <Panel
        className="mt-16"
        title="Reading the grades"
        subtitle="The insight pool inherits the ledger's evidence grades rather than creating a new score."
        action={<Link className="btn btn-sm" to="/findings">Open findings ledger <ArrowUpRight /></Link>}
      >
        <div className="grade-explainer">
          {manifest.gradeDefs.map((definition) => (
            <div key={definition.grade} className={`grade-box ${definition.grade}`}>
              <span>{definition.label}</span>
              <b>{manifest.gradeCounts[definition.grade] ?? 0}</b>
              <p>{definition.definition}</p>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
