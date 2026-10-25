import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { EChartsOption } from "echarts";
import { ArrowUpRight, CalendarClock, Download, Scissors } from "lucide-react";
import { useAnalysis, useManifest } from "../context/AppContext";
import { Chart } from "../components/Chart";
import { DataTable, type TableColumn } from "../components/DataTable";
import { FigureStrip } from "../components/Figures";
import { Callout, PageHeader, Panel, SourceNote, Stat, StatRow } from "../components/ui";
import { downloadCsv } from "../lib/csv";
import { fmtFloat, fmtInt, fmtPct } from "../lib/format";
import { fraudRed, indigo, muted } from "../lib/chartTheme";

export default function Temporal() {
  const manifest = useManifest();
  const analysis = useAnalysis();
  const weekly = analysis.weekly_series;
  const hazard = analysis.hazard;
  const breakFinding = manifest.findings.find((finding) => finding.finding.includes("Structural breaks"));

  const trainWeeks = weekly.filter((row) => row.date <= "2020-06-14");
  const testWeeks = weekly.filter((row) => row.date > "2020-06-21" && row.date < "2021-01-03");
  const trainMean = trainWeeks.reduce((sum, row) => sum + row.rate, 0) / trainWeeks.length;
  const testMean = testWeeks.reduce((sum, row) => sum + row.rate, 0) / testWeeks.length;
  const lastWeek = weekly[weekly.length - 1];

  const weeklyOption = useMemo<EChartsOption>(() => {
    const boundaryIndex = Math.max(0, weekly.findIndex((row) => row.date > "2020-06-21"));
    const boundaryPct = (boundaryIndex / Math.max(1, weekly.length - 1)) * 100;
    const rolling = weekly.map((row, index) => {
      const start = Math.max(0, index - 6);
      const slice = weekly.slice(start, index + 1);
      return slice.reduce((sum, item) => sum + item.rate, 0) / slice.length;
    });
    return {
      grid: { left: 12, right: 10, top: 36, bottom: 18, containLabel: true },
      legend: { top: 0, left: 0, icon: "roundRect", itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 10.5, color: "#4e5563" } },
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const index = params[0].dataIndex;
          const row = weekly[index];
          return `<b>Week of ${row.date}</b><br/>Fraud ${fmtInt(row.sum)} / ${fmtInt(row.size)}<br/>Rate ${fmtPct(row.rate, 3)}<br/>7-week mean ${fmtPct(rolling[index], 3)}`;
        },
      },
      xAxis: {
        type: "category",
        data: weekly.map((row) => row.date),
        axisLabel: { color: muted, fontSize: 10.5, interval: 12, formatter: (value: string) => value.slice(0, 7) },
        axisLine: { lineStyle: { color: "#d8d0c3" } },
        axisTick: { show: false },
      },
      yAxis: [
        { type: "value", max: 0.022, axisLabel: { formatter: (value: number) => `${(value * 100).toFixed(1)}%`, color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
        { type: "value", axisLabel: { formatter: (value: number) => `${Math.round(value / 1000)}k`, color: "#b3aa9b", fontSize: 10.5 }, splitLine: { show: false } },
      ],
      series: [
        { name: "Transactions", type: "bar", yAxisIndex: 1, data: weekly.map((row) => row.size), itemStyle: { color: "rgba(42,58,85,.13)" }, barWidth: "55%" },
        { name: "Weekly fraud rate", type: "line", data: weekly.map((row) => row.rate), symbol: "none", lineStyle: { width: 1.2, color: "rgba(203,66,87,.55)" } },
        { name: "7-week mean", type: "line", data: rolling, smooth: true, symbol: "none", lineStyle: { width: 2.2, color: indigo }, areaStyle: { color: "rgba(79,70,229,.05)" } },
      ],
      markLine: undefined,
      graphic: [
        { type: "line", left: `${boundaryPct}%`, top: 45, bottom: 30, style: { stroke: "#cb4257", lineWidth: 1, lineDash: [3, 3] } },
        { type: "text", left: `${boundaryPct + 0.7}%`, top: 38, style: { text: "test begins", fontSize: 10.5, fill: "#cb4257", fontFamily: "Manrope Variable" } },
      ],
    };
  }, [weekly]);

  const hazardOption = useMemo<EChartsOption>(() => ({
    grid: { left: 12, right: 14, top: 28, bottom: 10, containLabel: true },
    legend: { top: 0, left: 0, icon: "roundRect", itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 10.5, color: "#4e5563" } },
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const index = params[0].dataIndex;
        const row = hazard[index];
        return `<b>Month ${row.month}</b><br/>Hazard ${fmtPct(row.hazard, 1)}<br/>95% CI ${fmtPct(row.lo, 1)} – ${fmtPct(row.hi, 1)}<br/>At risk ${fmtInt(row.n_risk)} · events ${fmtInt(row.events)}`;
      },
    },
    xAxis: { type: "category", data: hazard.map((row) => row.month), name: "months since first transaction", nameLocation: "middle", nameGap: 24, nameTextStyle: { fontSize: 10.5, color: muted }, axisLabel: { color: muted, fontSize: 10.5 }, axisLine: { lineStyle: { color: "#d8d0c3" } }, axisTick: { show: false } },
    yAxis: { type: "value", max: 0.7, axisLabel: { formatter: (value: number) => `${Math.round(value * 100)}%`, color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
    series: [
      { name: "Hazard", type: "line", data: hazard.map((row) => row.hazard), symbolSize: 4, lineStyle: { width: 2.2, color: "#0f766e" }, itemStyle: { color: "#0f766e" }, areaStyle: { color: "rgba(15,118,110,.07)" } },
      { name: "95% CI low", type: "line", data: hazard.map((row) => row.lo), symbol: "none", lineStyle: { width: 1, type: "dashed", color: "rgba(15,118,110,.45)" } },
      { name: "95% CI high", type: "line", data: hazard.map((row) => row.hi), symbol: "none", lineStyle: { width: 1, type: "dashed", color: "rgba(15,118,110,.45)" } },
    ],
  }), [hazard]);

  const hazardColumns: TableColumn[] = [
    { key: "month", label: "Month", align: "right" },
    { key: "n_risk", label: "At risk", align: "right", render: (row) => fmtInt(row.n_risk) },
    { key: "events", label: "First fraud", align: "right", render: (row) => fmtInt(row.events) },
    { key: "hazard", label: "Hazard", align: "right", render: (row) => fmtPct(row.hazard, 1) },
    { key: "lo", label: "95% CI", align: "right", render: (row) => `${fmtPct(row.lo, 1)}–${fmtPct(row.hi, 1)}` },
  ];

  const figures = useMemo(
    () => ["phase3_weekly_rate", "phase3_daily_rolling", "phase3_stl", "phase3_changepoint"].map((id) => manifest.figures.find((figure) => figure.id === id)).filter(Boolean) as typeof manifest.figures,
    [manifest.figures],
  );

  return (
    <>
      <PageHeader
        eyebrow="P3 · Temporal structure"
        title={<>Drift is real. The <em>boundary</em> is the experiment.</>}
        description="Weekly fraud rates oscillate around 0.60% in train and 0.42% in test. The split is a hard 48-second cut, not a random holdout; the boundary week and the final zero-fraud edge week are shown but excluded from full-week means."
        actions={
          <>
            <Link className="btn btn-sm" to="/artifacts?tab=figures&q=phase3"><ArrowUpRight />P3 figures</Link>
            <button type="button" className="btn btn-sm" onClick={() => downloadCsv("weekly_fraud_rate.csv", weekly)}><Download />Weekly series</button>
          </>
        }
        meta={
          <div className="row wrap" style={{ gap: 7 }}>
            <span className="badge badge-phase">Phase P3</span>
            <span className="badge badge-neutral">12 figures · 1 table</span>
            <span className="badge badge-neutral">105 weekly points</span>
            <span className="badge badge-weak">1 weak finding · PELT</span>
          </div>
        }
      />

      <div className="grid grid-12">
        <Panel
          className="span-8"
          title="Weekly fraud rate and volume"
          subtitle="The 7-week mean falls after the boundary. Volume rises in late 2020 while the fraud rate stays lower."
          action={<span className="badge badge-neutral"><CalendarClock size={10} />2019-01 → 2021-01</span>}
        >
          <Chart option={weeklyOption} height={355} ariaLabel="Weekly fraud rate and transaction volume time series" />
          <SourceNote>From <code>phase3_weekly_rate_table.csv</code>. The dashed guide marks the first test week; the last point is a partial week with zero fraud.</SourceNote>
        </Panel>

        <div className="span-4 stack">
          <Panel title="What changes at the cut" subtitle="Unweighted means over full weeks inside each split.">
            <StatRow label="Train weekly mean" value={fmtPct(trainMean, 3)} />
            <StatRow label="Test weekly mean" value={fmtPct(testMean, 3)} />
            <StatRow label="Absolute change" value={`${((testMean - trainMean) * 100).toFixed(3)} pp`} />
            <StatRow label="Split boundary" value="2020-06-21 12:13:37" />
            <StatRow label="Test begins" value="12:14:25 (+48 s)" />
            <StatRow label="Full weeks in train / test" value={`${trainWeeks.length} / ${testWeeks.length}`} />
            <SourceNote>Weekly rates from the source table. The boundary week and the trailing zero-fraud week are excluded from means; both remain visible in the chart.</SourceNote>
          </Panel>
          <Callout tone="warn" title="Trailing zero-fraud week">
            <p>
              Week of {lastWeek.date} holds {fmtInt(lastWeek.size)} transactions and <b>0 fraud</b>. This is a partial edge week, not evidence of a
              genuine fraud-free period; exclude it from trend and mean calculations.
            </p>
          </Callout>
        </div>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-7" title="Discrete-time hazard of first fraud" subtitle="Hazard rises from 13.7% in month 0 to 48.9% by month 23, but the risk set shrinks from 999 cards to 45." action={<span className="badge badge-neutral">24 months</span>}>
          <Chart option={hazardOption} height={330} ariaLabel="Line chart of monthly hazard of first fraud with confidence interval" />
          <div className="stat-grid mt-12">
            <Stat value={fmtPct(hazard[0].hazard, 1)} label="Month 0 hazard" />
            <Stat value={fmtPct(hazard[hazard.length - 1].hazard, 1)} label="Month 23 hazard" />
            <Stat value={fmtInt(hazard[0].n_risk)} label="Cards at risk · start" />
            <Stat value={fmtInt(hazard[hazard.length - 1].n_risk)} label="Cards at risk · end" />
          </div>
          <SourceNote>From <code>phase7_hazard_table.csv</code>. The late-month estimates are unstable because the risk set is small; intervals widen accordingly.</SourceNote>
        </Panel>

        <Panel className="span-5" title="Hazard table" subtitle="Month-by-month first-fraud events and Wilson intervals." action={<span className="badge badge-neutral">24 rows</span>}>
          <DataTable rows={hazard} columns={hazardColumns} pageSize={8} exportName="hazard_table.csv" searchable={false} hideToolbar={true} />
          <SourceNote>Only cards that have not yet experienced fraud remain at risk in later months.</SourceNote>
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-5" title="The structural-break claim" subtitle="PELT identifies two consensus breaks; holiday proximity is zero." action={<span className="badge badge-weak">Weak</span>}>
          <div className="stack" style={{ gap: 10 }}>
            <Callout tone="warn" title="Generator campaigns, not the calendar">
              <p>{breakFinding?.finding ?? "Two consensus breaks are stable across PELT penalties, but no holiday coincidence was found."}</p>
              <p>The ledger grades this evidence weak. The breaks are consistent with simulator campaign blocks; do not read them as seasonal business events.</p>
            </Callout>
            <StatRow label="Findings for RQ3" value={manifest.rqs.find((rq) => rq.id === "RQ3")?.findings} />
            <StatRow label="Strong temporal findings" value={manifest.rqs.find((rq) => rq.id === "RQ3")?.strong} />
            <StatRow label="Weak temporal findings" value={manifest.rqs.find((rq) => rq.id === "RQ3")?.weak} />
          </div>
        </Panel>
        <Panel className="span-7" title="Temporal evidence" subtitle="Weekly rate, rolling daily rate, STL decomposition and change-point diagnostics." action={<Link className="btn btn-sm" to="/artifacts?tab=figures&q=phase3">Open gallery <ArrowUpRight /></Link>}>
          <FigureStrip figures={figures} />
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-12" title="How to read the time series" subtitle="Three cautions that travel with every temporal claim.">
          <div className="grid grid-3" style={{ gap: 12 }}>
            <Callout tone="danger" title="No causal calendar story">
              <p>Holiday proximity is zero. COVID-window differences are confounded with the train/test split and with the generator's campaign timetable.</p>
            </Callout>
            <Callout tone="warn" title="Weekly bins are not equal exposure">
              <p>Volume varies from roughly 9,700 to 32,000 transactions per week. Rate comparisons are valid, but event counts are not directly comparable.</p>
            </Callout>
            <Callout tone="info" title="The last week is an edge case">
              <p>The 2021-01-03 bin contains 18,921 transactions and zero fraud. It is excluded from the substantive means and shown only for completeness.</p>
            </Callout>
          </div>
        </Panel>
      </div>
    </>
  );
}
