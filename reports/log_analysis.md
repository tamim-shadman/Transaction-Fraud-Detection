# Log and execution analysis

Generated: **2026-10-20T17:57:53**

## Run summary

| Field | Value | Source |
|---|---|---|
| Run id | `RUN-20261020-1630` | `manifest.json` |
| Start | 2026-10-20T16:30:06 | `logs/findings.md` |
| End | 2026-10-20T18:01:59 | `logs/findings.md` |
| Wall clock | 5,513 s (91.9 min) | derived from timestamps |
| Seed | 42 | `manifest.json` |
| Mode | smoke=False, robustness=True | `manifest.json` |
| Platform | Google Colab | `manifest.json` |
| Python | 3.13.16 | `manifest.json` |

The run was not a smoke test: the robustness block (leave-card-out CV, calibration, cost sensitivity, PSI, walk-forward) executed. The 91.9-minute duration is consistent with the 5,513-second timestamp difference.

## Notebook execution

| Metric | Value |
|---|---:|
| Total cells | 66 |
| Code cells | 33 |
| Markdown cells | 33 |
| Executed code cells | 33 |
| Code cells with output | 31 |
| Code cells without output | 2 |
| Output objects | 58 |
| Stream outputs | 42 |
| Display-data outputs | 10 |
| Execute-result outputs | 6 |
| Error outputs | 0 |
| Captured stdout/stderr characters | 59,197 |

The two code cells without output are function-definition cells (Wilson interval and `save_fig`). There are **zero tracebacks and zero error outputs**; the notebook completed.

### Code cell map

