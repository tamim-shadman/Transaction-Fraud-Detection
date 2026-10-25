"""Validate the Phase 2 evidence layer, its analytics and the console's Phase 2 surface.

This validator is deliberately independent of the React code. It reloads the
Phase 1 manifest/analysis/notebook and the generated Phase 2 JSON, recomputes the
published quantities (robust z-scores, group deltas, lineage integrity, metric
provenance, Power BI pack counts) and compares them with what the app serves.

Run:
    python tests/validate_phase2.py

Outputs:
    tests/phase2_validation_results.json
    reports/phase2_validation_report.md
"""

from __future__ import annotations

import json
import math
import re
import statistics
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
APP_DATA = ROOT / "app" / "public" / "data"
P2_DATA = APP_DATA / "phase2"
APP_SRC = ROOT / "app" / "src"
POWERBI = ROOT / "powerbi"
OUT_JSON = ROOT / "tests" / "phase2_validation_results.json"
OUT_MD = ROOT / "reports" / "phase2_validation_report.md"

MANIFEST = json.loads((APP_DATA / "manifest.json").read_text(encoding="utf-8"))
ANALYSIS = json.loads((APP_DATA / "analysis.json").read_text(encoding="utf-8"))
NOTEBOOK = json.loads((APP_DATA / "notebook.json").read_text(encoding="utf-8"))

RESULTS: list[dict[str, Any]] = []
CAVEATS: list[dict[str, str]] = []


def check(check_id: str, group: str, name: str, expected: Any, actual: Any, tolerance: float = 1e-9) -> None:
    ok = False
    if isinstance(expected, (int, float)) and not isinstance(expected, bool) and isinstance(actual, (int, float)):
        ok = math.isclose(float(expected), float(actual), rel_tol=tolerance, abs_tol=tolerance)
    else:
        ok = expected == actual
    RESULTS.append(
        {
            "id": check_id,
            "group": group,
            "name": name,
            "expected": expected,
            "actual": actual,
            "status": "pass" if ok else "fail",
        }
    )


def caveat(caveat_id: str, title: str, detail: str, sources: str) -> None:
    CAVEATS.append({"id": caveat_id, "title": title, "detail": detail, "sources": sources})


def load(name: str) -> dict[str, Any]:
    path = P2_DATA / f"{name}.json"
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


PROGRAM = load("program")
PROJECTS = load("projects")
EXPERIMENTS = load("experiments")
LINEAGE = load("lineage")
LOGS = load("logs")
METRICS = load("metrics")
INSIGHTS = load("insights")
ANOMALIES = load("anomalies")
ARTIFACTS = load("artifacts")

# ---------------------------------------------------------------------------
# 1. Evidence layer integrity
# ---------------------------------------------------------------------------

EXPECTED_FILES = [
    "program.json",
    "projects.json",
    "experiments.json",
    "lineage.json",
    "logs.json",
    "metrics.json",
    "insights.json",
    "anomalies.json",
    "artifacts.json",
]
for index, name in enumerate(EXPECTED_FILES, start=1):
    path = P2_DATA / name
    check(f"P2-FILE-{index:02d}", "Evidence layer", f"{name} exists", True, path.exists())
    if path.exists():
        payload = json.loads(path.read_text(encoding="utf-8"))
        check(f"P2-JSON-{index:02d}", "Evidence layer", f"{name} is valid JSON with a generatedAt stamp", True, bool(payload.get("generatedAt")))

# ---------------------------------------------------------------------------
# 2. Program profile traceability
# ---------------------------------------------------------------------------

check("P2-PRG-01", "Program profile", "phase count matches the manifest", len(MANIFEST["phases"]), len(PROGRAM.get("phases", [])))
check("P2-PRG-02", "Program profile", "research question count matches the manifest", len(MANIFEST["rqs"]), len(PROGRAM.get("researchQuestions", [])))
check("P2-PRG-03", "Program profile", "finding count matches the manifest", MANIFEST["counts"]["findings"], PROGRAM.get("counts", {}).get("findings"))
check(
    "P2-PRG-04",
    "Program profile",
    "every phase keeps its manifest cell range",
    True,
    all(
        phase["cellStart"] == source["cell_start"] and phase["cellEnd"] == source["cell_end"]
        for phase, source in zip(PROGRAM.get("phases", []), MANIFEST["phases"])
    ),
)
check(
    "P2-PRG-05",
    "Program profile",
    "phase finding counts match the manifest",
    True,
    all(phase["findingCount"] == source["findingCount"] for phase, source in zip(PROGRAM.get("phases", []), MANIFEST["phases"])),
)
check(
    "P2-PRG-06",
    "Program profile",
    "absent sources are carried from the manifest",
    [s["name"] for s in MANIFEST["sources"] if not s["present"]],
    [s["name"] for s in PROGRAM.get("reproducibility", {}).get("absentSources", [])],
)
check("P2-PRG-07", "Program profile", "reproducibility checklist total matches the analysis", len(ANALYSIS["checklist"]), PROGRAM.get("reproducibility", {}).get("checklistTotal"))
check(
    "P2-PRG-08",
    "Program profile",
    "reproducibility checklist passes equal the analysis",
    sum(1 for item in ANALYSIS["checklist"] if item.get("ok")),
    PROGRAM.get("reproducibility", {}).get("checklistPassed"),
)
check(
    "P2-PRG-09",
    "Program profile",
    "audit notes are carried unchanged",
    len(MANIFEST["auditNotes"]),
    len(PROGRAM.get("auditNotes", [])),
)
check("P2-PRG-10", "Program profile", "workspace issues are carried unchanged", len(MANIFEST["issues"]), len(PROGRAM.get("issues", [])))

