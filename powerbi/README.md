# Power BI import pack — Fraud Evidence Console

**Version 2.0.0** · generated 2026-10-20 · 70 CSV tables · 137 DAX measures · 33 relationships · 19 page specifications

This folder is an **import-ready reproduction pack** for the fraud-evidence research run. It is **not a PBIX/PBIP file**. No Power BI authoring tools are installed in this workspace, so the native report has not been built, opened, or tested here. The React app at `../app/` is the functional, tested simulation; this pack is the path to rebuild it in Power BI Desktop.

## What is in the pack

| Path | Contents |
|---|---|
| `manifest.json` | Pack metadata, 70 table schemas/row counts, 33 relationships, 19 page definitions, date-table metadata, caveats |
| `data/*.csv` | 14 dimensions + 56 facts, UTF-8 with BOM (~640 KB) |
| `dax/measures.dax` | 137 measures in nine display groups |
| `theme/fraud_evidence_theme.json` | Warm-paper theme matching the React console |
| `pages/page_spec.md` | 1440 × 900 layout for all 19 pages, with fields, measures, interactions and image fallbacks |
| `relationships.md` | Model shape, table grain, relationships, DAX placement, reconciliation checks |
| `build_powerbi_pack.py` | Regenerates every CSV and the manifest from the app data and source tables |

## Quick start

1. Open Power BI Desktop.
2. **Get data → Text/CSV** → import every file in `data/`.
3. Use **UTF-8** encoding; set Date/Decimal/Whole-number types in Power Query.
4. Create the 33 relationships in `relationships.md`.
5. Mark `dim_date` as the date table using `dim_date[date]`.
6. Add the measures from `dax/measures.dax`.
7. Import `theme/fraud_evidence_theme.json`.
8. Build the 19 pages from `pages/page_spec.md`.
9. Reconcile the headline values using `relationships.md` §6.

## Data model at a glance

- **Rows:** 6,574 across 70 CSVs.
- **Dimensions:** `dim_date` (734 days), `dim_week` (105 weeks), `dim_phase` (P0–P8 + setup), `dim_rq` (8), `dim_grade` (4), `dim_page` (19), `dim_split` (4), `dim_category` (14), `dim_segment` (3), `dim_psi_verdict` (3), plus the Phase 2 dimensions `dim_insight_scope` (8), `dim_experiment_group` (5), `dim_provenance_status` (2), `dim_node_type` (11).
- **Facts:** 56 pre-aggregated snapshots. The largest are `fact_log_pattern` (629), `fact_lineage_edge` (374), `fact_lineage_node` (292), `fact_artifact_provenance` (182), `fact_metric_catalog` (155), `fact_card_profile` (999), `fact_city` (836), `fact_merchant` (693), `fact_zip3` (532).
- **No transaction rows.** The source `fraudTrain.csv` and `fraudTest.csv` are absent. Every fact is an aggregate, inventory, model result, report metric or console rule. Never add counts across facts.

### Date table

`dim_date[week_end]` is a **many-to-one** relationship to `dim_week[week_end]`, with **bidirectional** cross-filtering. A slicer on `dim_date[date]` filters the weekly series through this bridge. This is the only bidirectional relationship and the only relationship touching `dim_date`, so it does not create an ambiguous filter path. The date table covers 2019-01-01 through 2021-01-03, including the final partial week ending 2021-01-03 (18,921 transactions, 0 fraud). The boundary week ending 2020-06-21 straddles the train/test cut and is marked partial.

## Measures

The 137 measures are grouped as follows:

| Group | Measures |
|---|---:|
| Headline / split | 7 |
| Data audit | 10 |
| Weekly trend | 14 |
| Model / drift | 23 |
| Economics | 25 |
| Findings / inventories | 16 |
| Cards / risk signals | 13 |
| Display helpers | 4 |
| Phase 2 evidence layer | 25 |

Highlights: `[Transactions (Overall)]` 1,852,394; `[Observed Fraud Rate]` 0.5210%; `[Full Model PR-AUC]` 0.5575; `[Walk-Forward Mean Validation PR-AUC]` 0.9510; `[Walk-Forward Mean Test PR-AUC]` 0.4726; `[Capture at 1% Budget]` 0.6545; `[Cost-Min Total Loss ($5/FP)]` $193,653.87; `[Insights in View]` 15; `[Flagged Anomalies]` 10; `[Verified Provenance %]` 95.05%.

The DAX library deliberately handles three source traps:

1. **Ablation delta column:** the source `delta_pr_auc` is relative to raw-only. `fact_ablation[delta_vs_full]` is the recomputed difference from FULL. `[PR-AUC Delta vs Full]` uses the correct column.
2. **Threshold cost units:** `fact_threshold[fp_cost_total]` is total cost at $5/FP, not a per-FP input. Use `[Selected FP Cost]` for what-if re-pricing.
3. **Pre-aggregated facts:** `[Transactions (Overall)]` removes filters and reads only the `overall` row. Do not sum transaction counts across overlapping snapshots.

## The 19 pages

