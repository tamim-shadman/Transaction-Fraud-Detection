import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { EChartsOption } from "echarts";
import {
  ArrowUpRight,
  Boxes,
  FileWarning,
  GitBranch,
  HelpCircle,
  Layers3,
  Network,
  Search,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { useAsync } from "../lib/useAsync";
import { loadLineage } from "../lib/data";
import { PageHeader, Panel, Callout, EmptyState, SourceNote } from "../components/ui";
import { Chart } from "../components/Chart";
import { FilterPills, ProvenanceBadge, SourceChip } from "../components/phase2";
import { fmtInt } from "../lib/format";
import type { Phase2LineageNode } from "../types";

const TYPE_ORDER = ["run", "notebook", "source", "phase", "rq", "finding", "audit", "issue", "figure", "interactive", "table"];

const TYPE_META: Record<string, { label: string; color: string; icon: typeof Network }> = {
  run: { label: "Run", color: "#8b8cf8", icon: GitBranch },
  notebook: { label: "Notebook", color: "#c4a7ff", icon: Boxes },
  source: { label: "Source", color: "#5eead4", icon: FileWarning },
  phase: { label: "Phase", color: "#38bdf8", icon: Layers3 },
  rq: { label: "Research question", color: "#4ade80", icon: HelpCircle },
  finding: { label: "Finding", color: "#fbbf24", icon: Tag },
  audit: { label: "Audit note", color: "#fb7185", icon: ShieldCheck },
  issue: { label: "Issue", color: "#f97316", icon: FileWarning },
  figure: { label: "Figure", color: "#60a5fa", icon: Network },
  interactive: { label: "Interactive", color: "#93c5fd", icon: Network },
  table: { label: "Table", color: "#2dd4bf", icon: Network },
};

export default function Lineage() {
  const lineage = useAsync(loadLineage, []);
  const [params, setParams] = useSearchParams();
  const data = lineage.data;
  const focusId = params.get("node") ?? "run";
  const typeFilter = params.get("type");
  const query = params.get("q") ?? "";
  const depth = Number(params.get("depth") ?? "2");

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    setParams(next, { replace: true });
  };

  const nodeMap = useMemo(() => new Map((data?.nodes ?? []).map((node) => [node.id, node])), [data]);
  const focus = nodeMap.get(focusId) ?? data?.nodes.find((node) => node.id === "run");

  const neighbours = useMemo(() => {
    if (!data || !focus) return new Set<string>();
    const set = new Set<string>([focus.id]);
    let frontier = new Set<string>([focus.id]);
    for (let hop = 0; hop < depth; hop += 1) {
      const nextFrontier = new Set<string>();
      for (const link of data.links) {
        if (frontier.has(link.source) && !set.has(link.target)) {
          set.add(link.target);
          nextFrontier.add(link.target);
        }
        if (frontier.has(link.target) && !set.has(link.source)) {
          set.add(link.source);
          nextFrontier.add(link.source);
        }
      }
      frontier = nextFrontier;
      if (!frontier.size) break;
    }
    return set;
  }, [data, focus, depth]);

  const visible = useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    const nodes = data.nodes.filter((node) => {
      if (!neighbours.has(node.id)) return false;
      if (typeFilter && node.type !== typeFilter && node.id !== focus?.id) return false;
      return true;
    });
    const ids = new Set(nodes.map((node) => node.id));
    const links = data.links.filter((link) => ids.has(link.source) && ids.has(link.target));
    return { nodes, links };
  }, [data, neighbours, typeFilter, focus]);

  const searchResults = useMemo(() => {
    if (!data) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return data.nodes
      .filter((node) => `${node.id} ${node.label} ${node.type} ${node.phase}`.toLowerCase().includes(needle))
      .slice(0, 12);
  }, [data, query]);

  const pathToRun = useMemo(() => {
    if (!data || !focus || focus.id === "run") return [];
    const queue: { id: string; path: string[] }[] = [{ id: focus.id, path: [focus.id] }];
    const seen = new Set([focus.id]);
    while (queue.length) {
      const current = queue.shift()!;
      if (current.id === "run") return current.path;
      for (const link of data.links) {
        const next = link.source === current.id ? link.target : link.target === current.id ? link.source : null;
        if (next && !seen.has(next)) {
          seen.add(next);
          queue.push({ id: next, path: [...current.path, next] });
        }
      }
    }
    return [];
  }, [data, focus]);

  const connections = useMemo(() => {
    if (!data || !focus) return [];
    const list: { node: Phase2LineageNode; relation: string; direction: "out" | "in"; verified: boolean }[] = [];
    for (const link of data.links) {
      if (link.source === focus.id) {
        const node = nodeMap.get(link.target);
        if (node) list.push({ node, relation: link.relation, direction: "out", verified: link.verified });
      } else if (link.target === focus.id) {
        const node = nodeMap.get(link.source);
        if (node) list.push({ node, relation: link.relation, direction: "in", verified: link.verified });
      }
    }
    return list;
  }, [data, focus, nodeMap]);

  const chartOption = useMemo<EChartsOption>(() => {
    const types = Array.from(new Set(visible.nodes.map((node) => node.type)));
    const categories = types.map((type) => ({ name: TYPE_META[type]?.label ?? type, itemStyle: { color: TYPE_META[type]?.color ?? "#8fa0b8" } }));
    const labelTypes = new Set(["run", "notebook", "source", "phase", "rq", "audit"]);
    return {
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          if (params.dataType === "edge") {
            return `${params.data.data?.relation ?? "related"}<br/>${params.data.data?.verified ? "Verified edge" : "Inferred edge"}`;
          }
          const node = params.data?.node;
          if (!node) return "";
          return `<b>${node.label}</b><br/>${TYPE_META[node.type]?.label ?? node.type}${node.phase ? ` · ${node.phase}` : ""}<br/><span style="color:#93a2ba">Click to focus</span>`;
        },
      },
      series: [
        {
          type: "graph",
          layout: "force",
          roam: true,
          draggable: true,
          categories,
          force: { repulsion: 260, edgeLength: [70, 170], gravity: 0.12 },
          label: {
            show: true,
            position: "right",
            color: "#b6c2d6",
            fontSize: 10.5,
            formatter: (params: any) => {
              const node = params.data?.node as Phase2LineageNode | undefined;
              if (!node) return "";
              if (node.id === focus?.id) return node.label;
              return labelTypes.has(node.type) ? node.label : "";
            },
          },
          emphasis: { focus: "adjacency", label: { color: "#e8eef8" } },
          edgeSymbol: ["none", "arrow"],
          edgeSymbolSize: 6,
          edgeLabel: { show: false },
          lineStyle: { color: "source", curveness: 0.12 },
          data: visible.nodes.map((node) => ({
            id: node.id,
            name: node.label,
            node,
            symbolSize: node.id === focus?.id ? 26 : node.type === "phase" ? 20 : node.type === "finding" ? 12 : 14,
            itemStyle: {
              color: TYPE_META[node.type]?.color ?? "#8fa0b8",
              borderColor: node.id === focus?.id ? "#e8eef8" : "transparent",
              borderWidth: node.id === focus?.id ? 2.5 : 0,
              opacity: node.type === "source" && node.absent ? 0.45 : 1,
            },
          })),
          links: visible.links.map((link) => ({
            source: link.source,
            target: link.target,
            relation: link.relation,
            verified: link.verified,
            lineStyle: {
              color: link.verified ? "rgba(148,163,184,.42)" : "rgba(251,191,36,.55)",
              width: link.verified ? 1.2 : 1.2,
              type: link.verified ? "solid" : "dashed",
            },
          })),
        },
      ],
    };
  }, [visible, focus]);

  const counts = data?.counts;

  return (
    <>
      <PageHeader
        eyebrow={<><Network size={13} /> Evidence map</>}
        title={<>Follow the evidence <em>back to its source.</em></>}
        description="A navigable graph of the run: source files, the notebook, nine phases, research questions, graded findings, audit notes, workspace issues and every generated artifact. Solid edges are recorded; dashed edges are inferred."
        actions={
          <div className="row wrap">
            <SourceChip to="/program">Program profile</SourceChip>
            <button type="button" className="btn btn-sm" onClick={() => update({ node: "run" })}>Reset to run</button>
          </div>
        }
        meta={counts ? (
          <div className="header-meta">
            <span className="status-line"><Network /> {fmtInt(counts.nodes)} nodes</span>
            <span className="status-line"><GitBranch /> {fmtInt(counts.links)} edges</span>
            <span className="status-line"><ShieldCheck /> {fmtInt(counts.verifiedLinks)} verified</span>
            <span className="status-line"><HelpCircle /> {fmtInt(counts.inferredLinks)} inferred</span>
          </div>
        ) : null}
      />

      <div className="filter-bar mt-16">
        <div className="filter-search">
          <Search />
          <input value={query} onChange={(event) => update({ q: event.target.value || null })} placeholder="Find a node: finding id, artifact, phase" aria-label="Search lineage nodes" />
        </div>
        <FilterPills
          label="Node type"
          value={typeFilter ?? "all"}
          onChange={(value) => update({ type: value === "all" ? null : value })}
          options={[
            { value: "all", label: "All types" },
            ...TYPE_ORDER.filter((type) => (counts?.nodeTypes?.[type] ?? 0) > 0).map((type) => ({
              value: type,
              label: TYPE_META[type]?.label ?? type,
              count: counts?.nodeTypes?.[type] ?? 0,
            })),
          ]}
        />
        <FilterPills
          label="Expansion depth"
          value={String(depth)}
          onChange={(value) => update({ depth: value === "2" ? null : value })}
          options={[
            { value: "1", label: "1 hop" },
            { value: "2", label: "2 hops" },
            { value: "3", label: "3 hops" },
          ]}
        />
      </div>

      {searchResults.length ? (
        <div className="node-search-results">
          {searchResults.map((node) => (
            <button type="button" key={node.id} onClick={() => update({ node: node.id, q: null })}>
              <span className="type-dot" style={{ background: TYPE_META[node.type]?.color }} />
              <b>{node.label}</b>
              <span>{TYPE_META[node.type]?.label ?? node.type}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="lineage-layout mt-16">
        <Panel
          className="lineage-graph-panel"
          title={focus ? `${focus.label}` : "Lineage"}
          subtitle={focus ? `${TYPE_META[focus.type]?.label ?? focus.type} · ${visible.nodes.length} nodes in view · ${visible.links.length} edges` : ""}
          action={<button type="button" className="btn btn-sm" onClick={() => update({ node: "run" })}>Back to run</button>}
        >
          <Chart
            option={chartOption}
            height={520}
            ariaLabel={`Evidence graph focused on ${focus?.label ?? "run"}. The adjacent nodes are listed in the detail panel.`}
            onClick={(params) => {
              if (params?.dataType === "node" && params?.data?.id) update({ node: params.data.id });
            }}
          />
          <div className="lineage-legend">
            {TYPE_ORDER.filter((type) => (counts?.nodeTypes?.[type] ?? 0) > 0).map((type) => (
              <span key={type}>
                <span className="type-dot" style={{ background: TYPE_META[type]?.color }} />
                {TYPE_META[type]?.label ?? type}
                <b>{counts?.nodeTypes?.[type]}</b>
              </span>
            ))}
          </div>
        </Panel>

        <div className="lineage-side">
          <Panel title="Focused node" subtitle="Metadata recorded in the evidence layer.">
            {focus ? (
              <>
                <div className="focus-head">
                  <span className="type-dot big" style={{ background: TYPE_META[focus.type]?.color }} />
                  <div>
                    <b>{focus.label}</b>
                    <span>{focus.id}</span>
                  </div>
                  {focus.provenance ? <ProvenanceBadge value={focus.provenance} /> : null}
                </div>
                <dl className="kv-list">
                  <div><dt>Type</dt><dd>{TYPE_META[focus.type]?.label ?? focus.type}</dd></div>
                  {focus.phase ? <div><dt>Phase</dt><dd>{focus.phase}</dd></div> : null}
                  {focus.grade ? <div><dt>Grade</dt><dd>{focus.grade}</dd></div> : null}
                  {focus.severity ? <div><dt>Severity</dt><dd>{focus.severity}</dd></div> : null}
                  {focus.absent ? <div><dt>Availability</dt><dd>Absent from the workspace</dd></div> : null}
                  {Object.entries(focus.meta ?? {}).map(([key, value]) => (
                    <div key={key}><dt>{key.replace(/_/g, " ")}</dt><dd>{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd></div>
                  ))}
                </dl>
                {focus.route ? (
                  <Link className="btn btn-sm btn-primary" to={focus.route}>Open the evidence <ArrowUpRight /></Link>
                ) : null}
              </>
            ) : (
              <EmptyState title="Select a node" text="Click a node in the graph or search for one." />
            )}
          </Panel>

          <Panel title={`Connected evidence (${connections.length})`} subtitle="Each edge states the relation it records.">
            <div className="connection-list">
              {connections.map((connection) => (
                <button type="button" key={`${connection.direction}-${connection.node.id}`} onClick={() => update({ node: connection.node.id })}>
                  <span className="type-dot" style={{ background: TYPE_META[connection.node.type]?.color }} />
                  <div>
                    <b>{connection.node.label}</b>
                    <span>{connection.direction === "out" ? connection.relation : `← ${connection.relation}`}</span>
                  </div>
                  <span className={`edge-flag ${connection.verified ? "verified" : "inferred"}`}>{connection.verified ? "verified" : "inferred"}</span>
                </button>
              ))}
              {connections.length === 0 ? <EmptyState title="No recorded connections" /> : null}
            </div>
          </Panel>

          {pathToRun.length > 1 ? (
            <Panel title="Shortest path to the run" subtitle={`${pathToRun.length - 1} hops · every hop is a recorded edge.`}>
              <ol className="path-list">
                {pathToRun.map((id, index) => {
                  const node = nodeMap.get(id);
                  return (
                    <li key={`${id}-${index}`}>
                      <button type="button" onClick={() => update({ node: id })}>{node?.label ?? id}</button>
                    </li>
                  );
                })}
              </ol>
            </Panel>
          ) : null}

          <Panel title="How to read the edges" subtitle="Three rules, applied consistently.">
            <ul className="boundary-list">
              <li><ShieldCheck /> <b>Verified</b> edges come from the ledger, notebook cell ranges, the warning register or an artifact write line.</li>
              <li><HelpCircle /> <b>Inferred</b> edges connect a phase to an artifact when no producing cell could be located.</li>
              <li><FileWarning /> No edge is drawn because two files share a directory or a name.</li>
            </ul>
            <SourceNote>{data?.notes?.[0]}</SourceNote>
          </Panel>
        </div>
      </div>

      {lineage.error ? <Callout tone="danger" title="Lineage unavailable"><p>{lineage.error}</p></Callout> : null}
    </>
  );
}
