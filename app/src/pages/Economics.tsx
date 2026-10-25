import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { EChartsOption } from "echarts";
import { ArrowUpRight, CircleDollarSign, Download, Scale, SlidersHorizontal, Wallet } from "lucide-react";
import type { Kpi, Row } from "../types";
import { useAnalysis, useManifest } from "../context/AppContext";
import { Chart } from "../components/Chart";
import { DataTable, type TableColumn } from "../components/DataTable";
import { Callout, KpiCard, PageHeader, Panel, Segmented, SourceNote, Stat, StatRow } from "../components/ui";
import { downloadCsv } from "../lib/csv";
import { fmtFloat, fmtInt, fmtMoney, fmtPct } from "../lib/format";
import { cyan, fraudRed, indigo, muted } from "../lib/chartTheme";

const budgetLabel = (value: number) => `${value}%`;

export default function Economics() {
  const manifest = useManifest();
  const analysis = useAnalysis();
  const capture = analysis.capture;
  const costs = analysis.cost;
  const thresholds = analysis.thresholds;
  const segments = analysis.segments;
  const calibration = analysis.calibration_temp[0];
  const testSplit = analysis.class_balance.find((row) => row.split === "test")!;

  const [budgetIndex, setBudgetIndex] = useState(2);
  const [fpCost, setFpCost] = useState(5);
  const [segmentTab, setSegmentTab] = useState("category");

  const selected = capture[budgetIndex];
  const selectedCost = costs.find((row) => row.fp_cost === fpCost)!;
  const totalFraudUsd = capture[2].usd_captured / capture[2].usd_share;
  const missedEvents = testSplit.fraud - selected.fraud_caught;

  const thresholdRows = useMemo<Row[]>(
    () =>
      thresholds
        .map((row): Row => {
          const fpCharge = row.FP * fpCost;
          return { ...row, fp_charge: fpCharge, modeled_loss: row.missed_usd + fpCharge };
        })
        .sort((a, b) => a.modeled_loss - b.modeled_loss),
    [thresholds, fpCost],
  );
  const bestStored = thresholdRows[0];
  const trueOptimumGap = bestStored.modeled_loss - selectedCost.expected_loss;

  const segmentRows = useMemo(
    () => segments.filter((row) => row.segment === segmentTab),
    [segments, segmentTab],
  );
  const categoryRows = segments.filter((row) => row.segment === "category");
  const hourRows = segments.filter((row) => row.segment === "hour_bin");
  const stateRows = segments
    .filter((row) => row.segment === "state" && row.n_fraud >= 10)
    .sort((a, b) => a.recall - b.recall);
  const worstCategory = [...categoryRows].sort((a, b) => a.recall - b.recall)[0];
  const bestCategory = [...categoryRows].sort((a, b) => b.recall - a.recall)[0];
  const worstHour = [...hourRows].sort((a, b) => a.recall - b.recall)[0];
  const worstState = stateRows[0];
  const segmentFp = categoryRows.reduce((sum, row) => sum + row.fp, 0);

  const usdShareKpi: Kpi = {
    id: "usd_share_1pct",
    label: "Fraud dollars at 1%",
    value: capture[2].usd_share,
    format: "percent2",
    tone: "teal",
    eyebrow: "Budget · measured",
    definition: "Share of test fraud dollars captured by reviewing the top 1% of transactions by score.",
    formula: "USD fraud caught in top 5,557 scores ÷ total test fraud USD.",
    source: "tables/phase8_capture_at_k.csv",
    verification: "Matches the 1.0% row; USD total is derived as captured USD ÷ share.",
    context: "$778,601 of $1,133,325 · 5,557 reviews",
  };

  const recallKpi: Kpi = {
    id: "recall_5pct",
    label: "Event recall at 5%",
    value: capture[4].recall,
    format: "percent2",
    tone: "violet",
    eyebrow: "Budget · measured",
    definition: "Share of test fraud events caught when reviewing the top 5% of transactions.",
    formula: "1,849 fraud caught ÷ 2,145 test fraud events.",
    source: "tables/phase8_capture_at_k.csv",
    verification: "Matches the 5.0% row; precision at this budget is 6.65%.",
    context: "27,786 reviews · 93.42% of fraud dollars",
  };

  const lossKpi: Kpi = {
    id: "cost_min_loss",
    label: "Cost-min expected loss",
    value: selectedCost.expected_loss,
    format: "money",
    tone: "fraud",
    eyebrow: `FP cost $${fpCost}`,
    definition: `Modelled missed-fraud dollars plus $${fpCost} per false positive at the loss-minimising threshold.`,
    formula: `min over thresholds of missed USD + $${fpCost} × FP.`,
    source: "tables/phase8_cost_sensitivity.csv",
    verification: "At $5 the 1e-05 row reproduces the source expected loss; other cost levels are recomputed.",
    context: `Threshold ${selectedCost.optimal_threshold.toExponential(2)} · recall ${fmtPct(selectedCost.recall, 2)} · precision ${fmtPct(selectedCost.precision, 2)}`,
  };

  const fpKpi: Kpi = {
    id: "cost_min_fp",
    label: "FP at the 1e-05 point",
    value: 20322,
    format: "integer",
    tone: "ink",
    eyebrow: "Review burden",
    definition: "False positives produced by the cost-minimising threshold at $5 per false positive.",
    formula: "FP count in phase8_threshold_table.csv at threshold 1e-05.",
    source: "tables/phase8_threshold_table.csv",
    verification: "20,322 FP against 1,807 TP; event precision is 8.17%.",
    context: "20,322 reviews that are not fraud · recall 84.24%",
  };

  const budgetOption = useMemo<EChartsOption>(() => {
    const labels = capture.map((row) => budgetLabel(row.top_pct));
    return {
      grid: { left: 12, right: 28, top: 34, bottom: 10, containLabel: true },
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
          const row = capture[params[0].dataIndex];
          return `<b>${row.top_pct}% review budget</b><br/>${fmtInt(row.k)} reviews<br/>Recall <b>${fmtPct(row.recall, 2)}</b> · precision ${fmtPct(row.precision, 2)}<br/>Fraud dollars ${fmtPct(row.usd_share, 2)}<br/>USD per review ${fmtMoney(row.usd_per_review)}`;
        },
      },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: { color: muted, fontSize: 10.5 },
        axisLine: { lineStyle: { color: "#d8d0c3" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        max: 1,
        axisLabel: { formatter: (value: number) => `${(value * 100).toFixed(0)}%`, color: muted, fontSize: 10.5 },
        splitLine: { lineStyle: { color: "#efeae1" } },
      },
      series: [
        {
          name: "Event recall",
          type: "line",
          data: capture.map((row) => row.recall),
          symbolSize: 6,
          lineStyle: { width: 2, color: indigo },
          itemStyle: { color: indigo },
          label: {
            show: true,
            position: "top",
            formatter: (params: any) => fmtPct(params.value, 1),
            fontSize: 10.5,
            color: indigo,
          },
          markLine: {
            silent: true,
            symbol: "none",
            data: [{ xAxis: budgetLabel(selected.top_pct) }],
            lineStyle: { type: "dashed", color: "#8c8577", width: 1 },
            label: { formatter: "selected", fontSize: 10.5, color: "#8c8577" },
          },
        },
        {
          name: "Fraud-dollar share",
          type: "line",
          data: capture.map((row) => row.usd_share),
          symbolSize: 6,
          lineStyle: { width: 2, color: cyan },
          itemStyle: { color: cyan },
          label: {
            show: true,
            position: "bottom",
            formatter: (params: any) => fmtPct(params.value, 1),
            fontSize: 10.5,
            color: cyan,
          },
        },
        {
          name: "Event precision",
          type: "line",
          data: capture.map((row) => row.precision),
          symbolSize: 5,
          lineStyle: { width: 1.5, type: "dashed", color: fraudRed },
          itemStyle: { color: fraudRed },
        },
      ],
    };
  }, [capture, selected.top_pct]);

  const costOption = useMemo<EChartsOption>(() => {
    const rows = [...costs].sort((a, b) => a.fp_cost - b.fp_cost);
    return {
      grid: { left: 12, right: 44, top: 34, bottom: 10, containLabel: true },
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
          return `<b>$${row.fp_cost} per false positive</b><br/>Optimal threshold ${row.optimal_threshold.toExponential(2)}<br/>Expected loss <b>${fmtMoney(row.expected_loss)}</b><br/>Recall ${fmtPct(row.recall, 2)} · precision ${fmtPct(row.precision, 2)}`;
        },
      },
      xAxis: {
        type: "category",
        data: rows.map((row) => `$${row.fp_cost}`),
        axisLabel: { color: muted, fontSize: 10.5 },
        axisLine: { lineStyle: { color: "#d8d0c3" } },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: "value",
          axisLabel: { formatter: (value: number) => `$${Math.round(value / 1000)}k`, color: muted, fontSize: 10.5 },
          splitLine: { lineStyle: { color: "#efeae1" } },
        },
        {
          type: "value",
          min: 0.6,
          max: 1,
          axisLabel: { formatter: (value: number) => `${(value * 100).toFixed(0)}%`, color: muted, fontSize: 10.5 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "Expected loss",
          type: "bar",
          data: rows.map((row) => ({
            value: row.expected_loss,
            itemStyle: {
              color: row.fp_cost === fpCost ? indigo : "#c9c4f8",
              borderRadius: [3, 3, 0, 0],
            },
          })),
          barWidth: "52%",
          label: {
            show: true,
            position: "top",
            formatter: (params: any) => `$${Math.round(params.value / 1000)}k`,
            fontSize: 10.5,
            color: muted,
          },
        },
        {
          name: "Recall",
          type: "line",
          yAxisIndex: 1,
          data: rows.map((row) => row.recall),
          symbolSize: 6,
          lineStyle: { width: 2, color: fraudRed },
          itemStyle: { color: fraudRed },
        },
      ],
    };
  }, [costs, fpCost]);

  const segmentOption = useMemo<EChartsOption>(() => {
    let rows = [...segmentRows];
    if (segmentTab === "state") {
      rows = rows.filter((row) => row.n_fraud >= 10).sort((a, b) => a.recall - b.recall).slice(0, 12);
    }
    rows.sort((a, b) => b.recall - a.recall);
    return {
      grid: { left: 12, right: 64, top: 12, bottom: 8, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const row = rows[params[0].dataIndex];
          return `<b>${row.segmentLabel}</b><br/>Recall <b>${fmtPct(row.recall, 2)}</b><br/>${fmtInt(row.fp)} FP · ${fmtInt(row.n_fraud)} fraud / ${fmtInt(row.n)} rows`;
        },
      },
      xAxis: {
        type: "value",
        max: 1,
        axisLabel: { formatter: (value: number) => `${(value * 100).toFixed(0)}%`, color: muted, fontSize: 10.5 },
        splitLine: { lineStyle: { color: "#efeae1" } },
      },
      yAxis: {
        type: "category",
        data: rows.map((row) => row.segmentLabel),
        axisLabel: { color: "#4e5563", fontSize: segmentTab === "state" ? 8.5 : 9 },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      series: [
        {
          type: "bar",
          barWidth: segmentTab === "hour_bin" ? 20 : 12,
          data: rows.map((row) => ({
            value: row.recall,
            itemStyle: {
              color: row.recall < 0.5 ? fraudRed : row.recall < 0.8 ? "#bd761b" : "#1f8a70",
              borderRadius: [0, 3, 3, 0],
            },
          })),
          label: {
            show: true,
            position: "right",
            formatter: (params: any) => fmtPct(params.value, 1),
            fontSize: 10.5,
            color: muted,
          },
        },
      ],
    };
  }, [segmentRows, segmentTab]);

  const thresholdColumns: TableColumn[] = [
    {
      key: "threshold",
      label: "Score threshold",
      render: (row) => (
        <span className="row" style={{ gap: 6 }}>
          <span className="mono">{fmtFloat(row.threshold, 6)}</span>
          {row.threshold === bestStored.threshold ? <span className="badge badge-strong">lowest</span> : null}
        </span>
      ),
    },
    { key: "TP", label: "TP", align: "right", render: (row) => fmtInt(row.TP) },
    { key: "FP", label: "FP", align: "right", render: (row) => fmtInt(row.FP) },
    { key: "FN", label: "FN", align: "right", render: (row) => fmtInt(row.FN) },
    { key: "precision", label: "Precision", align: "right", render: (row) => fmtPct(row.precision, 2) },
    { key: "recall", label: "Recall", align: "right", render: (row) => fmtPct(row.recall, 2) },
    { key: "missed_usd", label: "Missed USD", align: "right", render: (row) => fmtMoney(row.missed_usd) },
    { key: "fp_charge", label: `FP charge @ $${fpCost}`, align: "right", render: (row) => fmtMoney(row.fp_charge) },
    {
      key: "modeled_loss",
      label: "Modelled loss",
      align: "right",
      render: (row) => <b style={{ color: row.threshold === bestStored.threshold ? indigo : "var(--text)" }}>{fmtMoney(row.modeled_loss)}</b>,
    },
  ];

  const segmentColumns: TableColumn[] = [
    { key: "segmentLabel", label: segmentTab === "state" ? "State" : segmentTab === "hour_bin" ? "Hour bin" : "Category" },
    { key: "n", label: "Transactions", align: "right", render: (row) => fmtInt(row.n) },
    { key: "n_fraud", label: "Fraud", align: "right", render: (row) => fmtInt(row.n_fraud) },
    { key: "recall", label: "Recall", align: "right", render: (row) => <b style={{ color: row.recall < 0.5 ? fraudRed : "var(--text)" }}>{fmtPct(row.recall, 2)}</b> },
    { key: "fp", label: "False positives", align: "right", render: (row) => fmtInt(row.fp) },
  ];

  return (
    <>
      <PageHeader
        eyebrow="P7 · Review economics"
        title={<>The score is cheap. <em>Review capacity is not.</em></>}
        description="A ranking model becomes a review policy only when you choose a budget or a threshold. At the top 1% budget, 5,557 reviews catch 1,404 of 2,145 fraud events and 68.7% of fraud dollars. At the cost-minimising $5-per-false-positive threshold, recall rises to 84.2% but 20,322 legitimate transactions are reviewed."
        actions={
          <>
            <Link className="btn btn-sm" to="/model">
              <ArrowUpRight />
              Model evidence
            </Link>
            <button type="button" className="btn btn-sm" onClick={() => downloadCsv("capture_at_k.csv", capture)}>
              <Download />
              Capture table
            </button>
          </>
        }
        meta={
          <div className="row wrap" style={{ gap: 7 }}>
            <span className="badge badge-phase">Phase P7</span>
            <span className="badge badge-neutral">5 budget points</span>
            <span className="badge badge-neutral">3 operating points</span>
            <span className="badge badge-caveat">Simulator amounts · cost assumptions</span>
          </div>
        }
      />

      <div className="kpi-grid">
        <KpiCard kpi={manifest.kpis.find((kpi) => kpi.id === "capture_1pct")!} />
        <KpiCard kpi={usdShareKpi} />
        <KpiCard kpi={recallKpi} />
        <KpiCard kpi={lossKpi} />
        <KpiCard kpi={fpKpi} />
      </div>

      <div className="grid grid-12 mt-16">
        <Panel
          className="span-7"
          title="Review-budget explorer"
          subtitle="Move the budget to a measured capture point. Event recall, fraud-dollar share and precision all come from the same scored test set."
          action={<span className="badge badge-neutral"><SlidersHorizontal size={10} />measured points</span>}
        >
          <div className="row-between mb-8">
            <span className="tiny muted">Review budget · top-scored share</span>
            <b className="num" style={{ fontSize: 12 }}>
              {selected.top_pct}% · {fmtInt(selected.k)} reviews
            </b>
          </div>
          <input
            type="range"
            min={0}
            max={capture.length - 1}
            step={1}
            value={budgetIndex}
            onChange={(event) => setBudgetIndex(Number(event.target.value))}
            aria-label="Select review budget"
            style={{ width: "100%", accentColor: indigo }}
          />
          <div className="row-between tiny muted mb-8">
            {capture.map((row) => (
              <span key={row.top_pct}>{row.top_pct}%</span>
            ))}
          </div>
          <Chart option={budgetOption} height={300} ariaLabel="Line chart of recall, fraud-dollar share and precision by review budget" />
          <div className="stat-grid mt-12">
            <Stat value={fmtInt(selected.fraud_caught)} label="Fraud caught" hint={`of ${fmtInt(testSplit.fraud)} events`} />
            <Stat value={fmtPct(selected.recall, 1)} label="Event recall" hint={`${fmtInt(missedEvents)} missed`} />
            <Stat value={fmtPct(selected.precision, 1)} label="Event precision" hint={`${fmtInt(selected.k - selected.fraud_caught)} FP`} />
            <Stat value={fmtMoney(selected.usd_captured, true)} label="Fraud USD caught" hint={`${fmtPct(selected.usd_share, 1)} of total`} />
          </div>
          <SourceNote>
            From <code>phase8_capture_at_k.csv</code>. Total test fraud USD ({fmtMoney(totalFraudUsd)}) is derived from captured USD ÷ USD share. The slider snaps to the five measured budgets; no interpolation is invented.
          </SourceNote>
        </Panel>

        <Panel className="span-5" title={`Selected budget: ${selected.top_pct}%`} subtitle="What the reviewer sees, and what still gets through.">
          <div className="stack" style={{ gap: 2 }}>
            <StatRow label="Transactions reviewed" value={fmtInt(selected.k)} strong />
            <StatRow label="Fraud caught" value={`${fmtInt(selected.fraud_caught)} / ${fmtInt(testSplit.fraud)}`} />
            <StatRow label="Fraud missed" value={fmtInt(missedEvents)} />
            <StatRow label="Event precision" value={fmtPct(selected.precision, 2)} />
            <StatRow label="Event recall" value={fmtPct(selected.recall, 2)} />
            <StatRow label="Fraud dollars caught" value={fmtMoney(selected.usd_captured)} />
            <StatRow label="Fraud dollars missed" value={fmtMoney(totalFraudUsd - selected.usd_captured)} />
            <StatRow label="USD caught per review" value={fmtMoney(selected.usd_per_review)} />
            <StatRow label="Review budget" value={`${selected.top_pct}% of test`} />
          </div>
          <div className="mt-12">
            <Callout
              tone={selected.precision < 0.15 ? "warn" : "info"}
              title={selected.precision < 0.15 ? "High recall, low precision" : "Precision falls as the budget grows"}
            >
              <p>
                At {selected.top_pct}%, {fmtPct(selected.precision, 1)} of reviewed transactions are fraud. The rest are
                false positives — the operational cost the model does not pay by itself.
              </p>
            </Callout>
          </div>
          <SourceNote>Test split: {fmtInt(testSplit.n)} transactions, {fmtInt(testSplit.fraud)} fraud events. Capture rows are measured, not interpolated.</SourceNote>
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel
          className="span-7"
          title="Operating points under a chosen false-positive cost"
          subtitle="Every row re-prices the same three stored thresholds. Modelled loss = missed fraud USD + the selected charge per false positive."
          action={
            <div className="row wrap" style={{ gap: 8 }}>
              <button type="button" className="btn btn-sm" onClick={() => downloadCsv(`operating_points_fp_${fpCost}.csv`, thresholdRows)}>
                <Download />
                CSV
              </button>
              <Segmented
                ariaLabel="False positive cost"
                options={costs.map((row) => ({ value: String(row.fp_cost), label: `$${row.fp_cost}` }))}
                value={String(fpCost)}
                onChange={(value) => setFpCost(Number(value))}
              />
            </div>
          }
        >
          <DataTable
            rows={thresholdRows}
            columns={thresholdColumns}
            pageSize={3}
            searchable={false}
            hideToolbar
            exportName={`operating_points_fp_${fpCost}.csv`}
          />
          <div className="mt-12">
            <Callout tone={trueOptimumGap > 1 ? "warn" : "success"} title={trueOptimumGap > 1 ? "The stored thresholds are not the true optimum" : "The stored row matches the source optimum"}>
              <p>
                At ${fpCost} per false positive, the best <em>stored</em> threshold has modelled loss{" "}
                <b>{fmtMoney(bestStored.modeled_loss)}</b>. The source cost sweep reports an optimum of{" "}
                <b>{fmtMoney(selectedCost.expected_loss)}</b> at threshold {selectedCost.optimal_threshold.toExponential(2)}.
                {trueOptimumGap > 1
                  ? " The search finds a lower-loss point than any of the three displayed rows."
                  : " The 1e-05 row reproduces that optimum."}
              </p>
            </Callout>
          </div>
          <SourceNote>
            From <code>phase8_threshold_table.csv</code> and <code>phase8_cost_sensitivity.csv</code>. The table is sorted by modelled loss at the selected FP cost; source counts are unchanged.
          </SourceNote>
        </Panel>

        <Panel className="span-5" title="Cost sensitivity" subtitle="Expected loss rises with the false-positive charge; the optimal threshold moves left." action={<span className="badge badge-neutral"><Scale size={10} />5 cost levels</span>}>
          <Chart option={costOption} height={270} ariaLabel="Bar chart of expected loss and recall by false-positive cost" />
          <div className="stat-grid mt-12">
            <Stat value={`$${selectedCost.fp_cost}`} label="FP charge" />
            <Stat value={selectedCost.optimal_threshold.toExponential(1)} label="Optimal threshold" />
            <Stat value={fmtMoney(selectedCost.expected_loss, true)} label="Expected loss" />
            <Stat value={fmtPct(selectedCost.recall, 1)} label="Recall at optimum" />
          </div>
          <SourceNote>From <code>phase8_cost_sensitivity.csv</code>. The optimal threshold is selected on the test scores by the notebook; treat it as an in-sample cost curve, not a deployed policy.</SourceNote>
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel
          className="span-7"
          title="Where the errors concentrate"
          subtitle={
            segmentTab === "state"
              ? "Twelve lowest-recall states with at least 10 fraud events, at the 1e-05 operating point."
              : segmentTab === "hour_bin"
                ? "Event recall by six-hour block at the 1e-05 operating point."
                : "All 14 merchant categories at the 1e-05 operating point. Lowest recall appears at the top."
          }
          action={
            <Segmented
              ariaLabel="Segment dimension"
              options={[
                { value: "category", label: "Category" },
                { value: "hour_bin", label: "Hour" },
                { value: "state", label: "State" },
              ]}
              value={segmentTab}
              onChange={setSegmentTab}
            />
          }
        >
          <Chart
            option={segmentOption}
            height={segmentTab === "state" ? 320 : segmentTab === "hour_bin" ? 220 : 310}
            ariaLabel={`Bar chart of recall by ${segmentTab}`}
          />
          <SourceNote>
            From <code>phase8_segment_errors.csv</code>. These are errors at the cost-minimising 1e-05 threshold — the same point as 20,322 FP and 1,807 TP — not at the F1-max threshold.
          </SourceNote>
        </Panel>

        <Panel className="span-5" title="Error ledger" subtitle="The segment chart is a view of the same operating point across all rows.">
          <div className="stack" style={{ gap: 2 }}>
            <StatRow label="False positives at 1e-05" value={fmtInt(segmentFp)} strong />
            <StatRow label="Worst category" value={`${worstCategory.segmentLabel} · ${fmtPct(worstCategory.recall, 1)}`} />
            <StatRow label="Best category" value={`${bestCategory.segmentLabel} · ${fmtPct(bestCategory.recall, 1)}`} />
            <StatRow label="Worst hour block" value={`${worstHour.segmentLabel} · ${fmtPct(worstHour.recall, 1)}`} />
            <StatRow label="Worst state (n ≥ 10)" value={worstState ? `${worstState.state} · ${fmtPct(worstState.recall, 1)}` : "—"} />
            <StatRow label="Segment table" value={`${segments.length} rows`} />
          </div>
          <div className="mt-12">
            <Callout tone="warn" title="Recall is not uniform">
              <p>
                Aggregate recall hides segment-level failure. Health and fitness, travel and personal care fall below 33%
                recall in the category view; several states are below 60%.
              </p>
            </Callout>
          </div>
          <SourceNote>Segment rows share the same test scores and threshold. They should not be read as independent audits.</SourceNote>
        </Panel>
      </div>

      <Panel
        className="mt-16"
        title="Segment error table"
        subtitle="Search, sort and export any segment dimension. False positives are counted at the 1e-05 operating point."
        action={<button type="button" className="btn btn-sm" onClick={() => downloadCsv(`segment_errors_${segmentTab}.csv`, segmentRows)}><Download />CSV</button>}
      >
        <DataTable
          rows={segmentRows}
          columns={segmentColumns}
          pageSize={8}
          exportName={`segment_errors_${segmentTab}.csv`}
          searchPlaceholder={`Search ${segmentTab === "hour_bin" ? "hour bins" : segmentTab === "state" ? "states" : "categories"}…`}
          initialSort={{ key: "recall", direction: "asc" }}
          countLabel="segments"
        />
        <SourceNote>From <code>phase8_segment_errors.csv</code>. Sort state by recall to see the lowest-recall states beyond the 12 shown in the chart.</SourceNote>
      </Panel>

      <div className="grid grid-12 mt-16">
        <Panel className="span-7" title="Probability calibration" subtitle="Temperature scaling is a post-hoc adjustment; it does not change ranking." action={<span className="badge badge-neutral"><CircleDollarSign size={10} />separate split</span>}>
          <div className="stat-grid">
            <Stat value={fmtFloat(calibration.T, 4)} label="Temperature" hint="fitted T" />
            <Stat value={`${fmtPct(1 - calibration.ece_after / calibration.ece_before, 1)}`} label="ECE reduction" hint="before → after" />
            <Stat value={`${fmtPct(1 - calibration.brier_after / calibration.brier_before, 1)}`} label="Brier reduction" hint="before → after" />
            <Stat value={`${fmtPct(1 - calibration.nll_after / calibration.nll_before, 1)}`} label="NLL reduction" hint="before → after" />
          </div>
          <div className="divider" />
          <div className="stack" style={{ gap: 2 }}>
            <StatRow label="ECE before → after" value={`${fmtFloat(calibration.ece_before, 6)} → ${fmtFloat(calibration.ece_after, 6)}`} />
            <StatRow label="Brier before → after" value={`${fmtFloat(calibration.brier_before, 6)} → ${fmtFloat(calibration.brier_after, 6)}`} />
            <StatRow label="NLL before → after" value={`${fmtFloat(calibration.nll_before, 6)} → ${fmtFloat(calibration.nll_after, 6)}`} />
          </div>
          <SourceNote>
            From <code>phase8_calibration_temp.csv</code>. ECE, Brier and NLL are computed on a calibration split; absolute values near zero reflect the simulator and are not a production guarantee.
          </SourceNote>
        </Panel>

        <Panel className="span-5" title="Decision memo" subtitle="Use the budget the review team can actually staff.">
          <div className="stack" style={{ gap: 10 }}>
            <Callout tone="success" title="1% budget · high-value triage">
              <p>
                {fmtInt(capture[2].k)} reviews catch {fmtPct(capture[2].recall, 1)} of events and{" "}
                {fmtPct(capture[2].usd_share, 1)} of dollars at {fmtPct(capture[2].precision, 1)} precision.
              </p>
            </Callout>
            <Callout tone="warn" title="5% budget · recall expansion">
              <p>
                {fmtInt(capture[4].k)} reviews raise recall to {fmtPct(capture[4].recall, 1)} and dollar share to{" "}
                {fmtPct(capture[4].usd_share, 1)}, but only {fmtPct(capture[4].precision, 1)} of reviews are fraud.
              </p>
            </Callout>
            <Callout tone="danger" title="Cost-min is not free">
              <p>
                At $5 per false positive, the loss-minimising point buys {fmtPct(selectedCost.recall, 1)} recall with{" "}
                {fmtInt(20322)} false positives. Moving from the 1% to the 5% budget adds{" "}
                {fmtInt(capture[4].k - capture[2].k)} reviews for {fmtPct(capture[4].recall - capture[2].recall, 1)}{" "}
                more recall — a staffing decision, not a model metric.
              </p>
            </Callout>
          </div>
          <SourceNote>
            All dollar figures are test-set fraud amounts; false-positive charges are assumptions in the cost table. No live
            review cost, labour capacity or customer-friction cost is available in the workspace.
          </SourceNote>
        </Panel>
      </div>

      <Panel className="mt-16" title="Threshold reference" subtitle="The three stored operating points without re-pricing. This is the source table behind the calculator." action={<button type="button" className="btn btn-sm" onClick={() => downloadCsv("threshold_table.csv", thresholds)}><Download />Source CSV</button>}>
        <div className="grid grid-3" style={{ gap: 12 }}>
          {thresholds.map((row) => (
            <div className="panel pad" style={{ background: "var(--surface-2)" }} key={row.threshold}>
              <div className="row-between">
                <span className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 750 }}>Threshold {fmtFloat(row.threshold, 5)}</span>
                <Wallet size={12} color={muted} />
              </div>
              <div className="row" style={{ alignItems: "baseline", gap: 8, marginTop: 6 }}>
                <span className="serif" style={{ fontSize: 28 }}>{fmtPct(row.recall, 1)}</span>
                <span className="tiny muted">recall</span>
              </div>
              <p className="tiny muted mt-8">
                {fmtPct(row.precision, 1)} precision · {fmtInt(row.TP)} TP / {fmtInt(row.FP)} FP · {fmtMoney(row.missed_usd, true)} missed
              </p>
            </div>
          ))}
        </div>
        <SourceNote>From <code>phase8_threshold_table.csv</code>. F1-max is 0.11267; the cost-min row is 1e-05 at $5 per false positive.</SourceNote>
      </Panel>
    </>
  );
}
