import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ChevronDown,
  CircleAlert,
  Download,
  FileText,
  Info,
  Layers3,
  ScrollText,
  Search,
  Terminal,
} from "lucide-react";
import { useAsync } from "../lib/useAsync";
import { loadLogs } from "../lib/data";
import { PageHeader, Panel, Callout, EmptyState, SourceNote, StatusBadge } from "../components/ui";
import { FilterPills, SourceChip } from "../components/phase2";
import { downloadCsv } from "../lib/csv";
import { fmtInt } from "../lib/format";
import type { Phase2LogEvent } from "../types";

const PAGE = 80;

const signatureOf = (message: string): string =>
  message
    .toLowerCase()
    .replace(/\/content\/outputs\/\S+/g, "<path>")
    .replace(/\b[0-9a-f]{8,}\b/g, "<hash>")
    .replace(/\b\d+(?:\.\d+)?\b/g, "#")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);

export default function Logs() {
  const logs = useAsync(loadLogs, []);
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<"events" | "patterns">("events");
  const [limit, setLimit] = useState(PAGE);
  const severity = params.get("severity") ?? "all";
  const category = params.get("category") ?? "all";
  const phase = params.get("phase") ?? "all";
  const source = params.get("source") ?? "all";
  const query = params.get("q") ?? "";
  const pattern = params.get("pattern");

  const data = logs.data;
  const events = data?.events ?? [];

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    setParams(next, { replace: true });
    setLimit(PAGE);
  };

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return events.filter((event) => {
      if (severity !== "all" && event.severity !== severity) return false;
      if (category !== "all" && event.category !== category) return false;
      if (phase !== "all" && event.phase !== phase) return false;
      if (source !== "all" && event.source !== source) return false;
      if (pattern) {
        const found = data?.patterns.find((item) => item.id === pattern);
        if (found && signatureOf(event.message) !== found.signature) return false;
      }
      if (!needle) return true;
      return `${event.message} ${event.raw} ${event.phase} ${event.sourceLabel} ${event.category}`.toLowerCase().includes(needle);
    });
  }, [events, severity, category, phase, source, query, pattern, data]);

  const categories = useMemo(() => Array.from(new Set(events.map((event) => event.category))).sort(), [events]);
  const phases = useMemo(() => Array.from(new Set(events.map((event) => event.phase))).sort(), [events]);
  const sources = useMemo(() => Array.from(new Set(events.map((event) => event.source))).sort(), [events]);

  const exportEvents = () => {
    downloadCsv(
      "fraud_run_log_events.csv",
      filtered.map((event) => ({
        id: event.id,
        source: event.source,
        source_label: event.sourceLabel,
        cell: event.cell ?? "",
        line: event.line ?? "",
        phase: event.phase,
        severity: event.severity,
        category: event.category,
        message: event.message,
      })),
    );
  };

  const summary = data?.summary;

  return (
    <>
      <PageHeader
        eyebrow={<><ScrollText size={13} /> Run record</>}
        title={<>What the run <em>actually logged.</em></>}
        description="Every recorded line from the notebook outputs, the warning register, the build log and the UI smoke log — classified by severity and category. No timestamps are invented where the sources have none."
        actions={
          <div className="row wrap">
            <SourceChip to="/artifacts?tab=notebook">Open notebook</SourceChip>
            <button type="button" className="btn btn-sm btn-primary" onClick={exportEvents}><Download /> Export {fmtInt(filtered.length)} events</button>
          </div>
        }
        meta={summary ? (
          <div className="header-meta">
            <span className="status-line"><Terminal /> {fmtInt(summary.totalEvents)} events</span>
            <span className="status-line"><AlertTriangle /> {fmtInt(summary.warningCount)} warning events</span>
            <span className="status-line"><CircleAlert /> {fmtInt(summary.errorCount)} error events</span>
            <span className="status-line"><FileText /> {fmtInt(summary.artifactWrites)} artifact writes</span>
          </div>
        ) : null}
      />

      {summary ? (
        <div className="log-summary-grid mt-16">
          <div className="summary-tile accent">
            <span>Error events</span>
            <b>{summary.errorCount}</b>
            <small>{summary.tracebacks} tracebacks recorded by the run</small>
          </div>
          <div className="summary-tile">
            <span>Warning events</span>
            <b>{summary.rawWarningEvents}</b>
            <small>{summary.exportSkips} unique skipped static exports</small>
          </div>
          <div className="summary-tile">
            <span>Patterns</span>
            <b>{summary.patterns}</b>
            <small>normalised message signatures</small>
          </div>
          <div className="summary-tile">
            <span>Cells with output</span>
            <b>{summary.cellsWithOutput}<small> / {summary.codeCells}</small></b>
            <small>code cells executed</small>
          </div>
        </div>
      ) : null}

      <Callout tone="info" title="Timestamps are not available in these sources">
        <p>{summary?.timestampNote}</p>
      </Callout>

      <div className="grid grid-12 mt-16">
        <Panel
          className="span-7"
          title="Warning families"
          subtitle="Grouped from the warning register so one event is not counted twice."
        >
          <div className="warning-family-list">
            {(data?.warningFamilies ?? []).map((family) => (
              <div key={family.id} className={`warning-family ${family.severity}`}>
                <div className="wf-head">
                  <b>{family.label}</b>
                  <span className="count-badge">{family.count}</span>
                </div>
                <p>{family.observations}</p>
                <p className="wf-interpretation">{family.interpretation}</p>
                {family.targets?.length ? (
                  <div className="wf-targets">
                    {family.targets.map((target) => <code key={target}>{target}</code>)}
                  </div>
                ) : null}
                {family.evidence?.length ? (
                  <details className="wf-evidence">
                    <summary>Recorded evidence</summary>
                    {family.evidence.map((line, index) => <pre key={index}>{line}</pre>)}
                  </details>
                ) : null}
                {family.links?.length ? (
                  <div className="row wrap">
                    {family.links.map((link) => <Link className="btn btn-sm" key={link} to={link}>Open related evidence</Link>)}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          className="span-5"
          title="Severity and sources"
          subtitle="How the run record is distributed."
          action={<span className="badge badge-neutral">{fmtInt(filtered.length)} in view</span>}
        >
          <div className="severity-breakdown">
            {Object.entries(summary?.bySeverity ?? {}).map(([key, value]) => (
              <div key={key} className={`severity-bar ${key}`}>
                <span>{key}</span>
                <div className="bar-track"><span style={{ width: `${summary ? (value / summary.totalEvents) * 100 : 0}%` }} /></div>
                <b>{value}</b>
              </div>
            ))}
          </div>
          <div className="source-breakdown">
            {(summary?.sources ?? []).map((item) => (
              <div key={item.id} className="source-row present">
                <Layers3 />
                <div><b>{item.label}</b><span>{item.path}</span></div>
                <span className="source-state">{item.events}</span>
              </div>
            ))}
          </div>
          <SourceNote>Severity legend: {Object.entries(data?.severityLegend ?? {}).map(([key, value]) => `${key} — ${value}`).join(" ")}</SourceNote>
        </Panel>
      </div>

      <div className="filter-bar mt-16">
        <div className="filter-search">
          <Search />
          <input value={query} onChange={(event) => update({ q: event.target.value || null })} placeholder="Search log text, cell, phase" aria-label="Search log events" />
        </div>
        <FilterPills
          label="Severity"
          value={severity}
          onChange={(value) => update({ severity: value === "all" ? null : value })}
          options={[
            { value: "all", label: "All severities" },
            ...Object.entries(summary?.bySeverity ?? {}).map(([key, value]) => ({ value: key, label: key, count: value })),
          ]}
        />
        <FilterPills
          label="Category"
          value={category}
          onChange={(value) => update({ category: value === "all" ? null : value })}
          options={[
            { value: "all", label: "All categories" },
            ...categories.map((item) => ({ value: item, label: item })),
          ]}
        />
        <select className="select" value={phase} onChange={(event) => update({ phase: event.target.value === "all" ? null : event.target.value })} aria-label="Filter by phase">
          <option value="all">All phases</option>
          {phases.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="select" value={source} onChange={(event) => update({ source: event.target.value === "all" ? null : event.target.value })} aria-label="Filter by source">
          <option value="all">All sources</option>
          {sources.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      {pattern ? (
        <div className="active-filter">
          Pattern {pattern} is filtering the event list.
          <button type="button" className="btn btn-sm" onClick={() => update({ pattern: null })}>Clear pattern</button>
        </div>
      ) : null}

      <div className="mt-16">
        <Panel
          title={view === "events" ? "Event stream" : "Message patterns"}
          subtitle={view === "events" ? "Sequence is preserved by cell and line number." : "Normalised signatures collapse repeated lines such as skipped exports."}
          action={
            <div className="row">
              <button type="button" className={`btn btn-sm ${view === "events" ? "btn-primary" : ""}`} onClick={() => setView("events")}>Events</button>
              <button type="button" className={`btn btn-sm ${view === "patterns" ? "btn-primary" : ""}`} onClick={() => setView("patterns")}>Patterns</button>
            </div>
          }
        >
          {view === "events" ? (
            <>
              {filtered.length === 0 ? (
                <EmptyState title="No events match these filters" text="Widen the severity, category, phase or source filter." icon={<Search />} />
              ) : (
                <div className="log-stream">
                  {filtered.slice(0, limit).map((event) => (
                    <LogRow key={event.id} event={event} />
                  ))}
                </div>
              )}
              {limit < filtered.length ? (
                <div className="row" style={{ justifyContent: "center", marginTop: 14 }}>
                  <button type="button" className="btn btn-sm" onClick={() => setLimit((value) => value + PAGE)}>Show {Math.min(PAGE, filtered.length - limit)} more events</button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="pattern-grid">
              {(data?.patterns ?? [])
                .filter((item) => (category === "all" || item.category === category) && (severity === "all" || item.severity === severity))
                .filter((item) => !query || `${item.signature} ${item.example}`.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 60)
                .map((item) => (
                  <button type="button" key={item.id} className={`pattern-card ${item.severity}`} onClick={() => { setView("events"); update({ pattern: item.id }); }}>
                    <div className="pattern-head">
                      <span className={`severity-dot ${item.severity}`} />
                      <b>{item.category}</b>
                      <span className="count-badge">{item.count}</span>
                    </div>
                    <p>{item.example}</p>
                    <div className="pattern-foot">
                      <span>{item.phases.join(" · ") || "no phase"}</span>
                      {item.cells.length ? <span>cells {item.cells.slice(0, 4).join(", ")}{item.cells.length > 4 ? "…" : ""}</span> : null}
                    </div>
                  </button>
                ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel className="mt-16" title="How this log was assembled" subtitle="Method transparency for the investigation view.">
        <ul className="boundary-list">
          <li><Terminal /> Notebook output lines are split by cell and line number; the cell's phase is inherited from the notebook record.</li>
          <li><FileText /> The warning register is added as a separate source, so a warning present in both sources appears once in the family counts and twice in the raw event list.</li>
          <li><Info /> Build and smoke logs are appended as their own sources. ANSI colour codes are stripped, and no timing is invented.</li>
          <li><StatusBadge status="Verified" /> Section headers, artifact writes, measurements and ledger entries are classified by their recorded content, not by heuristics on the surrounding text.</li>
        </ul>
      </Panel>
    </>
  );
}

function LogRow({ event }: { event: Phase2LogEvent }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`log-row ${event.severity}`}>
      <button type="button" className="log-row-head" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className={`severity-dot ${event.severity}`} />
        <span className="log-phase">{event.phase}</span>
        <span className="log-cell">{event.cell != null ? `cell ${event.cell}${event.line != null ? `:${event.line}` : ""}` : event.sourceLabel}</span>
        <span className="log-message">{event.message}</span>
        <span className="log-category">{event.category}</span>
        <ChevronDown className={`log-chevron ${open ? "open" : ""}`} />
      </button>
      {open ? <pre className="log-raw">{event.raw}</pre> : null}
    </div>
  );
}
