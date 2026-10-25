import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Activity,
  Bell,
  Bookmark,
  Bot,
  Boxes,
  ChartNoAxesCombined,
  Check,
  Clock3,
  FileText,
  FlaskConical,
  FolderKanban,
  GitCompareArrows,
  History,
  LayoutDashboard,
  LibraryBig,
  ListChecks,
  Layers3,
  Menu,
  Monitor,
  Moon,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  ScrollText,
  Search,
  Share2,
  ShieldCheck,
  Sigma,
  Sliders,
  Sparkles,
  Sun,
  TableProperties,
  Target,
  Wallet,
  X,
} from "lucide-react";
import { useManifest } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { SearchModal } from "./SearchModal";
import { SavedViewsModal } from "./SavedViewsModal";
import { ActivityCenterModal } from "./ActivityCenterModal";
import { fmtInt } from "../lib/format";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  count?: "findings" | "artifacts" | "experiments" | "metrics";
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Command",
    items: [
      { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/portfolio", label: "Project portfolio", icon: FolderKanban },
      { to: "/walkthrough", label: "Story walkthrough", icon: Sparkles },
      { to: "/reports", label: "Report composer", icon: FileText },
      { to: "/insights", label: "Insights", icon: Target },
    ],
  },
  {
    label: "Evidence",
    items: [
      { to: "/data-audit", label: "Data audit", icon: ShieldCheck },
      { to: "/distributions", label: "Distributions", icon: ChartNoAxesCombined },
      { to: "/interactions", label: "Interactions", icon: Network },
      { to: "/temporal", label: "Temporal", icon: Clock3 },
      { to: "/advanced", label: "Advanced viz", icon: Boxes },
      { to: "/statistics", label: "Statistics", icon: Sigma },
      { to: "/features", label: "Feature lab", icon: FlaskConical },
    ],
  },
  {
    label: "Decision",
    items: [
      { to: "/model", label: "Model", icon: Target },
      { to: "/economics", label: "Economics", icon: Wallet },
      { to: "/experiments", label: "Experiments", icon: GitCompareArrows, count: "experiments" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/refresh", label: "Data refresh", icon: RefreshCw },
      { to: "/snapshots", label: "Snapshots & diffs", icon: History },
      { to: "/scenarios", label: "What-if lab", icon: Sliders },
      { to: "/copilot", label: "Analytics copilot", icon: Bot },
      { to: "/operations", label: "Operations & health", icon: Activity },
    ],
  },
  {
    label: "Investigate",
    items: [
      { to: "/lineage", label: "Evidence map", icon: Network },
      { to: "/logs", label: "Run logs", icon: ScrollText },
      { to: "/explore", label: "Data explorer", icon: TableProperties },
    ],
  },
  {
    label: "Outputs",
    items: [
      { to: "/findings", label: "Findings ledger", icon: ListChecks, count: "findings" },
      { to: "/artifacts", label: "Artifacts", icon: LibraryBig, count: "artifacts" },
    ],
  },
  {
    label: "Reference",
    items: [
      { to: "/metrics", label: "Metric catalog", icon: Sigma, count: "metrics" },
      { to: "/program", label: "Program profile", icon: Layers3 },
    ],
  },
];

const PAGE_LABELS: Record<string, string> = {
  "/": "Overview",
  "/portfolio": "Project portfolio",
  "/walkthrough": "Story walkthrough",
  "/presentation": "Presentation mode",
  "/reports": "Report composer",
  "/refresh": "Data refresh center",
  "/snapshots": "Historical snapshots",
  "/scenarios": "What-if scenario lab",
  "/copilot": "Analytics copilot",
  "/insights": "Insights",
  "/program": "Program profile",
  "/data-audit": "Data audit",
  "/distributions": "Distributions",
  "/interactions": "Interactions",
  "/temporal": "Temporal structure",
  "/advanced": "Advanced visualisation",
  "/statistics": "Statistical tests",
  "/features": "Feature lab",
  "/model": "Model performance",
  "/economics": "Review economics",
  "/experiments": "Experiment comparison",
  "/lineage": "Evidence map",
  "/logs": "Run logs",
  "/explore": "Data explorer",
  "/metrics": "Metric catalog",
  "/findings": "Findings ledger",
  "/artifacts": "Artifacts & notebook",
};

const GROUP_OF: Record<string, string> = Object.fromEntries(
  NAV_GROUPS.flatMap((group) => group.items.map((item) => [item.to, group.label])),
);

const STORAGE_KEY = "fraud-console.sidebar-collapsed";

