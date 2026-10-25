"""Build the import-ready Power BI data pack from the dashboard's source artifacts.

This does not create a PBIX. It writes a star schema (CSV), a DAX measure library,
theme JSON, page specification and manifest that can be imported into Power BI
Desktop. All values are derived from the same tables/JSON used by the React app.

Run:
    python powerbi/build_powerbi_pack.py
"""

from __future__ import annotations

import json
import math
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "app" / "public" / "data"
TABLES = ROOT / "tables"
OUT = ROOT / "powerbi"
OUT_DATA = OUT / "data"
OUT_DAX = OUT / "dax"
OUT_THEME = OUT / "theme"
OUT_PAGES = OUT / "pages"
for d in (OUT_DATA, OUT_DAX, OUT_THEME, OUT_PAGES):
    d.mkdir(parents=True, exist_ok=True)

MANIFEST = json.loads((DATA / "manifest.json").read_text(encoding="utf-8"))
ANALYSIS = json.loads((DATA / "analysis.json").read_text(encoding="utf-8"))

# Phase 2 evidence layer (optional: the pack still builds without it).
P2_DIR = DATA / "phase2"


def load_phase2(name: str) -> dict[str, Any]:
    path = P2_DIR / f"{name}.json"
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


P2 = {name: load_phase2(name) for name in ["program", "projects", "experiments", "lineage", "logs", "metrics", "insights", "anomalies", "artifacts"]}
P2_EXPERIMENT_GROUP: dict[str, str] = {}
P2_EXPERIMENT_RANK: dict[str, int | None] = {}
for item in P2.get("experiments", {}).get("items", []):
    P2_EXPERIMENT_GROUP[item["id"]] = item.get("groupId", "")
    P2_EXPERIMENT_RANK[item["id"]] = item.get("rankInGroup")

PAGE_DEFS = [
    {
        "page_id": "PAGE-01",
        "route": "/",
        "title": "Overview",
        "eyebrow": "Executive overview",
        "phase_ids": "P0,P1,P7",
        "purpose": "One-screen synthesis of scale, model evidence, transfer risk and review economics.",
        "primary_question": "What does the program establish, and how far does it transfer?",
        "visual_count": 8,
    },
    {
        "page_id": "PAGE-02",
        "route": "/data-audit",
        "title": "Data audit",
        "eyebrow": "P0 · Data audit & generator forensics",
        "phase_ids": "P0",
        "purpose": "Audit schema, missingness, contracts, split integrity and simulator artifacts before interpreting signal.",
        "primary_question": "Is the dataset trustworthy enough to analyse?",
        "visual_count": 9,
    },
    {
        "page_id": "PAGE-03",
        "route": "/distributions",
        "title": "Distributions",
        "eyebrow": "P1 · Univariate distributions",
        "phase_ids": "P1",
        "purpose": "Quantify amount, time, category and demographic separation with effect sizes.",
        "primary_question": "How far do fraud and genuine transactions separate on each axis?",
        "visual_count": 9,
    },
    {
        "page_id": "PAGE-04",
        "route": "/interactions",
        "title": "Interactions",
        "eyebrow": "P2 · Bivariate & interaction analysis",
        "phase_ids": "P2",
        "purpose": "Test card, category, geography and money interactions, separating simulator artifacts from signal.",
        "primary_question": "Where does risk concentrate when variables interact?",
        "visual_count": 10,
    },
    {
        "page_id": "PAGE-05",
        "route": "/temporal",
        "title": "Temporal",
        "eyebrow": "P3 · Temporal structure",
        "phase_ids": "P3",
        "purpose": "Track weekly rates, autocorrelation, STL, hazard and the 48-second train/test boundary.",
        "primary_question": "When does fraud cluster, and what changes at the split?",
        "visual_count": 7,
    },
    {
        "page_id": "PAGE-06",
        "route": "/advanced",
        "title": "Advanced viz",
        "eyebrow": "P4 · Unsupervised & dimensionality reduction",
        "phase_ids": "P4",
        "purpose": "Evaluate embeddings, clustering and anomaly detection without labels.",
        "primary_question": "Does fraud separate without supervision?",
        "visual_count": 9,
    },
    {
        "page_id": "PAGE-07",
        "route": "/statistics",
        "title": "Statistics",
        "eyebrow": "P5 · Statistical testing & effect sizes",
        "phase_ids": "P5",
        "purpose": "Replace significance-only claims with effect sizes, bootstrap intervals, FDR and clustered inference.",
        "primary_question": "Which differences are large and robust, not merely significant?",
        "visual_count": 8,
    },
    {
        "page_id": "PAGE-08",
        "route": "/features",
        "title": "Feature lab",
        "eyebrow": "P6 · Feature engineering & depth analyses",
        "phase_ids": "P6",
        "purpose": "Inspect causal encodings, velocity, high-risk combinations, hazard, EB shrinkage and leakage risk.",
        "primary_question": "Which behavioural features are leak-aware and useful?",
        "visual_count": 10,
    },
    {
        "page_id": "PAGE-09",
        "route": "/model",
        "title": "Model",
        "eyebrow": "P7 · Leak-aware model evaluation",
        "phase_ids": "P7",
        "purpose": "Evaluate ranking, drift, walk-forward transfer, calibration, robustness and segment errors.",
        "primary_question": "How good is the model in-domain, and why does it fail out-of-domain?",
        "visual_count": 11,
    },
    {
        "page_id": "PAGE-10",
        "route": "/economics",
        "title": "Economics",
        "eyebrow": "P7 · Review-budget economics",
        "phase_ids": "P7",
        "purpose": "Translate scores into capture@k, thresholds, missed dollars and false-positive cost.",
        "primary_question": "What review budget buys the most fraud loss reduction?",
        "visual_count": 8,
    },
    {
        "page_id": "PAGE-11",
        "route": "/findings",
        "title": "Findings",
        "eyebrow": "Evidence ledger",
        "phase_ids": "P0,P1,P2,P3,P4,P5,P6,P7",
        "purpose": "Search and filter 64 graded findings, link them to evidence, and surface independent audit notes.",
        "primary_question": "What exactly is claimed, at what grade, and on what evidence?",
        "visual_count": 7,
    },
    {
        "page_id": "PAGE-12",
        "route": "/artifacts",
        "title": "Artifacts",
        "eyebrow": "Report & reproducibility",
        "phase_ids": "P0,P1,P2,P3,P4,P5,P6,P7,P8",
        "purpose": "Browse 129 figures, 7 interactive artifacts, 46 tables, 66 notebook cells, logs, warnings and issues.",
        "primary_question": "Can every displayed number be traced to a generated artifact?",
        "visual_count": 8,
    },
    {
        "page_id": "PAGE-13",
        "route": "/insights",
        "title": "Insights",
        "eyebrow": "Investigation intelligence",
        "phase_ids": "P0,P1,P2,P3,P7",
        "purpose": "Deterministic, source-linked insight statements plus the anomaly watch with explicit methods and thresholds.",
        "primary_question": "What does the evidence actually say, and where is it bounded?",
        "visual_count": 7,
    },
    {
        "page_id": "PAGE-14",
        "route": "/experiments",
        "title": "Experiments",
        "eyebrow": "Comparison workspace",
        "phase_ids": "P7",
        "purpose": "Compare recorded model variants inside a shared evaluation family, with compatibility rules and absolute deltas.",
        "primary_question": "Which comparisons are legitimate, and what exactly differs?",
        "visual_count": 6,
    },
    {
        "page_id": "PAGE-15",
        "route": "/logs",
        "title": "Run logs",
        "eyebrow": "Run record",
        "phase_ids": "P0,P1,P2,P3,P4,P5,P6,P7,P8",
        "purpose": "Classified log events, message patterns and warning families from the notebook, warning register and build logs.",
        "primary_question": "What did the run record, and what did it skip?",
        "visual_count": 6,
    },
    {
        "page_id": "PAGE-16",
        "route": "/lineage",
        "title": "Evidence map",
        "eyebrow": "Lineage",
        "phase_ids": "P0,P1,P2,P3,P4,P5,P6,P7,P8",
        "purpose": "Trace sources, notebook cells, phases, findings and artifacts with verified and inferred edges.",
        "primary_question": "How does one artifact connect back to the run that produced it?",
        "visual_count": 5,
    },
    {
        "page_id": "PAGE-17",
        "route": "/explore",
        "title": "Data explorer",
        "eyebrow": "Table exploration",
        "phase_ids": "P0,P1,P2,P3,P4,P5,P6,P7,P8",
        "purpose": "Profile any generated table: schema, completeness, distributions, value frequency and correlations.",
        "primary_question": "What does the underlying table actually contain?",
        "visual_count": 5,
    },
    {
        "page_id": "PAGE-18",
        "route": "/metrics",
        "title": "Metric catalog",
        "eyebrow": "Semantic layer",
        "phase_ids": "P0,P1,P2,P3,P4,P5,P6,P7,P8",
        "purpose": "One definition, formula, source locator, validation check and caveat per metric.",
        "primary_question": "What does each metric mean and where does it come from?",
        "visual_count": 4,
    },
    {
        "page_id": "PAGE-19",
        "route": "/program",
        "title": "Program profile",
        "eyebrow": "Research program",
        "phase_ids": "P0,P1,P2,P3,P4,P5,P6,P7,P8",
        "purpose": "The program dossier: research questions, nine phase dossiers, run provenance, sources and reproducibility checklist.",
        "primary_question": "What was run, in what order, and what bounds it?",
        "visual_count": 6,
    },
    {
        "page_id": "PAGE-20",
        "route": "/portfolio",
        "title": "Project portfolio",
        "eyebrow": "Research initiatives",
        "phase_ids": "P0,P1,P2,P3,P4,P5,P6,P7,P8",
        "purpose": "Seven research project dossiers, deliverables, risk ratings and multi-track initiatives matrix.",
        "primary_question": "What research initiatives comprise the fraud defense portfolio?",
        "visual_count": 6,
    },
]