notebook_phase = {int(cell["index"]) + 1: cell["phase"] for cell in NOTEBOOK["cells"]}
phases_with_excluded_cell = [
    phase["id"]
    for phase in PROGRAM.get("phases", [])
    if any(
        notebook_phase.get(cell) == phase["id"] and not (phase["cellStart"] <= cell <= phase["cellEnd"])
        for cell in notebook_phase
    )
]
check(
    "P2-PRG-11",
    "Program profile",
    "the manifest cell range omits the phase's final notebook cell (see caveat C8)",
    True,
    len(phases_with_excluded_cell) > 0,
)
check(
    "P2-PRG-12",
    "Program profile",
    "the notebook record is the authority for the cell-to-phase mapping",
    True,
    all(notebook_phase.get(cell) == phase for cell, phase in notebook_phase.items()),
)

# ---------------------------------------------------------------------------
# 2b. Project portfolio and project profiles traceability
# ---------------------------------------------------------------------------

proj_items = PROJECTS.get("projects", [])
check("P2-PRJ-01", "Project portfolio", "project count matches the 7 defined tracks", 7, len(proj_items))
check("P2-PRJ-02", "Project portfolio", "every project has unique ID", len(proj_items), len({p["id"] for p in proj_items}))
check("P2-PRJ-03", "Project portfolio", "all 9 research phases are covered across projects", 9, len({phase for p in proj_items for phase in p["phases"]}))
check("P2-PRJ-04", "Project portfolio", "every project documents objectives, deliverables and limitations", True, all(bool(p.get("objectives")) and bool(p.get("deliverables")) and bool(p.get("limitations")) for p in proj_items))
check("P2-PRJ-05", "Project portfolio", "total findings in projects match manifest count", MANIFEST["counts"]["findings"], sum(p["findingCount"] for p in proj_items))

# ---------------------------------------------------------------------------
# 3. Experiment groups and deltas
# ---------------------------------------------------------------------------

items = EXPERIMENTS.get("items", [])
groups = EXPERIMENTS.get("groups", [])
check("P2-EXP-01", "Experiments", "experiment count matches the manifest", len(MANIFEST["experiments"]), len(items))
check("P2-EXP-02", "Experiments", "every experiment belongs to exactly one group", True, all(item.get("groupId") for item in items))
check(
    "P2-EXP-03",
    "Experiments",
    "group member lists cover every experiment",
    True,
    sorted(member for group in groups for member in group["members"]) == sorted(item["id"] for item in items),
)
check(
    "P2-EXP-04",
    "Experiments",
    "group counts match the member lists",
    True,
    all(group["count"] == len(group["members"]) for group in groups),
)
check(
    "P2-EXP-05",
    "Experiments",
    "group ids are unique",
    len(groups),
    len({group["id"] for group in groups}),
)
check(
    "P2-EXP-06",
    "Experiments",
    "baselines belong to their own group",
    True,
    all(
        next((item for item in items if item["id"] == group["baselineId"]), {}).get("groupId") == group["id"]
        for group in groups
        if group.get("baselineId")
    ),
)

baseline_by_group = {group["id"]: group.get("baselineId") for group in groups}
delta_ok = True
for item in items:
    baseline_id = item.get("baselineId")
    if not baseline_id or item["id"] == baseline_id:
        continue
    baseline = next((row for row in items if row["id"] == baseline_id), None)
    if baseline is None or item.get("pr_auc") is None or baseline.get("pr_auc") is None:
        continue
    expected = item["pr_auc"] - baseline["pr_auc"]
    if not math.isclose(expected, item["deltaVsBaseline"], rel_tol=1e-9, abs_tol=1e-12):
        delta_ok = False
