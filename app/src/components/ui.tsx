import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Database,
  Info,
  Layers3,
  XCircle,
} from "lucide-react";
import type { Finding, Kpi } from "../types";
import { fmtValue } from "../lib/format";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-sub">{description}</p> : null}
        {meta ? <div className="mt-12">{meta}</div> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
  bodyClassName = "",
  noBody = false,
  source,
  id,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  noBody?: boolean;
  source?: ReactNode;
  id?: string;
}) {
  return (
    <section className={`panel ${className}`} id={id}>
      {(title || action) && (
        <div className="panel-head">
          <div>
            {title ? <h3 className="panel-title">{title}</h3> : null}
            {subtitle ? <p className="panel-sub">{subtitle}</p> : null}
          </div>
          {action ? <div className="panel-tools">{action}</div> : null}
        </div>
      )}
      {noBody ? children : <div className={`panel-body ${bodyClassName}`}>{children}</div>}
      {source ? (
        <div style={{ padding: "0 20px 16px" }}>
          <SourceNote>{source}</SourceNote>
        </div>
      ) : null}
    </section>
  );
}

export function SourceNote({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`source-note ${className}`}>
      <Database />
      <div>{children}</div>
    </div>
  );
}

export function GradeBadge({ grade }: { grade: Finding["grade"] | string }) {
  const label = grade === "supports" ? "Supports" : grade.charAt(0).toUpperCase() + grade.slice(1);
  return <span className={`badge badge-${grade}`}>{label}</span>;
}

export function PhaseBadge({ id, label }: { id: string; label?: string }) {
  return (
    <span className="badge badge-phase" title={label}>
      {id}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const cls =
    normalized === "pass" || normalized === "ok"
      ? "badge-pass"
      : normalized === "flag" || normalized === "fail"
        ? "badge-flag"
        : "badge-info";
  return <span className={`badge ${cls}`}>{status}</span>;
}

export function Callout({
  title,
  children,
  tone = "info",
  icon,
  className = "",
}: {
  title?: ReactNode;
  children: ReactNode;
  tone?: "info" | "warn" | "danger" | "success";
  icon?: ReactNode;
  className?: string;
}) {
  const Icon = tone === "warn" ? AlertTriangle : tone === "danger" ? XCircle : tone === "success" ? CheckCircle2 : Info;
  return (
    <div className={`callout ${tone === "info" ? "" : tone} ${className}`}>
      {title ? (
        <div className="callout-title">
          {icon ?? <Icon />}
          {title}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function KpiCard({ kpi, accent }: { kpi: Kpi; accent?: string }) {
  return (
    <article className={`kpi tone-${kpi.tone ?? "ink"}`} style={accent ? ({ "--accent": accent } as CSSProperties) : undefined}>
      <div className="kpi-eyebrow">
        <span>{kpi.eyebrow ?? "Metric"}</span>
        <span title={kpi.verification}>●</span>
      </div>
      <div className="kpi-label">{kpi.label}</div>
      <div className="kpi-value">{fmtValue(kpi.value, kpi.format)}</div>
      <div className="kpi-context" title={kpi.context}>
        {kpi.context}
      </div>
    </article>
  );
}

export function Stat({
  value,
  label,
  hint,
}: {
  value: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="stat">
      <div className="v">{value}</div>
      <div className="l">{label}</div>
      {hint ? <div className="l" style={{ opacity: 0.7 }}>{hint}</div> : null}
    </div>
  );
}

export function StatRow({ label, value, strong = false }: { label: ReactNode; value: ReactNode; strong?: boolean }) {
  return (
    <div className="stat-row">
      <span className="k">{label}</span>
      <span className="v" style={strong ? { color: "var(--indigo)" } : undefined}>
        {value}
      </span>
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="segmented" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          className={option.value === value ? "active" : ""}
          onClick={() => onChange(option.value)}
          role="tab"
          aria-selected={option.value === value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Progress({ value, color = "var(--indigo)" }: { value: number; color?: string }) {
  return (
    <div className="progress">
      <span style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, background: color }} />
    </div>
  );
}

export function MatrixStrip({ items }: { items: { value: number; color: string; label?: string }[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  return (
    <div className="matrix-strip" aria-hidden="true">
      {items.map((item, index) => (
        <span
          key={index}
          title={item.label}
          style={{ width: `${(item.value / total) * 100}%`, background: item.color }}
        />
      ))}
    </div>
  );
}

export function LinkArrow({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className="insight-link" to={to}>
      {children}
      <ArrowUpRight />
    </Link>
  );
}

export function EmptyState({ title, text, icon }: { title: string; text?: string; icon?: ReactNode }) {
  return (
    <div className="empty-state">
      {icon ?? <Layers3 />}
      <h3>{title}</h3>
      {text ? <p>{text}</p> : null}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="skeleton-page" aria-label="Loading page">
      <div className="skeleton" style={{ width: "28%", height: 12 }} />
      <div className="skeleton" style={{ width: "54%", height: 42 }} />
      <div className="skeleton" style={{ width: "72%", height: 14 }} />
      <div className="grid grid-3" style={{ marginTop: 12 }}>
        {[0, 1, 2].map((index) => (
          <div className="skeleton" style={{ height: 148 }} key={index} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 330 }} />
    </div>
  );
}

export function InlineStat({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <span className="row" style={{ gap: 6 }}>
      <span className="muted tiny">{label}</span>
      <b className="num" style={{ fontSize: 11 }}>{value}</b>
    </span>
  );
}
