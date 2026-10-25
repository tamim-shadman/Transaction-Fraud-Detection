import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Database, HelpCircle, Info, X } from "lucide-react";
import type { Phase2Anomaly, Phase2Insight } from "../types";
import { fmtValue } from "../lib/format";

export function ProvenanceBadge({ value }: { value: "verified" | "inferred" | string }) {
  const verified = value === "verified";
  return (
    <span className={`provenance ${verified ? "verified" : "inferred"}`} title={verified ? "Located in a recorded notebook output" : "Phase-level inference; no producing cell located"}>
      {verified ? <CheckCircle2 /> : <HelpCircle />}
      {verified ? "Verified" : "Inferred"}
    </span>
  );
}

export function SourceChip({ children, to }: { children: ReactNode; to?: string }) {
  const content = (
    <>
      <Database />
      <span>{children}</span>
    </>
  );
  return to ? (
    <Link className="source-chip" to={to}>
      {content}
    </Link>
  ) : (
    <span className="source-chip">{content}</span>
  );
}

export function Delta({
  value,
  digits = 4,
  higherIsBetter = true,
  suffix = "",
  label,
}: {
  value: number | null | undefined;
  digits?: number;
  higherIsBetter?: boolean | null;
  suffix?: string;
  label?: string;
}) {
  if (value == null || Number.isNaN(value)) return <span className="delta neutral">No comparable baseline</span>;
  const positive = value > 0;
  const good = higherIsBetter == null ? null : positive === higherIsBetter;
  const tone = Math.abs(value) < 10 ** -(digits + 1) ? "neutral" : good == null ? "neutral" : good ? "good" : "bad";
  return (
    <span className={`delta ${tone}`} title={label}>
      {positive ? "+" : ""}
      {value.toFixed(digits)}
      {suffix}
    </span>
  );
}

export function MiniBar({ value, max, color = "var(--accent)", label }: { value: number; max: number; color?: string; label?: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <span className="mini-bar" aria-label={label} role="img">
      <span style={{ width: `${pct}%`, background: color }} />
    </span>
  );
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="filter-pills" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          className={`filter-pill ${value === option.value ? "active" : ""}`}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
        >
          {option.label}
          {option.count != null ? <span>{option.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function InsightCard({ insight, compact = false }: { insight: Phase2Insight; compact?: boolean }) {
  const Icon = insight.kind === "risk" ? AlertTriangle : insight.kind === "observation" ? Info : CheckCircle2;
  return (
    <article className={`insight-card kind-${insight.kind} ${compact ? "compact" : ""}`}>
      <div className="insight-card-head">
        <span className={`insight-kind ${insight.kind}`}>
          <Icon />
          {insight.kind}
        </span>
        <span className="insight-scope">{insight.scope}</span>
      </div>
      <h3>{insight.title}</h3>
      <p>{insight.statement}</p>
      {!compact && insight.detail ? <p className="insight-detail">{insight.detail}</p> : null}
      <div className="insight-metrics">
        {insight.metrics.map((metric) => (
          <div key={`${insight.id}-${metric.label}`}>
            <span>{metric.label}</span>
            <b>{fmtValue(metric.value, metric.format)}</b>
            <small>{metric.source}</small>
          </div>
        ))}
      </div>
      <div className="insight-foot">
        <span className={`confidence ${insight.confidence}`}>{insight.confidence}</span>
        <Link to={insight.link}>
          Open evidence <ArrowUpRight />
        </Link>
      </div>
      {!compact && insight.caveat ? <p className="insight-caveat">{insight.caveat}</p> : null}
    </article>
  );
}

export function AnomalyCard({ anomaly }: { anomaly: Phase2Anomaly }) {
  return (
    <article className={`anomaly-card severity-${anomaly.severity}`}>
      <div className="anomaly-head">
        <span className={`severity-dot ${anomaly.severity}`} />
        <span>{anomaly.series}</span>
        <span className={`severity-label ${anomaly.severity}`}>{anomaly.severity}</span>
      </div>
      <div className="anomaly-value">
        <strong>{fmtValue(anomaly.value, anomaly.format)}</strong>
        <span>{anomaly.label}</span>
      </div>
      <p>{anomaly.interpretation}</p>
      <dl className="anomaly-meta">
        <div><dt>Method</dt><dd>{anomaly.method}</dd></div>
        <div><dt>Threshold</dt><dd>{anomaly.threshold}</dd></div>
        <div><dt>Reference</dt><dd>{anomaly.reference}</dd></div>
        {anomaly.zScore != null ? <div><dt>Robust z</dt><dd>{anomaly.zScore.toFixed(2)}</dd></div> : null}
      </dl>
      <div className="anomaly-foot">
        <span title={anomaly.notAProof}>Boundary: not proof of a defect</span>
        <Link to={anomaly.link}>Inspect <ArrowUpRight /></Link>
      </div>
    </article>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="drawer-layer">
      <button type="button" className="drawer-scrim" onClick={onClose} aria-label="Close panel" tabIndex={-1} />
      <div className="p2-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panelRef} style={{ width }}>
        <div className="p2-drawer-head">
          <div>
            {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} ref={closeRef} aria-label="Close panel">
            <X />
          </button>
        </div>
        <div className="p2-drawer-body">{children}</div>
        {footer ? <div className="p2-drawer-foot">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