PAGE_BY_ID = {p["page_id"]: p for p in PAGE_DEFS}


def dt(value: Any) -> str:
    return str(value)[:10]


def write_csv(name: str, rows: list[dict[str, Any]] | pd.DataFrame) -> None:
    df = rows if isinstance(rows, pd.DataFrame) else pd.DataFrame(rows)
    df = df.replace([math.inf, -math.inf], pd.NA)
    df.to_csv(OUT_DATA / name, index=False, encoding="utf-8-sig", date_format="%Y-%m-%d")
    print(f"  {name:<38} {len(df):>5} rows x {len(df.columns):>2} cols")


def display_value(kpi: dict[str, Any]) -> str:
    value = kpi["value"]
    fmt = kpi["format"]
    if fmt == "integer":
        return f"{int(round(value)):,}"
    if fmt.startswith("percent"):
        digits = int(fmt[-1]) if fmt[-1].isdigit() else 2
        return f"{value * 100:.{digits}f}%"
    if fmt == "decimal4":
        return f"{value:.4f}"
    if fmt == "decimal3":
        return f"{value:.3f}"
    if fmt == "decimal2":
        return f"{value:.2f}"
    if fmt == "money":
        return f"${value:,.0f}"
    if fmt == "minutes":
        minutes = value / 60
        return f"{int(minutes // 60)}h {int(minutes % 60)}m"
    return str(value)


def phase_sort(phase_id: str) -> int:
    return 99 if phase_id == "SETUP" else int(phase_id[1:])


# ---------------------------------------------------------------------------
# dimensions
# ---------------------------------------------------------------------------

print("Building dimensions...")
dim_phase = []
dim_phase.append(
    {
        "phase_id": "SETUP",
        "phase_num": "—",
        "phase_name": "Environment setup",
        "short_name": "Setup",
        "section": "§00",
        "purpose": "Dependency bootstrap, seed and reproducibility contract.",
        "accent_hex": "#626878",
        "figure_count": 0,
        "table_count": 0,
        "interactive_count": 0,
        "finding_count": 0,
        "sort_order": -1,
        "is_report_phase": False,
    }
)
for p in sorted(MANIFEST["phases"], key=lambda x: int(x["id"][1:])):
    dim_phase.append(
        {
            "phase_id": p["id"],
            "phase_num": p["num"],
            "phase_name": p["name"],
            "short_name": p["short_name"],
            "section": p["section"],
            "purpose": p["purpose"],
            "accent_hex": p["accent"],
            "figure_count": p["figureCount"],
            "table_count": p["tableCount"],
            "interactive_count": p["interactiveCount"],
            "finding_count": p["findingCount"],
            "sort_order": int(p["id"][1:]),
            "is_report_phase": p["id"] == "P8",
        }
    )

dim_rq = []
for r in MANIFEST["rqs"]:
    dim_rq.append(
        {
            "rq_id": r["id"],
            "question": r["question"],
            "finding_count": r["findings"],
            "strong_count": r["strong"],
            "supports_count": r["supports"],
            "caveat_count": r["caveat"],
            "weak_count": r["weak"],
            "phase_ids": ", ".join(r["phases"]),
            "sort_order": int(r["id"][2:]),
        }
    )

dim_grade = []
for i, g in enumerate(MANIFEST["gradeDefs"]):
    dim_grade.append(
        {
            "grade": g["grade"],
            "grade_label": g["label"],
            "definition": g["definition"],
            "interpretation": g["interpretation"],
            "color_hex": g["color"],
            "sort_order": i,
        }
    )

dim_page = []
for i, p in enumerate(PAGE_DEFS):
    dim_page.append(
        {
            **p,
            "sort_order": i + 1,
            "target_width": 1440,
            "target_height": 900,
        }
    )

dim_split = [
    {"split": "train", "split_label": "Train", "sort_order": 1, "is_overall": False},
    {"split": "test", "split_label": "Test (OOD)", "sort_order": 2, "is_overall": False},
    {"split": "overall", "split_label": "Overall", "sort_order": 3, "is_overall": True},
    {"split": "boundary", "split_label": "Boundary week", "sort_order": 4, "is_overall": False},
]

categories = sorted({r["category"] for r in ANALYSIS["category_rates"]})
dim_category = [
    {"category": c, "sort_order": i + 1, "is_online": c.endswith("_net")}
    for i, c in enumerate(categories)
]

dim_segment = [
    {"segment": "category", "segment_label": "Merchant category", "sort_order": 1},
    {"segment": "hour_bin", "segment_label": "Hour bin", "sort_order": 2},
    {"segment": "state", "segment_label": "State", "sort_order": 3},
]

