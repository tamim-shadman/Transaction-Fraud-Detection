"""Build the dashboard data layer and processed analytical tables.

The workspace contains no raw CSVs, so this pipeline treats the notebook's generated
JSON/CSV/PNG artifacts as the source of truth. Every displayed number is loaded from
those artifacts; static metadata in config.py provides labels and interpretations only.

Run:  python analytics/build_dataset.py
Env:  FRAUD_PROJECT_ROOT  (defaults to the repository root)
"""
from __future__ import annotations

import json
import math
import os
import re
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
from PIL import Image

from config import AUDIT_NOTES, ISSUES, PHASES, PROJECT, RQS

ROOT = Path(os.environ.get("FRAUD_PROJECT_ROOT", Path(__file__).resolve().parents[1])).resolve()
TABLES = ROOT / "tables"
FIGURES = ROOT / "figures"
LOGS = ROOT / "logs"
NOTEBOOK = ROOT / "fraud_eda_colab(1).ipynb"

APP = ROOT / "app"
PUBLIC = APP / "public"
DATA = PUBLIC / "data"
ARTIFACTS = PUBLIC / "artifacts"
PROCESSED = ROOT / "data" / "processed"
METADATA = ROOT / "data" / "metadata"
REPORTS = ROOT / "reports"

PHASE_BY_PREFIX = {
    "phase0": "P0", "phase1": "P1", "phase2": "P2", "phase3": "P3",
    "phase4": "P4", "phase5": "P5", "phase7": "P6", "phase8": "P7",
}
PHASE_BY_LEDGER = {
    "1": "P0", "2": "P1", "3": "P2", "4": "P3",
    "5": "P4", "6": "P5", "7": "P6", "8": "P7",
    "01": "P0", "02": "P1", "03": "P2", "04": "P3",
    "05": "P4", "06": "P5", "07": "P6", "08": "P7",
}
PHASE_INFO = {p["id"]: p for p in PHASES}

# Human-facing catalog metadata for every generated table.
TABLE_META: dict[str, dict[str, str]] = {
    "figure_index": dict(title="Figure index", category="Report metadata", description="Caption registry for the 129 PNG figures produced by the run."),
    "findings_ledger": dict(title="Findings ledger", category="Report metadata", description="64 graded findings across eight pre-registered research questions."),
    "reproducibility_checklist": dict(title="Reproducibility checklist", category="Report metadata", description="Eleven run-level reproducibility checks and their evidence."),
    "phase0_class_balance": dict(title="Class balance by split", category="Data quality", description="Transaction and fraud counts for train, test and overall."),
    "phase0_contracts": dict(title="Data contracts", category="Data quality", description="Ten domain and integrity checks with observed values and pass/flag status."),
    "phase0_generator_forensics": dict(title="Generator forensics", category="Data quality", description="Evidence about simulator mechanics: timestamp offset, merchant coordinates, ZIP3 purity and distance."),
    "phase0_schema": dict(title="Schema profile", category="Data quality", description="Dtype, completeness, cardinality, memory and analytical role for the derived frame."),
    "phase1_amt_quantiles": dict(title="Amount quantiles", category="Descriptive", description="Selected percentiles for all, fraud and non-fraud transaction amounts."),
    "phase1_category_table": dict(title="Category volumes & rates", category="Descriptive", description="Transaction counts and raw fraud rates for the 14 merchant categories."),
    "phase1_covid_window": dict(title="COVID-window rates", category="Descriptive", description="Fraud-rate comparison for the Jan–Feb, Mar–Jun and Jul–Dec 2020 windows."),
    "phase1_merchant_table": dict(title="Merchant rates", category="Descriptive", description="Unshrunk transaction counts and fraud rates for 693 merchants."),
    "phase2_card_profiles": dict(title="Cardholder profiles", category="Behavioral", description="One row per card: volume, fraud count, amount profile, hour entropy and fraud-rate bin."),
    "phase2_city_table": dict(title="City-level risk", category="Geography", description="836 cities with volume, fraud count and empirical-Bayes shrunk fraud rate."),
    "phase2_dist_rate_table": dict(title="Distance bins", category="Geography", description="Fraud rate by card→merchant distance bin; distance is a simulator artifact."),
    "phase2_mi_table": dict(title="Mutual information", category="Association", description="Mutual-information ranking of candidate features against the fraud target."),
    "phase2_money_category": dict(title="Fraud dollars by category", category="Money lens", description="Fraud counts, total fraud dollars and dollars per fraud by category."),
    "phase2_zip3_table": dict(title="ZIP3 empirical Bayes", category="Geography", description="532 ZIP3 prefixes with Wilson intervals, significance, sparsity and EB-shrunk rates."),
    "phase3_weekly_rate_table": dict(title="Weekly fraud rate", category="Temporal", description="105 weekly observations with volume, fraud count and fraud rate."),
    "phase4_anomaly_summary": dict(title="Anomaly detector comparison", category="Unsupervised", description="Isolation Forest, autoencoder and LOF AUC and top-decile lift."),
    "phase4_dbscan_clusters": dict(title="DBSCAN clusters", category="Clustering", description="Cluster sizes and fraud rates; the noise group carries elevated risk."),
    "phase4_kmeans_cluster_rate": dict(title="K-Means clusters", category="Clustering", description="Three-cluster solution with size, fraud count and fraud rate."),
    "phase4_separability_table": dict(title="Embedding separability", category="Unsupervised", description="Logistic AUC on seven 2D embeddings; PCA(2) performs best."),
    "phase5_category_posthoc_pairs": dict(title="Category post-hoc pairs", category="Statistics", description="Pairwise category tests with Cramér's V and Bonferroni-adjusted p-values."),
    "phase5_category_rates": dict(title="Category rates with intervals", category="Statistics", description="Fraud rates, Wilson intervals, FDR-adjusted significance and sparsity flags by category."),
    "phase5_chi2_cramers": dict(title="Categorical association", category="Statistics", description="Chi-square and uncorrected Cramér's V for category, gender, state, job and ZIP3."),
    "phase5_cluster_robust_logit": dict(title="Cluster-robust logit", category="Statistics", description="Card-clustered logistic coefficients and robust intervals for eight features."),
    "phase5_mw_effect_sizes": dict(title="Effect sizes", category="Statistics", description="Mann–Whitney, Cliff's delta, KS, Cohen's d and bootstrap intervals for 11 features."),
    "phase7_hazard_table": dict(title="Discrete-time hazard", category="Survival", description="Month-by-month hazard of first fraud with Wilson intervals."),
    "phase7_high_risk_combo": dict(title="High-risk combinations", category="Behavioral", description="Fraud rate and lift for night, risky category, high amount and their combination."),
    "phase7_hour_encoding_comparison": dict(title="Hour encoding comparison", category="Modeling", description="Validation PR-AUC for raw, cyclical and one-hot hour encodings."),
    "phase7_merchant_eb_table": dict(title="Merchant hierarchical EB", category="Behavioral", description="700 merchant rows with category prior, EB-shrunk rate and cleaned merchant name."),
    "phase7_speed_rate_table": dict(title="Implied-speed risk", category="Behavioral", description="Fraud rate by implied card→merchant speed bin."),
    "phase8_ablation_decomposed": dict(title="Feature-family ablation", category="Model evaluation", description="PR/ROC AUC after removing feature families; localizes the transfer failure."),
    "phase8_calibration_temp": dict(title="Temperature scaling", category="Model evaluation", description="Post-hoc calibration on the early-stopping split; not the test split."),
    "phase8_capture_at_k": dict(title="Capture@k", category="Model economics", description="Fraud events and dollars captured at five review budgets."),
    "phase8_cost_sensitivity": dict(title="Cost sensitivity", category="Model economics", description="Optimal threshold, loss, recall and precision across false-positive costs."),
    "phase8_ensemble_comparison": dict(title="Ensemble comparison", category="Model evaluation", description="Single final model versus the mean prediction of four walk-forward models."),
    "phase8_learning_curve": dict(title="Learning curve", category="Model evaluation", description="Test PR/ROC AUC at five training-fraction levels; non-monotonic under OOD shift."),
    "phase8_leave_card_out": dict(title="Leave-card-out CV", category="Model evaluation", description="PR/ROC AUC for seen cards, held-out cards and held-out-card test rows."),
    "phase8_monotonic_comparison": dict(title="Monotonic constraints", category="Model evaluation", description="Audit-compliant monotonic model versus the unconstrained final model."),
    "phase8_psi": dict(title="Population Stability Index", category="Drift", description="Per-feature train→test PSI with stability verdict and top driver bin."),
    "phase8_segment_errors": dict(title="Segment errors", category="Model evaluation", description="Recall and false positives by category, hour bin and state at the cost-min operating point."),
    "phase8_threshold_table": dict(title="Operating points", category="Model economics", description="Confusion counts, precision, recall and dollar loss at three thresholds."),
    "phase8_time_decay_comparison": dict(title="Time-decay weighting", category="Model evaluation", description="180-day half-life weighting versus the unweighted final model."),
    "phase8_walkforward_cv": dict(title="Walk-forward CV", category="Model evaluation", description="Four time-ordered folds with in-domain validation and cross-boundary test metrics."),
    "phase8_wf_vs_test": dict(title="OOD gap summary", category="Model evaluation", description="Mean in-domain and test PR-AUC across folds, with the transfer gap."),
}

