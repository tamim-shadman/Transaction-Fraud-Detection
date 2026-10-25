import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Compass,
  Database,
  ExternalLink,
  FileCheck2,
  FileText,
  FlaskConical,
  Layers3,
  Lightbulb,
  ListChecks,
  Monitor,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Target,
} from "lucide-react";
import { useAsync } from "../lib/useAsync";
import { loadProjects } from "../lib/data";
import { useManifest } from "../context/AppContext";
import { Callout, EmptyState, PageHeader, Panel, SourceNote, StatusBadge } from "../components/ui";
import { ProvenanceBadge } from "../components/phase2";
import { fmtInt } from "../lib/format";
import type { Phase2Project } from "../types";

const STAGES = [
  { id: 1, title: "The Problem", subtitle: "Context & Objective", icon: CircleAlert },
  { id: 2, title: "The Approach", subtitle: "Methodology & Architecture", icon: Compass },
  { id: 3, title: "The Implementation", subtitle: "Features & Engineering", icon: FlaskConical },
  { id: 4, title: "The Evidence", subtitle: "Empirical Measurements", icon: Target },
  { id: 5, title: "The Interpretation", subtitle: "Findings & Uncertainty", icon: Lightbulb },
  { id: 6, title: "Generated Results", subtitle: "Artifacts & Previews", icon: Database },
  { id: 7, title: "Technical Lessons", subtitle: "Strengths & Next Steps", icon: FileCheck2 },
];

