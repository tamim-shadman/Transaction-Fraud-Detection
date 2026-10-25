import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download, Inbox, Search } from "lucide-react";
import type { Row } from "../types";
import { downloadCsv } from "../lib/csv";

export interface TableColumn {
  key: string;
  label: string;
  align?: "left" | "right";
  width?: string | number;
  render?: (row: Row, index: number) => ReactNode;
  sortValue?: (row: Row) => string | number | null;
  digits?: number;
  className?: string;
}

interface DataTableProps {
  rows: Row[];
  columns: TableColumn[];
  searchable?: boolean;
  searchKeys?: string[];
  searchPlaceholder?: string;
  pageSize?: number;
  maxHeight?: number | string;
  exportName?: string;
  initialSort?: { key: string; direction: "asc" | "desc" };
  onRowClick?: (row: Row) => void;
  emptyText?: string;
  hideToolbar?: boolean;
  countLabel?: string;
  toolbarExtra?: ReactNode;
}

const displayValue = (value: any, digits?: number): ReactNode => {
  if (value == null || value === "") return <span className="muted">—</span>;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "—";
    if (digits != null) return value.toFixed(digits);
    if (Math.abs(value) >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
    return String(Math.round(value * 10000) / 10000);
  }
  return String(value);
};

export function DataTable({
  rows,
  columns,
  searchable = true,
  searchKeys,
  searchPlaceholder = "Search rows…",
  pageSize = 8,
  maxHeight,
  exportName,
  initialSort,
  onRowClick,
  emptyText = "No matching rows.",
  hideToolbar = false,
  countLabel = "rows",
  toolbarExtra,
}: DataTableProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(initialSort ?? null);
  const collator = useMemo(() => new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }), []);

  const filtered = useMemo(() => {
    let result = rows;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const keys = searchKeys ?? columns.map((column) => column.key);
      result = result.filter((row) => keys.some((key) => String(row[key] ?? "").toLowerCase().includes(q)));
    }
    if (sort) {
      const column = columns.find((item) => item.key === sort.key);
      const getValue = column?.sortValue ?? ((row: Row) => row[sort.key]);
      result = [...result].sort((a, b) => {
        const av = getValue(a);
        const bv = getValue(b);
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === "number" && typeof bv === "number") return sort.direction === "asc" ? av - bv : bv - av;
        const cmp = collator.compare(String(av), String(bv));
        return sort.direction === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [rows, query, sort, columns, searchKeys, collator]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (key: string) => {
    setPage(0);
    setSort((current) => {
      if (!current || current.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  const pageButtons = useMemo(() => {
    const list: number[] = [];
    const start = Math.max(0, Math.min(safePage - 2, pages - 5));
    for (let i = start; i < Math.min(pages, start + 5); i += 1) list.push(i);
    return list;
  }, [safePage, pages]);

  return (
    <div>
      {!hideToolbar && (
        <div className="table-toolbar">
          {searchable ? (
            <label className="table-search">
              <Search />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(0);
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
              />
            </label>
          ) : (
            <div />
          )}
          {toolbarExtra}
          <span className="table-count">
            {filtered.length.toLocaleString()} {countLabel}
            {query ? ` · filtered from ${rows.length.toLocaleString()}` : ""}
          </span>
          {exportName ? (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => downloadCsv(exportName, filtered, columns.map((column) => ({ key: column.key, label: column.label })))}
              title="Download the filtered table as CSV"
              disabled={!filtered.length}
            >
              <Download />
              CSV
            </button>
          ) : null}
        </div>
      )}
      <div className="table-scroll" style={maxHeight ? { maxHeight } : undefined}>
        <table className="data-table">
          <caption className="sr-only">{exportName ? `${exportName} data table` : "Data table"}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  role="columnheader"
                  tabIndex={0}
                  aria-sort={sort?.key === column.key ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
                  className={`${column.align === "right" ? "num" : ""} sortable`}
                  style={{ width: column.width }}
                  onClick={() => toggleSort(column.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleSort(column.key);
                    }
                  }}
                  title={`Sort by ${column.label}`}
                >
                  {column.label}
                  {sort?.key === column.key ? (
                    <span className="sort-ind">{sort.direction === "asc" ? <ArrowUp size={8} /> : <ArrowDown size={8} />}</span>
                  ) : (
                    <span className="sort-ind" style={{ opacity: 0.28 }}><ArrowUpDown size={8} /></span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={onRowClick ? "clickable" : ""}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`${column.align === "right" ? "num" : ""} ${column.className ?? ""}`}
                    style={{ width: column.width }}
                  >
                    {column.render ? column.render(row, rowIndex) : displayValue(row[column.key], column.digits)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!pageRows.length ? (
          <div className="table-empty">
            <Inbox />
            <div>{emptyText}</div>
          </div>
        ) : null}
      </div>
      {filtered.length > pageSize ? (
        <div className="pagination">
          <span className="tiny muted">
            Showing {safePage * pageSize + 1}–{Math.min(filtered.length, (safePage + 1) * pageSize)} of {filtered.length.toLocaleString()}
          </span>
          <div className="page-btns">
            <button type="button" className="page-btn" onClick={() => setPage(Math.max(0, safePage - 1))} disabled={safePage === 0} aria-label="Previous page">
              <ChevronLeft size={11} />
            </button>
            {pageButtons.map((index) => (
              <button
                type="button"
                key={index}
                className={`page-btn ${index === safePage ? "active" : ""}`}
                onClick={() => setPage(index)}
                aria-current={index === safePage ? "page" : undefined}
              >
                {index + 1}
              </button>
            ))}
            <button type="button" className="page-btn" onClick={() => setPage(Math.min(pages - 1, safePage + 1))} disabled={safePage >= pages - 1} aria-label="Next page">
              <ChevronRight size={11} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