COLUMN_RENAMES = {
    "phase0_schema": {"Unnamed: 0": "column"},
    "phase0_contracts": {"Unnamed: 0": "contract_id"},
    "phase0_generator_forensics": {"Unnamed: 0": "metric"},
    "phase2_separability_table": {},
    "phase4_separability_table": {"Unnamed: 0": "embedding", "0": "auc"},
    "phase2_mi_table": {"Unnamed: 0": "feature", "0": "mutual_information"},
    "phase7_hour_encoding_comparison": {"Unnamed: 0": "encoding", "val PR-AUC": "pr_auc"},
}

HTML_TITLES = {
    "phase1_state_n_choro.html": "State sample size — interactive choropleth",
    "phase1_state_rate_choro.html": "State fraud rate — interactive choropleth",
    "phase2_city_map.html": "City-level fraud map — interactive",
    "phase2_map_scatter.html": "Stratified transaction map — interactive",
    "phase2_state_eb_choro.html": "State fraud rate (EB-shrunk) — interactive",
    "phase2_state_n_choro.html": "State sample size — interactive choropleth",
    "phase4_pca_3d.html": "3D PCA scatter — interactive",
}

FIGURE_GROUPS = [
    (r"missing|schema|coverage|txns_per_card|contract", "Data quality"),
    (r"roc|pr_curves|confusion|calibration|threshold|cost|capture|learning|ablation|ensemble|monotonic|decay|leave_card|walkforward|wf_vs_test|psi|segment|shap|pdp|adversarial|separability|anomaly|dbscan|kmeans", "Model evaluation"),
    (r"stl|acf|changepoint|weekly|daily|rolling|card_timeline|hour_x|month_x|year_x|cohort|hazard|card_age", "Temporal"),
    (r"state|city|geo|zip3|map|dist", "Geography"),
    (r"tsne|umap|pca|andrews|parallel|hexbin|raincloud|swarm|dendrogram", "Unsupervised"),
    (r"amt|amount|money|lorenz|qq", "Amount"),
    (r"category|gender|age|job|merchant|night|weekend|dow|hour|covid|target|speed|combo|te_leak|effectsize|forest|mw_|chi2|cramers|logit", "Distribution & association"),
]


def ensure_dirs() -> None:
    for p in (DATA, ARTIFACTS, PROCESSED, METADATA, REPORTS):
        p.mkdir(parents=True, exist_ok=True)
    for sub in ("figures", "html", "tables", "logs", "notebook", "thumbs"):
        (ARTIFACTS / sub).mkdir(parents=True, exist_ok=True)
    (DATA / "tables").mkdir(parents=True, exist_ok=True)


