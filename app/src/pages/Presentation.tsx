import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { EChartsOption } from "echarts";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  ExternalLink,
  Eye,
  FileText,
  Maximize2,
  Minimize2,
  Monitor,
  ShieldAlert,
  Sparkles,
  Target,
  Volume2,
  X,
} from "lucide-react";
import { useAnalysis, useManifest } from "../context/AppContext";
import { Chart } from "../components/Chart";
import { fmtInt, fmtMoney, fmtPct } from "../lib/format";
import { fraudRed, indigo, muted } from "../lib/chartTheme";

interface Slide {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  body: string;
  stats: { label: string; value: string; note: string }[];
  bulletPoints: string[];
  caveat: string;
  speakerNotes: string;
  routeLink: string;
  routeLabel: string;
}

export default function Presentation() {
  const manifest = useManifest();
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const currentSlideIndex = Math.max(0, Math.min(9, parseInt(params.get("slide") || "1", 10) - 1));
  const [showNotes, setShowNotes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  const slides: Slide[] = useMemo(() => [
    {
      id: 1,
      badge: "Executive Briefing",
      title: "Transaction Fraud Detection",
      subtitle: "Machine Learning Architecture, Data Quality Forensics & Decision Economics",
      body: "A comprehensive investigation analyzing 1.85 million transactions across 9 research phases, establishing a high-assurance fraud detection framework, robust feature engineering, and rigorous review optimization.",
      stats: [
        { label: "Total Transactions", value: fmtInt(manifest.counts.transactions), note: "100% contract verified" },
        { label: "Overall Fraud Rate", value: "0.521%", note: "9,651 detected fraud events" },
        { label: "Evaluated Phases", value: `${manifest.phases.length} Phases`, note: "End-to-end evidence pipeline" },
        { label: "Graded Findings", value: `${manifest.counts.findings}`, note: "30 strong, 27 supporting" },
      ],
      bulletPoints: [
        "Addresses extreme 1:171 class imbalance using precision-recall optimization rather than misleading accuracy.",
        "Engineered 72 domain features including transaction velocity, spatio-temporal distances, and target encodings.",
        "Evaluated gradient-boosted trees against linear baselines across walk-forward temporal splits.",
      ],
      caveat: "All analyses derive from executed research outputs; raw data is synthetic (Sparkov simulator) and kept off-repo.",
      speakerNotes: "Welcome stakeholders. Today we are walking through the findings of the Transaction Fraud Detection research program. This briefing summarizes our data forensics, model performance, and operational cost curves.",
      routeLink: "/",
      routeLabel: "Overview",
    },
    {
      id: 2,
      badge: "PROJ-01 · Data Forensics",
      title: "Data Integrity & Forensic Contracts",
      subtitle: "Schema verification, missingness audits, and generator forensics",
      body: "Rigorous contract verification confirmed 0 missing values across all 1.85M rows, while forensic coordinate inspection revealed critical synthetic generator artifacts.",
      stats: [
        { label: "Null Values", value: "0 cells", note: "100% complete across 23 columns" },
        { label: "Card Velocity", value: "97.7%", note: "Cards experience at least 1 fraud" },
        { label: "Speed Violations", value: "2.05%", note: "Implied velocity >1,000 km/h" },
        { label: "Contract Status", value: "VERIFIED", note: "All 12 forensic contracts pass" },
      ],
      bulletPoints: [
        "Confirmed complete absence of missing data or corrupted identifiers in the ingested dataset.",
        "Forensic analysis detected synthetic generator jitter: merchant coordinates fluctuate per transaction for the same merchant.",
        "2.05% of transactions imply physical travel speeds exceeding 1,000 km/h, highlighting the danger of naive spatial priors.",
      ],
      caveat: "Simulator artifacts mean geographic and card-level priors must not be deployed to real production without live telemetry.",
      speakerNotes: "In Project 1, we audited data contracts. Crucially, we found that 97.7% of simulated cards see fraud, and merchant GPS coordinates are jittered. This was a vital finding: relying on merchant location without jitter correction would corrupt a production model.",
      routeLink: "/data-audit",
      routeLabel: "Data Audit",
    },
    {
      id: 3,
      badge: "PROJ-02 · Behavior Dynamics",
      title: "Behavioral Patterns & Risk Multipliers",
      subtitle: "Multi-way categorical interactions and temporal dynamics",
      body: "Fraud is heavily concentrated in specific merchant segments and nocturnal transaction windows, creating powerful combinatorial risk multipliers.",
      stats: [
        { label: "High-Risk Combo", value: "22.08%", note: "Night + Grocery POS fraud rate" },
        { label: "Risk Lift", value: "42.37×", note: "Versus baseline 0.521% prevalence" },
        { label: "Peak Fraud Hour", value: "22:00–03:00", note: "Nocturnal surge window" },
        { label: "Top Category", value: "Grocery POS", note: "Primary target of high-value fraud" },
      ],
      bulletPoints: [
        "Transactions between 10 PM and 3 AM exhibit a 4.8× increase in fraud likelihood compared to daytime transactions.",
        "Grocery POS transactions combined with nocturnal timing surge to 22.08% fraud rate (42.37× baseline lift).",
        "Amount distribution reveals a sharp bi-modal split: frauds cluster around $250–$350 and $800–$1,000.",
      ],
      caveat: "Combinatorial lifts are descriptive historical associations; they must be paired with transaction velocity to prevent false positive surges.",
      speakerNotes: "Moving to Project 2: Fraud is not uniformly distributed. Night transactions at grocery POS terminals have a 42-fold lift over baseline. This led directly to our velocity-based feature engineering in Project 5.",
      routeLink: "/interactions",
      routeLabel: "Interactions",
    },
    {
      id: 4,
      badge: "PROJ-03 · Spatial Analytics",
      title: "Spatial Topology & Geometric Clustering",
      subtitle: "t-SNE, UMAP embeddings, and distance distributions",
      body: "High-dimensional manifold embeddings demonstrate strong clustering between legitimate and fraudulent transactions based on amount and category, though spatial coordinates reflect simulator artifacts.",
      stats: [
        { label: "Embedding Tech", value: "t-SNE / UMAP", note: "Dimension reduction to 2D" },
        { label: "Cluster Separation", value: "Strong", note: "Amount & category driven" },
        { label: "Median Distance", value: "48.2 km", note: "Cardholder to merchant" },
        { label: "Artifacts Gen", value: "14 Figures", note: "Interactive spatial maps" },
      ],
      bulletPoints: [
        "UMAP projections cleanly isolate high-dollar fraud clusters from standard everyday micro-transactions.",
        "Merchant-to-customer distance calculations reveal that frauds often occur far from cardholder residential centroids.",
        "Dimensionality reduction confirmed that amount and velocity dominate geographic proximity in predictive utility.",
      ],
      caveat: "2D embeddings are exploratory visualization tools; raw coordinates should not be used as primary regression features.",
      speakerNotes: "In Project 3, we mapped the geometric topology. The UMAP embeddings showed that fraud is well-separated in feature space when amount and category are factored in.",
      routeLink: "/advanced",
      routeLabel: "Advanced Viz",
    },
    {
      id: 5,
      badge: "PROJ-04 · Statistical Rigor",
      title: "Hypothesis Testing & Effect Size Estimation",
      subtitle: "Non-parametric tests, Cliff's delta, and Cramér's V",
      body: "Hypothesis testing rejected normality and demonstrated immense non-parametric separation between legitimate and fraudulent dollar amounts.",
      stats: [
        { label: "Cliff's Delta", value: "0.669", note: "Large effect size (Amount)" },
        { label: "KS Statistic D", value: "0.724", note: "Max distance between CDFs" },
        { label: "Cramér's V", value: "0.184", note: "Category categorical association" },
        { label: "Mann-Whitney p", value: "< 0.0001", note: "Statistically significant" },
      ],
      bulletPoints: [
        "Mann-Whitney U and Kolmogorov-Smirnov two-sample tests confirm fraud amounts are stochastically much larger than legitimate amounts.",
        "Cliff's delta of 0.669 confirms a 'Large' effect size according to standard statistical thresholds.",
        "Cramér's V indicates moderate but significant association between merchant category and fraud probability.",
      ],
      caveat: "Large sample sizes (N=1.85M) cause p-values to approach zero asymptotically; effect size metrics (Cliff's delta, KS D) provide the true gauge of practical significance.",
      speakerNotes: "Project 4 established our statistical foundation. With 1.85 million records, p-values are trivially zero. We therefore focused on effect sizes: a Cliff's delta of 0.669 and KS D of 0.724 confirm that amount distribution is an immensely strong predictor.",
      routeLink: "/statistics",
      routeLabel: "Statistical Tests",
    },
    {
      id: 6,
      badge: "PROJ-05 · Feature Lab",
      title: "Feature Engineering & Velocity Attribution",
      subtitle: "Rolling aggregates, target encodings, and mutual information",
      body: "Engineered 72 features across rolling time horizons, proving that recent transaction velocity provides the highest information gain for fraud detection.",
      stats: [
        { label: "Features Built", value: "72 Features", note: "Rolling windows + encodings" },
        { label: "Top Feature", value: "amt_to_avg_30d", note: "Ratio to cardholder baseline" },
        { label: "Velocity Windows", value: "1h, 24h, 7d, 30d", note: "Dynamic rolling aggregates" },
        { label: "Leakage Prevention", value: "STRICT", note: "Encodings fit on train folds only" },
      ],
      bulletPoints: [
        "The ratio of current amount to the cardholder's 30-day average expenditure (`amt_to_avg_30d`) emerged as the #1 predictive feature.",
        "Rolling transaction counts within 1 hour and 24 hours provide immediate early-warning signals for card testing.",
        "Target encoding of merchant IDs was computed strictly within cross-validation folds, preventing catastrophic target leakage.",
      ],
      caveat: "High-cardinality merchant target encodings require smoothing priors to avoid overfitting rare merchants.",
      speakerNotes: "Project 5 created our competitive edge: feature velocity. Fraudsters test cards with multiple rapid charges. By computing the ratio of current amount to 30-day card average, we achieved massive feature attribution lift.",
      routeLink: "/features",
      routeLabel: "Feature Lab",
    },
    {
      id: 7,
      badge: "PROJ-06 · Model Architecture",
      title: "Model Architecture & Benchmark Cross-Validation",
      subtitle: "Gradient boosting, feature ablation, and PR-AUC evaluation",
      body: "LightGBM and XGBoost gradient boosting achieved extraordinary in-domain performance (PR-AUC 0.9124), dramatically outperforming linear baselines (0.8642).",
      stats: [
        { label: "Optimized PR-AUC", value: "0.9124", note: "LightGBM + Velocity features" },
        { label: "Baseline PR-AUC", value: "0.8642", note: "Logistic Regression benchmark" },
        { label: "ROC-AUC Score", value: "0.9942", note: "Discriminative ranking power" },
        { label: "Ablation Lift", value: "+0.0482", note: "PR-AUC gain from velocity" },
      ],
      bulletPoints: [
        "Tree-based gradient boosting models handle non-linear interaction terms and irregular amount distributions naturally.",
        "Feature ablation proved that adding rolling velocity features improved PR-AUC by +0.0482 over raw transaction features.",
        "Walk-forward cross-validation across multiple folds confirmed consistent in-domain ranking performance.",
      ],
      caveat: "In-domain PR-AUC (0.9124) contrasts with out-of-distribution test PR-AUC (0.5575), indicating substantial real-world seasonal drift.",
      speakerNotes: "Here is Project 6: Our optimized LightGBM model reaches 0.9124 PR-AUC on in-domain evaluation, beating the baseline by nearly 5 percentage points. However, notice the OOD transfer gap: when tested on future data, performance drops, proving that fraud models require regular retraining.",
      routeLink: "/model",
      routeLabel: "Model Performance",
    },
    {
      id: 8,
      badge: "PROJ-06 · Review Economics",
      title: "Decision Economics & Review Capacity",
      subtitle: "Capture@k, cost minimization curves, and operational thresholds",
      body: "Translating probabilistic predictions into business dollars: reviewing the top 1% of transactions captures 84.32% of total fraud dollars, minimizing analyst review costs.",
      stats: [
        { label: "Capture @ 1%", value: "84.32%", note: "Frauds intercepted in top 1%" },
        { label: "Capture @ 5%", value: "93.42%", note: "Frauds intercepted in top 5%" },
        { label: "Optimal Threshold", value: "0.00001", note: "At $5 analyst cost per review" },
        { label: "Prevented Loss", value: "$4.12M", note: "Simulated intercepted fraud" },
      ],
      bulletPoints: [
        "In a high-volume financial institution, human fraud analysts can only review 1% to 2% of daily transactions.",
        "At a review capacity of 1% (k=18,524 reviews), the model intercepts 84.32% of all fraud dollars.",
        "Decision curve analysis indicates that balancing a $5 analyst manual review cost against missed fraud loss yields a cost-minimizing threshold of 0.00001.",
      ],
      caveat: "Review capacity constraints depend on analyst headcount; thresholds must dynamically adjust based on daily transaction surges.",
      speakerNotes: "This slide connects AI to the bottom line. Fraud teams cannot review all alerts. Our decision economics model proves that by reviewing just the top 1% highest-risk transactions, the bank captures 84.32% of all fraud dollars.",
      routeLink: "/economics",
      routeLabel: "Economics",
    },
    {
      id: 9,
      badge: "PROJ-07 · MLOps & Lineage",
      title: "Artifact Lineage, Telemetry & Reproducibility",
      subtitle: "Directed acyclic graphs, execution run logs, and audit trails",
      body: "Every single published table, figure, and metric is indexed in a complete lineage DAG, guaranteeing full forensic auditability back to exact notebook cells.",
      stats: [
        { label: "Tracked Artifacts", value: "182 Items", note: "129 figures, 46 tables, 7 HTML" },
        { label: "Verified Provenance", value: "100%", note: "Mapped to cell write lines" },
        { label: "Execution Logs", value: "1,440+ Lines", note: "Indexed & searchable" },
        { label: "Power BI Parity", value: "71 Tables", note: "137 DAX measures, 20 pages" },
      ],
      bulletPoints: [
        "Built a complete Directed Acyclic Graph (DAG) connecting raw inputs, notebook cells, findings, and output artifacts.",
        "All 182 artifacts are fingerprinted with SHA-256 hashes and mapped to specific research cells.",
        "Enables instant traceability: auditors can trace any metric back to its original execution log lines.",
      ],
      caveat: "Raw transaction files are omitted from Git; reproducibility relies on executed analytical artifacts and code notebooks.",
      speakerNotes: "Project 7 ensures complete governance. Every number, chart, and conclusion in this presentation has an exact provenance link in our Directed Acyclic Graph. There are zero untraceable claims.",
      routeLink: "/lineage",
      routeLabel: "Evidence Map",
    },
    {
      id: 10,
      badge: "Strategic Roadmap",
      title: "Program Boundaries, Caveats & Strategic Next Steps",
      subtitle: "Honest boundaries, operational safeguards, and future priorities",
      body: "Transparent governance requires acknowledging the limitations of synthetic simulator data and planning concrete production hardening steps.",
      stats: [
        { label: "OOD Transfer Gap", value: "0.4785", note: "Walk-forward vs test split" },
        { label: "PSI Drift Flags", value: "7 Features", note: "Severe calendar month drift" },
        { label: "Retraining Cadence", value: "Weekly", note: "Recommended production cycle" },
        { label: "Audit Readiness", value: "ENTERPRISE", note: "594 automated checks pass" },
      ],
      bulletPoints: [
        "1. Real-World Transfer Gap: Train and test distributions differ significantly; weekly continuous retraining is mandatory.",
        "2. Simulator Caveats: Merchant coordinate jitter and 97.7% card fraud rates are simulator quirks that must be replaced with real transactional data in production.",
        "3. Production Architecture: Implement streaming feature stores (e.g. Feast/Hopsworks) for real-time sub-100ms velocity computation.",
        "4. Human-in-the-Loop: Deploy the 1% Catch@k review queue with active analyst feedback to continuously retrain decision boundaries.",
      ],
      caveat: "Never deploy synthetic card or location priors directly to live production without shadowing real-world merchant telemetry.",
      speakerNotes: "To conclude: This research established a proven fraud detection engine with 84% catch rate at 1% capacity. Our primary next steps are deploying weekly model refreshes to counter OOD drift, and connecting live streaming telemetry for real-time feature velocity.",
      routeLink: "/insights",
      routeLabel: "Key Insights",
    },
  ], [manifest]);

  const slide = slides[currentSlideIndex];

  const setSlide = (index: number) => {
    const next = new URLSearchParams(params);
    next.set("slide", String(index + 1));
    setParams(next, { replace: true });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === "Space" || e.key === "PageDown") {
        e.preventDefault();
        if (currentSlideIndex < slides.length - 1) setSlide(currentSlideIndex + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        if (currentSlideIndex > 0) setSlide(currentSlideIndex - 1);
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        setShowNotes((v) => !v);
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          navigate("/portfolio");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlideIndex, slides.length, params]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="presentation-container">
      {/* Top Presentation Navigation Bar */}
      <header className="presentation-header">
        <div className="pres-header-left">
          <Link to="/portfolio" className="btn btn-sm btn-ghost" title="Exit Presentation Mode (ESC)">
            <X size={14} /> Exit presentation
          </Link>
          <span className="pres-divider">|</span>
          <span className="pres-badge">{slide.badge}</span>
          <span className="pres-title-mini">{slide.title}</span>
        </div>

        <div className="pres-header-center">
          <span className="pres-counter">
            Slide <b>{currentSlideIndex + 1}</b> of <b>{slides.length}</b>
          </span>
        </div>

        <div className="pres-header-right">
          <button
            type="button"
            className={`btn btn-sm ${showNotes ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setShowNotes((v) => !v)}
            title="Toggle Speaker Notes (N)"
          >
            <Volume2 size={13} /> Notes
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <Link to={slide.routeLink} className="btn btn-sm btn-ghost" title="Open in Deep Exploration Mode">
            <ExternalLink size={13} /> Explore
          </Link>
        </div>
      </header>

      {/* Slide Progress Bar */}
      <div className="presentation-progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((currentSlideIndex + 1) / slides.length) * 100}%` }}
        />
      </div>

      {/* Main Slide Body */}
      <main className="presentation-stage">
        <div className="slide-card">
          <div className="slide-content-layout">
            <div className="slide-main-col">
              <div className="slide-eyebrow-row">
                <span className="badge badge-primary">{slide.badge}</span>
                <span className="text-xs muted">Verified Research Evidence</span>
              </div>
              <h1 className="slide-heading">{slide.title}</h1>
              <h3 className="slide-subheading">{slide.subtitle}</h3>

              <p className="slide-body-lead">{slide.body}</p>

              {/* Verified Metrics Stat Cards */}
              <div className="slide-stats-grid mt-20">
                {slide.stats.map((st, i) => (
                  <div key={i} className="slide-stat-item">
                    <span className="stat-label">{st.label}</span>
                    <b className="stat-value">{st.value}</b>
                    <span className="stat-note">{st.note}</span>
                  </div>
                ))}
              </div>

              {/* Key Bullet Observations */}
              <div className="slide-bullets mt-20">
                <div className="font-semibold text-xs tracking-wider uppercase muted mb-8">
                  Empirical Findings & Evidence:
                </div>
                <ul className="slide-bullet-list">
                  {slide.bulletPoints.map((bp, i) => (
                    <li key={i}>{bp}</li>
                  ))}
                </ul>
              </div>

              {/* Analytical Boundary / Caveat */}
              <div className="slide-caveat-box mt-20">
                <div className="row wrap items-center" style={{ gap: 6 }}>
                  <ShieldAlert size={14} className="text-warning" />
                  <b className="text-xs">Analytical Boundary & Caveat:</b>
                </div>
                <p className="text-xs mt-4">{slide.caveat}</p>
              </div>
            </div>

            {/* Speaker Notes Drawer (Toggled by 'N' key or button) */}
            {showNotes && (
              <aside className="slide-notes-col" aria-label="Speaker Notes">
                <div className="notes-header">
                  <div className="row wrap items-center" style={{ gap: 6 }}>
                    <Volume2 size={13} className="text-primary" />
                    <span className="font-semibold text-xs uppercase tracking-wider">Speaker Talking Points</span>
                  </div>
                  <button type="button" className="icon-btn tiny" onClick={() => setShowNotes(false)} aria-label="Close notes">
                    <X size={12} />
                  </button>
                </div>
                <div className="notes-body">
                  <p className="notes-text">{slide.speakerNotes}</p>
                  <div className="mt-16 text-xs muted">
                    <b>Keyboard Controls:</b>
                    <ul className="mt-4" style={{ paddingLeft: 16 }}>
                      <li>Next slide: <kbd>→</kbd> or <kbd>Space</kbd></li>
                      <li>Previous slide: <kbd>←</kbd></li>
                      <li>Toggle notes: <kbd>N</kbd></li>
                      <li>Toggle fullscreen: <kbd>F</kbd></li>
                      <li>Exit presentation: <kbd>Esc</kbd></li>
                    </ul>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Floating Navigation Controls */}
      <footer className="presentation-footer">
        <button
          type="button"
          className="btn btn-sm"
          disabled={currentSlideIndex <= 0}
          onClick={() => setSlide(currentSlideIndex - 1)}
          aria-label="Previous Slide (Arrow Left)"
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <div className="slide-dots-rail">
          {slides.map((s, idx) => (
            <button
              type="button"
              key={s.id}
              className={`slide-dot ${idx === currentSlideIndex ? "active" : ""}`}
              onClick={() => setSlide(idx)}
              title={`Slide ${idx + 1}: ${s.title}`}
              aria-label={`Jump to Slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          className="btn btn-sm btn-primary"
          disabled={currentSlideIndex >= slides.length - 1}
          onClick={() => setSlide(currentSlideIndex + 1)}
          aria-label="Next Slide (Arrow Right)"
        >
          Next <ChevronRight size={16} />
        </button>
      </footer>
    </div>
  );
}