dim_psi_verdict = [
    {"verdict": "stable", "psi_rule": "PSI < 0.10", "sort_order": 1, "color_hex": "#1F9D73"},
    {"verdict": "moderate", "psi_rule": "0.10 ≤ PSI < 0.25", "sort_order": 2, "color_hex": "#D97A18"},
    {"verdict": "severe", "psi_rule": "PSI ≥ 0.25", "sort_order": 3, "color_hex": "#D1495B"},
]

# Weekly dimension with exact split assignment.
weekly = ANALYSIS["weekly_series"]
dim_week = []
for i, row in enumerate(weekly):
    date = dt(row["date"])
    if date == "2021-01-03":
        split = "edge"
        partial = True
    elif date == "2020-06-21":
        split = "boundary"
        partial = False
    elif date <= "2020-06-14":
        split = "train"
        partial = False
    else:
        split = "test"
        partial = False
    d = datetime.fromisoformat(date)
    iso = d.isocalendar()
    dim_week.append(
        {
            "week_end": date,
            "iso_year": iso.year,
            "iso_week": iso.week,
            "month": d.month,
            "month_name": d.strftime("%b"),
            "quarter": f"Q{(d.month - 1) // 3 + 1}",
            "year": d.year,
            "split": split,
            "is_partial": partial,
            "sort_order": i + 1,
        }
    )

# Daily date dimension. Each day maps to the Sunday-ending week used by the
# weekly facts, so a date slicer can filter the 105-point weekly series.
first_date = datetime.fromisoformat(dt(weekly[0]["date"])) - timedelta(days=5)  # Monday 2019-01-01
last_date = datetime.fromisoformat(dt(weekly[-1]["date"]))
dim_date = []
d = first_date
while d <= last_date:
    week_end = d + timedelta(days=6 - d.weekday())
    iso = d.isocalendar()
    dim_date.append(
        {
            "date": d.date().isoformat(),
            "year": d.year,
            "quarter": f"Q{(d.month - 1) // 3 + 1}",
            "month": d.month,
            "month_name": d.strftime("%B"),
            "month_short": d.strftime("%b"),
            "day": d.day,
            "day_of_week_num": d.isoweekday(),
            "day_name": d.strftime("%A"),
            "day_short": d.strftime("%a"),
            "iso_year": iso.year,
            "iso_week": iso.week,
            "week_end": week_end.date().isoformat(),
            "is_weekend": d.weekday() >= 5,
            "year_month": d.strftime("%Y-%m"),
            "week_label": f"W{iso.week:02d} {iso.year}",
            "sort_order": (d - first_date).days + 1,
        }
    )
    d += timedelta(days=1)

write_csv("dim_phase.csv", dim_phase)
write_csv("dim_rq.csv", dim_rq)
write_csv("dim_grade.csv", dim_grade)
write_csv("dim_page.csv", dim_page)
write_csv("dim_split.csv", dim_split)
write_csv("dim_category.csv", dim_category)
write_csv("dim_segment.csv", dim_segment)
write_csv("dim_psi_verdict.csv", dim_psi_verdict)
write_csv("dim_week.csv", dim_week)
write_csv("dim_date.csv", dim_date)

# ---------------------------------------------------------------------------
# facts
# ---------------------------------------------------------------------------

print("Building facts...")

# KPI fact.
kpi_rows = []
for k in MANIFEST["kpis"]:
    primary = {
        "transactions": "PAGE-01",
        "fraud_rate": "PAGE-01",
        "findings": "PAGE-11",
        "artifacts": "PAGE-12",
        "run_time": "PAGE-12",
        "strong_findings": "PAGE-11",
        "test_pr_auc": "PAGE-09",
        "wf_pr_auc": "PAGE-09",
        "ood_gap": "PAGE-09",
        "capture_1pct": "PAGE-10",
    }.get(k["id"], "PAGE-01")
    kpi_rows.append(
        {
            "kpi_id": k["id"],
            "label": k["label"],
            "value": k["value"],
            "format": k["format"],
            "display_value": display_value(k),
            "unit": "percent" if k["format"].startswith("percent") else ("USD" if k["format"] == "money" else "number"),
            "definition": k["definition"],
            "formula": k["formula"],
            "source": k["source"],
            "verification": k["verification"],
            "context": k["context"],
            "primary_page_id": primary,
        }
    )
write_csv("fact_kpi.csv", kpi_rows)

# Class balance.
class_balance = []
for i, r in enumerate(ANALYSIS["class_balance"]):
    class_balance.append(
        {
            "split": r["split"],
            "transaction_count": int(r["n"]),
            "fraud_count": int(r["fraud"]),
            "fraud_rate": r["fraud_rate"],
            "sort_order": i + 1,
        }
    )
write_csv("fact_class_balance.csv", class_balance)

# Weekly facts.
weekly_rows = []
for i, r in enumerate(weekly):
    weekly_rows.append(
        {
            "week_end": dt(r["date"]),
            "transaction_count": int(r["size"]),
            "fraud_count": int(r["sum"]),
            "fraud_rate": r["rate"],
            "sort_order": i + 1,
        }
    )
write_csv("fact_weekly_rate.csv", weekly_rows)

# Findings.
finding_rows = []
for f in MANIFEST["findings"]:
    finding_rows.append(
        {
            "finding_id": f["id"],
            "rq_id": f["rq"],
            "phase_id": f["phase"],
            "grade": f["grade"],
            "finding": f["finding"],
            "evidence": (f.get("evidence") or "").replace("\n", " ")[:2000],
            "source_file": f.get("sourceFile"),
            "source_row": f.get("sourceRow"),
            "ledger_phase": f.get("ledgerPhase"),
            "cell_range": f.get("cellRange"),
            "audit_note_id": f.get("auditNoteId"),
            "audit_status": f.get("auditStatus"),
            "has_audit_note": bool(f.get("auditNoteId")),
        }
    )
write_csv("fact_finding.csv", finding_rows)

# Experiments.
experiment_rows = []
for e in MANIFEST["experiments"]:
    family = e["family"]
    if family == "Walk-forward folds":
        page = "PAGE-09"
    elif family == "Unsupervised anomaly" or family == "Unsupervised embeddings":
        page = "PAGE-06"
    elif family == "Hour encoding":
        page = "PAGE-08"
    else:
        page = "PAGE-09"
    experiment_rows.append(
        {
            "experiment_id": e["id"],
            "experiment_family": family,
            "group_id": P2_EXPERIMENT_GROUP.get(e["id"], ""),
            "rank_in_group": P2_EXPERIMENT_RANK.get(e["id"]),
            "label": e["label"],
            "description": e["description"],
            "metric": e["metric"],
            "pr_auc": e.get("pr_auc"),
            "roc_auc": e.get("roc_auc"),
            "test_pr_auc": e.get("test_pr_auc"),
            "test_roc_auc": e.get("test_roc_auc"),
            "n_features": e.get("n_features"),
            "n_train": e.get("n_train"),
            "n_rows": e.get("n_rows"),
            "split": e.get("split"),
            "source": e.get("source"),
            "comparison_note": e.get("comparisonNote"),
            "primary_page_id": page,
        }
    )
write_csv("fact_experiment.csv", experiment_rows)