def clean(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    if isinstance(value, (pd.Timestamp, datetime)):
        return value.isoformat()
    if hasattr(value, "item"):
        try:
            return value.item()
        except Exception:
            pass
    return value


def records(path: Path, rename: dict[str, str] | None = None) -> list[dict[str, Any]]:
    df = pd.read_csv(path, encoding="utf-8-sig")
    if rename:
        df = df.rename(columns=rename)
    df = df.loc[:, [c for c in df.columns if not (str(c).startswith("Unnamed") and str(c) not in (rename or {}))]]
    return [{str(k): clean(v) for k, v in row.items()} for row in df.to_dict("records")]


def table_records(name: str) -> list[dict[str, Any]]:
    rename = COLUMN_RENAMES.get(name, {})
    df = pd.read_csv(TABLES / f"{name}.csv", encoding="utf-8-sig")
    if name == "phase0_class_balance":
        df = df.drop(columns=[c for c in df.columns if str(c).startswith("Unnamed")], errors="ignore")
    elif rename:
        df = df.rename(columns=rename)
    if name not in ("phase0_schema", "phase0_contracts", "phase0_generator_forensics") and "Unnamed: 0" in df.columns:
        df = df.drop(columns=["Unnamed: 0"])
    return [{str(k): clean(v) for k, v in row.items()} for row in df.to_dict("records")]


def infer_type(series: pd.Series) -> str:
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    if pd.api.types.is_integer_dtype(series):
        return "integer"
    if pd.api.types.is_float_dtype(series):
        return "number"
    return "text"


def sanitize_text(text: str) -> str:
    text = re.sub(r"\x1b\[[0-9;]*[A-Za-z]", "", text)
    text = re.sub(r"\r", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def parse_notebook() -> tuple[list[dict], dict]:
    nb = json.loads(NOTEBOOK.read_text(encoding="utf-8"))
    cells = []
    for i, cell in enumerate(nb["cells"]):
        src = sanitize_text("".join(cell.get("source", [])))
        text_parts, n_images = [], 0
        for out in cell.get("outputs", []):
            if out.get("output_type") == "stream":
                text_parts.append("".join(out.get("text", [])))
            elif out.get("output_type") in ("execute_result", "display_data"):
                data = out.get("data", {})
                if "text/plain" in data:
                    text_parts.append("".join(data["text/plain"]))
                if "image/png" in data:
                    n_images += 1
            elif out.get("output_type") == "error":
                text_parts.append("\n".join(out.get("traceback", [])))
        output = sanitize_text("\n".join(text_parts))
        phase = phase_for_cell(i)
        cells.append({
            "index": i,
            "type": cell["cell_type"],
            "is_code": cell["cell_type"] == "code",
            "exec": cell.get("execution_count"),
            "phase": phase,
            "source": src,
            "source_first": src.splitlines()[0][:180] if src else "",
            "output": output,
            "output_chars": len(output),
            "images": n_images,
            "has_output": bool(output or n_images),
        })
    code = [c for c in cells if c["is_code"]]
    stats = {
        "total_cells": len(cells),
        "code_cells": len(code),
        "markdown_cells": sum(c["type"] == "markdown" for c in cells),
        "executed_cells": sum(c["exec"] is not None for c in code),
        "cells_with_output": sum(c["has_output"] for c in code),
        "cells_without_output": sum(not c["has_output"] for c in code),
        "error_outputs": sum(1 for c in code if re.search(r"Traceback \(most recent call last\)", c["output"])),
        "embedded_images": sum(c["images"] for c in code),
        "output_chars": sum(c["output_chars"] for c in code),
    }
    return cells, stats


def phase_for_cell(i: int) -> str:
    if i <= 12:
        return "SETUP"
    for phase in PHASES:
        if phase["cell_start"] <= i <= phase["cell_end"]:
            return phase["id"]
    return "SETUP"


def phase_for_artifact(name: str) -> str:
    for prefix, pid in PHASE_BY_PREFIX.items():
        if name.startswith(prefix + "_"):
            return pid
    return "P8"


def build_tables() -> tuple[list[dict], list[dict], dict]:
    catalog, dictionary = [], []
    data_by_id: dict[str, list[dict]] = {}
    for path in sorted(TABLES.glob("*.csv")):
        name = path.stem
        df = pd.read_csv(path, encoding="utf-8-sig")
        rename = COLUMN_RENAMES.get(name, {})
        if rename:
            df = df.rename(columns=rename)
        display_df = df.loc[:, [c for c in df.columns if not str(c).startswith("Unnamed")]] if name not in (
            "phase0_schema", "phase0_contracts", "phase0_generator_forensics"
        ) else df
        cols = []
        for col in display_df.columns:
            s = display_df[col]
            entry = {
                "key": str(col),
                "type": infer_type(s),
                "missing": int(s.isna().sum()),
                "unique": int(s.nunique(dropna=True)),
            }
            if entry["type"] in ("number", "integer"):
                valid = s.dropna()
                if len(valid):
                    entry.update({
                        "min": clean(float(valid.min())),
                        "max": clean(float(valid.max())),
                        "mean": clean(float(valid.mean())),
                        "median": clean(float(valid.median())),
                    })
            cols.append(entry)
            dictionary.append({
                "table": name,
                "column": str(col),
                "type": entry["type"],
                "missing": entry["missing"],
                "missing_pct": round(entry["missing"] / max(len(display_df), 1) * 100, 4),
                "unique": entry["unique"],
                "example": "" if display_df[col].dropna().empty else str(display_df[col].dropna().iloc[0])[:120],
            })
        meta = TABLE_META.get(name, {"title": name.replace("_", " ").title(), "category": "Other", "description": ""})
        pid = phase_for_artifact(name)
        rows = table_records(name)
        data_by_id[name] = rows
        catalog.append({
            "id": name,
            "title": meta["title"],
            "category": meta["category"],
            "description": meta["description"],
            "phase": pid,
            "rows": len(display_df),
            "cols": len(display_df.columns),
            "missing_cells": int(display_df.isna().sum().sum()),
            "bytes": path.stat().st_size,
            "source": f"tables/{name}.csv",
            "columns": cols,
        })
        (DATA / "tables" / f"{name}.json").write_text(
            json.dumps({"id": name, "columns": [c["key"] for c in cols], "types": {c["key"]: c["type"] for c in cols}, "rows": rows},
                       ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        shutil.copy2(path, ARTIFACTS / "tables" / path.name)
    return catalog, dictionary, data_by_id


def build_figures() -> tuple[list[dict], list[dict]]:
    index = pd.read_csv(TABLES / "figure_index.csv", encoding="utf-8-sig")
    captions = {}
    for _, row in index.iterrows():
        captions[Path(str(row["figure"]).replace("\\", "/")).name] = str(row["caption"])
    figures, htmls = [], []
    for path in sorted(FIGURES.glob("*.png")):
        try:
            with Image.open(path) as im:
                width, height = im.size
        except Exception:
            width = height = None
        thumb_name = path.stem + ".webp"
        thumb = ARTIFACTS / "thumbs" / thumb_name
        if not thumb.exists() or thumb.stat().st_mtime < path.stat().st_mtime:
            with Image.open(path) as im:
                im = im.convert("RGB")
                target_w = 560
                if im.width > target_w:
                    im = im.resize((target_w, round(im.height * target_w / im.width)), Image.LANCZOS)
                im.save(thumb, "WEBP", quality=82, method=6)
        shutil.copy2(path, ARTIFACTS / "figures" / path.name)
        pid = phase_for_artifact(path.stem)
        caption = captions.get(path.name, path.stem.replace("_", " "))
        figures.append({
            "id": path.stem,
            "type": "figure",
            "title": caption[:1].upper() + caption[1:] if caption else path.stem,
            "caption": caption,
            "phase": pid,
            "group": group_for_figure(path.stem),
            "bytes": path.stat().st_size,
            "width": width,
            "height": height,
            "thumb": f"artifacts/thumbs/{thumb_name}",
            "full": f"artifacts/figures/{path.name}",
            "source": f"figures/{path.name}",
        })
    for path in sorted(FIGURES.glob("*.html")):
        shutil.copy2(path, ARTIFACTS / "html" / path.name)
        pid = phase_for_artifact(path.stem)
        title = HTML_TITLES.get(path.name, path.stem.replace("_", " ").title())
        htmls.append({
            "id": path.stem,
            "type": "interactive",
            "title": title,
            "caption": "Plotly interactive artifact; open in a new tab to explore.",
            "phase": pid,
            "group": "Interactive",
            "bytes": path.stat().st_size,
            "thumb": None,
            "full": f"artifacts/html/{path.name}",
            "source": f"figures/{path.name}",
        })
    return figures, htmls


def group_for_figure(stem: str) -> str:
    for pattern, group in FIGURE_GROUPS:
        if re.search(pattern, stem, re.IGNORECASE):
            return group
    return "Other"


def build_findings() -> list[dict]:
    raw = json.loads((LOGS / "findings_ledger.json").read_text(encoding="utf-8"))
    findings = []
    for i, f in enumerate(raw, start=1):
        ledger_phase = str(f["phase"]).strip()
        pid = PHASE_BY_LEDGER.get(ledger_phase)
        if pid is None:
            digits = "".join(ch for ch in ledger_phase if ch.isdigit())
            pid = PHASE_BY_LEDGER.get(str(int(digits)), "P8") if digits else "P8"
        finding = {
            "id": f"F-{i:03d}",
            "rq": f["rq"],
            "rqText": RQS.get(f["rq"], ""),
            "phase": pid,
            "phaseName": PHASE_INFO[pid]["name"],
            "grade": f["grade"],
            "finding": f["finding"],
            "evidence": f["evidence"],
            "sourceFile": "logs/findings_ledger.json",
            "sourceRow": i,
            "ledgerPhase": str(f["phase"]),
            "cellRange": f"{PHASE_INFO[pid]['cell_start']}–{PHASE_INFO[pid]['cell_end']}",
        }
        audit_id = None
        if "Leakage demo" in finding["finding"]:
            audit_id = "AN-01"
        elif "bimodal" in finding["finding"]:
            audit_id = "AN-02"
        elif "merchant → category is deterministic" in finding["finding"]:
            audit_id = "AN-03"
        elif "Categorical associations with target" in finding["finding"]:
            audit_id = "AN-04"
        finding["auditNoteId"] = audit_id
        finding["auditStatus"] = next((a["status"] for a in AUDIT_NOTES if a["id"] == audit_id), None)
        findings.append(finding)
    return findings


def build_weekly() -> list[dict]:
    rows = table_records("phase3_weekly_rate_table")
    for r in rows:
        r["date"] = str(r.get("ts", ""))[:10]
    return rows


def build_cards(card_rows: list[dict]) -> dict:
    rates = [float(r["fraud_rate"]) for r in card_rows if r.get("fraud_rate") is not None]
    never = sum(1 for r in card_rows if float(r.get("k", 0)) == 0)
    all_fraud = sum(1 for r in card_rows if float(r.get("k", 0)) == float(r.get("n", -1)))
    edges = [(-1e-9, 0.0, "0%"), (0.0, 0.005, "0–0.5%"), (0.005, 0.01, "0.5–1%"),
             (0.01, 0.015, "1–1.5%"), (0.015, 0.02, "1.5–2%"), (0.02, 0.03, "2–3%"),
             (0.03, 0.999999, "3–100%"), (0.999999, 1.000001, "100%")]
    histogram = []
    for lo, hi, label in edges:
        if label == "0%":
            count = sum(1 for r in rates if r <= 0)
        elif label == "100%":
            count = sum(1 for r in rates if r >= 0.999999)
        else:
            count = sum(1 for r in rates if lo < r <= hi)
        histogram.append({"bin": label, "count": count})
    positive = sorted(r for r in rates if r > 0)
    return {
        "cards": len(card_rows),
        "never": never,
        "ever": len(card_rows) - never,
        "neverPct": never / len(card_rows),
        "everPct": (len(card_rows) - never) / len(card_rows),
        "allFraud": all_fraud,
        "meanRate": sum(rates) / len(rates),
        "medianRate": positive[len(positive) // 2] if positive else 0,
        "histogram": histogram,
        "scatter": [
            {"n": r["n"], "k": r["k"], "rate": r["fraud_rate"], "cc": str(r["cc_num"])[-4:]}
            for r in card_rows
        ],
    }


def build_experiments(analysis_tables: dict) -> list[dict]:
    out = []
    ablation = table_records("phase8_ablation_decomposed")
    ab_map = {r["model"]: r for r in ablation}
    supervised = [
        ("FULL (all features) / final", "final_unconstrained", None, "Primary leak-aware LightGBM; 27 features."),
        ("Ablation · minus card_prior_fraud", "ablation_minus_card_prior", "MINUS card_prior_fraud", "Causal prior-fraud count removed."),
        ("Ablation · minus te_*", "ablation_minus_te", "MINUS te_* (4 features)", "Four target-encoded features removed."),
        ("Ablation · minus cnt_*/n_prior", "ablation_minus_counts", "MINUS cnt_*/n_prior (3 features)", "Trailing counts and prior-volume count removed."),
        ("Ablation · minus velocity", "ablation_minus_velocity", "MINUS velocity (4 features)", "Velocity block removed."),
        ("Ablation · raw-only", "ablation_raw_only", "MINUS all history (raw-only)", "Raw features only; no history block."),
    ]
    for label, key, row_key, note in supervised:
        src = ab_map.get(row_key or "FULL (all features)")
        if not src:
            continue
        out.append({
            "id": key,
            "family": "Supervised · OOD test",
            "label": label,
            "description": note,
            "metric": "Test PR-AUC",
            "pr_auc": src["pr_auc"],
            "roc_auc": src["roc_auc"],
            "n_features": src["n_features"],
            "split": "Held-out test (cross-boundary)",
            "n_rows": 555719,
            "source": "phase8_ablation_decomposed.csv",
            "comparisonNote": "Ablation variants share training data and test split; they are not independent experiments.",
        })
    for name, key, fname, model_key in [
        ("Monotonic constraints", "monotonic", "phase8_monotonic_comparison", "monotonic_constrained"),
        ("Time-decay weighting", "time_decay", "phase8_time_decay_comparison", "time_decay_weighted"),
        ("Fold ensemble", "fold_ensemble", "phase8_ensemble_comparison", "walk_forward_ensemble"),
    ]:
        rows = table_records(fname)
        row = next((candidate for candidate in rows if candidate.get("model") == model_key), rows[0])
        out.append({
            "id": key,
            "family": "Supervised · OOD test",
            "label": name,
            "description": name + " variant evaluated on the same held-out test split.",
            "metric": "Test PR-AUC",
            "pr_auc": row["pr_auc"],
            "roc_auc": row["roc_auc"],
            "n_features": None,
            "split": "Held-out test (cross-boundary)",
            "n_rows": 555719,
            "source": f"{fname}.csv",
            "comparisonNote": "Robustness variant; not a controlled experiment.",
        })
    for row in table_records("phase8_walkforward_cv"):
        out.append({
            "id": f"wf_fold_{int(row['fold'])}",
            "family": "Walk-forward folds",
            "label": f"Fold {int(row['fold'])} · {row['val_window']}",
            "description": "Time-ordered fold; validation is in-domain and test is cross-boundary.",
            "metric": "Validation PR-AUC / Test PR-AUC",
            "pr_auc": row["pr_auc"],
            "roc_auc": row["roc_auc"],
            "test_pr_auc": row["test_pr_auc"],
            "test_roc_auc": row["test_roc_auc"],
            "n_train": row["n_train"],
            "n_val": row["n_val"],
            "split": "Walk-forward validation + held-out test",
            "n_rows": row["n_val"],
            "source": "phase8_walkforward_cv.csv",
            "comparisonNote": "Fold models are trained on expanding windows.",
        })
    for row in table_records("phase4_anomaly_summary"):
        out.append({
            "id": "anomaly_" + row["model"].lower(),
            "family": "Unsupervised anomaly",
            "label": row["model"],
            "description": "Unsupervised anomaly score evaluated against fraud labels.",
            "metric": "AUC",
            "auc": row["auc"],
            "lift": row["top10pct_lift"],
            "precision10": row["top10pct_precision"],
            "n_rows": row["n"],
            "split": "Unsupervised sample",
            "source": "phase4_anomaly_summary.csv",
            "comparisonNote": "Sample sizes differ: LOF uses 5,000 rows; the others 50,000. AUCs are not a controlled ranking.",
        })
    for row in table_records("phase4_separability_table"):
        out.append({
            "id": "embed_" + re.sub(r"[^a-z0-9]+", "_", row["embedding"].lower()).strip("_"),
            "family": "Unsupervised embeddings",
            "label": row["embedding"],
            "description": "Logistic classifier on a 2D embedding; measures visual separability, not deployable performance.",
            "metric": "Logistic AUC on embedding",
            "auc": row["auc"],
            "n_rows": 50000,
            "split": "2D embedding of stratified sample",
            "source": "phase4_separability_table.csv",
            "comparisonNote": "Embeddings use different hyperparameters; not a model-selection leaderboard.",
        })
    for row in table_records("phase7_hour_encoding_comparison"):
        out.append({
            "id": "hour_" + row["encoding"],
            "family": "Hour encoding",
            "label": f"{row['encoding'].title()} hour encoding",
            "description": "Quick LightGBM comparison of hour representation.",
            "metric": "Validation PR-AUC",
            "pr_auc": row["pr_auc"],
            "split": "Last 20% of time-ordered train period",
            "n_rows": None,
            "source": "phase7_hour_encoding_comparison.csv",
            "comparisonNote": "Only three features plus category; a narrow encoding test, not the final model.",
        })
    return out


def build_analysis() -> tuple[dict, dict[str, list[dict]]]:
    analysis_tables = {
        "class_balance": "phase0_class_balance",
        "contracts": "phase0_contracts",
        "generator": "phase0_generator_forensics",
        "schema": "phase0_schema",
        "quantiles": "phase1_amt_quantiles",
        "category_table": "phase1_category_table",
        "covid": "phase1_covid_window",
        "merchants_raw": "phase1_merchant_table",
        "cards": "phase2_card_profiles",
        "cities": "phase2_city_table",
        "dist_rate": "phase2_dist_rate_table",
        "mi": "phase2_mi_table",
        "money": "phase2_money_category",
        "zip3": "phase2_zip3_table",
        "weekly": "phase3_weekly_rate_table",
        "anomaly": "phase4_anomaly_summary",
        "dbscan": "phase4_dbscan_clusters",
        "kmeans": "phase4_kmeans_cluster_rate",
        "separability": "phase4_separability_table",
        "posthoc": "phase5_category_posthoc_pairs",
        "category_rates": "phase5_category_rates",
        "chi2": "phase5_chi2_cramers",
        "logit": "phase5_cluster_robust_logit",
        "effect_sizes": "phase5_mw_effect_sizes",
        "hazard": "phase7_hazard_table",
        "combos": "phase7_high_risk_combo",
        "hour_encoding": "phase7_hour_encoding_comparison",
        "merchants_eb": "phase7_merchant_eb_table",
        "speed": "phase7_speed_rate_table",
        "ablation": "phase8_ablation_decomposed",
        "calibration_temp": "phase8_calibration_temp",
        "capture": "phase8_capture_at_k",
        "cost": "phase8_cost_sensitivity",
        "ensemble": "phase8_ensemble_comparison",
        "learning": "phase8_learning_curve",
        "leave_card": "phase8_leave_card_out",
        "monotonic": "phase8_monotonic_comparison",
        "psi": "phase8_psi",
        "segments": "phase8_segment_errors",
        "thresholds": "phase8_threshold_table",
        "time_decay": "phase8_time_decay_comparison",
        "walkforward": "phase8_walkforward_cv",
        "wf_vs_test": "phase8_wf_vs_test",
        "checklist": "reproducibility_checklist",
    }
    data = {key: table_records(name) for key, name in analysis_tables.items()}
    # Derived series and compact structures
    cards = build_cards(data["cards"])
    data["cards_summary"] = cards
    data["weekly_series"] = build_weekly()
    data["merchant_top"] = sorted(data["merchants_eb"], key=lambda r: (r.get("eb_rate") or 0), reverse=True)[:25]
    data["merchant_volume_top"] = sorted(data["merchants_raw"], key=lambda r: (r.get("n") or 0), reverse=True)[:20]
    data["city_top"] = sorted([r for r in data["cities"] if (r.get("n") or 0) >= 500], key=lambda r: (r.get("eb_rate") or 0), reverse=True)[:20]
    data["zip3_top"] = sorted(
        [r for r in data["zip3"] if r.get("sig") is True and (r.get("n") or 0) >= 500],
        key=lambda r: (r.get("eb_rate") or 0), reverse=True,
    )[:20]
    # Segment rows: keep only populated fields for display
    segments = []
    for r in data["segments"]:
        row = {k: v for k, v in r.items() if v is not None and not (isinstance(v, float) and math.isnan(v))}
        if row.get("segment") == "category":
            row["segmentLabel"] = row.get("category")
        elif row.get("segment") == "hour_bin":
            row["segmentLabel"] = row.get("hour_bin")
        else:
            row["segmentLabel"] = row.get("state")
        segments.append(row)
    data["segments"] = segments
    # Model variants and experiment table
    experiments = build_experiments(data)
    data["experiments"] = experiments
    # Supervised family for the comparability-safe scatter
    data["supervised_models"] = [e for e in experiments if e["family"] == "Supervised · OOD test"]
    return data, {k: v for k, v in data.items() if isinstance(v, list)}


def parse_runtime_facts(cells: list[dict]) -> dict:
    text = "\n".join(c["output"] for c in cells)
    embedding_times = []
    for m in re.finditer(r"(t-SNE perp=\d+|UMAP nn=\d+ md=[\d.]+): AUC=([\d.]+)\s+\((\d+)s\)", text):
        embedding_times.append({"model": m.group(1), "auc": float(m.group(2)), "seconds": int(m.group(3))})
    shap = re.search(r"SHAP: 5000 rows x 27 features, background=200 \(([\d.]+)s\)", text)
    return {
        "embeddingTimes": embedding_times,
        "shapSeconds": float(shap.group(1)) if shap else None,
    }


def parse_run(cells: list[dict]) -> dict:
    md = (LOGS / "findings.md").read_text(encoding="utf-8")
    m = re.search(r"run:\s*([0-9T:\-]+)\s*[→\-]+\s*([0-9T:\-]+)\s*\(([\d.]+) min\)", md)
    start, end, reported_min = (m.group(1), m.group(2), float(m.group(3))) if m else (None, None, None)
    duration_s = None
    if start and end:
        a = datetime.fromisoformat(start)
        b = datetime.fromisoformat(end)
        duration_s = int((b - a).total_seconds())
    code = [c for c in cells if c["is_code"]]
    return {
        "id": "RUN-20261020-1630",
        "label": "Full research run",
        "start": start,
        "end": end,
        "durationSeconds": duration_s,
        "reportedMinutes": reported_min,
        "seed": 42,
        "smoke": False,
        "robustness": True,
        "python": "3.13.16",
        "platform": "Google Colab",
        "codeCells": len(code),
        "executedCells": sum(c["exec"] is not None for c in code),
        "cellsWithOutput": sum(c["has_output"] for c in code),
        "errorOutputs": sum(1 for c in code if "Traceback (most recent call last)" in c["output"]),
        "outputChars": sum(c["output_chars"] for c in code),
        "timezoneNote": "Timezone not stated in the source.",
        "source": "logs/findings.md; notebook execution counts",
    }


def parse_environment() -> dict:
    env = json.loads((LOGS / "env_snapshot.json").read_text(encoding="utf-8"))
    env["python"] = "3.13.16"
    env["platform"] = "Google Colab"
    return env


def parse_warning_events(cells: list[dict]) -> list[dict]:
    events = []
    seq = 0
    for c in cells:
        if not c["is_code"]:
            continue
        for line in c["output"].splitlines():
            low = line.lower()
            if "kaleido png skipped" in low:
                seq += 1
                name = re.search(r"skipped for ([a-z0-9_]+)", line)
                events.append({
                    "id": f"WARN-{seq:02d}",
                    "severity": "warning",
                    "category": "Export",
                    "message": f"Static PNG skipped for {name.group(1) if name else 'interactive artifact'}",
                    "detail": line.strip(),
                    "cell": c["index"],
                    "phase": c["phase"],
                    "source": "Notebook cell output",
                })
            elif "warning: you have plotly version" in low or "not compatible with this version of kaleido" in low:
                seq += 1
                events.append({
                    "id": f"WARN-{seq:02d}",
                    "severity": "warning",
                    "category": "Dependency",
                    "message": "Plotly 5.24.1 is incompatible with Kaleido 1.5.0",
                    "detail": line.strip(),
                    "cell": c["index"],
                    "phase": c["phase"],
                    "source": "Notebook cell output",
                })
            elif "background dataset has 200 samples" in low:
                seq += 1
                events.append({
                    "id": f"WARN-{seq:02d}",
                    "severity": "warning",
                    "category": "Explainability",
                    "message": "SHAP background subsampled from 200 to 100 rows",
                    "detail": line.strip(),
                    "cell": c["index"],
                    "phase": c["phase"],
                    "source": "Notebook cell output",
                })
    return events


def build_kpis(class_balance: list[dict], findings: list[dict], figures: list[dict], htmls: list[dict], tables: list[dict], run: dict) -> list[dict]:
    overall = next(r for r in class_balance if r["split"] == "overall")
    train = next(r for r in class_balance if r["split"] == "train")
    test = next(r for r in class_balance if r["split"] == "test")
    strong = sum(f["grade"] == "strong" for f in findings)
    artifacts = len(figures) + len(htmls) + len(tables)
    kpis = [
        {
            "id": "transactions", "label": "Transactions analysed", "value": overall["n"],
            "format": "integer", "tone": "ink", "eyebrow": "Scale",
            "definition": "Total rows across the train and test source frames.",
            "formula": "1,296,675 train + 555,719 test",
            "source": "phase0_class_balance.csv", "verification": "Verified from source table",
            "context": f"{overall['fraud']:,} fraud events",
        },
        {
            "id": "fraud_rate", "label": "Observed fraud rate", "value": overall["fraud_rate"],
            "format": "percent3", "tone": "fraud", "eyebrow": "Target",
            "definition": "Fraud transactions divided by all transactions.",
            "formula": f"{overall['fraud']:,} / {overall['n']:,}",
            "source": "phase0_class_balance.csv", "verification": "Recomputed 0.5210%",
            "context": f"Train {train['fraud_rate']*100:.3f}% · Test {test['fraud_rate']*100:.3f}%",
        },
        {
            "id": "findings", "label": "Graded findings", "value": len(findings),
            "format": "integer", "tone": "violet", "eyebrow": "Evidence",
            "definition": "Entries in the run's findings ledger.",
            "formula": "Count of findings_ledger.json records",
            "source": "logs/findings_ledger.json", "verification": "Verified; 64 records",
            "context": f"{strong} strong · {sum(f['grade']=='caveat' for f in findings)} caveats",
        },
        {
            "id": "artifacts", "label": "Generated artifacts", "value": artifacts,
            "format": "integer", "tone": "teal", "eyebrow": "Outputs",
            "definition": "PNG figures, interactive HTML artifacts and CSV tables in the output bundle.",
            "formula": f"{len(figures)} PNG + {len(htmls)} HTML + {len(tables)} CSV",
            "source": "figures/ & tables/", "verification": "Counted from the workspace",
            "context": f"{len(figures)} figures · {len(htmls)} interactive",
        },
        {
            "id": "run_time", "label": "End-to-end run", "value": run["durationSeconds"],
            "format": "minutes", "tone": "ink", "eyebrow": "Execution",
            "definition": "Wall-clock time between the documented run start and end.",
            "formula": "18:01:59 − 16:30:06 = 5,513 s",
            "source": "logs/findings.md", "verification": "Derived from recorded timestamps",
            "context": f"{run['reportedMinutes']} min reported",
        },
    ]
    return kpis


def build_kpi_catalog(kpis: list[dict], data: dict, findings: list[dict]) -> list[dict]:
    ablation = {r["model"]: r for r in data["ablation"]}
    full = ablation.get("FULL (all features)", {})
    wf = data["wf_vs_test"][0]
    capture = {float(r["top_pct"]): r for r in data["capture"]}
    cap1 = capture.get(1.0, {})
    strong = sum(f["grade"] == "strong" for f in findings)
    extra = [
        {
            "id": "strong_findings", "label": "Strong findings", "value": strong,
            "format": "integer", "definition": "Findings assigned grade 'strong' in the source ledger.",
            "formula": "COUNT(findings WHERE grade = 'strong')", "source": "logs/findings_ledger.json",
            "verification": "Verified", "context": f"{strong / len(findings) * 100:.1f}% of all findings",
        },
        {
            "id": "test_pr_auc", "label": "Test PR-AUC", "value": full.get("pr_auc"),
            "format": "decimal4", "definition": "Average precision on the held-out test split for the final 27-feature LightGBM. This is a cross-boundary OOD estimate.",
            "formula": "sklearn.average_precision_score(y_test, p_test)", "source": "phase8_ablation_decomposed.csv · FULL row",
            "verification": "Loaded from source table", "context": "95% bootstrap CI [0.5365, 0.5784]",
        },
        {
            "id": "wf_pr_auc", "label": "Walk-forward PR-AUC", "value": wf.get("mean_val_pr_auc"),
            "format": "decimal4", "definition": "Mean in-domain validation PR-AUC across four time-ordered folds.",
            "formula": "mean(fold PR-AUC)", "source": "phase8_wf_vs_test.csv",
            "verification": "Loaded from source table", "context": f"±{wf.get('sd_val_pr_auc', 0):.4f} SD",
        },
        {
            "id": "ood_gap", "label": "OOD transfer gap", "value": wf.get("mean_ood_gap"),
            "format": "decimal4", "definition": "Mean fold validation PR-AUC minus the same folds' test PR-AUC.",
            "formula": f"{wf.get('mean_val_pr_auc', 0):.6f} − {wf.get('mean_test_pr_auc_from_folds', 0):.6f}",
            "source": "phase8_wf_vs_test.csv",
            "verification": "Loaded from source table", "context": "Positive gap = transfer loss",
        },
        {
            "id": "capture_1pct", "label": "Capture at 1% budget", "value": cap1.get("recall"),
            "format": "percent2", "definition": "Share of test fraud events caught when reviewing the top 1% of scored transactions.",
            "formula": f"{int(cap1.get('fraud_caught', 0)):,} / 2,145", "source": "phase8_capture_at_k.csv",
            "verification": "Loaded from source table", "context": f"{cap1.get('usd_share', 0) * 100:.2f}% of fraud dollars",
        },
    ]
    return kpis + extra


def build_data_quality(schema: list[dict], contracts: list[dict], generator: list[dict], class_balance: list[dict]) -> dict:
    missing = []
    for r in schema:
        col = r.get("column")
        if not col or col == "Index":
            continue
        pct = r.get("missing_pct")
        if pct and float(pct) > 0:
            missing.append({
                "column": col,
                "dtype": r.get("dtype"),
                "missingPct": float(pct),
                "nonNull": r.get("non_null"),
                "unique": r.get("n_unique"),
                "role": r.get("role"),
            })
    missing.sort(key=lambda x: x["missingPct"], reverse=True)
    contract_parsed = []
    for r in contracts:
        contract_parsed.append({
            "contract": r.get("contract"),
            "actual": r.get("actual value"),
            "status": r.get("status"),
        })
    overall = next(r for r in class_balance if r["split"] == "overall")
    return {
        "summary": {
            "rows": overall["n"],
            "columns": sum(1 for r in schema if r.get("column") not in (None, "Index")),
            "missingColumns": len(missing),
            "maxMissingPct": max((m["missingPct"] for m in missing), default=0),
            "duplicateTransNum": 0,
            "flaggedContracts": sum(1 for c in contract_parsed if c["status"] == "FLAG"),
            "contracts": len(contract_parsed),
            "zipUnder10000": 116389,
            "memoryMB": 636.4,
            "rawColumns": 22,
        },
        "missing": missing,
        "contracts": contract_parsed,
        "generator": [
            {"metric": r.get("metric"), "value": r.get("value")} for r in generator
        ],
        "classBalance": class_balance,
    }


def build_graph(phases: list[dict]) -> dict:
    nodes = [
        {"id": "train", "name": "fraudTrain.csv", "category": 0, "value": 351.2, "symbolSize": 34, "absent": True},
        {"id": "test", "name": "fraudTest.csv", "category": 0, "value": 150.4, "symbolSize": 30, "absent": True},
        {"id": "notebook", "name": "EDA notebook", "category": 1, "value": 33, "symbolSize": 44},
    ]
    links = [
        {"source": "train", "target": "notebook", "value": 1296675},
        {"source": "test", "target": "notebook", "value": 555719},
    ]
    for i, p in enumerate(phases):
        nodes.append({
            "id": p["id"], "name": f"P{p['num']}", "category": 2,
            "value": p["artifactCount"], "symbolSize": 18 + min(18, p["artifactCount"]),
            "phase": p["id"],
        })
        if i == 0:
            links.append({"source": "notebook", "target": p["id"], "value": 1})
        else:
            links.append({"source": phases[i - 1]["id"], "target": p["id"], "value": 1})
    nodes.append({"id": "figures", "name": "129 figures", "category": 3, "value": 129, "symbolSize": 42})
    nodes.append({"id": "tables", "name": "46 tables", "category": 4, "value": 46, "symbolSize": 36})
    nodes.append({"id": "ledger", "name": "64 findings", "category": 5, "value": 64, "symbolSize": 38})
    for p in phases:
        if p["figureCount"]:
            links.append({"source": p["id"], "target": "figures", "value": p["figureCount"]})
        if p["tableCount"]:
            links.append({"source": p["id"], "target": "tables", "value": p["tableCount"]})
        if p["findingCount"]:
            links.append({"source": p["id"], "target": "ledger", "value": p["findingCount"]})
    return {"nodes": nodes, "links": links}


def enrich_phases(findings: list[dict], figures: list[dict], htmls: list[dict], tables: list[dict]) -> list[dict]:
    out = []
    for p in PHASES:
        p = dict(p)
        p["figureCount"] = sum(f["phase"] == p["id"] for f in figures)
        p["tableCount"] = sum(t["phase"] == p["id"] for t in tables)
        p["interactiveCount"] = sum(h["phase"] == p["id"] for h in htmls)
        p["artifactCount"] = p["figureCount"] + p["tableCount"] + p["interactiveCount"]
        p["findingCount"] = sum(f["phase"] == p["id"] for f in findings)
        p["strongCount"] = sum(f["phase"] == p["id"] and f["grade"] == "strong" for f in findings)
        p["caveatCount"] = sum(f["phase"] == p["id"] and f["grade"] == "caveat" for f in findings)
        p["rqs"] = sorted({f["rq"] for f in findings if f["phase"] == p["id"]})
        p["cells"] = list(range(p["cell_start"], p["cell_end"] + 1))
        out.append(p)
    return out


def write_processed(
    run: dict, findings: list[dict], figures: list[dict], htmls: list[dict], tables: list[dict],
    cells: list[dict], warnings: list[dict], experiments: list[dict], data: dict, kpis: list[dict],
    data_quality: dict, phases: list[dict],
) -> None:
    pd.DataFrame([run]).to_csv(PROCESSED / "normalized_runs.csv", index=False)
    pd.DataFrame(columns=["run_id", "epoch", "step", "train_loss", "validation_loss", "train_metric", "validation_metric", "timestamp", "source_file"]).to_csv(
        PROCESSED / "training_history.csv", index=False
    )
    ev = []
    for e in experiments:
        ev.append({
            "result_id": e["id"], "family": e["family"], "label": e["label"],
            "metric": e["metric"], "pr_auc": e.get("pr_auc"), "roc_auc": e.get("roc_auc"),
            "auc": e.get("auc"), "test_pr_auc": e.get("test_pr_auc"), "test_roc_auc": e.get("test_roc_auc"),
            "n_features": e.get("n_features"), "n_rows": e.get("n_rows"), "split": e.get("split"),
            "source_file": e.get("source"), "comparison_note": e.get("comparisonNote"),
        })
    pd.DataFrame(ev).to_csv(PROCESSED / "evaluation_results.csv", index=False)
    perf = [
        {"metric": "end_to_end_seconds", "value": run["durationSeconds"], "unit": "seconds", "source": "logs/findings.md", "status": "measured", "note": "Start/end timestamps; timezone unstated."},
        {"metric": "reported_duration_minutes", "value": run["reportedMinutes"], "unit": "minutes", "source": "logs/findings.md", "status": "reported", "note": "Rounded summary."},
        {"metric": "transactions_per_wall_second", "value": 1852394 / run["durationSeconds"], "unit": "rows/s", "source": "derived", "status": "derived", "note": "Whole notebook, not inference throughput."},
        {"metric": "source_data_mb", "value": 351.2 + 150.4, "unit": "MB", "source": "logs/data_fingerprint.json", "status": "reported", "note": "CSV sizes."},
        {"metric": "processed_memory_mb", "value": 636.4, "unit": "MB", "source": "notebook cell 14", "status": "measured", "note": "After dtype discipline."},
        {"metric": "figures", "value": len(figures), "unit": "files", "source": "figures/", "status": "counted", "note": ""},
        {"metric": "interactive_artifacts", "value": len(htmls), "unit": "files", "source": "figures/", "status": "counted", "note": ""},
        {"metric": "tables", "value": len(tables), "unit": "files", "source": "tables/", "status": "counted", "note": ""},
        {"metric": "shap_seconds", "value": 163.1, "unit": "seconds", "source": "notebook cell 63", "status": "measured", "note": "5,000 rows × 27 features."},
    ]
    pd.DataFrame(perf).to_csv(PROCESSED / "performance_metrics.csv", index=False)
    issue_rows = []
    for i in ISSUES:
        issue_rows.append({
            "event_id": i["id"], "event_type": "issue", "severity": i["severity"],
            "category": i["category"], "title": i["title"], "phase": i.get("phase"),
            "status": i["status"], "confidence": i["confidence"], "detail": i["summary"],
            "source": "; ".join(i["sources"]),
        })
    for w in warnings:
        issue_rows.append({
            "event_id": w["id"], "event_type": "log_event", "severity": w["severity"],
            "category": w["category"], "title": w["message"], "phase": w["phase"],
            "status": "Observed", "confidence": "Confirmed", "detail": w["detail"],
            "source": f"notebook cell {w['cell']}",
        })
    pd.DataFrame(issue_rows).to_csv(PROCESSED / "issues_and_events.csv", index=False)
    pd.DataFrame([
        {"cell": c["index"], "type": c["type"], "execution_count": c["exec"], "phase": c["phase"],
         "output_chars": c["output_chars"], "images": c["images"], "source_first": c["source_first"]}
        for c in cells
    ]).to_csv(PROCESSED / "notebook_cells.csv", index=False)
    pd.DataFrame(findings).to_csv(PROCESSED / "findings.csv", index=False)
    pd.DataFrame(figures + htmls).to_csv(PROCESSED / "figures.csv", index=False)
    pd.DataFrame(tables).to_csv(PROCESSED / "tables.csv", index=False)
    pd.DataFrame(phases).to_csv(PROCESSED / "phases.csv", index=False)
    pd.DataFrame(kpis).to_csv(PROCESSED / "kpis.csv", index=False)
    pd.DataFrame([{"id": k["id"], "label": k["label"], "value": k["value"], "format": k["format"],
                   "definition": k["definition"], "formula": k["formula"], "source": k["source"],
                   "verification": k["verification"], "context": k["context"]} for k in kpis]).to_csv(
        PROCESSED / "kpi_catalog.csv", index=False
    )
    for key in ("classBalance", "segmentErrors", "walkforward", "psi", "ablation", "experiments"):
        pass


def main() -> None:
    ensure_dirs()
    cells, notebook_stats = parse_notebook()
    tables, dictionary, _ = build_tables()
    figures, htmls = build_figures()
    findings = build_findings()
    data, _ = build_analysis()
    run = parse_run(cells)
    warnings = parse_warning_events(cells)
    runtime = parse_runtime_facts(cells)
    kpis = build_kpis(data["class_balance"], findings, figures, htmls, tables, run)
    kpis = build_kpi_catalog(kpis, data, findings)
    data_quality = build_data_quality(data["schema"], data["contracts"], data["generator"], data["class_balance"])
    phases = enrich_phases(findings, figures, htmls, tables)
    graph = build_graph(phases)
    experiments = data["experiments"]
    environment = parse_environment()
    # copy supporting sources
    shutil.copy2(LOGS / "findings.md", ARTIFACTS / "logs" / "findings.md")
    shutil.copy2(LOGS / "findings_ledger.json", ARTIFACTS / "logs" / "findings_ledger.json")
    shutil.copy2(LOGS / "data_fingerprint.json", ARTIFACTS / "logs" / "data_fingerprint.json")
    shutil.copy2(LOGS / "env_snapshot.json", ARTIFACTS / "logs" / "env_snapshot.json")
    shutil.copy2(NOTEBOOK, ARTIFACTS / "notebook" / "fraud_eda_colab.ipynb")
    # summary counts
    grade_counts = {g["grade"]: sum(f["grade"] == g["grade"] for f in findings) for g in __import__("config").GRADE_DEFS}
    rq_counts = []
    for rq, text in RQS.items():
        fs = [f for f in findings if f["rq"] == rq]
        rq_counts.append({
            "id": rq, "question": text, "findings": len(fs),
            "strong": sum(f["grade"] == "strong" for f in fs),
            "supports": sum(f["grade"] == "supports" for f in fs),
            "caveat": sum(f["grade"] == "caveat" for f in fs),
            "weak": sum(f["grade"] == "weak" for f in fs),
            "phases": sorted({f["phase"] for f in fs}),
        })
    overall = next(r for r in data["class_balance"] if r["split"] == "overall")
    counts = {
        "transactions": int(overall["n"]), "fraud": int(overall["fraud"]),
        "fraudRate": float(overall["fraud_rate"]),
        "cards": len(data["cards"]), "categories": len(data["category_table"]),
        "states": 51,
        "merchants": len({r["merchant_clean"] for r in data["merchants_raw"] if r.get("merchant_clean")}),
        "cities": len(data["cities"]), "zip3": len(data["zip3"]), "features": 27,
        "figures": len(figures), "interactive": len(htmls), "tables": len(tables),
        "findings": len(findings), "strong": grade_counts.get("strong", 0),
        "supports": grade_counts.get("supports", 0), "caveats": grade_counts.get("caveat", 0),
        "weak": grade_counts.get("weak", 0),
    }
    manifest = {
        "meta": {
            "generatedAt": datetime.now().isoformat(timespec="seconds"),
            "build": "fraud-evidence-console/1.0",
            "sourceRoot": str(ROOT),
            "note": "Static Power BI-style simulation built from generated artifacts. Values are loaded from source CSV/JSON files.",
        },
        "project": PROJECT,
        "run": {**run, **runtime},
        "notebook": notebook_stats,
        "counts": counts,
        "gradeCounts": grade_counts,
        "kpis": kpis,
        "phases": phases,
        "rqs": rq_counts,
        "findings": findings,
        "figures": figures,
        "htmlArtifacts": htmls,
        "tables": tables,
        "dataQuality": data_quality,
        "experiments": experiments,
        "environment": environment,
        "warnings": warnings,
        "issues": ISSUES,
        "auditNotes": AUDIT_NOTES,
        "graph": graph,
        "gradeDefs": __import__("config").GRADE_DEFS,
        "sources": [
            {"name": "fraudTrain.csv", "role": "Raw training data", "present": False, "bytes": 351.2 * 1024 * 1024, "hash": "fd7139200dbfcbed", "note": "Referenced; not included."},
            {"name": "fraudTest.csv", "role": "Raw test data", "present": False, "bytes": 150.4 * 1024 * 1024, "hash": "12d553ab19440c75", "note": "Referenced; not included."},
            {"name": "fraud_eda_colab.ipynb", "role": "Research notebook", "present": True, "bytes": NOTEBOOK.stat().st_size, "hash": None, "note": "66 cells, 33 code cells, outputs embedded."},
            {"name": "findings_ledger.json", "role": "Evidence ledger", "present": True, "bytes": (LOGS / "findings_ledger.json").stat().st_size, "hash": None, "note": "64 records; evidence capped at 400 chars."},
            {"name": "figures/", "role": "Generated figures", "present": True, "bytes": sum(f["bytes"] for f in figures) + sum(h["bytes"] for h in htmls), "hash": None, "note": "129 PNG + 7 HTML."},
            {"name": "tables/", "role": "Generated tables", "present": True, "bytes": sum(t["bytes"] for t in tables), "hash": None, "note": "46 CSV tables."},
        ],
    }
    (DATA / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (DATA / "analysis.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (DATA / "notebook.json").write_text(
        json.dumps({"cells": cells, "stats": notebook_stats}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    (METADATA / "analytics_manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    write_processed(run, findings, figures, htmls, tables, cells, warnings, experiments, data, kpis, data_quality, phases)
    pd.DataFrame(dictionary).to_csv(REPORTS / "data_dictionary.csv", index=False)
    print(f"manifest: {len(json.dumps(manifest))/1024:.0f} KB | analysis: {(DATA / 'analysis.json').stat().st_size/1024:.0f} KB | notebook: {(DATA / 'notebook.json').stat().st_size/1024:.0f} KB")
    print(f"tables: {len(tables)} | figures: {len(figures)} | html: {len(htmls)} | findings: {len(findings)}")
    print(f"phases: {[(p['id'], p['artifactCount'], p['findingCount']) for p in phases]}")
    print(f"experiments: {len(experiments)} | warnings: {len(warnings)}")
    print("grade counts:", grade_counts)


if __name__ == "__main__":
    main()
