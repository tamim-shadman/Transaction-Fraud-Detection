"""Build the Phase 2 evidence layer from the existing generated artifacts.

This script does not read or derive new raw transaction data. It reconstructs a
navigable evidence layer from the notebook outputs, the generated manifest, the
analysis tables and the metric catalog. Outputs are written to app/public/data/phase2.

Run: python analytics/build_phase2_data.py
"""
from __future__ import annotations

import csv
import json
import math
import re
import statistics
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "app" / "public" / "data"
OUT = DATA / "phase2"
REPORTS = ROOT / "reports"
LOGS = ROOT / "logs"

PHASE_ROUTES = {
    "P0": "/data-audit", "P1": "/distributions", "P2": "/interactions",
    "P3": "/temporal", "P4": "/advanced", "P5": "/statistics",
    "P6": "/features", "P7": "/model", "P8": "/artifacts",
}
PHASE_ORDER = ["P0", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]
GRADE_ORDER = {"strong": 0, "supports": 1, "caveat": 2, "weak": 3}
WEEKLY_Z_THRESHOLD = 3.5
PSI_SEVERE = 0.25
PSI_MODERATE = 0.10


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(name: str, payload: Any) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {path.relative_to(ROOT)} ({path.stat().st_size:,} bytes)")


def clean(text: str) -> str:
    """Remove ANSI / notebook carriage noise without altering meaning."""
    text = re.sub(r"\x1b\[[0-9;]*m", "", text)
    return text.replace("\r", "").strip()


def table_id_for_source(source: str, tables: list[dict]) -> str | None:
    if not source:
        return None
    stem = Path(source).stem
    for table in tables:
        if table["id"] == stem or table["id"].endswith("_" + stem):
            return table["id"]
    return None


def route_for_table(table_id: str | None) -> str:
    return f"/artifacts?tab=tables&table={table_id}" if table_id else "/artifacts?tab=tables"


def median_abs_deviation(values: list[float]) -> tuple[float, float, float]:
    med = statistics.median(values)
    mad = statistics.median(abs(value - med) for value in values)
    return med, mad, 1.4826 * mad


def metric_value(item: dict, key: str) -> Any:
    value = item.get(key)
    return value if value not in (None, "") else None


# ---------------------------------------------------------------------------
# Load sources
# ---------------------------------------------------------------------------

manifest = load_json(DATA / "manifest.json")
analysis = load_json(DATA / "analysis.json")
notebook = load_json(DATA / "notebook.json")

tables = manifest["tables"]
figures = manifest["figures"]
html_artifacts = manifest["htmlArtifacts"]
findings = manifest["findings"]
notes = manifest["auditNotes"]
issues = manifest["issues"]
phases = manifest["phases"]
rqs = manifest["rqs"]
experiments = manifest["experiments"]
counts = manifest["counts"]

table_by_id = {table["id"]: table for table in tables}
figure_by_id = {figure["id"]: figure for figure in figures}
html_by_id = {figure["id"]: figure for figure in html_artifacts}

# ---------------------------------------------------------------------------
# Notebook provenance: map every written artifact to its producing cell
# ---------------------------------------------------------------------------

artifact_cells: dict[str, dict] = {}
events: list[dict] = []
event_no = 0
section_events: list[dict] = []

for cell in notebook["cells"]:
    cell_number = int(cell["index"]) + 1
    output = cell.get("output") or ""
    lines = output.split("\n")
    for line_no, raw_line in enumerate(lines, start=1):
        line = clean(raw_line)
        if not line:
            continue
        event_no += 1
        event = {
            "id": f"EV-{event_no:05d}",
            "source": "notebook",
            "sourceLabel": f"Notebook cell {cell_number}",
            "cell": cell_number,
            "line": line_no,
            "phase": cell.get("phase", "SETUP"),
            "raw": line[:1200],
            "message": line[:400],
            "severity": "info",
            "category": "output",
            "timestamp": None,
        }
        section = re.match(r"^SECTION\s+\d+[a-z]?\s*[—\-]\s*(.+)$", line)
        if section:
            event["category"] = "section"
            event["severity"] = "notice"
            event["message"] = f"Section: {section.group(1).strip()}"
            section_events.append(event)
        elif re.match(r"^=+$", line):
            event["category"] = "divider"
        else:
            artifact_match = re.match(r"^\s*\[(fig|tab|ledger)([^\]]*)\]\s+(.+)$", line)
            if artifact_match:
                kind, qualifier, target = artifact_match.groups()
                target = target.strip()
                if kind == "fig":
                    stem = Path(target).stem
                    event["category"] = "artifact"
                    event["message"] = f"Wrote figure {stem}"
                    artifact_cells[stem] = {"cell": cell_number, "phase": cell.get("phase"), "kind": "figure", "line": line}
                elif kind == "tab":
                    stem = Path(target).stem
                    event["category"] = "artifact"
                    event["message"] = f"Wrote table {stem}"
                    artifact_cells[stem] = {"cell": cell_number, "phase": cell.get("phase"), "kind": "table", "line": line}
                else:
                    event["category"] = "ledger"
                    event["severity"] = "notice"
                    ledger_match = re.match(r"\s*(RQ\d+)\|(\w+)\]\s*(.+)", qualifier or "")
                    if ledger_match:
                        event["rq"] = ledger_match.group(1)
                        event["grade"] = ledger_match.group(2)
                        event["message"] = f"Ledger {ledger_match.group(1)} · {ledger_match.group(2)}"
                    else:
                        event["message"] = "Ledger entry recorded"
            elif re.search(r"\b(ERROR|Traceback|Exception|FAILED|AssertionError)\b", line, re.I):
                event["severity"] = "error"
                event["category"] = "runtime"
            elif re.search(r"\bWARNING\b", line, re.I):
                event["severity"] = "warning"
                event["category"] = "runtime"
            elif re.search(r"\b(skipped|incompatible|deprecated)\b", line, re.I):
                event["severity"] = "warning"
                event["category"] = "export" if "kaleido" in line.lower() or "skipped" in line.lower() else "dependency"
            elif line.startswith("[fig]") or line.startswith("[tab]"):
                event["category"] = "artifact"
            elif re.match(r"^[a-zA-Z_][\w \-]*\s*[:=]", line) or re.search(r"\b(AUC|PR-AUC|ROC-AUC|silhouette|inertia|rows=|memory|rate|threshold|recall|precision)\b", line, re.I):
                event["category"] = "measurement"
            elif line.startswith("  [ledger") or line.startswith("[ledger"):
                event["category"] = "ledger"
        events.append(event)

# Canonical manifest warnings are authoritative and may include text not present
# in the exported notebook output. Keep them as a separate, verified source.
for warning in manifest.get("warnings", []):
    event_no += 1
    events.append({
        "id": f"EV-{event_no:05d}",
        "source": "warning-register",
        "sourceLabel": warning.get("source", "Warning register"),
        "cell": (warning.get("cell") or 0) + 1 if warning.get("cell") is not None else None,
        "line": None,
        "phase": warning.get("phase", "SETUP"),
        "raw": warning.get("detail", ""),
        "message": warning.get("message", ""),
        "severity": "warning" if warning.get("severity") == "warning" else warning.get("severity", "warning"),
        "category": (warning.get("category") or "warning").lower(),
        "timestamp": None,
        "warningId": warning.get("id"),
    })

# Build/test logs are separate sources. No timestamps are invented.
for filename, source_label in [("build.log", "Build log"), ("ui_smoke.log", "UI smoke log")]:
    path = LOGS / filename
    if not path.exists():
        continue
    for line_no, raw_line in enumerate(path.read_text(encoding="utf-8", errors="replace").split("\n"), start=1):
        line = clean(raw_line)
        if not line:
            continue
        event_no += 1
        severity = "info"
        category = "build" if filename == "build.log" else "test"
        if re.search(r"\berror\b|\bfailed\b", line, re.I):
            severity = "error"
        elif re.search(r"\bwarn", line, re.I):
            severity = "warning"
        elif re.search(r"✓|passed|complete|built in", line, re.I):
            severity = "notice"
        events.append({
            "id": f"EV-{event_no:05d}",
            "source": "build" if filename == "build.log" else "ui",
            "sourceLabel": f"{source_label} line {line_no}",
            "cell": None,
            "line": line_no,
            "phase": "BUILD" if filename == "build.log" else "TEST",
            "raw": line[:1200],
            "message": line[:400],
            "severity": severity,
            "category": category,
            "timestamp": None,
        })

# ---------------------------------------------------------------------------
# Artifact provenance index
# ---------------------------------------------------------------------------