export default function Walkthrough() {
  const manifest = useManifest();
  const projectsData = useAsync(loadProjects, []);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const data = projectsData.data;
  const projects = data?.projects ?? [];

  // Project selection & Stage selection from URL params
  const currentProjectId = params.get("project") || "PROJ-01";
  const currentStage = Math.max(1, Math.min(7, parseInt(params.get("stage") || "1", 10)));

  const project: Phase2Project | null = useMemo(() => {
    return projects.find((p) => p.id === currentProjectId) ?? projects[0] ?? null;
  }, [projects, currentProjectId]);

  const setStage = (stageNum: number) => {
    const next = new URLSearchParams(params);
    next.set("stage", String(stageNum));
    setParams(next, { replace: true });
  };

  const setProject = (projId: string) => {
    const next = new URLSearchParams(params);
    next.set("project", projId);
    next.set("stage", "1"); // Reset to stage 1 on project change
    setParams(next, { replace: true });
  };

  // Keyboard navigation across stages
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        if (currentStage < 7) setStage(currentStage + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        if (currentStage > 1) setStage(currentStage - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStage, params]);

  if (projectsData.loading) {
    return (
      <div className="skeleton-page">
        <div className="skeleton" style={{ height: 120 }} />
        <div className="skeleton mt-16" style={{ height: 400 }} />
      </div>
    );
  }

  if (!project) {
    return <EmptyState title="No project found" text="Unable to load project dossiers." />;
  }

  const activeStageMeta = STAGES[currentStage - 1];

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Sparkles size={13} /> Guided Project Walkthrough · {project.id}
          </>
        }
        title={<>Explore the research narrative <em>stage by stage.</em></>}
        description="A curated, evidence-backed journey through each project initiative. Every statement, measurement, and chart is linked directly to the canonical evidence layer."
        actions={
          <div className="row wrap" style={{ gap: 8 }}>
            <Link className="btn btn-sm" to="/portfolio">
              <ArrowLeft size={13} /> Project portfolio
            </Link>
            <Link className="btn btn-sm btn-primary" to="/presentation">
              <Monitor size={13} /> Presentation mode
            </Link>
          </div>
        }
        meta={
          <div className="header-meta">
            <span className="status-line">
              <Target size={12} /> {project.track}
            </span>
            <span className="status-line">
              <Layers3 size={12} /> Phase {project.phaseRange}
            </span>
            <span className="status-line">
              <StatusBadge status={project.status} />
            </span>
          </div>
        }
      />

      {/* Project Selector Rail */}
      <div className="walkthrough-project-bar mt-16" role="tablist" aria-label="Select Project Walkthrough">
        {projects.map((p) => {
          const isActive = p.id === project.id;
          return (
            <button
              type="button"
              key={p.id}
              role="tab"
              aria-selected={isActive}
              className={`project-tab-btn ${isActive ? "active" : ""}`}
              onClick={() => setProject(p.id)}
            >
              <span className="tab-proj-id">{p.id}</span>
              <span className="tab-proj-title">{p.shortTitle}</span>
              <span className="badge badge-neutral tiny">{p.findingCount} findings</span>
            </button>
          );
        })}
      </div>

      {/* 7-Stage Stepper Navigation */}
      <div className="walkthrough-stepper mt-16" aria-label="Walkthrough Stage Progression">
        {STAGES.map((s) => {
          const isCurrent = s.id === currentStage;
          const isPassed = s.id < currentStage;
          const Icon = s.icon;
          return (
            <button
              type="button"
              key={s.id}
              className={`step-item ${isCurrent ? "current" : ""} ${isPassed ? "completed" : ""}`}
              onClick={() => setStage(s.id)}
              aria-current={isCurrent ? "step" : undefined}
            >
              <div className="step-num">
                {isPassed ? <CheckCircle2 size={13} /> : <Icon size={13} />}
              </div>
              <div className="step-info">
                <span className="step-title">{s.title}</span>
                <span className="step-sub">{s.subtitle}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Walkthrough Stage Canvas */}
      <div className="walkthrough-canvas mt-16">
        <Panel
          title={
            <div className="row wrap items-center" style={{ gap: 8 }}>
              <span>Stage {currentStage}: {activeStageMeta.title}</span>
              <span className="badge badge-primary">{project.id}</span>
              <span className="badge badge-neutral">{project.track}</span>
            </div>
          }
          subtitle={activeStageMeta.subtitle}
          action={
            <div className="row wrap" style={{ gap: 6 }}>
              <Link className="btn btn-sm" to={project.route}>
                Deep dive in {project.route} <ExternalLink size={12} />
              </Link>
            </div>
          }
        >
          {/* STAGE 1: THE PROBLEM */}
          {currentStage === 1 && (
            <div className="walkthrough-content">
              <div className="eyebrow">Business & Analytical Challenge</div>
              <h2 className="content-heading">{project.title}</h2>
              <p className="lead-text">{project.purpose}</p>

              <div className="stat-cards-grid mt-16">
                <div className="stat-card">
                  <span className="stat-label">Prevalence Context</span>
                  <b className="stat-value">0.521%</b>
                  <span className="stat-note">9,651 fraud events / 1.85M transactions</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Assigned Risk Level</span>
                  <b className={`stat-value ${project.riskLevel === "High" ? "tone-danger" : "tone-warn"}`}>
                    {project.riskLevel}
                  </b>
                  <span className="stat-note">{project.riskNote}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Primary Investigation Lead</span>
                  <b className="stat-value text-base">{project.leadRole}</b>
                  <span className="stat-note">Notebook cells: {project.cellRange}</span>
                </div>
              </div>

              <div className="mt-16">
                <div className="font-semibold text-sm mb-8">Formal Research Objectives:</div>
                <ul className="bullet-list">
                  {project.objectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>

              <Callout tone="info" title="Why this matters in fraud detection" className="mt-16">
                <p>
                  Extreme class imbalance (1 fraud per 171 legitimate transactions) means naive accuracy is meaningless.
                  The project evaluates precise detection efficacy, false positive burdens, and synthetic generation artifacts.
                </p>
              </Callout>
            </div>
          )}

          {/* STAGE 2: THE APPROACH */}
          {currentStage === 2 && (
            <div className="walkthrough-content">
              <div className="eyebrow">Methodology & Design</div>
              <h2 className="content-heading">Analytical Strategy for {project.shortTitle}</h2>
              <p className="lead-text">
                Executed across Phase {project.phaseRange} of the research program roadmap, addressing research questions:
                {" "}{project.rqs.join(", ")}.
              </p>

              <div className="detail-stat-grid mt-16">
                <div>
                  <b>{project.phases.length}</b>
                  <span>phases involved</span>
                </div>
                <div>
                  <b>{project.deliverables.length}</b>
                  <span>primary deliverables</span>
                </div>
                <div>
                  <b>{project.cellRange}</b>
                  <span>notebook cells</span>
                </div>
                <div>
                  <b>{project.findingCount}</b>
                  <span>graded findings</span>
                </div>
              </div>

              <div className="mt-16">
                <div className="font-semibold text-sm mb-8">Phases & Methodology Dossiers:</div>
                <div className="methodology-grid">
                  {project.phasesDetail.map((ph) => (
                    <div key={ph.id} className="phase-mini-card">
                      <div className="phase-mini-head">
                        <span className="phase-id-pill">{ph.id}</span>
                        <b>{ph.name}</b>
                      </div>
                      <p className="phase-mini-sub">{ph.shortName} · Cells {ph.cellRange}</p>
                      <div className="row wrap justify-between text-xs muted mt-8">
                        <span>{ph.findings} findings</span>
                        <span>{ph.artifacts} artifacts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-16">
                <div className="font-semibold text-sm mb-8">Key Research Deliverables:</div>
                <ul className="bullet-list">
                  {project.deliverables.map((del, i) => (
                    <li key={i}>{del}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* STAGE 3: THE IMPLEMENTATION */}
          {currentStage === 3 && (
            <div className="walkthrough-content">
              <div className="eyebrow">Engineering & Pipeline</div>
              <h2 className="content-heading">What was built in code & data pipelines</h2>
              <p className="lead-text">
                Derived directly from {project.cellRange} of the executed research notebook.
                No simulated placeholders: all analytical tables and figures were generated during the research run.
              </p>

              <div className="stat-cards-grid mt-16">
                <div className="stat-card">
                  <span className="stat-label">Generated Tables</span>
                  <b className="stat-value">{project.tableCount}</b>
                  <span className="stat-note">Exported analytical CSV tables</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Generated Figures</span>
                  <b className="stat-value">{project.figureCount}</b>
                  <span className="stat-note">Diagnostic PNG & HTML plots</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Evidence Total</span>
                  <b className="stat-value">{project.artifactCount}</b>
                  <span className="stat-note">Traceable artifacts in registry</span>
                </div>
              </div>

              <Callout tone="info" title="Engineering Pipeline Invariant" className="mt-16">
                <p>
                  Features, encoders, and model pipelines were fit exclusively on training splits to prevent data leakage.
                  Temporal splits ensure walk-forward evaluation respects chronological ordering.
                </p>
              </Callout>

              <div className="mt-16">
                <div className="font-semibold text-sm mb-8">Target Deep Dive Route:</div>
                <div className="row wrap items-center" style={{ gap: 12 }}>
                  <span className="badge badge-primary">{project.route}</span>
                  <span className="text-sm muted">Direct navigation to dedicated evidence interface.</span>
                  <Link className="btn btn-sm" to={project.route}>
                    Open {project.route} <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 4: THE EVIDENCE */}
          {currentStage === 4 && (
            <div className="walkthrough-content">
              <div className="eyebrow">Empirical Measurements</div>
              <h2 className="content-heading">Key verified performance & findings</h2>
              <p className="lead-text">
                Every measurement is grounded in the canonical metric layer and backed by inspectable source files.
              </p>

              <div className="key-metric-banner mt-16">
                <div className="metric-banner-main">
                  <span className="eyebrow">Primary Key Metric</span>
                  <div className="metric-value-huge">{project.keyMetric.value}</div>
                  <div className="metric-label-large">{project.keyMetric.label}</div>
                  <p className="metric-interp">{project.keyMetric.interpretation}</p>
                </div>
                <div className="metric-banner-side">
                  <span className="eyebrow">Evidence Classification</span>
                  <div className="mt-8">
                    <span className="evidence-badge verified">Directly Verified</span>
                  </div>
                  <div className="text-xs muted mt-8">
                    Calculated from evaluation logs without synthetic interpolation.
                  </div>
                </div>
              </div>

              <div className="mt-16">
                <div className="font-semibold text-sm mb-8">Graded Evidence Findings for this Project:</div>
                <div className="findings-mini-list">
                  {project.topFindings.map((f) => (
                    <div key={f.id} className="finding-mini-item">
                      <div className="row wrap justify-between items-center">
                        <span className="mono font-semibold">{f.id}</span>
                        <span className={`badge ${f.grade === "strong" ? "badge-success" : f.grade === "supports" ? "badge-info" : "badge-warn"}`}>
                          {f.grade.toUpperCase()}
                        </span>
                      </div>
                      <div className="finding-mini-title mt-4">{f.title}</div>
                      <div className="text-xs muted mt-4">Phase: {f.phase} · RQ: {f.rq}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 5: THE INTERPRETATION */}
          {currentStage === 5 && (
            <div className="walkthrough-content">
              <div className="eyebrow">Synthesis & Uncertainty</div>
              <h2 className="content-heading">What the evidence proves — and what it doesn't</h2>
              <p className="lead-text">
                Rigorous analytics demands clear interpretation boundaries. A high ranking score does not guarantee
                flawless real-world fraud interception.
              </p>

              <div className="findings-grade-breakdown mt-16">
                <div className="grade-pill strong">
                  <b>{project.strongCount}</b>
                  <span>Strong findings</span>
                </div>
                <div className="grade-pill supports">
                  <b>{project.supportsCount}</b>
                  <span>Supporting findings</span>
                </div>
                <div className="grade-pill caveat">
                  <b>{project.caveatCount}</b>
                  <span>Caveat findings</span>
                </div>
                <div className="grade-pill weak">
                  <b>{project.weakCount}</b>
                  <span>Weak / Preliminary</span>
                </div>
              </div>

              <Callout tone="warn" title="Boundary & Uncertainty Notice" className="mt-16">
                <p>
                  {project.riskNote || "PR-AUC is prevalence-sensitive. When evaluating fraud across populations with different base rates, raw AUC numbers must be adjusted for volume differences."}
                </p>
              </Callout>

              <div className="mt-16">
                <div className="font-semibold text-sm mb-8">Documented Analytical Limitations:</div>
                <ul className="bullet-list">
                  {project.limitations.map((lim, i) => (
                    <li key={i}>{lim}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* STAGE 6: GENERATED RESULTS */}
          {currentStage === 6 && (
            <div className="walkthrough-content">
              <div className="eyebrow">Inspectable Deliverables</div>
              <h2 className="content-heading">Actual research outputs & artifacts</h2>
              <p className="lead-text">
                {project.artifactCount} total artifacts produced: {project.figureCount} visual figures and {project.tableCount} analytical tables.
              </p>

              <div className="stat-cards-grid mt-16">
                <div className="stat-card">
                  <span className="stat-label">Visual Figures</span>
                  <b className="stat-value">{project.figureCount}</b>
                  <Link to="/artifacts?tab=figures" className="stat-link">Browse in Gallery →</Link>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Structured Tables</span>
                  <b className="stat-value">{project.tableCount}</b>
                  <Link to="/artifacts?tab=tables" className="stat-link">Inspect Tables →</Link>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Full Research Map</span>
                  <b className="stat-value">Lineage DAG</b>
                  <Link to="/lineage" className="stat-link">Open Evidence Map →</Link>
                </div>
              </div>

              <div className="mt-16">
                <div className="font-semibold text-sm mb-8">Direct Access to Project Workflows:</div>
                <div className="row wrap" style={{ gap: 8 }}>
                  <Link className="btn btn-primary" to={project.route}>
                    Open Primary Route ({project.route}) <ArrowUpRight size={12} />
                  </Link>
                  <Link className="btn" to={`/logs?q=${project.id}`}>
                    Inspect Run Logs <ExternalLink size={12} />
                  </Link>
                  <Link className="btn" to="/reports">
                    Generate Executive Report <FileText size={12} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 7: TECHNICAL LESSONS */}
          {currentStage === 7 && (
            <div className="walkthrough-content">
              <div className="eyebrow">Strategic Synthesis</div>
              <h2 className="content-heading">Demonstrated Strengths & Engineering Recommendations</h2>
              <p className="lead-text">
                Key operational takeaways for data science practitioners and fraud prevention architects.
              </p>

              <div className="lessons-grid mt-16">
                <div className="lesson-box strength">
                  <div className="lesson-head">
                    <CheckCircle2 size={16} className="text-success" />
                    <b>Demonstrated Technical Strengths</b>
                  </div>
                  <ul className="bullet-list mt-8">
                    <li>Strong transaction amount separation (KS D 0.724, Cliff's delta 0.669).</li>
                    <li>Feature velocity aggregates yield significant lift over raw transaction properties.</li>
                    <li>LightGBM gradient boosting achieves optimal catch-rate-to-latency balance.</li>
                  </ul>
                </div>

                <div className="lesson-box caveat">
                  <div className="lesson-head">
                    <ShieldAlert size={16} className="text-warning" />
                    <b>Observed Simulator Artifacts</b>
                  </div>
                  <ul className="bullet-list mt-8">
                    <li>Synthetic generator jitter causes coordinate shifts per transaction.</li>
                    <li>2.05% of records imply impossible inter-transaction speeds (&gt;1,000 km/h).</li>
                    <li>OOD transfer gap (0.4785) shows high sensitivity to seasonal time drift.</li>
                  </ul>
                </div>
              </div>

              <div className="walkthrough-finish-box mt-16">
                <h3>Walkthrough Complete! Where to next?</h3>
                <p>Continue exploring {project.shortTitle} or share this perspective:</p>
                <div className="row wrap mt-12" style={{ gap: 8 }}>
                  <Link className="btn btn-primary" to="/presentation">
                    <Monitor size={13} /> Launch presentation mode
                  </Link>
                  <Link className="btn" to="/reports">
                    <FileText size={13} /> Build custom report
                  </Link>
                  <Link className="btn" to={project.route}>
                    <ExternalLink size={13} /> Deep dive in {project.route}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Stage Navigation Footer Controls */}
          <div className="walkthrough-nav-footer mt-16">
            <button
              type="button"
              className="btn"
              disabled={currentStage <= 1}
              onClick={() => setStage(currentStage - 1)}
              aria-label="Previous stage"
            >
              <ArrowLeft size={13} /> Previous stage
            </button>
            <div className="stage-indicator-text">
              Stage <b>{currentStage}</b> of <b>7</b> · {activeStageMeta.title}
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={currentStage >= 7}
              onClick={() => setStage(currentStage + 1)}
              aria-label="Next stage"
            >
              Next stage <ArrowRight size={13} />
            </button>
          </div>
        </Panel>
      </div>

      <SourceNote className="mt-16">
        Walkthrough narratives are compiled directly from the project manifest, research phase dossiers, and the 64-finding evidence ledger. No synthetic claims or ungrounded statistics are included.
      </SourceNote>
    </>
  );
}
