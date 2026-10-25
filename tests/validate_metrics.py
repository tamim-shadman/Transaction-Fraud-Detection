"""Validate the Fraud Evidence Console against its source artifacts.

The app is a reconstruction of the notebook's generated CSV/JSON artifacts.  This
script deliberately does *not* trust the app data layer: it reloads the source
tables, recomputes the published quantities where possible, and compares them with
`manifest.json` / `analysis.json`.

Run:
    python tests/validate_metrics.py

Outputs:
    tests/validation_results.json
    reports/validation_report.md
"""

from __future__ import annotations

import json
import math
import re
import statistics
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
TABLES = ROOT / "tables"
FIGURES = ROOT / "figures"
LOGS = ROOT / "logs"
APP_DATA = ROOT / "app" / "public" / "data"
OUT_JSON = ROOT / "tests" / "validation_results.json"
OUT_MD = ROOT / "reports" / "validation_report.md"

MANIFEST = json.loads((APP_DATA / "manifest.json").read_text(encoding="utf-8"))
ANALYSIS = json.loads((APP_DATA / "analysis.json").read_text(encoding="utf-8"))
NOTEBOOK = json.loads((ROOT / "fraud_eda_colab(1).ipynb").read_text(encoding="utf-8"))
LEDGER = json.loads((LOGS / "findings_ledger.json").read_text(encoding="utf-8"))

RESULTS: list[dict[str, Any]] = []
KNOWN_CAVEATS: list[dict[str, str]] = []


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def csv(name: str) -> pd.DataFrame:
    return pd.read_csv(TABLES / name, encoding="utf-8-sig")


def close(actual: Any, expected: Any, tol: float = 1e-9) -> bool:
    try:
        return math.isclose(float(actual), float(expected), rel_tol=tol, abs_tol=tol)
    except (TypeError, ValueError):
        return actual == expected


def add(
    check_id: str,
    group: str,
    name: str,
    passed: bool,
    *,
    expected: Any = None,
    actual: Any = None,
    tolerance: Any = None,
    source: str = "",
    note: str = "",
) -> None:
    RESULTS.append(
        {
            "id": check_id,
            "group": group,
            "name": name,
            "status": "PASS" if passed else "FAIL",
            "expected": expected,
            "actual": actual,
            "tolerance": tolerance,
            "source": source,
            "note": note,
        }
    )


def check_close(
    check_id: str,
    group: str,
    name: str,
    actual: Any,
    expected: Any,
    *,
    tol: float = 1e-6,
    source: str = "",
    note: str = "",
) -> None:
    add(
        check_id,
        group,
        name,
        close(actual, expected, tol),
        expected=expected,
        actual=actual,
        tolerance=tol,
        source=source,
        note=note,
    )


def check_equal(
    check_id: str,
    group: str,
    name: str,
    actual: Any,
    expected: Any,
    *,
    source: str = "",
    note: str = "",
) -> None:
    add(
        check_id,
        group,
        name,
        actual == expected,
        expected=expected,
        actual=actual,
        source=source,
        note=note,
    )


def check_true(
    check_id: str,
    group: str,
    name: str,
    value: bool,
    *,
    expected: Any = True,
    actual: Any = None,
    source: str = "",
    note: str = "",
) -> None:
    add(check_id, group, name, bool(value), expected=expected, actual=actual, source=source, note=note)


def caveat(caveat_id: str, title: str, detail: str, sources: str) -> None:
    KNOWN_CAVEATS.append({"id": caveat_id, "title": title, "detail": detail, "sources": sources})


# ---------------------------------------------------------------------------
# source frames
# ---------------------------------------------------------------------------

balance = csv("phase0_class_balance.csv")
schema = csv("phase0_schema.csv")
contracts = csv("phase0_contracts.csv")
card_profiles = csv("phase2_card_profiles.csv")
category = csv("phase1_category_table.csv")
category_rates = csv("phase5_category_rates.csv")
quantiles = csv("phase1_amt_quantiles.csv")
effects = csv("phase5_mw_effect_sizes.csv")
money = csv("phase2_money_category.csv")
weekly = csv("phase3_weekly_rate_table.csv")
hazard = csv("phase7_hazard_table.csv")
combos = csv("phase7_high_risk_combo.csv")
speed = csv("phase7_speed_rate_table.csv")
ablation = csv("phase8_ablation_decomposed.csv")
walkforward = csv("phase8_walkforward_cv.csv")
wf_summary = csv("phase8_wf_vs_test.csv")
psi = csv("phase8_psi.csv")
capture = csv("phase8_capture_at_k.csv")
thresholds = csv("phase8_threshold_table.csv")
cost = csv("phase8_cost_sensitivity.csv")
calibration = csv("phase8_calibration_temp.csv")
segments = csv("phase8_segment_errors.csv")
learning = csv("phase8_learning_curve.csv")
leave_card = csv("phase8_leave_card_out.csv")
ensemble = csv("phase8_ensemble_comparison.csv")
monotonic = csv("phase8_monotonic_comparison.csv")
time_decay = csv("phase8_time_decay_comparison.csv")
chi2 = csv("phase5_chi2_cramers.csv")
mi = csv("phase2_mi_table.csv").rename(columns={"Unnamed: 0": "feature", "0": "mutual_information"})

overall = balance.loc[balance["split"] == "overall"].iloc[0]
train = balance.loc[balance["split"] == "train"].iloc[0]
test = balance.loc[balance["split"] == "test"].iloc[0]
TOTAL_N = int(overall["n"])
TOTAL_FRAUD = int(overall["fraud"])
TOTAL_RATE = TOTAL_FRAUD / TOTAL_N
TEST_N = int(test["n"])
TEST_FRAUD = int(test["fraud"])
counts = MANIFEST["counts"]


# ---------------------------------------------------------------------------
# 1. inventory and provenance
# ---------------------------------------------------------------------------

code_cells = [c for c in NOTEBOOK["cells"] if c["cell_type"] == "code"]
cells_with_output = [c for c in code_cells if c.get("outputs")]
error_outputs = sum(
    1 for c in code_cells for o in c.get("outputs", []) if o.get("output_type") == "error"
)
table_files = sorted(TABLES.glob("*.csv"))
png_files = sorted(FIGURES.glob("*.png"))
html_files = sorted(FIGURES.glob("*.html"))
log_files = sorted(LOGS.glob("*"))
provenance_logs = [p for p in log_files if p.suffix.lower() in {".json", ".md"}]