artifact_rows: list[dict] = []
for figure in figures + html_artifacts:
    stem = figure["id"]
    mapped = artifact_cells.get(stem)
    related = [
        finding for finding in findings
        if finding["phase"] == figure["phase"]
    ]
    related.sort(key=lambda finding: GRADE_ORDER.get(finding["grade"], 9))
    artifact_rows.append({
        "id": stem,
        "kind": "interactive" if figure.get("type") == "interactive" else "figure",
        "lineageNodeId": f"artifact:{stem}",
        "title": figure["title"],
        "caption": figure.get("caption", ""),
        "phase": figure["phase"],
        "group": figure.get("group", ""),
        "bytes": figure.get("bytes"),
        "width": figure.get("width"),
        "height": figure.get("height"),
        "thumb": figure.get("thumb"),
        "full": figure.get("full"),
        "source": figure.get("source"),
        "cell": mapped["cell"] if mapped else None,
        "cellLine": mapped["line"] if mapped else None,
        "cellPhase": mapped["phase"] if mapped else None,
        "provenance": "verified" if mapped else "inferred",
        "relatedFindings": [{"id": f["id"], "title": f["finding"], "grade": f["grade"]} for f in related[:6]],
        "relatedRq": related[0]["rq"] if related else None,
        "href": f"/artifacts?tab=figures&figure={stem}" if figure.get("type") != "interactive" else "/artifacts?tab=interactive",
    })

for table in tables:
    mapped = artifact_cells.get(table["id"])
    related = [finding for finding in findings if finding["phase"] == table["phase"]]
    related.sort(key=lambda finding: GRADE_ORDER.get(finding["grade"], 9))
    artifact_rows.append({
        "id": table["id"],
        "kind": "table",
        "lineageNodeId": f"table:{table['id']}",
        "title": table["title"],
        "caption": table["description"],
        "phase": table["phase"],
        "group": table["category"],
        "bytes": table.get("bytes"),
        "rows": table.get("rows"),
        "cols": table.get("cols"),
        "missingCells": table.get("missing_cells"),
        "columns": table.get("columns", []),
        "cell": mapped["cell"] if mapped else None,
        "cellLine": mapped["line"] if mapped else None,
        "cellPhase": mapped["phase"] if mapped else None,
        "provenance": "verified" if mapped else "inferred",
        "relatedFindings": [{"id": f["id"], "title": f["finding"], "grade": f["grade"]} for f in related[:6]],
        "relatedRq": related[0]["rq"] if related else None,
        "href": f"/artifacts?tab=tables&table={table['id']}",
        "exploreHref": f"/explore?table={table['id']}",
        "source": table.get("source"),
    })

write_json("artifacts.json", {
    "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "counts": {
        "total": len(artifact_rows),
        "figures": len(figures),
        "interactive": len(html_artifacts),
        "tables": len(tables),
        "verifiedProvenance": sum(1 for row in artifact_rows if row["provenance"] == "verified"),
        "inferredProvenance": sum(1 for row in artifact_rows if row["provenance"] == "inferred"),
    },
    "items": artifact_rows,
})


# ---------------------------------------------------------------------------
# Program profile and phase dossiers
# ---------------------------------------------------------------------------

phase_issues = defaultdict(list)
for issue in issues:
    phase_issues[issue.get("phase")].append(issue)
phase_findings = defaultdict(list)
for finding in findings:
    phase_findings[finding["phase"]].append(finding)
phase_figures = defaultdict(list)
for figure in figures:
    phase_figures[figure["phase"]].append(figure)

phase_rows = []
for phase in phases:
    pid = phase["id"]
    p_findings = sorted(phase_findings.get(pid, []), key=lambda f: GRADE_ORDER.get(f["grade"], 9))
    p_issues = phase_issues.get(pid, [])
    p_figures = phase_figures.get(pid, [])
    cell_numbers = list(range(phase["cell_start"], phase["cell_end"] + 1))
    cells = [c for c in notebook["cells"] if (int(c["index"]) + 1) in cell_numbers]
    output_chars = sum(len(c.get("output") or "") for c in cells)
    phase_rows.append({
        "id": pid,
        "num": phase["num"],
        "name": phase["name"],
        "shortName": phase["short_name"],
        "section": phase["section"],
        "route": PHASE_ROUTES.get(pid, "/"),
        "purpose": phase["purpose"],
        "description": phase["description"],
        "methods": phase["methods"],
        "keyMetric": phase["key_metric"],
        "keyFindings": phase["key_findings"],
        "limitations": phase["limitations"],
        "accent": phase["accent"],
        "cellStart": phase["cell_start"],
        "cellEnd": phase["cell_end"],
        "cellRange": f"{phase['cell_start']}–{phase['cell_end']}",
        "notebookCells": len(cells),
        "outputChars": output_chars,
        "figureCount": phase["figureCount"],
        "tableCount": phase["tableCount"],
        "interactiveCount": phase["interactiveCount"],
        "artifactCount": phase["artifactCount"],
        "findingCount": phase["findingCount"],
        "strongCount": phase["strongCount"],
        "caveatCount": phase["caveatCount"],
        "rqs": phase["rqs"],
        "topFindings": [
            {"id": f["id"], "title": f["finding"], "grade": f["grade"], "rq": f["rq"]}
            for f in p_findings[:4]
        ],
        "issues": [
            {"id": i["id"], "title": i["title"], "severity": i["severity"], "status": i["status"]}
            for i in p_issues
        ],
        "representativeFigure": p_figures[0]["id"] if p_figures else None,
        "representativeThumb": p_figures[0].get("thumb") if p_figures else None,
        "status": "Complete" if cells and all(not c["is_code"] or c.get("exec") is not None for c in cells) else "Partial",
        "statusNote": "Cell execution and generated artifacts are present. Not independently re-run in this workspace.",
    })

rq_rows = []
for rq in rqs:
    rq_findings = [f for f in findings if f["rq"] == rq["id"]]
    rq_rows.append({
        **rq,
        "phaseNames": [next((p["name"] for p in phases if p["id"] == pid), pid) for pid in rq["phases"]],
        "topFinding": next(
            ({"id": f["id"], "title": f["finding"], "grade": f["grade"]} for f in sorted(rq_findings, key=lambda f: GRADE_ORDER.get(f["grade"], 9))),
            None,
        ),
    })

checklist = analysis.get("checklist", [])
absent_sources = [source for source in manifest["sources"] if not source["present"]]

program = {
    "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "project": manifest["project"],
    "run": manifest["run"],
    "counts": counts,
    "grades": manifest["gradeCounts"],
    "phaseStatus": {"complete": sum(1 for p in phase_rows if p["status"] == "Complete"), "total": len(phase_rows)},
    "phases": phase_rows,
    "researchQuestions": rq_rows,
    "technologies": manifest["project"].get("technologies", []),
    "environment": manifest.get("environment", {}),
    "sources": manifest["sources"],
    "reproducibility": {
        "checklistPassed": sum(1 for item in checklist if item.get("ok")),
        "checklistTotal": len(checklist),
        "checklist": checklist,
        "absentSources": absent_sources,
        "warnings": len(manifest.get("warnings", [])),
        "errorOutputs": manifest["notebook"]["error_outputs"],
        "cellsWithOutput": manifest["notebook"]["cells_with_output"],
        "codeCells": manifest["notebook"]["code_cells"],
    },
    "issues": manifest["issues"],
    "auditNotes": manifest["auditNotes"],
    "limits": [
        {"title": "Raw source files absent", "detail": "fraudTrain.csv and fraudTest.csv are referenced by hash and size but not present. The notebook cannot be re-run end-to-end from this folder."},
        {"title": "Single research program", "detail": "The workspace contains one research program with nine phases. Comparisons are between model variants and folds, not independent projects."},
        {"title": "No native Power BI authoring runtime", "detail": "powerbi/ contains import-ready CSVs, DAX and a theme; no PBIX or PBIP exists or was generated."},
        {"title": "Partial runtime telemetry", "detail": "The run records total wall clock, six embedding durations and SHAP duration. It does not record a per-phase or per-model runtime ledger."},
    ],
    "milestones": [
        {
            "phase": phase["id"],
            "title": phase["name"],
            "cells": f"{phase['cell_start']}–{phase['cell_end']}",
            "metric": phase["key_metric"],
            "findings": phase["findingCount"],
            "artifacts": phase["artifactCount"],
        }
        for phase in phases
    ],
}
write_json("program.json", program)

# ---------------------------------------------------------------------------
# Project Portfolio and Project Profiles
# ---------------------------------------------------------------------------

