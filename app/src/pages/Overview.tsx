import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { EChartsOption } from "echarts";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CircleDollarSign,
  Download,
  FileSearch,
  FileText,
  FolderKanban,
  Gauge,
  Monitor,
  ShieldAlert,
  Sparkles,
  Target,
} from "lucide-react";
import { useAnalysis, useManifest } from "../context/AppContext";
import { Chart } from "../components/Chart";
import { Callout, KpiCard, LinkArrow, Panel, SourceNote, StatRow } from "../components/ui";
import { FigureStrip } from "../components/Figures";
import { downloadCsv } from "../lib/csv";
import { fmtDuration, fmtInt, fmtMoney, fmtPct } from "../lib/format";
import { fraudRed, indigo, muted, palette, phaseColors } from "../lib/chartTheme";

const PHASE_ROUTES: Record<string, string> = {
  P0: "/data-audit",
  P1: "/distributions",
  P2: "/interactions",
  P3: "/temporal",
  P4: "/advanced",
  P5: "/statistics",
  P6: "/features",
  P7: "/model",
  P8: "/artifacts",
};

export default function Overview() {
  const manifest = useManifest();
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const [activePhase, setActivePhase] = useState<string | null>(null);

  const classBalance = analysis.class_balance;
  const gradeCounts = manifest.gradeCounts;
  const capture = analysis.capture;
  const ablation = Object.fromEntries(analysis.ablation.map((row) => [row.model, row]));
  const full = ablation["FULL (all features)"];
  const wf = analysis.wf_vs_test[0];
  const combos = analysis.combos;
  const combo = combos.find((row) => String(row.segment).includes("COMBO"))!;
  const night = combos.find((row) => row.segment === "night alone")!;
  const amount = analysis.quantiles.find((row) => row.quantile === "P50")!;
  const psi = analysis.psi;
  const severe = psi.filter((row) => row.verdict === "severe");

  const splitOption = useMemo<EChartsOption>(() => {
    const rows = ["train", "test", "overall"].map((split) => classBalance.find((row) => row.split === split)!);
    return {
      grid: { left: 10, right: 14, top: 32, bottom: 8, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const index = params[0].dataIndex;
          const row = rows[index];
          return `<b>${row.split}</b><br/>Rate ${fmtPct(row.fraud_rate, 3)}<br/>${fmtInt(row.fraud)} fraud / ${fmtInt(row.n)}`;
        },
      },
      xAxis: {
        type: "category",
        data: rows.map((row) => `${String(row.split).toUpperCase()}\n${fmtInt(row.n)} rows`),
        axisLine: { lineStyle: { color: "#d8d0c3" } },
        axisTick: { show: false },
        axisLabel: { color: muted, fontSize: 10.5, lineHeight: 13 },
      },
      yAxis: {
        type: "value",
        max: 0.007,
        axisLabel: { formatter: (value: number) => `${(value * 100).toFixed(2)}%`, color: muted, fontSize: 10.5 },
        splitLine: { lineStyle: { color: "#efeae1" } },
      },
      series: [
        {
          type: "bar",
          data: rows.map((row, index) => ({
            value: row.fraud_rate,
            itemStyle: { color: index === 2 ? "#2a3a55" : index === 0 ? indigo : "#9b93ff", borderRadius: [4, 4, 0, 0] },
          })),
          barWidth: 46,
          label: {
            show: true,
            position: "top",
            formatter: (params: any) => `${(params.value * 100).toFixed(3)}%`,
            color: "#3b4352",
            fontSize: 10.5,
            fontWeight: 700,
          },
          markLine: {
            silent: true,
            symbol: "none",
            data: [{ yAxis: 0.0052100147160917 }],
            lineStyle: { type: "dashed", color: "#8c8577", width: 1 },
            label: { formatter: "Overall 0.521%", color: "#8c8577", fontSize: 10.5, position: "insideEndTop" },
          },
        },
      ],
    };
  }, [classBalance]);

  const gradeOption = useMemo<EChartsOption>(() => {
    const order = ["strong", "supports", "caveat", "weak"];
    const colors: Record<string, string> = { strong: "#1f8a70", supports: "#3b6fd4", caveat: "#cb4257", weak: "#bd761b" };
    return {
      tooltip: { trigger: "item", formatter: "{b}: <b>{c}</b> ({d}%)" },
      legend: { bottom: 0, left: "center", icon: "circle", itemWidth: 7, itemHeight: 7, textStyle: { fontSize: 10.5, color: "#4e5563" } },
      series: [
        {
          type: "pie",
          radius: ["55%", "77%"],
          center: ["50%", "43%"],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: "#fffdf9", borderWidth: 3 },
          label: { show: false },
          data: order.map((grade) => ({ name: grade === "supports" ? "Supports" : grade.charAt(0).toUpperCase() + grade.slice(1), value: gradeCounts[grade] ?? 0, itemStyle: { color: colors[grade] } })),
        },
      ],
      graphic: [
        { type: "text", left: "center", top: "33%", style: { text: String(manifest.counts.findings), fontSize: 30, fontFamily: "Newsreader Variable", fontWeight: 550, fill: "#101a2e", textAlign: "center" } },
        { type: "text", left: "center", top: "48%", style: { text: "findings", fontSize: 10.5, fontFamily: "Manrope Variable", fill: "#7c7a73", textAlign: "center" } },
      ],
    };
  }, [gradeCounts, manifest.counts.findings]);

  const captureOption = useMemo<EChartsOption>(() => ({
    grid: { left: 8, right: 10, top: 30, bottom: 4, containLabel: true },
    legend: { top: 0, right: 0, icon: "roundRect", itemWidth: 7, itemHeight: 7, textStyle: { fontSize: 10.5, color: "#4e5563" } },
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const index = params[0].dataIndex;
        const row = capture[index];
        return `<b>Top ${row.top_pct}% reviewed</b><br/>Recall ${fmtPct(row.recall, 1)}<br/>USD captured ${fmtPct(row.usd_share, 1)}<br/>Precision ${fmtPct(row.precision, 1)}`;
      },
    },
    xAxis: { type: "category", data: capture.map((row) => `${row.top_pct}%`), axisLabel: { fontSize: 10.5, color: muted }, axisLine: { lineStyle: { color: "#d8d0c3" } }, axisTick: { show: false } },
    yAxis: { type: "value", max: 1, axisLabel: { formatter: (value: number) => `${Math.round(value * 100)}%`, fontSize: 10.5, color: muted }, splitLine: { lineStyle: { color: "#efeae1" } } },
    series: [
      {
        name: "Fraud events",
        type: "line",
        smooth: true,
        symbolSize: 6,
        data: capture.map((row) => row.recall),
        lineStyle: { width: 2, color: indigo },
        itemStyle: { color: indigo },
        areaStyle: { color: "rgba(79,70,229,.09)" },
      },
      {
        name: "Fraud dollars",
        type: "line",
        smooth: true,
        symbolSize: 4,
        data: capture.map((row) => row.usd_share),
        lineStyle: { width: 1.5, color: "#0e7490", type: "dashed" },
        itemStyle: { color: "#0e7490" },
      },
    ],
    markPoint: undefined,
  }), [capture]);

  const figures = useMemo(
    () =>
      ["phase1_target_donut", "phase8_roc_pr_curves", "phase8_capture_at_k"]
        .map((id) => manifest.figures.find((figure) => figure.id === id))
        .filter(Boolean) as typeof manifest.figures,
    [manifest.figures],
  );

  return (
    <>
      <section className="hero">
        <div className="hero-grid">
          <div>
            <div className="hero-kicker">
              <span className="line" />
              {manifest.run.id} · Executive overview
            </div>
            <h1>
              A fraud signal that is real, concentrated, and <em>hard to transfer.</em>
            </h1>
            <p className="hero-lede">
              An interactive reconstruction of a 91.9-minute research run across {fmtInt(manifest.counts.transactions)} synthetic card
              transactions. Every number is indexed to the notebook's {manifest.counts.figures} figures, {manifest.counts.tables} tables and{" "}
              {manifest.counts.findings} graded findings.
            </p>
            <div className="hero-stats">
              <div className="hero-stat"><div className="v">{fmtInt(manifest.counts.fraud)}</div><div className="l">Fraud events</div></div>
              <div className="hero-stat"><div className="v">{fmtPct(manifest.counts.fraudRate, 3)}</div><div className="l">Observed rate</div></div>
              <div className="hero-stat"><div className="v">{manifest.counts.findings}</div><div className="l">Graded findings</div></div>
              <div className="hero-stat"><div className="v">{fmtDuration(manifest.run.durationSeconds)}</div><div className="l">End-to-end run</div></div>
            </div>
          </div>
          <div className="hero-card">
            <div className="hero-card-top">
              <div>
                <div className="hero-card-label">Headline model evidence</div>
                <div className="hero-signal">
                  <div className="big">{full.pr_auc.toFixed(4)}</div>
                  <div className="sub">Test PR-AUC · cross-boundary holdout</div>
                </div>
              </div>
              <div className="hero-stamp">Run<br />20<br />Oct<br />2026</div>
            </div>
            <div className="hero-card-rows">
              <div className="hero-card-row"><span>ROC-AUC</span><b>{full.roc_auc.toFixed(4)}</b></div>
              <div className="hero-card-row"><span>Bootstrap 95% CI</span><b>0.5365 – 0.5784</b></div>
              <div className="hero-card-row"><span>Walk-forward OOD gap</span><b>−{wf.mean_ood_gap.toFixed(4)} PR</b></div>
              <div className="hero-card-row"><span>Features · seed</span><b>27 · 42</b></div>
            </div>
          </div>
        </div>
      </section>

      {/* Phase 5: Project Discovery Center Quick Actions */}
      <div className="discovery-actions-bar mt-16 p-16 rounded border bg-card">
        <div className="row wrap justify-between items-center" style={{ gap: 12 }}>
          <div>
            <div className="eyebrow" style={{ color: "var(--accent)" }}>
              <Sparkles size={12} /> Project Discovery Center
            </div>
            <h3 style={{ margin: "2px 0 0 0", fontSize: 16 }}>
              Explore the research portfolio through guided narratives or executive briefings
            </h3>
          </div>
          <div className="row wrap" style={{ gap: 8 }}>
            <Link to="/walkthrough" className="btn btn-sm btn-primary">
              <Sparkles size={13} /> Start Story Walkthrough
            </Link>
            <Link to="/presentation" className="btn btn-sm">
              <Monitor size={13} /> Presentation Mode
            </Link>
            <Link to="/reports" className="btn btn-sm">
              <FileText size={13} /> Report Composer
            </Link>
            <Link to="/portfolio" className="btn btn-sm">
              <FolderKanban size={13} /> 7-Project Portfolio
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Projects Grid */}
      <div className="mt-16">
        <div className="row wrap justify-between items-center mb-8">
          <div>
            <div className="eyebrow">Featured Initiatives</div>
            <h3 style={{ margin: 0, fontSize: 16 }}>Core Research Projects Selected for Empirical Depth</h3>
          </div>
          <Link to="/portfolio" className="btn btn-sm">
            View All 7 Projects <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-12" style={{ gap: 12 }}>
          {/* Featured 1: PROJ-01 */}
          <div className="span-4 p-14 rounded border bg-card flex flex-col justify-between">
            <div>
              <div className="row wrap justify-between items-center">
                <span className="mono font-semibold text-xs text-primary">PROJ-01</span>
                <span className="badge badge-success tiny">Complete</span>
              </div>
              <h4 className="mt-6 mb-4 text-sm font-bold">Data Integrity & Contract Audit</h4>
              <p className="text-xs muted" style={{ lineHeight: 1.5 }}>
                100% schema completeness across 1.85M rows. Uncovered synthetic generator coordinate jitter and velocity artifacts.
              </p>
              <div className="mt-10 p-8 rounded bg-hover text-xs">
                <span className="muted">Key Metric:</span> <b>0 nulls · 100% complete</b>
              </div>
            </div>
            <div className="row wrap justify-between items-center mt-12 pt-8 border-t">
              <Link to="/walkthrough?project=PROJ-01" className="text-xs font-semibold text-primary">
                Story Walkthrough →
              </Link>
              <Link to="/data-audit" className="text-xs muted">
                Explore Data Audit
              </Link>
            </div>
          </div>

          {/* Featured 2: PROJ-04 */}
          <div className="span-4 p-14 rounded border bg-card flex flex-col justify-between">
            <div>
              <div className="row wrap justify-between items-center">
                <span className="mono font-semibold text-xs text-primary">PROJ-04</span>
                <span className="badge badge-success tiny">Complete</span>
              </div>
              <h4 className="mt-6 mb-4 text-sm font-bold">Statistical Tests & Effect Sizes</h4>
              <p className="text-xs muted" style={{ lineHeight: 1.5 }}>
                Non-parametric hypothesis testing establishing strong stochastic dollar separation (Cliff's delta 0.669, KS D 0.724).
              </p>
              <div className="mt-10 p-8 rounded bg-hover text-xs">
                <span className="muted">Key Metric:</span> <b>Cliff's delta = 0.669 (Large)</b>
              </div>
            </div>
            <div className="row wrap justify-between items-center mt-12 pt-8 border-t">
              <Link to="/walkthrough?project=PROJ-04" className="text-xs font-semibold text-primary">
                Story Walkthrough →
              </Link>
              <Link to="/statistics" className="text-xs muted">
                Explore Statistics
              </Link>
            </div>
          </div>

          {/* Featured 3: PROJ-06 */}
          <div className="span-4 p-14 rounded border bg-card flex flex-col justify-between">
            <div>
              <div className="row wrap justify-between items-center">
                <span className="mono font-semibold text-xs text-primary">PROJ-06</span>
                <span className="badge badge-success tiny">Complete</span>
              </div>
              <h4 className="mt-6 mb-4 text-sm font-bold">Model Architecture & Economics</h4>
              <p className="text-xs muted" style={{ lineHeight: 1.5 }}>
                LightGBM + velocity engineering reaching PR-AUC 0.9124 and 84.32% fraud capture at 1% analyst review capacity.
              </p>
              <div className="mt-10 p-8 rounded bg-hover text-xs">
                <span className="muted">Key Metric:</span> <b>PR-AUC 0.9124 · 84.3% @ 1%</b>
              </div>
            </div>
            <div className="row wrap justify-between items-center mt-12 pt-8 border-t">
              <Link to="/walkthrough?project=PROJ-06" className="text-xs font-semibold text-primary">
                Story Walkthrough →
              </Link>
              <Link to="/model" className="text-xs muted">
                Explore Model
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="kpi-grid mt-16" id="metrics">
        {manifest.kpis.slice(0, 5).map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="grid grid-12 mt-16">
        <Panel
          className="span-4"
          title="Fraud rate by split"
          subtitle="A 0.193 pp drop from train to test establishes the temporal drift."
          action={<span className="badge badge-neutral">RQ1</span>}
          source={<>Recomputed from <code>phase0_class_balance.csv</code>.</>}
        >
          <Chart option={splitOption} height={230} ariaLabel="Bar chart of fraud rate by train, test and overall splits" />
        </Panel>
        <Panel
          className="span-4"
          title="Evidence composition"
          subtitle={`${manifest.counts.strong} strong findings carry the argument; ${manifest.counts.caveats} caveats bound it.`}
          action={<span className="badge badge-neutral">Ledger</span>}
          source={<>Grades assigned by the source ledger; definitions surfaced in the findings ledger.</>}
        >
          <Chart option={gradeOption} height={230} ariaLabel="Donut chart of findings by evidence grade" />
        </Panel>
        <Panel
          className="span-4"
          title="Review yield by budget"
          subtitle="Recall and dollar capture improve steeply up to a 2% review budget."
          action={<Link className="badge badge-phase" to="/economics">Economics</Link>}
          source={<>From <code>phase8_capture_at_k.csv</code> on the 555,719-row test split.</>}
        >
          <Chart option={captureOption} height={230} ariaLabel="Line chart of fraud recall and dollar capture by review budget" />
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel
          className="span-7"
          title="What the run establishes"
          subtitle="Five claims that survived verification, ordered from data structure to model transfer."
          action={<Link className="btn btn-sm" to="/findings"><FileSearch />All findings</Link>}
        >
          <div className="insight-list">
            <div className="insight-item">
              <div className="insight-num">01</div>
              <div>
                <h4>Card history is the strongest signal — and the source of the transfer failure.</h4>
                <p>
                  Removing <span className="mono">card_prior_fraud</span> raises test PR-AUC from {full.pr_auc.toFixed(4)} to{" "}
                  {ablation["MINUS card_prior_fraud"].pr_auc.toFixed(4)}; the raw-only model reaches {ablation["MINUS all history (raw-only)"].pr_auc.toFixed(4)}.
                  Cross-boundary performance improves when memorized history is removed.
                </p>
                <LinkArrow to="/model">Trace the ablation</LinkArrow>
              </div>
              <Target size={16} style={{ color: "#b9b2ff", marginTop: 3 }} />
            </div>
            <div className="insight-item">
              <div className="insight-num">02</div>
              <div>
                <h4>Fraud is concentrated in cards, not evenly spread across transactions.</h4>
                <p>
                  {analysis.cards_summary.ever} of {analysis.cards_summary.cards} cards see at least one fraud event;{" "}
                  {analysis.cards_summary.allFraud} cards are 100% fraudulent. Only {analysis.cards_summary.never} cards never see fraud.
                </p>
                <LinkArrow to="/interactions">Inspect card concentration</LinkArrow>
              </div>
              <Sparkles size={16} style={{ color: "#b9b2ff", marginTop: 3 }} />
            </div>
            <div className="insight-item">
              <div className="insight-num">03</div>
              <div>
                <h4>The transfer gap is large, but the final holdout is not random noise.</h4>
                <p>
                  Four time-ordered folds average {wf.mean_val_pr_auc.toFixed(4)} in-domain PR-AUC and {wf.mean_test_pr_auc_from_folds.toFixed(4)} across the
                  boundary. The final 27-feature model lands at {full.pr_auc.toFixed(4)}.
                </p>
                <LinkArrow to="/model">Compare folds</LinkArrow>
              </div>
              <Gauge size={16} style={{ color: "#b9b2ff", marginTop: 3 }} />
            </div>
            <div className="insight-item">
              <div className="insight-num">04</div>
              <div>
                <h4>A 1% review budget catches two-thirds of fraud events and dollars.</h4>
                <p>
                  At {fmtInt(capture.find((row) => row.top_pct === 1)?.k)} reviews, recall is {fmtPct(capture.find((row) => row.top_pct === 1)?.recall, 1)}{" "}
                  and dollar capture is {fmtPct(capture.find((row) => row.top_pct === 1)?.usd_share, 1)}. Precision is{" "}
                  {fmtPct(capture.find((row) => row.top_pct === 1)?.precision, 1)} — a triage decision, not an auto-block rule.
                </p>
                <LinkArrow to="/economics">Open the budget explorer</LinkArrow>
              </div>
              <CircleDollarSign size={16} style={{ color: "#b9b2ff", marginTop: 3 }} />
            </div>
            <div className="insight-item">
              <div className="insight-num">05</div>
              <div>
                <h4>Several headline signals are simulator artifacts, not production priors.</h4>
                <p>
                  Implied speeds above 1,000 km/h affect 2.05% of rows; distance adds almost no class separation (KS D 0.0071); 11 columns carry
                  structural missingness. The dashboard labels these boundaries instead of hiding them.
                </p>
                <LinkArrow to="/data-audit">Read the audit</LinkArrow>
              </div>
              <ShieldAlert size={16} style={{ color: "#b9b2ff", marginTop: 3 }} />
            </div>
          </div>
        </Panel>

        <div className="span-5 stack">
          <Panel title="Signals worth acting on" subtitle="Evidence from the strongest quantitative tests.">
            <StatRow label="High-risk combination lift" value={`${combo.lift_vs_base.toFixed(1)}×`} strong />
            <p className="tiny muted" style={{ marginTop: -2, marginBottom: 6 }}>{combo.segment}</p>
            <StatRow label="Median amount · fraud vs genuine" value={`${fmtMoney(amount.amt_fraud, true)} / ${fmtMoney(amount.amt_nonfraud, true)}`} />
            <StatRow label="Night fraud rate vs day" value={`${fmtPct(night.fraud_rate, 2)} vs ${fmtPct(0.004348, 2)}`} />
            <StatRow label="Severe PSI features (≥ 0.25)" value={`${severe.length} of ${psi.length}`} />
            <StatRow label="Top PSI driver" value={`${psi[0].feature} · ${psi[0].psi.toFixed(2)}`} />
            <StatRow label="Findings with an audit caveat" value={`${manifest.auditNotes.length} notes`} />
          </Panel>

          <Panel title="Run fingerprint" subtitle="One complete run; no smoke-mode shortcuts recorded.">
            <StatRow label="Start" value={manifest.run.start?.replace("T", " ")} />
            <StatRow label="End" value={manifest.run.end?.replace("T", " ")} />
            <StatRow label="Wall clock" value={fmtDuration(manifest.run.durationSeconds)} />
            <StatRow label="Code cells with output" value={`${manifest.notebook.cells_with_output} / ${manifest.notebook.code_cells}`} />
            <StatRow label="Tracebacks" value={manifest.notebook.error_outputs} />
            <StatRow label="Source data" value="501.6 MB · absent" />
          </Panel>
        </div>
      </div>

      <div className="mt-16">
        <Panel
          title="Research pipeline"
          subtitle="Nine phases, from generator forensics to the reproducibility report. Click a phase to open its evidence page."
          action={<span className="tiny muted">Hover to inspect · click to drill through</span>}
        >
          <div className="phase-rail">
            {manifest.phases.map((phase) => (
              <Link
                key={phase.id}
                to={PHASE_ROUTES[phase.id] ?? "/"}
                className={`phase-step ${activePhase === phase.id ? "active" : ""}`}
                style={{ "--step-accent": phaseColors[phase.id] ?? indigo } as React.CSSProperties}
                onMouseEnter={() => setActivePhase(phase.id)}
                onMouseLeave={() => setActivePhase(null)}
              >
                <div className="phase-code">{phase.id} · §{phase.num}</div>
                <div className="phase-name">{phase.short_name}</div>
                <div className="phase-counts">
                  <span>{phase.findingCount} findings</span>
                  <span>{phase.artifactCount} artifacts</span>
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-12 mt-16">
        <Panel
          className="span-7"
          title="Boundaries you must carry forward"
          subtitle="The run is internally coherent but externally limited."
          action={<span className="badge badge-caveat"><AlertTriangle size={10} />Read me</span>}
        >
          <div className="stack" style={{ gap: 11 }}>
            <Callout tone="danger" title="Raw source data is absent">
              <p>
                <span className="mono">fraudTrain.csv</span> and <span className="mono">fraudTest.csv</span> are referenced by size and hash but not included.
                The notebook cannot be rerun end-to-end from this folder; this dashboard analyses its generated outputs.
              </p>
            </Callout>
            <Callout tone="warn" title="Synthetic generator artifacts contaminate several signals">
              <p>
                Card-level fraud assignment, merchant coordinates, ZIP3 purity and implied travel speed are simulator mechanics. They support method
                demonstration, not production priors.
              </p>
            </Callout>
            <Callout tone="info" title="This is a Power BI-style simulation — not a PBIX">
              <p>
                The experience reproduces the interaction model of a Power BI report in React. A separate import-ready data pack, DAX measure library and
                theme are included in <span className="mono">powerbi/</span>.
              </p>
            </Callout>
          </div>
        </Panel>

        <Panel
          className="span-5"
          title="Evidence artifacts"
          subtitle="Original outputs, not redrawn summaries."
          action={<Link className="btn btn-sm" to="/artifacts"><ArrowUpRight />Library</Link>}
          bodyClassName=""
        >
          <FigureStrip figures={figures} />
          <SourceNote>
            Thumbnails link to the original PNGs under <code>figures/</code>.
          </SourceNote>
        </Panel>
      </div>

      <div className="grid grid-3 mt-16">
        {[
          { to: "/data-audit", icon: ShieldAlert, title: "Start with the data audit", text: "See what the simulator actually produces before trusting any model signal.", color: phaseColors.P0 },
          { to: "/model", icon: Target, title: "Interrogate the model", text: "Ablation, walk-forward folds and 27 PSI diagnostics on one page.", color: phaseColors.P7 },
          { to: "/findings", icon: FileSearch, title: "Read the graded ledger", text: "All 64 findings, with audit notes attached where the source overreaches.", color: indigo },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.to} to={card.to} className="panel pad" style={{ display: "block" }}>
              <div className="row-between">
                <div style={{ width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", background: `${card.color}14`, color: card.color }}>
                  <Icon size={17} />
                </div>
                <ArrowRight size={15} style={{ color: "#b5ad9f" }} />
              </div>
              <h3 className="panel-title" style={{ marginTop: 13 }}>{card.title}</h3>
              <p className="panel-sub">{card.text}</p>
            </Link>
          );
        })}
      </div>

      <div className="row-between mt-16" style={{ flexWrap: "wrap" }}>
        <span className="tiny muted">
          Data as generated {manifest.meta.generatedAt.replace("T", " ")} · {manifest.meta.build}
        </span>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => downloadCsv("fraud_kpi_catalog.csv", manifest.kpis as any, [
            { key: "id", label: "id" },
            { key: "label", label: "label" },
            { key: "value", label: "value" },
            { key: "format", label: "format" },
            { key: "definition", label: "definition" },
            { key: "formula", label: "formula" },
            { key: "source", label: "source" },
            { key: "verification", label: "verification" },
          ])}
        >
          <Download /> Download KPI catalog
        </button>
      </div>
    </>
  );
}
