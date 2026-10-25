import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  Boxes,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Database,
  Download,
  FlaskConical,
  GitBranch,
  Layers3,
  ListChecks,
  LockKeyhole,
  ScrollText,
  Sparkles,
  Target,
} from "lucide-react";
import { useAsync } from "../lib/useAsync";
import { loadProgram } from "../lib/data";
import { PageHeader, Panel, Callout, EmptyState, SourceNote, StatusBadge } from "../components/ui";
import { Drawer, ProvenanceBadge, SourceChip } from "../components/phase2";
import { downloadText } from "../lib/csv";
import { fmtBytes, fmtDateTime, fmtDuration, fmtInt, fmtPct, titleCase } from "../lib/format";
import type { Phase2Phase } from "../types";

export default function Program() {
  const program = useAsync(loadProgram, []);
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const selectedId = params.get("phase");

  const data = program.data;
  const selected = data?.phases.find((phase) => phase.id === selectedId) ?? null;

  const phases = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!data) return [];
    return data.phases.filter((phase) =>
      !needle || `${phase.id} ${phase.name} ${phase.purpose} ${phase.methods.join(" ")}`.toLowerCase().includes(needle),
    );
  }, [data, query]);

  const openPhase = (phase: Phase2Phase) => {
    const next = new URLSearchParams(params);
    next.set("phase", phase.id);
    setParams(next, { replace: true });
  };
  const closePhase = () => {
    const next = new URLSearchParams(params);
    next.delete("phase");
    setParams(next, { replace: true });
  };

  const exportProfile = () => {
    if (!data) return;
    const lines = [
      `# ${data.project.title}`,
      "",
      data.project.description,
      "",
      `Run: ${data.run.id} · ${fmtDuration(data.run.durationSeconds)} · seed ${data.run.seed}`,
      `Transactions: ${fmtInt(data.counts.transactions)} · Fraud: ${fmtInt(data.counts.fraud)} (${fmtPct(data.counts.fraudRate, 3)})`,
      `Findings: ${data.counts.findings} · strong ${data.counts.strong} · caveats ${data.counts.caveats} · weak ${data.counts.weak}`,
      "",
      "## Research questions",
      ...data.researchQuestions.map((rq) => `- ${rq.id}: ${rq.question} (${rq.findings} findings, ${rq.strong} strong)`),
      "",
      "## Phase dossiers",
      ...data.phases.flatMap((phase) => [
        `### ${phase.id} · ${phase.name}`,
        "",
        phase.purpose,
        "",
        `Cells ${phase.cellRange} · ${phase.findingCount} findings · ${phase.artifactCount} artifacts`,
        `Key metric: ${phase.keyMetric.label} = ${phase.keyMetric.value}`,
        "",
        "Limitations:",
        ...phase.limitations.map((limit) => `- ${limit}`),
        "",
      ]),
      "## Limits",
      ...data.limits.map((limit) => `- **${limit.title}**: ${limit.detail}`),
      "",
      "## Sources",
      ...data.sources.map((source) => `- ${source.name} · ${source.role} · ${source.present ? "present" : "absent"}`),
    ];
    downloadText("fraud_program_profile.md", lines.join("\n"), "text/markdown;charset=utf-8");
  };

  if (program.error) {
    return <Callout tone="danger" title="Program profile unavailable"><p>{program.error}</p></Callout>;
  }

  return (
    <>
      <PageHeader
        eyebrow={<><Layers3 size={13} /> Program profile</>}
        title={<>One research program. <em>Nine auditable phases.</em></>}
        description="Comprehensive profile of the research program and its seven core project tracks across nine auditable research phases."
        actions={
          <div className="row wrap">
            <Link className="btn btn-sm btn-primary" to="/portfolio">Project portfolio <ArrowUpRight /></Link>
            <SourceChip to="/metrics">Metric catalog</SourceChip>
            <button type="button" className="btn btn-sm" onClick={exportProfile}><Download /> Export profile</button>
          </div>
        }
        meta={data ? (
          <div className="header-meta">
            <span className="status-line"><CheckCircle2 /> {data.phaseStatus.complete}/{data.phaseStatus.total} phases executed</span>
            <span className="status-line"><LockKeyhole /> {data.sources.filter((source) => !source.present).length} source files absent</span>
            <span className="status-line"><ListChecks /> {data.counts.findings} graded findings</span>
            <span className="status-line"><GitBranch /> Run {data.run.id}</span>
          </div>
        ) : null}
      />

      {program.loading || !data ? (
        <div className="skeleton mt-16" style={{ height: 420 }} />
      ) : (
        <>
          <section className="program-hero mt-16">
            <div className="program-hero-main">
              <div className="program-id">{data.project.id} · research reconstruction</div>
              <h2>{data.project.title}</h2>
              <p>{data.project.description}</p>
              <div className="program-tags">
                {data.project.primary_users?.slice(0, 4).map((user: string) => <span key={user}>{user}</span>)}
                {data.project.project_type ? <span key="type">{data.project.project_type}</span> : null}
              </div>
              <div className="program-actions">
                <Link className="btn btn-sm btn-primary" to="/portfolio">Project portfolio & profiles <ArrowUpRight /></Link>
                <Link className="btn btn-sm" to="/insights">Read the evidence brief <ArrowUpRight /></Link>
                <Link className="btn btn-sm" to="/experiments">Compare model variants <ArrowUpRight /></Link>
              </div>
            </div>
            <div className="program-hero-aside">
              <div className="program-score">
                <span>Evidence status</span>
                <b>{data.counts.strong}<small> / {data.counts.findings} strong</small></b>
                <p>Grades are assigned in the source ledger; the console does not re-grade them.</p>
              </div>
              <div className="program-mini-grid">
                <div><span>Transactions</span><b>{fmtInt(data.counts.transactions)}</b></div>
                <div><span>Fraud events</span><b>{fmtInt(data.counts.fraud)}</b></div>
                <div><span>Wall clock</span><b>{fmtDuration(data.run.durationSeconds)}</b></div>
                <div><span>Seed</span><b>{data.run.seed}</b></div>
              </div>
            </div>
          </section>

          <div className="grid grid-12 mt-16">
            <Panel
              className="span-7"
              title="The question this program answers"
              subtitle="Scope is deliberately single-program: one simulator, one temporal split, one evidence ledger."
              action={<span className="badge badge-neutral">8 research questions</span>}
            >
              <div className="program-question">
                <p>
                  How extreme is card-fraud imbalance, which signals survive a time-ordered boundary, and what does a leak-aware model actually buy a review team?
                </p>
                <div className="program-question-meta">
                  <span><Database /> {fmtInt(data.counts.transactions)} transactions</span>
                  <span><CalendarClock /> {data.run.start?.slice(0, 10)} → {data.run.end?.slice(0, 10)}</span>
                  <span><Target /> {data.run.codeCells} code cells</span>
                  <span><Boxes /> {data.counts.figures} figures</span>
                </div>
              </div>
              <div className="rq-grid">
                {data.researchQuestions.map((rq) => (
                  <Link className="rq-card" to={`/findings?rq=${rq.id}`} key={rq.id}>
                    <div className="rq-top">
                      <b>{rq.id}</b>
                      <span>{rq.findings} findings · {rq.strong} strong</span>
                    </div>
                    <p>{rq.question}</p>
                    <div className="rq-foot">
                      <span>{rq.phaseNames.join(" · ")}</span>
                      <ArrowUpRight />
                    </div>
                  </Link>
                ))}
              </div>
            </Panel>

            <div className="span-5 stack">
              <Panel title="Run provenance" subtitle="Verifiable facts from the run manifest.">
                <dl className="kv-list">
                  <div><dt>Run</dt><dd className="mono">{data.run.id}</dd></div>
                  <div><dt>Start</dt><dd>{fmtDateTime(data.run.start)}</dd></div>
                  <div><dt>End</dt><dd>{fmtDateTime(data.run.end)}</dd></div>
                  <div><dt>Reported / measured</dt><dd>{data.run.reportedMinutes} min / {fmtDuration(data.run.durationSeconds)}</dd></div>
                  <div><dt>Cells executed</dt><dd>{data.run.executedCells} / {data.run.codeCells}</dd></div>
                  <div><dt>Output cells</dt><dd>{data.reproducibility.cellsWithOutput} / {data.reproducibility.codeCells}</dd></div>
                  <div><dt>Tracebacks</dt><dd><StatusBadge status={String(data.reproducibility.errorOutputs)} /></dd></div>
                  <div><dt>Smoke mode</dt><dd>{String(data.run.smoke)}</dd></div>
                  <div><dt>Environment</dt><dd>{data.run.python} · {data.run.platform}</dd></div>
                </dl>
              </Panel>

              <Panel title="Source availability" subtitle="The reproducibility boundary is explicit.">
                <div className="source-list">
                  {data.sources.map((source) => (
                    <div key={source.name} className={`source-row ${source.present ? "present" : "absent"}`}>
                      {source.present ? <CheckCircle2 /> : <CircleAlert />}
                      <div>
                        <b>{source.name}</b>
                        <span>{source.role} · {fmtBytes(source.bytes)}{source.hash ? ` · ${source.hash}` : ""}</span>
                      </div>
                      <span className="source-state">{source.present ? "Present" : "Absent"}</span>
                    </div>
                  ))}
                </div>
                <SourceNote>Absent raw CSVs prevent a full re-run from this folder. The console reconstructs evidence from generated artifacts only.</SourceNote>
              </Panel>
            </div>
          </div>

          <Panel
            className="mt-16"
            title="Phase dossiers"
            subtitle="Each phase has a cell range, methods, evidence volume, limitations and a route into its analysis. Open a dossier for the full profile."
            action={
              <div className="filter-search compact">
                <Sparkles />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter phases" aria-label="Filter phases" />
              </div>
            }
          >
            {phases.length === 0 ? <EmptyState title="No phases match that search" /> : null}
            <div className="phase-dossiers">
              {phases.map((phase) => (
                <button type="button" className="phase-dossier" key={phase.id} onClick={() => openPhase(phase)} style={{ "--phase-accent": phase.accent } as React.CSSProperties}>
                  <div className="dossier-head">
                    <span className="phase-code">{phase.id} · §{phase.num}</span>
                    <StatusBadge status={phase.status} />
                  </div>
                  <h3>{phase.shortName}</h3>
                  <p>{phase.purpose}</p>
                  <div className="dossier-metrics">
                    <span><b>{phase.findingCount}</b> findings</span>
                    <span><b>{phase.strongCount}</b> strong</span>
                    <span><b>{phase.artifactCount}</b> artifacts</span>
                    <span><b>{phase.cellRange}</b> cells</span>
                  </div>
                  <div className="dossier-foot">
                    <span>Open dossier</span>
                    <ArrowUpRight />
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          <div className="grid grid-12 mt-16">
            <Panel className="span-7" title="Reproducibility checklist" subtitle={`${data.reproducibility.checklistPassed} of ${data.reproducibility.checklistTotal} recorded checks pass.`}>
              <div className="checklist">
                {data.reproducibility.checklist.map((item) => (
                  <div key={item.item} className={`check-row ${item.ok ? "ok" : "fail"}`}>
                    {item.ok ? <CheckCircle2 /> : <CircleAlert />}
                    <div><b>{item.item}</b><span>{item.evidence}</span></div>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="span-5 stack">
              <Panel title="What bounds the program" subtitle="Limits that should travel with any reuse.">
                <div className="limit-list">
                  {data.limits.map((limit) => (
                    <div key={limit.title}>
                      <b>{limit.title}</b>
                      <p>{limit.detail}</p>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Open workspace issues" subtitle="The highest-severity items are shown first." action={<Link className="btn btn-sm" to="/artifacts?tab=run">Run record <ArrowUpRight /></Link>}>
                <div className="issue-list">
                  {data.issues.slice().sort((a, b) => ({ High: 0, Medium: 1, Low: 2 }[a.severity] ?? 9) - ({ High: 0, Medium: 1, Low: 2 }[b.severity] ?? 9)).slice(0, 5).map((issue) => (
                    <div key={issue.id} className={`issue-row ${issue.severity.toLowerCase()}`}>
                      <span>{issue.id}</span>
                      <div><b>{issue.title}</b><small>{issue.category} · {issue.status}</small></div>
                      <span className="severity-label">{issue.severity}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </div>

          <div className="grid grid-3 mt-16">
            <Link className="panel pad link-panel" to="/lineage"><GitBranch /><h3>Evidence map</h3><p>Trace sources, notebook cells, phases, findings and artifacts with verified and inferred edges.</p><span>Open map <ArrowUpRight /></span></Link>
            <Link className="panel pad link-panel" to="/logs"><ScrollText /><h3>Run logs</h3><p>Inspect section boundaries, warnings, export skips and measurement lines without invented timestamps.</p><span>Open logs <ArrowUpRight /></span></Link>
            <Link className="panel pad link-panel" to="/metrics"><FlaskConical /><h3>Metric definitions</h3><p>155 catalogued metrics with formulas, source locators, validation checks and caveats.</p><span>Open catalog <ArrowUpRight /></span></Link>
          </div>

          <Drawer
            open={Boolean(selected)}
            onClose={closePhase}
            eyebrow={selected ? `${selected.id} · §${selected.num}` : undefined}
            title={selected?.name ?? ""}
            width={640}
            footer={selected ? (
              <div className="row-between wrap">
                <Link className="btn btn-sm btn-primary" to={selected.route}>Open phase analysis <ArrowUpRight /></Link>
                <Link className="btn btn-sm" to={`/findings?phase=${selected.id}`}>Findings in {selected.id} <ArrowUpRight /></Link>
              </div>
            ) : null}
          >
            {selected ? (
              <div className="dossier-detail">
                <div className="dossier-detail-top">
                  <ProvenanceBadge value={selected.status === "Complete" ? "verified" : "inferred"} />
                  <span className="mono">cells {selected.cellRange}</span>
                  <span>{selected.notebookCells} cells · {fmtInt(selected.outputChars)} output chars</span>
                </div>
                <p className="dossier-purpose">{selected.purpose}</p>
                <p>{selected.description}</p>
                <div className="detail-stat-grid">
                  <div><b>{selected.findingCount}</b><span>findings</span></div>
                  <div><b>{selected.strongCount}</b><span>strong</span></div>
                  <div><b>{selected.caveatCount}</b><span>caveats</span></div>
                  <div><b>{selected.artifactCount}</b><span>artifacts</span></div>
                </div>
                <h4 className="detail-heading">Methods</h4>
                <div className="method-list">{selected.methods.map((method) => <span key={method}>{titleCase(method)}</span>)}</div>
                <h4 className="detail-heading">Key findings</h4>
                <ul className="detail-findings">
                  {selected.topFindings.map((finding) => (
                    <li key={finding.id}>
                      <Link to={`/findings?finding=${finding.id}`}>{finding.id} · {finding.title}</Link>
                      <span>{finding.grade}</span>
                    </li>
                  ))}
                </ul>
                <h4 className="detail-heading">Limitations</h4>
                <ul className="detail-limits">{selected.limitations.map((limit) => <li key={limit}>{limit}</li>)}</ul>
                {selected.issues.length ? (
                  <>
                    <h4 className="detail-heading">Workspace issues</h4>
                    <ul className="detail-limits">{selected.issues.map((issue) => <li key={issue.id}>{issue.id} · {issue.title} ({issue.severity})</li>)}</ul>
                  </>
                ) : null}
                <SourceNote>Phase dossier generated from the manifest phase records and notebook cell ranges. Status reflects recorded execution, not an independent re-run.</SourceNote>
              </div>
            ) : null}
          </Drawer>
        </>
      )}
    </>
  );
}
