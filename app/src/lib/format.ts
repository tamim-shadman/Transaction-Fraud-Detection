export const fmtInt = (value: number | null | undefined): string =>
  value == null || Number.isNaN(value) ? "—" : Math.round(value).toLocaleString("en-US");

export const fmtFloat = (value: number | null | undefined, digits = 3): string =>
  value == null || Number.isNaN(value) ? "—" : value.toFixed(digits);

export const fmtPct = (value: number | null | undefined, digits = 2): string =>
  value == null || Number.isNaN(value) ? "—" : `${(value * 100).toFixed(digits)}%`;

export const fmtPctPoints = (value: number | null | undefined, digits = 2): string =>
  value == null || Number.isNaN(value) ? "—" : `${value.toFixed(digits)} pp`;

export const fmtCompact = (value: number | null | undefined): string =>
  value == null || Number.isNaN(value)
    ? "—"
    : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

export const fmtMoney = (value: number | null | undefined, compact = false): string => {
  if (value == null || Number.isNaN(value)) return "—";
  if (compact) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

export const fmtBytes = (value: number | null | undefined): string => {
  if (value == null) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
};

export const fmtDuration = (seconds: number | null | undefined): string => {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
};

export const fmtDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const fmtDateTime = (value: string | null | undefined): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}, ${date.toLocaleTimeString(
    "en-US",
    { hour: "2-digit", minute: "2-digit" },
  )}`;
};

export const fmtValue = (value: any, format: string): string => {
  if (value == null) return "—";
  switch (format) {
    case "integer":
      return fmtInt(value);
    case "percent":
      return fmtPct(value, 2);
    case "percent1":
      return fmtPct(value, 1);
    case "percent2":
      return fmtPct(value, 2);
    case "percent3":
      return fmtPct(value, 3);
    case "decimal2":
      return fmtFloat(value, 2);
    case "decimal3":
      return fmtFloat(value, 3);
    case "decimal4":
      return fmtFloat(value, 4);
    case "decimal6":
      return fmtFloat(value, 6);
    case "money":
      return fmtMoney(value);
    case "minutes":
      return fmtDuration(value);
    case "bytes":
      return fmtBytes(value);
    default:
      return typeof value === "number" ? fmtFloat(value, 2) : String(value);
  }
};

export const titleCase = (value: string): string =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bTe\b/g, "TE")
    .replace(/\bPsi\b/g, "PSI")
    .replace(/\bAuc\b/g, "AUC")
    .replace(/\bRoc\b/g, "ROC")
    .replace(/\bPr\b/g, "PR")
    .replace(/\bZip3\b/g, "ZIP3")
    .replace(/\bUsd\b/g, "USD");

export const truncate = (value: string, max = 120): string =>
  value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;

export const pctDelta = (value: number, baseline: number): number =>
  baseline === 0 ? 0 : ((value - baseline) / baseline) * 100;