# Ablation: recompute the honest delta vs FULL.
full_pr = next(r["pr_auc"] for r in ANALYSIS["ablation"] if r["model"].startswith("FULL"))
ablation_rows = []
for r in ANALYSIS["ablation"]:
    ablation_rows.append(
        {
            "model": r["model"],
            "n_features": int(r["n_features"]),
            "pr_auc": r["pr_auc"],
            "roc_auc": r["roc_auc"],
            "delta_vs_full": r["pr_auc"] - full_pr,
            "is_full": r["model"].startswith("FULL"),
            "source_delta_column_ignored": r["delta_pr_auc"],
        }
    )
write_csv("fact_ablation.csv", ablation_rows)

# Walk-forward.
write_csv(
    "fact_walkforward.csv",
    [
        {
            "fold": int(r["fold"]),
            "validation_window": r["val_window"],
            "n_train": int(r["n_train"]),
            "n_val": int(r["n_val"]),
            "validation_pr_auc": r["pr_auc"],
            "validation_roc_auc": r["roc_auc"],
            "test_pr_auc": r["test_pr_auc"],
            "test_roc_auc": r["test_roc_auc"],
            "ood_gap_pr": r["ood_gap_pr"],
        }
        for r in ANALYSIS["walkforward"]
    ],
)

# PSI.
write_csv(
    "fact_psi.csv",
    [
        {
            "feature": r["feature"],
            "family": r["family"],
            "n_train": int(r["n_train"]),
            "n_test": int(r["n_test"]),
            "psi": r["psi"],
            "verdict": r["verdict"],
            "top_driver_bin": r["top_driver_bin"],
        }
        for r in ANALYSIS["psi"]
    ],
)

# Capture.
write_csv(
    "fact_capture.csv",
    [
        {
            "budget_pct": r["top_pct"],
            "review_count": int(r["k"]),
            "fraud_caught": int(r["fraud_caught"]),
            "precision": r["precision"],
            "recall": r["recall"],
            "usd_captured": r["usd_captured"],
            "usd_share": r["usd_share"],
            "usd_per_review": r["usd_per_review"],
        }
        for r in ANALYSIS["capture"]
    ],
)

# Thresholds.
threshold_rows = []
for r in ANALYSIS["thresholds"]:
    f1 = 2 * r["precision"] * r["recall"] / (r["precision"] + r["recall"]) if (r["precision"] + r["recall"]) else None
    threshold_rows.append(
        {
            "threshold": r["threshold"],
            "tp": int(r["TP"]),
            "fp": int(r["FP"]),
            "fn": int(r["FN"]),
            "tn": int(r["TN"]),
            "precision": r["precision"],
            "recall": r["recall"],
            "f1": f1,
            "fp_cost_total": r["fp_cost"],
            "missed_usd": r["missed_usd"],
            "total_loss": r["total_loss"],
            "usd_captured_share": r["usd_captured"],
            "is_cost_min": r["threshold"] == min(x["threshold"] for x in ANALYSIS["thresholds"]),
            "is_f1_max": abs(r["threshold"] - 0.11267) < 1e-6,
        }
    )
write_csv("fact_threshold.csv", threshold_rows)

write_csv(
    "fact_cost_sensitivity.csv",
    [
        {
            "fp_cost": r["fp_cost"],
            "optimal_threshold": r["optimal_threshold"],
            "expected_loss": r["expected_loss"],
            "recall": r["recall"],
            "precision": r["precision"],
        }
        for r in ANALYSIS["cost"]
    ],
)

# Category, money, quantiles.
write_csv(
    "fact_category.csv",
    [
        {
            "category": r["category"],
            "transaction_count": int(r["n"]),
            "fraud_count": int(r["k"]),
            "fraud_rate": r["rate"],
            "ci_low": r.get("lo"),
            "ci_high": r.get("hi"),
            "q_vs_baseline": r.get("q_vs_base"),
            "significant": r.get("sig"),
            "sparse": r.get("sparse"),
            "baseline_rate": r.get("baseline"),
        }
        for r in ANALYSIS["category_rates"]
    ],
)
write_csv(
    "fact_money_category.csv",
    [
        {
            "category": r["category"],
            "fraud_count": int(r["n_fraud"]),
            "fraud_usd": r["fraud_usd"],
            "usd_per_fraud": r["usd_per_fraud"],
        }
        for r in ANALYSIS["money"]
    ],
)
write_csv(
    "fact_quantile.csv",
    [
        {
            "quantile": r["quantile"],
            "amount_all": r["amt"],
            "amount_fraud": r["amt_fraud"],
            "amount_nonfraud": r["amt_nonfraud"],
        }
        for r in ANALYSIS["quantiles"]
    ],
)

# Card profiles.
write_csv(
    "fact_card_profile.csv",
    [
        {
            "cc_num": str(r["cc_num"]),
            "transaction_count": int(r["n"]),
            "fraud_count": int(r["k"]),
            "fraud_rate": r["fraud_rate"],
            "amount_mean": r["amt_mean"],
            "amount_std": r["amt_std"],
            "hour_entropy": r["hour_entropy"],
            "geo_entropy": r["geo_entropy"],
            "fraud_rate_bin": r["fraud_rate_bin"],
        }
        for r in ANALYSIS["cards"]
    ],
)

write_csv(
    "fact_hazard.csv",
    [
        {
            "month": int(r["month"]),
            "at_risk": int(r["n_risk"]),
            "first_fraud_events": int(r["events"]),
            "hazard": r["hazard"],
            "ci_low": r["lo"],
            "ci_high": r["hi"],
        }
        for r in ANALYSIS["hazard"]
    ],
)
write_csv(
    "fact_speed.csv",
    [
        {
            "speed_band_kmh": r["speed_kmh"],
            "transaction_count": int(r["n"]),
            "fraud_count": int(r["k"]),
            "fraud_rate": r["rate"],
        }
        for r in ANALYSIS["speed"]
    ],
)
write_csv(
    "fact_high_risk_combo.csv",
    [
        {
            "segment": r["segment"],
            "transaction_count": int(r["n"]),
            "fraud_rate": r["fraud_rate"],
            "lift_vs_baseline": r["lift_vs_base"],
        }
        for r in ANALYSIS["combos"]
    ],
)
write_csv(
    "fact_segment_error.csv",
    [
        {
            "segment": r["segment"],
            "segment_label": r["segmentLabel"],
            "transaction_count": r["n"],
            "fraud_count": r["n_fraud"],
            "recall": r["recall"],
            "false_positives": r["fp"],
        }
        for r in ANALYSIS["segments"]
    ],
)

# Issues, audit notes, warnings.
write_csv(
    "fact_issue.csv",
    [
        {
            "issue_id": i["id"],
            "title": i["title"],
            "severity": i["severity"],
            "category": i["category"],
            "scope": i["scope"],
            "status": i["status"],
            "confidence": i["confidence"],
            "summary": i["summary"],
            "impact": i["impact"],
            "action": i["action"],
            "phase_id": i["phase"],
            "evidence": " | ".join(i["evidence"]),
            "sources": " | ".join(i["sources"]),
        }
        for i in MANIFEST["issues"]
    ],
)
write_csv(
    "fact_audit_note.csv",
    [
        {
            "audit_note_id": a["id"],
            "title": a["title"],
            "status": a["status"],
            "claim": a["claim"],
            "observation": a["observation"],
            "implication": a["implication"],
            "phase_id": a["phase"],
            "sources": " | ".join(a["sources"]),
        }
        for a in MANIFEST["auditNotes"]
    ],
)
write_csv(
    "fact_warning.csv",
    [
        {
            "warning_id": w["id"],
            "severity": w["severity"],
            "category": w["category"],
            "message": w["message"],
            "detail": w["detail"],
            "notebook_cell": w["cell"],
            "phase_id": w["phase"],
        }
        for w in MANIFEST["warnings"]
    ],
)

