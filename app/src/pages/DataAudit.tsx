import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { EChartsOption } from "echarts";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Download, Fingerprint, ShieldQuestion } from "lucide-react";
import { useAnalysis, useManifest } from "../context/AppContext";
import { Chart } from "../components/Chart";
import { DataTable, type TableColumn } from "../components/DataTable";
import { FigureStrip } from "../components/Figures";
import { Callout, PageHeader, Panel, SourceNote, Stat, StatRow, StatusBadge } from "../components/ui";
import { downloadCsv } from "../lib/csv";
import { fmtFloat, fmtInt, fmtPct, titleCase } from "../lib/format";
import { fraudRed, indigo, muted, palette } from "../lib/chartTheme";

export default function DataAudit() {
  const manifest = useManifest();
  const analysis = useAnalysis();
  const summary = manifest.dataQuality.summary;
  const missing = manifest.dataQuality.missing;
  const contracts = manifest.dataQuality.contracts;
  const generator = manifest.dataQuality.generator;
  const classBalance = analysis.class_balance;
  const train = classBalance.find((row) => row.split === "train")!;
  const test = classBalance.find((row) => row.split === "test")!;

  const missingOption = useMemo<EChartsOption>(() => {
    const rows = [...missing].sort((a, b) => a.missingPct - b.missingPct);
    return {
      grid: { left: 8, right: 42, top: 5, bottom: 6, containLabel: true },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: (params: any) => `${params[0].name}<br/><b>${fmtPct(params[0].value, 2)}</b> missing` },
      xAxis: { type: "value", max: 12, axisLabel: { formatter: "{value}%", color: muted, fontSize: 10.5 }, splitLine: { lineStyle: { color: "#efeae1" } } },
      yAxis: { type: "category", data: rows.map((row) => row.column), axisLabel: { color: "#4e5563", fontSize: 10.5 }, axisLine: { show: false }, axisTick: { show: false } },
      series: [
        {
          type: "bar",
          data: rows.map((row) => ({ value: row.missingPct, itemStyle: { color: row.missingPct > 5 ? fraudRed : "#9b93ff", borderRadius: [0, 3, 3, 0] } })),
          barWidth: 13,
          label: { show: true, position: "right", formatter: (params: any) => `${params.value.toFixed(2)}%`, color: muted, fontSize: 10.5 },
        },
      ],
    };
  }, [missing]);

  const schema = analysis.schema.filter((row) => row.column && row.column !== "Index");
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of schema) counts[row.role] = (counts[row.role] ?? 0) + 1;
    return counts;
  }, [schema]);

  const roleOption = useMemo<EChartsOption>(() => ({
    tooltip: { trigger: "item", formatter: "{b}: <b>{c}</b> columns" },
    legend: { bottom: 0, left: "center", icon: "circle", itemWidth: 7, itemHeight: 7, textStyle: { fontSize: 10.5, color: "#4e5563" } },
    series: [
      {
        type: "pie",
        radius: ["54%", "75%"],
        center: ["50%", "42%"],
        itemStyle: { borderColor: "#fffdf9", borderWidth: 3 },
        label: { show: false },
        data: Object.entries(roleCounts).map(([role, count], index) => ({
          name: titleCase(role),
          value: count,
          itemStyle: { color: palette[index % palette.length] },
        })),
      },
    ],
    graphic: [
      { type: "text", left: "center", top: "32%", style: { text: "71", fontSize: 29, fontFamily: "Newsreader Variable", fontWeight: 550, fill: "#101a2e", textAlign: "center" } },
      { type: "text", left: "center", top: "47%", style: { text: "analytical columns", fontSize: 10.5, fontFamily: "Manrope Variable", fill: "#7c7a73", textAlign: "center" } },
    ],
  }), [roleCounts]);

  const contractColumns: TableColumn[] = [
    { key: "contract", label: "Contract", render: (row) => <Link className="inline-link" to="/explore?table=phase0_contracts" title="Inspect contract records in Data Explorer" style={{ color: "var(--text)" }}>{row.contract}</Link> },
    { key: "actual", label: "Observed", render: (row) => <span className="mono">{row.actual}</span> },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
  ];

  const schemaColumns: TableColumn[] = [
    { key: "column", label: "Column", render: (row) => <Link className="mono inline-link" to={`/explore?table=phase0_schema&col=${row.column}`} title="Inspect column profile in Data Explorer" style={{ fontSize: 10.5 }}>{row.column}</Link> },
    { key: "dtype", label: "Dtype" },
    { key: "non_null", label: "Non-null", align: "right", render: (row) => fmtInt(row.non_null) },
    { key: "missing_pct", label: "Missing", align: "right", render: (row) => fmtPct(row.missing_pct, 2) },
    { key: "n_unique", label: "Unique", align: "right", render: (row) => fmtInt(row.n_unique) },
    { key: "memory_MB", label: "Memory (MB)", align: "right", render: (row) => fmtFloat(row.memory_MB, 2) },
    { key: "role", label: "Role", render: (row) => <span className="badge badge-neutral">{row.role}</span> },
  ];

  const figures = useMemo(
    () => ["phase0_missing_matrix", "phase0_temporal_coverage", "phase0_txns_per_card"].map((id) => manifest.figures.find((figure) => figure.id === id)).filter(Boolean) as typeof manifest.figures,
    [manifest.figures],
  );

  const generatorLabel: Record<string, { label: string; format: (value: any) => string; note: string }> = {
    unix_time_offset_days: { label: "Timestamp offset", format: (value) => `${Number(value).toLocaleString()} days`, note: "Trans event dates are shifted from the historical source range." },
    unix_time_offset_std_sec: { label: "Timestamp jitter", format: (value) => `${Math.round(Number(value) / 3600)} hours SD`, note: "Random jitter added to event times." },
    merchant_single_category: { label: "Merchant → single category", format: (value) => (value ? "Yes" : "No"), note: "False means merchant/category is near-deterministic, not deterministic." },
    merchant_lat_std_med: { label: "Merchant latitude SD", format: (value) => `${Number(value).toFixed(2)}°`, note: "Median standard deviation of merchant coordinates." },
    unique_coord_pairs_ratio: { label: "Unique coordinate pairs", format: (value) => fmtPct(Number(value), 1), note: "Every merchant has a distinct coordinate pair." },
    zip3_state_purity: { label: "ZIP3 → state purity", format: (value) => fmtPct(Number(value), 1), note: "Geography is perfectly nested; ZIP3 is a direct state proxy." },
    dist_km_ks_D_fraud_vs_non: { label: "Distance KS statistic", format: (value) => Number(value).toFixed(4), note: "Near-zero separation between fraud and genuine distances." },
  };

  return (
    <>
      <PageHeader
        eyebrow="P0 · Data integrity & generator forensics"
        title={<>Before the model, <em>audit the simulator.</em></>}
        description="The notebook profiles 1,852,394 transactions and 71 analytical columns, resolves a temporal split boundary, and documents the mechanics of the Sparkov generator. Its own contracts flag an implausible minimum age; several later signals are simulator artifacts rather than fraud behavior."
        actions={
          <>
            <Link className="btn btn-sm" to="/artifacts?tab=figures&q=phase0"><ArrowUpRight />Audit figures</Link>
            <button type="button" className="btn btn-sm" onClick={() => downloadCsv("data_contracts.csv", contracts, [{ key: "contract", label: "contract" }, { key: "actual", label: "observed" }, { key: "status", label: "status" }])}>
              <Download /> Contracts
            </button>
          </>
        }
        meta={
          <div className="row wrap" style={{ gap: 7 }}>
            <span className="badge badge-phase">Phase P0</span>
            <span className="badge badge-neutral">Cells 13–18</span>
            <span className="badge badge-caveat"><AlertTriangle size={10} />1 contract flagged</span>
            <span className="badge badge-neutral">4 figures · 4 tables</span>
          </div>
        }
      />

      <div className="grid grid-12">
        <Panel className="span-7" title="The split is temporal, not random" subtitle="Train and test are separated by 48 seconds on 21 June 2020. That boundary is the source of the cross-boundary drift." action={<span className="badge badge-neutral">Split integrity</span>}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "14px 15px", background: "var(--surface-2)" }}>
              <div className="tiny muted" style={{ letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 750 }}>Train</div>
              <div className="serif" style={{ fontSize: 30, lineHeight: 1.15, marginTop: 6 }}>{fmtInt(train.n)}</div>
              <div className="tiny muted">{fmtInt(train.fraud)} fraud · {fmtPct(train.fraud_rate, 3)}</div>
              <div className="mono" style={{ fontSize: 10.5, color: "var(--text-soft)", marginTop: 10 }}>2019-01-01 → 2020-06-21 12:13:37</div>
            </div>
            <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "14px 15px", background: "var(--accent-soft)" }}>
              <div className="tiny muted" style={{ letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 750 }}>Test</div>
              <div className="serif" style={{ fontSize: 30, lineHeight: 1.15, marginTop: 6 }}>{fmtInt(test.n)}</div>
              <div className="tiny muted">{fmtInt(test.fraud)} fraud · {fmtPct(test.fraud_rate, 3)}</div>
              <div className="mono" style={{ fontSize: 10.5, color: "var(--text-soft)", marginTop: 10 }}>2020-06-21 12:14:25 → 2020-12-31</div>
            </div>
          </div>
          <div className="mt-16">
            <div style={{ display: "flex", height: 12, borderRadius: 4, overflow: "hidden", position: "relative" }}>
              <div style={{ width: "70%", background: "var(--surface-4)" }} />
              <div style={{ width: "30%", background: indigo }} />
              <div style={{ position: "absolute", left: "70%", top: -3, bottom: -3, width: 2, background: "var(--surface)", boxShadow: "0 0 0 1px #cb4257" }} />
            </div>
            <div className="row-between mt-8">
              <span className="tiny muted">70.0% of rows</span>
              <span className="badge badge-caveat">48-second boundary</span>
              <span className="tiny muted">30.0% of rows</span>
            </div>
          </div>
          <div className="divider" />
          <div className="stat-grid">
            <Stat value={fmtPct(train.fraud_rate, 3)} label="Train fraud rate" />
            <Stat value={fmtPct(test.fraud_rate, 3)} label="Test fraud rate" />
            <Stat value="0.193 pp" label="Absolute rate drop" />
            <Stat value="1.50×" label="Train / test rate ratio" />
          </div>
          <SourceNote>Derived from <code>phase0_class_balance.csv</code> and the notebook's split boundary cell.</SourceNote>
        </Panel>

        <Panel className="span-5" title="Structural missingness" subtitle={`${missing.length} columns are incomplete; the maximum is ${fmtPct(summary.maxMissingPct, 2)}.`} action={<span className="badge badge-neutral">0 imputed</span>}>
          <Chart option={missingOption} height={310} ariaLabel="Horizontal bar chart of missing percentages by column" />
          <div className="tiny muted mt-8">
            Missingness is concentrated in first-transaction history fields. Three count features also exceed 5%.
          </div>
          <SourceNote>From <code>phase0_schema.csv</code>; missing values are structural, not repaired.</SourceNote>
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel className="span-4" title="Schema roles" subtitle="71 analytical columns after the identifier audit.">
          <Chart option={roleOption} height={252} ariaLabel="Donut chart of schema roles" />
          <div className="divider" />
          <StatRow label="raw source columns" value={summary.rawColumns} />
          <StatRow label="analytical columns" value={summary.columns} />
          <StatRow label="processed memory" value={`${summary.memoryMB.toFixed(1)} MB`} />
          <StatRow label="duplicate trans_num" value={summary.duplicateTransNum} />
          <SourceNote>Roles from <code>phase0_schema.csv</code>; memory after dtype discipline.</SourceNote>
        </Panel>

        <Panel className="span-8" title="Data contracts" subtitle="Ten explicit checks. One flag is material: the minimum cardholder age is 13.9 years." action={<span className="badge badge-caveat">1 FLAG · 8 PASS · 1 INFO</span>}>
          <DataTable
            rows={contracts}
            columns={contractColumns}
            pageSize={10}
            searchable={false}
            exportName="data_contracts.csv"
            countLabel="contracts"
            hideToolbar={false}
          />
          <div className="panel-body" style={{ paddingTop: 12 }}>
            <Callout tone="warn" title="Age contract flags an impossible value">
              <p>
                The observed minimum of 13.9 years is below the ~18-year expectation. The source does not explain it. Age should not be used as a
                production eligibility filter without resolving this record.
              </p>
            </Callout>
          </div>
        </Panel>
      </div>

      <Panel className="mt-16" title="Generator forensics" subtitle="Seven simulator mechanics that bound every downstream interpretation." action={<span className="badge badge-neutral"><Fingerprint size={10} />Sparkov</span>}>
        <div className="grid grid-4" style={{ gap: 11 }}>
          {generator.map((row) => {
            const meta = generatorLabel[row.metric] ?? { label: titleCase(row.metric), format: (value: any) => String(value), note: "" };
            const isDistance = row.metric === "dist_km_ks_D_fraud_vs_non";
            return (
              <div key={row.metric} style={{ border: "1px solid var(--line)", borderRadius: 9, padding: "12px 13px", background: isDistance ? "#fff8f9" : "#fdfbf7" }}>
                <div className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".07em", fontWeight: 700 }}>{meta.label}</div>
                <div className="serif" style={{ fontSize: 24, letterSpacing: "-.03em", marginTop: 3, color: isDistance ? fraudRed : "var(--ink-900)" }}>{meta.format(row.value)}</div>
                <div className="tiny muted" style={{ lineHeight: 1.45, marginTop: 3 }}>{meta.note}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-16" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
          <Callout tone="warn" title="Merchant → category is near-deterministic">
            <p>
              Every merchant appears in one category in this generator (the ledger calls it deterministic), while the raw audit records{" "}
              <span className="mono">merchant_single_category = false</span>. Merchant-level and category-level effects therefore cannot be cleanly separated; the
              model keeps one of the pair. This is audit note AN-03.
            </p>
          </Callout>
          <div className="panel pad" style={{ background: "var(--surface-2)" }}>
            <div className="row-between">
              <div className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 750 }}>ZIP3 purity</div>
              <CheckCircle2 size={15} color="#1f8a70" />
            </div>
            <div className="serif" style={{ fontSize: 28, marginTop: 4 }}>100%</div>
            <p className="tiny muted mt-8" style={{ lineHeight: 1.5 }}>
              Every ZIP3 prefix maps to exactly one state. Geography features are a deterministic encoding of state, not independent evidence.
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid grid-12 mt-16">
        <Panel className="span-7" title="Original audit artifacts" subtitle="Rendered from the notebook's PNG outputs." action={<Link className="btn btn-sm" to="/artifacts?tab=figures&q=phase0">Open gallery <ArrowUpRight /></Link>}>
          <FigureStrip figures={figures} />
          <SourceNote><code>phase0_missing_matrix.png</code>, <code>phase0_temporal_coverage.png</code>, <code>phase0_txns_per_card.png</code>.</SourceNote>
        </Panel>
        <Panel className="span-5" title="What this audit changes" subtitle="Interpretation boundaries for the rest of the console.">
          <div className="stack" style={{ gap: 11 }}>
            <Callout tone="info" title="Trust the mechanics, not the priors">
              <p>Card-level campaign assignment, coordinate jitter and ZIP3 purity describe the simulator. They are useful for validating a pipeline, not for estimating production fraud risk.</p>
            </Callout>
            <Callout tone="danger" title="The source is not fully reproducible">
              <p>The two raw CSVs (501.6 MB) are absent. Hashes are recorded as 16-character prefixes. Everything displayed here is computed from the generated tables and notebook outputs.</p>
            </Callout>
            <div className="row wrap" style={{ gap: 6 }}>
              {["ISS-01 raw data absent", "ISS-05 age contract", "AN-03 merchant hierarchy"].map((label) => (
                <span key={label} className="badge badge-neutral"><ShieldQuestion size={10} />{label}</span>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="mt-16" title="Schema profile" subtitle="All 71 analytical columns, their completeness and their assigned role. Searchable and exportable." action={<button type="button" className="btn btn-sm" onClick={() => downloadCsv("schema_profile.csv", schema)}><Download />CSV</button>}>
        <DataTable rows={schema} columns={schemaColumns} pageSize={10} exportName="schema_profile.csv" searchPlaceholder="Search columns…" maxHeight={420} />
      </Panel>
    </>
  );
}