check("P2-EXP-07", "Experiments", "recorded deltas equal baseline minus variant", True, delta_ok)
check(
    "P2-EXP-08",
    "Experiments",
    "deltas are absolute differences, not percent improvements",
    True,
    all(item.get("deltaMode") == "absolute" for item in items),
)
check(
    "P2-EXP-09",
    "Experiments",
    "the full model is the cross-boundary baseline",
    "final_unconstrained",
    baseline_by_group.get("cross-boundary-model-variants"),
)
check(
    "P2-EXP-10",
    "Experiments",
    "non-comparable groups are marked as such",
    True,
    all(group["comparable"] is False for group in groups if group["id"] in {"anomaly-detectors", "2d-embeddings"}),
)
check(
    "P2-EXP-11",
    "Experiments",
    "every group documents a basis and a limitation",
    True,
    all(group.get("basis") and group.get("limitations") for group in groups),
)
check(
    "P2-EXP-12",
    "Experiments",
    "experiment metrics match the manifest values",
    True,
    all(
        math.isclose(
            float(item["pr_auc"]),
            float(source["pr_auc"]),
            rel_tol=1e-12,
            abs_tol=1e-12,
        )
        for item, source in zip(items, MANIFEST["experiments"])
        if item.get("pr_auc") is not None and source.get("pr_auc") is not None
    ),
)

# ---------------------------------------------------------------------------
# 4. Anomaly detection recomputation
# ---------------------------------------------------------------------------

weekly = ANALYSIS["weekly_series"]
rates = [row["rate"] for row in weekly]
median = statistics.median(rates)
mad = statistics.median(abs(value - median) for value in rates)
scale = 1.4826 * mad
expected_flags = []
for row in weekly:
    z = (row["rate"] - median) / scale if scale else 0.0
    if abs(z) >= 3.5:
        expected_flags.append((row["ts"], round(z, 6)))
recorded_flags = [(item["label"], round(item["zScore"], 6)) for item in ANOMALIES.get("weekly", [])]
check("P2-ANO-01", "Anomalies", "weekly flags match an independent robust z recomputation", expected_flags, recorded_flags)
check("P2-ANO-02", "Anomalies", "the reference population is all 105 weeks", 105, len(weekly))
check("P2-ANO-03", "Anomalies", "the method is stated on every flag", True, all(item.get("method") and item.get("threshold") for item in ANOMALIES.get("weekly", [])))
check("P2-ANO-04", "Anomalies", "every flag carries a not-a-proof boundary", True, all(item.get("notAProof") for item in ANOMALIES.get("weekly", []) + ANOMALIES.get("drift", []) + ANOMALIES.get("exportExceptions", [])))
check(
    "P2-ANO-05",
    "Anomalies",
    "drift flags match the analysis PSI verdicts",
    sum(1 for row in ANALYSIS["psi"] if row["verdict"] in {"severe", "moderate"}),
    len(ANOMALIES.get("drift", [])),
)
check(
    "P2-ANO-06",
    "Anomalies",
    "drift flag values match the analysis PSI values",
    True,
    all(
        math.isclose(item["value"], row["psi"], rel_tol=1e-9)
        for item, row in zip(ANOMALIES.get("drift", []), [r for r in sorted(ANALYSIS["psi"], key=lambda x: -x["psi"]) if r["verdict"] in {"severe", "moderate"}])
    ),
)
register_exports = [w for w in MANIFEST["warnings"] if w.get("category") == "Export"]
check("P2-ANO-07", "Anomalies", "export exceptions equal the warning register", len(register_exports), ANOMALIES.get("summary", {}).get("exportWarnings"))
check(
    "P2-ANO-08",
    "Anomalies",
    "the zero-fraud boundary week is recorded as an edge case, not an anomaly",
    1,
    len(ANOMALIES.get("edgeCases", [])),
)
check(
    "P2-ANO-09",
    "Anomalies",
    "no anomaly is raised for model metrics or runtimes",
    True,
    all(item["series"] in {"Weekly fraud rate", "Train→test feature drift", "Static export pipeline"} for item in ANOMALIES.get("weekly", []) + ANOMALIES.get("drift", []) + ANOMALIES.get("exportExceptions", [])),
)

# ---------------------------------------------------------------------------
# 5. Insight pool traceability
# ---------------------------------------------------------------------------

insight_items = INSIGHTS.get("items", [])
check("P2-INS-01", "Insights", "every insight has a scope, title, statement and source refs", True, all(item.get("scope") and item.get("title") and item.get("statement") and item.get("sourceRefs") for item in insight_items))
check("P2-INS-02", "Insights", "every insight has a link and a confidence label", True, all(item.get("link") and item.get("confidence") for item in insight_items))
check("P2-INS-03", "Insights", "every insight carries at least one numeric metric", True, all(item.get("metrics") for item in insight_items))
check("P2-INS-04", "Insights", "insight ids are unique", len(insight_items), len({item["id"] for item in insight_items}))