export function Layout() {
  const manifest = useManifest();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [savedViewsOpen, setSavedViewsOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const label = PAGE_LABELS[location.pathname] ?? "Evidence console";
  const group = GROUP_OF[location.pathname] ?? "Console";

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setCollapsed(false);
    }
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    document.title = `${label} · Transaction Fraud Detection`;
  }, [label]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // storage is optional
      }
      return next;
    });
  };

  const countFor = (kind?: NavItem["count"]) => {
    if (kind === "findings") return manifest.counts.findings;
    if (kind === "artifacts") return manifest.counts.figures + manifest.counts.interactive + manifest.counts.tables;
    if (kind === "experiments") return manifest.experiments.length;
    if (kind === "metrics") return 155;
    return null;
  };

  return (
    <div className={`shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {mobileOpen ? (
        <button type="button" className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />
      ) : null}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`} id="primary-navigation" aria-label="Primary navigation">
        <div className="brand">
          <Link to="/" className="brand-link" aria-label="Transaction Fraud Detection Overview">
            <div className="brand-mark" aria-hidden="true">TF</div>
            <div className="brand-text">
              <div className="brand-name">Transaction Fraud<br />Detection</div>
              <div className="brand-sub">Card Risk & Forensics</div>
            </div>
          </Link>
          <button
            type="button"
            className="icon-btn sidebar-collapse"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            aria-pressed={collapsed}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </button>
        </div>
        <div className="nav-scroll">
          {NAV_GROUPS.map((navGroup) => (
            <div className="nav-group" key={navGroup.label}>
              <div className="nav-label">{navGroup.label}</div>
              {navGroup.items.map((item) => {
                const Icon = item.icon;
                const count = countFor(item.count);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                  >
                    <Icon />
                    <span className="nav-text">{item.label}</span>
                    {count ? <span className="nav-meta">{count}</span> : null}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn mobile-menu"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            aria-controls="primary-navigation"
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
          <div className="breadcrumbs">
            <span>Sparkov program</span>
            <span className="crumb-sep">/</span>
            <span>{group}</span>
            <span className="crumb-sep">/</span>
            <strong className="crumb-page">{label}</strong>
          </div>
          <div className="topbar-spacer" />
          <div className="topbar-status">
            <span className="dot" />
            <span className="topbar-stat">{fmtInt(manifest.counts.transactions)} rows</span>
            <span className="topbar-stat">{manifest.counts.findings} findings</span>
          </div>

          {/* Share View Action */}
          <button
            type="button"
            className="icon-btn"
            onClick={copyShareLink}
            aria-label="Copy shareable analytical link"
            title={shared ? "Link copied to clipboard!" : "Copy shareable view link"}
          >
            {shared ? <Check size={14} className="text-success" /> : <Share2 size={14} />}
          </button>

          {/* Copilot Link */}
          <Link
            to="/copilot"
            className="btn btn-sm btn-ghost"
            style={{ padding: "4px 8px", fontSize: 11 }}
            title="Evidence-Grounded Analytics Copilot"
          >
            <Bot size={13} /> <span className="hide-mobile">Copilot</span>
          </Link>

          {/* Activity Center Notifications */}
          <button
            type="button"
            className="icon-btn"
            onClick={() => setActivityOpen(true)}
            aria-label="Activity and change intelligence notifications"
            title="Activity & Notifications"
            style={{ position: "relative" }}
          >
            <Bell size={14} />
            <span
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--indigo)",
              }}
            />
          </button>

          {/* Saved Workspaces */}
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSavedViewsOpen(true)}
            aria-label="Saved views and workspaces"
            title="Saved views and workspaces"
          >
            <Bookmark size={14} />
          </button>

          {/* Launch Executive Presentation Mode */}
          <Link
            to="/presentation"
            className="btn btn-sm btn-primary"
            style={{ padding: "4px 10px", fontSize: 11 }}
            title="Launch Executive Presentation Mode"
          >
            <Monitor size={12} /> <span className="hide-mobile">Present</span>
          </Link>

          <button
            type="button"
            className="icon-btn theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button type="button" className="search-trigger" onClick={() => setSearchOpen(true)} aria-label="Search evidence">
            <Search size={14} />
            <span>Search evidence...</span>
          </button>
        </header>
        <main className="content" id="main-content" ref={mainRef} tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="page-foot">
          <span>
            Built from {manifest.counts.figures} figures, {manifest.counts.tables} tables, {manifest.notebook.total_cells} notebook
            cells and a {manifest.counts.findings}-finding ledger.
          </span>
          <span>
            Run {manifest.run.start?.replace("T", " ")} · {manifest.run.platform} · static build · Power BI-style simulation, not a
            native PBIX
          </span>
        </footer>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} manifest={manifest} />
      <SavedViewsModal open={savedViewsOpen} onClose={() => setSavedViewsOpen(false)} />
      <ActivityCenterModal open={activityOpen} onClose={() => setActivityOpen(false)} />
    </div>
  );
}