| Cell | Exec | Phase | Outputs | Output types | First source line |
| ---: | ---: | :---: | ---: | --- | --- |
| 2 | 1 | — | 1 | stream | # ---- optional run knobs (uncomment + edit; must be set BEFORE the §0 |
| 4 | 2 | — | 3 | stream | # ============================================================ |
| 6 | 3 | — | 1 | stream | import os, gc, json, time, math, hashlib, warnings, importlib.util, sy |
| 8 | 4 | — | 1 | stream | RQ_TEXT = { |
| 10 | 5 | — | 0 | — | def wilson_interval(k, n, z=1.96): |
| 12 | 6 | — | 0 | — | def save_fig(fig, name, caption=None, tight=False): |
| 14 | 7 | P0 | 1 | stream | banner("SECTION 01 — DATA LOAD, FINGERPRINT, CONTRACTS") |
| 16 | 8 | P0 | 1 | stream | banner("SECTION 01b — DERIVED FEATURES (causal / leak-aware)") |
| 18 | 9 | P0 | 2 | execute_result, stream | banner("SECTION 01c — AUDIT & GENERATOR FORENSICS") |
| 20 | 10 | P1 | 2 | execute_result, stream | banner("SECTION 02 — UNIVARIATE") |
| 22 | 11 | P1 | 1 | stream | bar_volume_rate(df, "hour", "volume & fraud rate by hour of day", |
| 24 | 12 | P1 | 6 | display_data, execute_result, stream | # category: volume + sorted fraud rate (plan §3.3) |
| 26 | 13 | P1 | 2 | execute_result, stream | # city_pop: raw + log histograms; impossible values check (plan §3.4) |
| 28 | 14 | P2 | 1 | stream | banner("SECTION 03 — BIVARIATE") |
| 30 | 15 | P2 | 10 | display_data, stream | # Haversine distance cardholder→merchant (already derived in §01b) |
| 32 | 16 | P2 | 2 | execute_result, stream | fraud_rate_heat(df, "gender", "category", "fraud rate — gender × categ |
| 34 | 17 | P2 | 1 | stream | card = df.groupby("cc_num", observed=True).agg( |
| 36 | 18 | P2 | 1 | stream | SPEAR_COLS = ["log_amt", "hour", "dow", "month", "age", "city_pop_log" |
| 38 | 19 | P3 | 1 | stream | banner("SECTION 04 — TEMPORAL STRUCTURE") |
| 40 | 20 | P3 | 1 | stream | count_heat(df, "dow", "hour", "volume — hour × weekday", "phase3_hour_ |
| 42 | 21 | P4 | 3 | display_data, stream | banner("SECTION 05 — DIMENSIONALITY REDUCTION & EMBEDDINGS") |
| 44 | 22 | P4 | 1 | stream | from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering |
| 46 | 23 | P4 | 1 | stream | from sklearn.ensemble import IsolationForest |
| 48 | 24 | P4 | 2 | execute_result, stream | # ADDED (review): parallel coordinates for fraud vs non-fraud |
| 50 | 25 | P5 | 1 | stream | banner("SECTION 06 — STATISTICAL TESTS & EFFECT SIZES") |
| 52 | 26 | P6 | 1 | stream | banner("SECTION 07 — FEATURE ENGINEERING & DEPTH ANALYSES") |
| 54 | 27 | P6 | 1 | stream | # ---- cohort analysis (ADDED, review): cards grouped by first-transac |
| 56 | 28 | P7 | 1 | stream | banner("SECTION 08 — MODEL SUITE") |
| 58 | 29 | P7 | 1 | stream | from sklearn.metrics import (average_precision_score, roc_auc_score, r |
| 59 | 30 | P7 | 1 | stream | # v4 Task 8 (FIX #14, gated by RUN_ROBUSTNESS): leave-card-out CV — ne |
| 61 | 31 | P7 | 1 | stream | # ---- cost-sensitive analysis (ADDED, review): FP friction $ vs FN = |
| 63 | 32 | P7 | 2 | stream | # ---- SHAP with review fixes: 5k sample, 200-row background, max_eval |
| 65 | 33 | P8 | 4 | display_data, stream | banner("SECTION 09 — REPORT & REPRODUCIBILITY") |

## Warnings and non-fatal events

The notebook and manifest record **9** warnings. None stopped execution.

| ID | Phase | Category | Cell | Message |
| --- | :---: | --- | ---: | --- |
| WARN-01 | SETUP | Dependency | 4 | Plotly 5.24.1 is incompatible with Kaleido 1.5.0 |
| WARN-02 | P1 | Export | 24 | Static PNG skipped for phase1_state_rate_choro |
| WARN-03 | P1 | Export | 24 | Static PNG skipped for phase1_state_n_choro |
| WARN-04 | P2 | Export | 30 | Static PNG skipped for phase2_map_scatter |
| WARN-05 | P2 | Export | 30 | Static PNG skipped for phase2_state_eb_choro |
| WARN-06 | P2 | Export | 30 | Static PNG skipped for phase2_state_n_choro |
| WARN-07 | P2 | Export | 30 | Static PNG skipped for phase2_city_map |
| WARN-08 | P4 | Export | 42 | Static PNG skipped for phase4_pca_3d |
| WARN-09 | P7 | Explainability | 63 | SHAP background subsampled from 200 to 100 rows |

### What the warnings mean

- **Kaleido / Plotly incompatibility** explains seven “static PNG skipped” messages. Those artifacts remain available as interactive HTML (7 files) and are mirrored into the app; the missing static PNGs do not create a data gap.
- **SHAP background subsampling** (200 → 100 rows) is a performance trade-off. SHAP rankings remain directional evidence, not exact attribution.
- No warning indicates a corrupted table, a failed model fit or a missing required artifact.

## Reproducibility controls

The notebook writes an 11-item checklist and all items are true. The substantive controls are:

- global seed 42;
- sampling fractions recorded for every sampled visual;
- train/test time boundaries stated to the second;
- 16-character SHA-256 prefixes recorded for both raw files;
- environment snapshot written per run;
- effect sizes, confidence intervals and n reported with tests;
- DR hyperparameters reported;
- walk-forward CV used instead of a single carve-out;
- LightGBM determinism caveat recorded.

`tables/reproducibility_checklist.csv` has 11 rows, all `ok = True`. The checklist is a self-attestation by the notebook, not independent proof; the independent check is `tests/validate_metrics.py`.

## Source fingerprints

| File | Size (MB) | SHA-256 prefix | Present |
|---|---:|---|---|
| `fraudTrain.csv` | 351.2 | `fd7139200dbfcbed` | **No** |
| `fraudTest.csv` | 150.4 | `12d553ab19440c75` | **No** |

The prefixes are 16 hex characters, not full digests. They are sufficient to distinguish these files but not to prove byte identity against an external copy.

## Validation log

- Checks: **196**; passed **196**; failed **0**.
- Groups: Inventory 25/25, Data 73/73, Model 74/74, Findings 9/9, KPIs 10/10, Narrative 5/5.
- Recorded caveats: **11**.
- The validator reloads the 46 CSVs, the 64-finding ledger, the notebook and the 129 PNGs; it does not trust app JSON as evidence.

## Browser test log

- Route/viewport measurements: **39** across 5 viewports.
- Viewports: desktop (12), laptop (5), mobile (12), mobile-landscape (5), tablet (5).
- Maximum horizontal overflow: **0 px**.
- Canvas/container width mismatches: **0**.
- Console or page errors: **0**.
- Screenshots: 10 files covering 5 representative pages at desktop and mobile (plus `results.json`), stored in `tests/ui_check/`.

## Build log

- Vite modules transformed: **2,516**.
- Build time: **1.30 s**.
- Emitted asset size (uncompressed sum of JS/CSS/font chunks): **1,342.6 kB**.
- TypeScript check (`tsc --noEmit`) runs before Vite and passed.

## Artifact reconciliation

| Claim | Recorded | Observed | Status |
|---|---:|---:|---|
| Figures | 129 | 129 | PASS |
| Interactive HTML | 7 | 7 | PASS |
| CSV tables | 46 | 46 | PASS |
| Notebook cells | 66 | 66 | PASS |
| Findings | 64 | 64 | PASS |
| Bundle tables (notebook closing summary) | 45 | 46 | **FLAG** |

The notebook's closing summary says 45 tables; the workspace contains 46 because `figure_index.csv` is written after the summary is composed. The app and reports use the observed 46.

## Anomalies worth carrying forward

1. **Raw inputs absent.** The notebook cannot be rerun from this folder; only its outputs can be audited.
2. **Seven static PNGs skipped.** The interactive HTML versions exist; use them or accept the missing static exports.
3. **SHAP subsampling.** Attribution is based on 100 background rows, not the full sample.
4. **Calibration split.** Temperature scaling is fit on the early-stopping split, not the test set (CAV-08).
5. **Count drift.** 45 vs 46 tables is a composition-order bug, not a missing artifact.

## Log sources

- `logs/findings.md` — human-readable ledger and run header.
- `logs/findings_ledger.json` — 64 structured findings.
- `logs/data_fingerprint.json` — raw-file sizes and hash prefixes.
- `logs/env_snapshot.json` — pinned package versions.
- `logs/build.log` — Vite/TypeScript production build output.
- `logs/ui_smoke.log` — browser-matrix console table.
- `fraud_eda_colab(1).ipynb` — cell sources, outputs, execution counts.
- `tests/validation_results.json` — 196 independent checks.
- `tests/ui_check/results.json` — browser matrix measurements.