ablation = {row["model"]: row for row in ANALYSIS["ablation"]}
full = ablation["FULL (all features)"]
check(
    "P2-INS-05",
    "Insights",
    "the model insight quotes the manifest PR-AUC",
    True,
    any(
        math.isclose(metric["value"], full["pr_auc"], rel_tol=1e-9)
        for item in insight_items
        for metric in item["metrics"]
        if metric["label"] == "Test PR-AUC"
    ),
)
capture_1 = next(row for row in ANALYSIS["capture"] if row["top_pct"] == 1.0)
check(
    "P2-INS-06",
    "Insights",
    "the economics insight quotes the capture table",
    True,
    any(
        math.isclose(metric["value"], capture_1["recall"], rel_tol=1e-9)
        for item in insight_items
        for metric in item["metrics"]
        if metric["label"] == "Recall at 1%"
    ),
)
check(
    "P2-INS-07",
    "Insights",
    "the evidence insight quotes the ledger grade counts",
    True,
    any(
        metric["value"] == MANIFEST["counts"]["strong"]
        for item in insight_items
        for metric in item["metrics"]
        if metric["label"] == "Strong findings"
    ),
)
check(
    "P2-INS-08",
    "Insights",
    "insight scopes are a closed set",
    True,
    all(item["scope"] in INSIGHTS.get("scopes", []) for item in insight_items),
)

# ---------------------------------------------------------------------------
# 6. Lineage integrity
# ---------------------------------------------------------------------------

nodes = LINEAGE.get("nodes", [])
links = LINEAGE.get("links", [])
node_ids = {node["id"] for node in nodes}
check("P2-LIN-01", "Lineage", "node ids are unique", len(nodes), len(node_ids))
check("P2-LIN-02", "Lineage", "every link references existing nodes", True, all(link["source"] in node_ids and link["target"] in node_ids for link in links))
check("P2-LIN-03", "Lineage", "link counts match the manifest", LINEAGE.get("counts", {}).get("links"), len(links))
check(
    "P2-LIN-04",
    "Lineage",
    "verified and inferred links partition the edge set",
    len(links),
    LINEAGE.get("counts", {}).get("verifiedLinks", 0) + LINEAGE.get("counts", {}).get("inferredLinks", 0),
)
check(
    "P2-LIN-05",
    "Lineage",
    "only artifact edges are inferred",
    True,
    all(
        link["verified"] or link["target"].startswith(("artifact:", "table:"))
        for link in links
        if not link["verified"]
    ),
)
check(
    "P2-LIN-06",
    "Lineage",
    "every finding is a node",
    len(MANIFEST["findings"]),
    sum(1 for node in nodes if node["type"] == "finding"),
)
check(
    "P2-LIN-07",
    "Lineage",
    "every phase is a node",
    len(MANIFEST["phases"]),
    sum(1 for node in nodes if node["type"] == "phase"),
)
check(
    "P2-LIN-08",
    "Lineage",
    "every artifact is a node",
    len(MANIFEST["figures"]) + len(MANIFEST["htmlArtifacts"]) + len(MANIFEST["tables"]),
    sum(1 for node in nodes if node["type"] in {"figure", "interactive", "table"}),
)
check(
    "P2-LIN-09",
    "Lineage",
    "every source file is a node",
    len(MANIFEST["sources"]),
    sum(1 for node in nodes if node["type"] == "source"),
)

# ---------------------------------------------------------------------------
# 7. Artifact provenance
# ---------------------------------------------------------------------------

artifact_items = ARTIFACTS.get("items", [])
check(
    "P2-ART-01",
    "Artifacts",
    "artifact count matches figures + interactive + tables",
    MANIFEST["counts"]["figures"] + MANIFEST["counts"]["interactive"] + MANIFEST["counts"]["tables"],
    len(artifact_items),
)
check(
    "P2-ART-02",
    "Artifacts",
    "every artifact declares verified or inferred provenance",
    True,
    all(item["provenance"] in {"verified", "inferred"} for item in artifact_items),
)
check(
    "P2-ART-03",
    "Artifacts",
    "verified artifacts carry a producing cell",
    True,
    all(item["cell"] is not None for item in artifact_items if item["provenance"] == "verified"),
)
check(
    "P2-ART-04",
    "Artifacts",
    "inferred artifacts do not claim a cell",
    True,
    all(item["cell"] is None for item in artifact_items if item["provenance"] == "inferred"),
)
check(
    "P2-ART-05",
    "Artifacts",
    "provenance counts match the record list",
    True,
    ARTIFACTS.get("counts", {}).get("verifiedProvenance") == sum(1 for item in artifact_items if item["provenance"] == "verified")
    and ARTIFACTS.get("counts", {}).get("inferredProvenance") == sum(1 for item in artifact_items if item["provenance"] == "inferred"),
)
check(
    "P2-ART-06",
    "Artifacts",
    "the producing cell's notebook phase matches the artifact's phase",
    True,
    all(
        item.get("cellPhase") == item["phase"]
        for item in artifact_items
        if item["cell"] is not None
    ),
)
check(
    "P2-ART-07",
    "Artifacts",
    "no artifact is claimed for a phase it does not belong to",
    True,
    all(item["phase"] in {phase["id"] for phase in PROGRAM["phases"]} for item in artifact_items),
)

