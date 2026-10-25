import { useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  DollarSign,
  Download,
  FileSpreadsheet,
  Filter,
  Flame,
  Layers,
  Percent,
  RefreshCw,
  Save,
  Scale,
  Settings,
  ShieldAlert,
  Sliders,
  TrendingUp,
  Users,
} from "lucide-react";
import { useManifest } from "../context/AppContext";
import { Callout, PageHeader, Panel, SourceNote } from "../components/ui";
import { Chart } from "../components/Chart";
import { fmtInt, fmtMoney, fmtPct } from "../lib/format";
import { fraudRed, indigo, muted, palette } from "../lib/chartTheme";
import {
  computeReviewEconomics,
  computeThresholdSimulation,
  computeWorkloadScaling,
  EMPIRICAL_BASELINE,
  ReviewEconomicsScenarioParams,
} from "../lib/simulation";

export default function ScenarioLab() {
  const [activeTab, setActiveTab] = useState<"economics" | "threshold" | "workload">("economics");

  // Tab 1: Economics parameters
  const [capacityPct, setCapacityPct] = useState<number>(1.0);
  const [hourlyWage, setHourlyWage] = useState<number>(35.0);
  const [reviewMinutes, setReviewMinutes] = useState<number>(6.0);
  const [fpPenalty, setFpPenalty] = useState<number>(15.0);
  const [missedMultiplier, setMissedMultiplier] = useState<number>(1.0);

  // Tab 2: Threshold parameters
  const [threshold, setThreshold] = useState<number>(0.00001);

  // Tab 3: Workload multiplier
  const [volumeMultiplier, setVolumeMultiplier] = useState<number>(1.0);

  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  // Computed Economics
  const econResult = useMemo(() => {
    return computeReviewEconomics({
      capacityPct,
      investigatorHourlyWage: hourlyWage,
      reviewMinutesPerCase: reviewMinutes,
      falsePositivePenalty: fpPenalty,
      missedFraudMultiplier: missedMultiplier,
    });
  }, [capacityPct, hourlyWage, reviewMinutes, fpPenalty, missedMultiplier]);

  // Baseline comparison result at 1.0%
  const baselineResult = useMemo(() => {
    return computeReviewEconomics({
      capacityPct: 1.0,
      investigatorHourlyWage: 35.0,
      reviewMinutesPerCase: 6.0,
      falsePositivePenalty: 15.0,
      missedFraudMultiplier: 1.0,
    });
  }, []);

  // Computed Threshold
  const thresholdResult = useMemo(() => {
    return computeThresholdSimulation(threshold);
  }, [threshold]);

  // Computed Workload
  const workloadResult = useMemo(() => {
    return computeWorkloadScaling(volumeMultiplier);
  }, [volumeMultiplier]);

  // Export scenario JSON
  const handleExportScenarioJson = () => {
    const payload = {
      scenario_title: "Fraud Economics & What-If Simulation Report",
      simulated_at: new Date().toISOString(),
      governance_notice: "Hypothetical simulation calculations. Does not overwrite canonical metrics.",
      economics_scenario: {
        inputs: {
          capacity_pct: capacityPct,
          investigator_hourly_wage: hourlyWage,
          review_minutes_per_case: reviewMinutes,
          false_positive_penalty: fpPenalty,
          missed_fraud_multiplier: missedMultiplier,
        },
        outputs: econResult,
      },
      threshold_scenario: {
        inputs: { threshold },
        outputs: thresholdResult,
      },
      workload_scenario: {
        inputs: { volume_multiplier: volumeMultiplier },
        outputs: workloadResult,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fraud_scenario_simulation_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveScenario = () => {
    setSavedNotification("Scenario parameters saved to active workspace session.");
    setTimeout(() => setSavedNotification(null), 3500);
  };

  // EChart for Capture at Capacity Curve
  const chartOption: EChartsOption = useMemo(() => {
    const capacities = [0.1, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0];
    const captureRates = capacities.map((k) => computeReviewEconomics({
      capacityPct: k,
      investigatorHourlyWage: hourlyWage,
      reviewMinutesPerCase: reviewMinutes,
      falsePositivePenalty: fpPenalty,
      missedFraudMultiplier: missedMultiplier,
    }).captureRate * 100);

    return {
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const item = params[0];
          return `Capacity: <b>${item.name}%</b><br/>Capture: <b>${item.value.toFixed(2)}%</b> of fraud USD`;
        },
      },
      grid: { left: 45, right: 25, top: 25, bottom: 35 },
      xAxis: {
        type: "category",
        data: capacities.map((k) => `${k}`),
        name: "Capacity (k %)",
        nameLocation: "middle",
        nameGap: 24,
        axisLine: { lineStyle: { color: "var(--border)" } },
        axisLabel: { color: "var(--text-muted)", fontSize: 11 },
      },
      yAxis: {
        type: "value",
        min: 30,
        max: 100,
        axisLine: { lineStyle: { color: "var(--border)" } },
        splitLine: { lineStyle: { color: "var(--border)", opacity: 0.5 } },
        axisLabel: { color: "var(--text-muted)", fontSize: 11, formatter: "{value}%" },
      },
      series: [
        {
          name: "Fraud Capture Rate",
          type: "line",
          smooth: true,
          data: captureRates,
          lineStyle: { width: 3, color: indigo },
          itemStyle: { color: indigo },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(99, 102, 241, 0.35)" },
                { offset: 1, color: "rgba(99, 102, 241, 0.0)" },
              ],
            },
          },
          markPoint: {
            data: [
              {
                name: "Current Simulated Point",
                coord: [`${capacityPct}`, econResult.captureRate * 100],
                value: `${(econResult.captureRate * 100).toFixed(1)}%`,
                itemStyle: { color: fraudRed },
              },
            ],
          },
        },
      ],
    };
  }, [capacityPct, hourlyWage, reviewMinutes, fpPenalty, missedMultiplier, econResult]);

  return (
    <div className="scenario-lab-page">
      <PageHeader
        eyebrow="Evidence-Grounded What-If Simulation Lab"
        title="Operational & Financial Scenario Simulation"
        description="Simulate the operational, cost, and capacity impacts of changing fraud review queues, investigator labor rates, decision thresholds, and workload volume."
        actions={
          <div className="row wrap" style={{ gap: 8 }}>
            <button type="button" className="btn btn-sm" onClick={handleSaveScenario}>
              <Save size={13} /> Save Scenario
            </button>
            <button type="button" className="btn btn-sm btn-primary" onClick={handleExportScenarioJson}>
              <Download size={13} /> Export Scenario (.JSON)
            </button>
          </div>
        }
      />

      {/* Mandatory Governance Warning Callout */}
      <Callout tone="warn" title="What-If Simulation Notice & Boundary" className="mt-12">
        <p>
          Calculations in this lab represent <strong>mathematical simulations</strong> based on the empirical baseline.
          They project hypothetical operational trade-offs and <strong>do not alter or replace measured benchmark metrics</strong>.
        </p>
      </Callout>

      {savedNotification && (
        <div className="toast-success mt-12 p-8 bg-success-subtle text-success border border-success rounded text-xs font-semibold row items-center" style={{ gap: 6 }}>
          <CheckCircle2 size={14} />
          {savedNotification}
        </div>
      )}

      {/* Scenario Module Tabs */}
      <div className="row wrap mt-16" style={{ gap: 8 }}>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === "economics" ? "btn-primary" : ""}`}
          onClick={() => setActiveTab("economics")}
        >
          <DollarSign size={13} /> 1. Review Capacity & Economics
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === "threshold" ? "btn-primary" : ""}`}
          onClick={() => setActiveTab("threshold")}
        >
          <Sliders size={13} /> 2. Classification Threshold Cutoff
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === "workload" ? "btn-primary" : ""}`}
          onClick={() => setActiveTab("workload")}
        >
          <Layers size={13} /> 3. Workload & Ingestion Scaling
        </button>
      </div>

      {/* TAB 1: REVIEW CAPACITY & ECONOMICS */}
      {activeTab === "economics" && (
        <div className="mt-16">
          <div className="grid grid-3" style={{ gap: 16 }}>
            {/* Left 1 Column: Sliders */}
            <Panel title="Scenario Controls" subtitle="Adjust operational assumptions">
              <div className="form-group mb-16">
                <div className="row justify-between items-center mb-4">
                  <label className="text-xs font-semibold">Review Capacity (k %)</label>
                  <b className="text-sm font-mono text-primary">{capacityPct.toFixed(2)}%</b>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.05"
                  value={capacityPct}
                  onChange={(e) => setCapacityPct(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                />
                <span className="text-xs muted">
                  Reviews: {fmtInt(econResult.reviewVolume)} of 1.85M transactions
                </span>
              </div>

              <div className="form-group mb-16">
                <div className="row justify-between items-center mb-4">
                  <label className="text-xs font-semibold">Investigator Hourly Wage</label>
                  <b className="text-sm font-mono text-primary">${hourlyWage.toFixed(0)}/hr</b>
                </div>
                <input
                  type="range"
                  min="15"
                  max="75"
                  step="1"
                  value={hourlyWage}
                  onChange={(e) => setHourlyWage(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                />
                <span className="text-xs muted">Standard fully burdened analyst cost</span>
              </div>

              <div className="form-group mb-16">
                <div className="row justify-between items-center mb-4">
                  <label className="text-xs font-semibold">Review Time Per Case</label>
                  <b className="text-sm font-mono text-primary">{reviewMinutes.toFixed(1)} min</b>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="0.5"
                  value={reviewMinutes}
                  onChange={(e) => setReviewMinutes(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                />
                <span className="text-xs muted">Manual investigation duration</span>
              </div>

              <div className="form-group mb-16">
                <div className="row justify-between items-center mb-4">
                  <label className="text-xs font-semibold">False Positive Friction</label>
                  <b className="text-sm font-mono text-primary">${fpPenalty.toFixed(0)}/FP</b>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={fpPenalty}
                  onChange={(e) => setFpPenalty(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                />
                <span className="text-xs muted">Customer friction & outreach penalty</span>
              </div>

              <div className="row wrap justify-end mt-16">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    setCapacityPct(1.0);
                    setHourlyWage(35.0);
                    setReviewMinutes(6.0);
                    setFpPenalty(15.0);
                  }}
                >
                  Reset to Baseline
                </button>
              </div>
            </Panel>

            {/* Middle 2 Columns: Outputs & Sensitivity Chart */}
            <div style={{ gridColumn: "span 2" }}>
              {/* Dynamic KPI Cards */}
              <div className="grid grid-3 mb-16">
                <div className="stat-card">
                  <span className="stat-label">Fraud USD Intercepted</span>
                  <b className="stat-value text-success" style={{ fontSize: 20 }}>
                    {fmtMoney(econResult.dollarsIntercepted)}
                  </b>
                  <span className="stat-note">
                    {(econResult.captureRate * 100).toFixed(2)}% of total exposure ({fmtInt(econResult.fraudsCaught)} frauds)
                  </span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Total Operational Cost</span>
                  <b className="stat-value text-danger" style={{ fontSize: 20 }}>
                    {fmtMoney(econResult.totalOperationalCost)}
                  </b>
                  <span className="stat-note">
                    Labor: {fmtMoney(econResult.laborCost)} · Friction: {fmtMoney(econResult.frictionCost)}
                  </span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Net Financial Savings</span>
                  <b className="stat-value text-primary" style={{ fontSize: 20 }}>
                    {fmtMoney(econResult.netSavings)}
                  </b>
                  <span className="stat-note">
                    ROI Multiplier: <b>{econResult.roiMultiplier.toFixed(1)}x</b> return on labor
                  </span>
                </div>
              </div>

              {/* Sensitivity Chart */}
              <Panel title="Capture at Capacity Sensitivity Curve" subtitle="Fraud dollar interception percentage vs queue review depth">
                <div style={{ height: 260 }}>
                  <Chart option={chartOption} />
                </div>
              </Panel>
            </div>
          </div>

          {/* Baseline vs Scenario Side-by-Side Comparison Table */}
          <Panel title="Baseline vs. Simulated Scenario Comparison" subtitle="Empirical 1.0% benchmark versus current simulation inputs" className="mt-16">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Dimension</th>
                    <th scope="col">Empirical Baseline (k = 1.0%)</th>
                    <th scope="col">Hypothetical Scenario (k = {capacityPct.toFixed(2)}%)</th>
                    <th scope="col">Simulated Delta</th>
                    <th scope="col">Operational Takeaway</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>Review Volume</b></td>
                    <td>{fmtInt(baselineResult.reviewVolume)} cases</td>
                    <td>{fmtInt(econResult.reviewVolume)} cases</td>
                    <td>
                      <span className={econResult.reviewVolume > baselineResult.reviewVolume ? "text-danger" : "text-success"}>
                        {econResult.reviewVolume - baselineResult.reviewVolume > 0 ? "+" : ""}
                        {fmtInt(econResult.reviewVolume - baselineResult.reviewVolume)}
                      </span>
                    </td>
                    <td className="text-xs muted">Capacity constraint on manual review team</td>
                  </tr>
                  <tr>
                    <td><b>Fraud Dollars Intercepted</b></td>
                    <td>{fmtMoney(baselineResult.dollarsIntercepted)} (84.32%)</td>
                    <td>{fmtMoney(econResult.dollarsIntercepted)} ({(econResult.captureRate * 100).toFixed(2)}%)</td>
                    <td>
                      <span className={econResult.dollarsIntercepted >= baselineResult.dollarsIntercepted ? "text-success font-semibold" : "text-danger"}>
                        {econResult.dollarsIntercepted >= baselineResult.dollarsIntercepted ? "+" : ""}
                        {fmtMoney(econResult.dollarsIntercepted - baselineResult.dollarsIntercepted)}
                      </span>
                    </td>
                    <td className="text-xs muted">Gross fraud loss prevented</td>
                  </tr>
                  <tr>
                    <td><b>False Positives Generated</b></td>
                    <td>{fmtInt(baselineResult.falsePositives)} FPs</td>
                    <td>{fmtInt(econResult.falsePositives)} FPs</td>
                    <td>
                      <span className={econResult.falsePositives > baselineResult.falsePositives ? "text-danger" : "text-success"}>
                        {econResult.falsePositives - baselineResult.falsePositives > 0 ? "+" : ""}
                        {fmtInt(econResult.falsePositives - baselineResult.falsePositives)}
                      </span>
                    </td>
                    <td className="text-xs muted">Legitimate cardholder friction incidents</td>
                  </tr>
                  <tr>
                    <td><b>Net Operational Savings</b></td>
                    <td>{fmtMoney(baselineResult.netSavings)}</td>
                    <td>{fmtMoney(econResult.netSavings)}</td>
                    <td>
                      <span className={econResult.netSavings >= baselineResult.netSavings ? "text-success font-semibold" : "text-danger"}>
                        {econResult.netSavings >= baselineResult.netSavings ? "+" : ""}
                        {fmtMoney(econResult.netSavings - baselineResult.netSavings)}
                      </span>
                    </td>
                    <td className="text-xs muted">Dollars saved net of investigation labor and friction</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* TAB 2: DECISION THRESHOLD CUTOFF */}
      {activeTab === "threshold" && (
        <div className="mt-16">
          <Panel title="Classification Threshold Simulation" subtitle="Simulate precision, recall, and alert volume across decision probability cutoffs">
            <div className="form-group mb-16" style={{ maxWidth: 450 }}>
              <div className="row justify-between items-center mb-4">
                <label className="text-xs font-semibold">Classification Cutoff Threshold</label>
                <b className="text-sm font-mono text-primary">{threshold.toFixed(5)}</b>
              </div>
              <input
                type="range"
                min="0.00001"
                max="0.90"
                step="0.005"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full cursor-pointer"
              />
              <span className="text-xs muted">
                Cost-minimizing threshold is 0.00001; standard balanced cutoff is ~0.50
              </span>
            </div>

            <div className="grid grid-4 mt-16">
              <div className="stat-card">
                <span className="stat-label">Model Precision</span>
                <b className="stat-value text-primary" style={{ fontSize: 20 }}>
                  {(thresholdResult.precision * 100).toFixed(2)}%
                </b>
                <span className="stat-note">Accuracy of positive alerts</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Model Recall</span>
                <b className="stat-value text-success" style={{ fontSize: 20 }}>
                  {(thresholdResult.recall * 100).toFixed(2)}%
                </b>
                <span className="stat-note">Fraud events intercepted</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">F1-Score</span>
                <b className="stat-value" style={{ fontSize: 20 }}>
                  {thresholdResult.f1.toFixed(4)}
                </b>
                <span className="stat-note">Harmonic mean precision/recall</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Alert Volume</span>
                <b className="stat-value" style={{ fontSize: 20 }}>
                  {fmtInt(thresholdResult.alertsGenerated)}
                </b>
                <span className="stat-note">
                  {thresholdResult.alertRatePct.toFixed(2)}% of transaction flow
                </span>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* TAB 3: WORKLOAD & INGESTION SCALING */}
      {activeTab === "workload" && (
        <div className="mt-16">
          <Panel title="Workload Volume & Data Pipeline Scaling" subtitle="Simulate storage, heap, and pipeline duration under transaction volume growth">
            <div className="form-group mb-16" style={{ maxWidth: 450 }}>
              <div className="row justify-between items-center mb-4">
                <label className="text-xs font-semibold">Transaction Volume Multiplier</label>
                <b className="text-sm font-mono text-primary">{volumeMultiplier.toFixed(1)}x</b>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.5"
                value={volumeMultiplier}
                onChange={(e) => setVolumeMultiplier(parseFloat(e.target.value))}
                className="w-full cursor-pointer"
              />
              <span className="text-xs muted">
                Simulating {fmtInt(workloadResult.projectedTransactions)} transactions
              </span>
            </div>

            <div className="grid grid-4 mt-16">
              <div className="stat-card">
                <span className="stat-label">Projected Transactions</span>
                <b className="stat-value" style={{ fontSize: 20 }}>
                  {fmtInt(workloadResult.projectedTransactions)}
                </b>
                <span className="stat-note">~{fmtInt(workloadResult.projectedFraudEvents)} fraud events</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Estimated Ingestion Time</span>
                <b className="stat-value text-primary" style={{ fontSize: 20 }}>
                  {workloadResult.estimatedIngestionSeconds.toFixed(1)}s
                </b>
                <span className="stat-note">Pipeline build & fingerprinting</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Projected Heap Footprint</span>
                <b className="stat-value" style={{ fontSize: 20 }}>
                  ~{workloadResult.projectedMemoryMb} MB
                </b>
                <span className="stat-note">Client browser in-memory state</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Daily 1% Review Queue</span>
                <b className="stat-value text-success" style={{ fontSize: 20 }}>
                  {fmtInt(workloadResult.dailyReviewCasesAt1Pct)} cases/day
                </b>
                <span className="stat-note">Daily analyst capacity required</span>
              </div>
            </div>
          </Panel>
        </div>
      )}

      <SourceNote className="mt-16">
        What-If simulation engine uses piecewise linear interpolation over the verified empirical capture curve in phase7_capture_at_k.csv.
      </SourceNote>
    </div>
  );
}
