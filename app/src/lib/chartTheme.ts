/**
 * Phase 2 chart theme with full dual-theme (Dark / Light) support.
 *
 * ECharts renders to canvas, so CSS custom properties cannot be used directly
 * inside an option object. These themes and adapters handle both Dark-first
 * surfaces and high-contrast Light surfaces with WCAG 2.2 AA compliant palettes.
 */

export type ThemeMode = "dark" | "light";

export function getCurrentTheme(): ThemeMode {
  if (typeof document !== "undefined") {
    const t = document.documentElement.getAttribute("data-theme");
    if (t === "light") return "light";
  }
  return "dark";
}

export const paletteDark = [
  "#8b8cf8",
  "#5eead4",
  "#c4a7ff",
  "#fb7185",
  "#4ade80",
  "#fbbf24",
  "#93c5fd",
  "#f9a8d4",
  "#86efac",
  "#fcd34d",
];

export const paletteLight = [
  "#4f46e5",
  "#0284c7",
  "#7c3aed",
  "#e11d48",
  "#16a34a",
  "#d97706",
  "#2563eb",
  "#db2777",
  "#059669",
  "#ca8a04",
];

export const palette = paletteDark;

export const phaseColorsDark: Record<string, string> = {
  P0: "#fb923c",
  P1: "#38bdf8",
  P2: "#c084fc",
  P3: "#2dd4bf",
  P4: "#fbbf24",
  P5: "#fb7185",
  P6: "#60a5fa",
  P7: "#8b8cf8",
  P8: "#94a3b8",
};

export const phaseColorsLight: Record<string, string> = {
  P0: "#ea580c",
  P1: "#0284c7",
  P2: "#9333ea",
  P3: "#0d9488",
  P4: "#d97706",
  P5: "#e11d48",
  P6: "#2563eb",
  P7: "#4f46e5",
  P8: "#64748b",
};

export const phaseColors = phaseColorsDark;

export const inkDark = "#e8eef8";
export const inkLight = "#0f172a";
export const ink = inkDark;

export const mutedDark = "#93a2ba";
export const mutedLight = "#64748b";
export const muted = mutedDark;

export const lineDark = "#2a3852";
export const lineLight = "#e2e8f0";
export const line = lineDark;

export const softLineDark = "rgba(255, 255, 255, 0.07)";
export const softLineLight = "rgba(15, 23, 42, 0.06)";
export const softLine = softLineDark;

export const fraudRedDark = "#fb7185";
export const fraudRedLight = "#e11d48";
export const fraudRed = fraudRedDark;

export const indigoDark = "#8b8cf8";
export const indigoLight = "#4f46e5";
export const indigo = indigoDark;

export const cyanDark = "#5eead4";
export const cyanLight = "#0284c7";
export const cyan = cyanDark;

export const greenDark = "#4ade80";
export const greenLight = "#16a34a";
export const green = greenDark;

export const amberDark = "#fbbf24";
export const amberLight = "#d97706";
export const amber = amberDark;

export const tooltipStyleDark = {
  backgroundColor: "rgba(9, 14, 24, 0.97)",
  borderColor: "rgba(148, 163, 184, 0.28)",
  borderWidth: 1,
  padding: [9, 11],
  textStyle: {
    color: "#e8eef8",
    fontSize: 11.5,
    fontFamily: "Manrope Variable, Segoe UI, sans-serif",
  },
  extraCssText:
    "border-radius:10px;box-shadow:0 18px 40px rgba(0,0,0,.45);max-width:340px;white-space:normal;backdrop-filter:blur(6px);",
};

export const tooltipStyleLight = {
  backgroundColor: "rgba(255, 255, 255, 0.98)",
  borderColor: "rgba(203, 213, 225, 0.9)",
  borderWidth: 1,
  padding: [9, 11],
  textStyle: {
    color: "#0f172a",
    fontSize: 11.5,
    fontFamily: "Manrope Variable, Segoe UI, sans-serif",
  },
  extraCssText:
    "border-radius:10px;box-shadow:0 12px 30px rgba(15,23,42,.12);max-width:340px;white-space:normal;backdrop-filter:blur(6px);",
};

export const tooltipStyle = tooltipStyleDark;

export const axisCommonDark = {
  axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.16)" } },
  axisTick: { show: false },
  axisLabel: { color: mutedDark, fontSize: 10.5, fontFamily: "Manrope Variable, Segoe UI, sans-serif" },
  splitLine: { lineStyle: { color: softLineDark } },
  nameTextStyle: { color: mutedDark, fontSize: 10 },
};

export const axisCommonLight = {
  axisLine: { lineStyle: { color: "rgba(15, 23, 42, 0.16)" } },
  axisTick: { show: false },
  axisLabel: { color: mutedLight, fontSize: 10.5, fontFamily: "Manrope Variable, Segoe UI, sans-serif" },
  splitLine: { lineStyle: { color: softLineLight } },
  nameTextStyle: { color: mutedLight, fontSize: 10 },
};

export const axisCommon = axisCommonDark;

