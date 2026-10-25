import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  RefreshCw,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";

export interface ActivityNotification {
  id: string;
  type: "success" | "warn" | "info";
  title: string;
  message: string;
  timestamp: string;
  routeLink: string;
  routeLabel: string;
  read: boolean;
}

const DEFAULT_NOTIFICATIONS: ActivityNotification[] = [
  {
    id: "notif-refresh-1",
    type: "success",
    title: "Data Refresh & Verification Succeeded",
    message: "Discovered 185 sources (24.35 MB). All 10 data contracts verified with 0 null cells.",
    timestamp: "10 minutes ago",
    routeLink: "/refresh",
    routeLabel: "Refresh Center",
    read: false,
  },
  {
    id: "notif-repro-1",
    type: "info",
    title: "Experiment Reproducibility Classified",
    message: "26 research models categorized across 4 reproducibility tiers (13 Tier-1 runs with retained code).",
    timestamp: "1 hour ago",
    routeLink: "/experiments",
    routeLabel: "Experiment Registry",
    read: false,
  },
  {
    id: "notif-drift-1",
    type: "warn",
    title: "Calendar Feature Drift Flagged",
    message: "Population Stability Index (PSI > 0.25) detected on 7 month-of-year encodings across the OOD boundary.",
    timestamp: "2 hours ago",
    routeLink: "/temporal",
    routeLabel: "Temporal Analysis",
    read: false,
  },
  {
    id: "notif-catch-1",
    type: "success",
    title: "Catch@1% Capacity Validated",
    message: "Verified Catch@1% capacity intercepts $4,121,806 (84.32% of total fraud loss) at k = 18,524 reviews.",
    timestamp: "1 day ago",
    routeLink: "/economics",
    routeLabel: "Decision Economics",
    read: true,
  },
];

export function ActivityCenterModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [notifications, setNotifications] = useState<ActivityNotification[]>(DEFAULT_NOTIFICATIONS);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <>
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Activity & Change Intelligence Center"
        ref={modalRef}
        style={{ maxWidth: 520 }}
      >
        <div
          className="p2-drawer-head"
          style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}
        >
          <div className="row wrap items-center" style={{ gap: 8 }}>
            <Bell size={16} className="text-primary" />
            <h2 style={{ fontSize: 16, margin: 0 }}>Activity & Change Intelligence</h2>
          </div>
          <button type="button" className="icon-btn tiny" onClick={onClose} aria-label="Close dialog">
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: 16 }}>
          <div className="row wrap justify-between items-center mb-12">
            <span className="text-xs muted">
              {notifications.filter((n) => !n.read).length} unread events
            </span>
            <div className="row wrap" style={{ gap: 8 }}>
              <button type="button" className="btn btn-sm btn-ghost text-xs" onClick={markAllRead}>
                <Check size={12} /> Mark read
              </button>
              <button type="button" className="btn btn-sm btn-ghost text-xs text-danger" onClick={clearAll}>
                <Trash2 size={12} /> Clear all
              </button>
            </div>
          </div>

          <div
            className="notifications-list"
            style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 360, overflowY: "auto" }}
          >
            {notifications.length === 0 ? (
              <div className="text-center p-20 text-xs muted">
                No new activity notifications. All pipeline sources and metrics are stable.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-card p-12 rounded border ${
                    !n.read ? "bg-hover border-primary" : "bg-card"
                  }`}
                  style={{ transition: "all 0.15s ease" }}
                >
                  <div className="row justify-between items-start">
                    <div className="row items-center font-semibold text-xs" style={{ gap: 6 }}>
                      {n.type === "success" ? (
                        <CheckCircle2 size={14} className="text-success" />
                      ) : n.type === "warn" ? (
                        <AlertTriangle size={14} className="text-warning" />
                      ) : (
                        <Info size={14} className="text-primary" />
                      )}
                      <span>{n.title}</span>
                    </div>
                    <span className="text-xs muted">{n.timestamp}</span>
                  </div>
                  <p className="text-xs mt-6 mb-8" style={{ lineHeight: 1.5 }}>
                    {n.message}
                  </p>
                  <div className="row justify-between items-center pt-6 border-t">
                    <Link
                      to={n.routeLink}
                      onClick={onClose}
                      className="text-xs text-primary font-semibold row items-center"
                      style={{ gap: 4 }}
                    >
                      <span>Investigate in {n.routeLabel}</span>
                      <ArrowRight size={12} />
                    </Link>
                    {!n.read && (
                      <span className="badge badge-primary tiny">New</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