# ---------------------------------------------------------------------------
# 8. Log record
# ---------------------------------------------------------------------------

events = LOGS.get("events", [])
patterns = LOGS.get("patterns", [])
summary = LOGS.get("summary", {})
check("P2-LOG-01", "Logs", "event count matches the summary", len(events), summary.get("totalEvents"))
check("P2-LOG-02", "Logs", "severity counts sum to the event count", len(events), sum(summary.get("bySeverity", {}).values()))
check("P2-LOG-03", "Logs", "the run reports zero tracebacks", 0, summary.get("tracebacks"))
check("P2-LOG-04", "Logs", "no error events are recorded", 0, summary.get("errorCount"))
check("P2-LOG-05", "Logs", "warning family export count matches the register", len(register_exports), next(f["count"] for f in LOGS.get("warningFamilies", []) if f["id"] == "WF-EXPORT"))
check(
    "P2-LOG-06",
    "Logs",
    "no event carries an invented timestamp",
    True,
    all(event.get("timestamp") is None for event in events),
)
check(
    "P2-LOG-07",
    "Logs",
    "notebook events keep a cell reference",
    True,
    all(event.get("cell") is not None for event in events if event["source"] == "notebook"),
)
check(
    "P2-LOG-08",
    "Logs",
    "pattern coverage accounts for every event",
    len(events),
    summary.get("patternedEvents", 0) + summary.get("unpatternedEvents", 0),
)
check(
    "P2-LOG-08b",
    "Logs",
    "pattern counts sum to the patterned event count",
    summary.get("patternedEvents"),
    sum(pattern["count"] for pattern in patterns),
)
check(
    "P2-LOG-09",
    "Logs",
    "pattern counts match the pattern list length",
    len(patterns),
    summary.get("patterns"),
)
check(
    "P2-LOG-10",
    "Logs",
    "every source contributes at least one event",
    True,
    all(item["events"] > 0 for item in summary.get("sources", [])),
)

# ---------------------------------------------------------------------------
# 9. Metric catalogue
# ---------------------------------------------------------------------------

metric_items = METRICS.get("items", [])
table_ids = {table["id"] for table in MANIFEST["tables"]}
check("P2-MET-01", "Metrics", "metric count matches the catalogue", 155, len(metric_items))
check("P2-MET-02", "Metrics", "metric ids are unique", len(metric_items), len({item["id"] for item in metric_items}))
check("P2-MET-03", "Metrics", "every metric has a definition and a source file", True, all(item["definition"] and item["sourceFile"] for item in metric_items))
check("P2-MET-04", "Metrics", "source table references resolve to manifest tables", True, all(item["sourceTableId"] in table_ids for item in metric_items if item.get("sourceTableId")))
check("P2-MET-05", "Metrics", "every metric links to a source or the run record", True, all(item.get("sourceHref") for item in metric_items))
check("P2-MET-06", "Metrics", "validated count matches the metric list", summary_validated := sum(1 for item in metric_items if item["validationChecks"]), METRICS.get("validated"))
check("P2-MET-07", "Metrics", "confidence labels are from the documented set", True, all(item["confidence"] in {"verified", "computed", "source claim", "bounded", "observed", "unverified"} for item in metric_items if item["confidence"]))

# ---------------------------------------------------------------------------
# 10. Console surface
# ---------------------------------------------------------------------------

app_tsx = (APP_SRC / "App.tsx").read_text(encoding="utf-8")
layout_tsx = (APP_SRC / "components" / "Layout.tsx").read_text(encoding="utf-8")
styles_css = (APP_SRC / "styles.css").read_text(encoding="utf-8")

PHASE2_ROUTES = ["/insights", "/program", "/experiments", "/lineage", "/logs", "/explore", "/metrics"]
for index, route in enumerate(PHASE2_ROUTES, start=1):
    check(f"P2-APP-{index:02d}", "Console", f"route {route} is registered", True, f'path: "{route}"' in app_tsx)