# Artifact catalog.
write_csv(
    "fact_table.csv",
    [
        {
            "table_id": t["id"],
            "title": t["title"],
            "category": t["category"],
            "description": t["description"],
            "phase_id": t["phase"],
            "row_count": t["rows"],
            "column_count": t["cols"],
            "missing_cells": t["missing_cells"],
            "bytes": t["bytes"],
            "source": t["source"],
        }
        for t in MANIFEST["tables"]
    ],
)
figure_rows = []
for f in MANIFEST["figures"]:
    figure_rows.append(
        {
            "artifact_id": f["id"],
            "artifact_type": "static",
            "title": f["title"],
            "caption": f["caption"],
            "phase_id": f["phase"],
            "artifact_group": f["group"],
            "bytes": f["bytes"],
            "width_px": f["width"],
            "height_px": f["height"],
            "thumbnail_path": f["thumb"],
            "full_path": f["full"],
            "source": f["source"],
        }
    )
for h in MANIFEST["htmlArtifacts"]:
    figure_rows.append(
        {
            "artifact_id": h["id"],
            "artifact_type": "interactive",
            "title": h["title"],
            "caption": h["caption"],
            "phase_id": h["phase"],
            "artifact_group": h["group"],
            "bytes": h["bytes"],
            "width_px": None,
            "height_px": None,
            "thumbnail_path": None,
            "full_path": h["full"],
            "source": h["source"],
        }
    )
write_csv("fact_artifact.csv", figure_rows)

# Notebook cells (previews, not full source).
notebook = json.loads((DATA / "notebook.json").read_text(encoding="utf-8"))
write_csv(
    "fact_notebook_cell.csv",
    [
        {
            "cell_index": c["index"],
            "cell_type": c["type"],
            "phase_id": c["phase"],
            "is_code": c["is_code"],
            "execution_count": c["exec"],
            "embedded_images": c["images"],
            "source_chars": len(c["source"]),
            "output_chars": c["output_chars"],
            "has_output": bool(c["output"]),
            "source_preview": (c["source"] or "")[:500].replace("\n", " "),
            "output_preview": (c["output"] or "")[:500].replace("\n", " "),
        }
        for c in notebook["cells"]
    ],
)

write_csv(
    "fact_checklist.csv",
    [{"item": r["item"], "evidence": r["evidence"], "passed": r["ok"]} for r in ANALYSIS["checklist"]],
)
write_csv(
    "fact_missing_column.csv",
    [
        {
            "column": r["column"],
            "dtype": r["dtype"],
            "missing_pct": r["missingPct"],
            "non_null": r["nonNull"],
            "unique_values": r["unique"],
            "role": r["role"],
        }
        for r in MANIFEST["dataQuality"]["missing"]
    ],
)
write_csv(
    "fact_contract.csv",
    [
        {
            "contract": r["contract"],
            "observed_value": r["actual"],
            "status": r["status"],
        }
        for r in MANIFEST["dataQuality"]["contracts"]
    ],
)
dq = MANIFEST["dataQuality"]["summary"]
write_csv(
    "fact_data_quality.csv",
    [
        {"metric": "transactions", "value": int(dq["rows"]), "unit": "rows", "note": "All train + test transactions."},
        {"metric": "analytical_columns", "value": int(dq["columns"]), "unit": "columns", "note": "Raw plus derived columns after audit."},
        {"metric": "raw_columns", "value": int(dq["rawColumns"]), "unit": "columns", "note": "Original Sparkov columns before feature engineering."},
        {"metric": "missing_columns", "value": int(dq["missingColumns"]), "unit": "columns", "note": "Columns with at least one missing value."},
        {"metric": "max_missing_pct", "value": dq["maxMissingPct"], "unit": "percent", "note": "Maximum column-level missing share (amt_z_prior)."},
        {"metric": "duplicate_trans_num", "value": int(dq["duplicateTransNum"]), "unit": "rows", "note": "Duplicate transaction identifiers."},
        {"metric": "flagged_contracts", "value": int(dq["flaggedContracts"]), "unit": "checks", "note": "Age minimum is 13.9 years."},
        {"metric": "contracts", "value": int(dq["contracts"]), "unit": "checks", "note": "Explicit data-quality checks recorded."},
        {"metric": "zip_under_10000", "value": int(dq["zipUnder10000"]), "unit": "rows", "note": "Consistent with lost ZIP leading zeros."},
        {"metric": "processed_memory_mb", "value": dq["memoryMB"], "unit": "MB", "note": "In-memory processed DataFrame."},
    ],
)
write_csv(
    "fact_learning_curve.csv",
    [{"train_fraction": r["frac"], "n_train": int(r["n_train"]), "pr_auc": r["pr_auc"], "roc_auc": r["roc_auc"]} for r in ANALYSIS["learning"]],
)
write_csv(
    "fact_leave_card_out.csv",
    [{"slice": r["slice"], "n": int(r["n"]), "fraud_count": int(r["n_fraud"]), "pr_auc": r["pr_auc"], "roc_auc": r["roc_auc"]} for r in ANALYSIS["leave_card"]],
)
write_csv(
    "fact_calibration.csv",
    [
        {
            "temperature": r["T"],
            "ece_before": r["ece_before"],
            "ece_after": r["ece_after"],
            "brier_before": r["brier_before"],
            "brier_after": r["brier_after"],
            "nll_before": r["nll_before"],
            "nll_after": r["nll_after"],
        }
        for r in ANALYSIS["calibration_temp"]
    ],
)
for name, rows in [
    ("fact_ensemble.csv", ANALYSIS["ensemble"]),
    ("fact_monotonic.csv", ANALYSIS["monotonic"]),
    ("fact_time_decay.csv", ANALYSIS["time_decay"]),
]:
    write_csv(
        name,
        [
            {
                "model": r["model"],
                "pr_auc": r["pr_auc"],
                "roc_auc": r["roc_auc"],
            }
            for r in rows
        ],
    )
write_csv(
    "fact_source.csv",
    [
        {
            "source_name": s["name"],
            "role": s["role"],
            "present": s["present"],
            "bytes": s["bytes"],
            "hash_prefix": s["hash"],
            "note": s["note"],
        }
        for s in MANIFEST["sources"]
    ],
)

# Supporting analysis tables used by the deeper report pages.
def src(name: str) -> pd.DataFrame:
    return pd.read_csv(TABLES / name, encoding="utf-8-sig")


