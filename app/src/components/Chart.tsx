import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { BarChart, LineChart, ScatterChart, PieChart, HeatmapChart, GraphChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  MarkAreaComponent,
  DataZoomComponent,
  VisualMapComponent,
  GraphicComponent,
  TitleComponent,
  DatasetComponent,
  TransformComponent,
  AriaComponent,
} from "echarts/components";
import { LabelLayout, UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsOption } from "echarts";
import {
  adaptChartOption,
  echartsThemeDark,
  echartsThemeLight,
  getCurrentTheme,
  tooltipStyleDark,
  tooltipStyleLight,
  type ThemeMode,
} from "../lib/chartTheme";

echarts.use([
  BarChart,
  LineChart,
  ScatterChart,
  PieChart,
  HeatmapChart,
  GraphChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  MarkAreaComponent,
  DataZoomComponent,
  VisualMapComponent,
  GraphicComponent,
  TitleComponent,
  DatasetComponent,
  TransformComponent,
  AriaComponent,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
]);

echarts.registerTheme("fraud-p2-dark", echartsThemeDark);
echarts.registerTheme("fraud-p2-light", echartsThemeLight);
echarts.registerTheme("fraud-p2", echartsThemeDark);

interface ChartProps {
  option: EChartsOption;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  onClick?: (params: any) => void;
  description?: string;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function Chart({ option, height = 280, className = "", ariaLabel, onClick, description }: ChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => getCurrentTheme());

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const active = getCurrentTheme();
      setTheme((prev) => (prev !== active ? active : prev));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const themeName = theme === "light" ? "fraud-p2-light" : "fraud-p2-dark";
    if (chartRef.current) {
      chartRef.current.dispose();
      chartRef.current = null;
    }
    const chart = echarts.init(ref.current, themeName, { renderer: "canvas" });
    chartRef.current = chart;

    let resizeFrame: number | null = null;
    const observer = new ResizeObserver(() => {
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        if (chartRef.current) chartRef.current.resize();
        resizeFrame = null;
      });
    });
    observer.observe(ref.current);

    return () => {
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [theme]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const adapted = adaptChartOption(option, theme);
    const sourceTooltip = (option.tooltip ?? {}) as any;
    const activeTooltip = theme === "light" ? tooltipStyleLight : tooltipStyleDark;

    chart.setOption(
      {
        ...adapted,
        backgroundColor: "transparent",
        animation: !prefersReducedMotion(),
        animationDuration: prefersReducedMotion() ? 0 : 500,
        animationEasing: "cubicOut",
        textStyle: {
          fontFamily: "Manrope Variable, Segoe UI, sans-serif",
          color: theme === "light" ? "#334155" : "#b6c2d6",
          ...(adapted.textStyle as any),
        },
        tooltip: {
          ...activeTooltip,
          ...sourceTooltip,
          textStyle: { ...activeTooltip.textStyle, ...(sourceTooltip.textStyle ?? {}) },
        },
        aria: {
          enabled: true,
          decal: { show: false },
          ...(adapted.aria as any),
        },
      },
      true,
    );
  }, [option, theme]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const handler = (params: any) => onClick?.(params);
    chart.off("click");
    if (onClick) chart.on("click", handler);
    return () => {
      chart.off("click");
    };
  }, [onClick]);

  return (
    <div
      ref={ref}
      className={`chart ${className}`}
      style={{ height }}
      role="img"
      tabIndex={0}
      aria-label={ariaLabel ?? "Interactive data visualisation"}
      data-chart-description={description}
    >
      {description ? <span className="sr-only">{description}</span> : null}
    </div>
  );
}
