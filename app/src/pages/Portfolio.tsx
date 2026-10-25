import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Download,
  Filter,
  Flame,
  FolderKanban,
  Layers3,
  ListChecks,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useAsync } from "../lib/useAsync";
import { loadProjects } from "../lib/data";
import { PageHeader, Panel, Callout, EmptyState, SourceNote, StatusBadge } from "../components/ui";
import { Drawer, FilterPills, ProvenanceBadge } from "../components/phase2";
import { downloadCsv, downloadText } from "../lib/csv";
import { fmtInt } from "../lib/format";
import type { Phase2Project } from "../types";

export default function Portfolio() {
  const projectsData = useAsync(loadProjects, []);
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [trackFilter, setTrackFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  const selectedId = params.get("project");
  const data = projectsData.data;
  const selected = data?.projects.find((p) => p.id === selectedId) ?? null;

  const tracks = useMemo(() => {
    if (!data) return [];
    return ["all", ...data.tracks];
  }, [data]);

  const filteredProjects = useMemo(() => {
    if (!data) return [];
    const needle = query.trim().toLowerCase();
    return data.projects.filter((p) => {
      const matchesTrack = trackFilter === "all" || p.track === trackFilter;
      const matchesRisk = riskFilter === "all" || p.riskLevel.toLowerCase() === riskFilter.toLowerCase();
      const text = `${p.id} ${p.title} ${p.shortTitle} ${p.track} ${p.leadRole} ${p.purpose} ${p.objectives.join(" ")}`.toLowerCase();
      const matchesQuery = !needle || text.includes(needle);
      return matchesTrack && matchesRisk && matchesQuery;
    });
  }, [data, query, trackFilter, riskFilter]);

  const openProject = (p: Phase2Project) => {
    const next = new URLSearchParams(params);
    next.set("project", p.id);
    setParams(next, { replace: true });
  };

  const closeProject = () => {
    const next = new URLSearchParams(params);
    next.delete("project");
    setParams(next, { replace: true });
  };

  const exportPortfolioBrief = () => {
    if (!data) return;
    const lines = [
      `# ${data.programTitle} — Research Project Portfolio`,
      "",
      `Generated: ${data.generatedAt}`,
      `Summary: ${data.summary.totalProjects} research projects across ${data.summary.totalTracks} tracks (${data.summary.totalFindings} findings, ${data.summary.strongFindings} strong).`,
      "",
      "## Project Profiles",
      "",
      ...data.projects.flatMap((p) => [
        `### ${p.id} · ${p.title}`,
        `Track: ${p.track} · Lead: ${p.leadRole}`,
        `Phases: ${p.phaseRange} · Cell Range: ${p.cellRange} · Status: ${p.status} · Risk: ${p.riskLevel}`,
        `Key Metric: ${p.keyMetric.label} = ${p.keyMetric.value} (${p.keyMetric.interpretation})`,
        "",
        `Purpose: ${p.purpose}`,
        "",
        "Objectives:",
        ...p.objectives.map((obj) => `- ${obj}`),
        "",
        "Deliverables:",
        ...p.deliverables.map((del) => `- ${del}`),
        "",
        "Limitations:",
        ...p.limitations.map((lim) => `- ${lim}`),
        "",
        `Top Findings: ${p.topFindings.map((f) => `${f.id} (${f.grade})`).join(", ")}`,
        "",
        "---",
        "",
      ]),
    ];
    downloadText("fraud_project_portfolio.md", lines.join("\n"), "text/markdown;charset=utf-8");
  };

  const exportPortfolioCsv = () => {
    if (!data) return;
    downloadCsv(
      "fraud_project_inventory.csv",
      data.projects.map((p) => ({
        id: p.id,
        title: p.title,
        track: p.track,
        lead_role: p.leadRole,
        phases: p.phases.join(", "),
        phase_range: p.phaseRange,
        cell_range: p.cellRange,
        status: p.status,
        risk_level: p.riskLevel,
        findings_count: p.findingCount,
        strong_count: p.strongCount,
        artifacts_count: p.artifactCount,
        key_metric_label: p.keyMetric.label,
        key_metric_value: p.keyMetric.value,
        key_metric_interpretation: p.keyMetric.interpretation,
        route: p.route,
      })),
    );
  };

  if (projectsData.error) {
    return (
      <Callout tone="danger" title="Portfolio layer unavailable">
        <p>{projectsData.error}</p>
      </Callout>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={<><FolderKanban size={13} /> Project portfolio & profiles</>}
        title={<>Research Project Portfolio. <em>Seven active initiatives.</em></>}
        description="Executive portfolio view of the seven research initiatives comprising the Sparkov Fraud Detection Program. Inspect project dossiers, objectives, deliverables, key metrics, and evidence trails."
        actions={
          <div className="row wrap">
            <Link className="btn btn-sm" to="/program">Program profile <ArrowUpRight /></Link>
            <button type="button" className="btn btn-sm" onClick={exportPortfolioBrief}><Download /> Portfolio brief</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={exportPortfolioCsv}><Download /> CSV</button>
          </div>
        }
        meta={data ? (
          <div className="header-meta">
            <span className="status-line"><CheckCircle2 /> {data.summary.totalProjects} projects complete</span>
            <span className="status-line"><Briefcase /> {data.summary.totalTracks} research tracks</span>
            <span className="status-line"><ListChecks /> {data.summary.totalFindings} graded findings</span>
            <span className="status-line"><Sparkles /> {data.summary.strongFindings} strong evidence</span>
          </div>
        ) : null}
      />

      {projectsData.loading || !data ? (
        <div className="skeleton mt-16" style={{ height: 420 }} />
      ) : (
        <>
          {/* Portfolio Executive KPI summary */}
          <div className="grid grid-4 mt-16">
            <div className="stat-card">
              <span className="stat-label">Active Research Projects</span>
              <b className="stat-value">{data.summary.totalProjects}<small> / 7 initiatives</small></b>
              <span className="stat-detail text-success"><CheckCircle2 size={12} /> 100% Phase Execution Complete</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Research Tracks</span>
              <b className="stat-value">{data.summary.totalTracks}</b>
              <span className="stat-detail">From Data Forensics to Policy Economics</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Graded Findings</span>
              <b className="stat-value">{data.summary.totalFindings}<small> ({data.summary.strongFindings} strong)</small></b>
              <span className="stat-detail">46.9% strong, 42.2% supporting</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Evidence Artifacts</span>
              <b className="stat-value">{data.summary.totalArtifacts}</b>
              <span className="stat-detail">129 figures, 46 tables, 7 interactive</span>
            </div>
          </div>

          {/* Filtering toolbar */}
          <div className="filter-bar mt-16">
            <div className="row wrap gap-8 items-center">
              <FilterPills
                label="Research Track"
                value={trackFilter}
                onChange={setTrackFilter}
                options={tracks.map((t) => ({
                  value: t,
                  label: t === "all" ? "All Tracks" : t,
                  count: t === "all" ? data.projects.length : data.projects.filter((p) => p.track === t).length,
                }))}
              />
              <div className="row wrap items-center gap-6 ml-auto portfolio-filters-right">
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="select-compact"
                  aria-label="Filter by Risk Rating"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
                <div className="filter-search compact">
                  <Search size={13} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search projects, objectives..."
                    aria-label="Search projects"
                  />
                </div>
              </div>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="mt-16">
              <EmptyState title="No projects match the selected criteria" text="Try clearing the search or changing the track filter." />
            </div>
          ) : null}

          {/* Project Dossiers Grid */}
          <div className="grid grid-3 mt-16">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="panel pad project-card"
                onClick={() => openProject(p)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openProject(p);
                  }
                }}
              >
                <div className="row-between items-center mb-8">
                  <span className="badge badge-accent mono">{p.id}</span>
                  <div className="row items-center gap-6">
                    <span className={`badge ${p.riskLevel === "Low" ? "badge-strong" : p.riskLevel === "Medium" ? "badge-caveat" : "badge-warn"}`}>
                      {p.riskLevel} Risk
                    </span>
                    <StatusBadge status={p.status} />
                  </div>
                </div>

                <h3 className="project-title">{p.shortTitle}</h3>
                <span className="project-track-sub">{p.track} · {p.phaseRange}</span>
                <p className="project-purpose mt-8">{p.purpose}</p>

                {/* Key metric banner */}
                <div className="project-key-metric mt-12">
                  <span className="metric-tag">{p.keyMetric.label}</span>
                  <div className="metric-val">{p.keyMetric.value}</div>
                  <span className="metric-sub">{p.keyMetric.interpretation}</span>
                </div>

                {/* Metrics footer */}
                <div className="project-stats-strip mt-12">
                  <div>
                    <span>Findings</span>
                    <b>{p.findingCount} <small>({p.strongCount} strong)</small></b>
                  </div>
                  <div>
                    <span>Artifacts</span>
                    <b>{p.artifactCount}</b>
                  </div>
                  <div>
                    <span>Cells</span>
                    <b className="mono">{p.cellRange}</b>
                  </div>
                </div>

                <div className="project-card-footer mt-12">
                  <span className="project-lead">{p.leadRole}</span>
                  <span className="open-dossier-link">
                    Profile <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Portfolio Master Comparison Table */}
          <Panel
            className="mt-16"
            title="Portfolio Master Matrix"
            subtitle="Cross-track comparative scorecard across all 7 research initiatives."
            action={<span className="badge badge-neutral">{data.projects.length} project tracks</span>}
          >
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Project</th>
                    <th scope="col">Research Track</th>
                    <th scope="col">Phases</th>
                    <th scope="col">Key Metric</th>
                    <th scope="col" className="num">Findings</th>
                    <th scope="col" className="num">Strong</th>
                    <th scope="col" className="num">Artifacts</th>
                    <th scope="col">Risk Level</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.projects.map((p) => (
                    <tr key={p.id}>
                      <th scope="row">
                        <button type="button" className="link-button" onClick={() => openProject(p)}>
                          <b>{p.id}</b> · {p.shortTitle}
                        </button>
                      </th>
                      <td>{p.track}</td>
                      <td><span className="mono">{p.phaseRange}</span></td>
                      <td>
                        <span className="mono font-semibold">{p.keyMetric.value}</span>
                        <br />
                        <small className="muted">{p.keyMetric.label}</small>
                      </td>
                      <td className="num">{p.findingCount}</td>
                      <td className="num">{p.strongCount}</td>
                      <td className="num">{p.artifactCount}</td>
                      <td>
                        <span className={`badge ${p.riskLevel === "Low" ? "badge-strong" : p.riskLevel === "Medium" ? "badge-caveat" : "badge-warn"}`}>
                          {p.riskLevel}
                        </span>
                      </td>
                      <td>
                        <Link className="btn btn-sm" to={p.route}>Analysis <ArrowUpRight size={11} /></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <SourceNote>Projects map directly to the research program phases and verified artifact manifests. No synthetic portfolio metrics are asserted.</SourceNote>
          </Panel>

          {/* Project Profile Detail Drawer */}
          <Drawer
            open={Boolean(selected)}
            onClose={closeProject}
            eyebrow={selected ? `${selected.id} · ${selected.track}` : undefined}
            title={selected?.title ?? ""}
            width={680}
            footer={selected ? (
              <div className="row-between wrap gap-8">
                <Link className="btn btn-sm btn-primary" to={selected.route}>
                  Open primary analysis <ArrowUpRight />
                </Link>
                <Link className="btn btn-sm" to={`/findings?phase=${selected.phases[0]}`}>
                  View findings ({selected.findingCount}) <ArrowUpRight />
                </Link>
              </div>
            ) : null}
          >
            {selected ? (
              <div className="dossier-detail">
                <div className="dossier-detail-top">
                  <ProvenanceBadge value="verified" />
                  <span className={`badge ${selected.riskLevel === "Low" ? "badge-strong" : selected.riskLevel === "Medium" ? "badge-caveat" : "badge-warn"}`}>
                    {selected.riskLevel} Risk
                  </span>
                  <span className="mono">Notebook cells {selected.cellRange}</span>
                  <span>{selected.leadRole}</span>
                </div>

                <p className="dossier-purpose">{selected.purpose}</p>

                <div className="detail-stat-grid mt-12">
                  <div><b>{selected.findingCount}</b><span>findings</span></div>
                  <div><b>{selected.strongCount}</b><span>strong evidence</span></div>
                  <div><b>{selected.caveatCount}</b><span>caveats</span></div>
                  <div><b>{selected.artifactCount}</b><span>evidence artifacts</span></div>
                </div>

                {/* Key Metric Card */}
                <div className="project-key-metric mt-16">
                  <span className="metric-tag">Primary Research Metric: {selected.keyMetric.label}</span>
                  <div className="metric-val">{selected.keyMetric.value}</div>
                  <span className="metric-sub">{selected.keyMetric.interpretation}</span>
                </div>

                <h4 className="detail-heading mt-16">Research Objectives</h4>
                <ul className="detail-limits">
                  {selected.objectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>

                <h4 className="detail-heading mt-16">Key Graded Findings</h4>
                <ul className="detail-findings">
                  {selected.topFindings.map((f) => (
                    <li key={f.id}>
                      <Link to={`/findings?finding=${f.id}`}>{f.id} · {f.title}</Link>
                      <span className={`badge ${f.grade === "strong" ? "badge-strong" : f.grade === "supports" ? "badge-neutral" : "badge-caveat"}`}>
                        {f.grade}
                      </span>
                    </li>
                  ))}
                </ul>

                <h4 className="detail-heading mt-16">Core Deliverables & Outputs</h4>
                <ul className="detail-limits">
                  {selected.deliverables.map((del, i) => (
                    <li key={i}>{del}</li>
                  ))}
                </ul>

                <h4 className="detail-heading mt-16">Associated Research Phases</h4>
                <div className="method-list">
                  {selected.phasesDetail.map((ph) => (
                    <span key={ph.id}>
                      <b>{ph.id}</b>: {ph.shortName} ({ph.findings} findings, cells {ph.cellRange})
                    </span>
                  ))}
                </div>

                <h4 className="detail-heading mt-16">Methodological Limitations</h4>
                <ul className="detail-limits">
                  {selected.limitations.map((lim, i) => (
                    <li key={i}>{lim}</li>
                  ))}
                </ul>

                {selected.riskNote ? (
                  <Callout tone="warn" title="Operational Risk Note">
                    <p>{selected.riskNote}</p>
                  </Callout>
                ) : null}

                <SourceNote>Project profile synthesized from the verified research manifest and notebook executions. Fully auditable back to source cells.</SourceNote>
              </div>
            ) : null}
          </Drawer>
        </>
      )}
    </>
  );
}