export const gridCommon = { left: 12, right: 18, top: 32, bottom: 14, containLabel: true };

export const numberAxis = {
  type: "value" as const,
  ...axisCommon,
  axisLine: { show: false },
};

export const categoryAxis = {
  type: "category" as const,
  ...axisCommon,
  splitLine: { show: false },
};

export const legendCommonDark = {
  icon: "roundRect",
  itemWidth: 8,
  itemHeight: 8,
  itemGap: 14,
  textStyle: { color: "#b6c2d6", fontSize: 10.5, fontFamily: "Manrope Variable, Segoe UI, sans-serif" },
  top: 0,
  left: 0,
};

export const legendCommonLight = {
  icon: "roundRect",
  itemWidth: 8,
  itemHeight: 8,
  itemGap: 14,
  textStyle: { color: "#334155", fontSize: 10.5, fontFamily: "Manrope Variable, Segoe UI, sans-serif" },
  top: 0,
  left: 0,
};

export const legendCommon = legendCommonDark;

export const percent = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;

/** Color tokens mapped to dark-surface equivalents. */
const COLOR_MAP_DARK: Record<string, string> = {
  "#4f46e5": "#8b8cf8",
  "#3730a3": "#6c6df0",
  "#6d63ff": "#8b8cf8",
  "#8177ff": "#a5a6ff",
  "#7c3aed": "#c4a7ff",
  "#0e7490": "#5eead4",
  "#0f766e": "#2dd4bf",
  "#1f8a70": "#4ade80",
  "#146c52": "#4ade80",
  "#cb4257": "#fb7185",
  "#a52e41": "#fb7185",
  "#bd761b": "#fbbf24",
  "#b23a48": "#fb7185",
  "#3b6fd4": "#60a5fa",
  "#5b6b8c": "#94a3b8",
  "#d17a9a": "#f9a8d4",
  "#6d9f71": "#86efac",
  "#8c6d4f": "#fcd34d",
  "#e4572e": "#fb923c",
  "#2e86ab": "#38bdf8",
  "#6c4ab6": "#c084fc",
  "#c47a1b": "#fbbf24",
  "#101a2e": "#e8eef8",
  "#0b1220": "#e8eef8",
  "#1c2330": "#e8eef8",
  "#2a3a55": "#94a3b8",
  "#3b4352": "#cbd5e1",
  "#4e5563": "#b6c2d6",
  "#7c7a73": "#93a2ba",
  "#8e9ab1": "#93a2ba",
  "#8b97ae": "#93a2ba",
  "#b5ad9f": "#93a2ba",
  "#b3aa9b": "#93a2ba",
  "#8c8577": "#94a3b8",
  "#d8d0c3": "rgba(255, 255, 255, 0.16)",
  "#e5ded2": "rgba(255, 255, 255, 0.14)",
  "#e7ebf3": "rgba(255, 255, 255, 0.14)",
  "#efeae1": "rgba(255, 255, 255, 0.07)",
  "#f0edff": "rgba(139, 140, 248, 0.16)",
  "#f4f1ff": "rgba(139, 140, 248, 0.12)",
  "#eef0ff": "rgba(139, 140, 248, 0.12)",
  "#fffdf9": "#111a2b",
  "#fdfbf7": "#111a2b",
  "#fbf9f4": "#0f1726",
  "#f8f5ef": "#0f1726",
  "#fbe9eb": "rgba(251, 113, 133, 0.12)",
  "#fdf3e3": "rgba(251, 191, 36, 0.12)",
  "#e9f6f0": "rgba(74, 222, 128, 0.12)",
  "#ffffff": "#111a2b",
  "#fff": "#111a2b",
  "#c7bdad": "rgba(255, 255, 255, 0.2)",
  "#cfc6b8": "rgba(255, 255, 255, 0.2)",
  "#ddd7ff": "rgba(139, 140, 248, 0.3)",
  "#d7cec0": "rgba(255, 255, 255, 0.22)",
};