schema_df = src("phase0_schema.csv").rename(columns={"Unnamed: 0": "column"})
write_csv(
    "fact_schema.csv",
    [
        {
            "column": r["column"],
            "dtype": r["dtype"],
            "non_null": r["non_null"],
            "missing_pct": r["missing_pct"],
            "unique_values": r["n_unique"],
            "memory_mb": r["memory_MB"],
            "role": r["role"],
            "is_index_artifact": r["column"] == "Index",
        }
        for _, r in schema_df.iterrows()
    ],
)
generator_df = src("phase0_generator_forensics.csv").rename(columns={"Unnamed: 0": "metric"})
write_csv(
    "fact_generator.csv",
    [{"metric": r["metric"], "value": str(r["value"])} for _, r in generator_df.iterrows()],
)
anomaly_df = src("phase4_anomaly_summary.csv")
write_csv(
    "fact_anomaly.csv",
    [
        {
            "model": r["model"],
            "auc": r["auc"],
            "top_decile_precision": r["top10pct_precision"],
            "top_decile_lift": r["top10pct_lift"],
            "n_rows": r["n"],
        }
        for _, r in anomaly_df.iterrows()
    ],
)
cluster_rows = []
for _, r in src("phase4_dbscan_clusters.csv").iterrows():
    cluster_rows.append(
        {
            "cluster_method": "DBSCAN",
            "cluster_label": r["cluster"],
            "transaction_count": int(r["n"]),
            "fraud_rate": r["fraud_rate"],
            "fraud_count": round(r["n"] * r["fraud_rate"]),
        }
    )
for _, r in src("phase4_kmeans_cluster_rate.csv").iterrows():
    cluster_rows.append(
        {
            "cluster_method": "K-Means",
            "cluster_label": f"cluster {int(r['cluster'])}",
            "transaction_count": int(r["n"]),
            "fraud_rate": r["rate"],
            "fraud_count": int(r["k_fraud"]),
        }
    )
write_csv("fact_cluster.csv", cluster_rows)
separability_df = src("phase4_separability_table.csv").rename(columns={"Unnamed: 0": "embedding", "0": "auc"})
write_csv(
    "fact_embedding.csv",
    [{"embedding": r["embedding"], "auc": r["auc"]} for _, r in separability_df.iterrows()],
)
write_csv(
    "fact_effect_size.csv",
    [
        {
            "feature": r["feature"],
            "fraud_count": r["n_fraud"],
            "nonfraud_count": r["n_nonfraud"],
            "median_fraud": r["med_fraud"],
            "median_nonfraud": r["med_nonfraud"],
            "mann_whitney_u": r["U"],
            "p_value": r["p_mw"],
            "ks_d": r["ks_D"],
            "cohens_d": r["cohens_d"],
            "cliffs_delta": r["cliffs_delta"],
            "cliffs_low": r["cliffs_lo"],
            "cliffs_high": r["cliffs_hi"],
            "q_fdr": r["q_fdr"],
        }
        for _, r in src("phase5_mw_effect_sizes.csv").iterrows()
    ],
)
write_csv(
    "fact_chi2.csv",
    [
        {
            "variable": r["variable"],
            "levels": r["levels"],
            "chi2": r["chi2"],
            "degrees_of_freedom": r["dof"],
            "p_value": r["p"],
            "cramers_v": r["cramers_v"],
            "n_rows": r["n"],
        }
        for _, r in src("phase5_chi2_cramers.csv").iterrows()
    ],
)
write_csv(
    "fact_logit.csv",
    [
        {
            "feature": r["feature"],
            "coefficient": r["coef"],
            "odds_ratio": r["OR"],
            "naive_se": r["se_naive"],
            "cluster_se": r["se_cluster"],
            "cluster_z": r["z_cluster"],
            "cluster_p": r["p_cluster"],
            "robust_or_low": r["OR_lo_robust"],
            "robust_or_high": r["OR_hi_robust"],
            "n_clusters": r["n_clusters"],
        }
        for _, r in src("phase5_cluster_robust_logit.csv").iterrows()
    ],
)
write_csv(
    "fact_posthoc.csv",
    [
        {
            "category_a": r["a"],
            "category_b": r["b"],
            "chi2": r["chi2"],
            "p_value": r["p"],
            "cramers_v": r["cramers_v"],
            "p_bonferroni": r["p_bonf"],
        }
        for _, r in src("phase5_category_posthoc_pairs.csv").iterrows()
    ],
)
hour_df = src("phase7_hour_encoding_comparison.csv").rename(columns={"Unnamed: 0": "encoding", "val PR-AUC": "pr_auc"})
write_csv(
    "fact_hour_encoding.csv",
    [{"encoding": r["encoding"], "validation_pr_auc": r["pr_auc"]} for _, r in hour_df.iterrows()],
)
write_csv(
    "fact_merchant.csv",
    [
        {
            "merchant": r["merchant_clean"],
            "transaction_count": int(r["n"]),
            "fraud_count": int(r["k"]),
            "fraud_rate": r["rate"],
        }
        for _, r in src("phase1_merchant_table.csv").iterrows()
    ],
)
city_df = src("phase2_city_table.csv").rename(columns={"Unnamed: 0": "city_id"})
write_csv(
    "fact_city.csv",
    [
        {
            "city": r["city"],
            "latitude": r["lat"],
            "longitude": r["lon"],
            "transaction_count": int(r["n"]),
            "fraud_count": int(r["k"]),
            "eb_fraud_rate": r["eb_rate"],
        }
        for _, r in city_df.iterrows()
    ],
)
zip_df = src("phase2_zip3_table.csv").rename(columns={"Unnamed: 0": "zip3_id"})
write_csv(
    "fact_zip3.csv",
    [
        {
            "zip3": int(r["zip3"]),
            "transaction_count": int(r["n"]),
            "fraud_count": int(r["k"]),
            "fraud_rate": r["rate"],
            "ci_low": r["lo"],
            "ci_high": r["hi"],
            "q_vs_baseline": r["q_vs_base"],
            "sparse": r["sparse"],
            "significant": r["sig"],
            "eb_fraud_rate": r["eb_rate"],
        }
        for _, r in zip_df.iterrows()
    ],
)

# ---------------------------------------------------------------------------
# Phase 2 evidence layer: facts, dimensions and relationships
# ---------------------------------------------------------------------------