PROJECT_DEFS = [
    {
        "id": "PROJ-01",
        "title": "Data Integrity, Forensic Verification & Contract Audit",
        "shortTitle": "Data Forensics & Audit",
        "track": "Data Quality & Forensics",
        "leadRole": "Lead Forensic Data Scientist",
        "phases": ["P0"],
        "phaseRange": "P0 (§01)",
        "cellRange": "1–8",
        "purpose": "Audit schema, evaluate contract invariants, and expose synthetic generator artifacts in merchant coordinates.",
        "objectives": [
            "Validate schema definitions and detect identifier leaks (trans_num, cc_num).",
            "Expose coordinate jitter forensics in merchant locations (non-physical distance signal).",
            "Establish baseline class imbalance across train and test temporal splits.",
        ],
        "keyMetric": {"label": "Imbalance Drift", "value": "0.579% train → 0.386% test", "interpretation": "Extreme imbalance with temporal drift"},
        "riskLevel": "High",
        "riskNote": "Generator jitter artifacts in merchant coordinates create artificial discriminative signals.",
        "deliverables": [
            "Data contract assertions table (phase0_contracts.csv)",
            "Generator forensic discrepancy register",
            "Temporal boundary split verification (2020-06-21 12:13:37)",
        ],
        "limitations": [
            "Raw source datasets (fraudTrain.csv, fraudTest.csv) are not in the local workspace.",
            "Merchant coordinates represent per-transaction jitter, not physical store geography.",
        ],
        "route": "/data-audit",
    },
    {
        "id": "PROJ-02",
        "title": "Behavioral Patterns, Multi-Way Interactions & Temporal Dynamics",
        "shortTitle": "Exploratory & Spatio-Temporal",
        "track": "Exploratory Data Science",
        "leadRole": "Principal Behavioral Scientist",
        "phases": ["P1", "P2", "P3"],
        "phaseRange": "P1–P3 (§02–§04)",
        "cellRange": "9–32",
        "purpose": "Map univariate, bivariate and multi-way risk concentration across categories, amounts, cardholder history and temporal cycles.",
        "objectives": [
            "Characterize amount distributions, right-tail skew, and non-linear risk escalation.",
            "Quantify category × hour of day interactions (e.g. night online shopping risk).",
            "Decompose temporal series with STL (seasonality, day-of-week periodicity, change points).",
        ],
        "keyMetric": {"label": "Night Interaction Risk", "value": "42× baseline", "interpretation": "Risk multiplier for night + risky categories + amt ≥ $500"},
        "riskLevel": "Medium",
        "riskNote": "Card-level fraud incidence in simulator (97.7%) is opposite of production fraud concentration.",
        "deliverables": [
            "Amount quantile & monetary exposure ledger",
            "Category × hour risk interaction heatmaps",
            "STL time-series decomposition and autocorrelation profiles",
        ],
        "limitations": [
            "Card-level fraud incidence is an artifact of the simulator's per-card allocation.",
            "Structural breaks are driven by simulation campaigns rather than real calendar holidays.",
        ],
        "route": "/interactions",
    },
    {
        "id": "PROJ-03",
        "title": "Unsupervised Anomaly Detection & Manifold Representations",
        "shortTitle": "Unsupervised & Manifold Discovery",
        "track": "Unsupervised Learning",
        "leadRole": "Staff Machine Learning Researcher",
        "phases": ["P4"],
        "phaseRange": "P4 (§05)",
        "cellRange": "33–42",
        "purpose": "Evaluate whether fraud separates from genuine transactions in low-dimensional embeddings and unsupervised outlier detection.",
        "objectives": [
            "Test 2D manifold projections (PCA, UMAP, t-SNE) for class separability.",
            "Measure clustering stability using K-Means and DBSCAN density clustering.",
            "Benchmark unsupervised detectors: Isolation Forest, Local Outlier Factor (LOF), Autoencoders.",
        ],
        "keyMetric": {"label": "Peak Unsupervised AUC", "value": "0.8810 (LOF)", "interpretation": "Contextual outlier detection on sample"},
        "riskLevel": "Medium",
        "riskNote": "High false positive rate under extreme class imbalance without behavioral card history.",
        "deliverables": [
            "2D embedding separability benchmark table",
            "Cluster purity and fraud density analysis",
            "Unsupervised detector comparison report",
        ],
        "limitations": [
            "LOF evaluated on 5,000 transaction subsample due to quadratic distance complexity.",
            "Unsupervised geometry reflects transaction volume density rather than fraud clusters.",
        ],
        "route": "/advanced",
    },
    {
        "id": "PROJ-04",
        "title": "Inferential Statistics, Non-Parametric Effect Sizes & Clustered Inference",
        "shortTitle": "Statistical Inference & Effect Sizes",
        "track": "Statistical Methodology",
        "leadRole": "Lead Biostatistician & Quantitative Methodologist",
        "phases": ["P5"],
        "phaseRange": "P5 (§06)",
        "cellRange": "43–49",
        "purpose": "Establish robust, non-parametric effect sizes with bootstrap intervals and control for repeated cardholder transaction clustering.",
        "objectives": [
            "Compute Cliff's delta and Kolmogorov-Smirnov distance with 95% bootstrap intervals.",
            "Construct forest plots with Wilson confidence intervals and Benjamini-Hochberg FDR control.",
            "Fit cluster-robust logit with card-level clusters to evaluate repeated-measures shrinkage.",
        ],
        "keyMetric": {"label": "Amount Cliff's Delta", "value": "0.669 [0.656, 0.680]", "interpretation": "Statistically robust rightward fraud amount shift"},
        "riskLevel": "Low",
        "riskNote": "Rigorous inference; repeated-measures adjustments prevent over-claiming per-transaction effects.",
        "deliverables": [
            "Non-parametric effect size catalogue with bootstrap CIs",
            "Category rate forest plot with Wilson intervals",
            "Cardholder cluster-robust logistic regression coefficients",
        ],
        "limitations": [
            "Single-seed synthetic simulation limits cross-environment generalization.",
            "Statistical significance does not equal operational cost-effectiveness.",
        ],
        "route": "/statistics",
    },
    {
        "id": "PROJ-05",
        "title": "Behavioral Feature Engineering, Leak-Aware Encodings & Survival Dynamics",
        "shortTitle": "Behavioral Feature Engineering",
        "track": "Feature Engineering",
        "leadRole": "Principal Feature Engineer",
        "phases": ["P6"],
        "phaseRange": "P6 (§07)",
        "cellRange": "50–58",
        "purpose": "Engineer leak-aware velocity features, cyclical temporal transforms, empirical Bayes shrinkage, and hazard models.",
        "objectives": [
            "Formulate causal expanding target encodings without future-to-past leakage.",
            "Construct trailing velocity counters, cumulative spend, and implied travel speeds.",
            "Model discrete-time fraud arrival hazard across customer account lifecycle.",
        ],
        "keyMetric": {"label": "Velocity Escalation", "value": "Monotonic with speed", "interpretation": "Strongest behavioral predictive signal"},
        "riskLevel": "Low",
        "riskNote": "Expanding priors strictly respect causality; naive encodings leak future labels.",
        "deliverables": [
            "Target encoding causality proof and leakage demonstration",
            "Velocity window definitions (1h, 24h, 7d, 30d)",
            "Discrete-time hazard curves and cohort retention tables",
        ],
        "limitations": [
            "Implied speed features depend on coordinate jitter noise rather than actual customer mobility.",
            "Expanding window features induce severe distribution shift across long temporal horizons.",
        ],
        "route": "/features",
    },
    {
        "id": "PROJ-06",
        "title": "Supervised Modeling, Decomposed Ablation & Out-of-Domain Transfer",
        "shortTitle": "Supervised Modeling & OOD Transfer",
        "track": "Machine Learning & Robustness",
        "leadRole": "Lead Machine Learning Engineer",
        "phases": ["P7"],
        "phaseRange": "P7 (§08)",
        "cellRange": "59–75",
        "purpose": "Train causal leak-free LightGBM, quantify out-of-domain transfer collapse, and isolate drift mechanisms via ablation.",
        "objectives": [
            "Train baseline leak-free LightGBM classifier with early stopping.",
            "Conduct walk-forward time-ordered cross-validation (4 folds) for honest generalization.",
            "Decompose ablation: isolate card_prior_fraud as the primary driver of OOD transfer failure.",
            "Perform adversarial validation (AUC = 1.000) and PSI feature drift ranking.",
        ],
        "keyMetric": {"label": "In-Domain vs OOD Gap", "value": "Δ = 0.478 PR-AUC", "interpretation": "0.9510 in-domain vs 0.473 test score across folds"},
        "riskLevel": "High",
        "riskNote": "Adversarial validation separates train and test perfectly (AUC = 1.000) via cumulative features.",
        "deliverables": [
            "Full causal LightGBM model scorecard",
            "Decomposed feature-family ablation matrix",
            "Population Stability Index (PSI) drift register",
        ],
        "limitations": [
            "Single-seed experiment lacks variance bounds for hyperparameter tuning.",
            "Cumulative velocity features do not transfer across temporal split boundaries.",
        ],
        "route": "/model",
    },
    {
        "id": "PROJ-07",
        "title": "Decision Policy Economics, Operating Thresholds & Dollar Capture",
        "shortTitle": "Decision Economics & Policy",
        "track": "Risk Economics & Strategy",
        "leadRole": "Director of Fraud Risk Operations",
        "phases": ["P7", "P8"],
        "phaseRange": "P7–P8 (§08–§09)",
        "cellRange": "76–84",
        "purpose": "Optimize review operating thresholds under variable friction costs ($1–$50 FP) and evaluate capture@k budget curves.",
        "objectives": [
            "Derive cost-sensitive operating thresholds minimizing expected total financial loss.",
            "Evaluate review budget capacity: dollar capture and event recall at 1%–5% review bandwidth.",
            "Audit segment-level error distributions and financial exposure trade-offs.",
        ],
        "keyMetric": {"label": "Capture @ 1% Budget", "value": "68.7% fraud dollars", "interpretation": "Captures 65.5% fraud events, 68.7% dollars in top 1% reviews"},
        "riskLevel": "Medium",
        "riskNote": "Optimal operating point swings 443× depending on friction cost per review ($1 vs $50).",
        "deliverables": [
            "Expected loss minimization threshold curves",
            "Capture@k budget table (1%, 2%, 5%, 10%)",
            "Cost-sensitivity frontier and segment error diagnostics",
        ],
        "limitations": [
            "Assumes static $5 baseline review friction cost without model retraining.",
            "Excludes downstream customer friction, merchant dispute costs, and investigator queue latency.",
        ],
        "route": "/economics",
    },
]