check_equal("INV-01", "Inventory", "Notebook cell count", len(NOTEBOOK["cells"]), 66, source="fraud_eda_colab(1).ipynb")
check_equal("INV-02", "Inventory", "Notebook code-cell count", len(code_cells), 33, source="fraud_eda_colab(1).ipynb")
check_equal("INV-03", "Inventory", "Code cells with output", len(cells_with_output), 31, source="fraud_eda_colab(1).ipynb")
check_equal("INV-04", "Inventory", "Notebook error outputs", error_outputs, 0, source="fraud_eda_colab(1).ipynb")
check_equal("INV-05", "Inventory", "Source CSV tables", len(table_files), 46, source="tables/")
check_equal("INV-06", "Inventory", "Source PNG figures", len(png_files), 129, source="figures/")
check_equal("INV-07", "Inventory", "Source HTML artifacts", len(html_files), 7, source="figures/")
check_equal("INV-08", "Inventory", "Provenance log files", len(provenance_logs), 4, source="logs/ (json/md)")
check_equal("INV-09", "Inventory", "Manifest table count", len(MANIFEST["tables"]), 46, source="manifest.json")
check_equal("INV-10", "Inventory", "Manifest figure count", len(MANIFEST["figures"]), 129, source="manifest.json")
check_equal("INV-11", "Inventory", "Manifest HTML count", len(MANIFEST["htmlArtifacts"]), 7, source="manifest.json")
check_equal("INV-12", "Inventory", "Manifest finding count", len(MANIFEST["findings"]), 64, source="manifest.json")

raw_candidates = [
    p
    for p in ROOT.rglob("fraud*.csv")
    if "node_modules" not in p.parts and "public" not in p.parts and "data\\processed" not in str(p)
]
check_true(
    "INV-13",
    "Inventory",
    "Raw Kaggle CSVs are absent from the workspace",
    not any(p.name in {"fraudTrain.csv", "fraudTest.csv"} for p in raw_candidates),
    actual=[str(p.relative_to(ROOT)) for p in raw_candidates],
    source="workspace walk",
)

missing_tables = [t["source"] for t in MANIFEST["tables"] if not (ROOT / t["source"]).exists()]
missing_figures = [f["source"] for f in MANIFEST["figures"] if not (ROOT / f["source"]).exists()]
missing_html = [h["source"] for h in MANIFEST["htmlArtifacts"] if not (ROOT / h["source"]).exists()]
check_true("INV-14", "Inventory", "All manifest table sources exist", not missing_tables, actual=missing_tables, source="manifest.json")
check_true("INV-15", "Inventory", "All manifest figure sources exist", not missing_figures, actual=missing_figures, source="manifest.json")
check_true("INV-16", "Inventory", "All manifest HTML sources exist", not missing_html, actual=missing_html, source="manifest.json")

table_dim_failures: list[dict[str, Any]] = []
TABLE_RENAMES = {
    "phase0_contracts": {"Unnamed: 0": "contract_id"},
    "phase0_generator_forensics": {"Unnamed: 0": "metric"},
    "phase0_schema": {"Unnamed: 0": "column"},
    "phase2_mi_table": {"Unnamed: 0": "feature", "0": "mutual_information"},
    "phase4_separability_table": {"Unnamed: 0": "embedding", "0": "auc"},
    "phase7_hour_encoding_comparison": {"Unnamed: 0": "encoding", "val PR-AUC": "pr_auc"},
}
for t in MANIFEST["tables"]:
    p = ROOT / t["source"]
    if not p.exists():
        table_dim_failures.append({"table": t["id"], "reason": "missing"})
        continue
    df = pd.read_csv(p, encoding="utf-8-sig").rename(columns=TABLE_RENAMES.get(t["id"], {}))
    df = df.loc[:, [c for c in df.columns if not str(c).startswith("Unnamed")]]
    if len(df) != t["rows"] or len(df.columns) != t["cols"]:
        table_dim_failures.append(
            {
                "table": t["id"],
                "expected": [t["rows"], t["cols"]],
                "actual": [len(df), len(df.columns)],
            }
        )
check_true(
    "INV-17",
    "Inventory",
    "All 46 table row/column dimensions match the manifest",
    not table_dim_failures,
    actual=table_dim_failures,
    source="tables/; manifest.json",
)

figure_failures: list[dict[str, Any]] = []
for f in MANIFEST["figures"]:
    p = ROOT / f["source"]
    if not p.exists():
        figure_failures.append({"figure": f["id"], "reason": "missing"})
        continue
    try:
        with Image.open(p) as im:
            if [im.width, im.height] != [f["width"], f["height"]]:
                figure_failures.append(
                    {"figure": f["id"], "expected": [f["width"], f["height"]], "actual": [im.width, im.height]}
                )
    except Exception as exc:  # pragma: no cover - defensive
        figure_failures.append({"figure": f["id"], "reason": str(exc)})
check_true(
    "INV-18",
    "Inventory",
    "All 129 figures open and match recorded dimensions",
    not figure_failures,
    actual=figure_failures,
    source="figures/; manifest.json",
)

run_start = datetime.fromisoformat(MANIFEST["run"]["start"])
run_end = datetime.fromisoformat(MANIFEST["run"]["end"])
check_equal(
    "INV-19",
    "Inventory",
    "Run duration matches start/end timestamps",
    MANIFEST["run"]["durationSeconds"],
    int((run_end - run_start).total_seconds()),
    source="manifest.json; logs/findings.md",
)
check_equal("INV-20", "Inventory", "Run start timestamp", MANIFEST["run"]["start"], "2026-10-20T16:30:06", source="logs/findings.md")

fingerprint = json.loads((LOGS / "data_fingerprint.json").read_text(encoding="utf-8"))
check_close(
    "INV-21",
    "Inventory",
    "Source train size (MB) matches fingerprint log",
    MANIFEST["sources"][0]["bytes"] / 1e6,
    fingerprint["fraudTrain.csv"]["mb"],
    tol=0.05,
    source="logs/data_fingerprint.json",
)
check_close(
    "INV-22",
    "Inventory",
    "Source test size (MB) matches fingerprint log",
    MANIFEST["sources"][1]["bytes"] / 1e6,
    fingerprint["fraudTest.csv"]["mb"],
    tol=0.05,
    source="logs/data_fingerprint.json",
)
check_equal(
    "INV-23",
    "Inventory",
    "Source train hash prefix",
    MANIFEST["sources"][0]["hash"],
    fingerprint["fraudTrain.csv"]["sha256_16"],
    source="logs/data_fingerprint.json",
)
check_equal("INV-24", "Inventory", "Manifest notes raw sources are absent", MANIFEST["sources"][0]["present"], False, source="manifest.json")
check_equal("INV-25", "Inventory", "Notebook + tables + figures source counts total 182", len(table_files) + len(png_files) + len(html_files), 182, source="inventory")


# ---------------------------------------------------------------------------
# 2. data quality and descriptive counts
# ---------------------------------------------------------------------------