if P2:
    # ---- dimensions -------------------------------------------------------
    scope_labels = {
        "data": "Data & splits",
        "drift": "Drift",
        "economics": "Economics",
        "evidence": "Evidence quality",
        "features": "Features",
        "logs": "Run & logs",
        "model": "Model",
        "temporal": "Temporal",
    }
    dim_insight_scope = [
        {"scope": scope, "scope_label": scope_labels.get(scope, scope.title()), "sort_order": index + 1}
        for index, scope in enumerate(P2.get("insights", {}).get("scopes", []))
    ]
    write_csv("dim_insight_scope.csv", dim_insight_scope)

    dim_experiment_group = [
        {
            "group_id": group["id"],
            "group_label": group["label"],
            "metric_name": group["metric"],
            "is_comparable": group["comparable"],
            "member_count": group["count"],
            "basis": group["basis"],
            "limitations": group["limitations"],
            "sort_order": index + 1,
        }
        for index, group in enumerate(P2.get("experiments", {}).get("groups", []))
    ]
    write_csv("dim_experiment_group.csv", dim_experiment_group)

    dim_provenance_status = [
        {"provenance": "verified", "label": "Verified", "rule": "A write line for the artifact exists in a recorded notebook output.", "sort_order": 1},
        {"provenance": "inferred", "label": "Inferred", "rule": "The artifact belongs to the phase, but no producing cell was located.", "sort_order": 2},
    ]
    write_csv("dim_provenance_status.csv", dim_provenance_status)

    node_type_labels = {
        "run": "Run",
        "notebook": "Notebook",
        "source": "Source",
        "phase": "Phase",
        "rq": "Research question",
        "finding": "Finding",
        "audit": "Audit note",
        "issue": "Workspace issue",
        "figure": "Figure",
        "interactive": "Interactive artifact",
        "table": "Table",
    }
    node_types = P2.get("lineage", {}).get("counts", {}).get("nodeTypes", {})
    dim_node_type = [
        {"node_type": node_type, "label": node_type_labels.get(node_type, node_type.title()), "node_count": count, "sort_order": index + 1}
        for index, (node_type, count) in enumerate(sorted(node_types.items(), key=lambda kv: -kv[1]))
    ]
    write_csv("dim_node_type.csv", dim_node_type)

    # ---- facts ------------------------------------------------------------
    insight_rows = [
        {
            "insight_id": item["id"],
            "scope": item["scope"],
            "phase_id": item.get("phase") or "",
            "rq_id": item.get("rq") or "",
            "priority": item["priority"],
            "kind": item["kind"],
            "title": item["title"],
            "statement": item["statement"],
            "detail": item["detail"],
            "confidence": item["confidence"],
            "caveat": item["caveat"],
            "primary_page_id": "PAGE-13",
            "source_refs": " | ".join(item.get("sourceRefs", [])),
        }
        for item in P2.get("insights", {}).get("items", [])
    ]
    write_csv("fact_insight.csv", insight_rows)

    anomaly_rows = []
    for item in P2.get("anomalies", {}).get("weekly", []):
        anomaly_rows.append(
            {
                "anomaly_id": item["id"],
                "anomaly_series": item["series"],
                "anomaly_label": item["label"],
                "value": item["value"],
                "value_format": item["format"],
                "severity": item["severity"],
                "method": item["method"],
                "threshold": item["threshold"],
                "reference_population": item["reference"],
                "z_score": item.get("zScore"),
                "denominator": item.get("denominator"),
                "events": item.get("events"),
                "phase_id": "P3",
                "primary_page_id": "PAGE-13",
                "source": item["source"],
                "interpretation": item["interpretation"],
                "not_a_proof": item["notAProof"],
            }
        )
    for item in P2.get("anomalies", {}).get("drift", []):
        anomaly_rows.append(
            {
                "anomaly_id": item["id"],
                "anomaly_series": item["series"],
                "anomaly_label": item["label"],
                "value": item["value"],
                "value_format": item["format"],
                "severity": item["severity"],
                "method": item["method"],
                "threshold": item["threshold"],
                "reference_population": item["reference"],
                "z_score": None,
                "denominator": None,
                "events": None,
                "phase_id": "P7",
                "primary_page_id": "PAGE-13",
                "source": item["source"],
                "interpretation": item["interpretation"],
                "not_a_proof": item["notAProof"],
            }
        )
    for item in P2.get("anomalies", {}).get("exportExceptions", []):
        anomaly_rows.append(
            {
                "anomaly_id": item["id"],
                "anomaly_series": item["series"],
                "anomaly_label": item["label"],
                "value": item["value"],
                "value_format": item["format"],
                "severity": item["severity"],
                "method": item["method"],
                "threshold": item["threshold"],
                "reference_population": item["reference"],
                "z_score": None,
                "denominator": None,
                "events": None,
                "phase_id": "P8",
                "primary_page_id": "PAGE-13",
                "source": item["source"],
                "interpretation": item["interpretation"],
                "not_a_proof": item["notAProof"],
            }
        )
    write_csv("fact_anomaly_flag.csv", anomaly_rows)

    provenance_rows = [
        {
            "artifact_id": item["id"],
            "artifact_kind": item["kind"],
            "artifact_title": item["title"],
            "phase_id": item["phase"],
            "provenance": item["provenance"],
            "producing_cell": item.get("cell"),
            "cell_write_line": item.get("cellLine"),
            "related_finding_count": len(item.get("relatedFindings", [])),
            "primary_rq_id": item.get("relatedRq") or "",
            "bytes": item.get("bytes"),
            "rows": item.get("rows"),
            "primary_page_id": "PAGE-12",
        }
        for item in P2.get("artifacts", {}).get("items", [])
    ]
    write_csv("fact_artifact_provenance.csv", provenance_rows)

    metric_rows = [
        {
            "metric_id": item["id"],
            "layer": item["layer"],
            "metric_name": item["metric"],
            "value_text": item["value"],
            "numeric_value": item.get("numericValue"),
            "unit": item["unit"],
            "confidence": item["confidence"],
            "validation_checks": item["validationChecks"],
            "source_file": item["sourceFile"],
            "source_locator": item["sourceLocator"],
            "source_table_id": item.get("sourceTableId") or "",
            "caveat": item["caveat"],
            "primary_page_id": "PAGE-18",
        }
        for item in P2.get("metrics", {}).get("items", [])
    ]
    write_csv("fact_metric_catalog.csv", metric_rows)

    log_pattern_rows = [
        {
            "pattern_id": item["id"],
            "severity": item["severity"],
            "category": item["category"],
            "occurrence_count": item["count"],
            "phase_ids": " | ".join(item.get("phases", [])),
            "cell_count": len(item.get("cells", [])),
            "signature": item["signature"],
            "example": item["example"],
            "primary_page_id": "PAGE-15",
        }
        for item in P2.get("logs", {}).get("patterns", [])
    ]
    write_csv("fact_log_pattern.csv", log_pattern_rows)

    lineage_node_rows = [
        {
            "node_id": node["id"],
            "node_label": node["label"],
            "node_type": node["type"],
            "phase_id": node.get("phase", ""),
            "route": node.get("route", ""),
            "provenance": node.get("provenance", ""),
            "is_absent": bool(node.get("absent", False)),
            "grade": node.get("grade", ""),
            "severity": node.get("severity", ""),
            "primary_page_id": "PAGE-16",
        }
        for node in P2.get("lineage", {}).get("nodes", [])
    ]
    write_csv("fact_lineage_node.csv", lineage_node_rows)

    lineage_edge_rows = [
        {
            "edge_id": f"E{index + 1:04d}",
            "from_node": link["source"],
            "to_node": link["target"],
            "relation": link["relation"],
            "is_verified": link["verified"],
            "primary_page_id": "PAGE-16",
        }
        for index, link in enumerate(P2.get("lineage", {}).get("links", []))
    ]
    write_csv("fact_lineage_edge.csv", lineage_edge_rows)

    project_rows = [
        {
            "project_id": p["id"],
            "title": p["title"],
            "short_title": p.get("shortTitle", p["title"]),
            "track": p.get("track", ""),
            "lead_role": p.get("leadRole", ""),
            "phase_range": p.get("phaseRange", ""),
            "cell_range": p.get("cellRange", ""),
            "risk_level": p.get("riskLevel", ""),
            "status": p.get("status", "Complete"),
            "finding_count": p.get("findingCount", 0),
            "strong_count": p.get("strongCount", 0),
            "artifact_count": p.get("artifactCount", 0),
            "route": p.get("route", ""),
            "primary_page_id": "PAGE-20",
        }
        for p in P2.get("projects", {}).get("projects", [])
    ]
    write_csv("fact_project.csv", project_rows)


# ---------------------------------------------------------------------------
# manifest and README metrics
# ---------------------------------------------------------------------------