project_rows = []
ECON_FINDINGS = {"F-058", "F-059", "F-060", "F-064"}

for pdef in PROJECT_DEFS:
    p_phases = [p for p in phase_rows if p["id"] in pdef["phases"]]
    if pdef["id"] == "PROJ-06":
        p_findings = [f for f in findings if f["phase"] in pdef["phases"] and f["id"] not in ECON_FINDINGS]
    elif pdef["id"] == "PROJ-07":
        p_findings = [f for f in findings if f["id"] in ECON_FINDINGS]
    else:
        p_findings = [f for f in findings if f["phase"] in pdef["phases"]]
    sorted_findings = sorted(p_findings, key=lambda f: GRADE_ORDER.get(f["grade"], 9))
    p_figures = [f for f in figures if f["phase"] in pdef["phases"]]
    p_tables = [t for t in tables if t["phase"] in pdef["phases"]]
    p_rqs = sorted(list({f["rq"] for f in p_findings if f.get("rq")}))
    
    project_rows.append({
        **pdef,
        "status": "Complete",
        "findingCount": len(p_findings),
        "strongCount": sum(1 for f in p_findings if f["grade"] == "strong"),
        "supportsCount": sum(1 for f in p_findings if f["grade"] == "supports"),
        "caveatCount": sum(1 for f in p_findings if f["grade"] == "caveat"),
        "weakCount": sum(1 for f in p_findings if f["grade"] == "weak"),
        "artifactCount": len(p_figures) + len(p_tables),
        "figureCount": len(p_figures),
        "tableCount": len(p_tables),
        "rqs": p_rqs,
        "topFindings": [
            {"id": f["id"], "title": f["finding"], "grade": f["grade"], "rq": f["rq"], "phase": f["phase"]}
            for f in sorted_findings[:4]
        ],
        "phasesDetail": [
            {"id": p["id"], "name": p["name"], "shortName": p["shortName"], "cellRange": p["cellRange"], "findings": p["findingCount"], "artifacts": p["artifactCount"]}
            for p in p_phases
        ],
    })

projects_payload = {
    "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "programTitle": manifest["project"]["title"],
    "summary": {
        "totalProjects": len(project_rows),
        "completeProjects": sum(1 for p in project_rows if p["status"] == "Complete"),
        "totalTracks": len({p["track"] for p in project_rows}),
        "totalPhases": len(phase_rows),
        "totalFindings": len(findings),
        "strongFindings": counts["strong"],
        "totalArtifacts": counts["figures"] + counts["interactive"] + counts["tables"],
    },
    "tracks": sorted(list({p["track"] for p in project_rows})),
    "projects": project_rows,
}
write_json("projects.json", projects_payload)



# ---------------------------------------------------------------------------
# Experiments and comparability groups
# ---------------------------------------------------------------------------

GROUP_DEFS = {
    "Supervised · OOD test": {
        "label": "Cross-boundary model variants",
        "basis": "Same held-out test split, but variants differ in features or training objective. Ablations share training rows; robustness variants are not controlled experiments.",
        "metric": "Test PR-AUC",
        "comparable": True,
        "limitations": "Do not treat variant differences as causal unless only the named feature set changed. PR-AUC is bounded and class-imbalanced; prefer absolute differences over percent improvement.",
    },
    "Walk-forward folds": {
        "label": "Time-ordered folds",
        "basis": "Expanding-window folds scored in-domain and on the same held-out test split; the four rows are repeated measurements of one validation design.",
        "metric": "Validation PR-AUC",
        "comparable": True,
        "limitations": "Folds are not independent samples and cover different market periods. Report dispersion, not a single fold as the result.",
    },
    "Unsupervised anomaly": {
        "label": "Anomaly detectors",
        "basis": "Different algorithms and different sample sizes (LOF uses 5,000 rows; the others 50,000). AUC is computed against fraud labels for evaluation only.",
        "metric": "AUC vs fraud labels",
        "comparable": False,
        "limitations": "Sample-size and algorithm differences prevent a clean ranking. LOF's AUC is not directly comparable to the 50,000-row detectors.",
    },
    "Unsupervised embeddings": {
        "label": "2D embeddings",
        "basis": "Separability is measured by a logistic classifier on each 2D embedding, with different hyperparameters per embedding.",
        "metric": "Embedding separability AUC",
        "comparable": False,
        "limitations": "Hyperparameters and geometry differ. Use as a qualitative diagnostic, not a model-selection leaderboard.",
    },
    "Hour encoding": {
        "label": "Hour-encoding comparison",
        "basis": "The same narrow three-feature model and time-ordered holdout, varying only the hour encoding.",
        "metric": "Holdout PR-AUC",
        "comparable": True,
        "limitations": "Only three features plus category; a 0.0003 difference is not material evidence for a general encoding recommendation.",
    },
}

group_members = defaultdict(list)
for experiment in experiments:
    group_members[experiment["family"]].append(experiment)

baseline_by_group = {
    "Supervised · OOD test": "final_unconstrained",
    "Hour encoding": "hour_raw",
}
runtime_by_label = {row["model"]: row["seconds"] for row in manifest["run"].get("embeddingTimes", [])}

experiment_rows = []
for experiment in experiments:
    group = experiment["family"]
    definition = GROUP_DEFS.get(group, {})
    baseline_id = baseline_by_group.get(group)
    baseline = next((e for e in group_members[group] if e["id"] == baseline_id), None)
    delta = None
    ratio = None
    if baseline and experiment["id"] != baseline["id"] and experiment.get("pr_auc") is not None and baseline.get("pr_auc"):
        delta = experiment["pr_auc"] - baseline["pr_auc"]
        ratio = experiment["pr_auc"] / baseline["pr_auc"] if baseline["pr_auc"] else None
    metric_label = definition.get("metric", experiment.get("metric", "PR-AUC"))
    source_table = table_id_for_source(experiment.get("source", ""), tables)
    experiment_rows.append({
        **experiment,
        "group": group,
        "groupId": re.sub(r"[^a-z0-9]+", "-", definition.get("label", group).lower()).strip("-"),
        "groupLabel": definition.get("label", group),
        "metricLabel": metric_label,
        "baselineId": baseline_id,
        "deltaVsBaseline": delta,
        "ratioVsBaseline": ratio,
        "deltaMode": "absolute",
        "rankInGroup": None,
        "runtimeSeconds": runtime_by_label.get(experiment["label"]),
        "sourceTableId": source_table,
        "sourceHref": route_for_table(source_table),
        "href": f"/experiments?exp={experiment['id']}",
        "comparable": definition.get("comparable", True),
    })

for group, members in group_members.items():
    scored = [e for e in experiment_rows if e["group"] == group and e.get("pr_auc") is not None]
    scored.sort(key=lambda e: e["pr_auc"], reverse=True)
    for index, experiment in enumerate(scored, start=1):
        experiment["rankInGroup"] = index

groups = []
for group, members in group_members.items():
    definition = GROUP_DEFS.get(group, {})
    groups.append({
        "id": re.sub(r"[^a-z0-9]+", "-", definition.get("label", group).lower()).strip("-"),
        "label": definition.get("label", group),
        "metric": definition.get("metric", "PR-AUC"),
        "basis": definition.get("basis", "No shared evaluation basis is documented."),
        "limitations": definition.get("limitations", ""),
        "comparable": definition.get("comparable", False),
        "count": len(members),
        "members": [e["id"] for e in members],
        "baselineId": baseline_by_group.get(group),
    })

write_json("experiments.json", {
    "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "counts": {"total": len(experiment_rows), "groups": len(groups)},
    "groups": groups,
    "items": experiment_rows,
    "metricNotes": {
        "pr_auc": "Precision-recall AUC. Sensitive to class prevalence; do not compare across different splits or samples.",
        "roc_auc": "ROC AUC. Less sensitive to prevalence but can look strong when the positive class is rare; report alongside PR-AUC.",
        "delta": "Absolute difference in the metric's native units (fraction, 0–1), not a percentage improvement.",
    },
})


# ---------------------------------------------------------------------------
# Log events, patterns and summary
# ---------------------------------------------------------------------------

def normalize_message(message: str) -> str:
    text = clean(message).lower()
    text = re.sub(r"/content/outputs/[^\s]+", "<path>", text)
    text = re.sub(r"\b[0-9a-f]{8,}\b", "<hash>", text)
    text = re.sub(r"\b\d+(?:\.\d+)?\b", "#", text)
    text = re.sub(r"\s+", " ", text)
    return text[:220]


pattern_map: dict[str, dict] = {}
pattern_events = 0
for event in events:
    if event["category"] in {"divider", "output"} and len(event["message"]) < 3:
        continue
    signature = normalize_message(event["message"])
    if not signature:
        continue
    pattern_events += 1
    key = f"{event['severity']}|{event['category']}|{signature}"
    pattern = pattern_map.setdefault(key, {
        "id": f"PAT-{len(pattern_map) + 1:03d}",
        "signature": signature,
        "severity": event["severity"],
        "category": event["category"],
        "count": 0,
        "cells": set(),
        "phases": set(),
        "example": event["message"],
        "firstCell": event["cell"],
        "source": event["sourceLabel"],
    })
    pattern["count"] += 1
    if event["cell"] is not None:
        pattern["cells"].add(event["cell"])
    pattern["phases"].add(event["phase"])