| Page | Title | Native focus |
|---|---|---|
| PAGE-01 | Overview | scale, model vs transfer, risk concentration |
| PAGE-02 | Data audit | schema, missingness, contracts, generator forensics |
| PAGE-03 | Distributions | amount quantiles, category rates, effect sizes |
| PAGE-04 | Interactions | card concentration, combinations, geography |
| PAGE-05 | Temporal | weekly rate, hazard, STL, 48-second boundary |
| PAGE-06 | Advanced viz | anomaly AUC, embeddings, clusters |
| PAGE-07 | Statistics | effect sizes, Cramér's V, cluster-robust logit |
| PAGE-08 | Feature lab | velocity, hazard, merchant EB, PSI |
| PAGE-09 | Model | ablation, walk-forward, PSI, calibration, segments |
| PAGE-10 | Economics | capture@k, thresholds, FP-cost sensitivity |
| PAGE-11 | Findings | 64 findings, grades, 5 audit notes, 16 issues |
| PAGE-12 | Artifacts | 129 figures, 7 HTML, 46 tables, 66 cells |
| PAGE-13 | Insights | deterministic statements, anomaly watch, evidence grades |
| PAGE-14 | Experiments | variant comparison inside one evaluation family |
| PAGE-15 | Run logs | classified events, message patterns, warning families |
| PAGE-16 | Evidence map | lineage nodes and verified/inferred edges |
| PAGE-17 | Data explorer | table profiling and column-level quality |
| PAGE-18 | Metric catalog | one definition, formula, source and caveat per metric |
| PAGE-19 | Program profile | research questions, phase dossiers, reproducibility |

Full layout, fields and measures are in `pages/page_spec.md`.

## Phase 2 additions (v2.0.0)

The Phase 2 console added seven routes and a reproducible evidence layer. The pack mirrors that layer so the Power BI model and the React app cannot silently drift:

| New table | Rows | Grain |
|---|---:|---|
| `fact_insight` | 15 | one deterministic insight statement |
| `fact_anomaly_flag` | 10 | one flagged observation (weekly, drift or export) |
| `fact_artifact_provenance` | 182 | one artifact with its producing cell |
| `fact_metric_catalog` | 155 | one catalogued metric |
| `fact_log_pattern` | 629 | one normalised message signature |
| `fact_lineage_node` | 292 | one node in the evidence graph |
| `fact_lineage_edge` | 374 | one edge in the evidence graph |
| `fact_experiment` (extended) | 26 | now carries `group_id` and `rank_in_group` |

The new dimensions (`dim_insight_scope`, `dim_experiment_group`, `dim_provenance_status`, `dim_node_type`) support slicers for scope, evaluation family, provenance status and node type.

**Semantic rules carried into the model:**

- `fact_insight` and `fact_anomaly_flag` are deterministic rules, not generated prose. Each row carries its method, threshold, reference population and a "not a proof" boundary.
- `fact_lineage_edge.is_verified = FALSE` marks an inferred edge. Keep the distinction in any visual that draws the graph.
- `fact_experiment.group_id` is the comparison unit. Comparing PR-AUC across two different `group_id` values is not a controlled comparison, and the DAX library does not attempt to hide that.
- `fact_metric_catalog` is the single source for metric definitions; use it instead of re-deriving a metric inside Power Query.

## Important caveats

- **Not a PBIX.** The pack has not been opened in Power BI Desktop. DAX has been source-inspected, not executed in a Tabular engine.
- **OOD test metrics.** The test split begins 48 seconds after the train split. `PR-AUC 0.5575` is a cross-boundary transfer estimate, not production generalization. Walk-forward `0.9510` is the in-domain estimate.
- **Raw data absent.** `fraudTrain.csv` and `fraudTest.csv` are referenced by hash/size but not present. The pack cannot rebuild the notebook from raw data.
- **Simulator artifacts.** 97.7% of cards see at least one fraud; the generator jitters merchant coordinates per transaction, so `dist_km` is not physical geography. Do not transfer card-level or geographic priors to production.
- **Pre-aggregated facts.** Do not infer transaction-level drill-through that the pack cannot support.
- **No native AI/ML evaluation.** The Power BI model is descriptive; it does not retrain or score transactions.
- **Anomalies are flags, not verdicts.** `fact_anomaly_flag` records what crossed a stated rule; it does not assert a defect.

## Regeneration

```powershell
python powerbi\build_powerbi_pack.py
```

The script rereads `app/public/data/manifest.json`, `analysis.json`, `app/public/data/phase2/*.json` and `tables/*.csv`, therefore rerun `python analytics\build_phase2_data.py` first if the Phase 2 evidence layer changed. The script rewrites the 70 CSVs and `manifest.json`; it does **not** overwrite `dax/measures.dax`, the theme, page spec, or this README. Those are authored artifacts and should be updated deliberately.

## Validation status

The underlying data layer is validated by `tests/validate_metrics.py` and `tests/validate_phase2.py`. The Power BI pack itself is validated by schema/row/relationship counts and source inspection only; it has not been executed in Power BI. See `../reports/validation_report.md` and `../reports/metric_catalog.csv`.

## Attribution and scope

Source dataset: `kartik2112/fraud-detection` (Sparkov simulator), analyzed by the project notebook. The pack derives from generated research artifacts, not the raw Kaggle files. It is reproduced for analytical review and demonstration; no production deployment claim is made.