table_files = sorted(OUT_DATA.glob("*.csv"))
data_rows = {}
for p in table_files:
    df = pd.read_csv(p, encoding="utf-8-sig")
    data_rows[p.name] = {
        "rows": len(df),
        "columns": [str(c) for c in df.columns],
        "bytes": p.stat().st_size,
    }

relationships = [
    ("dim_phase", "phase_id", "fact_finding", "phase_id", "1:*", "single"),
    ("dim_phase", "phase_id", "fact_table", "phase_id", "1:*", "single"),
    ("dim_phase", "phase_id", "fact_artifact", "phase_id", "1:*", "single"),
    ("dim_phase", "phase_id", "fact_issue", "phase_id", "1:*", "single"),
    ("dim_phase", "phase_id", "fact_audit_note", "phase_id", "1:*", "single"),
    ("dim_phase", "phase_id", "fact_warning", "phase_id", "1:*", "single"),
    ("dim_rq", "rq_id", "fact_finding", "rq_id", "1:*", "single"),
    ("dim_grade", "grade", "fact_finding", "grade", "1:*", "single"),
    ("dim_page", "page_id", "fact_kpi", "primary_page_id", "1:*", "single"),
    ("dim_page", "page_id", "fact_experiment", "primary_page_id", "1:*", "single"),
    ("dim_split", "split", "fact_class_balance", "split", "1:*", "single"),
    ("dim_week", "week_end", "fact_weekly_rate", "week_end", "1:*", "single"),
    # Daily date table -> weekly dimension is many-to-one. A slicer on dim_date[date]
    # must be able to filter dim_week, so this one bridge is bidirectional. There is
    # no other relationship to dim_date, so no ambiguous filter path is introduced.
    ("dim_date", "week_end", "dim_week", "week_end", "*:1", "both"),
    ("dim_category", "category", "fact_category", "category", "1:*", "single"),
    ("dim_category", "category", "fact_money_category", "category", "1:*", "single"),
    ("dim_segment", "segment", "fact_segment_error", "segment", "1:*", "single"),
    ("dim_psi_verdict", "verdict", "fact_psi", "verdict", "1:*", "single"),
]

if P2:
    relationships += [
        ("dim_insight_scope", "scope", "fact_insight", "scope", "1:*", "single"),
        ("dim_phase", "phase_id", "fact_insight", "phase_id", "1:*", "single"),
        ("dim_rq", "rq_id", "fact_insight", "rq_id", "1:*", "single"),
        ("dim_phase", "phase_id", "fact_anomaly_flag", "phase_id", "1:*", "single"),
        ("dim_phase", "phase_id", "fact_artifact_provenance", "phase_id", "1:*", "single"),
        ("dim_rq", "rq_id", "fact_artifact_provenance", "primary_rq_id", "1:*", "single"),
        ("dim_provenance_status", "provenance", "fact_artifact_provenance", "provenance", "1:*", "single"),
        ("dim_page", "page_id", "fact_metric_catalog", "primary_page_id", "1:*", "single"),
        ("dim_page", "page_id", "fact_insight", "primary_page_id", "1:*", "single"),
        ("dim_page", "page_id", "fact_anomaly_flag", "primary_page_id", "1:*", "single"),
        ("dim_page", "page_id", "fact_artifact_provenance", "primary_page_id", "1:*", "single"),
        ("dim_page", "page_id", "fact_log_pattern", "primary_page_id", "1:*", "single"),
        ("dim_page", "page_id", "fact_lineage_node", "primary_page_id", "1:*", "single"),
        ("dim_page", "page_id", "fact_lineage_edge", "primary_page_id", "1:*", "single"),
        ("dim_experiment_group", "group_id", "fact_experiment", "group_id", "1:*", "single"),
        ("dim_node_type", "node_type", "fact_lineage_node", "node_type", "1:*", "single"),
        ("dim_page", "page_id", "fact_project", "primary_page_id", "1:*", "single"),
    ]

measure_file = OUT_DAX / "measures.dax"
measure_count = 0
if measure_file.exists():
    measure_count = len(re.findall(r"(?m)^MEASURE\s+", measure_file.read_text(encoding="utf-8")))

pack_manifest = {
    "generatedAt": datetime.now().isoformat(timespec="seconds"),
    "name": "Fraud Evidence Console — Power BI import pack",
    "version": "2.0.0",
    "native_pbix": False,
    "note": (
        "This is an import-ready star schema, DAX library, theme and page specification. "
        "It is not a PBIX/PBIP file. Build the report in Power BI Desktop using the CSVs "
        "and the page specifications."
    ),
    "source": "app/public/data/manifest.json + analysis.json + phase2/*.json; tables/*.csv",
    "counts": {
        "tables": len(table_files),
        "dimensions": len([p for p in table_files if p.name.startswith("dim_")]),
        "facts": len([p for p in table_files if p.name.startswith("fact_")]),
        "measures": measure_count,
        "pages": len(PAGE_DEFS),
        "relationships": len(relationships),
        "date_dimension_rows": len(dim_date),
    },
    "tables": data_rows,
    "relationships": [
        {
            "from_table": a,
            "from_column": b,
            "to_table": c,
            "to_column": d,
            "cardinality": e,
            "cross_filter": f,
        }
        for a, b, c, d, e, f in relationships
    ],
    "pages": PAGE_DEFS,
    "measures_file": "dax/measures.dax",
    "theme_file": "theme/fraud_evidence_theme.json",
    "page_spec": "pages/page_spec.md",
    "model_guide": "relationships.md",
    "date_dimension": {
        "table": "dim_date",
        "mark_as_date_table": "dim_date[date]",
        "relationship": "dim_date[week_end] *:1 dim_week[week_end]",
        "cross_filter": "both",
        "why_bidirectional": (
            "dim_date has one row per day and repeats week_end seven times; dim_week has one row "
            "per week_end. A date slicer must propagate from the many side to the one side. This is "
            "the only bidirectional relationship and the only relationship touching dim_date."
        ),
    },
    "caveats": [
        "Raw Kaggle CSVs are absent; the pack is built from generated artifacts.",
        "Test metrics are out-of-distribution transfer estimates, not production generalization.",
        "The ablation source `delta_pr_auc` column is relative to raw-only; use `fact_ablation[delta_vs_full]`.",
        "The threshold table's `fp_cost_total` is total cost at $5/FP, not a per-FP parameter.",
        "The final week (2021-01-03) is a partial zero-fraud edge week; dim_week marks it is_partial = TRUE.",
        "Fact tables are pre-aggregated snapshots, not transaction rows. Do not sum across fact tables.",
        "The Power BI pack is not a native PBIX and has not been opened in Power BI Desktop on this machine.",
        "fact_insight and fact_anomaly_flag carry the console's deterministic rules. They are not model-generated statements.",
        "fact_lineage_edge.is_verified = FALSE marks an inferred edge; keep the distinction in any visual that draws the graph.",
        "Experiment groups are not comparable across dim_experiment_group rows; compare inside one group_id.",
    ],
}
(OUT / "manifest.json").write_text(json.dumps(pack_manifest, indent=2), encoding="utf-8")
print(f"  manifest.json                            {len(pack_manifest['tables'])} tables listed")
print(f"Wrote {len(table_files)} CSV files to {OUT_DATA}")