patterns = []
for pattern in pattern_map.values():
    pattern["cells"] = sorted(pattern["cells"])
    pattern["phases"] = sorted(pattern["phases"], key=lambda p: PHASE_ORDER.index(p) if p in PHASE_ORDER else 99)
    patterns.append(pattern)
patterns.sort(key=lambda p: ({"error": 0, "warning": 1, "notice": 2, "info": 3}.get(p["severity"], 4), -p["count"], p["id"]))

severity_counts = Counter(event["severity"] for event in events)
category_counts = Counter(event["category"] for event in events)
phase_counts = Counter(event["phase"] for event in events)
warning_events = [event for event in events if event["severity"] in {"warning", "error"}]
artifact_events = [event for event in events if event["category"] == "artifact"]

log_summary = {
    "totalEvents": len(events),
    "bySeverity": dict(severity_counts),
    "byCategory": dict(category_counts),
    "byPhase": dict(phase_counts),
    "warningCount": severity_counts.get("warning", 0),
    "errorCount": severity_counts.get("error", 0),
    "tracebacks": manifest["notebook"]["error_outputs"],
    "cellsWithOutput": manifest["notebook"]["cells_with_output"],
    "codeCells": manifest["notebook"]["code_cells"],
    "artifactWrites": len(artifact_events),
    "patterns": len(patterns),
    "timestampsAvailable": False,
    "timestampNote": "The notebook outputs, build log and smoke log do not carry reliable per-event timestamps. Sequence is preserved by cell and line number; no timestamps are invented.",
    "sources": [
        {"id": "notebook", "label": "Notebook outputs", "path": "data/notebook.json", "events": sum(1 for e in events if e["source"] == "notebook")},
        {"id": "warning-register", "label": "Warning register", "path": "data/manifest.json", "events": sum(1 for e in events if e["source"] == "warning-register")},
        {"id": "build", "label": "Build log", "path": "logs/build.log", "events": sum(1 for e in events if e["source"] == "build")},
        {"id": "ui", "label": "UI smoke log", "path": "logs/ui_smoke.log", "events": sum(1 for e in events if e["source"] == "ui")},
    ],
}

# Curated warning families. Counts use the warning register so the same event
# captured in both the notebook output and the register is not double counted.
register_exports = [w for w in manifest.get("warnings", []) if (w.get("category") or "").lower() == "export"]
register_dependencies = [w for w in manifest.get("warnings", []) if (w.get("category") or "").lower() == "dependency"]
register_shap = [w for w in manifest.get("warnings", []) if (w.get("category") or "").lower() == "explainability"]
export_targets = sorted({w["message"].replace("Static PNG skipped for ", "") for w in register_exports})
export_events = [event for event in events if event["category"] == "export" and event["severity"] == "warning"]
warning_families = [
    {
        "id": "WF-EXPORT",
        "label": "Static PNG exports skipped",
        "count": len(register_exports),
        "severity": "warning",
        "observations": "Kaleido could not render the Plotly figures as static PNGs. The HTML artifacts survive.",
        "evidence": [w["detail"] for w in register_exports],
        "targets": export_targets,
        "interpretation": f"{len(register_exports)} distinct HTML artifacts have no static PNG. This is an observed export limitation, not evidence that the analysis failed; no static preview is claimed for them.",
        "links": ["/artifacts?tab=interactive"],
    },
    {
        "id": "WF-DEP",
        "label": "Plotly / Kaleido version conflict",
        "count": len(register_dependencies),
        "severity": "warning",
        "observations": "Plotly 5.24.1 was recorded as incompatible with Kaleido 1.5.0.",
        "evidence": [w["detail"] for w in register_dependencies],
        "interpretation": "A likely explanation for the export skips. The notebook does not test the counterfactual, so this remains a probable cause rather than a proven one.",
        "links": ["/artifacts?tab=run"],
    },
    {
        "id": "WF-SHAP",
        "label": "SHAP background subsampled",
        "count": len(register_shap),
        "severity": "warning",
        "observations": "The SHAP background was subsampled from 200 to 100 rows.",
        "evidence": [w["detail"] for w in register_shap],
        "interpretation": "A documented explainability approximation. Do not describe the SHAP values as exact population attributions.",
        "links": ["/model"],
    },
]

log_summary["exportSkips"] = len(register_exports)
log_summary["uniqueWarningTargets"] = len({w["message"] for w in manifest.get("warnings", [])})
log_summary["rawWarningEvents"] = severity_counts.get("warning", 0)
log_summary["patternedEvents"] = pattern_events
log_summary["unpatternedEvents"] = len(events) - pattern_events

write_json("logs.json", {
    "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "summary": log_summary,
    "events": events,
    "patterns": patterns,
    "warningFamilies": warning_families,
    "severityLegend": {
        "error": "A recorded failure or traceback. The run reports zero tracebacks.",
        "warning": "A recorded warning or skipped export.",
        "notice": "A section boundary, ledger write or completion marker.",
        "info": "A normal output or measurement line.",
    },
})


# ---------------------------------------------------------------------------
# Semantic metric catalog
# ---------------------------------------------------------------------------

metrics_path = REPORTS / "metric_catalog.csv"
metric_rows = []
if metrics_path.exists():
    with metrics_path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            metric_id = (row.get("metric_id") or "").strip()
            if not metric_id:
                continue
            source_file = (row.get("source_file") or "").strip()
            table_id = table_id_for_source(source_file, tables)
            numeric = None
            raw_value = (row.get("value") or "").strip()
            try:
                numeric = float(raw_value)
                if numeric.is_integer():
                    numeric = int(numeric)
            except ValueError:
                numeric = None
            metric_rows.append({
                "id": metric_id,
                "layer": metric_id.split("-")[0] if "-" in metric_id else "OTHER",
                "metric": row.get("metric", ""),
                "value": raw_value,
                "numericValue": numeric,
                "unit": (row.get("unit") or "").strip(),
                "definition": (row.get("definition") or "").strip(),
                "formula": (row.get("formula") or "").strip(),
                "sourceFile": source_file,
                "sourceLocator": (row.get("source_locator") or "").strip(),
                "appPages": (row.get("app_pages") or "").strip(),
                "validationChecks": (row.get("validation_checks") or "").strip(),
                "confidence": (row.get("confidence") or "").strip(),
                "caveat": (row.get("caveat") or "").strip(),
                "sourceTableId": table_id,
                "sourceHref": route_for_table(table_id) if table_id else "/artifacts?tab=run",
            })

write_json("metrics.json", {
    "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "count": len(metric_rows),
    "validated": sum(1 for row in metric_rows if row["validationChecks"]),
    "layers": dict(Counter(row["layer"] for row in metric_rows)),
    "items": metric_rows,
})


# ---------------------------------------------------------------------------
# Deterministic insight pool
# ---------------------------------------------------------------------------

insights: list[dict] = []


def add_insight(**payload: Any) -> None:
    insights.append(payload)


classBalance = {row["split"]: row for row in analysis["class_balance"]}
full = next(row for row in analysis["ablation"] if row["model"] == "FULL (all features)")
minus_card = next(row for row in analysis["ablation"] if row["model"] == "MINUS card_prior_fraud")
raw_only = next(row for row in analysis["ablation"] if row["model"] == "MINUS all history (raw-only)")
wf = analysis["wf_vs_test"][0]
capture_1 = next(row for row in analysis["capture"] if row["top_pct"] == 1.0)
capture_5 = next(row for row in analysis["capture"] if row["top_pct"] == 5.0)
psi_severe = [row for row in analysis["psi"] if row["verdict"] == "severe"]
psi_moderate = [row for row in analysis["psi"] if row["verdict"] == "moderate"]
psi_stable = [row for row in analysis["psi"] if row["verdict"] == "stable"]
learning_peak = max(analysis["learning"], key=lambda row: row["pr_auc"])
learning_full = next(row for row in analysis["learning"] if row["frac"] == 1.0)
calibration = analysis["calibration_temp"][0]
effect_amt = next(row for row in analysis["effect_sizes"] if row["feature"] == "amt")
weak_findings = [finding for finding in findings if finding["grade"] == "weak"]
high_issues = [issue for issue in issues if issue["severity"] == "High"]
audit_notes = notes
warning_summary = log_summary

add_insight(
    id="INS-001", scope="evidence", phase=None, rq=None, priority=1, kind="finding",
    title="The evidence base is graded, and the strong tier carries the argument",
    statement=f"{counts['strong']} of {counts['findings']} findings are graded strong; {counts['supports']} support, {counts['caveats']} are caveats and {counts['weak']} is weak.",
    detail=f"There are also {len(audit_notes)} independent audit notes and {len(high_issues)} high-severity workspace issues. The ledger is the primary index; grades are researcher-assigned, not externally audited.",
    metrics=[
        {"label": "Strong findings", "value": counts["strong"], "format": "integer", "source": "logs/findings_ledger.json"},
        {"label": "Findings with caveat", "value": counts["caveats"], "format": "integer", "source": "logs/findings_ledger.json"},
        {"label": "High-severity issues", "value": len(high_issues), "format": "integer", "source": "manifest issues"},
    ],
    link="/findings?grade=strong", sourceRefs=["logs/findings_ledger.json", "reports/validation_report.md"],
    confidence="verified", caveat="Grade definitions are operational and documented on the findings page.",
)

