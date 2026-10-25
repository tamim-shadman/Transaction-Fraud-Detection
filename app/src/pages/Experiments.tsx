import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { EChartsOption } from "echarts";
import {
  ArrowUpRight,
  Check,
  Copy,
  Download,
  FlaskConical,
  Info,
  Plus,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { useAsync } from "../lib/useAsync";
import { loadExperiments } from "../lib/data";
import { PageHeader, Panel, Callout, EmptyState, SourceNote, StatusBadge } from "../components/ui";
import { Chart } from "../components/Chart";
import { Drawer, Delta, FilterPills, MiniBar, SourceChip } from "../components/phase2";
import { downloadCsv, downloadText } from "../lib/csv";
import { fmtInt, fmtValue, titleCase } from "../lib/format";
import { phaseColors } from "../lib/chartTheme";
import type { Phase2Experiment } from "../types";

const DEFAULT_GROUP = "cross-boundary-model-variants";
const DEFAULT_SELECTION = ["final_unconstrained", "ablation_minus_card_prior", "ablation_raw_only"];

export default function Experiments() {
  const experiments = useAsync(loadExperiments, []);
  const [params, setParams] = useSearchParams();
  const data = experiments.data;
  const groupId = params.get("group") ?? DEFAULT_GROUP;
  const selectedParam = params.get("selected");
  const selected = useMemo(() => {
    const ids = (selectedParam ?? DEFAULT_SELECTION.join(",")).split(",").filter(Boolean);
    return data ? ids.filter((id) => data.items.some((item) => item.id === id)) : ids;
  }, [selectedParam, data]);
  const drawerId = params.get("exp");
  const drawerItem = data?.items.find((item) => item.id === drawerId) ?? null;

  const allGroup = useMemo(() => ({
    id: "all",
    label: "Cross-Family Benchmark",
    metric: "Benchmark AUC / PR-AUC",
    basis: "Benchmarking performance across different evaluation paradigms, sample sizes and split horizons.",
    limitations: "Cross-family comparisons represent methodological contrasts (e.g. supervised vs unsupervised), not controlled feature ablations.",
    comparable: true,
    count: data?.counts.total ?? 26,
    members: (data?.items ?? []).map((i) => i.id),
    baselineId: "final_unconstrained",
  }), [data]);

  const group = groupId === "all" ? allGroup : (data?.groups.find((item) => item.id === groupId) ?? data?.groups[0]);
  const items = useMemo(() => (groupId === "all" ? (data?.items ?? []) : (data?.items ?? []).filter((item) => item.groupId === groupId)), [data, groupId]);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    setParams(next, { replace: true });
  };

  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id].slice(-5);
    update({ selected: next.join(",") });
  };

  const chooseGroup = (id: string) => {
    if (id === "all") {
      const benchmarkSelection = ["final_unconstrained", "wf_fold_0", "anomaly_lof", "embed_pca_2"];
      const search = new URLSearchParams();
      search.set("group", "all");
      search.set("selected", benchmarkSelection.join(","));
      setParams(search, { replace: true });
      return;
    }
    const members = (data?.items ?? []).filter((item) => item.groupId === id);
    const baseline = data?.groups.find((item) => item.id === id)?.baselineId;
    const initial = baseline && members.some((item) => item.id === baseline) ? [baseline] : [];
    const next = [...initial, ...members.filter((item) => !initial.includes(item.id)).slice(0, 3).map((item) => item.id)];
    const search = new URLSearchParams();
    search.set("group", id);
    search.set("selected", next.join(","));
    setParams(search, { replace: true });
  };

  const compareItems = selected
    .map((id) => data?.items.find((item) => item.id === id))
    .filter(Boolean) as Phase2Experiment[];
  const baseline = compareItems.find((item) => item.baselineId === item.id) ?? compareItems[0];
  const exceedsCompatibility = compareItems.some(
    (item) => item.groupId !== baseline?.groupId || item.split !== baseline?.split,
  );


  const chartOption = useMemo<EChartsOption>(() => {
    const lanes = data?.groups ?? [];
    return {
      grid: { left: 16, right: 22, top: 22, bottom: 56, containLabel: true },
      xAxis: {
        type: "category",
        data: lanes.map((lane) => lane.label),
        axisLabel: { color: "#93a2ba", fontSize: 10.5, interval: 0, width: 110, overflow: "break" },
        axisLine: { lineStyle: { color: "rgba(255,255,255,.14)" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 1,
        axisLabel: { color: "#93a2ba", fontSize: 10.5 },
        splitLine: { lineStyle: { color: "rgba(255,255,255,.06)" } },
      },
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          const item = data?.items.find((row) => row.id === params.data.id);
          if (!item) return "";
          return `<b>${item.label}</b><br/>${item.groupLabel}<br/>PR-AUC ${fmtValue(item.pr_auc, "decimal4")} · ROC-AUC ${fmtValue(item.roc_auc, "decimal4")}<br/>${item.split} · ${fmtInt(item.n_rows)} rows`;
        },
      },
      series: [
        {
          type: "scatter",
          symbolSize: (value: any, params: any) => (selected.includes(params.data.id) ? 17 : 11),
          data: (data?.items ?? []).map((item) => ({
            id: item.id,
            value: [lanes.findIndex((lane) => lane.id === item.groupId), item.pr_auc],
            itemStyle: {
              color: selected.includes(item.id) ? "#e8eef8" : phaseColors[item.groupId === DEFAULT_GROUP ? "P7" : "P8"],
              borderColor: selected.includes(item.id) ? "#8b8cf8" : "transparent",
              borderWidth: selected.includes(item.id) ? 3 : 0,
              opacity: item.groupId === groupId ? 1 : 0.45,
            },
          })),
          label: {
            show: true,
            formatter: (params: any) => {
              const item = data?.items.find((row) => row.id === params.data.id);
              return selected.includes(params.data.id) ? item?.label.replace("Ablation · ", "").slice(0, 26) ?? "" : "";
            },
            position: "right",
            color: "#b6c2d6",
            fontSize: 10.5,
          },
          labelLayout: { hideOverlap: true },
          emphasis: { scale: 1.3 },
        },
      ],
      graphic: [
        {
          type: "text",
          right: 20,
          bottom: 14,
          style: { text: "Lane position is categorical; do not rank across lanes", fill: "#8fa0b8", fontSize: 10.5 },
        },
      ],
    };
  }, [data, groupId, selected]);

  const exportSelection = () => {
    downloadCsv(
      "fraud_experiment_comparison.csv",
      compareItems.map((item) => ({
        id: item.id,
        label: item.label,
        group: item.groupLabel,
        split: item.split,
        pr_auc: item.pr_auc,
        roc_auc: item.roc_auc,
        n_features: item.n_features,
        n_rows: item.n_rows,
        baseline: item.id === baseline?.id ? "yes" : "no",
        delta_pr_auc_vs_baseline: baseline && item.id !== baseline.id ? (item.pr_auc ?? 0) - (baseline.pr_auc ?? 0) : "",
        source: item.source,
      })),
    );
  };

  const exportComparisonBrief = () => {
    if (!data) return;
    const lines = [
      "# Experiment comparison brief",
      "",
      `Group: ${group?.label ?? groupId}`,
      `Basis: ${group?.basis ?? "Not documented"}`,
      `Limitations: ${group?.limitations ?? "Not documented"}`,
      "",
      "| Experiment | PR-AUC | ROC-AUC | Features | Delta vs baseline | Split |",
      "| --- | --- | --- | --- | --- | --- |",
      ...compareItems.map((item) => {
        const delta = baseline && item.id !== baseline.id && item.pr_auc != null && baseline.pr_auc != null
          ? `${item.pr_auc - baseline.pr_auc >= 0 ? "+" : ""}${(item.pr_auc - baseline.pr_auc).toFixed(4)}`
          : "—";
        return `| ${item.label} | ${fmtValue(item.pr_auc, "decimal4")} | ${fmtValue(item.roc_auc, "decimal4")} | ${item.n_features ?? "—"} | ${delta} | ${item.split} |`;
      }),
      "",
      exceedsCompatibility
        ? "WARNING: The selected experiments do not share the same group and split. The deltas shown are descriptive only and should not be interpreted as a controlled comparison."
        : "All selected experiments share the same group and split. Differences are still not necessarily causal unless only one controlled factor changed.",
      "",
      "Absolute differences are shown for bounded metrics. No percent-improvement claim is made.",
    ];
    downloadText("fraud_experiment_comparison.md", lines.join("\n"), "text/markdown;charset=utf-8");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // optional
    }
  };

  if (experiments.error) {
    return <Callout tone="danger" title="Experiment layer unavailable"><p>{experiments.error}</p></Callout>;
  }

  return (
    <>
      <PageHeader
        eyebrow={<><FlaskConical size={13} /> Comparison workspace</>}
        title={<>Compare variants. <em>Respect the split.</em></>}
        description="Twenty-six recorded variants across five evaluation families. Select up to four within a group to see absolute differences, feature counts and the evidence that makes the comparison legitimate — or not."
        actions={
          <div className="row wrap">
            <button type="button" className="btn btn-sm" onClick={copyLink}><Copy /> Copy view</button>
            <button type="button" className="btn btn-sm" onClick={exportComparisonBrief}><Download /> Brief</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={exportSelection}><Download /> CSV</button>
          </div>
        }
        meta={data ? (
          <div className="header-meta">
            <SourceChip to="/methodology">Comparison rules</SourceChip>
            <span className="status-line"><FlaskConical /> {data.counts.total} variants</span>
            <span className="status-line"><ShieldAlert /> No significance tests</span>
          </div>
        ) : null}
      />

      <div className="filter-bar mt-16">
        <FilterPills
          label="Experiment group"
          value={groupId}
          onChange={chooseGroup}
          options={[
            { value: "all", label: "Cross-Family Benchmark", count: data?.counts.total ?? 26 },
            ...(data?.groups ?? []).map((item) => ({ value: item.id, label: item.label, count: item.count })),
          ]}
        />
        <Link className="btn btn-sm" to="/model"><Info /> Model evidence</Link>
      </div>

      {group ? (
        <div className={`comparison-basis mt-12 ${group.comparable ? "comparable" : "not-comparable"}`}>
          <div>
            <span className={`compat-dot ${group.comparable ? "yes" : "no"}`} />
            <b>{groupId === "all" ? "Cross-Family Benchmark Active" : group.comparable ? "Comparable within constraints" : "Not directly comparable"}</b>
          </div>
          <p>{group.basis}</p>
          {!group.comparable ? <p className="compat-limitation">{group.limitations}</p> : null}
        </div>
      ) : null}

      <div className="grid grid-12 mt-16">
        <Panel
          className="span-7"
          title="PR-AUC by evaluation family"
          subtitle="PR-AUC on a 0–1 scale, by evaluation family. Selection is the white ring; lanes are categorical, not a leaderboard."
          action={<span className="badge badge-neutral">Click a point</span>}
          source={<>Derived from the run's model tables; ROC-AUC is retained in the comparison table below.</>}
        >
          <Chart
            option={chartOption}
            height={360}
            ariaLabel="Scatter plot of PR-AUC for every recorded experiment, grouped by evaluation family. Use the table below for an accessible list."
            onClick={(params) => {
              if (params?.data?.id) toggle(params.data.id);
            }}
          />
        </Panel>

        <Panel
          className="span-5"
          title="Selected set"
          subtitle={`${compareItems.length} of ${items.length} variants selected.`}
          action={<button type="button" className="btn btn-sm" onClick={() => update({ selected: "" })}>Clear</button>}
        >
          {compareItems.length === 0 ? (
            <EmptyState title="Select an experiment" text="Click a point in the chart or add one from the table below." />
          ) : (
            <div className="selected-list">
              {compareItems.map((item) => (
                <div key={item.id} className={`selected-row ${item.id === baseline?.id ? "baseline" : ""}`}>
                  <div>
                    <b>{item.label}</b>
                    <span>{item.id === baseline?.id ? "Reference" : item.groupLabel} · {item.split}</span>
                  </div>
                  <span className="selected-metric">{fmtValue(item.pr_auc, "decimal4")}</span>
                  <button type="button" className="icon-btn" onClick={() => toggle(item.id)} aria-label={`Remove ${item.label}`}><X /></button>
                </div>
              ))}
            </div>
          )}
          {exceedsCompatibility ? (
            <Callout tone="info" title="Cross-Family Benchmark Mode">
              <p>Comparing variants across different evaluation families. Deltas represent methodological contrasts across supervision paradigms and evaluation horizons; within-family comparisons represent controlled ablations.</p>
            </Callout>
          ) : baseline ? (
            <SourceNote>Reference: <b>{baseline.label}</b>. Deltas are in PR-AUC points, not percent improvement.</SourceNote>
          ) : null}
        </Panel>
      </div>

      {compareItems.length > 0 ? (
        <Panel
          className="mt-16"
          title="Comparison detail"
          subtitle="Bounded metrics use absolute deltas. Relative indices compare performance against the designated reference."
          action={<span className={`badge ${exceedsCompatibility ? "badge-accent" : "badge-strong"}`}>{exceedsCompatibility ? "Cross-family benchmark" : "Controlled basis"}</span>}
        >
          <div className="compare-table-wrap">
            <table className="data-table compare-table">
              <caption className="sr-only">Selected experiment comparison</caption>
              <thead>
                <tr>
                  <th scope="col">Metric</th>
                  {compareItems.map((item) => <th scope="col" key={item.id}>{item.label}{item.id === baseline?.id ? <small>reference</small> : null}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Evaluation Family</th>
                  {compareItems.map((item) => (
                    <td key={item.id}>
                      <span className="badge badge-neutral">{item.groupLabel}</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">PR-AUC</th>
                  {compareItems.map((item) => <td key={item.id} className="num">{fmtValue(item.pr_auc, "decimal4")}{item.id !== baseline?.id ? <Delta value={baseline && item.pr_auc != null && baseline.pr_auc != null ? item.pr_auc - baseline.pr_auc : null} label="Absolute difference in PR-AUC on the 0–1 scale" /> : null}</td>)}
                </tr>
                <tr>
                  <th scope="row">Benchmark Index</th>
                  {compareItems.map((item) => {
                    const ratio = baseline && baseline.pr_auc && item.pr_auc != null
                      ? ((item.pr_auc / baseline.pr_auc) * 100).toFixed(1) + "%"
                      : "100%";
                    return (
                      <td key={item.id} className="num">
                        <span className="mono font-semibold">{ratio}</span>
                        <small className="muted ml-4">{item.id === baseline?.id ? "(ref)" : "of ref"}</small>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <th scope="row">ROC-AUC</th>
                  {compareItems.map((item) => <td key={item.id} className="num">{fmtValue(item.roc_auc, "decimal4")}{item.id !== baseline?.id ? <Delta value={baseline && item.roc_auc != null && baseline.roc_auc != null ? item.roc_auc - baseline.roc_auc : null} label="Absolute difference in ROC-AUC on the 0–1 scale" /> : null}</td>)}
                </tr>
                <tr>
                  <th scope="row">Features</th>
                  {compareItems.map((item) => <td key={item.id} className="num">{item.n_features ?? "—"}{item.id !== baseline?.id && item.n_features != null && baseline?.n_features != null ? <Delta value={item.n_features - baseline.n_features} digits={0} higherIsBetter={null} label="Change in feature count versus the reference" /> : null}</td>)}
                </tr>
                <tr>
                  <th scope="row">Test rows</th>
                  {compareItems.map((item) => <td key={item.id} className="num">{fmtInt(item.n_rows)}</td>)}
                </tr>
                <tr>
                  <th scope="row">Split</th>
                  {compareItems.map((item) => <td key={item.id}>{item.split}</td>)}
                </tr>
                <tr>
                  <th scope="row">Evidence</th>
                  {compareItems.map((item) => <td key={item.id}><Link className="inline-link" to={item.sourceHref}>{item.source}</Link></td>)}
                </tr>
              </tbody>
            </table>
          </div>
          <SourceNote>PR-AUC is prevalence-sensitive. Cross-family benchmarks provide comparative perspectives across paradigms without asserting causal equivalence.</SourceNote>
        </Panel>
      ) : null}

      <Panel
        className="mt-16"
        title={`${group?.label ?? "Experiments"} · recorded rows`}
        subtitle="Add any row to the selected set. Click the ID for provenance and metric definitions."
        action={<span className="tiny muted">{items.length} rows · {group?.metric ?? "PR-AUC"}</span>}
      >
        <div className="experiment-table-wrap">
          <table className="data-table experiment-table">
            <caption className="sr-only">Recorded experiments in {group?.label}</caption>
            <thead>
              <tr>
                <th scope="col">Select</th>
                <th scope="col">Experiment</th>
                <th scope="col">PR-AUC</th>
                <th scope="col">ROC-AUC</th>
                <th scope="col">Features</th>
                <th scope="col">Split</th>
                <th scope="col">Rank in group</th>
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const active = selected.includes(item.id);
                return (
                  <tr key={item.id} className={active ? "active" : ""}>
                    <td>
                      <button type="button" className={`select-btn ${active ? "active" : ""}`} onClick={() => toggle(item.id)} aria-pressed={active} aria-label={`${active ? "Remove" : "Add"} ${item.label}`}>
                        {active ? <Check /> : <Plus />}
                      </button>
                    </td>
                    <th scope="row">
                      <button type="button" className="link-button" onClick={() => update({ exp: item.id })}>{item.label}</button>
                      <small>{item.id}{item.id === group?.baselineId ? " · reference" : ""}</small>
                    </th>
                    <td className="num">{fmtValue(item.pr_auc, "decimal4")}<MiniBar value={item.pr_auc ?? 0} max={1} color="var(--accent)" /></td>
                    <td className="num">{fmtValue(item.roc_auc, "decimal4")}</td>
                    <td className="num">{item.n_features ?? "—"}</td>
                    <td>{item.split}</td>
                    <td className="num">{item.rankInGroup ?? "—"}</td>
                    <td><Link className="inline-link" to={item.sourceHref}>{item.source}</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <SourceNote>Rank is within this displayed group only. A rank of 1 does not imply deployment readiness or cross-family superiority.</SourceNote>
      </Panel>

      <Panel className="mt-16" title="Comparison rules" subtitle="Why the UI refuses some comparisons.">
        <div className="rule-grid">
          {data?.metricNotes ? Object.entries(data.metricNotes).map(([key, note]) => (
            <div key={key}><b>{titleCase(key)}</b><p>{note}</p></div>
          )) : null}
          <div><b>Group first</b><p>Select a group before selecting variants. Cross-group comparisons are blocked from claiming a controlled delta.</p></div>
          <div><b>No invented significance</b><p>No p-values, confidence intervals or “winner” labels are computed from single-seed experiments.</p></div>
        </div>
      </Panel>

      <Drawer
        open={Boolean(drawerItem)}
        onClose={() => update({ exp: null })}
        eyebrow={drawerItem ? `${drawerItem.id} · ${drawerItem.groupLabel}` : undefined}
        title={drawerItem?.label ?? ""}
        footer={drawerItem ? (
          <div className="row-between wrap" style={{ gap: 8 }}>
            <div className="row wrap" style={{ gap: 6 }}>
              <Link className="btn btn-sm btn-primary" to={drawerItem.sourceHref}>Source table <ArrowUpRight size={11} /></Link>
              <Link className="btn btn-sm" to="/model">Model evaluation <ArrowUpRight size={11} /></Link>
              <Link className="btn btn-sm" to={`/logs?q=${drawerItem.id}`}>Run logs <ArrowUpRight size={11} /></Link>
            </div>
            <button type="button" className="btn btn-sm" onClick={() => toggle(drawerItem.id)}>{selected.includes(drawerItem.id) ? "Remove from comparison" : "Add to comparison"}</button>
          </div>
        ) : null}
      >
        {drawerItem ? (
          <div className="experiment-detail">
            <p className="dossier-purpose">{drawerItem.description}</p>
            <div className="detail-stat-grid">
              <div><b>{fmtValue(drawerItem.pr_auc, "decimal4")}</b><span>PR-AUC</span></div>
              <div><b>{fmtValue(drawerItem.roc_auc, "decimal4")}</b><span>ROC-AUC</span></div>
              <div><b>{drawerItem.n_features ?? "—"}</b><span>features</span></div>
              <div><b>{fmtInt(drawerItem.n_rows)}</b><span>rows</span></div>
            </div>
            <dl className="kv-list">
              <div><dt>Group</dt><dd>{drawerItem.groupLabel}</dd></div>
              <div><dt>Split</dt><dd>{drawerItem.split}</dd></div>
              <div><dt>Rank in group</dt><dd>{drawerItem.rankInGroup ?? "Not ranked"}</dd></div>
              <div><dt>Reference</dt><dd>{drawerItem.id === drawerItem.baselineId ? "This row is the reference" : group?.baselineId ?? "None designated"}</dd></div>
              <div><dt>Source</dt><dd><Link className="inline-link" to={drawerItem.sourceHref}>{drawerItem.source}</Link></dd></div>
              {drawerItem.runtimeSeconds != null ? <div><dt>Runtime</dt><dd>{drawerItem.runtimeSeconds.toFixed(1)} s</dd></div> : null}
            </dl>
            <Callout tone="info" title="Comparability note"><p>{drawerItem.comparisonNote}</p></Callout>
            <Callout tone="warn" title="Interpretation boundary"><p>This is a single-seed, reconstructed run. The interface reports the recorded number; it does not establish a generalisation claim.</p></Callout>
          </div>
        ) : null}
      </Drawer>
    </>
  );
}