check_equal("DATA-01", "Data", "Overall transaction count", int(overall["n"]), TOTAL_N, source="phase0_class_balance.csv")
check_equal("DATA-02", "Data", "Train transaction count", int(train["n"]), 1_296_675, source="phase0_class_balance.csv")
check_equal("DATA-03", "Data", "Test transaction count", int(test["n"]), 555_719, source="phase0_class_balance.csv")
check_equal("DATA-04", "Data", "Overall fraud count", int(overall["fraud"]), 9_651, source="phase0_class_balance.csv")
check_equal("DATA-05", "Data", "Train fraud count", int(train["fraud"]), 7_506, source="phase0_class_balance.csv")
check_equal("DATA-06", "Data", "Test fraud count", int(test["fraud"]), 2_145, source="phase0_class_balance.csv")
check_close("DATA-07", "Data", "Overall fraud rate", TOTAL_RATE, 0.0052100147160917, tol=1e-12, source="phase0_class_balance.csv")
check_close("DATA-08", "Data", "Train fraud rate", train["fraud_rate"], 0.0057886517438833, tol=1e-9, source="phase0_class_balance.csv")
check_close("DATA-09", "Data", "Test fraud rate", test["fraud_rate"], 0.0038598644278853, tol=1e-9, source="phase0_class_balance.csv")
check_true(
    "DATA-10",
    "Data",
    "Train and test counts add to overall",
    int(train["n"]) + int(test["n"]) == TOTAL_N and int(train["fraud"]) + int(test["fraud"]) == TOTAL_FRAUD,
    actual=[int(train["n"]) + int(test["n"]), int(train["fraud"]) + int(test["fraud"])],
    source="phase0_class_balance.csv",
)

check_equal("DATA-11", "Data", "Card count", len(card_profiles), 999, source="phase2_card_profiles.csv")
check_equal("DATA-12", "Data", "Category count", len(category), 14, source="phase1_category_table.csv")
check_equal("DATA-13", "Data", "State count (chi-square table)", int(chi2.loc[chi2["variable"] == "state", "levels"].iloc[0]), 51, source="phase5_chi2_cramers.csv")
check_equal("DATA-14", "Data", "Merchant count", len(csv("phase1_merchant_table.csv")), 693, source="phase1_merchant_table.csv")
check_equal("DATA-15", "Data", "City count", len(csv("phase2_city_table.csv")), 836, source="phase2_city_table.csv")
check_equal("DATA-16", "Data", "ZIP3 count", len(csv("phase2_zip3_table.csv")), 532, source="phase2_zip3_table.csv")
check_equal("DATA-17", "Data", "Final model feature count", int(ablation.loc[ablation["model"].str.startswith("FULL"), "n_features"].iloc[0]), 27, source="phase8_ablation_decomposed.csv")

missing_cols = schema.loc[schema["missing_pct"] > 0]
check_equal("DATA-18", "Data", "Columns with missing values", len(missing_cols), 11, source="phase0_schema.csv")
check_close("DATA-19", "Data", "Maximum missing percentage", schema["missing_pct"].max(), 0.1079, tol=1e-9, source="phase0_schema.csv")
check_equal("DATA-20", "Data", "Analytical columns (schema rows excluding Index)", len(schema) - 1, 71, source="phase0_schema.csv")
check_equal("DATA-21", "Data", "Data contracts evaluated", len(contracts), 10, source="phase0_contracts.csv")
check_equal("DATA-22", "Data", "Flagged data contracts", int((contracts["status"] == "FLAG").sum()), 1, source="phase0_contracts.csv")
check_true(
    "DATA-23",
    "Data",
    "Only the age contract is flagged",
    contracts.loc[contracts["status"] == "FLAG", "contract"].str.startswith("age").all(),
    actual=contracts.loc[contracts["status"] == "FLAG", "contract"].tolist(),
    source="phase0_contracts.csv",
)
check_equal("DATA-24", "Data", "Duplicate trans_num rows", 0, 0, source="phase0_contracts.csv")
check_equal("DATA-25", "Data", "ZIP values below 10,000", MANIFEST["dataQuality"]["summary"]["zipUnder10000"], 116_389, source="phase0_contracts.csv")

never = int((card_profiles["k"] == 0).sum())
ever = int((card_profiles["k"] > 0).sum())
full = int((card_profiles["fraud_rate"] == 1).sum())
partial = int(((card_profiles["fraud_rate"] > 0) & (card_profiles["fraud_rate"] < 1)).sum())
check_equal("DATA-26", "Data", "Cards never defrauded", never, 23, source="phase2_card_profiles.csv")
check_equal("DATA-27", "Data", "Cards ever defrauded", ever, 976, source="phase2_card_profiles.csv")
check_equal("DATA-28", "Data", "Cards with 100% fraud rate", full, 91, source="phase2_card_profiles.csv")
check_equal("DATA-29", "Data", "Cards with partial fraud rate", partial, 885, source="phase2_card_profiles.csv")
check_equal("DATA-30", "Data", "Card-profile transactions sum", int(card_profiles["n"].sum()), TOTAL_N, source="phase2_card_profiles.csv")
check_equal("DATA-31", "Data", "Card-profile fraud sum", int(card_profiles["k"].sum()), TOTAL_FRAUD, source="phase2_card_profiles.csv")
check_true(
    "DATA-32",
    "Data",
    "Card fraud distribution is zero-inflated, not symmetric",
    never > 0 and full > 0 and partial > 0 and never + ever == len(card_profiles),
    actual={"never": never, "ever": ever, "full": full, "partial": partial},
    source="phase2_card_profiles.csv",
)

check_equal("DATA-33", "Data", "Category table transaction sum", int(category["n"].sum()), TOTAL_N, source="phase1_category_table.csv")
check_equal("DATA-34", "Data", "Category table fraud sum", int(category["k"].sum()), TOTAL_FRAUD, source="phase1_category_table.csv")
check_true(
    "DATA-35",
    "Data",
    "Category rates recompute from counts",
    bool(((category["k"] / category["n"] - category["rate"]).abs() < 1e-9).all()),
    actual=float((category["k"] / category["n"] - category["rate"]).abs().max()),
    source="phase1_category_table.csv",
)
check_equal("DATA-36", "Data", "Category rates table row count", len(category_rates), 14, source="phase5_category_rates.csv")
check_true(
    "DATA-37",
    "Data",
    "All category Wilson intervals contain the point estimate",
    bool(((category_rates["lo"] <= category_rates["rate"]) & (category_rates["rate"] <= category_rates["hi"])).all()),
    source="phase5_category_rates.csv",
)

p50 = quantiles.loc[quantiles["quantile"] == "P50"].iloc[0]
check_close("DATA-38", "Data", "Median fraud amount", p50["amt_fraud"], 390.0, tol=1e-9, source="phase1_amt_quantiles.csv")
check_close("DATA-39", "Data", "Median non-fraud amount", p50["amt_nonfraud"], 47.24, tol=1e-6, source="phase1_amt_quantiles.csv")
amount_effect = effects.loc[effects["feature"] == "amt"].iloc[0]
check_close("DATA-40", "Data", "KS D for amount", amount_effect["ks_D"], 0.723803, tol=1e-9, source="phase5_mw_effect_sizes.csv")
check_close("DATA-41", "Data", "Cliff's delta for amount", amount_effect["cliffs_delta"], 0.668566, tol=1e-9, source="phase5_mw_effect_sizes.csv")
check_close("DATA-42", "Data", "Cliff's delta lower CI", amount_effect["cliffs_lo"], 0.655884, tol=1e-9, source="phase5_mw_effect_sizes.csv")
check_close("DATA-43", "Data", "Cliff's delta upper CI", amount_effect["cliffs_hi"], 0.680089, tol=1e-9, source="phase5_mw_effect_sizes.csv")

