import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Database,
  ExternalLink,
  FileSearch,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PageHeader, Panel, SourceNote } from "../components/ui";
import { COPILOT_KNOWLEDGE_BASE, queryCopilot, CopilotResponse } from "../lib/copilotEngine";

const SUGGESTED_PROMPTS = [
  "What is the model PR-AUC performance?",
  "What is the OOD transfer gap?",
  "How many transactions were analyzed?",
  "How is Catch@1% calculated?",
  "What are the data contract findings?",
  "Which merchant categories have highest fraud?",
  "What are the statistical effect sizes?",
  "How is reproducibility classified?",
];

export default function Copilot() {
  const [queryInput, setQueryInput] = useState("");
  const [activeResponse, setActiveResponse] = useState<CopilotResponse>(COPILOT_KNOWLEDGE_BASE[0].response);
  const [queryHistory, setQueryHistory] = useState<string[]>([
    "What is the model PR-AUC performance?",
  ]);

  const handleAsk = (q: string) => {
    if (!q.trim()) return;
    const res = queryCopilot(q);
    setActiveResponse(res);
    setQueryHistory((prev) => [q, ...prev.filter((item) => item !== q)].slice(0, 8));
    setQueryInput("");
  };

  return (
    <div className="copilot-page">
      <PageHeader
        eyebrow="Evidence-Grounded Intelligence"
        title="Analytics Copilot & Natural Language Q&A"
        description="Ask natural-language questions about model benchmarks, data contracts, review economics, and statistical effect sizes. All answers are grounded strictly in canonical project evidence."
        actions={
          <div className="row wrap items-center" style={{ gap: 8 }}>
            <span className="badge badge-success" title="Deterministic Query Allowlist">
              <ShieldCheck size={12} /> Safe Allowlist
            </span>
            <span className="badge badge-neutral" title="Zero Hallucination">
              <Sparkles size={12} /> Evidence-Grounded
            </span>
          </div>
        }
      />

      {/* Suggested Quick Prompt Pills */}
      <div className="mt-16">
        <div className="text-xs font-semibold muted mb-8 row items-center" style={{ gap: 6 }}>
          <Lightbulb size={13} className="text-primary" />
          <span>Suggested Inquiries (Verified Knowledge Base):</span>
        </div>
        <div className="row wrap" style={{ gap: 6 }}>
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              type="button"
              key={prompt}
              className={`btn btn-sm text-xs ${activeResponse.question.toLowerCase().includes(prompt.toLowerCase().slice(0, 15)) ? "btn-primary" : ""}`}
              onClick={() => handleAsk(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Copilot Input Rail */}
      <div className="copilot-input-rail mt-16 p-12 bg-card border rounded row items-center" style={{ gap: 10 }}>
        <Bot size={20} className="text-primary flex-shrink-0" />
        <input
          type="text"
          className="input text-sm w-full"
          placeholder="Ask a question about the fraud research program (e.g., 'What is Catch@1%?', 'Show PR-AUC')..."
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAsk(queryInput);
            }
          }}
        />
        <button
          type="button"
          className="btn btn-sm btn-primary flex-shrink-0"
          onClick={() => handleAsk(queryInput)}
          disabled={!queryInput.trim()}
        >
          <Send size={13} /> Ask Copilot
        </button>
      </div>

      {/* Copilot Grounded Answer Canvas */}
      <div className="copilot-canvas mt-16">
        <Panel
          title={
            <div className="row wrap items-center" style={{ gap: 8 }}>
              <span>{activeResponse.question}</span>
              <span className="badge badge-primary">{activeResponse.category}</span>
            </div>
          }
          subtitle="Grounded response from verified analytical store"
        >
          <div className="copilot-answer-content">
            {/* Headline Answer */}
            <div className="copilot-headline p-16 bg-hover rounded border mb-16">
              <div className="row wrap justify-between items-center">
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div className="eyebrow">Verified Finding</div>
                  <h2 style={{ fontSize: 18, margin: "4px 0 0 0" }}>{activeResponse.headline}</h2>
                </div>
                {activeResponse.metricValue && (
                  <div className="stat-card" style={{ padding: "8px 16px", minWidth: 160, textAlign: "right" }}>
                    <span className="stat-label">{activeResponse.metricLabel ?? "Core Metric"}</span>
                    <b className="stat-value text-primary" style={{ fontSize: 20 }}>
                      {activeResponse.metricValue}
                    </b>
                  </div>
                )}
              </div>
            </div>

            {/* Calculation & Formula Explanation */}
            <div className="copilot-section mb-16">
              <div className="font-semibold text-xs tracking-wider uppercase muted mb-6">
                Calculation Methodology & Empirical Context:
              </div>
              <div className="text-sm" style={{ lineHeight: 1.6, whiteSpace: "pre-line" }}>
                {activeResponse.calculationExplanation}
              </div>
            </div>

            {/* Evidence Citations */}
            <div className="copilot-section mb-16">
              <div className="font-semibold text-xs tracking-wider uppercase muted mb-8">
                Supporting Evidence & Artifact Citations:
              </div>
              <div className="grid grid-2" style={{ gap: 10 }}>
                {activeResponse.citations.map((c, i) => (
                  <div key={i} className="citation-card p-10 border rounded bg-card row justify-between items-center">
                    <div>
                      <div className="font-semibold text-xs">{c.label}</div>
                      <div className="text-xs muted font-mono mt-2">{c.sourceFile} · {c.cellOrTable}</div>
                    </div>
                    <div className="row wrap items-center" style={{ gap: 6 }}>
                      <span className="badge badge-success tiny">{c.evidenceTier}</span>
                      <Link to={c.routeLink} className="icon-btn tiny" title={`Deep dive in ${c.routeLink}`}>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Caveats & Analytical Boundary */}
            {activeResponse.caveats && (
              <div className="copilot-caveat p-12 bg-warn-subtle text-warn border border-warn rounded mb-16">
                <div className="row items-center font-semibold text-xs" style={{ gap: 6 }}>
                  <ShieldAlert size={14} />
                  <span>Analytical Boundary & Caveat:</span>
                </div>
                <div className="text-xs mt-4">{activeResponse.caveats}</div>
              </div>
            )}

            {/* Follow-up Navigation Actions */}
            <div className="copilot-actions pt-12 border-t row wrap justify-between items-center">
              <span className="text-xs muted">Investigate further in dashboard:</span>
              <div className="row wrap" style={{ gap: 8 }}>
                {activeResponse.actionRoutes.map((act, i) => (
                  <Link key={i} to={act.to} className="btn btn-sm btn-ghost">
                    {act.label} <ArrowRight size={12} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <SourceNote className="mt-16">
        Analytics Copilot evaluates queries through a deterministic read-only allowlist. It does not execute arbitrary code or connect to external uncontrolled language models.
      </SourceNote>
    </div>
  );
}