add_insight(
    id="INS-002", scope="model", phase="P7", rq="RQ8", priority=1, kind="risk",
    title="Cross-boundary transfer is the binding model risk",
    statement=f"The final 27-feature model reaches PR-AUC {full['pr_auc']:.4f} on the held-out test split, while the same walk-forward design averages {wf['mean_val_pr_auc']:.4f} in-domain.",
    detail=f"Across four time-ordered folds, in-domain PR-AUC is {wf['mean_val_pr_auc']:.4f} ± {wf['sd_val_pr_auc']:.4f}; the same models score {wf['mean_test_pr_auc_from_folds']:.4f} ± {wf['sd_test_pr_auc_from_folds']:.4f} across the boundary. Mean gap: {wf['mean_ood_gap']:.4f}.",
    metrics=[
        {"label": "Test PR-AUC", "value": full["pr_auc"], "format": "decimal4", "source": "phase8_ablation_decomposed.csv"},
        {"label": "Walk-forward PR-AUC", "value": wf["mean_val_pr_auc"], "format": "decimal4", "source": "phase8_wf_vs_test.csv"},
        {"label": "OOD gap", "value": wf["mean_ood_gap"], "format": "decimal4", "source": "phase8_wf_vs_test.csv"},
    ],
    link="/model", sourceRefs=["tables/phase8_ablation_decomposed.csv", "tables/phase8_wf_vs_test.csv"],
    confidence="verified", caveat="The test split is a temporal holdout, not a random sample from the same distribution.",
)

add_insight(
    id="INS-003", scope="model", phase="P7", rq="RQ8", priority=1, kind="finding",
    title="Card history both drives ranking and explains the transfer failure",
    statement=f"Removing card_prior_fraud raises test PR-AUC from {full['pr_auc']:.4f} to {minus_card['pr_auc']:.4f}; the raw-only model reaches {raw_only['pr_auc']:.4f}.",
    detail=f"The ablation localises the largest change to cumulative card history. The direction is counter-intuitive but internally consistent: the full model's strongest in-domain signal is also the least portable across the time boundary.",
    metrics=[
        {"label": "Full model", "value": full["pr_auc"], "format": "decimal4", "source": "phase8_ablation_decomposed.csv"},
        {"label": "Minus card prior", "value": minus_card["pr_auc"], "format": "decimal4", "source": "phase8_ablation_decomposed.csv"},
        {"label": "Raw only", "value": raw_only["pr_auc"], "format": "decimal4", "source": "phase8_ablation_decomposed.csv"},
    ],
    link="/model", sourceRefs=["tables/phase8_ablation_decomposed.csv"],
    confidence="verified", caveat="Ablation variants are not independent experiments; they share training rows and the same test split.",
)

add_insight(
    id="INS-004", scope="economics", phase="P7", rq="RQ8", priority=1, kind="finding",
    title="A 1% review budget captures about two-thirds of fraud events and dollars",
    statement=f"Reviewing the top {capture_1['top_pct']:.1f}% of test transactions ({capture_1['k']:,} reviews) captures {capture_1['recall']*100:.2f}% of fraud events and {capture_1['usd_share']*100:.2f}% of fraud dollars.",
    detail=f"Precision at that operating point is {capture_1['precision']*100:.2f}%; dollar yield is ${capture_1['usd_per_review']:.2f} per review. A 5% budget raises recall to {capture_5['recall']*100:.2f}% and dollar capture to {capture_5['usd_share']*100:.2f}% but requires {capture_5['k']:,} reviews.",
    metrics=[
        {"label": "Reviews at 1%", "value": capture_1["k"], "format": "integer", "source": "phase8_capture_at_k.csv"},
        {"label": "Recall at 1%", "value": capture_1["recall"], "format": "percent2", "source": "phase8_capture_at_k.csv"},
        {"label": "USD capture at 1%", "value": capture_1["usd_share"], "format": "percent2", "source": "phase8_capture_at_k.csv"},
    ],
    link="/economics", sourceRefs=["tables/phase8_capture_at_k.csv"],
    confidence="verified", caveat="Capture is measured on the held-out test split and depends on the stored score ranking.",
)

add_insight(
    id="INS-005", scope="drift", phase="P7", rq="RQ8", priority=2, kind="risk",
    title="Calendar encodings drift hardest across the time boundary",
    statement=f"{len(psi_severe)} of {len(analysis['psi'])} features have severe PSI (≥ {PSI_SEVERE}); {len(psi_moderate)} {'is' if len(psi_moderate) == 1 else 'are'} moderate and {len(psi_stable)} {'is' if len(psi_stable) == 1 else 'are'} stable.",
    detail=f"The largest PSI is {analysis['psi'][0]['feature']} at {analysis['psi'][0]['psi']:.3f}, followed by {analysis['psi'][1]['feature']} at {analysis['psi'][1]['psi']:.3f}. Month and cyclical encodings dominate because the test window covers months unseen in training.",
    metrics=[
        {"label": "Severe PSI", "value": len(psi_severe), "format": "integer", "source": "phase8_psi.csv"},
        {"label": "Top PSI", "value": analysis["psi"][0]["psi"], "format": "decimal3", "source": "phase8_psi.csv"},
        {"label": "Moderate PSI", "value": len(psi_moderate), "format": "integer", "source": "phase8_psi.csv"},
    ],
    link="/model", sourceRefs=["tables/phase8_psi.csv"],
    confidence="verified", caveat="PSI thresholds are conventions, not statistical tests; high PSI identifies distribution shift, not a broken feature.",
)

add_insight(
    id="INS-006", scope="features", phase="P2", rq="RQ2", priority=2, kind="finding",
    title="Amount separates fraud strongly, but the distributions still overlap",
    statement=f"Fraud amounts have a median of ${effect_amt['med_fraud']:.2f} versus ${effect_amt['med_nonfraud']:.2f} for genuine transactions (Cliff's delta {effect_amt['cliffs_delta']:.3f}).",
    detail=f"KS D is {effect_amt['ks_D']:.3f} with a bootstrap interval of {effect_amt['cliffs_lo']:.3f}–{effect_amt['cliffs_hi']:.3f} for Cliff's delta. The effect is large, but the overlap means amount alone cannot be a decision rule.",
    metrics=[
        {"label": "Median fraud", "value": effect_amt["med_fraud"], "format": "money", "source": "phase5_mw_effect_sizes.csv"},
        {"label": "Cliff's delta", "value": effect_amt["cliffs_delta"], "format": "decimal3", "source": "phase5_mw_effect_sizes.csv"},
        {"label": "KS D", "value": effect_amt["ks_D"], "format": "decimal3", "source": "phase5_mw_effect_sizes.csv"},
    ],
    link="/statistics", sourceRefs=["tables/phase5_mw_effect_sizes.csv"],
    confidence="verified", caveat="Cliff's delta is a rank effect size; it does not establish a causal amount effect.",
)

add_insight(
    id="INS-007", scope="data", phase="P0", rq="RQ1", priority=2, kind="risk",
    title="The split is temporal, and the fraud rate drops at the boundary",
    statement=f"Train fraud rate is {classBalance['train']['fraud_rate']*100:.3f}%; test is {classBalance['test']['fraud_rate']*100:.3f}% — a drop of {(classBalance['train']['fraud_rate']-classBalance['test']['fraud_rate'])*100:.3f} percentage points.",
    detail=f"Train and test are separated by 48 seconds on 21 June 2020. Any random-split metric would answer a different question and should not be compared to these results.",
    metrics=[
        {"label": "Train rate", "value": classBalance["train"]["fraud_rate"], "format": "percent3", "source": "phase0_class_balance.csv"},
        {"label": "Test rate", "value": classBalance["test"]["fraud_rate"], "format": "percent3", "source": "phase0_class_balance.csv"},
        {"label": "Train rows", "value": classBalance["train"]["n"], "format": "integer", "source": "phase0_class_balance.csv"},
    ],
    link="/data-audit", sourceRefs=["tables/phase0_class_balance.csv"],
    confidence="verified", caveat="The boundary is documented; the 48-second gap is not a causal treatment.",
)

add_insight(
    id="INS-008", scope="data", phase="P0", rq="RQ1", priority=2, kind="risk",
    title="Structural missingness is concentrated in history features",
    statement=f"{len(manifest['dataQuality']['missing'])} columns are incomplete; the maximum is {max(row['missingPct'] for row in manifest['dataQuality']['missing'])*100:.2f}% for amt_z_prior and amt_z_prior_log.",
    detail="The missing values are first-transaction history fields. They are not random missingness and were not imputed in the dashboard; any feature using them inherits the boundary.",
    metrics=[
        {"label": "Incomplete columns", "value": len(manifest["dataQuality"]["missing"]), "format": "integer", "source": "phase0_schema.csv"},
        {"label": "Max missing", "value": max(row["missingPct"] for row in manifest["dataQuality"]["missing"]), "format": "percent2", "source": "phase0_schema.csv"},
        {"label": "Analytical columns", "value": len(analysis["schema"]) - 1, "format": "integer", "source": "phase0_schema.csv"},
    ],
    link="/data-audit", sourceRefs=["tables/phase0_schema.csv"],
    confidence="verified", caveat="A zero in the dashboard means no recorded value, not a measured zero.",
)