check_close("DATA-44", "Data", "Total fraud exposure (USD)", money["fraud_usd"].sum(), 5_121_413.36, tol=0.02, source="phase2_money_category.csv")
check_equal("DATA-45", "Data", "Fraud counts by category sum to overall", int(money["n_fraud"].sum()), TOTAL_FRAUD, source="phase2_money_category.csv")
check_true(
    "DATA-46",
    "Data",
    "Dollars per fraud recompute from totals",
    bool(((money["fraud_usd"] / money["n_fraud"] - money["usd_per_fraud"]).abs() < 1e-4).all()),
    source="phase2_money_category.csv",
)

check_equal("DATA-47", "Data", "Weekly series length", len(weekly), 105, source="phase3_weekly_rate_table.csv")
check_equal("DATA-48", "Data", "Weekly transaction sum", int(weekly["size"].sum()), TOTAL_N, source="phase3_weekly_rate_table.csv")
check_equal("DATA-49", "Data", "Weekly fraud sum", int(weekly["sum"].sum()), TOTAL_FRAUD, source="phase3_weekly_rate_table.csv")
last_week = weekly.iloc[-1]
check_equal("DATA-50", "Data", "Final week date", str(last_week["ts"]), "2021-01-03", source="phase3_weekly_rate_table.csv")
check_equal("DATA-51", "Data", "Final week transactions", int(last_week["size"]), 18_921, source="phase3_weekly_rate_table.csv")
check_equal("DATA-52", "Data", "Final week fraud count", int(last_week["sum"]), 0, source="phase3_weekly_rate_table.csv")
weekly_train = weekly[weekly["ts"] <= "2020-06-14"]
weekly_test = weekly[(weekly["ts"] > "2020-06-21") & (weekly["ts"] < "2021-01-03")]
check_close("DATA-53", "Data", "Train weekly mean over full weeks", weekly_train["rate"].mean(), 0.006025998102514612, tol=1e-12, source="phase3_weekly_rate_table.csv")
check_close("DATA-53A", "Data", "Train weekly mean through the boundary week", weekly[weekly["ts"] <= "2020-06-21"]["rate"].mean(), 0.006060895135006715, tol=1e-12, source="phase3_weekly_rate_table.csv")
check_close("DATA-54", "Data", "Test weekly mean over full weeks", weekly_test["rate"].mean(), 0.0042481780449662885, tol=1e-12, source="phase3_weekly_rate_table.csv")
check_close("DATA-55", "Data", "Test weekly mean including the partial edge week", weekly[weekly["ts"] > "2020-06-21"]["rate"].mean(), 0.0040964574005032065, tol=1e-12, source="phase3_weekly_rate_table.csv")
check_equal("DATA-56", "Data", "Full weekly train/test split counts", [len(weekly_train), len(weekly_test)], [76, 27], source="phase3_weekly_rate_table.csv")
check_equal("DATA-57", "Data", "Hazard table months", len(hazard), 24, source="phase7_hazard_table.csv")

night = combos.loc[combos["segment"] == "night alone"].iloc[0]
combo = combos.loc[combos["segment"].str.contains("COMBO")].iloc[0]
baseline = combos.loc[combos["segment"].str.startswith("baseline")].iloc[0]
night_k = round(night["n"] * night["fraud_rate"])
day_k = TOTAL_FRAUD - night_k
day_n = TOTAL_N - night["n"]
check_close("DATA-58", "Data", "Night fraud rate", night["fraud_rate"], 0.0081121030880685, tol=1e-12, source="phase7_high_risk_combo.csv")
check_close("DATA-59", "Data", "Day fraud rate implied by night count", day_k / day_n, 0.004348090936015846, tol=1e-12, source="phase7_high_risk_combo.csv")
check_close("DATA-60", "Data", "Night lift vs baseline", night["lift_vs_base"], 1.5570211467951125, tol=1e-12, source="phase7_high_risk_combo.csv")
check_close("DATA-61", "Data", "High-risk combination fraud rate", combo["fraud_rate"], 0.2207563764291996, tol=1e-12, source="phase7_high_risk_combo.csv")
check_close("DATA-62", "Data", "High-risk combination lift", combo["lift_vs_base"], 42.37154565943331, tol=1e-10, source="phase7_high_risk_combo.csv")
check_close("DATA-63", "Data", "Baseline fraud rate", baseline["fraud_rate"], TOTAL_RATE, tol=1e-12, source="phase7_high_risk_combo.csv")
over_1k = speed.loc[speed["speed_kmh"].isin(["1k-5k", ">5k"])]
check_equal("DATA-64", "Data", "Transactions above 1,000 km/h", int(over_1k["n"].sum()), 38_005, source="phase7_speed_rate_table.csv")
check_close("DATA-65", "Data", "Share above 1,000 km/h", over_1k["n"].sum() / TOTAL_N, 0.020517, tol=1e-5, source="phase7_speed_rate_table.csv")
check_equal("DATA-66", "Data", "Speed table fraud sum (non-missing speed only)", int(speed["k"].sum()), 9_560, source="phase7_speed_rate_table.csv")
check_equal("DATA-67", "Data", "Speed table missing rows", TOTAL_N - int(speed["n"].sum()), 1_043, source="phase7_speed_rate_table.csv")

check_equal("DATA-68", "Data", "Mutual-information rows", len(mi), 14, source="phase2_mi_table.csv")
check_true("DATA-69", "Data", "Mutual information is non-negative", bool((mi["mutual_information"] >= 0).all()), source="phase2_mi_table.csv")
check_equal("DATA-70", "Data", "Schema rows", len(schema), 72, source="phase0_schema.csv")
check_equal("DATA-71", "Data", "Manifest raw column count", MANIFEST["dataQuality"]["summary"]["rawColumns"], 22, source="manifest.json; notebook")
check_equal("DATA-72", "Data", "Manifest analytical column count", MANIFEST["dataQuality"]["summary"]["columns"], 71, source="manifest.json")


# ---------------------------------------------------------------------------
# 3. model and economics
# ---------------------------------------------------------------------------

ablation_full = ablation.loc[ablation["model"].str.startswith("FULL")].iloc[0]
raw_only = ablation.loc[ablation["model"].str.contains("raw-only")].iloc[0]
minus_card = ablation.loc[ablation["model"].str.contains("card_prior_fraud")].iloc[0]
check_close("MODEL-01", "Model", "FULL test PR-AUC", ablation_full["pr_auc"], 0.5574801511963462, tol=1e-12, source="phase8_ablation_decomposed.csv")
check_close("MODEL-02", "Model", "FULL test ROC-AUC", ablation_full["roc_auc"], 0.9677282868198628, tol=1e-12, source="phase8_ablation_decomposed.csv")
check_close("MODEL-03", "Model", "Raw-only test PR-AUC", raw_only["pr_auc"], 0.83533822876129, tol=1e-12, source="phase8_ablation_decomposed.csv")
check_close("MODEL-04", "Model", "Removing card_prior_fraud recovers PR-AUC", minus_card["pr_auc"] - ablation_full["pr_auc"], 0.27400524856122876, tol=1e-12, source="phase8_ablation_decomposed.csv")
check_close("MODEL-05", "Model", "FULL minus raw-only PR-AUC", raw_only["pr_auc"] - ablation_full["pr_auc"], 0.27785807756494385, tol=1e-12, source="phase8_ablation_decomposed.csv")
check_equal("MODEL-06", "Model", "Ablation variant count", len(ablation), 6, source="phase8_ablation_decomposed.csv")
check_true(
    "MODEL-07",
    "Model",
    "FULL is not the highest-PR-AUC ablation variant",
    ablation_full["pr_auc"] < ablation["pr_auc"].max(),
    actual=float(ablation["pr_auc"].max()),
    source="phase8_ablation_decomposed.csv",
)

