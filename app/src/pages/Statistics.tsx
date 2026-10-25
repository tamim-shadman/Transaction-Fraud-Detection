import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { EChartsOption } from "echarts";
import { ArrowUpRight, Download, Scale, Sigma } from "lucide-react";
import { useAnalysis, useManifest } from "../context/AppContext";
import { Chart } from "../components/Chart";
import { DataTable, type TableColumn } from "../components/DataTable";
import { FigureStrip } from "../components/Figures";
import { Callout, PageHeader, Panel, SourceNote, Stat, StatRow } from "../components/ui";
import { downloadCsv } from "../lib/csv";
import { fmtFloat, fmtInt, fmtPct } from "../lib/format";
import { indigo, muted } from "../lib/chartTheme";

const fmtP = (value: number) => {
  if (value == null) return "—";
  if (value === 0) return "<1e-300";
  if (value < 0.001) return value.toExponential(1);
  return value.toFixed(4);
};

export default function Statistics() {
  const manifest = useManifest();
  const analysis = useAnalysis();
  const effects = useMemo(() => [...analysis.effect_sizes].sort((a, b) => b.cliffs_delta - a.cliffs_delta), [analysis.effect_sizes]);
  const chi2 = useMemo(() => [...analysis.chi2].sort((a, b) => b.cramers_v - a.cramers_v), [analysis.chi2]);
  const logit = analysis.logit;
  const categoryRates = useMemo(() => [...analysis.category_rates].sort((a, b) => a.rate - b.rate), [analysis.category_rates]);
  const posthoc = useMemo(() => [...analysis.posthoc].sort((a, b) => b.cramers_v - a.cramers_v).slice(0, 15), [analysis.posthoc]);
  const audit = manifest.auditNotes.find((note) => note.id === "AN-04");
  const amt = effects.find((row) => row.feature === "amt")!;
  const zip = chi2.find((row) => row.variable === "zip3")!;

  const effectOption = useMemo<EChartsOption>(() => {
    const rows = [...analysis.effect_sizes].sort((a, b) => a.cliffs_delta - b.cliffs_delta);
    return {
      grid: { left: 10, right: 44, top: 18, bottom: 14, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const row = rows[params[0].dataIndex];
          return `<b>${row.feature}</b><br/>Cliff's δ ${fmtFloat(row.cliffs_delta, 3)}<br/>95% CI ${fmtFloat(row.cliffs_lo, 3)} – ${fmtFloat(row.cliffs_hi, 3)}<br/>KS D ${fmtFloat(row.ks_D, 3)} · q ${fmtP(row.q_fdr)}`;
        },
      },
      xAxis: { type: "value", min: -0.4, max: 0.75, axisLabel: { color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
      yAxis: { type: "category", data: rows.map((row) => row.feature), axisLabel: { color: "#4e5563", fontSize: 10.5 }, axisTick: { show: false }, axisLine: { show: false } },
      series: [
        {
          type: "bar",
          data: rows.map((row) => ({ value: row.cliffs_delta, itemStyle: { color: row.cliffs_delta >= 0 ? "#1f8a70" : "#cb4257", borderRadius: row.cliffs_delta >= 0 ? [0, 3, 3, 0] : [3, 0, 0, 3] } })),
          barWidth: 11,
          label: { show: true, position: "right", formatter: (params: any) => fmtFloat(params.value, 3), fontSize: 10.5, color: muted },
          markLine: { silent: true, symbol: "none", data: [{ xAxis: 0 }], lineStyle: { color: "#8c8577", width: 1 }, label: { show: false } },
        },
      ],
    };
  }, [analysis.effect_sizes]);

  const cramerOption = useMemo<EChartsOption>(() => {
    const rows = [...analysis.chi2].sort((a, b) => a.cramers_v - b.cramers_v);
    return {
      grid: { left: 10, right: 48, top: 14, bottom: 8, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const row = rows[params[0].dataIndex];
          return `<b>${row.variable}</b><br/>Cramér's V ${fmtFloat(row.cramers_v, 4)}<br/>${row.levels} levels · n ${fmtInt(row.n)}<br/>p ${fmtP(row.p)}`;
        },
      },
      xAxis: { type: "value", max: 0.16, axisLabel: { color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
      yAxis: { type: "category", data: rows.map((row) => `${row.variable} (${row.levels})`), axisLabel: { color: "#4e5563", fontSize: 10.5 }, axisTick: { show: false }, axisLine: { show: false } },
      series: [
        {
          type: "bar",
          data: rows.map((row) => ({ value: row.cramers_v, itemStyle: { color: row.variable === "zip3" ? "#bd761b" : row.variable === "category" ? indigo : "#c9c4f8", borderRadius: [0, 3, 3, 0] } })),
          barWidth: 13,
          label: { show: true, position: "right", formatter: (params: any) => fmtFloat(params.value, 3), fontSize: 10.5, color: muted },
        },
      ],
    };
  }, [analysis.chi2]);

  const logitOption = useMemo<EChartsOption>(() => {
    const rows = logit.filter((row) => row.feature !== "intercept").sort((a, b) => a.OR - b.OR);
    return {
      grid: { left: 10, right: 30, top: 18, bottom: 10, containLabel: true },
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          const row = rows[params.dataIndex];
          return `<b>${row.feature}</b><br/>OR ${fmtFloat(row.OR, 3)}<br/>Robust 95% CI ${fmtFloat(row.OR_lo_robust, 3)} – ${fmtFloat(row.OR_hi_robust, 3)}<br/>p ${fmtP(row.p_cluster)}`;
        },
      },
      xAxis: {
        type: "log",
        min: 0.5,
        max: 10,
        axisLabel: { formatter: (value: number) => (value >= 1 ? `${value}×` : `${value}×`), color: muted, fontSize: 10.5 },
        splitLine: { lineStyle: { color: "#efeae1" } },
      },
      yAxis: { type: "category", data: rows.map((row) => row.feature), axisLabel: { color: "#4e5563", fontSize: 10.5 }, axisTick: { show: false }, axisLine: { show: false } },
      series: [
        {
          type: "scatter",
          data: rows.map((row) => [row.OR, row.feature]),
          symbolSize: 9,
          itemStyle: { color: indigo },
          markLine: { silent: true, symbol: "none", data: [{ xAxis: 1 }], lineStyle: { color: "#8c8577", type: "dashed", width: 1 }, label: { formatter: "OR 1", fontSize: 10.5, color: "#8c8577" } },
        },
      ],
    };
  }, [logit]);

  const categoryOption = useMemo<EChartsOption>(() => {
    const rows = [...analysis.category_rates].sort((a, b) => a.rate - b.rate);
    return {
      grid: { left: 10, right: 46, top: 14, bottom: 8, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const row = rows[params[0].dataIndex];
          return `<b>${row.category}</b><br/>Rate ${fmtPct(row.rate, 2)}<br/>Wilson ${fmtPct(row.lo, 2)} – ${fmtPct(row.hi, 2)}<br/>q ${fmtP(row.q_vs_base)}`;
        },
      },
      xAxis: { type: "value", max: 0.019, axisLabel: { formatter: (value: number) => `${(value * 100).toFixed(1)}%`, color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
      yAxis: { type: "category", data: rows.map((row) => row.category), axisLabel: { color: "#4e5563", fontSize: 10.5 }, axisTick: { show: false }, axisLine: { show: false } },
      series: [
        {
          type: "bar",
          data: rows.map((row) => ({ value: row.rate, itemStyle: { color: row.rate > manifest.counts.fraudRate ? "#cb4257" : "#c9c4f8", borderRadius: [0, 3, 3, 0] } })),
          barWidth: 10,
          label: { show: true, position: "right", formatter: (params: any) => fmtPct(params.value, 2), fontSize: 10.5, color: muted },
          markLine: { silent: true, symbol: "none", data: [{ xAxis: manifest.counts.fraudRate }], lineStyle: { type: "dashed", color: "#8c8577", width: 1 } },
        },
      ],
    };
  }, [analysis.category_rates, manifest.counts.fraudRate]);

  const effectColumns: TableColumn[] = [
    { key: "feature", label: "Feature", render: (row) => <span className="mono">{row.feature}</span> },
    { key: "cliffs_delta", label: "Cliff's δ", align: "right", render: (row) => fmtFloat(row.cliffs_delta, 3) },
    { key: "cliffs_lo", label: "95% CI", align: "right", render: (row) => `${fmtFloat(row.cliffs_lo, 3)} – ${fmtFloat(row.cliffs_hi, 3)}` },
    { key: "ks_D", label: "KS D", align: "right", render: (row) => fmtFloat(row.ks_D, 3) },
    { key: "cohens_d", label: "Cohen's d", align: "right", render: (row) => fmtFloat(row.cohens_d, 2) },
    { key: "q_fdr", label: "FDR q", align: "right", render: (row) => fmtP(row.q_fdr) },
  ];

  const pairColumns: TableColumn[] = [
    { key: "a", label: "Category A" },
    { key: "b", label: "Category B" },
    { key: "chi2", label: "χ²", align: "right", render: (row) => fmtFloat(row.chi2, 1) },
    { key: "cramers_v", label: "Cramér's V", align: "right", render: (row) => fmtFloat(row.cramers_v, 3) },
    { key: "p_bonf", label: "Bonferroni p", align: "right", render: (row) => fmtP(row.p_bonf) },
  ];

  const figures = useMemo(
    () => ["phase5_effectsize_forest", "phase5_forest_category", "phase5_forest_hour", "phase5_forest_job"].map((id) => manifest.figures.find((figure) => figure.id === id)).filter(Boolean) as typeof manifest.figures,
    [manifest.figures],
  );

  return (
    <>
      <PageHeader
        eyebrow="P5 · Statistical testing & effect sizes"
        title={<>At n = 1.85M, significance is cheap. <em>Effect size</em> is not.</>}
        description="The notebook reports Mann–Whitney tests, Cliff's delta with bootstrap intervals, cluster-robust logistic regression and χ²/Cramér's V. Almost every test is significant; the useful question is which differences are materially large and whether their effect-size scale is comparable."
        actions={
          <>
            <Link className="btn btn-sm" to="/artifacts?tab=figures&q=phase5"><ArrowUpRight />P5 figures</Link>
            <button type="button" className="btn btn-sm" onClick={() => downloadCsv("effect_sizes.csv", effects)}><Download />Effect sizes</button>
          </>
        }
        meta={
          <div className="row wrap" style={{ gap: 7 }}>
            <span className="badge badge-phase">Phase P5</span>
            <span className="badge badge-neutral">4 figures · 5 tables</span>
            <span className="badge badge-strong">11 effect sizes</span>
            <span className="badge badge-caveat">AN-04 cardinality audit</span>
          </div>
        }
      />

      <div className="grid grid-12">
        <Panel className="span-7" title="Cliff's delta with bootstrap intervals" subtitle="Positive means fraud values are larger. Amount and amount z-score dominate; distance is effectively zero." action={<span className="badge badge-neutral">11 features</span>}>
          <Chart option={effectOption} height={330} ariaLabel="Bar chart of Cliff's delta effect sizes with confidence intervals" />
          <div className="stat-grid mt-12">
            <Stat value={fmtFloat(amt.cliffs_delta, 3)} label="Amount δ" />
            <Stat value={fmtFloat(amt.cliffs_lo, 3)} label="CI low" />
            <Stat value={fmtFloat(amt.cliffs_hi, 3)} label="CI high" />
            <Stat value={fmtFloat(amt.ks_D, 3)} label="Amount KS D" />
          </div>
          <SourceNote>From <code>phase5_mw_effect_sizes.csv</code>. Cliff's δ is bounded −1 to 1; all intervals shown are 95% bootstrap intervals.</SourceNote>
        </Panel>

        <Panel className="span-5" title="Cramér's V is not a level playing field" subtitle="ZIP3's 0.148 is computed over 532 levels; category's 0.067 over 14." action={<span className="badge badge-caveat"><Scale size={10} />AN-04</span>}>
          <Chart option={cramerOption} height={270} ariaLabel="Bar chart of Cramér's V by categorical variable" />
          <Callout tone="warn" title={audit?.title ?? "Cardinality distorts the comparison"}>
            <p>{audit?.observation ?? "Cramér's V is compared across variables with very different cardinalities."}</p>
            <p>{audit?.implication ?? "Do not rank ZIP3 above category without accounting for degrees of freedom or using an adjusted measure."}</p>
          </Callout>
          <SourceNote>From <code>phase5_chi2_cramers.csv</code>. All p-values are displayed in the table, but effect size is the interpretable quantity.</SourceNote>
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-6" title="Cluster-robust logistic regression" subtitle="Card-clustered standard errors; odds ratios relative to the outcome. Amount and hourly position dominate." action={<span className="badge badge-neutral">961 clusters</span>}>
          <Chart option={logitOption} height={310} ariaLabel="Scatter plot of cluster robust odds ratios" />
          <SourceNote>From <code>phase5_cluster_robust_logit.csv</code>. The intercept is omitted from the chart; robust intervals are in the tooltip and source table.</SourceNote>
        </Panel>

        <Panel className="span-6" title="Category rates with Wilson intervals" subtitle="Every category is significantly different from baseline after FDR; several differences are tiny in absolute terms.">
          <Chart option={categoryOption} height={330} ariaLabel="Bar chart of category fraud rates with Wilson intervals in tooltip" />
          <SourceNote>From <code>phase5_category_rates.csv</code>. Significance flags and FDR q-values are retained in the table above.</SourceNote>
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-5" title="Significance vs materiality" subtitle="A quick reading guide for the table and charts.">
          <div className="stack" style={{ gap: 10 }}>
            <Callout tone="success" title="Large, robust effects">
              <p>Amount (δ {fmtFloat(amt.cliffs_delta, 3)}) and amount z-score (δ 0.597) are large by any conventional threshold, with tight bootstrap intervals.</p>
            </Callout>
            <Callout tone="warn" title="Statistically significant, practically small">
              <p>City population (δ 0.016) and distance features (δ 0.004 and 0.002) are near-zero. Their p-values are not a license to build a story on them.</p>
            </Callout>
            <StatRow label="Post-hoc category pairs" value={fmtInt(analysis.posthoc.length)} />
            <StatRow label="Largest pairwise V" value={fmtFloat(analysis.posthoc[0]?.cramers_v ?? 0, 3)} />
            <StatRow label="ZIP3 levels" value={zip.levels} />
          </div>
        </Panel>

        <Panel className="span-7" title="Effect-size table" subtitle="All four test families in one exportable view." action={<button type="button" className="btn btn-sm" onClick={() => downloadCsv("effect_sizes.csv", effects)}><Download />CSV</button>}>
          <DataTable rows={effects} columns={effectColumns} pageSize={6} exportName="effect_sizes.csv" searchPlaceholder="Search features…" maxHeight={300} />
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-7" title="Post-hoc category contrasts" subtitle="Top 15 pairs by Cramér's V. Bonferroni correction is applied within the 72-pair family." action={<span className="badge badge-neutral">72 pairs</span>}>
          <DataTable rows={posthoc} columns={pairColumns} pageSize={7} exportName="category_posthoc.csv" searchPlaceholder="Search pairs…" />
        </Panel>
        <Panel className="span-5" title="Statistical evidence" subtitle="Forest plots for effect size and category/hour/job contrasts." action={<Link className="btn btn-sm" to="/artifacts?tab=figures&q=phase5">Gallery <ArrowUpRight /></Link>}>
          <FigureStrip figures={figures} />
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-12" title="Three statistical cautions" subtitle="These apply to every p-value and interval on this page.">
          <div className="grid grid-3" style={{ gap: 12 }}>
            <Callout tone="info" title="Clustered observations">
              <p>Transactions share cards. The logistic model uses card-clustered errors; descriptive tests do not. Treat transaction-level p-values as optimistic unless clustering is addressed.</p>
            </Callout>
            <Callout tone="warn" title="Multiple comparisons">
              <p>Fourteen categories produce 72 pairwise tests. Bonferroni and FDR corrections are reported; unadjusted p-values should not be read as discoveries.</p>
            </Callout>
            <Callout tone="danger" title="Effect-size scales differ">
              <p>Cliff's delta, Cramér's V and odds ratios are not interchangeable. Even within Cramér's V, cardinality changes the attainable range and bias.</p>
            </Callout>
          </div>
        </Panel>
      </div>
    </>
  );
}