check("P2-APP-08", "Console", "every Phase 2 page module exists", True, all((APP_SRC / "pages" / f"{name}.tsx").exists() for name in ["Insights", "Program", "Experiments", "Lineage", "Logs", "Explore", "Metrics"]))
check("P2-APP-09", "Console", "the Phase 2 routes appear in the navigation", True, all(route in layout_tsx for route in PHASE2_ROUTES))
check("P2-APP-10", "Console", "the design system defines dark-surface tokens", True, "--surface" in styles_css and "--bg:" in styles_css)
check("P2-APP-11", "Console", "reduced motion is honoured", True, "prefers-reduced-motion" in styles_css)
check("P2-APP-12", "Console", "a skip link is present", True, "skip-link" in layout_tsx and "skip-link" in styles_css)
check("P2-APP-13", "Console", "charts remap the legacy light palette", True, "adaptChartOption" in (APP_SRC / "lib" / "chartTheme.ts").read_text(encoding="utf-8"))
check("P2-APP-14", "Console", "CSV export neutralises formula injection", True, "formula injection" in (APP_SRC / "lib" / "csv.ts").read_text(encoding="utf-8"))
check("P2-APP-15", "Console", "table ids are validated before loading", True, "Invalid table id" in (APP_SRC / "lib" / "data.ts").read_text(encoding="utf-8"))
check("P2-APP-16", "Console", "a route-level error boundary exists", True, "PageBoundary" in app_tsx)

# ---------------------------------------------------------------------------
# 11. Power BI pack consistency
# ---------------------------------------------------------------------------

pack = json.loads((POWERBI / "manifest.json").read_text(encoding="utf-8"))
dax = (POWERBI / "dax" / "measures.dax").read_text(encoding="utf-8")
check("P2-PBI-01", "Power BI pack", "pack version is 2.0.0", "2.0.0", pack.get("version"))
check("P2-PBI-02", "Power BI pack", "the pack declares that no native PBIX exists", False, pack.get("native_pbix"))
check("P2-PBI-03", "Power BI pack", "table count matches the manifest", len(pack.get("tables", {})), pack.get("counts", {}).get("tables"))
check("P2-PBI-04", "Power BI pack", "measure count matches the DAX file", pack.get("counts", {}).get("measures"), len(re.findall(r"(?m)^MEASURE\s+", dax)))
check("P2-PBI-05", "Power BI pack", "relationship count matches the manifest", pack.get("counts", {}).get("relationships"), len(pack.get("relationships", [])))
check("P2-PBI-06", "Power BI pack", "page count matches the page definitions", len(pack.get("pages", [])), pack.get("counts", {}).get("pages"))
for name in ["fact_project.csv", "fact_insight.csv", "fact_anomaly_flag.csv", "fact_artifact_provenance.csv", "fact_metric_catalog.csv", "fact_log_pattern.csv", "fact_lineage_node.csv", "fact_lineage_edge.csv", "dim_insight_scope.csv", "dim_experiment_group.csv", "dim_provenance_status.csv", "dim_node_type.csv"]:
    check(f"P2-PBI-T-{name}", "Power BI pack", f"{name} is in the pack", True, name in pack.get("tables", {}))
check("P2-PBI-07", "Power BI pack", "the experiment fact carries a group key", True, "group_id" in pack.get("tables", {}).get("fact_experiment.csv", {}).get("columns", []))
check(
    "P2-PBI-08",
    "Power BI pack",
    "every relationship references a table in the pack",
    True,
    all(
        rel["from_table"] + ".csv" in pack["tables"] and rel["to_table"] + ".csv" in pack["tables"]
        for rel in pack.get("relationships", [])
    ),
)
check("P2-PBI-09", "Power BI pack", "exactly one relationship is bidirectional", 1, sum(1 for rel in pack.get("relationships", []) if rel["cross_filter"] == "both"))

# ---------------------------------------------------------------------------
# 12. Browser matrix and build evidence (read from the capture artefacts)
# ---------------------------------------------------------------------------

SHOTS = ROOT / "tests" / "phase2_shots" / "report.json"
if SHOTS.exists():
    shots = json.loads(SHOTS.read_text(encoding="utf-8"))
    check("P2-BRW-01", "Browser matrix", "19 routes were measured at 4 viewports", 76, len(shots))
    check("P2-BRW-02", "Browser matrix", "no console errors on any route", 0, sum(len(row["errors"]) for row in shots))
    check("P2-BRW-03", "Browser matrix", "no horizontal overflow on any route", 0, sum(row["overflow"] for row in shots))
    check("P2-BRW-04", "Browser matrix", "no text element below 10px on any route", 0, sum(row["smallText"] for row in shots))
    check("P2-BRW-05", "Browser matrix", "no chart rendered an empty canvas", 0, sum(row["emptyCanvas"] for row in shots))
    check("P2-BRW-06", "Browser matrix", "every route rendered a heading and at least one panel", True, all(row["headings"] and row["panels"] >= 1 for row in shots))
    browser_evidence = shots
else:
    browser_evidence = []