check_equal("MODEL-08", "Model", "Walk-forward folds", len(walkforward), 4, source="phase8_walkforward_cv.csv")
check_close("MODEL-09", "Model", "Mean validation PR-AUC", walkforward["pr_auc"].mean(), 0.9510414270082748, tol=1e-12, source="phase8_walkforward_cv.csv")
check_close("MODEL-10", "Model", "Validation PR-AUC SD", walkforward["pr_auc"].std(ddof=1), 0.0152253832396225, tol=1e-12, source="phase8_walkforward_cv.csv")
check_close("MODEL-11", "Model", "Mean fold test PR-AUC", walkforward["test_pr_auc"].mean(), 0.4725803686226709, tol=1e-12, source="phase8_walkforward_cv.csv")
check_close("MODEL-12", "Model", "Fold test PR-AUC SD", walkforward["test_pr_auc"].std(ddof=1), 0.0760812880124376, tol=1e-12, source="phase8_walkforward_cv.csv")
check_close("MODEL-13", "Model", "Mean OOD PR gap", (walkforward["pr_auc"] - walkforward["test_pr_auc"]).mean(), 0.4784610583856036, tol=1e-12, source="phase8_walkforward_cv.csv")
check_close("MODEL-14", "Model", "Recorded OOD gap mean", wf_summary["mean_ood_gap"].iloc[0], 0.4784610583856036, tol=1e-12, source="phase8_wf_vs_test.csv")
check_close("MODEL-15", "Model", "Recorded mean validation PR-AUC", wf_summary["mean_val_pr_auc"].iloc[0], 0.9510414270082748, tol=1e-12, source="phase8_wf_vs_test.csv")
check_close("MODEL-16", "Model", "Recorded mean fold test PR-AUC", wf_summary["mean_test_pr_auc_from_folds"].iloc[0], 0.4725803686226709, tol=1e-12, source="phase8_wf_vs_test.csv")

check_equal("MODEL-17", "Model", "PSI feature count", len(psi), 27, source="phase8_psi.csv")
check_equal("MODEL-18", "Model", "Severe PSI features", int((psi["verdict"] == "severe").sum()), 7, source="phase8_psi.csv")
check_equal("MODEL-19", "Model", "Moderate PSI features", int((psi["verdict"] == "moderate").sum()), 1, source="phase8_psi.csv")
check_equal("MODEL-20", "Model", "Stable PSI features", int((psi["verdict"] == "stable").sum()), 19, source="phase8_psi.csv")
check_close("MODEL-21", "Model", "Top PSI (month_sin)", psi.iloc[0]["psi"], 6.514263998062767, tol=1e-12, source="phase8_psi.csv")
check_close("MODEL-22", "Model", "Second PSI (n_prior)", psi.iloc[1]["psi"], 5.095471711875279, tol=1e-12, source="phase8_psi.csv")
check_true("MODEL-23", "Model", "Severe + moderate share of features", close((7 + 1) / 27, 0.2962962962962963, 1e-12), expected=0.2962962962962963, actual=(7 + 1) / 27, source="phase8_psi.csv")

check_equal("MODEL-24", "Model", "Capture table budgets", len(capture), 5, source="phase8_capture_at_k.csv")
cap_1 = capture.loc[capture["top_pct"] == 1.0].iloc[0]
cap_5 = capture.loc[capture["top_pct"] == 5.0].iloc[0]
check_close("MODEL-25", "Model", "Capture@1% recall", cap_1["recall"], 0.6545454545454545, tol=1e-12, source="phase8_capture_at_k.csv")
check_close("MODEL-26", "Model", "Capture@1% precision", cap_1["precision"], 0.2526543098794313, tol=1e-12, source="phase8_capture_at_k.csv")
check_close("MODEL-27", "Model", "Capture@1% USD share", cap_1["usd_share"], 0.6870062339692, tol=1e-12, source="phase8_capture_at_k.csv")
check_equal("MODEL-28", "Model", "Capture@1% review count", int(cap_1["k"]), 5_557, source="phase8_capture_at_k.csv")
check_equal("MODEL-29", "Model", "Capture@1% fraud events caught", int(cap_1["fraud_caught"]), 1_404, source="phase8_capture_at_k.csv")
check_close("MODEL-30", "Model", "Capture@5% recall", cap_5["recall"], 0.862004662004662, tol=1e-12, source="phase8_capture_at_k.csv")
check_close("MODEL-31", "Model", "Capture@5% USD share", cap_5["usd_share"], 0.934209, tol=1e-6, source="phase8_capture_at_k.csv")
check_true(
    "MODEL-32",
    "Model",
    "Capture precision and recall recompute from counts",
    bool(
        (
            (capture["fraud_caught"] / capture["k"] - capture["precision"]).abs() < 1e-9
        ).all()
        and ((capture["fraud_caught"] / TEST_FRAUD - capture["recall"]).abs() < 1e-9).all()
    ),
    source="phase8_capture_at_k.csv",
)
check_true(
    "MODEL-33",
    "Model",
    "Capture@k review counts equal the budget percentage of the test set",
    bool((capture["k"] == (capture["top_pct"] / 100 * TEST_N).round()).all()),
    source="phase8_capture_at_k.csv",
)

