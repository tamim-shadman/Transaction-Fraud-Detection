import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { EChartsOption } from "echarts";
import { ArrowUpRight, Download, Moon, Sun, TrendingUp } from "lucide-react";
import { useAnalysis, useManifest } from "../context/AppContext";
import type { Row } from "../types";
import { Chart } from "../components/Chart";
import { DataTable, type TableColumn } from "../components/DataTable";
import { FigureStrip } from "../components/Figures";
import { Callout, PageHeader, Panel, SourceNote, Stat, StatRow } from "../components/ui";
import { downloadCsv } from "../lib/csv";
import { fmtFloat, fmtInt, fmtMoney, fmtPct } from "../lib/format";
import { fraudRed, indigo, muted } from "../lib/chartTheme";

export default function Distributions() {
  const manifest = useManifest();
  const analysis = useAnalysis();
  const quantiles = analysis.quantiles;
  const categories = useMemo<Row[]>(() => {
    const money = Object.fromEntries(analysis.money.map((row) => [row.category, row])) as Record<string, Row>;
    return analysis.category_table
      .map((row): Row => ({ ...row, fraud_usd: money[row.category]?.fraud_usd ?? 0, usd_per_fraud: money[row.category]?.usd_per_fraud ?? 0 }))
      .sort((a, b) => b.rate - a.rate);
  }, [analysis.category_table, analysis.money]);
  const covid = analysis.covid;
  const effect = analysis.effect_sizes.find((row) => row.feature === "amt")!;
  const totalFraudUsd = analysis.money.reduce((sum, row) => sum + (row.fraud_usd ?? 0), 0);
  const night = analysis.combos.find((row) => row.segment === "night alone")!;
  const total = manifest.counts.transactions;
  const totalFraud = manifest.counts.fraud;
  const dayRate = (totalFraud - night.n * night.fraud_rate) / (total - night.n);
  const p50 = quantiles.find((row) => row.quantile === "P50")!;
  const topCategory = categories[0];

  const amountOption = useMemo<EChartsOption>(() => ({
    grid: { left: 12, right: 16, top: 34, bottom: 14, containLabel: true },
    legend: { top: 0, left: 0, icon: "roundRect", itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 10.5, color: "#4e5563" } },
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const index = params[0].dataIndex;
        const row = quantiles[index];
        return `<b>${row.quantile}</b><br/>All ${fmtMoney(row.amt)}<br/>Fraud ${fmtMoney(row.amt_fraud)}<br/>Genuine ${fmtMoney(row.amt_nonfraud)}`;
      },
    },
    xAxis: { type: "category", data: quantiles.map((row) => row.quantile), axisLine: { lineStyle: { color: "#d8d0c3" } }, axisTick: { show: false }, axisLabel: { color: muted, fontSize: 10.5 } },
    yAxis: { type: "log", min: 1, max: 50000, axisLabel: { formatter: (value: number) => `$${value >= 1000 ? `${value / 1000}k` : value}`, color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
    series: [
      { name: "Fraud", type: "line", smooth: true, data: quantiles.map((row) => row.amt_fraud), symbolSize: 6, lineStyle: { width: 2.2, color: fraudRed }, itemStyle: { color: fraudRed } },
      { name: "Genuine", type: "line", smooth: true, data: quantiles.map((row) => row.amt_nonfraud), symbolSize: 5, lineStyle: { width: 2, color: "#2a3a55" }, itemStyle: { color: "#2a3a55" } },
    ],
  }), [quantiles]);

  const categoryOption = useMemo<EChartsOption>(() => {
    const rows = [...categories].sort((a, b) => a.rate - b.rate);
    return {
      grid: { left: 10, right: 38, top: 20, bottom: 10, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const row = rows[params[0].dataIndex];
          return `<b>${row.category}</b><br/>Rate ${fmtPct(row.rate, 2)}<br/>${fmtInt(row.k)} fraud / ${fmtInt(row.n)}`;
        },
      },
      xAxis: { type: "value", max: 0.018, axisLabel: { formatter: (value: number) => `${(value * 100).toFixed(1)}%`, color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
      yAxis: { type: "category", data: rows.map((row) => row.category.replace("_", " ")), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: "#4e5563", fontSize: 10.5 } },
      series: [
        {
          type: "bar",
          data: rows.map((row) => ({ value: row.rate, itemStyle: { color: row.rate > manifest.counts.fraudRate ? fraudRed : "#a9a2f6", borderRadius: [0, 3, 3, 0] } })),
          barWidth: 12,
          label: { show: true, position: "right", formatter: (params: any) => `${(params.value * 100).toFixed(2)}%`, color: muted, fontSize: 10.5 },
          markLine: {
            silent: true,
            symbol: "none",
            data: [{ xAxis: manifest.counts.fraudRate }],
            lineStyle: { color: "var(--ink-700)", type: "dashed", width: 1 },
            label: { formatter: "Baseline 0.52%", fontSize: 10.5, color: "#7c7a73" },
          },
        },
      ],
    };
  }, [categories, manifest.counts.fraudRate]);

  const moneyOption = useMemo<EChartsOption>(() => {
    const rows = [...analysis.money].filter((row) => row.fraud_usd > 0).sort((a, b) => b.fraud_usd - a.fraud_usd).slice(0, 10);
    return {
      grid: { left: 10, right: 14, top: 12, bottom: 10, containLabel: true },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: (params: any) => `${params[0].name}<br/><b>${fmtMoney(params[0].value)}</b> in fraud` },
      xAxis: { type: "category", data: rows.map((row) => row.category), axisLabel: { rotate: 32, color: muted, fontSize: 10.5 }, axisLine: { lineStyle: { color: "#d8d0c3" } }, axisTick: { show: false } },
      yAxis: { type: "value", axisLabel: { formatter: (value: number) => `$${(value / 1e6).toFixed(1)}m`, color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
      series: [
        {
          type: "bar",
          data: rows.map((row, index) => ({ value: row.fraud_usd, itemStyle: { color: index < 3 ? indigo : "#b8b1ff", borderRadius: [3, 3, 0, 0] } })),
          barWidth: 18,
          label: { show: true, position: "top", formatter: (params: any) => `$${(params.value / 1e6).toFixed(2)}m`, color: muted, fontSize: 10.5, rotate: 0 },
        },
      ],
    };
  }, [analysis.money]);

  const covidOption = useMemo<EChartsOption>(() => ({
    grid: { left: 10, right: 10, top: 20, bottom: 8, containLabel: true },
    tooltip: { trigger: "axis", formatter: (params: any) => `${params[0].name}<br/>Rate <b>${fmtPct(params[0].value, 2)}</b>` },
    xAxis: { type: "category", data: covid.map((row) => row.window.replace(" (COVID)", "\n(COVID)")), axisLabel: { fontSize: 10.5, color: muted, lineHeight: 12 }, axisLine: { lineStyle: { color: "#d8d0c3" } }, axisTick: { show: false } },
    yAxis: { type: "value", max: 0.008, axisLabel: { formatter: (value: number) => `${(value * 100).toFixed(1)}%`, fontSize: 10.5, color: muted }, splitLine: { lineStyle: { color: "#efeae1" } } },
    series: [{ type: "bar", data: covid.map((row) => row.fraud_rate), barWidth: 42, itemStyle: { color: "#7c3aed", borderRadius: [4, 4, 0, 0] }, label: { show: true, position: "top", formatter: (params: any) => `${(params.value * 100).toFixed(2)}%`, fontSize: 10.5, color: "#4e5563" } }],
  }), [covid]);

  const tableColumns: TableColumn[] = [
    { key: "category", label: "Category", render: (row) => <b style={{ color: "var(--text)" }}>{row.category}</b> },
    { key: "n", label: "Transactions", align: "right", render: (row) => fmtInt(row.n) },
    { key: "k", label: "Fraud", align: "right", render: (row) => fmtInt(row.k) },
    { key: "rate", label: "Fraud rate", align: "right", render: (row) => <span style={{ color: row.rate > manifest.counts.fraudRate ? fraudRed : "inherit", fontWeight: row.rate > manifest.counts.fraudRate ? 650 : 400 }}>{fmtPct(row.rate, 3)}</span> },
    { key: "fraud_usd", label: "Fraud USD", align: "right", render: (row) => fmtMoney(row.fraud_usd, true) },
    { key: "usd_per_fraud", label: "USD / fraud", align: "right", render: (row) => fmtMoney(row.usd_per_fraud) },
  ];

  const figures = useMemo(
    () => ["phase1_amt_overlay", "phase1_amt_ecdf", "phase1_category", "phase1_amt_hist"].map((id) => manifest.figures.find((figure) => figure.id === id)).filter(Boolean) as typeof manifest.figures,
    [manifest.figures],
  );

  return (
    <>
      <PageHeader
        eyebrow="P1 · Univariate structure"
        title={<>Fraud amounts are larger — and <em>capped.</em></>}
        description="Fraud transactions cluster at a much higher median amount, but their upper tail stops far below genuine transactions. Category rates are equally uneven: three online/point-of-sale categories carry 1.3–1.6% fraud, roughly three times the 0.52% baseline."
        actions={
          <>
            <Link className="btn btn-sm" to="/artifacts?tab=figures&q=phase1"><ArrowUpRight />P1 figures</Link>
            <button type="button" className="btn btn-sm" onClick={() => downloadCsv("category_amounts.csv", categories)}><Download />Category table</button>
          </>
        }
        meta={
          <div className="row wrap" style={{ gap: 7 }}>
            <span className="badge badge-phase">Phase P1</span>
            <span className="badge badge-neutral">24 figures · 4 tables</span>
            <span className="badge badge-strong">KS D {fmtFloat(effect.ks_D, 3)}</span>
            <span className="badge badge-strong">Cliff's δ {fmtFloat(effect.cliffs_delta, 3)}</span>
          </div>
        }
      />

      <div className="grid grid-12">
        <Panel className="span-7" title="Amount quantiles, log scale" subtitle="Fraud pulls ahead from P25 onward, then flattens between $1,084 and $1,376." action={<span className="badge badge-neutral">9 quantiles</span>}>
          <Chart option={amountOption} height={320} ariaLabel="Line chart of amount quantiles for fraud and genuine transactions" />
          <div className="stat-grid mt-12">
            <Stat value={fmtMoney(p50.amt_fraud)} label="Fraud median" />
            <Stat value={fmtMoney(p50.amt_nonfraud)} label="Genuine median" />
            <Stat value={`${(p50.amt_fraud / p50.amt_nonfraud).toFixed(1)}×`} label="Median multiple" />
            <Stat value={fmtMoney(quantiles[quantiles.length - 1].amt_fraud)} label="Fraud maximum" />
          </div>
          <SourceNote>From <code>phase1_amt_quantiles.csv</code>. The 28,949 maximum belongs to a genuine transaction.</SourceNote>
        </Panel>

        <div className="span-5 stack">
          <Panel title="Separation is strong but not clean" subtitle="The distributions differ substantially, yet overlap remains.">
            <StatRow label="Mann–Whitney p" value="< 10⁻³⁰⁰" />
            <StatRow label="KS statistic" value={fmtFloat(effect.ks_D, 4)} />
            <StatRow label="Cliff's delta" value={`${fmtFloat(effect.cliffs_delta, 3)} [${fmtFloat(effect.cliffs_lo, 3)}, ${fmtFloat(effect.cliffs_hi, 3)}]`} />
            <StatRow label="Cohen's d" value={fmtFloat(effect.cohens_d, 2)} />
            <StatRow label="Fraud P99.9" value={fmtMoney(quantiles.find((row) => row.quantile === "P99.9")!.amt_fraud)} />
            <StatRow label="Genuine P99.9" value={fmtMoney(quantiles.find((row) => row.quantile === "P99.9")!.amt_nonfraud)} />
          </Panel>
          <Callout tone="info" title="A capped fraud tail is a generator behavior">
            <p>
              Fraud amounts sit in a narrow high-$200s to ~$1,300 band, while genuine amounts extend to $28,949. This is consistent with Sparkov's
              fraud-amount draw, not a general fraud law. Treat the median gap as a useful feature, not a universal prior.
            </p>
          </Callout>
        </div>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-7" title="Category fraud rate" subtitle="Three categories sit clearly above the 0.521% baseline; health, home and food are lowest." action={<span className="badge badge-neutral">14 categories</span>}>
          <Chart option={categoryOption} height={365} ariaLabel="Bar chart of fraud rate by merchant category" />
          <SourceNote>From <code>phase1_category_table.csv</code>; rates are unshrunk and uncorrected here. Uncertainty intervals appear on the statistics page.</SourceNote>
        </Panel>
        <div className="span-5 stack">
          <Panel title="Fraud dollars by category" subtitle="Dollar exposure is more concentrated than event counts.">
            <Chart option={moneyOption} height={260} ariaLabel="Bar chart of fraud dollars by category" />
            <div className="divider" />
            <StatRow label="Total fraud value" value={fmtMoney(totalFraudUsd, true)} />
            <StatRow label="Top category share" value={fmtPct(analysis.money[0].fraud_usd / totalFraudUsd, 1)} />
          </Panel>
          <Callout tone="warn" title="Counts and dollars tell different stories">
            <p>
              <b>shopping_net</b> leads on both. But <b>grocery_pos</b> has the third-highest event count and only the fourth-highest dollar value,
              because its per-fraud amount is {fmtMoney(analysis.money.find((row) => row.category === "grocery_pos")!.usd_per_fraud)} versus{" "}
              {fmtMoney(analysis.money.find((row) => row.category === "shopping_net")!.usd_per_fraud)} for shopping_net.
            </p>
          </Callout>
        </div>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-4" title="COVID-window drift" subtitle="Rates fall across the 2020 windows — but time and split are confounded.">
          <Chart option={covidOption} height={205} ariaLabel="Bar chart of fraud rate across three 2020 windows" />
          <SourceNote>From <code>phase1_covid_window.csv</code>. Jul–Dec includes the lower-rate test period.</SourceNote>
        </Panel>

        <Panel className="span-4" title="Night vs day" subtitle="Night fraud concentrates far beyond its transaction share.">
          <div className="row" style={{ gap: 10, marginBottom: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--accent-soft)", color: indigo, display: "grid", placeItems: "center" }}><Moon size={17} /></div>
            <div>
              <div className="serif" style={{ fontSize: 27, lineHeight: 1 }}>{fmtPct(night.fraud_rate, 2)}</div>
              <div className="tiny muted">night (00:00–05:59) · {fmtInt(night.n)} transactions</div>
            </div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--amber-soft)", color: "#bd761b", display: "grid", placeItems: "center" }}><Sun size={17} /></div>
            <div>
              <div className="serif" style={{ fontSize: 27, lineHeight: 1 }}>{fmtPct(dayRate, 2)}</div>
              <div className="tiny muted">day · derived from the night complement</div>
            </div>
          </div>
          <div className="divider" />
          <StatRow label="Night lift vs baseline" value={`${(night.fraud_rate / manifest.counts.fraudRate).toFixed(2)}×`} />
          <StatRow label="Night vs day" value={`${(night.fraud_rate / dayRate).toFixed(2)}×`} />
          <SourceNote>Night row from <code>phase7_high_risk_combo.csv</code>; day rate derived by subtraction from the overall total.</SourceNote>
        </Panel>

        <Panel className="span-4" title="The class imbalance" subtitle="The target is rare; absolute error counts remain large.">
          <div className="serif" style={{ fontSize: 38, lineHeight: 1 }}>{fmtPct(manifest.counts.fraudRate, 3)}</div>
          <div className="tiny muted">{fmtInt(manifest.counts.fraud)} fraud in {fmtInt(manifest.counts.transactions)} transactions</div>
          <div className="mt-16">
            <div className="progress" style={{ height: 9, background: "var(--line)" }}>
              <span style={{ width: `${manifest.counts.fraudRate * 100}%`, background: fraudRed, minWidth: 3 }} />
            </div>
          </div>
          <div className="mt-8 row-between tiny muted"><span>fraud 0.521%</span><span>genuine 99.479%</span></div>
          <div className="divider" />
          <StatRow label="Test prevalence" value={fmtPct(analysis.class_balance.find((row) => row.split === "test")!.fraud_rate, 3)} />
          <StatRow label="PR-AUC / prevalence" value={`${(analysis.ablation[0].pr_auc / analysis.class_balance.find((row) => row.split === "test")!.fraud_rate).toFixed(1)}×`} />
          <StatRow label="Majority-class accuracy" value={fmtPct(1 - analysis.class_balance.find((row) => row.split === "test")!.fraud_rate, 2)} />
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-12" title="Distribution evidence" subtitle="Original notebook figures for amount shape, ECDF, category and night behavior." action={<Link className="btn btn-sm" to="/artifacts?tab=figures&q=phase1">All 24 P1 figures <ArrowUpRight /></Link>}>
          <FigureStrip figures={figures} />
        </Panel>
      </div>

      <Panel className="mt-16" title="Category economics" subtitle="Transactions, fraud counts, rates and dollar exposure in one sortable table." action={<span className="badge badge-neutral">14 rows</span>}>
        <DataTable rows={categories} columns={tableColumns} pageSize={14} exportName="category_economics.csv" searchPlaceholder="Search categories…" />
      </Panel>
    </>
  );
}
