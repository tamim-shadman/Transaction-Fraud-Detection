import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { EChartsOption } from "echarts";
import { ArrowUpRight, Download, Gauge, ShieldAlert, Waypoints } from "lucide-react";
import type { Kpi } from "../types";
import { useAnalysis, useManifest } from "../context/AppContext";
import { Chart } from "../components/Chart";
import { FigureStrip } from "../components/Figures";
import { Callout, KpiCard, PageHeader, Panel, SourceNote, Stat, StatRow } from "../components/ui";
import { downloadCsv } from "../lib/csv";
import { fmtFloat, fmtInt, fmtPct } from "../lib/format";
import { cyan, fraudRed, indigo, muted } from "../lib/chartTheme";

const FULL = "FULL (all features)";

const shortModel = (model: string) =>
  model
    .replace("MINUS all history (raw-only)", "− all history (raw-only)")
    .replace("MINUS card_prior_fraud", "− card_prior_fraud")
    .replace("MINUS te_* (4 features)", "− te_* (4)")
    .replace("MINUS cnt_*/n_prior (3 features)", "− counts (3)")
    .replace("MINUS velocity (4 features)", "− velocity (4)")
    .replace("FULL (all features)", "FULL · 27 features");

export default function Model() {
  const manifest = useManifest();
  const analysis = useAnalysis();
  const ablation = analysis.ablation;
  const walkforward = analysis.walkforward;
  const wf = analysis.wf_vs_test[0];
  const psi = analysis.psi;
  const learning = analysis.learning;
  const ensemble = analysis.ensemble;
  const monotonic = analysis.monotonic;
  const timeDecay = analysis.time_decay;
  const leaveCard = analysis.leave_card;
  const calibration = analysis.calibration_temp[0];
  const classBalance = analysis.class_balance;
  const train = classBalance.find((row) => row.split === "train")!;
  const test = classBalance.find((row) => row.split === "test")!;
  const full = ablation.find((row) => row.model === FULL)!;
  const rawOnly = ablation.find((row) => row.model === "MINUS all history (raw-only)")!;
  const severe = psi.filter((row) => row.verdict === "severe");
  const moderate = psi.filter((row) => row.verdict === "moderate");
  const stable = psi.filter((row) => row.verdict === "stable");
  const topPsi = [...psi].sort((a, b) => b.psi - a.psi).slice(0, 5);
  const heldCardTest = leaveCard.find((row) => row.slice === "test rows of HELD-OUT cards")!;
  const ensembleRow = ensemble.find((row) => row.model === "walk_forward_ensemble")!;
  const monotonicRow = monotonic.find((row) => row.model === "monotonic_constrained")!;
  const decayRow = timeDecay.find((row) => row.model === "time_decay_weighted")!;
  const transferIssue = manifest.issues.find((issue) => issue.id === "ISS-02");
  const cardIssue = manifest.issues.find((issue) => issue.id === "ISS-03");

  const rocKpi: Kpi = {
    id: "test_roc_auc",
    label: "Test ROC-AUC",
    value: full.roc_auc,
    format: "decimal4",
    tone: "violet",
    eyebrow: "Ranking · OOD test",
    definition: "Area under the ROC curve on the held-out test split.",
    formula: "P(score(fraud) > score(non-fraud)); computed from phase8_ablation_decomposed.csv.",
    source: "tables/phase8_ablation_decomposed.csv",
    verification: "Matches the FULL row in the source table.",
    context: "Good ranking across thresholds · PR-AUC is the minority-class view",
  };

  const psiKpi: Kpi = {
    id: "severe_psi",
    label: "Severe PSI features",
    value: severe.length,
    format: "integer",
    tone: "fraud",
    eyebrow: "Drift · train vs test",
    definition: "Model features with Population Stability Index ≥ 0.25 between train and test.",
    formula: "Count of phase8_psi rows where verdict = severe.",
    source: "tables/phase8_psi.csv",
    verification: `29.6% of the 27-feature model; ${moderate.length} moderate and ${stable.length} stable.`,
    context: "7 of 27 · top driver month_sin (PSI 6.51)",
  };

  const ablationOption = useMemo<EChartsOption>(() => {
    const rows = [...ablation].sort((a, b) => a.pr_auc - b.pr_auc);
    return {
      grid: { left: 12, right: 84, top: 12, bottom: 8, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const row = rows[params[0].dataIndex];
          const delta = row.pr_auc - full.pr_auc;
          return `<b>${row.model}</b><br/>Test PR-AUC <b>${fmtFloat(row.pr_auc, 4)}</b><br/>ROC-AUC ${fmtFloat(row.roc_auc, 4)} · ${row.n_features} features<br/>Δ vs FULL ${delta >= 0 ? "+" : ""}${fmtFloat(delta, 4)}`;
        },
      },
      xAxis: {
        type: "value",
        min: 0,
        max: 0.95,
        axisLabel: { color: muted, fontSize: 10.5 },
        splitLine: { lineStyle: { color: "#efeae1" } },
      },
      yAxis: {
        type: "category",
        data: rows.map((row) => shortModel(row.model)),
        axisLabel: { color: "#4e5563", fontSize: 10.5 },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      series: [
        {
          type: "bar",
          barWidth: 16,
          data: rows.map((row) => {
            const isFull = row.model === FULL;
            const delta = row.pr_auc - full.pr_auc;
            return {
              value: row.pr_auc,
              itemStyle: {
                color: isFull ? indigo : delta > 0 ? "#1f8a70" : fraudRed,
                borderRadius: [0, 3, 3, 0],
              },
            };
          }),
          label: {
            show: true,
            position: "right",
            fontSize: 10.5,
            color: muted,
            formatter: (params: any) => {
              const row = rows[params.dataIndex];
              const delta = row.pr_auc - full.pr_auc;
              return `${fmtFloat(row.pr_auc, 3)}${row.model === FULL ? "" : ` · ${delta >= 0 ? "+" : ""}${fmtFloat(delta, 3)}`}`;
            },
          },
          markLine: {
            silent: true,
            symbol: "none",
            data: [{ xAxis: full.pr_auc }],
            lineStyle: { type: "dashed", color: "#8c8577", width: 1 },
          },
        },
      ],
    };
  }, [ablation, full.pr_auc]);

  const walkOption = useMemo<EChartsOption>(() => {
    const rows = [...walkforward].sort((a, b) => a.fold - b.fold);
    return {
      grid: { left: 12, right: 24, top: 34, bottom: 12, containLabel: true },
      legend: {
        top: 0,
        left: 0,
        icon: "roundRect",
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: "#4e5563", fontSize: 10.5 },
      },
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const row = rows[params[0].dataIndex];
          return `<b>Fold ${row.fold + 1}</b> · ${row.val_window}<br/>Train n ${fmtInt(row.n_train)} · val n ${fmtInt(row.n_val)}<br/>In-domain PR-AUC <b>${fmtFloat(row.pr_auc, 4)}</b><br/>Same folds on test <b>${fmtFloat(row.test_pr_auc, 4)}</b><br/>Gap ${fmtFloat(row.ood_gap_pr, 4)}`;
        },
      },
      xAxis: {
        type: "category",
        data: rows.map((row) => `Fold ${row.fold + 1}`),
        axisLabel: { color: muted, fontSize: 10.5 },
        axisLine: { lineStyle: { color: "#d8d0c3" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        min: 0.35,
        max: 1,
        axisLabel: { color: muted, fontSize: 10.5 },
        splitLine: { lineStyle: { color: "#efeae1" } },
      },
      series: [
        {
          name: "In-domain validation",
          type: "line",
          data: rows.map((row) => row.pr_auc),
          symbolSize: 7,
          lineStyle: { width: 2, color: indigo },
          itemStyle: { color: indigo },
          areaStyle: { color: "rgba(79,70,229,.07)" },
          label: {
            show: true,
            position: "top",
            formatter: (params: any) => fmtFloat(params.value, 3),
            fontSize: 10.5,
            color: indigo,
          },
        },
        {
          name: "Same folds on test",
          type: "line",
          data: rows.map((row) => row.test_pr_auc),
          symbolSize: 7,
          lineStyle: { width: 2, color: fraudRed },
          itemStyle: { color: fraudRed },
          label: {
            show: true,
            position: "bottom",
            formatter: (params: any) => fmtFloat(params.value, 3),
            fontSize: 10.5,
            color: fraudRed,
          },
        },
      ],
    };
  }, [walkforward]);

  const psiOption = useMemo<EChartsOption>(() => {
    const rows = [...psi].sort((a, b) => b.psi - a.psi);
    const color = (verdict: string) =>
      verdict === "severe" ? fraudRed : verdict === "moderate" ? "#bd761b" : "#1f8a70";
    return {
      grid: { left: 12, right: 56, top: 12, bottom: 16, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const row = rows[params[0].dataIndex];
          return `<b>${row.feature}</b><br/>PSI <b>${fmtFloat(row.psi, 3)}</b> · ${row.verdict}<br/>Family ${row.family} · top bin ${row.top_driver_bin}`;
        },
      },
      xAxis: {
        type: "value",
        max: 7,
        axisLabel: { color: muted, fontSize: 10.5 },
        splitLine: { lineStyle: { color: "#efeae1" } },
      },
      yAxis: {
        type: "category",
        data: rows.map((row) => row.feature),
        axisLabel: { color: "#4e5563", fontSize: 10.5 },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      series: [
        {
          type: "bar",
          barWidth: 8,
          data: rows.map((row) => ({
            value: row.psi,
            itemStyle: { color: color(row.verdict), borderRadius: [0, 2, 2, 0] },
          })),
          label: {
            show: true,
            position: "right",
            formatter: (params: any) => fmtFloat(params.value, 2),
            fontSize: 10.5,
            color: muted,
          },
          markLine: {
            silent: true,
            symbol: "none",
            data: [
              { xAxis: 0.1, lineStyle: { type: "dashed", color: "#bd761b", width: 1 }, label: { formatter: "0.10", fontSize: 10.5, color: "#bd761b" } },
              { xAxis: 0.25, lineStyle: { type: "dashed", color: fraudRed, width: 1 }, label: { formatter: "0.25", fontSize: 10.5, color: fraudRed } },
            ],
          },
        },
      ],
    };
  }, [psi]);

  const variantOption = useMemo<EChartsOption>(() => {
    const rows = [
      { label: "Final · unconstrained", pr: full.pr_auc, roc: full.roc_auc, note: "27 features" },
      { label: "Walk-forward ensemble", pr: ensembleRow.pr_auc, roc: ensembleRow.roc_auc, note: "mean of fold models" },
      { label: "Monotonic constraints", pr: monotonicRow.pr_auc, roc: monotonicRow.roc_auc, note: "constraint variant" },
      { label: "Time-decay weighting", pr: decayRow.pr_auc, roc: decayRow.roc_auc, note: "recency-weighted" },
    ].sort((a, b) => a.pr - b.pr);
    return {
      grid: { left: 12, right: 76, top: 10, bottom: 8, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const row = rows[params[0].dataIndex];
          return `<b>${row.label}</b><br/>Test PR-AUC <b>${fmtFloat(row.pr, 4)}</b><br/>ROC-AUC ${fmtFloat(row.roc, 4)}<br/>${row.note}`;
        },
      },
      xAxis: {
        type: "value",
        min: 0.4,
        max: 0.65,
        axisLabel: { color: muted, fontSize: 10.5 },
        splitLine: { lineStyle: { color: "#efeae1" } },
      },
      yAxis: {
        type: "category",
        data: rows.map((row) => row.label),
        axisLabel: { color: "#4e5563", fontSize: 10.5 },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      series: [
        {
          type: "bar",
          barWidth: 14,
          data: rows.map((row) => ({
            value: row.pr,
            itemStyle: {
              color: row.label.startsWith("Final") ? indigo : "#b8b1ff",
              borderRadius: [0, 3, 3, 0],
            },
          })),
          label: {
            show: true,
            position: "right",
            formatter: (params: any) => fmtFloat(params.value, 4),
            fontSize: 10.5,
            color: muted,
          },
          markLine: {
            silent: true,
            symbol: "none",
            data: [{ xAxis: full.pr_auc }],
            lineStyle: { type: "dashed", color: "#8c8577", width: 1 },
          },
        },
      ],
    };
  }, [full, ensembleRow, monotonicRow, decayRow]);

  const learningOption = useMemo<EChartsOption>(() => {
    const rows = [...learning].sort((a, b) => a.frac - b.frac);
    return {
      grid: { left: 12, right: 24, top: 26, bottom: 12, containLabel: true },
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const row = rows[params[0].dataIndex];
          return `<b>${(row.frac * 100).toFixed(0)}% of train</b><br/>n ${fmtInt(row.n_train)}<br/>PR-AUC <b>${fmtFloat(row.pr_auc, 4)}</b><br/>ROC-AUC ${fmtFloat(row.roc_auc, 4)}`;
        },
      },
      xAxis: {
        type: "category",
        data: rows.map((row) => `${(row.frac * 100).toFixed(0)}%`),
        axisLabel: { color: muted, fontSize: 10.5 },
        axisLine: { lineStyle: { color: "#d8d0c3" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        min: 0.25,
        max: 0.7,
        axisLabel: { color: muted, fontSize: 10.5 },
        splitLine: { lineStyle: { color: "#efeae1" } },
      },
      series: [
        {
          type: "line",
          data: rows.map((row) => row.pr_auc),
          symbolSize: 7,
          lineStyle: { color: cyan, width: 2 },
          itemStyle: { color: cyan },
          areaStyle: { color: "rgba(14,116,144,.08)" },
          label: {
            show: true,
            position: "top",
            formatter: (params: any) => fmtFloat(params.value, 3),
            fontSize: 10.5,
            color: cyan,
          },
        },
      ],
    };
  }, [learning]);

  const figures = useMemo(
    () =>
      ["phase8_shap_beeswarm", "phase8_shap_importance", "phase8_roc_pr_curves"].map((id) =>
        manifest.figures.find((figure) => figure.id === id),
      ).filter(Boolean) as typeof manifest.figures,
    [manifest.figures],
  );

  return (
    <>
      <PageHeader
        eyebrow="P7 · Leak-aware model evaluation"
        title={<>The model ranks well. <em>The boundary is the story.</em></>}
        description="A 27-feature LightGBM reaches test PR-AUC 0.5575 and ROC-AUC 0.9677, but the test split begins 48 seconds after training ends and is almost perfectly separable from it. Walk-forward validation inside train reaches 0.9510; the same folds transfer at 0.4726. This page separates ranking quality, drift, robustness and the economics that follow."
        actions={
          <>
            <Link className="btn btn-sm" to="/artifacts?tab=figures&q=phase8">
              <ArrowUpRight />
              P7 figures
            </Link>
            <button type="button" className="btn btn-sm" onClick={() => downloadCsv("model_comparison.csv", manifest.experiments)}>
              <Download />
              Model comparison
            </button>
          </>
        }
        meta={
          <div className="row wrap" style={{ gap: 7 }}>
            <span className="badge badge-phase">Phase P7</span>
            <span className="badge badge-neutral">23 figures · 14 tables</span>
            <span className="badge badge-strong">19 findings</span>
            <span className="badge badge-caveat">OOD test · not production</span>
          </div>
        }
      />

      <div className="kpi-grid">
        <KpiCard kpi={manifest.kpis.find((kpi) => kpi.id === "test_pr_auc")!} />
        <KpiCard kpi={rocKpi} />
        <KpiCard kpi={manifest.kpis.find((kpi) => kpi.id === "wf_pr_auc")!} />
        <KpiCard kpi={manifest.kpis.find((kpi) => kpi.id === "ood_gap")!} />
        <KpiCard kpi={psiKpi} />
      </div>

      <div className="grid grid-12 mt-16">
        <Panel
          className="span-7"
          title="Ablation: removing history raises cross-boundary PR-AUC"
          subtitle="Every variant is trained on the same rows and scored on the same held-out test split. Deltas are computed against FULL; the source delta column is inconsistent with its own values."
          action={<span className="badge badge-neutral"><Waypoints size={10} />6 variants</span>}
        >
          <Chart option={ablationOption} height={300} ariaLabel="Horizontal bar chart of ablation test PR-AUC" />
          <div className="stat-grid mt-12">
            <Stat value={fmtFloat(full.pr_auc, 4)} label="FULL test PR-AUC" />
            <Stat value={fmtFloat(rawOnly.pr_auc, 4)} label="Raw-only PR-AUC" />
            <Stat value={`+${fmtFloat(ablation.find((row) => row.model === "MINUS card_prior_fraud")!.pr_auc - full.pr_auc, 3)}`} label="Δ minus card prior" />
            <Stat value={`+${fmtFloat(rawOnly.pr_auc - full.pr_auc, 3)}`} label="Δ raw-only" />
          </div>
          <SourceNote>
            From <code>phase8_ablation_decomposed.csv</code>. The recorded <code>delta_pr_auc</code> column is reversed relative to its PR-AUC values; dashboard deltas are recomputed as variant − FULL.
          </SourceNote>
        </Panel>

        <Panel className="span-5" title="What was trained" subtitle="One model, two time slices, causal encodings only.">
          <div className="stack" style={{ gap: 2 }}>
            <StatRow label="Model" value="LightGBM · 27 features" strong />
            <StatRow label="Train rows / fraud" value={`${fmtInt(train.n)} / ${fmtInt(train.fraud)}`} />
            <StatRow label="Test rows / fraud" value={`${fmtInt(test.n)} / ${fmtInt(test.fraud)}`} />
            <StatRow label="Train fraud rate" value={fmtPct(train.fraud_rate, 3)} />
            <StatRow label="Test fraud rate" value={fmtPct(test.fraud_rate, 3)} />
            <StatRow label="Train end" value="2020-06-21 12:13:37" />
            <StatRow label="Test start" value="2020-06-21 12:14:25" />
            <StatRow label="Boundary gap" value="48 seconds" />
          </div>
          <div className="mt-12">
            <Callout tone="info" title="Ranking metrics, not accuracy">
              <p>
                PR-AUC is the minority-class view; ROC-AUC is threshold-free ranking quality. Neither is a production
                accuracy claim, and neither fixes the train→test distribution shift.
              </p>
            </Callout>
          </div>
          <SourceNote>From <code>phase0_class_balance.csv</code> and the notebook model cell. Causal target encodings are trained only on prior rows.</SourceNote>
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel
          className="span-7"
          title="Walk-forward: 0.95 in-domain, 0.47 across the boundary"
          subtitle="Four expanding-window folds inside train, then each fold model scored on the same held-out test split."
          action={<span className="badge badge-caveat"><ShieldAlert size={10} />OOD transfer</span>}
        >
          <Chart option={walkOption} height={300} ariaLabel="Line chart of walk-forward in-domain and test PR-AUC" />
          <div className="stat-grid mt-12">
            <Stat value={fmtFloat(wf.mean_val_pr_auc, 4)} label="Mean in-domain PR-AUC" hint={`± ${fmtFloat(wf.sd_val_pr_auc, 4)} SD`} />
            <Stat value={fmtFloat(wf.mean_test_pr_auc_from_folds, 4)} label="Mean test PR-AUC" hint={`± ${fmtFloat(wf.sd_test_pr_auc_from_folds, 4)} SD`} />
            <Stat value={fmtFloat(wf.mean_ood_gap, 4)} label="Mean OOD gap" hint={`${wf.n_folds} folds`} />
            <Stat value="1.0000" label="Adversarial AUC" hint="train vs test" />
          </div>
          <SourceNote>From <code>phase8_walkforward_cv.csv</code> and <code>phase8_wf_vs_test.csv</code>. The gap is validation PR-AUC minus the same fold model's test PR-AUC.</SourceNote>
        </Panel>

        <Panel className="span-5" title="Anatomy of the transfer failure" subtitle="The ablation localizes most of the loss to cumulative-history features.">
          <div className="stack" style={{ gap: 10 }}>
            <Callout tone="danger" title={transferIssue?.title ?? "Test metrics are OOD estimates"}>
              <p>{transferIssue?.summary ?? "Train and test are almost perfectly separable by cumulative-history features."}</p>
            </Callout>
            <Callout tone="warn" title={cardIssue?.title ?? "card_prior_fraud dominates"}>
              <p>{cardIssue?.summary ?? "Removing card_prior_fraud alone raises test PR-AUC from 0.5575 to 0.8315."}</p>
            </Callout>
            <div className="stack" style={{ gap: 2 }}>
              <StatRow label="Δ remove card_prior_fraud" value={`+${fmtFloat(ablation.find((row) => row.model === "MINUS card_prior_fraud")!.pr_auc - full.pr_auc, 4)}`} strong />
              <StatRow label="Δ remove all history" value={`+${fmtFloat(ablation.find((row) => row.model === "MINUS all history (raw-only)")!.pr_auc - full.pr_auc, 4)}`} strong />
              <StatRow label="Δ remove target encodings" value={`+${fmtFloat(ablation.find((row) => row.model === "MINUS te_* (4 features)")!.pr_auc - full.pr_auc, 4)}`} />
              <StatRow label="Δ remove counts" value={`+${fmtFloat(ablation.find((row) => row.model === "MINUS cnt_*/n_prior (3 features)")!.pr_auc - full.pr_auc, 4)}`} />
            </div>
          </div>
          <div className="mt-12">
            <SourceNote>The boundary is only 48 seconds wide, yet the model learns levels that do not carry across it. That is a distribution-shift result, not a tuning failure.</SourceNote>
          </div>
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel
          className="span-7"
          title="Population Stability Index: 7 severe, 1 moderate, 19 stable"
          subtitle="PSI compares binned train and test distributions. Month encodings drift hardest because the test window covers a different calendar mix."
        >
          <Chart option={psiOption} height={430} ariaLabel="Horizontal bar chart of PSI by model feature" />
          <SourceNote>
            From <code>phase8_psi.csv</code>. Conventional bands: &lt; 0.10 stable, 0.10–0.25 moderate, ≥ 0.25 severe. PSI is diagnostic, not a causal explanation.
          </SourceNote>
        </Panel>

        <Panel className="span-5" title="Drift summary" subtitle="Top drivers and what they do — and do not — mean.">
          <div className="stat-grid">
            <Stat value={String(severe.length)} label="Severe" hint="PSI ≥ 0.25" />
            <Stat value={String(moderate.length)} label="Moderate" hint="0.10–0.25" />
            <Stat value={String(stable.length)} label="Stable" hint="< 0.10" />
            <Stat value={String(psi.length)} label="Features" hint="all screened" />
          </div>
          <div className="divider" />
          <div className="stack" style={{ gap: 2 }}>
            {topPsi.map((row) => (
              <StatRow key={row.feature} label={<span className="mono">{row.feature}</span>} value={fmtFloat(row.psi, 3)} />
            ))}
          </div>
          <div className="mt-12">
            <Callout tone="warn" title="Calendar drift is not card behaviour">
              <p>
                <code>month_sin</code> and <code>month_cos</code> are deterministic functions of the transaction month.
                Their PSI reflects the different train/test periods, not a change in fraud behaviour. <code>n_prior</code> and
                amount-history features are the substantively important drift signals.
              </p>
            </Callout>
          </div>
          <SourceNote>From <code>phase8_psi.csv</code>. The top-driver bin is the bin contributing most to each PSI value.</SourceNote>
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel
          className="span-7"
          title="Robustness variants do not close the gap"
          subtitle="Same test split where available. Monotonic constraints improve PR-AUC but reduce ROC-AUC; the ensemble is worse than the single final model."
          action={<span className="badge badge-neutral">4 variants</span>}
        >
          <Chart option={variantOption} height={245} ariaLabel="Bar chart comparing model robustness variants" />
          <div className="stat-grid mt-12">
            <Stat value={`${fmtFloat(ensembleRow.pr_auc - full.pr_auc, 4)}`} label="Ensemble Δ PR-AUC" />
            <Stat value={`+${fmtFloat(monotonicRow.pr_auc - full.pr_auc, 4)}`} label="Monotonic Δ PR-AUC" />
            <Stat value={fmtFloat(monotonicRow.roc_auc, 4)} label="Monotonic ROC-AUC" />
            <Stat value={`${fmtFloat(decayRow.pr_auc - full.pr_auc, 4)}`} label="Time-decay Δ PR-AUC" />
          </div>
          <SourceNote>From <code>phase8_ensemble_comparison.csv</code>, <code>phase8_monotonic_comparison.csv</code> and <code>phase8_time_decay_comparison.csv</code>. These are robustness checks, not a leaderboard.</SourceNote>
        </Panel>

        <Panel className="span-5" title="Probability quality" subtitle="Temperature scaling on a separate calibration split. The absolute errors are tiny because the simulator is smooth.">
          <div className="stack" style={{ gap: 2 }}>
            <StatRow label="Fitted temperature" value={fmtFloat(calibration.T, 4)} strong />
            <StatRow label="ECE before" value={fmtFloat(calibration.ece_before, 6)} />
            <StatRow label="ECE after" value={fmtFloat(calibration.ece_after, 6)} />
            <StatRow label="Brier before" value={fmtFloat(calibration.brier_before, 6)} />
            <StatRow label="Brier after" value={fmtFloat(calibration.brier_after, 6)} />
            <StatRow label="NLL before" value={fmtFloat(calibration.nll_before, 6)} />
            <StatRow label="NLL after" value={fmtFloat(calibration.nll_after, 6)} />
          </div>
          <div className="mt-12">
            <Callout tone="info" title="Calibration is not the binding problem">
              <p>
                ECE and Brier both improve after scaling, but the model's problem here is ranking transfer, not probability
                calibration. The near-zero errors are specific to this simulated dataset.
              </p>
            </Callout>
          </div>
          <SourceNote>From <code>phase8_calibration_temp.csv</code>. ECE and Brier are unitless; lower is better.</SourceNote>
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-5" title="Learning curve is not monotonic" subtitle="Single-seed subsets; the full-data point is not the best.">
          <Chart option={learningOption} height={240} ariaLabel="Line chart of PR-AUC by training fraction" />
          <Callout tone="warn" title="Do not read a data-size plateau">
            <p>
              The 25% subset reaches {fmtFloat(learning.find((row) => row.frac === 0.25)!.pr_auc, 4)}, while full data
              reaches {fmtFloat(learning.find((row) => row.frac === 1)!.pr_auc, 4)}. With one seed per point, this is noise
              plus distribution shift — not evidence that more data hurts.
            </p>
          </Callout>
          <SourceNote>From <code>phase8_learning_curve.csv</code>. All points use the same held-out test split.</SourceNote>
        </Panel>

        <Panel
          className="span-7"
          title="Explainability and ranking artifacts"
          subtitle="SHAP global importance, beeswarm and the ROC/PR curves from the run."
          action={<Link className="btn btn-sm" to="/artifacts?tab=figures&q=phase8">Open gallery <ArrowUpRight /></Link>}
        >
          <FigureStrip figures={figures} />
          <div className="divider" />
          <div className="row wrap" style={{ gap: 12 }}>
            <span className="tiny muted">SHAP background subsampled 200 → 100 rows.</span>
            <span className="tiny muted">SHAP runtime 163.1 s.</span>
            <span className="tiny muted">Leave-card-out held-out test PR-AUC {fmtFloat(heldCardTest.pr_auc, 4)}.</span>
          </div>
          <SourceNote>From the P7 figure set. SHAP values explain the fitted model; they do not establish causal effects.</SourceNote>
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-12" title="How to read this model" subtitle="Three boundaries that must travel with every metric on this page.">
          <div className="grid grid-3" style={{ gap: 12 }}>
            <Callout tone="danger" title="This is a transfer test">
              <p>
                The test split starts 48 seconds after train ends. Every test metric measures cross-boundary transfer under
                severe drift, not typical generalization to a future cohort.
              </p>
            </Callout>
            <Callout tone="warn" title="History features dominate the failure">
              <p>
                Removing <code>card_prior_fraud</code> or the whole history block raises test PR-AUC by 0.274. Strong
                in-domain signal is not the same as transportable signal.
              </p>
            </Callout>
            <Callout tone="info" title="Economics needs a threshold">
              <p>
                PR-AUC and ROC-AUC are threshold-free. Review capacity, false-positive cost and missed fraud dollars decide
                the operating point — those trade-offs are on the Economics page.
              </p>
              <p>
                <Link className="insight-link" to="/economics">Open review economics <ArrowUpRight size={11} /></Link>
              </p>
            </Callout>
          </div>
        </Panel>
      </div>

      <Panel className="mt-16" title="Model scorecard" subtitle="All headline numbers in one place, with their evaluation slice." action={<span className="badge badge-neutral"><Gauge size={10} />source values</span>}>
        <div className="grid grid-4" style={{ gap: 12 }}>
          <div className="panel pad" style={{ background: "var(--surface-2)" }}>
            <div className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 750 }}>Ranking</div>
            <div className="serif" style={{ fontSize: 30, marginTop: 4 }}>{fmtFloat(full.pr_auc, 3)}</div>
            <p className="tiny muted mt-8">Test PR-AUC · 95% bootstrap CI 0.5365–0.5784. ROC-AUC {fmtFloat(full.roc_auc, 3)}.</p>
          </div>
          <div className="panel pad" style={{ background: "var(--surface-2)" }}>
            <div className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 750 }}>In-domain</div>
            <div className="serif" style={{ fontSize: 30, marginTop: 4 }}>{fmtFloat(wf.mean_val_pr_auc, 3)}</div>
            <p className="tiny muted mt-8">Walk-forward validation PR-AUC · ± {fmtFloat(wf.sd_val_pr_auc, 3)} across {wf.n_folds} folds.</p>
          </div>
          <div className="panel pad" style={{ background: "var(--surface-2)" }}>
            <div className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 750 }}>Transfer gap</div>
            <div className="serif" style={{ fontSize: 30, marginTop: 4 }}>{fmtFloat(wf.mean_ood_gap, 3)}</div>
            <p className="tiny muted mt-8">Mean in-domain minus test PR-AUC. The gap is larger than the test score itself.</p>
          </div>
          <div className="panel pad" style={{ background: "var(--surface-2)" }}>
            <div className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 750 }}>Drift</div>
            <div className="serif" style={{ fontSize: 30, marginTop: 4 }}>7 / 27</div>
            <p className="tiny muted mt-8">Features with severe PSI. Top drivers: month_sin 6.51, n_prior 5.10, month_cos 1.45.</p>
          </div>
        </div>
        <SourceNote>Compiled from <code>phase8_ablation_decomposed.csv</code>, <code>phase8_wf_vs_test.csv</code>, <code>phase8_psi.csv</code>, <code>phase8_calibration_temp.csv</code> and the ledger.</SourceNote>
      </Panel>
    </>
  );
}