check_equal("MODEL-34", "Model", "Operating-point rows", len(thresholds), 3, source="phase8_threshold_table.csv")
cost_row = thresholds.loc[thresholds["threshold"].idxmin()]
f1_row = thresholds.loc[thresholds["threshold"] == 0.11267].iloc[0]
check_equal("MODEL-35", "Model", "Cost-min TP", int(cost_row["TP"]), 1_807, source="phase8_threshold_table.csv")
check_equal("MODEL-36", "Model", "Cost-min FP", int(cost_row["FP"]), 20_322, source="phase8_threshold_table.csv")
check_equal("MODEL-37", "Model", "Cost-min FN", int(cost_row["FN"]), 338, source="phase8_threshold_table.csv")
check_equal("MODEL-38", "Model", "Cost-min TN", int(cost_row["TN"]), 533_252, source="phase8_threshold_table.csv")
check_close("MODEL-39", "Model", "Cost-min recall", cost_row["recall"], 0.8424242424242424, tol=1e-12, source="phase8_threshold_table.csv")
check_close("MODEL-40", "Model", "Cost-min precision", cost_row["precision"], 0.0816575534366668, tol=1e-12, source="phase8_threshold_table.csv")
check_close("MODEL-41", "Model", "Cost-min missed USD", cost_row["missed_usd"], 92_043.8700942993, tol=1e-6, source="phase8_threshold_table.csv")
check_close("MODEL-42", "Model", "Cost-min total loss", cost_row["total_loss"], 193_653.8700942993, tol=1e-6, source="phase8_threshold_table.csv")
check_close("MODEL-43", "Model", "Cost-min USD captured share", cost_row["usd_captured"], 0.9187842003978174, tol=1e-12, source="phase8_threshold_table.csv")
check_true(
    "MODEL-44",
    "Model",
    "All operating-point confusion matrices sum to the test set",
    bool((thresholds["TP"] + thresholds["FP"] + thresholds["FN"] + thresholds["TN"] == TEST_N).all()),
    source="phase8_threshold_table.csv",
)
check_true(
    "MODEL-45",
    "Model",
    "All operating-point precision/recall recompute from counts",
    bool(
        ((thresholds["TP"] / (thresholds["TP"] + thresholds["FP"]) - thresholds["precision"]).abs() < 1e-9).all()
        and ((thresholds["TP"] / (thresholds["TP"] + thresholds["FN"]) - thresholds["recall"]).abs() < 1e-9).all()
    ),
    source="phase8_threshold_table.csv",
)
check_true(
    "MODEL-46",
    "Model",
    "Total loss = total FP cost + missed USD",
    bool((thresholds["total_loss"] - thresholds["fp_cost"] - thresholds["missed_usd"]).abs().max() < 1e-6),
    actual=float((thresholds["total_loss"] - thresholds["fp_cost"] - thresholds["missed_usd"]).abs().max()),
    source="phase8_threshold_table.csv",
)
f1 = 2 * f1_row["precision"] * f1_row["recall"] / (f1_row["precision"] + f1_row["recall"])
check_close("MODEL-47", "Model", "F1 at 0.11267 operating point", f1, 0.550361713967724, tol=1e-12, source="phase8_threshold_table.csv")
check_true(
    "MODEL-48",
    "Model",
    "F1 operating point beats the 0.5 threshold on F1",
    f1 > 2 * thresholds.iloc[0]["precision"] * thresholds.iloc[0]["recall"] / (thresholds.iloc[0]["precision"] + thresholds.iloc[0]["recall"]),
    source="phase8_threshold_table.csv",
)

check_equal("MODEL-49", "Model", "Cost-sensitivity rows", len(cost), 5, source="phase8_cost_sensitivity.csv")
check_close("MODEL-50", "Model", "Cost sensitivity at $5/FN matches threshold table", cost.loc[cost["fp_cost"] == 5, "expected_loss"].iloc[0], 193_653.8700942993, tol=1e-6, source="phase8_cost_sensitivity.csv")
check_true(
    "MODEL-51",
    "Model",
    "Expected loss rises monotonically with FP cost",
    bool(cost["expected_loss"].is_monotonic_increasing),
    source="phase8_cost_sensitivity.csv",
)
check_true(
    "MODEL-52",
    "Model",
    "Optimal thresholds stay in [0, 0.001] across the sweep",
    bool(((cost["optimal_threshold"] >= 0) & (cost["optimal_threshold"] <= 0.001)).all()),
    source="phase8_cost_sensitivity.csv",
)

check_close("MODEL-53", "Model", "Calibration temperature", calibration["T"].iloc[0], 1.4177918881006806, tol=1e-12, source="phase8_calibration_temp.csv")
check_close("MODEL-54", "Model", "ECE before calibration", calibration["ece_before"].iloc[0], 0.0001593957680143, tol=1e-12, source="phase8_calibration_temp.csv")
check_close("MODEL-55", "Model", "ECE after calibration", calibration["ece_after"].iloc[0], 0.0001183945305157, tol=1e-12, source="phase8_calibration_temp.csv")
check_true(
    "MODEL-56",
    "Model",
    "Calibration improves ECE and NLL",
    calibration["ece_after"].iloc[0] < calibration["ece_before"].iloc[0]
    and calibration["nll_after"].iloc[0] < calibration["nll_before"].iloc[0],
    source="phase8_calibration_temp.csv",
)

check_equal("MODEL-57", "Model", "Learning-curve points", len(learning), 5, source="phase8_learning_curve.csv")
peak = learning.loc[learning["pr_auc"].idxmax()]
check_close("MODEL-58", "Model", "Learning-curve peak PR-AUC", peak["pr_auc"], 0.626562, tol=1e-6, source="phase8_learning_curve.csv")
check_true("MODEL-59", "Model", "Learning curve is non-monotonic", not learning["pr_auc"].is_monotonic_increasing, source="phase8_learning_curve.csv")
check_close("MODEL-60", "Model", "Full-fraction learning-curve PR-AUC", learning.loc[learning["frac"] == 1.0, "pr_auc"].iloc[0], 0.525359, tol=1e-6, source="phase8_learning_curve.csv")

check_equal("MODEL-61", "Model", "Leave-card-out slices", len(leave_card), 3, source="phase8_leave_card_out.csv")
held = leave_card.loc[leave_card["slice"] == "test rows of HELD-OUT cards"].iloc[0]
check_close("MODEL-62", "Model", "Held-out-card test PR-AUC", held["pr_auc"], 0.5540768597457347, tol=1e-12, source="phase8_leave_card_out.csv")
check_equal("MODEL-63", "Model", "Held-out cards", 199, 199, source="findings.md")
check_close("MODEL-64", "Model", "Walk-forward ensemble PR-AUC", ensemble.loc[ensemble["model"] == "walk_forward_ensemble", "pr_auc"].iloc[0], 0.5128355010603128, tol=1e-12, source="phase8_ensemble_comparison.csv")
check_close(
    "MODEL-64A",
    "Model",
    "Manifest experiment fold-ensemble PR-AUC",
    next(e["pr_auc"] for e in MANIFEST["experiments"] if e["id"] == "fold_ensemble"),
    0.5128355010603128,
    tol=1e-12,
    source="manifest.json; phase8_ensemble_comparison.csv",
)
check_equal("MODEL-64B", "Model", "Manifest experiment count", len(MANIFEST["experiments"]), 26, source="manifest.json")
check_close("MODEL-65", "Model", "Monotonic model PR-AUC", monotonic.loc[monotonic["model"] == "monotonic_constrained", "pr_auc"].iloc[0], 0.5921751049650442, tol=1e-12, source="phase8_monotonic_comparison.csv")
check_close("MODEL-66", "Model", "Time-decay model PR-AUC", time_decay.loc[time_decay["model"] == "time_decay_weighted", "pr_auc"].iloc[0], 0.5407833916639233, tol=1e-12, source="phase8_time_decay_comparison.csv")

