import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { EChartsOption } from "echarts";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Download,
  FilterX,
  ListChecks,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import type { AuditNote } from "../types";
import { useManifest } from "../context/AppContext";
import { Chart } from "../components/Chart";
import { Callout, EmptyState, GradeBadge, PageHeader, Panel, PhaseBadge, Segmented, SourceNote } from "../components/ui";
import { downloadCsv } from "../lib/csv";
import { muted } from "../lib/chartTheme";

const GRADE_ORDER = ["strong", "supports", "caveat", "weak"] as const;
const GRADE_COLORS: Record<string, string> = {
  strong: "#1f8a70",
  supports: "#3b6fd4",
  caveat: "#cb4257",
  weak: "#bd761b",
};
const GRADE_WEIGHT: Record<string, number> = { strong: 0, supports: 1, weak: 2, caveat: 3 };

function noteStatusClass(status: string) {
  if (status === "contradicted" || status === "discrepancy") return "badge badge-caveat";
  if (status === "method") return "badge badge-weak";
  return "badge badge-neutral";
}

function AuditDrawer({ note, onClose }: { note: AuditNote | null; onClose: () => void }) {
  useEffect(() => {
    if (!note) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = previous;
    };
  }, [note, onClose]);

  if (!note) return null;

  return (
    <>
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={note.title}>
        <div className="drawer-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              {note.id} · {note.phase} · audit note
            </div>
            <div className="drawer-title">{note.title}</div>
            <div className="mt-8">
              <span className={noteStatusClass(note.status)}>{note.status}</span>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close audit note">
            <X />
          </button>
        </div>
        <div className="drawer-body">
          <div className="drawer-section">
            <div className="drawer-label">Source claim</div>
            <p style={{ fontSize: 11.5, lineHeight: 1.6, color: "var(--text-soft)" }}>{note.claim}</p>
          </div>
          <div className="drawer-section">
            <div className="drawer-label">Observation</div>
            <p style={{ fontSize: 11.5, lineHeight: 1.6, color: "var(--text-soft)" }}>{note.observation}</p>
          </div>
          <div className="drawer-section">
            <div className="drawer-label">Implication</div>
            <div className="evidence-box" style={{ fontFamily: "var(--font-body)", fontSize: 11 }}>
              {note.implication}
            </div>
          </div>
          <div className="drawer-section">
            <div className="drawer-label">Sources</div>
            <div className="row wrap" style={{ gap: 6 }}>
              {note.sources.map((source) => (
                <span className="column-chip" key={source}>
                  {source}
                </span>
              ))}
            </div>
          </div>
          <div className="drawer-section">
            <Link className="btn btn-sm" to="/artifacts?tab=run" onClick={onClose}>
              Open run &amp; sources <ArrowUpRight />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function Findings() {
  const manifest = useManifest();
  const [params, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [rq, setRq] = useState(params.get("rq") ?? "all");
  const [phase, setPhase] = useState(params.get("phase") ?? "all");
  const [grade, setGrade] = useState(params.get("grade") ?? "all");
  const [sortMode, setSortMode] = useState("ledger");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [auditId, setAuditId] = useState<string | null>(null);
  const findingParam = params.get("finding");
  const noteParam = params.get("note");

  const findings = manifest.findings;
  const notes = manifest.auditNotes;
  const noteMap = useMemo(() => Object.fromEntries(notes.map((note) => [note.id, note])), [notes]);
  const linkedNotes = useMemo(() => new Set(findings.map((finding) => finding.auditNoteId).filter(Boolean)), [findings]);
  const activeNote = auditId ? noteMap[auditId] ?? null : null;

  useEffect(() => {
    if (!findingParam) return;
    if (!findings.some((finding) => finding.id === findingParam)) return;
    setExpanded((previous) => {
      const next = new Set(previous);
      next.add(findingParam);
      return next;
    });
    const timer = window.setTimeout(() => {
      document.getElementById(`finding-${findingParam}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 160);
    return () => window.clearTimeout(timer);
  }, [findingParam, findings]);

  useEffect(() => {
    if (!noteParam) return;
    if (!noteMap[noteParam]) return;
    setAuditId(noteParam);
    const timer = window.setTimeout(() => {
      document.getElementById(`audit-${noteParam}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [noteParam, noteMap]);

  const setParam = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };

  const reset = () => {
    setQuery("");
    setRq("all");
    setPhase("all");
    setGrade("all");
    setSortMode("ledger");
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const baseFiltered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return findings.filter((finding) => {
      if (rq !== "all" && finding.rq !== rq) return false;
      if (phase !== "all" && finding.phase !== phase) return false;
      if (!needle) return true;
      const haystack = `${finding.id} ${finding.rq} ${finding.rqText} ${finding.phaseName} ${finding.grade} ${finding.finding} ${finding.evidence} ${finding.sourceFile}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [findings, query, rq, phase]);

  const filtered = useMemo(() => {
    let rows = grade === "all" ? baseFiltered : baseFiltered.filter((finding) => finding.grade === grade);
    if (sortMode === "grade") {
      rows = [...rows].sort((a, b) => GRADE_WEIGHT[a.grade] - GRADE_WEIGHT[b.grade] || a.id.localeCompare(b.id));
    } else if (sortMode === "rq") {
      rows = [...rows].sort((a, b) => a.rq.localeCompare(b.rq) || a.id.localeCompare(b.id));
    }
    return rows;
  }, [baseFiltered, grade, sortMode]);

  const filteredGradeCounts = useMemo(() => {
    const counts: Record<string, number> = { strong: 0, supports: 0, weak: 0, caveat: 0 };
    for (const finding of baseFiltered) counts[finding.grade] += 1;
    return counts;
  }, [baseFiltered]);

  const phaseOptions = useMemo(
    () => manifest.phases.filter((item) => findings.some((finding) => finding.phase === item.id)),
    [manifest.phases, findings],
  );

  const chartOption = useMemo<EChartsOption>(() => {
    const rqRows = manifest.rqs.map((row) => ({
      ...row,
      counts: Object.fromEntries(
        GRADE_ORDER.map((key) => [key, findings.filter((finding) => finding.rq === row.id && finding.grade === key).length]),
      ) as Record<string, number>,
    }));
    return {
      grid: { left: 12, right: 30, top: 34, bottom: 8, containLabel: true },
      legend: {
        top: 0,
        left: 0,
        icon: "roundRect",
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 12,
        textStyle: { color: "#4e5563", fontSize: 10.5 },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const row = rqRows[params[0].dataIndex];
          return `<b>${row.id}</b> · ${row.findings} findings<br/><span style="opacity:.8">${row.question}</span><br/>Strong ${row.counts.strong} · Supports ${row.counts.supports}<br/>Caveat ${row.counts.caveat} · Weak ${row.counts.weak}`;
        },
      },
      xAxis: {
        type: "value",
        max: 20,
        axisLabel: { color: muted, fontSize: 10.5 },
        splitLine: { lineStyle: { color: "#efeae1" } },
      },
      yAxis: {
        type: "category",
        data: rqRows.map((row) => row.id),
        axisLabel: { color: "#4e5563", fontSize: 10.5 },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      series: GRADE_ORDER.map((key) => ({
        name: key === "supports" ? "Supports" : key.charAt(0).toUpperCase() + key.slice(1),
        type: "bar" as const,
        stack: "grades",
        barWidth: 17,
        data: rqRows.map((row) => row.counts[key]),
        itemStyle: { color: GRADE_COLORS[key] },
        emphasis: { focus: "series" as const },
        label: {
          show: true,
          position: "inside" as const,
          color: "#fff",
          fontSize: 10.5,
          formatter: (params: any) => (params.value > 0 ? String(params.value) : ""),
        },
      })),
    };
  }, [findings, manifest.rqs]);

  const toggleFinding = (id: string) => {
    const isOpen = expanded.has(id);
    setExpanded((previous) => {
      const next = new Set(previous);
      if (isOpen) next.delete(id);
      else next.add(id);
      return next;
    });
    const next = new URLSearchParams(params);
    if (isOpen) {
      if (next.get("finding") === id) next.delete("finding");
    } else {
      next.set("finding", id);
    }
    setSearchParams(next, { replace: true });
  };

  const setRqFilter = (nextRq: string) => {
    setRq(nextRq);
    setParam({ rq: nextRq === "all" ? null : nextRq });
  };

  const exportRows = filtered.map((finding) => ({
    id: finding.id,
    rq: finding.rq,
    phase: finding.phase,
    grade: finding.grade,
    finding: finding.finding,
    evidence: finding.evidence,
    sourceRow: finding.sourceRow,
    auditNoteId: finding.auditNoteId ?? "",
  }));

  const activeFilterCount = [query.trim() ? 1 : 0, rq !== "all" ? 1 : 0, phase !== "all" ? 1 : 0, grade !== "all" ? 1 : 0].reduce((sum, value) => sum + value, 0);

  return (
    <>
      <PageHeader
        eyebrow="P8 · Graded findings ledger"
        title={<>Sixty-four claims. <em>Four grades. Five audit notes.</em></>}
        description="Every finding below is transcribed from the project ledger, with its research question, phase, evidence excerpt, source row and grade. Strong findings carry direct quantitative evidence; caveats bound interpretation. The audit notes are independent checks that flag contradictions between a claim and its own numbers."
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => downloadCsv("findings_ledger_export.csv", exportRows)} disabled={!exportRows.length}>
              <Download />
              Export filtered
            </button>
            <a className="btn btn-sm" href="#audit-notes">
              <ShieldAlert />
              Audit notes
            </a>
          </>
        }
        meta={
          <div className="row wrap" style={{ gap: 7 }}>
            <span className="badge badge-phase">P8 report layer</span>
            <span className="badge badge-strong">30 strong</span>
            <span className="badge badge-supports">27 supports</span>
            <span className="badge badge-caveat">6 caveats</span>
            <span className="badge badge-weak">1 weak</span>
          </div>
        }
      />

      <div className="grid grid-12">
        <Panel
          className="span-5"
          title="Findings by research question"
          subtitle="Click a bar to filter the ledger to that RQ. Stacks show researcher-assigned grades."
          action={<span className="badge badge-neutral"><ListChecks size={10} />64 claims</span>}
        >
          <Chart
            option={chartOption}
            height={300}
            ariaLabel="Stacked bar chart of findings by research question and grade"
            onClick={(event) => {
              const name = event?.name;
              if (typeof name === "string" && name.startsWith("RQ")) setRqFilter(name);
            }}
          />
          <SourceNote>From <code>logs/findings_ledger.json</code>. Grades are researcher-assigned, not statistically derived. RQ8 carries 19 findings, the largest block.</SourceNote>
        </Panel>

        <Panel className="span-7" title="How to read a grade" subtitle="The ledger does not publish a formal rubric; these are the dashboard's operational definitions.">
          <div className="grid grid-2" style={{ gap: 10 }}>
            {manifest.gradeDefs.map((definition) => (
              <div key={definition.grade} className="panel pad" style={{ background: "var(--surface-2)" }}>
                <div className="row-between">
                  <span className="row" style={{ gap: 6 }}>
                    <span className="grade-dot" style={{ background: definition.color }} />
                    <b style={{ fontSize: 11.5 }}>{definition.label}</b>
                  </span>
                  <span className="num tiny muted">{manifest.gradeCounts[definition.grade] ?? 0} finding{(manifest.gradeCounts[definition.grade] ?? 0) === 1 ? "" : "s"}</span>
                </div>
                <p className="tiny muted mt-8" style={{ lineHeight: 1.5 }}>{definition.definition}</p>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <Callout tone="warn" title="A grade is not a p-value">
              <p>
                “Strong” means the ledger contains direct quantitative evidence with uncertainty or an explicit comparison.
                It does not mean the result is causal, externally valid, or free of generator artifacts. Read the caveats
                beside the claims they qualify.
              </p>
            </Callout>
          </div>
          <SourceNote>{linkedNotes.size} of {notes.length} audit notes are linked to at least one finding; AN-05 is note-only.</SourceNote>
        </Panel>
      </div>

      <Panel className="mt-16" noBody>
        <div className="artifact-toolbar">
          <label className="field grow">
            <Search />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setParam({ q: event.target.value || null });
              }}
              placeholder="Search claims, evidence, IDs, phases…"
              aria-label="Search findings"
            />
          </label>
          <label className="field">
            <span className="tiny muted">RQ</span>
            <select
              value={rq}
              onChange={(event) => setRqFilter(event.target.value)}
              aria-label="Filter by research question"
            >
              <option value="all">All RQs</option>
              {manifest.rqs.map((row) => (
                <option value={row.id} key={row.id}>
                  {row.id} · {row.findings}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="tiny muted">Phase</span>
            <select
              value={phase}
              onChange={(event) => {
                setPhase(event.target.value);
                setParam({ phase: event.target.value === "all" ? null : event.target.value });
              }}
              aria-label="Filter by phase"
            >
              <option value="all">All phases</option>
              {phaseOptions.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.id} · {item.short_name}
                </option>
              ))}
            </select>
          </label>
          <Segmented
            ariaLabel="Filter by grade"
            options={[
              { value: "all", label: "All" },
              { value: "strong", label: `Strong ${filteredGradeCounts.strong}` },
              { value: "supports", label: `Supports ${filteredGradeCounts.supports}` },
              { value: "weak", label: `Weak ${filteredGradeCounts.weak}` },
              { value: "caveat", label: `Caveat ${filteredGradeCounts.caveat}` },
            ]}
            value={grade}
            onChange={(value) => {
              setGrade(value);
              setParam({ grade: value === "all" ? null : value });
            }}
          />
          <label className="field">
            <span className="tiny muted">Sort</span>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value)} aria-label="Sort findings">
              <option value="ledger">Ledger order</option>
              <option value="grade">Grade</option>
              <option value="rq">Research question</option>
            </select>
          </label>
          <button type="button" className="btn btn-sm" onClick={reset} disabled={!activeFilterCount && sortMode === "ledger"}>
            <FilterX />
            Reset
          </button>
        </div>
        <div className="row-between" style={{ padding: "10px 16px", borderBottom: "1px solid var(--line)", flexWrap: "wrap", gap: 8 }}>
          <span className="tiny muted">
            Showing <b style={{ color: "var(--text)" }}>{filtered.length}</b> of {findings.length} findings
            {activeFilterCount ? ` · ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active` : ""}
          </span>
          <span className="tiny muted">
            {filtered.filter((finding) => finding.auditNoteId).length} audit-linked · evidence capped at 400 characters in source
          </span>
        </div>
      </Panel>

      <div className="mt-16">
        {filtered.length ? (
          <div className="stack" style={{ gap: 8 }}>
            {filtered.map((finding) => {
              const isOpen = expanded.has(finding.id);
              return (
                <article
                  key={finding.id}
                  id={`finding-${finding.id}`}
                  className={`finding-row ${isOpen ? "expanded" : ""}`}
                  onClick={() => toggleFinding(finding.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleFinding(finding.id);
                    }
                  }}
                >
                  <div className="finding-top">
                    <span className="finding-id">{finding.id}</span>
                    <GradeBadge grade={finding.grade} />
                    <PhaseBadge id={finding.phase} label={finding.phaseName} />
                    <span className="badge badge-neutral">{finding.rq}</span>
                    {finding.auditNoteId ? (
                      <button
                        type="button"
                        className="audit-pill"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (finding.auditNoteId) setAuditId(finding.auditNoteId);
                        }}
                        title={`Open ${finding.auditNoteId}`}
                      >
                        <ShieldAlert size={10} />
                        {finding.auditNoteId}
                      </button>
                    ) : null}
                    <span style={{ marginLeft: "auto", color: "var(--muted)" }}>
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  </div>
                  <div className="finding-text">{finding.finding}</div>
                  <div className="finding-foot">
                    <span>{finding.phaseName}</span>
                    <span className="sep" />
                    <span>Cells {finding.cellRange}</span>
                    <span className="sep" />
                    <span>Ledger row {finding.sourceRow}</span>
                    <span className="sep" />
                    <span>{finding.rq}</span>
                  </div>
                  {isOpen ? (
                    <div className="finding-evidence">
                      <div className="drawer-label">Evidence excerpt</div>
                      <p>{finding.evidence}</p>
                      <div className="row wrap mt-8" style={{ gap: 10 }}>
                        <span className="tiny muted">Source: {finding.sourceFile}</span>
                        <Link
                          className="insight-link"
                          to="/artifacts?tab=tables&table=findings_ledger"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Open ledger table <ArrowUpRight size={11} />
                        </Link>
                        {finding.auditNoteId ? (
                          <button
                            type="button"
                            className="insight-link"
                            style={{ background: "none", border: 0, padding: 0 }}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (finding.auditNoteId) setAuditId(finding.auditNoteId);
                            }}
                          >
                            Read audit note <ArrowUpRight size={11} />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <Panel>
            <EmptyState
              title="No findings match these filters"
              text="Clear one or more filters. The ledger contains 64 claims across eight research questions and four grades."
            />
            <div className="row" style={{ justifyContent: "center" }}>
              <button type="button" className="btn btn-sm" onClick={reset}>
                <FilterX />
                Clear filters
              </button>
            </div>
          </Panel>
        )}
      </div>

      <div id="audit-notes" className="mt-24">
        <div className="row-between mb-12" style={{ flexWrap: "wrap", gap: 8 }}>
          <div>
            <div className="eyebrow">Independent audit layer</div>
            <h2 className="serif" style={{ fontSize: 27, marginTop: 4, letterSpacing: "-.02em" }}>Five notes where the evidence needs a second look</h2>
          </div>
          <span className="badge badge-caveat">4 linked · 1 note-only</span>
        </div>
        <div className="grid grid-3" style={{ gap: 10 }}>
          {notes.map((note) => (
            <article
              key={note.id}
              id={`audit-${note.id}`}
              className={`finding-row ${noteParam === note.id ? "active" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => setAuditId(note.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setAuditId(note.id);
                }
              }}
            >
              <div className="finding-top">
                <span className="finding-id">{note.id}</span>
                <span className={noteStatusClass(note.status)}>{note.status}</span>
                <span className="badge badge-neutral">{note.phase}</span>
                {!linkedNotes.has(note.id) ? <span className="tiny muted" style={{ marginLeft: "auto" }}>note only</span> : null}
              </div>
              <div className="finding-text">{note.title}</div>
              <p className="tiny muted mt-8" style={{ lineHeight: 1.5 }}>
                {note.observation.length > 175 ? `${note.observation.slice(0, 174)}…` : note.observation}
              </p>
              <div className="finding-foot">
                <span>Open note</span>
                <span className="sep" />
                <span>{note.sources.length} sources</span>
              </div>
            </article>
          ))}
        </div>
      </div>

      <Panel className="mt-16" title="Ledger integrity" subtitle="What the 64-record export does and does not contain.">
        <div className="grid grid-3" style={{ gap: 12 }}>
          <Callout tone="info" title="Evidence is an excerpt">
            <p>
              The source ledger caps evidence at 400 characters. The dashboard shows the excerpt exactly as recorded and
              does not reconstruct missing text from figures or notebook cells.
            </p>
          </Callout>
          <Callout tone="warn" title="Grades are researcher-assigned">
            <p>
              There is no formal rubric in the notebook. The dashboard's definitions are operational glosses. Treat the
              grade as a routing signal for review, not an independent statistical certification.
            </p>
          </Callout>
          <Callout tone="success" title="Audit notes are additive">
            <p>
              The five notes were written for this reconstruction. They do not alter the ledger. Where a note contradicts a
              claim, the finding remains visible with a warning rather than being silently removed.
            </p>
          </Callout>
        </div>
        <SourceNote>Ledger: <code>logs/findings_ledger.json</code> · audit notes: <code>analytics/config.py</code> · counts verified against <code>tables/findings_ledger.csv</code>.</SourceNote>
      </Panel>

      <AuditDrawer note={activeNote} onClose={() => setAuditId(null)} />
    </>
  );
}
