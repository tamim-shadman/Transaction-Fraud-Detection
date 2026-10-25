import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { EChartsOption } from "echarts";
import { ArrowUpRight, Download, FlaskConical, Info, Zap } from "lucide-react";
import { useAnalysis, useManifest } from "../context/AppContext";
import { Chart } from "../components/Chart";
import { DataTable, type TableColumn } from "../components/DataTable";
import { FigureStrip } from "../components/Figures";
import { Callout, PageHeader, Panel, SourceNote, Stat, StatRow } from "../components/ui";
import { downloadCsv } from "../lib/csv";
import { fmtFloat, fmtInt, fmtPct } from "../lib/format";
import { fraudRed, indigo, muted } from "../lib/chartTheme";

export default function Features() {
  const manifest = useManifest();
  const analysis = useAnalysis();
  const speed = analysis.speed;
  const combos = useMemo(() => [...analysis.combos].sort((a, b) => a.fraud_rate - b.fraud_rate), [analysis.combos]);
  const merchants = analysis.merchant_top.slice(0, 12);
  const hourEncoding = analysis.hour_encoding;
  const abl = Object.fromEntries(analysis.ablation.map((row) => [row.model, row]));
  const leakage = manifest.auditNotes.find((note) => note.id === "AN-01");
  const speedOver1k = speed.filter((row) => ["1k-5k", ">5k"].includes(row.speed_kmh)).reduce((sum, row) => sum + row.n, 0);
  const speedRows = speed.reduce((sum, row) => sum + row.n, 0);
  const combo = combos.find((row) => String(row.segment).includes("COMBO"))!;

  const speedOption = useMemo<EChartsOption>(() => {
    const rows = speed;
    return {
      grid: { left: 10, right: 14, top: 26, bottom: 15, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const row = rows[params[0].dataIndex];
          return `<b>${row.speed_kmh} km/h</b><br/>Fraud rate ${fmtPct(row.rate, 2)}<br/>${fmtInt(row.k)} / ${fmtInt(row.n)}`;
        },
      },
      xAxis: { type: "category", data: rows.map((row) => row.speed_kmh), axisLabel: { color: muted, fontSize: 10.5 }, axisLine: { lineStyle: { color: "#d8d0c3" } }, axisTick: { show: false } },
      yAxis: { type: "value", max: 0.025, axisLabel: { formatter: (value: number) => `${(value * 100).toFixed(1)}%`, color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
      series: [
        {
          type: "bar",
          data: rows.map((row, index) => ({ value: row.rate, itemStyle: { color: index >= 3 ? fraudRed : "#9b93ff", borderRadius: [3, 3, 0, 0] } })),
          barWidth: "58%",
          label: { show: true, position: "top", formatter: (params: any) => fmtPct(params.value, 2), fontSize: 10.5, color: muted },
          markLine: { silent: true, symbol: "none", data: [{ yAxis: manifest.counts.fraudRate }], lineStyle: { type: "dashed", color: "#8c8577", width: 1 } },
        },
      ],
    };
  }, [speed, manifest.counts.fraudRate]);

  const comboOption = useMemo<EChartsOption>(() => {
    const rows = combos;
    return {
      grid: { left: 10, right: 44, top: 12, bottom: 10, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const row = rows[params[0].dataIndex];
          return `<b>${row.segment}</b><br/>Rate ${fmtPct(row.fraud_rate, 2)}<br/>Lift ${fmtFloat(row.lift_vs_base, 1)}×<br/>n ${fmtInt(row.n)}`;
        },
      },
      xAxis: { type: "value", max: 0.25, axisLabel: { formatter: (value: number) => `${(value * 100).toFixed(0)}%`, color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
      yAxis: { type: "category", data: rows.map((row) => row.segment.replace(" (COMBO)", "")), axisLabel: { color: "#4e5563", fontSize: 10.5 }, axisTick: { show: false }, axisLine: { show: false } },
      series: [
        {
          type: "bar",
          data: rows.map((row) => ({ value: row.fraud_rate, itemStyle: { color: String(row.segment).includes("COMBO") ? fraudRed : row.fraud_rate > 0.01 ? "#7c3aed" : "#c9c4f8", borderRadius: [0, 3, 3, 0] } })),
          barWidth: 13,
          label: { show: true, position: "right", formatter: (params: any) => `${(params.value * 100).toFixed(1)}% · ${fmtFloat(rows[params.dataIndex].lift_vs_base, 1)}×`, fontSize: 10.5, color: muted },
        },
      ],
    };
  }, [combos]);

  const merchantOption = useMemo<EChartsOption>(() => {
    const rows = [...merchants].sort((a, b) => a.eb_rate - b.eb_rate);
    return {
      grid: { left: 10, right: 42, top: 10, bottom: 8, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const row = rows[params[0].dataIndex];
          return `<b>${row.merchant_clean}</b><br/>${row.category}<br/>EB ${fmtPct(row.eb_rate, 2)} · category prior ${fmtPct(row.cat_eb, 2)}<br/>${fmtInt(row.k)} / ${fmtInt(row.n)}`;
        },
      },
      xAxis: { type: "value", max: 0.024, axisLabel: { formatter: (value: number) => `${(value * 100).toFixed(1)}%`, color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
      yAxis: { type: "category", data: rows.map((row) => row.merchant_clean.slice(0, 24)), axisLabel: { color: "#4e5563", fontSize: 10.5 }, axisTick: { show: false }, axisLine: { show: false } },
      series: [
        {
          type: "bar",
          data: rows.map((row) => ({ value: row.eb_rate, itemStyle: { color: row.category === "shopping_net" ? indigo : "#b8b1ff", borderRadius: [0, 3, 3, 0] } })),
          barWidth: 10,
          label: { show: true, position: "right", formatter: (params: any) => fmtPct(params.value, 2), fontSize: 10.5, color: muted },
        },
      ],
    };
  }, [merchants]);

  const hourOption = useMemo<EChartsOption>(() => ({
    grid: { left: 10, right: 10, top: 22, bottom: 8, containLabel: true },
    tooltip: { trigger: "axis", formatter: (params: any) => `${params[0].name}<br/>Validation PR-AUC <b>${fmtFloat(params[0].value, 4)}</b>` },
    xAxis: { type: "category", data: hourEncoding.map((row) => row.encoding), axisLabel: { color: muted, fontSize: 10.5 }, axisLine: { lineStyle: { color: "#d8d0c3" } }, axisTick: { show: false } },
    yAxis: { type: "value", min: 0.82, max: 0.87, axisLabel: { color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
    series: [{ type: "bar", data: hourEncoding.map((row) => row.pr_auc), barWidth: "48%", itemStyle: { color: "#0e7490", borderRadius: [3, 3, 0, 0] }, label: { show: true, position: "top", formatter: (params: any) => params.value.toFixed(4), fontSize: 10.5, color: muted } }],
  }), [hourEncoding]);

  const merchantColumns: TableColumn[] = [
    { key: "merchant_clean", label: "Merchant", render: (row) => <span style={{ color: "var(--text)" }}>{row.merchant_clean}</span> },
    { key: "category", label: "Category" },
    { key: "n", label: "Transactions", align: "right", render: (row) => fmtInt(row.n) },
    { key: "k", label: "Fraud", align: "right", render: (row) => fmtInt(row.k) },
    { key: "cat_eb", label: "Category prior", align: "right", render: (row) => fmtPct(row.cat_eb, 2) },
    { key: "eb_rate", label: "Merchant EB", align: "right", render: (row) => <b style={{ color: indigo }}>{fmtPct(row.eb_rate, 2)}</b> },
  ];

  const figures = useMemo(
    () => ["phase7_speed_rate", "phase7_combo_lift", "phase7_merchant_hier_eb", "phase7_te_leak_demo"].map((id) => manifest.figures.find((figure) => figure.id === id)).filter(Boolean) as typeof manifest.figures,
    [manifest.figures],
  );

  return (
    <>
      <PageHeader
        eyebrow="P6 · Feature engineering & depth analyses"
        title={<>The best descriptive features are not the <em>most transferable.</em></>}
        description="Velocity, combination flags, merchant shrinkage and hour encodings are engineered and tested here. Several are strong descriptive signals. Their cross-boundary contribution is another matter: removing the velocity block raises test PR-AUC, and the target-encoding leakage demo does not show the inflation its ledger entry claims."
        actions={
          <>
            <Link className="btn btn-sm" to="/artifacts?tab=figures&q=phase7"><ArrowUpRight />P6 figures</Link>
            <button type="button" className="btn btn-sm" onClick={() => downloadCsv("merchant_eb.csv", analysis.merchants_eb)}><Download />Merchant EB</button>
          </>
        }
        meta={
          <div className="row wrap" style={{ gap: 7 }}>
            <span className="badge badge-phase">Phase P6</span>
            <span className="badge badge-neutral">12 figures · 5 tables</span>
            <span className="badge badge-strong">RQ8 feature families</span>
            <span className="badge badge-caveat">AN-01 leakage audit</span>
          </div>
        }
      />

      <div className="grid grid-12">
        <Panel className="span-5" title="Implied-speed risk" subtitle="Fraud rate rises monotonically with implied card→merchant speed. The feature is also a simulator artifact." action={<span className="badge badge-caveat"><Zap size={10} />Generator artifact</span>}>
          <Chart option={speedOption} height={270} ariaLabel="Bar chart of fraud rate by implied speed" />
          <div className="stat-grid mt-12">
            <Stat value={fmtPct(speed[0].rate, 2)} label="<100 km/h" />
            <Stat value={fmtPct(speed[speed.length - 1].rate, 2)} label=">5,000 km/h" />
            <Stat value={`${(speed[speed.length - 1].rate / speed[0].rate).toFixed(2)}×`} label="Top / bottom" />
            <Stat value={fmtInt(speedOver1k)} label="Rows >1,000 km/h" />
          </div>
          <SourceNote>From <code>phase7_speed_rate_table.csv</code>. {fmtPct(speedOver1k / speedRows, 2)} of rows exceed 1,000 km/h, which is physically implausible for card travel.</SourceNote>
        </Panel>

        <Panel className="span-7" title="High-risk combinations" subtitle="Night + risky category + amount ≥ $500 yields a 22.1% fraud rate, 42× baseline. The pair alone is weaker than amount alone." action={<span className="badge badge-neutral">5 segments</span>}>
          <Chart option={comboOption} height={300} ariaLabel="Bar chart of fraud rate for risk segments and their combinations" />
          <div className="row wrap mt-8" style={{ gap: 12 }}>
            <span className="tiny muted">Combo lift <b>{fmtFloat(combo.lift_vs_base, 1)}×</b></span>
            <span className="tiny muted">Combo n <b>{fmtInt(combo.n)}</b></span>
            <span className="tiny muted">Baseline <b>{fmtPct(manifest.counts.fraudRate, 2)}</b></span>
          </div>
          <SourceNote>From <code>phase7_high_risk_combo.csv</code>. A segment with high lift and tiny support is a review prioritization rule, not a general population rate.</SourceNote>
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-7" title="Merchant hierarchical empirical Bayes" subtitle="700 merchant-category rows, shrunk toward their category prior. Top merchants sit at 1.9–2.2% vs a 1.59% shopping_net prior." action={<span className="badge badge-neutral">700 rows</span>}>
          <Chart option={merchantOption} height={335} ariaLabel="Bar chart of merchant empirical Bayes fraud rates" />
          <SourceNote>From <code>phase7_merchant_eb_table.csv</code>. Names are simulator-generated; “fraud_” prefixes are stripped for display.</SourceNote>
        </Panel>

        <div className="span-5 stack">
          <Panel title="Hour encoding" subtitle="A narrow three-feature comparison. Raw hour wins by 0.0003 over cyclical — not a material difference.">
            <Chart option={hourOption} height={205} ariaLabel="Bar chart comparing hour encoding validation PR-AUC" />
            <SourceNote>From <code>phase7_hour_encoding_comparison.csv</code>. This is not the final model.</SourceNote>
          </Panel>
          <Callout tone="danger" title={leakage?.title ?? "Leakage demo is inconclusive"}>
            <p>{leakage?.observation ?? "The naive and causal target encodings show the same correlation with the test target."}</p>
            <p>{leakage?.implication ?? "Keep causal encoding as good practice, but do not cite this run as evidence of inflation."}</p>
          </Callout>
        </div>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-4" title="Velocity is a double-edged feature" subtitle="Descriptive signal vs transfer contribution.">
          <StatRow label="Speed rate, >5,000 km/h" value={fmtPct(speed[speed.length - 1].rate, 2)} />
          <StatRow label="Speed rate, <100 km/h" value={fmtPct(speed[0].rate, 2)} />
          <StatRow label="FULL model test PR-AUC" value={fmtFloat(abl["FULL (all features)"].pr_auc, 4)} />
          <StatRow label="MINUS velocity" value={fmtFloat(abl["MINUS velocity (4 features)"].pr_auc, 4)} />
          <StatRow label="MINUS all history" value={fmtFloat(abl["MINUS all history (raw-only)"].pr_auc, 4)} />
          <div className="mt-12">
            <Callout tone="warn" title="Descriptive ≠ transferable">
              <p>The speed signal is strong in-sample, yet removing the velocity block improves cross-boundary PR-AUC. Features that encode simulator mechanics can rank well in-domain and fail across the time boundary.</p>
            </Callout>
          </div>
        </Panel>

        <Panel className="span-8" title="Feature-engineering evidence" subtitle="Speed bins, combination lift, merchant shrinkage and the target-encoding check." action={<Link className="btn btn-sm" to="/artifacts?tab=figures&q=phase7">Open gallery <ArrowUpRight /></Link>}>
          <FigureStrip figures={figures} />
          <SourceNote>The leakage demo's recorded correlations are equal at displayed precision; the dashboard does not restate the ledger's inflation claim.</SourceNote>
        </Panel>
      </div>

      <Panel className="mt-16" title="Top merchant risk" subtitle="Highest EB-shrunk rates among 700 merchant-category rows. Search or export the full source table separately." action={<span className="badge badge-neutral"><FlaskConical size={10} />Empirical Bayes</span>}>
        <DataTable rows={analysis.merchant_top} columns={merchantColumns} pageSize={10} exportName="merchant_eb_top.csv" searchPlaceholder="Search merchants…" />
      </Panel>

      <div className="grid grid-12 mt-16">
        <Panel className="span-12" title="Feature families in the final model" subtitle="27 features span transformed raw values, history counts and target encodings. The drift diagnosis is on the model page.">
          <div className="grid grid-3" style={{ gap: 12 }}>
            <div className="panel pad" style={{ background: "var(--surface-2)" }}>
              <div className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 750 }}>Raw & transformed</div>
              <div className="serif" style={{ fontSize: 29, marginTop: 4 }}>15</div>
              <p className="tiny muted mt-8">Amount, hour, day, month, age, population, distance and log transforms. The raw-only ablation drops all history and keeps 15 features.</p>
            </div>
            <div className="panel pad" style={{ background: "var(--surface-2)" }}>
              <div className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 750 }}>History & velocity</div>
              <div className="serif" style={{ fontSize: 29, marginTop: 4 }}>7</div>
              <p className="tiny muted mt-8">Trailing counts, prior volume, hours since previous, implied speed and card prior fraud. These are the features most exposed to PSI drift.</p>
            </div>
            <div className="panel pad" style={{ background: "var(--surface-2)" }}>
              <div className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 750 }}>Target encodings</div>
              <div className="serif" style={{ fontSize: 29, marginTop: 4 }}>4</div>
              <p className="tiny muted mt-8">Category, state, ZIP3 and merchant, trained only on prior rows. The ablation removes all four; test PR-AUC rises to {fmtFloat(abl["MINUS te_* (4 features)"].pr_auc, 4)}.</p>
            </div>
          </div>
          <SourceNote>Counts are derived from the 27-feature model and ablation definitions in the notebook and <code>phase8_ablation_decomposed.csv</code>.</SourceNote>
        </Panel>
      </div>
    </>
  );
}
