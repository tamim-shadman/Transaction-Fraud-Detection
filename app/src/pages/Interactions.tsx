import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { EChartsOption } from "echarts";
import { ArrowUpRight, CreditCard, Download, Info, MapPin } from "lucide-react";
import { useAnalysis, useManifest } from "../context/AppContext";
import { Chart } from "../components/Chart";
import { DataTable, type TableColumn } from "../components/DataTable";
import { FigureStrip } from "../components/Figures";
import { Callout, PageHeader, Panel, SourceNote, StatRow } from "../components/ui";
import { downloadCsv } from "../lib/csv";
import { fmtFloat, fmtInt, fmtPct } from "../lib/format";
import { fraudRed, indigo, muted } from "../lib/chartTheme";

export default function Interactions() {
  const manifest = useManifest();
  const analysis = useAnalysis();
  const cards = analysis.cards_summary;
  const cities = analysis.cities;
  const zip3 = analysis.zip3;
  const mi = analysis.mi;
  const dist = analysis.dist_rate;
  const topCities = analysis.city_top.slice(0, 12);
  const topZip = analysis.zip3_top.slice(0, 12);

  const cardOption = useMemo<EChartsOption>(() => {
    const all = cards.scatter.map((row) => ({ ...row, kind: row.rate >= 0.999999 ? "all" : row.rate <= 0 ? "never" : "partial" }));
    const seriesFor = (kind: string, name: string, color: string, sizeBoost = 0) => ({
      name,
      type: "scatter" as const,
      data: all
        .filter((row) => row.kind === kind)
        .map((row) => ({
          value: [row.n, kind === "never" ? 0.0003 : row.rate, row.k, row.cc],
          itemStyle: { color, opacity: kind === "partial" ? 0.65 : 0.95 },
          symbolSize: Math.min(12, 4 + Math.sqrt(row.k) * 0.5 + sizeBoost),
        })),
      emphasis: { scale: 1.4 },
    });
    return {
      grid: { left: 12, right: 18, top: 30, bottom: 16, containLabel: true },
      legend: { top: 0, left: 0, icon: "circle", itemWidth: 7, itemHeight: 7, textStyle: { fontSize: 10.5, color: "#4e5563" } },
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          const [n, rate, k, cc] = params.value;
          return `<b>Card ···${cc}</b><br/>${fmtInt(n)} transactions · ${fmtInt(k)} fraud<br/>Rate ${fmtPct(rate < 0.001 ? 0 : rate, 2)}`;
        },
      },
      xAxis: {
        type: "log",
        min: 5,
        max: 4000,
        name: "transactions per card",
        nameLocation: "middle",
        nameGap: 25,
        nameTextStyle: { fontSize: 10.5, color: muted },
        axisLabel: { color: muted, fontSize: 10.5, formatter: (value: number) => (value >= 1000 ? `${value / 1000}k` : String(value)) },
        splitLine: { lineStyle: { color: "#efeae1" } },
      },
      yAxis: {
        type: "log",
        min: 0.0002,
        max: 1.2,
        axisLabel: { color: muted, fontSize: 10.5, formatter: (value: number) => `${(value * 100).toFixed(value < 0.01 ? 1 : 0)}%` },
        splitLine: { lineStyle: { color: "#efeae1" } },
      },
      series: [
        seriesFor("partial", "Partial fraud rate", indigo),
        seriesFor("all", "100% fraud", fraudRed),
        seriesFor("never", "No fraud", "#8c8577"),
      ],
      markLine: undefined,
    };
  }, [cards.scatter]);

  const histogramOption = useMemo<EChartsOption>(() => ({
    grid: { left: 8, right: 8, top: 16, bottom: 8, containLabel: true },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: (params: any) => `${params[0].name}<br/><b>${params[0].value}</b> cards` },
    xAxis: { type: "category", data: cards.histogram.map((row) => row.bin), axisLabel: { color: muted, fontSize: 10.5, rotate: 28 }, axisLine: { lineStyle: { color: "#d8d0c3" } }, axisTick: { show: false } },
    yAxis: { type: "value", axisLabel: { color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
    series: [
      {
        type: "bar",
        data: cards.histogram.map((row) => ({ value: row.count, itemStyle: { color: row.bin === "100%" ? fraudRed : row.bin === "0%" ? "#8c8577" : "#9b93ff", borderRadius: [3, 3, 0, 0] } })),
        barWidth: "62%",
        label: { show: true, position: "top", fontSize: 10.5, color: muted, formatter: (params: any) => (params.value > 0 ? params.value : "") },
      },
    ],
  }), [cards.histogram]);

  const cityOption = useMemo<EChartsOption>(() => {
    const rows = [...topCities].sort((a, b) => a.eb_rate - b.eb_rate);
    return {
      grid: { left: 8, right: 42, top: 12, bottom: 8, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const row = rows[params[0].dataIndex];
          return `<b>${row.city}</b><br/>EB rate ${fmtPct(row.eb_rate, 2)}<br/>${fmtInt(row.k)} / ${fmtInt(row.n)} raw ${fmtPct(row.k / row.n, 2)}`;
        },
      },
      xAxis: { type: "value", max: 0.035, axisLabel: { formatter: (value: number) => `${(value * 100).toFixed(1)}%`, color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
      yAxis: { type: "category", data: rows.map((row) => row.city), axisLabel: { color: "#4e5563", fontSize: 10.5 }, axisTick: { show: false }, axisLine: { show: false } },
      series: [
        {
          type: "bar",
          data: rows.map((row) => ({ value: row.eb_rate, itemStyle: { color: row.eb_rate > 0.02 ? fraudRed : "#9b93ff", borderRadius: [0, 3, 3, 0] } })),
          barWidth: 10,
          label: { show: true, position: "right", formatter: (params: any) => `${(params.value * 100).toFixed(1)}%`, fontSize: 10.5, color: muted },
          markLine: { silent: true, symbol: "none", data: [{ xAxis: manifest.counts.fraudRate }], lineStyle: { type: "dashed", color: "#8c8577", width: 1 } },
        },
      ],
    };
  }, [topCities, manifest.counts.fraudRate]);

  const zipOption = useMemo<EChartsOption>(() => {
    const rows = [...topZip].sort((a, b) => a.eb_rate - b.eb_rate);
    return {
      grid: { left: 8, right: 40, top: 12, bottom: 8, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const row = rows[params[0].dataIndex];
          return `<b>ZIP3 ${row.zip3}</b><br/>EB ${fmtPct(row.eb_rate, 2)} · raw ${fmtPct(row.rate, 2)}<br/>Wilson ${fmtPct(row.lo, 2)} – ${fmtPct(row.hi, 2)}<br/>${fmtInt(row.k)} / ${fmtInt(row.n)} · q ${Number(row.q_vs_base).toExponential(1)}`;
        },
      },
      xAxis: { type: "value", max: 0.035, axisLabel: { formatter: (value: number) => `${(value * 100).toFixed(0)}%`, color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
      yAxis: { type: "category", data: rows.map((row) => String(row.zip3)), axisLabel: { color: "#4e5563", fontSize: 10.5 }, axisTick: { show: false }, axisLine: { show: false } },
      series: [{ type: "bar", data: rows.map((row) => row.eb_rate), barWidth: 10, itemStyle: { color: "#7c3aed", borderRadius: [0, 3, 3, 0] }, label: { show: true, position: "right", formatter: (params: any) => `${(params.value * 100).toFixed(1)}%`, fontSize: 10.5, color: muted } }],
    };
  }, [topZip]);

  const miOption = useMemo<EChartsOption>(() => {
    const rows = [...mi].sort((a, b) => b.mutual_information - a.mutual_information).slice(0, 10).reverse();
    return {
      grid: { left: 8, right: 32, top: 8, bottom: 8, containLabel: true },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: (params: any) => `${params[0].name}<br/>MI <b>${fmtFloat(params[0].value, 4)}</b>` },
      xAxis: { type: "value", axisLabel: { color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
      yAxis: { type: "category", data: rows.map((row) => row.feature), axisLabel: { color: "#4e5563", fontSize: 10.5 }, axisTick: { show: false }, axisLine: { show: false } },
      series: [{ type: "bar", data: rows.map((row) => row.mutual_information), barWidth: 9, itemStyle: { color: indigo, borderRadius: [0, 3, 3, 0] }, label: { show: true, position: "right", formatter: (params: any) => fmtFloat(params.value, 4), fontSize: 10.5, color: muted } }],
    };
  }, [mi]);

  const distOption = useMemo<EChartsOption>(() => ({
    grid: { left: 8, right: 12, top: 18, bottom: 8, containLabel: true },
    tooltip: { trigger: "axis", formatter: (params: any) => `${params[0].name} km<br/>Rate <b>${fmtPct(params[0].value, 2)}</b>` },
    xAxis: { type: "category", data: dist.map((row) => `${row.dist_bin} km`), axisLabel: { color: muted, fontSize: 10.5 }, axisLine: { lineStyle: { color: "#d8d0c3" } }, axisTick: { show: false } },
    yAxis: { type: "value", min: 0.003, max: 0.006, axisLabel: { formatter: (value: number) => `${(value * 100).toFixed(1)}%`, color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
    series: [{ type: "bar", data: dist.map((row) => row.rate), barWidth: "52%", itemStyle: { color: "#c9c4f8", borderRadius: [3, 3, 0, 0] }, markLine: { silent: true, symbol: "none", data: [{ yAxis: manifest.counts.fraudRate }], lineStyle: { type: "dashed", color: "#8c8577", width: 1 } } }],
  }), [dist, manifest.counts.fraudRate]);

  const cityColumns: TableColumn[] = [
    { key: "city", label: "City", render: (row) => <b style={{ color: "var(--text)" }}>{row.city}</b> },
    { key: "n", label: "Transactions", align: "right", render: (row) => fmtInt(row.n) },
    { key: "k", label: "Fraud", align: "right", render: (row) => fmtInt(row.k) },
    { key: "raw", label: "Raw rate", align: "right", render: (row) => fmtPct(row.k / row.n, 3) },
    { key: "eb_rate", label: "EB-shrunk rate", align: "right", render: (row) => <b style={{ color: indigo }}>{fmtPct(row.eb_rate, 3)}</b> },
  ];
  const cityRows = cities.filter((row) => row.n >= 500).sort((a, b) => b.eb_rate - a.eb_rate);

  const figures = useMemo(
    () => ["phase2_card_scatter", "phase2_zip3_forest", "phase2_geo_scatter", "phase2_mi"].map((id) => manifest.figures.find((figure) => figure.id === id)).filter(Boolean) as typeof manifest.figures,
    [manifest.figures],
  );

  return (
    <>
      <PageHeader
        eyebrow="P2 · Bivariate & interaction structure"
        title={<>Fraud is a <em>card story</em>, not a transaction story.</>}
        description="Card-level profiles reveal extreme concentration: 976 of 999 cards see at least one fraud event, 91 are entirely fraudulent, and only 23 are untouched. Geography is statistically structured but almost entirely explained by the simulator's ZIP3/state nesting."
        actions={
          <>
            <Link className="btn btn-sm" to="/artifacts?tab=figures&q=phase2"><ArrowUpRight />P2 figures</Link>
            <button type="button" className="btn btn-sm" onClick={() => downloadCsv("city_risk.csv", cityRows)}><Download />City risk</button>
          </>
        }
        meta={
          <div className="row wrap" style={{ gap: 7 }}>
            <span className="badge badge-phase">Phase P2</span>
            <span className="badge badge-neutral">23 figures · 6 tables</span>
            <span className="badge badge-strong">Card clustering</span>
            <span className="badge badge-caveat">AN-02 wording audit</span>
          </div>
        }
      />

      <div className="grid grid-12">
        <Panel
          className="span-8"
          title="Per-card fraud rate vs activity"
          subtitle="Each point is one card. The red ceiling is 91 cards whose every transaction is fraud; the floor is 23 cards with none. The middle band is a tight 0.05–2.15%."
          action={<span className="badge badge-neutral"><CreditCard size={10} />999 cards</span>}
        >
          <Chart option={cardOption} height={375} ariaLabel="Scatter plot of transactions per card against fraud rate" />
          <div className="row wrap mt-8" style={{ gap: 14 }}>
            <span className="tiny muted"><b style={{ color: fraudRed }}>91</b> fully fraudulent cards</span>
            <span className="tiny muted"><b style={{ color: indigo }}>885</b> partial</span>
            <span className="tiny muted"><b>23</b> never fraudulent</span>
            <span className="tiny muted">Median positive rate {fmtPct(cards.medianRate, 2)}</span>
          </div>
          <SourceNote>From <code>phase2_card_profiles.csv</code>. Log axes; the 23 zero-rate cards are plotted at 0.03% for visibility.</SourceNote>
        </Panel>

        <div className="span-4 stack">
          <Panel title="Rate distribution" subtitle="Zero-inflated, with a separate 100% mass.">
            <Chart option={histogramOption} height={230} ariaLabel="Histogram of per-card fraud rates" />
            <SourceNote>Bins are 0%, 0.5-point bands to 3%, then 100%.</SourceNote>
          </Panel>
          <Callout tone="warn" title="“Bimodal” is the wrong word">
            <p>
              The ledger calls the card-rate distribution bimodal because 2.3% see no fraud. The actual profile is zero-inflated: 23 zeros, 885 cards in a
              narrow low-rate band, and 91 cards at 100%. The substantive card-clustering claim stands; the label does not.
            </p>
          </Callout>
        </div>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-7" title="City risk after empirical-Bayes shrinkage" subtitle="Cities with fewer than 500 transactions are excluded from this ranking. Shrinkage pulls noisy small cities toward the baseline." action={<span className="badge badge-neutral"><MapPin size={10} />836 cities</span>}>
          <Chart option={cityOption} height={330} ariaLabel="Bar chart of top city fraud rates after empirical Bayes shrinkage" />
          <SourceNote>From <code>phase2_city_table.csv</code>. Rates are city-level, not card-representative.</SourceNote>
        </Panel>

        <Panel className="span-5" title="ZIP3 prefixes with significant lift" subtitle="Top prefixes among 532, restricted to q &lt; 0.05 and n ≥ 500. Every prefix maps to one state.">
          <Chart option={zipOption} height={330} ariaLabel="Bar chart of top ZIP3 fraud rates" />
          <SourceNote>From <code>phase2_zip3_table.csv</code>; Wilson intervals and FDR q-values are in the source table.</SourceNote>
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-4" title="Mutual information" subtitle="log_amt and amount z-score lead; hour carries a small but real share.">
          <Chart option={miOption} height={290} ariaLabel="Bar chart of mutual information by feature" />
          <SourceNote>From <code>phase2_mi_table.csv</code>. MI is univariate and does not control for card history.</SourceNote>
        </Panel>

        <Panel className="span-4" title="Distance is a non-signal" subtitle="Fraud rate is effectively flat across card→merchant distance bins.">
          <Chart option={distOption} height={220} ariaLabel="Bar chart of fraud rate by distance bin" />
          <div className="divider" />
          <StatRow label="KS D fraud vs genuine" value="0.0071" />
          <StatRow label="Cliff's delta" value="0.0016" />
          <StatRow label="Verdict" value="Generator noise" />
          <SourceNote>From <code>phase2_dist_rate_table.csv</code> and <code>phase5_mw_effect_sizes.csv</code>; coordinates are jittered by the simulator.</SourceNote>
        </Panel>

        <Panel className="span-4" title="Geography, decoded" subtitle="What is statistically significant is not necessarily transferable.">
          <div className="stack" style={{ gap: 10 }}>
            <Callout tone="info" title="ZIP3 is a state proxy">
              <p>ZIP3 → state purity is 100%. A ZIP3 effect is not independent evidence beyond state, and state is itself a generator sampling artifact.</p>
            </Callout>
            <StatRow label="Cities represented" value={fmtInt(manifest.counts.cities)} />
            <StatRow label="ZIP3 prefixes" value={fmtInt(manifest.counts.zip3)} />
            <StatRow label="States" value={manifest.counts.states} />
            <StatRow label="City median transactions" value={fmtInt([...cities].sort((a, b) => a.n - b.n)[Math.floor(cities.length / 2)].n)} />
            <Link className="insight-link" to="/statistics">See effect sizes and FDR correction <ArrowUpRight /></Link>
          </div>
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-12" title="Interaction artifacts" subtitle="Card scatter, ZIP3 forest, coordinate cloud and mutual information as rendered by the notebook." action={<Link className="btn btn-sm" to="/artifacts?tab=figures&q=phase2">All 23 P2 figures <ArrowUpRight /></Link>}>
          <FigureStrip figures={figures} />
          <SourceNote>The coordinate cloud is synthetic jitter around merchant locations; it should not be read as a real geographic map.</SourceNote>
        </Panel>
      </div>

      <Panel className="mt-16" title="City risk table" subtitle="Cities with at least 500 transactions, sorted by EB-shrunk rate. Raw rate can be volatile at this sample size." action={<span className="badge badge-neutral">{cityRows.length} cities</span>}>
        <DataTable rows={cityRows} columns={cityColumns} pageSize={12} exportName="city_risk.csv" searchPlaceholder="Search cities…" />
      </Panel>
    </>
  );
}