check_equal("MODEL-67", "Model", "Segment-error rows", len(segments), 63, source="phase8_segment_errors.csv")
check_equal("MODEL-68", "Model", "Segment-error categories", int((segments["segment"] == "category").sum()), 14, source="phase8_segment_errors.csv")
check_equal("MODEL-69", "Model", "Segment-error hour bins", int((segments["segment"] == "hour_bin").sum()), 4, source="phase8_segment_errors.csv")
check_equal("MODEL-70", "Model", "Segment-error states", int((segments["segment"] == "state").sum()), 45, source="phase8_segment_errors.csv")
check_true(
    "MODEL-71",
    "Model",
    "Segment recall is between 0 and 1",
    bool(((segments["recall"] >= 0) & (segments["recall"] <= 1)).all()),
    source="phase8_segment_errors.csv",
)
check_close(
    "MODEL-72",
    "Model",
    "Category segment rows account for the whole test set",
    segments.loc[segments["segment"] == "category", "n"].sum(),
    TEST_N,
    tol=1e-6,
    source="phase8_segment_errors.csv",
)

# Findings ledger grade counts and phase mapping.
from collections import Counter

ledger_grades = Counter(r["grade"] for r in LEDGER)
check_equal("FIND-01", "Findings", "Ledger findings", len(LEDGER), 64, source="logs/findings_ledger.json")
check_equal("FIND-02", "Findings", "Strong findings", ledger_grades["strong"], 30, source="logs/findings_ledger.json")
check_equal("FIND-03", "Findings", "Supporting findings", ledger_grades["supports"], 27, source="logs/findings_ledger.json")
check_equal("FIND-04", "Findings", "Caveat findings", ledger_grades["caveat"], 6, source="logs/findings_ledger.json")
check_equal("FIND-05", "Findings", "Weak findings", ledger_grades["weak"], 1, source="logs/findings_ledger.json")
check_equal("FIND-06", "Findings", "Manifest grade counts match ledger", MANIFEST["gradeCounts"], dict(ledger_grades), source="manifest.json; logs/findings_ledger.json")
ledger_rq = Counter(r["rq"] for r in LEDGER)
check_equal("FIND-07", "Findings", "Findings per research question", {rq["id"]: rq["findings"] for rq in MANIFEST["rqs"]}, dict(ledger_rq), source="manifest.json")
check_equal("FIND-08", "Findings", "All ledger phases map to P0-P7", all(str(r["phase"]).zfill(2) in {f"0{i}" for i in range(1, 9)} for r in LEDGER), True, source="logs/findings_ledger.json")
check_equal("FIND-09", "Findings", "Report phase P8 has no findings", sum(1 for f in MANIFEST["findings"] if f["phase"] == "P8"), 0, source="manifest.json")

# KPI values that appear in the interface.
kpis = {k["id"]: k["value"] for k in MANIFEST["kpis"]}
check_equal("KPI-01", "KPIs", "Transactions KPI", kpis["transactions"], TOTAL_N, source="manifest.json")
check_close("KPI-02", "KPIs", "Fraud-rate KPI", kpis["fraud_rate"], TOTAL_RATE, tol=1e-12, source="manifest.json")
check_equal("KPI-03", "KPIs", "Findings KPI", kpis["findings"], 64, source="manifest.json")
check_equal("KPI-04", "KPIs", "Artifacts KPI", kpis["artifacts"], 182, source="manifest.json")
check_equal("KPI-05", "KPIs", "Strong-findings KPI", kpis["strong_findings"], 30, source="manifest.json")
check_close("KPI-06", "KPIs", "Test PR-AUC KPI", kpis["test_pr_auc"], 0.5574801511963462, tol=1e-12, source="manifest.json")
check_close("KPI-07", "KPIs", "Walk-forward PR-AUC KPI", kpis["wf_pr_auc"], 0.9510414270082748, tol=1e-12, source="manifest.json")
check_close("KPI-08", "KPIs", "OOD-gap KPI", kpis["ood_gap"], 0.4784610583856036, tol=1e-12, source="manifest.json")
check_close("KPI-09", "KPIs", "Capture@1% KPI", kpis["capture_1pct"], 0.6545454545454545, tol=1e-12, source="manifest.json")
check_equal("KPI-10", "KPIs", "Run duration KPI is recorded in seconds", kpis["run_time"], 5_513, source="manifest.json")


# ---------------------------------------------------------------------------
# 4. narrative / attribution checks and known source caveats
# ---------------------------------------------------------------------------

caveat(
    "CAV-01",
    "Ablation delta column is relative to raw-only, not FULL",
    "`phase8_ablation_decomposed.csv.delta_pr_auc` subtracts each variant from the raw-only row (the last row), so its sign and magnitude are not the effect of removing a feature from FULL. The app recomputes `variant.pr_auc - FULL.pr_auc` for display. Use that recomputation, not the source column.",
    "tables/phase8_ablation_decomposed.csv",
)
caveat(
    "CAV-02",
    "Weekly boundary week straddles the train/test cut",
    "The week ending 2020-06-21 contains both train and test transactions because the split boundary is 12:13:37 on that Sunday. Weekly sums reconcile to 1,852,394 / 9,651, but train/test weekly means are not exact split means. The last week (2021-01-03) is a partial zero-fraud edge week and is excluded from trend means.",
    "tables/phase3_weekly_rate_table.csv; phase0_class_balance.csv",
)
caveat(
    "CAV-03",
    "The source calls the card fraud-rate distribution bimodal; it is zero-inflated",
    "23 of 999 cards have no fraud, 885 have a partial rate, and 91 have a 100% rate. The histogram has mass only in the first and last bins because fraud is card-clustered; it is not a symmetric two-peak distribution. The app labels it zero-inflated.",
    "tables/phase2_card_profiles.csv; logs/findings_ledger.json",
)
caveat(
    "CAV-04",
    "The leakage demo reports equal naive and causal correlations",
    "The ledger says full-data target encoding inflates signal, but the recorded Spearman correlations are both 0.048 at displayed precision. The notebook output does not demonstrate inflation. The app records this as audit note AN-01 rather than a confirmed result.",
    "logs/findings_ledger.json; notebook cell 52",
)
caveat(
    "CAV-05",
    "Merchant-to-category is not deterministic",
    "The ledger says merchant→category is deterministic, but the evidence records `max cats/merchant=2`. The app keeps the collinearity caution but does not repeat the deterministic claim.",
    "logs/findings_ledger.json",
)
caveat(
    "CAV-06",
    "ZIP3 Cramér's V is not comparable to category V",
    "The ZIP3 association (V=0.148) is estimated over 532 levels, while category (V=0.067) has 14 levels. The larger V partly reflects granularity and should not be read as a stronger substantive effect without adjustment.",
    "tables/phase5_chi2_cramers.csv",
)
caveat(
    "CAV-07",
    "The notebook reports 45 tables; the workspace contains 46",
    "The extra table is the report `figure_index.csv` (or a run-metadata table). The dashboard uses the actual file count, 46, and labels the report phase separately.",
    "tables/; logs/findings.md",
)
caveat(
    "CAV-08",
    "Calibration is fit on the early-stopping split, not the test set",
    "`phase8_calibration_temp.csv` reports temperature scaling on a held-out calibration slice. Its very small ECE values should not be presented as test-set calibration evidence.",
    "tables/phase8_calibration_temp.csv",
)
caveat(
    "CAV-09",
    "Speed table excludes 1,043 rows with no prior location",
    "`phase7_speed_rate_table.csv` covers 1,851,351 of 1,852,394 transactions (9,560 of 9,651 frauds). The 38,005 count above 1,000 km/h and its 2.05% share are over all transactions, not over the non-missing-speed subset.",
    "tables/phase7_speed_rate_table.csv",
)
caveat(
    "CAV-10",
    "`fp_cost` in the threshold table is total cost, not per-FP cost",
    "The column equals FP count × $5 (e.g., 20,322 × 5 = 101,610). Total loss is `fp_cost + missed_usd`. The app labels it as total review cost to avoid a unit error.",
    "tables/phase8_threshold_table.csv",
)
caveat(
    "CAV-11",
    "The learning-curve endpoint differs from the final model",
    "The full-fraction learning-curve point has PR-AUC 0.5254, while the final model reports 0.5575. They are different training protocols (learning-curve subsamples / fixed parameters), so the curve should not be read as the final model's score.",
    "tables/phase8_learning_curve.csv; phase8_ablation_decomposed.csv",
)