add_insight(
    id="INS-009", scope="evidence", phase="P7", rq="RQ8", priority=2, kind="finding",
    title="The learning curve is non-monotonic, so more training rows did not help",
    statement=f"Test PR-AUC peaks at {learning_peak['pr_auc']:.4f} with {learning_peak['n_train']:,} training rows (fraction {learning_peak['frac']:.2f}) and falls to {learning_full['pr_auc']:.4f} on the full training set.",
    detail="The drop is consistent with a distribution shift: additional training-period rows do not make the test-period distribution more similar. It is not evidence that the model is unstable in the usual sense.",
    metrics=[
        {"label": "Peak PR-AUC", "value": learning_peak["pr_auc"], "format": "decimal4", "source": "phase8_learning_curve.csv"},
        {"label": "Full-data PR-AUC", "value": learning_full["pr_auc"], "format": "decimal4", "source": "phase8_learning_curve.csv"},
        {"label": "Peak fraction", "value": learning_peak["frac"], "format": "decimal2", "source": "phase8_learning_curve.csv"},
    ],
    link="/model", sourceRefs=["tables/phase8_learning_curve.csv"],
    confidence="verified", caveat="The learning curve is single-seed and uses one test split; it is not a learning-theory estimate.",
)

add_insight(
    id="INS-010", scope="economics", phase="P7", rq="RQ8", priority=2, kind="risk",
    title="The cost-minimising threshold is fragile to the false-positive charge",
    statement=f"Across false-positive costs from ${analysis['cost'][0]['fp_cost']:.0f} to ${analysis['cost'][-1]['fp_cost']:.0f}, the optimal threshold moves from {analysis['cost'][0]['optimal_threshold']:.2e} to {analysis['cost'][-1]['optimal_threshold']:.2e} and recall falls from {analysis['cost'][0]['recall']*100:.1f}% to {analysis['cost'][-1]['recall']*100:.1f}%.",
    detail="The threshold is not a stable operating constant. It should be re-derived for the review team's actual cost and capacity; the dashboard exposes the input.",
    metrics=[
        {"label": "Recall at $1 FP", "value": analysis["cost"][0]["recall"], "format": "percent1", "source": "phase8_cost_sensitivity.csv"},
        {"label": "Recall at $50 FP", "value": analysis["cost"][-1]["recall"], "format": "percent1", "source": "phase8_cost_sensitivity.csv"},
        {"label": "Threshold ratio", "value": analysis["cost"][-1]["optimal_threshold"] / analysis["cost"][0]["optimal_threshold"], "format": "decimal1", "source": "phase8_cost_sensitivity.csv"},
    ],
    link="/economics", sourceRefs=["tables/phase8_cost_sensitivity.csv"],
    confidence="verified", caveat="Cost-minimisation assumes the stated FP charge and full fraud loss; neither is a production estimate.",
)

add_insight(
    id="INS-011", scope="model", phase="P7", rq="RQ8", priority=3, kind="risk",
    title="Probability calibration is already accurate at this prevalence",
    statement=f"Temperature scaling fits T = {calibration['T']:.3f}; expected calibration error changes from {calibration['ece_before']:.6f} to {calibration['ece_after']:.6f}.",
    detail="The absolute errors are tiny because the simulator is smooth and the test prevalence is low. Calibration is not the binding problem; ranking and transfer are.",
    metrics=[
        {"label": "Temperature", "value": calibration["T"], "format": "decimal3", "source": "phase8_calibration_temp.csv"},
        {"label": "ECE before", "value": calibration["ece_before"], "format": "decimal6", "source": "phase8_calibration_temp.csv"},
        {"label": "ECE after", "value": calibration["ece_after"], "format": "decimal6", "source": "phase8_calibration_temp.csv"},
    ],
    link="/model", sourceRefs=["tables/phase8_calibration_temp.csv"],
    confidence="verified", caveat="ECE is computed on a calibration split; it does not guarantee calibration under a different prevalence.",
)

add_insight(
    id="INS-012", scope="logs", phase=None, rq=None, priority=3, kind="observation",
    title="The run completed without tracebacks but with seven skipped static exports",
    statement=f"The notebook reports {warning_summary['errorCount']} error events and {warning_summary['tracebacks']} tracebacks; {len(register_exports)} static PNG exports were skipped.",
    detail="The skipped exports are an operational limitation, not an analytical failure. The interactive HTML artifacts survive and are linked from the gallery. No timestamps are available for these events.",
    metrics=[
        {"label": "Tracebacks", "value": warning_summary["tracebacks"], "format": "integer", "source": "notebook execution counts"},
        {"label": "Skipped exports", "value": len(register_exports), "format": "integer", "source": "notebook warnings"},
        {"label": "Cells with output", "value": warning_summary["cellsWithOutput"], "format": "integer", "source": "data/notebook.json"},
    ],
    link="/logs", sourceRefs=["logs/findings.md", "data/notebook.json"],
    confidence="verified", caveat="Warnings are not failures; the run still reports zero tracebacks.",
)

add_insight(
    id="INS-013", scope="evidence", phase="P6", rq="RQ8", priority=3, kind="risk",
    title="One leakage claim is contradicted by its own recorded numbers",
    statement="Audit note AN-01 reports that the naive and causal target-encoding correlations are both 0.048 at the displayed precision, so the notebook does not demonstrate the claimed inflation.",
    detail="The causal encoding remains good practice, but the specific leakage-demo claim should not be cited as evidence that the naive encoding inflated this dataset's signal.",
    metrics=[
        {"label": "Naive correlation", "value": 0.048, "format": "decimal3", "source": "notebook cell 52 output"},
        {"label": "Causal correlation", "value": 0.048, "format": "decimal3", "source": "notebook cell 52 output"},
        {"label": "Audit status", "value": "contradicted", "format": "text", "source": "manifest audit note AN-01"},
    ],
    link="/findings?note=AN-01", sourceRefs=["logs/findings_ledger.json", "notebook cell 52"],
    confidence="verified", caveat="Equality at three decimals does not prove the encodings are identical; it only shows the displayed evidence does not support inflation.",
)

weak_titles = "; ".join(f"{f['id']} · {f['finding']}" for f in weak_findings) or "None"
add_insight(
    id="INS-014", scope="evidence", phase="P3", rq="RQ3", priority=3, kind="observation",
    title="One finding remains in the weak tier and should not anchor a decision",
    statement=f"The ledger contains {len(weak_findings)} weak finding: {weak_titles}.",
    detail="The weak grade is not a contradiction; it marks a claim whose evidence is insufficient for confident reuse. The structural-break finding is the only member of this tier.",
    metrics=[
        {"label": "Weak findings", "value": len(weak_findings), "format": "integer", "source": "logs/findings_ledger.json"},
        {"label": "Caveat findings", "value": counts["caveats"], "format": "integer", "source": "logs/findings_ledger.json"},
        {"label": "Audit notes", "value": len(audit_notes), "format": "integer", "source": "manifest audit notes"},
    ],
    link="/findings?grade=weak", sourceRefs=["logs/findings_ledger.json"],
    confidence="bounded", caveat="Grade assignment is researcher-assigned; the dashboard does not re-grade the evidence.",
)

add_insight(
    id="INS-015", scope="temporal", phase="P3", rq="RQ3", priority=3, kind="observation",
    title="The final weekly bin is an edge case, not a fraud collapse",
    statement="The final recorded week (2021-01-03) shows 0 fraud events across 18,921 transactions, while the weekly median is around 0.507%.",
    detail="The last bin covers a partial boundary and is retained only because the notebook records it. It should be excluded from trend interpretation rather than read as a real decline.",
    metrics=[
        {"label": "Final week rate", "value": 0.0, "format": "percent2", "source": "phase3_weekly_rate_table.csv"},
        {"label": "Final week rows", "value": 18921, "format": "integer", "source": "phase3_weekly_rate_table.csv"},
        {"label": "Median weekly rate", "value": statistics.median([row["rate"] for row in analysis["weekly_series"]]), "format": "percent3", "source": "phase3_weekly_rate_table.csv"},
    ],
    link="/temporal", sourceRefs=["tables/phase3_weekly_rate_table.csv"],
    confidence="verified", caveat="The zero is a recorded count for the final bin; it is not evidence of zero fraud risk going forward.",
)

write_json("insights.json", {
    "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "count": len(insights),
    "items": insights,
    "scopes": sorted({insight["scope"] for insight in insights}),
})


# ---------------------------------------------------------------------------
# Anomaly register: explicit methods, references and thresholds
# ---------------------------------------------------------------------------

