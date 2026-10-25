import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { EChartsOption } from "echarts";
import { ArrowUpRight, Boxes, Download, Info, Timer } from "lucide-react";
import { useAnalysis, useManifest } from "../context/AppContext";
import { Chart } from "../components/Chart";
import { DataTable, type TableColumn } from "../components/DataTable";
import { FigureStrip } from "../components/Figures";
import { Callout, PageHeader, Panel, SourceNote, StatRow } from "../components/ui";
import { downloadCsv } from "../lib/csv";
import { asset } from "../lib/data";
import { fmtFloat, fmtInt, fmtPct } from "../lib/format";
import { indigo, muted, palette } from "../lib/chartTheme";

export default function Advanced() {
  const manifest = useManifest();
  const analysis = useAnalysis();
  const anomaly = analysis.anomaly;
  const dbscan = analysis.dbscan;
  const kmeans = analysis.kmeans;
  const separability = analysis.separability;
  const times = manifest.run.embeddingTimes ?? [];
  const pca3d = manifest.htmlArtifacts.find((item) => item.id === "phase4_pca_3d");

  const anomalyOption = useMemo<EChartsOption>(() => {
    const rows = [...anomaly].sort((a, b) => a.auc - b.auc);
    return {
      grid: { left: 10, right: 38, top: 14, bottom: 8, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const row = rows[params[0].dataIndex];
          return `<b>${row.model}</b><br/>AUC ${fmtFloat(row.auc, 3)}<br/>Top-decile precision ${fmtPct(row.top10pct_precision, 2)}<br/>Lift ${fmtFloat(row.top10pct_lift, 2)}× · n ${fmtInt(row.n)}`;
        },
      },
      xAxis: { type: "value", max: 1, axisLabel: { color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
      yAxis: { type: "category", data: rows.map((row) => row.model), axisLabel: { color: "#4e5563", fontSize: 10.5 }, axisTick: { show: false }, axisLine: { show: false } },
      series: [
        {
          type: "bar",
          data: rows.map((row, index) => ({ value: row.auc, itemStyle: { color: row.model === "LOF" ? "#bd761b" : index === 2 ? indigo : "#9b93ff", borderRadius: [0, 3, 3, 0] } })),
          barWidth: 16,
          label: { show: true, position: "right", formatter: (params: any) => fmtFloat(params.value, 3), fontSize: 10.5, color: muted },
        },
      ],
    };
  }, [anomaly]);

  const sepOption = useMemo<EChartsOption>(() => {
    const rows = [...separability].sort((a, b) => a.auc - b.auc);
    return {
      grid: { left: 10, right: 36, top: 8, bottom: 8, containLabel: true },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: (params: any) => `${params[0].name}<br/>Logistic AUC <b>${fmtFloat(params[0].value, 3)}</b>` },
      xAxis: { type: "value", min: 0.4, max: 0.9, axisLabel: { color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
      yAxis: { type: "category", data: rows.map((row) => row.embedding), axisLabel: { color: "#4e5563", fontSize: 10.5 }, axisTick: { show: false }, axisLine: { show: false } },
      series: [
        {
          type: "bar",
          data: rows.map((row) => ({ value: row.auc, itemStyle: { color: row.embedding.startsWith("PCA") ? indigo : "#c9c4f8", borderRadius: [0, 3, 3, 0] } })),
          barWidth: 11,
          label: { show: true, position: "right", formatter: (params: any) => fmtFloat(params.value, 3), fontSize: 10.5, color: muted },
        },
      ],
    };
  }, [separability]);

  const clusterOption = useMemo<EChartsOption>(() => {
    const rows = [...dbscan.map((row) => ({ label: `DBSCAN · ${row.cluster}`, value: row.fraud_rate, n: row.n })), ...kmeans.map((row) => ({ label: `K-Means · cluster ${row.cluster}`, value: row.rate, n: row.n }))];
    return {
      grid: { left: 10, right: 36, top: 12, bottom: 8, containLabel: true },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: (params: any) => `${params[0].name}<br/>Fraud rate <b>${fmtPct(params[0].value, 2)}</b><br/>n ${fmtInt(rows[params[0].dataIndex].n)}` },
      xAxis: { type: "value", max: 0.07, axisLabel: { formatter: (value: number) => `${(value * 100).toFixed(0)}%`, color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
      yAxis: { type: "category", data: rows.map((row) => row.label), axisLabel: { color: "#4e5563", fontSize: 10.5 }, axisTick: { show: false }, axisLine: { show: false } },
      series: [
        {
          type: "bar",
          data: rows.map((row) => ({ value: row.value, itemStyle: { color: row.label.includes("noise") ? "#cb4257" : row.value > 0.009 ? "#7c3aed" : "#b8b1ff", borderRadius: [0, 3, 3, 0] } })),
          barWidth: 12,
          label: { show: true, position: "right", formatter: (params: any) => fmtPct(params.value, 2), fontSize: 10.5, color: muted },
          markLine: { silent: true, symbol: "none", data: [{ xAxis: manifest.counts.fraudRate }], lineStyle: { type: "dashed", color: "#8c8577", width: 1 } },
        },
      ],
    };
  }, [dbscan, kmeans, manifest.counts.fraudRate]);

  const timeOption = useMemo<EChartsOption>(() => ({
    grid: { left: 10, right: 34, top: 12, bottom: 8, containLabel: true },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: (params: any) => `${params[0].name}<br/><b>${params[0].value}s</b> · AUC ${fmtFloat(times[params[0].dataIndex].auc, 3)}` },
    xAxis: { type: "value", axisLabel: { formatter: "{value}s", color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
    yAxis: { type: "category", data: times.map((row: any) => row.model), axisLabel: { color: "#4e5563", fontSize: 10.5 }, axisTick: { show: false }, axisLine: { show: false } },
    series: [
      {
        type: "bar",
        data: times.map((row: any) => ({ value: row.seconds, itemStyle: { color: row.model.startsWith("t-SNE") ? "#cb4257" : "#0e7490", borderRadius: [0, 3, 3, 0] } })),
        barWidth: 10,
        label: { show: true, position: "right", formatter: "{c}s", fontSize: 10.5, color: muted },
      },
    ],
  }), [times]);

  const anomalyColumns: TableColumn[] = [
    { key: "model", label: "Detector", render: (row) => <b style={{ color: "var(--text)" }}>{row.model}</b> },
    { key: "auc", label: "AUC", align: "right", render: (row) => fmtFloat(row.auc, 3) },
    { key: "top10pct_precision", label: "Top-decile precision", align: "right", render: (row) => fmtPct(row.top10pct_precision, 2) },
    { key: "top10pct_lift", label: "Lift", align: "right", render: (row) => `${fmtFloat(row.top10pct_lift, 2)}×` },
    { key: "n", label: "Sample", align: "right", render: (row) => fmtInt(row.n) },
  ];

  const figures = useMemo(
    () => ["phase4_pca_scatter", "phase4_tsne_p30", "phase4_umap_nn15_md0.5", "phase4_separability"].map((id) => manifest.figures.find((figure) => figure.id === id)).filter(Boolean) as typeof manifest.figures,
    [manifest.figures],
  );

  return (
    <>
      <PageHeader
        eyebrow="P4 · Advanced visualisation & dimensionality reduction"
        title={<>Unsupervised views separate fraud — <em>with caveats.</em></>}
        description="A 2D PCA projection reaches a logistic AUC of 0.816, but t-SNE and UMAP are lower and highly parameter-sensitive. Isolation Forest and LOF beat the autoencoder on AUC, but LOF uses a 10× smaller sample. These are diagnostics, not deployable detectors."
        actions={
          <>
            <Link className="btn btn-sm" to="/artifacts?tab=figures&q=phase4"><ArrowUpRight />P4 figures</Link>
            {pca3d ? <a className="btn btn-sm" href={asset(pca3d.full)} target="_blank" rel="noreferrer"><Boxes />Open 3D PCA <ArrowUpRight /></a> : null}
          </>
        }
        meta={
          <div className="row wrap" style={{ gap: 7 }}>
            <span className="badge badge-phase">Phase P4</span>
            <span className="badge badge-neutral">27 figures · 4 tables</span>
            <span className="badge badge-strong">RQ7</span>
            <span className="badge badge-caveat">Labels used for evaluation only</span>
          </div>
        }
      />

      <div className="grid grid-12">
        <Panel className="span-5" title="Anomaly detector comparison" subtitle="AUC against fraud labels; the detectors never see labels during fitting." action={<span className="badge badge-neutral">3 detectors</span>}>
          <Chart option={anomalyOption} height={230} ariaLabel="Bar chart of anomaly detector AUC" />
          <div className="divider" />
          <StatRow label="Isolation Forest AUC" value={fmtFloat(anomaly.find((row) => row.model === "IsolationForest")!.auc, 3)} />
          <StatRow label="Top-decile lift" value={`${fmtFloat(anomaly.find((row) => row.model === "IsolationForest")!.top10pct_lift, 2)}×`} />
          <StatRow label="LOF sample" value={`${fmtInt(anomaly.find((row) => row.model === "LOF")!.n)} rows`} />
          <StatRow label="Autoencoder AUC" value={fmtFloat(anomaly.find((row) => row.model === "Autoencoder")!.auc, 3)} />
          <SourceNote>From <code>phase4_anomaly_summary.csv</code>. LOF's AUC is not comparable on equal footing — its sample is 5,000, not 50,000.</SourceNote>
        </Panel>

        <Panel className="span-7" title="Embedding separability" subtitle="Logistic classifier on each 2D embedding. PCA is the strongest; UMAP with weak neighbourhood structure is below 0.5.">
          <Chart option={sepOption} height={300} ariaLabel="Bar chart of logistic AUC on different 2D embeddings" />
          <div className="row wrap mt-8" style={{ gap: 12 }}>
            <span className="tiny muted">PCA(2) is linear and stable.</span>
            <span className="tiny muted">t-SNE 30/50/100 perplexity costs 321–410 s.</span>
            <span className="tiny muted">UMAP 15/0.5 is fastest at 20 s.</span>
          </div>
          <SourceNote>From <code>phase4_separability_table.csv</code>. Embeddings use different hyperparameters; not a model-selection leaderboard.</SourceNote>
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-5" title="Clusters vs fraud rate" subtitle="DBSCAN noise is the highest-risk group; K-Means cluster 2 is only slightly above baseline.">
          <Chart option={clusterOption} height={260} ariaLabel="Bar chart of fraud rate by cluster" />
          <SourceNote>From <code>phase4_dbscan_clusters.csv</code> and <code>phase4_kmeans_cluster_rate.csv</code>. Cluster labels are descriptive, not supervised.</SourceNote>
        </Panel>

        <Panel className="span-4" title="Embedding runtime" subtitle="The 3D PCA artifact and t-SNE runs dominate compute." action={<span className="badge badge-neutral"><Timer size={10} />measured</span>}>
          <Chart option={timeOption} height={260} ariaLabel="Bar chart of embedding runtimes" />
          <SourceNote>From notebook runtime output. t-SNE(100) takes 410 s; UMAP(15, 0.5) takes 20 s.</SourceNote>
        </Panel>

        <Panel className="span-3" title="Method boundaries" subtitle="Read these before using any result on this page.">
          <div className="stack" style={{ gap: 10 }}>
            <Callout tone="warn" title="Not a deployment test">
              <p>Embeddings and clusters are visual diagnostics. AUCs are computed after the fact with labels, not from a production scoring path.</p>
            </Callout>
            <Callout tone="info" title="Hyperparameters matter">
              <p>UMAP and t-SNE produce very different separability across neighbour/perplexity settings. Treat one embedding as one view, not a verdict.</p>
            </Callout>
          </div>
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-7" title="Unsupervised artifacts" subtitle="PCA, t-SNE, UMAP and separability as rendered by the run." action={<Link className="btn btn-sm" to="/artifacts?tab=figures&q=phase4">All 27 P4 figures <ArrowUpRight /></Link>}>
          <FigureStrip figures={figures} />
        </Panel>
        <Panel className="span-5" title="Detector detail" subtitle="AUC, top-decile precision and sample size." action={<button type="button" className="btn btn-sm" onClick={() => downloadCsv("anomaly_detectors.csv", anomaly)}><Download />CSV</button>}>
          <DataTable rows={anomaly} columns={anomalyColumns} pageSize={3} searchable={false} hideToolbar={true} />
          <div className="divider" />
          <StatRow label="Best AUC" value={`LOF · ${fmtFloat(anomaly.find((row) => row.model === "LOF")!.auc, 3)}`} />
          <StatRow label="Best top-decile lift" value={`${fmtFloat(anomaly.find((row) => row.model === "LOF")!.top10pct_lift, 2)}×`} />
          <StatRow label="Most conservative sample" value="LOF · 5,000 rows" />
          <div className="mt-12">
            <SourceNote>From <code>phase4_anomaly_summary.csv</code>. Scores are uncalibrated; thresholds would need a separate decision layer.</SourceNote>
          </div>
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-12" title="What labels are doing here" subtitle="A short methods note, because unsupervised claims are easy to overstate.">
          <div className="grid grid-3" style={{ gap: 12 }}>
            <Callout tone="success" title="Fitting is unsupervised">
              <p>Isolation Forest, autoencoder, LOF, K-Means and DBSCAN are fitted without the fraud label. Labels are used only to evaluate the resulting scores and clusters.</p>
            </Callout>
            <Callout tone="warn" title="Evaluation is supervised">
              <p>An AUC computed against labels is a supervised evaluation of an unsupervised score. It answers “does this ranking align with fraud?”, not “would this work in production?”</p>
            </Callout>
            <Callout tone="danger" title="Sample sizes differ">
              <p>LOF's 0.881 AUC comes from 5,000 rows; Isolation Forest and the autoencoder use 50,000. Do not rank the three as if they shared a test set.</p>
            </Callout>
          </div>
        </Panel>
      </div>
    </>
  );
}
