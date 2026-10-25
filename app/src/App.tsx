import { Component, lazy, Suspense } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Layout } from "./components/Layout";
import { SkeletonPage } from "./components/ui";

const Overview = lazy(() => import("./pages/Overview"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Insights = lazy(() => import("./pages/Insights"));
const Program = lazy(() => import("./pages/Program"));
const DataAudit = lazy(() => import("./pages/DataAudit"));
const Distributions = lazy(() => import("./pages/Distributions"));
const Interactions = lazy(() => import("./pages/Interactions"));
const Temporal = lazy(() => import("./pages/Temporal"));
const Advanced = lazy(() => import("./pages/Advanced"));
const Statistics = lazy(() => import("./pages/Statistics"));
const Features = lazy(() => import("./pages/Features"));
const Model = lazy(() => import("./pages/Model"));
const Economics = lazy(() => import("./pages/Economics"));
const Experiments = lazy(() => import("./pages/Experiments"));
const Lineage = lazy(() => import("./pages/Lineage"));
const Logs = lazy(() => import("./pages/Logs"));
const Explore = lazy(() => import("./pages/Explore"));
const Metrics = lazy(() => import("./pages/Metrics"));
const Findings = lazy(() => import("./pages/Findings"));
const Artifacts = lazy(() => import("./pages/Artifacts"));
const Walkthrough = lazy(() => import("./pages/Walkthrough"));
const Presentation = lazy(() => import("./pages/Presentation"));
const ReportComposer = lazy(() => import("./pages/ReportComposer"));
const Refresh = lazy(() => import("./pages/Refresh"));
const Snapshots = lazy(() => import("./pages/Snapshots"));
const ScenarioLab = lazy(() => import("./pages/ScenarioLab"));
const Copilot = lazy(() => import("./pages/Copilot"));
const Operations = lazy(() => import("./pages/Operations"));

interface BoundaryState {
  error: Error | null;
}

class PageBoundary extends Component<{ children: ReactNode; route: string }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[page-error] ${this.props.route}`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-screen">
          <div className="eyebrow">Page error</div>
          <h1>This view could not be rendered.</h1>
          <p>
            The rest of the console is unaffected. The failure was contained to this route so the underlying data can be
            inspected without losing the session.
          </p>
          <code>{this.state.error.message}</code>
          <div className="row wrap mt-16">
            <button type="button" className="btn btn-primary" onClick={() => this.setState({ error: null })}>
              Retry this view
            </button>
            <a className="btn" href="/">
              Back to overview
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Splash() {
  return (
    <div className="splash">
      <div className="splash-inner">
        <div className="brand-mark splash-mark">TF</div>
        <div className="splash-kicker">Transaction Fraud Detection</div>
        <h1>Assembling the evidence.</h1>
        <p>Loading the run manifest, analysis tables and the Phase 2 evidence layer from the research run.</p>
        <div className="splash-bar"><span /></div>
        <div className="splash-foot">
          <span>Static · source-backed</span>
          <span>No network calls</span>
        </div>
      </div>
    </div>
  );
}

function ErrorScreen({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="error-screen">
      <div className="eyebrow">Data layer error</div>
      <h1>The evidence could not be assembled.</h1>
      <p>
        The static data package did not load. Run <code style={{ display: "inline", padding: "1px 5px" }}>python analytics/build_dataset.py</code>{" "}
        from the workspace root, then reload.
      </p>
      <code>{message}</code>
      <button type="button" className="btn btn-primary mt-16" onClick={retry}>
        Retry loading
      </button>
    </div>
  );
}

const ROUTES: { path: string; element: ReactNode }[] = [
  { path: "/", element: <Overview /> },
  { path: "/portfolio", element: <Portfolio /> },
  { path: "/walkthrough", element: <Walkthrough /> },
  { path: "/reports", element: <ReportComposer /> },
  { path: "/insights", element: <Insights /> },
  { path: "/program", element: <Program /> },
  { path: "/data-audit", element: <DataAudit /> },
  { path: "/distributions", element: <Distributions /> },
  { path: "/interactions", element: <Interactions /> },
  { path: "/temporal", element: <Temporal /> },
  { path: "/advanced", element: <Advanced /> },
  { path: "/statistics", element: <Statistics /> },
  { path: "/features", element: <Features /> },
  { path: "/model", element: <Model /> },
  { path: "/economics", element: <Economics /> },
  { path: "/experiments", element: <Experiments /> },
  { path: "/lineage", element: <Lineage /> },
  { path: "/logs", element: <Logs /> },
  { path: "/explore", element: <Explore /> },
  { path: "/metrics", element: <Metrics /> },
  { path: "/findings", element: <Findings /> },
  { path: "/artifacts", element: <Artifacts /> },
  { path: "/refresh", element: <Refresh /> },
  { path: "/snapshots", element: <Snapshots /> },
  { path: "/scenarios", element: <ScenarioLab /> },
  { path: "/copilot", element: <Copilot /> },
  { path: "/operations", element: <Operations /> },
];

function Gate() {
  const { manifest, analysis, loading, error, reload } = useApp();

  if (loading) return <Splash />;
  if (error || !manifest || !analysis) return <ErrorScreen message={error ?? "The manifest is incomplete."} retry={reload} />;

  return (
    <Routes>
      <Route
        path="/presentation"
        element={
          <PageBoundary route="/presentation">
            <Suspense fallback={<SkeletonPage />}>
              <Presentation />
            </Suspense>
          </PageBoundary>
        }
      />
      <Route element={<Layout />}>
        {ROUTES.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <PageBoundary route={route.path}>
                <Suspense fallback={<SkeletonPage />}>{route.element}</Suspense>
              </PageBoundary>
            }
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

const basename =
  import.meta.env.BASE_URL && import.meta.env.BASE_URL !== "./" && import.meta.env.BASE_URL !== "."
    ? import.meta.env.BASE_URL
    : undefined;

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <ThemeProvider>
        <AppProvider>
          <Gate />
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
