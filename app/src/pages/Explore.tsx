import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BarChart3,
  Database,
  Download,
  FileSearch,
  Hash,
  Layers3,
  Search,
  Table2,
  Type,
} from "lucide-react";
import { useManifest } from "../context/AppContext";
import { useAsync } from "../lib/useAsync";
import { loadTable } from "../lib/data";
import { PageHeader, Panel, Callout, EmptyState, SourceNote } from "../components/ui";
import { DataTable, type TableColumn } from "../components/DataTable";
import { FilterPills, MiniBar, SourceChip } from "../components/phase2";
import { downloadCsv, downloadJson } from "../lib/csv";
import { fmtInt, fmtPct, titleCase } from "../lib/format";
import type { Row, TableData } from "../types";

type View = "preview" | "profile" | "quality";

interface ColumnProfile {
  key: string;
  label: string;
  type: string;
  numeric: boolean;
  count: number;
  missing: number;
  missingPct: number;
  unique: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  median: number | null;
  top: { value: string; count: number }[];
  histogram: { label: string; count: number }[];
}

const isNumericType = (type: string | undefined) =>
  !!type && ["integer", "float", "number", "int", "double", "int64", "float64"].includes(type.toLowerCase());

const numericValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

export default function Explore() {
  const manifest = useManifest();
  const [params, setParams] = useSearchParams();
  const [catalogQuery, setCatalogQuery] = useState("");
  const [category, setCategory] = useState("all");
  const tableId = params.get("table") ?? "phase0_class_balance";
  const columnParam = params.get("col");
  const [view, setView] = useState<View>(() => ((params.get("view") as View) || (columnParam ? "profile" : "preview")));
  const table = manifest.tables.find((item) => item.id === tableId) ?? manifest.tables[0];
  const data = useAsync<TableData>(() => loadTable(table.id), [table.id]);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    setParams(next, { replace: true });
  };

  const catalog = useMemo(() => {
    const needle = catalogQuery.trim().toLowerCase();
    return manifest.tables.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (!needle) return true;
      return `${item.id} ${item.title} ${item.description} ${item.category}`.toLowerCase().includes(needle);
    });
  }, [manifest.tables, catalogQuery, category]);

  const categories = useMemo(
    () => Array.from(new Set(manifest.tables.map((item) => item.category))).sort(),
    [manifest.tables],
  );

  const rows = data.data?.rows ?? [];
  const types = data.data?.types ?? {};

  const profiles = useMemo<ColumnProfile[]>(() => {
    if (!data.data) return [];
    return data.data.columns.map((key) => {
      const numeric = isNumericType(types[key]);
      const values = rows.map((row) => row[key]);
      const missing = values.filter((value) => value == null || value === "").length;
      const unique = new Set(values.filter((value) => value != null && value !== "").map((value) => String(value))).size;
      const numbers = values.map(numericValue).filter((value): value is number => value != null);
      const counts = new Map<string, number>();
      for (const value of values) {
        if (value == null || value === "") continue;
        const key = String(value);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const top = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([value, count]) => ({ value, count }));
      const sorted = [...numbers].sort((a, b) => a - b);
      const median = sorted.length ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) : null;
      const mean = numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null;
      let histogram: { label: string; count: number }[] = [];
      if (numeric && numbers.length > 4) {
        const min = Math.min(...numbers);
        const max = Math.max(...numbers);
        const bins = 8;
        const width = (max - min) / bins || 1;
        const buckets = Array.from({ length: bins }, (_, index) => ({
          label: `${(min + index * width).toFixed(width < 1 ? 3 : 1)}`,
          count: 0,
        }));
        for (const value of numbers) {
          const index = Math.min(bins - 1, Math.max(0, Math.floor((value - min) / width)));
          buckets[index].count += 1;
        }
        histogram = buckets;
      }
      return {
        key,
        label: titleCase(key),
        type: types[key] ?? "string",
        numeric,
        count: values.length - missing,
        missing,
        missingPct: values.length ? missing / values.length : 0,
        unique,
        min: numbers.length ? Math.min(...numbers) : null,
        max: numbers.length ? Math.max(...numbers) : null,
        mean,
        median,
        top,
        histogram,
      };
    });
  }, [data.data, rows, types]);

  const correlations = useMemo(() => {
    const numeric = profiles.filter((profile) => profile.numeric && profile.count > 2);
    const limited = numeric.slice(0, 10);
    const vectors = limited.map((profile) =>
      rows.map((row) => numericValue(row[profile.key])).filter((value): value is number => value != null),
    );
    const matrix = limited.map((rowProfile, rowIndex) =>
      limited.map((colProfile, colIndex) => {
        if (rowIndex === colIndex) return 1;
        const a = vectors[rowIndex];
        const b = vectors[colIndex];
        const length = Math.min(a.length, b.length);
        if (length < 3) return null;
        let sumA = 0;
        let sumB = 0;
        for (let index = 0; index < length; index += 1) {
          sumA += a[index];
          sumB += b[index];
        }
        const meanA = sumA / length;
        const meanB = sumB / length;
        let cov = 0;
        let varA = 0;
        let varB = 0;
        for (let index = 0; index < length; index += 1) {
          const da = a[index] - meanA;
          const db = b[index] - meanB;
          cov += da * db;
          varA += da * da;
          varB += db * db;
        }
        const denominator = Math.sqrt(varA * varB);
        return denominator ? cov / denominator : null;
      }),
    );
    return { columns: limited, matrix };
  }, [profiles, rows]);

  const selectedProfile = profiles.find((profile) => profile.key === columnParam) ?? null;

  const previewColumns = useMemo<TableColumn[]>(
    () =>
      (data.data?.columns ?? []).map((key) => ({
        key,
        label: titleCase(key),
        align: isNumericType(types[key]) ? "right" : undefined,
        sortValue: (row: Row) => {
          const value = row[key];
          const numeric = numericValue(value);
          return numeric != null ? numeric : value == null ? null : String(value);
        },
      })),
    [data.data, types],
  );

  const exportProfile = () => {
    downloadJson(`fraud_profile_${table.id}.json`, {
      table: { id: table.id, title: table.title, rows: table.rows, cols: table.cols, source: table.source },
      generatedAt: new Date().toISOString(),
      columns: profiles.map((profile) => ({
        column: profile.key,
        type: profile.type,
        non_null: profile.count,
        missing: profile.missing,
        missing_pct: Number((profile.missingPct * 100).toFixed(4)),
        unique: profile.unique,
        min: profile.min,
        max: profile.max,
        mean: profile.mean,
        median: profile.median,
        top_values: profile.top,
      })),
      correlations: correlations.columns.map((profile, index) => ({
        column: profile.key,
        correlations: correlations.matrix[index].map((value) => (value == null ? null : Number(value.toFixed(4)))),
      })),
    });
  };

  const missingCells = profiles.reduce((sum, profile) => sum + profile.missing, 0);

  return (
    <>
      <PageHeader
        eyebrow={<><Table2 size={13} /> Data explorer</>}
        title={<>Profile the evidence <em>before you quote it.</em></>}
        description="Every generated table in the workspace, opened directly: schema, type, completeness, distributions, value frequency and correlations. Nothing is aggregated server-side — the profile is computed from the same rows the preview shows."
        actions={
          <div className="row wrap">
            <SourceChip to="/artifacts?tab=tables">Artifact gallery</SourceChip>
            <button type="button" className="btn btn-sm" onClick={exportProfile}><Download /> Export profile</button>
          </div>
        }
        meta={
          <div className="header-meta">
            <span className="status-line"><Database /> {fmtInt(manifest.tables.length)} tables</span>
            <span className="status-line"><Layers3 /> Largest table {fmtInt(Math.max(...manifest.tables.map((item) => item.rows ?? 0)))} rows</span>
          </div>
        }
      />

      <div className="explore-layout mt-16">
        <aside className="explore-rail" aria-label="Table catalog">
          <div className="explore-rail-head">
            <div className="filter-search compact">
              <Search />
              <input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} placeholder="Find a table" aria-label="Find a table" />
            </div>
            <select className="select" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter tables by category">
              <option value="all">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="explore-table-list">
            {catalog.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`explore-table-item ${item.id === table.id ? "active" : ""}`}
                onClick={() => update({ table: item.id, col: null })}
              >
                <b>{item.title}</b>
                <span>{item.id}</span>
                <small>{fmtInt(item.rows)} rows · {item.cols} cols · {item.category}</small>
              </button>
            ))}
            {catalog.length === 0 ? <EmptyState title="No tables match" /> : null}
          </div>
        </aside>

        <div className="explore-main">
          <Panel
            title={table.title}
            subtitle={table.description}
            action={<span className="badge badge-neutral">{table.category}</span>}
            source={<>Source: <code>{table.source ?? table.id}</code> · {fmtInt(table.rows)} rows × {table.cols} columns</>}
          >
            <div className="explore-meta">
              <div><span>Rows</span><b>{fmtInt(table.rows)}</b></div>
              <div><span>Columns</span><b>{table.cols}</b></div>
              <div><span>Phase</span><b>{table.phase}</b></div>
              <div><span>Missing cells</span><b>{fmtInt(table.missing_cells ?? missingCells)}</b></div>
              <div><span>Size</span><b>{table.bytes ? `${(table.bytes / 1024).toFixed(1)} KB` : "—"}</b></div>
            </div>
            <div className="view-switch" role="tablist" aria-label="Table view">
              {(["preview", "profile", "quality"] as View[]).map((item) => (
                <button key={item} type="button" role="tab" aria-selected={view === item} className={view === item ? "active" : ""} onClick={() => setView(item)}>
                  {item === "preview" ? "Rows" : item === "profile" ? "Column profile" : "Quality & correlation"}
                </button>
              ))}
            </div>

            {data.error ? <Callout tone="danger" title="Table could not be loaded"><p>{data.error}</p></Callout> : null}
            {data.loading ? <div className="skeleton" style={{ height: 300 }} /> : null}

            {!data.loading && !data.error && view === "preview" ? (
              <DataTable
                rows={rows}
                columns={previewColumns}
                searchable
                searchPlaceholder="Filter rows"
                pageSize={25}
                exportName={`fraud_${table.id}.csv`}
                countLabel="rows"
                onRowClick={(row) => {
                  const first = Object.keys(row)[0];
                  if (first) update({ col: first });
                }}
              />
            ) : null}

            {!data.loading && !data.error && view === "profile" ? (
              <div className="column-profile-grid">
                {profiles.map((profile) => (
                  <button
                    type="button"
                    key={profile.key}
                    className={`column-card ${columnParam === profile.key ? "active" : ""}`}
                    onClick={() => update({ col: columnParam === profile.key ? null : profile.key })}
                    aria-pressed={columnParam === profile.key}
                  >
                    <div className="column-card-head">
                      {profile.numeric ? <Hash /> : <Type />}
                      <b>{profile.label}</b>
                      <span>{profile.type}</span>
                    </div>
                    <div className="column-card-stats">
                      <span><b>{fmtInt(profile.count)}</b> present</span>
                      <span><b>{fmtInt(profile.unique)}</b> unique</span>
                      <span className={profile.missingPct > 0 ? "warn" : ""}><b>{fmtPct(profile.missingPct, 1)}</b> missing</span>
                    </div>
                    {profile.numeric ? (
                      <div className="column-range">
                        <span>{profile.min ?? "—"}</span>
                        <MiniBar value={profile.max ?? 0} max={profile.max ?? 1} color="var(--accent)" label="Range" />
                        <span>{profile.max ?? "—"}</span>
                      </div>
                    ) : (
                      <div className="column-top">
                        {profile.top.slice(0, 3).map((entry) => (
                          <span key={entry.value}>{entry.value} <b>{entry.count}</b></span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : null}

            {!data.loading && !data.error && view === "quality" ? (
              <div className="quality-grid">
                <div className="quality-block">
                  <h4><FileSearch /> Completeness</h4>
                  <div className="quality-rows">
                    {profiles
                      .filter((profile) => profile.missing > 0)
                      .map((profile) => (
                        <div key={profile.key}>
                          <span>{profile.label}</span>
                          <MiniBar value={profile.missingPct} max={Math.max(...profiles.map((item) => item.missingPct), 0.0001)} color="var(--amber)" />
                          <b>{fmtPct(profile.missingPct, 2)}</b>
                        </div>
                      ))}
                    {profiles.every((profile) => profile.missing === 0) ? <p className="muted">No missing values in this table.</p> : null}
                  </div>
                </div>
                <div className="quality-block">
                  <h4><BarChart3 /> Correlation (Pearson)</h4>
                  {correlations.columns.length >= 2 ? (
                    <div className="corr-wrap">
                      <table className="data-table corr-table">
                        <caption className="sr-only">Pearson correlation between numeric columns</caption>
                        <thead>
                          <tr>
                            <th scope="col" />
                            {correlations.columns.map((column) => <th scope="col" key={column.key}>{column.label}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {correlations.columns.map((rowColumn, rowIndex) => (
                            <tr key={rowColumn.key}>
                              <th scope="row">{rowColumn.label}</th>
                              {correlations.matrix[rowIndex].map((value, colIndex) => (
                                <td
                                  key={correlations.columns[colIndex].key}
                                  style={value == null ? undefined : { background: `rgba(139, 140, 248, ${Math.abs(value) * 0.55})` }}
                                >
                                  {value == null ? "—" : value.toFixed(2)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="muted">This table has fewer than two numeric columns, so no correlation matrix is shown.</p>
                  )}
                </div>
              </div>
            ) : null}
          </Panel>

          {selectedProfile ? (
            <Panel
              className="mt-16"
              title={`Column · ${selectedProfile.label}`}
              subtitle={`${selectedProfile.type} · ${fmtInt(selectedProfile.count)} present · ${fmtInt(selectedProfile.unique)} unique`}
              action={<button type="button" className="btn btn-sm" onClick={() => update({ col: null })}>Close</button>}
            >
              <div className="detail-stat-grid">
                <div><b>{fmtPct(selectedProfile.missingPct, 2)}</b><span>missing</span></div>
                {selectedProfile.numeric ? (
                  <>
                    <div><b>{selectedProfile.min ?? "—"}</b><span>min</span></div>
                    <div><b>{selectedProfile.max ?? "—"}</b><span>max</span></div>
                    <div><b>{selectedProfile.mean?.toFixed(3) ?? "—"}</b><span>mean</span></div>
                    <div><b>{selectedProfile.median?.toFixed(3) ?? "—"}</b><span>median</span></div>
                  </>
                ) : (
                  <div><b>{fmtInt(selectedProfile.unique)}</b><span>distinct values</span></div>
                )}
              </div>
              {selectedProfile.histogram.length ? (
                <div className="histogram">
                  {selectedProfile.histogram.map((bin) => (
                    <div key={bin.label} title={`${bin.label}: ${bin.count}`}>
                      <span style={{ height: `${Math.max(3, (bin.count / Math.max(...selectedProfile.histogram.map((item) => item.count))) * 100)}%` }} />
                      <small>{bin.label}</small>
                    </div>
                  ))}
                </div>
              ) : null}
              {selectedProfile.top.length ? (
                <>
                  <h4 className="detail-heading">Most frequent values</h4>
                  <div className="value-freq">
                    {selectedProfile.top.map((entry) => (
                      <div key={entry.value}>
                        <span>{entry.value}</span>
                        <MiniBar value={entry.count} max={selectedProfile.top[0].count} color="var(--cyan)" />
                        <b>{entry.count}</b>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
              <SourceNote>Computed in the browser from the same rows shown in the preview. No sampling is applied.</SourceNote>
            </Panel>
          ) : null}

          <div className="row wrap mt-16">
            <Link className="btn btn-sm" to={`/artifacts?tab=tables&table=${table.id}`}>Open in artifact gallery</Link>
            <Link className="btn btn-sm" to="/metrics">Metric definitions</Link>
            <button type="button" className="btn btn-sm" onClick={() => downloadCsv(`fraud_${table.id}.csv`, rows)}>
              <Download /> Export all rows
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