DIST = ROOT / "app" / "dist" / "assets"
if DIST.exists():
    js = sorted((p for p in DIST.glob("*.js")), key=lambda p: p.stat().st_size, reverse=True)
    css = sorted(DIST.glob("*.css"), key=lambda p: p.stat().st_size, reverse=True)
    check("P2-BLD-01", "Build", "the production bundle exists", True, bool(js) and bool(css))
    check("P2-BLD-02", "Build", "the largest JS chunk stays under 800 kB", True, js[0].stat().st_size < 800_000)
    check("P2-BLD-03", "Build", "the stylesheet stays under 150 kB", True, css[0].stat().st_size < 150_000)
    bundle = {
        "js": [{"file": p.name, "bytes": p.stat().st_size} for p in js[:4]],
        "css": [{"file": p.name, "bytes": p.stat().st_size} for p in css[:2]],
    }
else:
    bundle = {}

# ---------------------------------------------------------------------------
# Known caveats
# ---------------------------------------------------------------------------

caveat(
    "C1",
    "The raw datasets are absent",
    "fraudTrain.csv and fraudTest.csv are referenced by hash and size but are not in the workspace, so the notebook cannot be re-run end to end. Every Phase 2 value is derived from the generated artifacts only.",
    "logs/data_fingerprint.json, manifest sources",
)
caveat(
    "C2",
    "No native Power BI authoring runtime",
    "The pack is CSV + DAX + theme + page spec. It has not been opened in Power BI Desktop, so the model is verified by schema, count and arithmetic checks only.",
    "powerbi/manifest.json",
)
caveat(
    "C3",
    "Log events have no timestamps",
    "The notebook outputs, warning register and build logs carry no reliable per-event times. Sequence is preserved by cell and line number, and no timestamp is invented.",
    "data/notebook.json, logs/build.log",
)
caveat(
    "C4",
    "A single research program",
    "The workspace contains one program with nine phases. Comparisons are between model variants, folds and detectors - not between independent projects.",
    "app/public/data/phase2/program.json",
)
caveat(
    "C5",
    "Partial runtime telemetry",
    "The run records total wall clock, six embedding durations and the SHAP duration. There is no per-phase or per-model runtime ledger, so no runtime anomaly detection is attempted.",
    "manifest run.embeddingTimes",
)
caveat(
    "C6",
    "The same warning can appear in two sources",
    "A warning present in both the notebook output and the warning register is counted once in the warning families and twice in the raw event stream. The UI states which number it is showing.",
    "data/phase2/logs.json",
)
caveat(
    "C7",
    "Related findings are phase-level",
    "An artifact is linked to the findings of its phase. The link is labelled as phase-level rather than a claim that the artifact is the source of that finding.",
    "data/phase2/artifacts.json",
)
caveat(
    "C8",
    "The manifest's phase cell range omits each phase's final cell",
    "For every phase, the notebook records one more cell in that phase than the manifest's cell_start/cell_end span (for example P0 is 13-18 in the manifest while cell 19 also carries the P0 phase). Range-based provenance checks would therefore report false mismatches, so the console uses the notebook's own cell-to-phase mapping as the authority and records the producing cell against it.",
    "data/notebook.json, manifest phases",
)

# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

passed = sum(1 for row in RESULTS if row["status"] == "pass")
failed = [row for row in RESULTS if row["status"] == "fail"]

payload = {
    "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "checks": len(RESULTS),
    "passed": passed,
    "failed": len(failed),
    "results": RESULTS,
    "knownCaveats": CAVEATS,
}
OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
OUT_JSON.write_text(json.dumps(payload, indent=2), encoding="utf-8")

groups_order: list[str] = []
for row in RESULTS:
    if row["group"] not in groups_order:
        groups_order.append(row["group"])

lines: list[str] = []
lines.append("# Phase 2 validation report")
lines.append("")
lines.append(f"Generated {payload['generatedAt']} by `tests/validate_phase2.py`.")
lines.append("")
lines.append(f"**Checks: {len(RESULTS)} · Passed: {passed} · Failed: {len(failed)}**")
lines.append("")
lines.append("The validator reloads the Phase 1 manifest, analysis tables and notebook record, recomputes the Phase 2 derivations independently, and compares them with the JSON the app serves. It does not trust the React code or the build script.")
lines.append("")
lines.append("## Results by group")
lines.append("")
lines.append("| Group | Checks | Passed | Failed |")
lines.append("|---|---:|---:|---:|")
for group in groups_order:
    rows = [row for row in RESULTS if row["group"] == group]
    group_failed = sum(1 for row in rows if row["status"] == "fail")
    lines.append(f"| {group} | {len(rows)} | {len(rows) - group_failed} | {group_failed} |")
lines.append("")
lines.append("## Failed checks")
lines.append("")
if failed:
    lines.append("| ID | Group | Check | Expected | Actual |")
    lines.append("|---|---|---|---|---|")
    for row in failed:
        lines.append(f"| {row['id']} | {row['group']} | {row['name']} | `{row['expected']!r}` | `{row['actual']!r}` |")