weekly = analysis["weekly_series"]
rates = [row["rate"] for row in weekly]
median_rate, mad, scale = median_abs_deviation(rates)
weekly_anomalies = []
for row in weekly:
    z = (row["rate"] - median_rate) / scale if scale else 0
    if abs(z) >= WEEKLY_Z_THRESHOLD:
        weekly_anomalies.append({
            "id": f"ANOM-W-{len(weekly_anomalies)+1:02d}",
            "series": "Weekly fraud rate",
            "label": row["ts"],
            "value": row["rate"],
            "format": "percent3",
            "reference": f"105 complete ISO weeks; median {median_rate*100:.3f}%, MAD {mad*100:.3f} pp",
            "method": "Robust z-score using median and 1.4826 × MAD",
            "threshold": f"|z| ≥ {WEEKLY_Z_THRESHOLD}",
            "zScore": z,
            "denominator": row["size"],
            "events": row["sum"],
            "severity": "moderate" if abs(z) < 4.5 else "high",
            "interpretation": f"{row['sum']:,} fraud events in {row['size']:,} transactions. The week is unusual relative to the other 104 weeks, but this is a descriptive flag, not proof of a defect or a causal change.",
            "notAProof": "A single weekly rate is sensitive to small event counts and campaign timing. No significance test or causal claim is attached.",
            "source": "tables/phase3_weekly_rate_table.csv",
            "link": "/temporal",
        })

edge_cases = []
for row in weekly:
    z = (row["rate"] - median_rate) / scale if scale else 0
    if row["sum"] == 0:
        edge_cases.append({
            "id": f"EDGE-W-{len(edge_cases)+1:02d}",
            "label": row["ts"],
            "value": row["rate"],
            "zScore": z,
            "reason": "Zero fraud events in a boundary week. Retained in the source table; not flagged as a statistical anomaly because the zero is an edge case with 18,921 transactions and the notes already document the partial-week boundary.",
            "source": "tables/phase3_weekly_rate_table.csv",
        })

psi_anomalies = []
for row in sorted(analysis["psi"], key=lambda item: -item["psi"]):
    if row["verdict"] not in {"severe", "moderate"}:
        continue
    psi_anomalies.append({
        "id": f"ANOM-P-{len(psi_anomalies)+1:02d}",
        "series": "Train→test feature drift",
        "label": row["feature"],
        "value": row["psi"],
        "format": "decimal3",
        "reference": f"PSI across {row['n_train']:,} train and {row['n_test']:,} test rows",
        "method": "Population Stability Index on binned feature distributions",
        "threshold": f"severe ≥ {PSI_SEVERE}; moderate ≥ {PSI_MODERATE}",
        "severity": "high" if row["verdict"] == "severe" else "moderate",
        "interpretation": f"{row['feature']} ({row['family']}) has {row['verdict']} drift; the largest contributor is the bin {row['top_driver_bin']}.",
        "notAProof": "PSI measures distribution change, not performance loss. A drifted feature can remain useful and a stable feature can still fail.",
        "source": "tables/phase8_psi.csv",
        "link": "/model",
    })

write_json("anomalies.json", {
    "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "summary": {
        "weeklyFlagged": len(weekly_anomalies),
        "weeklyReference": len(weekly),
        "psiSevere": len([row for row in analysis["psi"] if row["verdict"] == "severe"]),
        "psiModerate": len([row for row in analysis["psi"] if row["verdict"] == "moderate"]),
        "exportWarnings": len(register_exports),
        "edgeCases": len(edge_cases),
    },
    "weekly": weekly_anomalies,
    "drift": psi_anomalies,
    "edgeCases": edge_cases,
    "exportExceptions": [
        {
            "id": "ANOM-X-01",
            "series": "Static export pipeline",
            "label": "Plotly → PNG exports",
            "value": len(register_exports),
            "format": "integer",
            "reference": "7 skipped static exports recorded in the warning register",
            "method": "Deterministic warning-register count",
            "threshold": "Any recorded skip",
            "severity": "moderate",
            "interpretation": "Seven static PNG renders were skipped; the HTML artifacts remain available. This is an operational exception, not a modelling defect.",
            "notAProof": "The notebook does not test whether a different Kaleido version would have rendered every artifact.",
            "source": "data/manifest.json warnings",
            "link": "/logs",
        }
    ],
    "methodNotes": [
        "Weekly anomaly detection uses a robust z-score (median/MAD) because the series has outliers and no stable parametric assumption.",
        "Drift flags use the documented PSI convention already recorded by the notebook. They are not re-derived or re-thresholded.",
        "No anomaly detector is applied to model metrics, runtimes or datasets where the sample is too small or the series is a designed experiment. The absence is intentional.",
    ],
})


# ---------------------------------------------------------------------------
# Evidence lineage graph
# ---------------------------------------------------------------------------

nodes: list[dict] = []
links: list[dict] = []


def add_node(node_id: str, label: str, node_type: str, **kwargs: Any) -> None:
    nodes.append({"id": node_id, "label": label, "type": node_type, **kwargs})


def add_link(source: str, target: str, relation: str, verified: bool = True, **kwargs: Any) -> None:
    links.append({"source": source, "target": target, "relation": relation, "verified": verified, **kwargs})


add_node("run", manifest["run"]["id"], "run", phase="RUN", route="/artifacts?tab=run",
         meta={"label": manifest["run"]["label"], "duration": manifest["run"]["durationSeconds"], "seed": manifest["run"]["seed"]})
add_node("notebook", "EDA notebook", "notebook", phase="RUN", route="/artifacts?tab=notebook",
         meta={"cells": manifest["notebook"]["total_cells"], "codeCells": manifest["notebook"]["code_cells"]})
for source in manifest["sources"]:
    node_id = f"src:{source['name']}"
    add_node(node_id, source["name"], "source", phase="SOURCE", absent=not source["present"],
             route="/artifacts?tab=run", meta={"role": source["role"], "bytes": source["bytes"], "present": source["present"], "hash": source["hash"]})
    add_link(node_id, "run", "consumed by", verified=True)
add_link("run", "notebook", "executed", verified=True)

phase_node = {}
for phase in phases:
    node_id = f"phase:{phase['id']}"
    phase_node[phase["id"]] = node_id
    add_node(node_id, f"{phase['id']} · {phase['short_name']}", "phase", phase=phase["id"],
             route=PHASE_ROUTES.get(phase["id"], "/"),
             meta={"name": phase["name"], "cells": f"{phase['cell_start']}–{phase['cell_end']}", "methods": len(phase["methods"]), "artifacts": phase["artifactCount"]})
    add_link("notebook", node_id, "contains", verified=True)

rq_node = {}
for rq in rqs:
    node_id = f"rq:{rq['id']}"
    rq_node[rq["id"]] = node_id
    add_node(node_id, rq["id"], "rq", phase="RQ", route=f"/findings?rq={rq['id']}",
             meta={"question": rq["question"], "findings": rq["findings"], "strong": rq["strong"]})
    for phase_id in rq["phases"]:
        if phase_id in phase_node:
            add_link(phase_node[phase_id], node_id, "answers", verified=True)

for finding in findings:
    node_id = f"finding:{finding['id']}"
    add_node(node_id, finding["id"], "finding", phase=finding["phase"], grade=finding["grade"],
             route=f"/findings?finding={finding['id']}",
             meta={"title": finding["finding"], "rq": finding["rq"], "cellRange": finding["cellRange"], "source": finding["sourceFile"]})
    add_link(phase_node.get(finding["phase"], "notebook"), node_id, "produces", verified=True)
    if finding["rq"] in rq_node:
        add_link(rq_node[finding["rq"]], node_id, "supported by", verified=True)
    if finding.get("auditNoteId"):
        add_link(f"note:{finding['auditNoteId']}", node_id, "annotates", verified=True)

for note in notes:
    node_id = f"note:{note['id']}"
    add_node(node_id, note["id"], "audit", phase=note["phase"], route=f"/findings?note={note['id']}",
             meta={"title": note["title"], "status": note["status"], "observation": note["observation"]})
    add_link(phase_node.get(note["phase"], "notebook"), node_id, "documents", verified=True)

for issue in issues:
    node_id = f"issue:{issue['id']}"
    add_node(node_id, issue["id"], "issue", phase=issue["phase"], severity=issue["severity"],
             route="/artifacts?tab=run",
             meta={"title": issue["title"], "status": issue["status"], "scope": issue["scope"], "category": issue["category"]})
    add_link(phase_node.get(issue["phase"], "notebook"), node_id, "diagnosed in", verified=True)

for artifact in artifact_rows:
    node_id = artifact.get("lineageNodeId") or f"artifact:{artifact['id']}"
    add_node(node_id, artifact["id"], artifact["kind"], phase=artifact["phase"],
             route=artifact["href"], provenance=artifact["provenance"],
             meta={"title": artifact["title"], "cell": artifact["cell"], "bytes": artifact["bytes"], "group": artifact["group"]})
    phase_id = phase_node.get(artifact["phase"])
    if phase_id:
        add_link(phase_id, node_id, "produces", verified=artifact["provenance"] == "verified")

write_json("lineage.json", {
    "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "counts": {
        "nodes": len(nodes),
        "links": len(links),
        "verifiedLinks": sum(1 for link in links if link["verified"]),
        "inferredLinks": sum(1 for link in links if not link["verified"]),
        "nodeTypes": dict(Counter(node["type"] for node in nodes)),
    },
    "nodes": nodes,
    "links": links,
    "notes": [
        "Verified edges are recorded in the ledger, notebook cell ranges, warning register or artifact write lines.",
        "Inferred edges connect a phase to an artifact when no producing cell could be located; they are dashed in the interface.",
        "No edge is drawn solely because two files share a directory.",
    ],
})

print("phase 2 evidence layer complete.")