const RGBA_MAP_DARK: [RegExp, string][] = [
  [/^rgba?\(79,\s*70,\s*229/i, "rgba(139, 140, 248"],
  [/^rgba?\(99,\s*91,\s*255/i, "rgba(139, 140, 248"],
  [/^rgba?\(203,\s*66,\s*87/i, "rgba(251, 113, 133"],
  [/^rgba?\(15,\s*118,\s*110/i, "rgba(45, 212, 191"],
  [/^rgba?\(14,\s*116,\s*144/i, "rgba(94, 234, 212"],
  [/^rgba?\(31,\s*138,\s*112/i, "rgba(74, 222, 128"],
];

/** Color tokens mapped to light-surface equivalents. */
const COLOR_MAP_LIGHT: Record<string, string> = {
  "#8b8cf8": "#4f46e5",
  "#6c6df0": "#3730a3",
  "#c4a7ff": "#7c3aed",
  "#5eead4": "#0284c7",
  "#2dd4bf": "#0d9488",
  "#4ade80": "#16a34a",
  "#fb7185": "#e11d48",
  "#fbbf24": "#d97706",
  "#93c5fd": "#2563eb",
  "#f9a8d4": "#db2777",
  "#86efac": "#059669",
  "#fcd34d": "#ca8a04",
  "#070b13": "#ffffff",
  "#0e1524": "#ffffff",
  "#111a2b": "#ffffff",
  "#0f1726": "#ffffff",
  "#121b2c": "#f8fafc",
  "#172236": "#f1f5f9",
  "#1d2a41": "#e2e8f0",
  "#e8eef8": "#0f172a",
  "#b6c2d6": "#334155",
  "#93a2ba": "#64748b",
  "#8fa0b8": "#64748b",
  "#94a3b8": "#64748b",
  "#05080f": "#ffffff",
  "#cbd5e1": "#475569",
  "#2a3852": "#cbd5e1",
  "#223047": "#e2e8f0",
  "#31425f": "#cbd5e1",
};

const RGBA_MAP_LIGHT: [RegExp, string][] = [
  [/^rgba?\(139,\s*140,\s*248/i, "rgba(79, 70, 229"],
  [/^rgba?\(251,\s*113,\s*133/i, "rgba(225, 29, 72"],
  [/^rgba?\(94,\s*234,\s*212/i, "rgba(2, 132, 199"],
  [/^rgba?\(45,\s*212,\s*191/i, "rgba(13, 148, 136"],
  [/^rgba?\(74,\s*222,\s*128/i, "rgba(22, 163, 74"],
  [/^rgba?\(251,\s*191,\s*36/i, "rgba(217, 119, 6"],
  [/^rgba?\(255,\s*255,\s*255,\s*0\.0[3-9]\)/i, "rgba(15, 23, 42, 0.05)"],
  [/^rgba?\(255,\s*255,\s*255,\s*0\.1[0-9]\)/i, "rgba(15, 23, 42, 0.12)"],
  [/^rgba?\(255,\s*255,\s*255,\s*0\.2[0-9]\)/i, "rgba(15, 23, 42, 0.18)"],
];

export function mapChartColor(value: string, theme: ThemeMode = "dark"): string {
  if (theme === "light") {
    if (COLOR_MAP_LIGHT[value.toLowerCase()]) return COLOR_MAP_LIGHT[value.toLowerCase()];
    for (const [pattern, replacement] of RGBA_MAP_LIGHT) {
      if (pattern.test(value)) return value.replace(pattern, replacement);
    }
    return value;
  }
  if (COLOR_MAP_DARK[value.toLowerCase()]) return COLOR_MAP_DARK[value.toLowerCase()];
  for (const [pattern, replacement] of RGBA_MAP_DARK) {
    if (pattern.test(value)) return value.replace(pattern, replacement);
  }
  return value;
}

/**
 * Recursively migrate an option onto the specified theme surface and enforce a
 * readable minimum type size (≥ 10.5 px).
 */
export function adaptChartOption<T>(input: T, theme?: ThemeMode): T {
  const activeTheme = theme ?? getCurrentTheme();
  const visit = (value: any, key?: string): any => {
    if (typeof value === "string") {
      if (
        key === "color" ||
        key === "borderColor" ||
        key === "backgroundColor" ||
        key === "fill" ||
        key === "stroke" ||
        key === "shadowColor"
      ) {
        return mapChartColor(value, activeTheme);
      }
      return value;
    }
    if (typeof value === "number") {
      if (key === "fontSize" && value < 10.5) return 10.5;
      return value;
    }
    if (Array.isArray(value)) return value.map((item) => visit(item, key));
    if (value && typeof value === "object") {
      const output: Record<string, any> = {};
      for (const [childKey, childValue] of Object.entries(value)) {
        output[childKey] = visit(childValue, childKey);
      }
      return output;
    }
    return value;
  };
  return visit(input);
}

/** Registered theme definitions. */
export const echartsThemeDark = {
  color: paletteDark,
  backgroundColor: "transparent",
  textStyle: {
    color: "#b6c2d6",
    fontFamily: "Manrope Variable, Segoe UI, sans-serif",
  },
  title: {
    textStyle: { color: inkDark, fontWeight: 600 },
    subtextStyle: { color: mutedDark },
  },
  categoryAxis: axisCommonDark,
  valueAxis: { ...axisCommonDark, axisLine: { show: false } },
  legend: legendCommonDark,
  tooltip: tooltipStyleDark,
};

export const echartsThemeLight = {
  color: paletteLight,
  backgroundColor: "transparent",
  textStyle: {
    color: "#334155",
    fontFamily: "Manrope Variable, Segoe UI, sans-serif",
  },
  title: {
    textStyle: { color: inkLight, fontWeight: 600 },
    subtextStyle: { color: mutedLight },
  },
  categoryAxis: axisCommonLight,
  valueAxis: { ...axisCommonLight, axisLine: { show: false } },
  legend: legendCommonLight,
  tooltip: tooltipStyleLight,
};

export const echartsTheme = echartsThemeDark;