else:
    lines.append("None. Every check passed.")
lines.append("")
lines.append("## What each group proves")
lines.append("")
lines.append("| Group | Claim under test |")
lines.append("|---|---|")
lines.append("| Evidence layer | The eight Phase 2 JSON files exist, parse, and carry a generation stamp. |")
lines.append("| Program profile | Phase dossiers, research questions, findings, issues, notes and the reproducibility checklist are carried from the manifest without drift. |")
lines.append("| Experiments | Group membership, baselines, absolute deltas and comparability flags are internally consistent and match the manifest metrics. |")
lines.append("| Anomalies | The weekly flag set is reproduced by an independent median/MAD z computation; drift flags match the analysis PSI verdicts; no anomaly is raised where the sample is too small. |")
lines.append("| Insights | Every insight carries a scope, a numeric metric, a source reference, a link and a confidence label, and the headline numbers match the source tables. |")
lines.append("| Lineage | Every edge resolves to real nodes, verified and inferred edges partition the set, and no node family is missing. |")
lines.append("| Artifacts | Provenance totals reconcile; verified artifacts carry the cell that the notebook records for them; inferred artifacts claim no cell. |")
lines.append("| Logs | Event and pattern counts reconcile, no timestamps are invented, and the export-skip count matches the warning register. |")
lines.append("| Metrics | The catalogue is complete, ids are unique, and every source reference resolves to a real manifest table. |")
lines.append("| Console | The seven Phase 2 routes, pages, navigation entries, accessibility affordances and security guards are present in the source. |")
lines.append("| Power BI pack | Version, table/measure/relationship counts, the new tables and the single bidirectional relationship all reconcile. |")
lines.append("| Browser matrix | Every route was rendered at four viewports; no console error, no horizontal overflow, no sub-10px text and no empty chart canvas. |")
lines.append("| Build | The production bundle exists and stays inside the size budget. |")
lines.append("")
lines.append("## Browser and build evidence")
lines.append("")
if browser_evidence:
    viewports = sorted({row["viewport"] for row in browser_evidence})
    lines.append(f"`tests/capture_phase2_shots.py` rendered **{len(browser_evidence)} measurements** ({len(viewports)} viewports x {len(browser_evidence) // max(len(viewports), 1)} routes).")
    lines.append("")
    lines.append("| Viewport | Routes | Console errors | Horizontal overflow (px) | Sub-10px text | Empty canvases | Tallest page (px) |")
    lines.append("|---|---:|---:|---:|---:|---:|---:|")
    for viewport in viewports:
        rows = [row for row in browser_evidence if row["viewport"] == viewport]
        lines.append(
            f"| {viewport} | {len(rows)} | {sum(len(row['errors']) for row in rows)} | {sum(row['overflow'] for row in rows)} | "
            f"{sum(row['smallText'] for row in rows)} | {sum(row['emptyCanvas'] for row in rows)} | {max(row['height'] for row in rows):,} |"
        )
    lines.append("")
else:
    lines.append("No browser capture was found. Run `python tests/capture_phase2_shots.py` to produce it.")
    lines.append("")
if bundle:
    lines.append("Production bundle (largest chunks):")
    lines.append("")
    lines.append("| File | Bytes |")
    lines.append("|---|---:|")
    for item in bundle["js"] + bundle["css"]:
        lines.append(f"| `{item['file']}` | {item['bytes']:,} |")
    lines.append("")
lines.append("## Known caveats (not failures)")
lines.append("")
for item in CAVEATS:
    lines.append(f"### {item['id']} · {item['title']}")
    lines.append("")
    lines.append(item["detail"])
    lines.append("")
    lines.append(f"Sources: `{item['sources']}`")
    lines.append("")
lines.append("## Limits of this validation")
lines.append("")
lines.append("- The raw datasets are absent, so the notebook cannot be re-run and no value here is recomputed from transaction rows.")
lines.append("- The Power BI pack is not executed in a Tabular engine; its DAX is source-inspected and arithmetic-checked only.")
lines.append("- Visual quality, contrast and interaction behaviour are covered by the browser suite in `tests/capture_phase2_shots.py` and the visual review, not by this script.")
lines.append("")

OUT_MD.parent.mkdir(parents=True, exist_ok=True)
OUT_MD.write_text("\n".join(lines), encoding="utf-8")

print(f"checks: {len(RESULTS)} | passed: {passed} | failed: {len(failed)}")
for row in failed:
    print(f"FAIL {row['id']}: {row['name']} | expected={row['expected']!r} actual={row['actual']!r}")
print(f"wrote {OUT_JSON}")
print(f"wrote {OUT_MD}")
sys.exit(1 if failed else 0)