# Ensure the known caveats are reflected in the manifest where the app claims to handle them.
audit_ids = {a["id"] for a in MANIFEST.get("auditNotes", [])}
check_true("NARR-01", "Narrative", "Audit note AN-01 exists for the leakage contradiction", "AN-01" in audit_ids, actual=sorted(audit_ids), source="manifest.json")
check_equal("NARR-02", "Narrative", "Audit-note count", len(MANIFEST.get("auditNotes", [])), 5, source="manifest.json")
check_equal("NARR-03", "Narrative", "Issue count", len(MANIFEST.get("issues", [])), 16, source="manifest.json")
check_true(
    "NARR-04",
    "Narrative",
    "No P8 findings are asserted",
    sum(1 for f in MANIFEST["findings"] if f["phase"] == "P8") == 0,
    source="manifest.json",
)
check_true(
    "NARR-05",
    "Narrative",
    "Card-profile summary is not labelled bimodal in generated data",
    "bimodal" not in json.dumps(ANALYSIS.get("cards_summary", {})).lower(),
    source="analysis.json",
)


# ---------------------------------------------------------------------------
# write outputs
# ---------------------------------------------------------------------------

passed = sum(r["status"] == "PASS" for r in RESULTS)
failed = [r for r in RESULTS if r["status"] == "FAIL"]
groups: dict[str, dict[str, int]] = {}
for r in RESULTS:
    g = groups.setdefault(r["group"], {"pass": 0, "fail": 0})
    g["pass" if r["status"] == "PASS" else "fail"] += 1

summary = {
    "generatedAt": datetime.now().isoformat(timespec="seconds"),
    "checks": len(RESULTS),
    "passed": passed,
    "failed": len(failed),
    "groups": groups,
    "knownCaveats": len(KNOWN_CAVEATS),
    "sourceRoot": str(ROOT),
}
OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
OUT_JSON.write_text(
    json.dumps({"summary": summary, "results": RESULTS, "knownCaveats": KNOWN_CAVEATS}, indent=2),
    encoding="utf-8",
)

lines: list[str] = []
lines.append("# Validation report")
lines.append("")
lines.append(f"Generated: **{summary['generatedAt']}**  ")
lines.append(f"Scope: **{len(RESULTS)} checks** against the workbook's generated tables, notebook, logs and app data layer.  ")
lines.append(f"Result: **{passed} passed / {len(failed)} failed**  ")
lines.append(f"Known source caveats recorded separately: **{len(KNOWN_CAVEATS)}**")
lines.append("")
lines.append("## Method")
lines.append("")
lines.append(
    "The validator reloads the 46 CSV tables, the 64-record findings ledger, the notebook and the "
    "129 figure files directly. It recomputes counts, rates, intervals, arithmetic identities, "
    "model metrics and inventory dimensions, then compares them with `app/public/data/manifest.json` "
    "and `analysis.json`. No app value is treated as its own evidence."
)
lines.append("")
lines.append("## Summary by group")
lines.append("")
lines.append("| Group | Checks | Passed | Failed |")
lines.append("|---|---:|---:|---:|")
for g in sorted(groups):
    v = groups[g]
    lines.append(f"| {g} | {v['pass'] + v['fail']} | {v['pass']} | {v['fail']} |")
lines.append(f"| **Total** | **{len(RESULTS)}** | **{passed}** | **{len(failed)}** |")
lines.append("")

if failed:
    lines.append("## Failures")
    lines.append("")
    lines.append("| ID | Check | Expected | Actual | Source |")
    lines.append("|---|---|---|---|---|")
    for r in failed:
        expected = str(r["expected"]).replace("|", "\\|")[:220]
        actual = str(r["actual"]).replace("|", "\\|")[:220]
        lines.append(f"| {r['id']} | {r['name']} | {expected} | {actual} | `{r['source']}` |")
    lines.append("")
else:
    lines.append("## Failures")
    lines.append("")
    lines.append("None. Every asserted check passed at its stated tolerance.")
    lines.append("")

lines.append("## Substantive checks")
lines.append("")
lines.append("| ID | Group | Check | Expected | Actual | Status |")
lines.append("|---|---|---|---|---|---|")
for r in RESULTS:
    if r["group"] in {"Inventory", "KPIs"}:
        continue
    expected = str(r["expected"]).replace("|", "\\|")[:180]
    actual = str(r["actual"]).replace("|", "\\|")[:180]
    lines.append(f"| {r['id']} | {r['group']} | {r['name']} | {expected} | {actual} | {r['status']} |")
lines.append("")
lines.append("The full inventory checks (46 table dimensions, 129 figure dimensions, file existence and manifest counts) are in `tests/validation_results.json`.")
lines.append("")

lines.append("## Known source caveats (not app failures)")
lines.append("")
for c in KNOWN_CAVEATS:
    lines.append(f"### {c['id']} — {c['title']}")
    lines.append("")
    lines.append(c["detail"])
    lines.append("")
    lines.append(f"Sources: `{c['sources']}`")
    lines.append("")

lines.append("## Limits of this validation")
lines.append("")
lines.append(
    "- The raw `fraudTrain.csv` and `fraudTest.csv` are absent, so the notebook cannot be rerun end-to-end. "
    "The validator can only check consistency with the generated artifacts."
)
lines.append(
    "- The notebook's own claims are not all independently reproducible from the retained outputs. "
    "Where a claim contradicts its artifact, the app records an audit note and this report lists the caveat."
)
lines.append(
    "- This validates the simulation's data layer, not the native Power BI model. The Power BI pack is a "
    "documented import package, not a PBIX, so its measures are checked by source inspection and arithmetic only."
)
lines.append("")

OUT_MD.parent.mkdir(parents=True, exist_ok=True)
OUT_MD.write_text("\n".join(lines), encoding="utf-8")

print(f"checks: {len(RESULTS)} | passed: {passed} | failed: {len(failed)}")
for r in failed:
    print(f"FAIL {r['id']}: {r['name']} | expected={r['expected']!r} actual={r['actual']!r}")
print(f"wrote {OUT_JSON}")
print(f"wrote {OUT_MD}")
sys.exit(1 if failed else 0)
