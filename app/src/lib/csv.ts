import type { Row } from "../types";

const sanitizeFilename = (name: string): string =>
  name.replace(/[/\\?%*:|"<>]/g, "_").replace(/^\.+/, "").trim() || "export";

const escapeCell = (value: any): string => {
  if (value == null) return "";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  // Neutralise spreadsheet formula injection without changing numeric values.
  const safe = typeof value === "string" && /^[=+\-@\t\r\n]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function downloadCsv(filename: string, rows: Row[], columns?: { key: string; label?: string }[]) {
  if (!rows.length) return;
  const keys = columns?.map((c) => c.key) ?? Object.keys(rows[0]);
  const header = columns?.map((c) => c.label ?? c.key) ?? keys;
  const lines = [header.map(escapeCell).join(",")];
  for (const row of rows) {
    lines.push(keys.map((key) => escapeCell(row[key])).join(","));
  }
  const cleanName = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  downloadText(cleanName, lines.join("\r\n"), "text/csv;charset=utf-8");
}

export function downloadText(filename: string, text: string, type = "text/plain;charset=utf-8") {
  const safeFilename = sanitizeFilename(filename);
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = safeFilename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadJson(filename: string, value: unknown) {
  downloadText(filename, JSON.stringify(value, null, 2), "application/json");
}
