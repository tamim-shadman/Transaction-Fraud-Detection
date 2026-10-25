# Power BI semantic model and relationships

Pack version **2.0.0** · 70 CSV tables · 33 relationships · 137 measures

This guide is for rebuilding the Fraud Evidence Console in Power BI Desktop. It describes a star-style semantic model built from the **pre-aggregated research artifacts**, not from transaction rows. Treat every fact as a snapshot.

## 1. Model shape

```
dim_phase ─┬─ fact_finding
           ├─ fact_table
           ├─ fact_artifact
           ├─ fact_issue
           ├─ fact_audit_note
           ├─ fact_warning
           ├─ fact_insight
           ├─ fact_anomaly_flag
           └─ fact_artifact_provenance

dim_rq ─┬── fact_finding
        ├── fact_insight
        └── fact_artifact_provenance
dim_grade ─── fact_finding
dim_page ─┬── fact_kpi
          ├── fact_experiment
          ├── fact_insight
          ├── fact_anomaly_flag
          ├── fact_artifact_provenance
          ├── fact_metric_catalog
          ├── fact_log_pattern
          ├── fact_lineage_node
          └── fact_lineage_edge
dim_split ─── fact_class_balance
dim_week ──── fact_weekly_rate
dim_date ──*:1── dim_week        (date table; relationship on week_end)
dim_category ─┬─ fact_category
              └─ fact_money_category
dim_segment ─── fact_segment_error
dim_psi_verdict ─── fact_psi
dim_insight_scope ─── fact_insight
dim_experiment_group ─── fact_experiment
dim_provenance_status ─── fact_artifact_provenance
dim_node_type ─── fact_lineage_node
```

Thirty-two of the 33 relationships are single-direction filters from dimension to fact. The one exception is the date bridge, `dim_date[week_end]` **\*:1** `dim_week[week_end]`, which must be **bidirectional** so that a slicer on `dim_date[date]` can reach `dim_week`. Do not enable bidirectional filtering anywhere else. The semantic layer is intentionally shallow; most facts are standalone snapshots and should not be forced into relationships that would imply a shared transaction grain.

### Date table

| Setting | Value |
|---|---|
| Mark as date table | `dim_date[date]` |
| Range | 2019-01-01 through 2021-01-03 (734 days) |
| Active relationship | `dim_date[week_end]` **\*:1** `dim_week[week_end]` |
| Filter direction | **Both**: `dim_date[date]` filters `dim_week[week_end]`, which then filters `fact_weekly_rate[week_end]` |
| Sort | `dim_date[date]`; `dim_week[week_end]` by `dim_week[sort_order]` |

`dim_date` has one row per calendar day and `week_end` repeats for the seven days in each week. That is why the relationship to `dim_week` is **many-to-one** (`dim_date` is on the many side). A slicer on `dim_date[date]` must propagate from the many side to the one side, so this single relationship is set to **bidirectional**. It is the only relationship touching `dim_date`, so no ambiguous filter path is created. This design lets a date slicer filter the 105-point weekly series without inventing daily fraud facts or joining daily dates directly to the pre-aggregated weekly fact.

The final week ending **2021-01-03** is a partial zero-fraud edge week. It has 18,921 transactions and 0 frauds. `dim_week[is_partial] = TRUE` marks it. Exclude partial weeks from train/test means. The week ending 2020-06-21 straddles the 48-second train/test boundary and is also flagged `is_partial = TRUE` in `dim_week`; use the full-week filters in the DAX library.

## 2. Tables and grain

### Dimensions (14)

| Table | Rows | Grain / key | Notes |
|---|---:|---|---|
| `dim_phase` | 10 | One row per P0–P8 + setup | Phase names, purpose, counts, accent; `is_report_phase` for P8 |
| `dim_rq` | 8 | One row per RQ1–RQ8 | Question text and grade counts |
| `dim_grade` | 4 | One row per grade | strong / supports / caveat / weak; definitions |
| `dim_page` | 19 | One row per report page | PAGE-01–PAGE-19, route, purpose, target size |
| `dim_split` | 4 | split label | overall / train / test / boundary metadata |
| `dim_category` | 14 | merchant category | sort order and online flag |
| `dim_segment` | 3 | category / hour / state | segment families for error table |
| `dim_psi_verdict` | 3 | severe / moderate / stable | PSI rule and color |
| `dim_week` | 105 | week ending date | ISO year/week, month, split, partial flag |
| `dim_date` | 734 | calendar date | date table; maps to week end |
| `dim_insight_scope` | 8 | insight scope | data / drift / economics / evidence / features / logs / model / temporal |
| `dim_experiment_group` | 5 | evaluation family | group label, metric, `is_comparable`, basis and limitations |
| `dim_provenance_status` | 2 | verified / inferred | the rule that defines each status |
| `dim_node_type` | 11 | lineage node type | node count for the evidence map |

### Facts (56)

| Table | Rows | Grain | Primary consumer |
|---|---:|---|---|
| `fact_kpi` | 10 | One row per headline KPI | Overview, display helpers |
| `fact_class_balance` | 3 | split + overall | Data audit, headline |
| `fact_weekly_rate` | 105 | week | Temporal, Overview |
| `fact_finding` | 64 | finding | Findings, Overview |
| `fact_experiment` | 26 | experiment | Model, advanced experiment catalog |
| `fact_ablation` | 6 | model variant | Model |
| `fact_walkforward` | 4 | fold | Model |
| `fact_psi` | 27 | feature | Model, Feature lab |
| `fact_capture` | 5 | budget | Economics |
| `fact_threshold` | 3 | operating point | Economics |
| `fact_cost_sensitivity` | 5 | FP-cost scenario | Economics |
| `fact_category` | 14 | category | Distributions, Statistics |
| `fact_money_category` | 14 | category | Distributions, Interactions |
| `fact_quantile` | 9 | quantile | Distributions |
| `fact_card_profile` | 999 | card | Interactions |
| `fact_hazard` | 24 | months since first observed transaction | Feature lab, Temporal |
| `fact_speed` | 5 | speed band | Feature lab |
| `fact_high_risk_combo` | 5 | risk segment | Overview, Interactions |
| `fact_segment_error` | 63 | segment | Model |
| `fact_issue` | 16 | issue | Findings, Handoff |
| `fact_audit_note` | 5 | audit note | Findings |
| `fact_warning` | 9 | run warning | Artifacts, Logs |
| `fact_table` | 46 | source table | Artifacts |
| `fact_artifact` | 136 | figure or HTML artifact | Artifacts |
| `fact_notebook_cell` | 66 | notebook cell | Artifacts, Logs |
| `fact_checklist` | 11 | reproducibility item | Artifacts |
| `fact_missing_column` | 11 | missing column | Data audit |
| `fact_contract` | 10 | contract | Data audit |
| `fact_data_quality` | 10 | quality metric | Data audit |
| `fact_learning_curve` | 5 | training fraction | Model |
| `fact_leave_card_out` | 3 | slice | Model |
| `fact_calibration` | 1 | calibration run | Model |
| `fact_ensemble` | 2 | model | Model |
| `fact_monotonic` | 2 | model | Model |
| `fact_time_decay` | 2 | model | Model |
| `fact_source` | 6 | source artifact | Data audit |
| `fact_schema` | 72 | column | Data audit |
| `fact_generator` | 7 | generator metric | Data audit |
| `fact_anomaly` | 3 | anomaly model | Advanced |
| `fact_cluster` | 5 | cluster method/label | Advanced |
| `fact_embedding` | 7 | embedding | Advanced |
| `fact_effect_size` | 11 | feature | Statistics, Distributions |
| `fact_chi2` | 5 | variable | Statistics |
| `fact_logit` | 9 | term | Statistics |
| `fact_posthoc` | 72 | category pair | Statistics |
| `fact_hour_encoding` | 3 | encoding | Feature lab |
| `fact_merchant` | 693 | merchant | Interactions, Feature lab |
| `fact_city` | 836 | city | Interactions |
| `fact_zip3` | 532 | ZIP3 | Interactions |
| `fact_insight` | 15 | deterministic insight statement | Insights |
| `fact_anomaly_flag` | 10 | flagged observation | Insights |
| `fact_artifact_provenance` | 182 | artifact + producing cell | Artifacts, Evidence map |
| `fact_metric_catalog` | 155 | catalogued metric | Metric catalog |
| `fact_log_pattern` | 629 | normalised message signature | Run logs |
| `fact_lineage_node` | 292 | graph node | Evidence map |
| `fact_lineage_edge` | 374 | graph edge | Evidence map |

**Grain warning:** `fact_class_balance` is the only fact with overall/train/test totals. Do not add transaction counts from `fact_weekly_rate`, `fact_card_profile`, `fact_city`, or `fact_zip3` together; those are overlapping slices/snapshots. The DAX measures guard the headline totals with `REMOVEFILTERS` and explicit `overall` filters.

**Table snapshot warning:** `fact_table`, `fact_artifact`, `fact_notebook_cell`, `fact_finding`, `fact_issue`, `fact_audit_note`, and `fact_warning` are inventories. Their row counts are not additive transaction measures. They are descriptive catalogs.

## 3. Relationship table

Import the CSVs, then create exactly these relationships. All are active and single-direction unless noted.

| # | From | To | Cardinality | Filter | Purpose |
|---:|---|---|---|---|---|
| 1 | `dim_phase[phase_id]` | `fact_finding[phase_id]` | 1:* | single | findings by phase |
| 2 | `dim_phase[phase_id]` | `fact_table[phase_id]` | 1:* | single | source tables by phase |
| 3 | `dim_phase[phase_id]` | `fact_artifact[phase_id]` | 1:* | single | figures/HTML by phase |
| 4 | `dim_phase[phase_id]` | `fact_issue[phase_id]` | 1:* | single | issues by phase |
| 5 | `dim_phase[phase_id]` | `fact_audit_note[phase_id]` | 1:* | single | audit notes by phase |
| 6 | `dim_phase[phase_id]` | `fact_warning[phase_id]` | 1:* | single | warnings by phase |
| 7 | `dim_rq[rq_id]` | `fact_finding[rq_id]` | 1:* | single | findings by research question |
| 8 | `dim_grade[grade]` | `fact_finding[grade]` | 1:* | single | findings by grade |
| 9 | `dim_page[page_id]` | `fact_kpi[primary_page_id]` | 1:* | single | KPI ownership |
| 10 | `dim_page[page_id]` | `fact_experiment[primary_page_id]` | 1:* | single | experiment ownership |
| 11 | `dim_split[split]` | `fact_class_balance[split]` | 1:* | single | split class balance |
| 12 | `dim_week[week_end]` | `fact_weekly_rate[week_end]` | 1:* | single | weekly trend |
| 13 | `dim_date[week_end]` | `dim_week[week_end]` | *:1 | **both** | date slicer on `dim_date[date]` → week → weekly fact; the only bidirectional relationship |
| 14 | `dim_category[category]` | `fact_category[category]` | 1:* | single | category rates |
| 15 | `dim_category[category]` | `fact_money_category[category]` | 1:* | single | category dollars |
| 16 | `dim_segment[segment]` | `fact_segment_error[segment]` | 1:* | single | segment errors |
| 17 | `dim_psi_verdict[verdict]` | `fact_psi[verdict]` | 1:* | single | PSI severity |
| 18 | `dim_insight_scope[scope]` | `fact_insight[scope]` | 1:* | single | insights by scope |
| 19 | `dim_phase[phase_id]` | `fact_insight[phase_id]` | 1:* | single | insights by phase |
| 20 | `dim_rq[rq_id]` | `fact_insight[rq_id]` | 1:* | single | insights by research question |
| 21 | `dim_phase[phase_id]` | `fact_anomaly_flag[phase_id]` | 1:* | single | anomaly flags by phase |
| 22 | `dim_phase[phase_id]` | `fact_artifact_provenance[phase_id]` | 1:* | single | artifact provenance by phase |
| 23 | `dim_rq[rq_id]` | `fact_artifact_provenance[primary_rq_id]` | 1:* | single | artifact provenance by research question |
| 24 | `dim_provenance_status[provenance]` | `fact_artifact_provenance[provenance]` | 1:* | single | verified vs inferred artifacts |
| 25 | `dim_page[page_id]` | `fact_metric_catalog[primary_page_id]` | 1:* | single | metric catalog ownership |
| 26 | `dim_page[page_id]` | `fact_insight[primary_page_id]` | 1:* | single | insight page ownership |
| 27 | `dim_page[page_id]` | `fact_anomaly_flag[primary_page_id]` | 1:* | single | anomaly page ownership |
| 28 | `dim_page[page_id]` | `fact_artifact_provenance[primary_page_id]` | 1:* | single | artifact page ownership |
| 29 | `dim_page[page_id]` | `fact_log_pattern[primary_page_id]` | 1:* | single | log pattern page ownership |
| 30 | `dim_page[page_id]` | `fact_lineage_node[primary_page_id]` | 1:* | single | lineage node page ownership |
| 31 | `dim_page[page_id]` | `fact_lineage_edge[primary_page_id]` | 1:* | single | lineage edge page ownership |
| 32 | `dim_experiment_group[group_id]` | `fact_experiment[group_id]` | 1:* | single | experiment family (the comparison unit) |
| 33 | `dim_node_type[node_type]` | `fact_lineage_node[node_type]` | 1:* | single | lineage nodes by type |

### Deliberately absent relationships

- No relationship from `dim_category` to `fact_merchant`: `fact_merchant` has no category key. Add one only after a verified merchant→category mapping; the source is near-deterministic but not strictly single-category.
- No relationship from `dim_week` to `fact_hazard`: hazard is indexed by months since first observed transaction, not calendar week.
- No relationship from `dim_split` to model facts: model tests are fixed-scope OOD estimates, not filterable by train/test.
- No transaction-level fact: source transactions are absent. Do not create a fake transaction table.
- No relationship from `dim_date` to `fact_class_balance`: class balance has no date key.
- No relationship between `fact_lineage_node` and `fact_lineage_edge`: the edge table carries `from_node` / `to_node` as text keys, and a self-join would create an ambiguous path. Model the graph in a custom visual from the two tables rather than forcing a relationship.
- No relationship from `dim_week` to `fact_anomaly_flag`: only the weekly anomaly rows carry a week, and mixing them with drift and export flags under one date context would imply they share a time axis.

## 4. DAX placement and measure groups

`dax/measures.dax` contains **137 measures**. Home tables are organizational only:

| Group | Measures | Home table |
|---|---:|---|
| Headline / split | 7 | `fact_class_balance`, `fact_kpi`, `fact_finding`, `fact_capture` |
| Data audit | 10 | `fact_data_quality`, `fact_schema`, `fact_missing_column`, `fact_contract` |
| Weekly trend | 14 | `fact_weekly_rate`, `dim_week`, `fact_hazard` |
| Model / drift | 23 | `fact_ablation`, `fact_walkforward`, `fact_psi`, `fact_calibration`, `fact_learning_curve`, `fact_leave_card_out` |
| Economics | 25 | `fact_capture`, `fact_threshold`, `fact_cost_sensitivity`, `fact_segment_error` |
| Findings / inventories | 16 | `fact_finding`, `fact_audit_note`, `fact_issue`, `fact_artifact`, `fact_table`, `fact_notebook_cell`, `fact_warning` |
| Cards / risk signals | 13 | `fact_card_profile`, `fact_high_risk_combo`, `fact_quantile`, `fact_effect_size`, `fact_speed` |
| Display helpers | 4 | `fact_kpi`, `fact_capture`, `fact_psi` |
| Phase 2 evidence layer | 25 | `fact_insight`, `fact_anomaly_flag`, `fact_artifact_provenance`, `fact_metric_catalog`, `fact_log_pattern`, `fact_lineage_node`, `fact_lineage_edge`, `fact_experiment` |

The nine groups total **137 measures**.

### Critical filters

- `[Transactions (Overall)]` removes `dim_split` and filters `fact_class_balance[split] = "overall"`. Do not use it as a visual-level total when a split slicer is active without a scope label.
- `[Full Model PR-AUC]` removes `fact_ablation` filters and takes `is_full = TRUE`. `[Selected Model PR-AUC]` requires a single selected variant.
- `[Cost-Min *]` removes `fact_threshold` filters and uses `is_cost_min = TRUE`; do not rely on the visual row order.
- `[Selected FP Cost]` defaults to $5 when no cost scenario is selected. The stored $5 total loss is not a per-FP parameter.
- `[7-Week Moving Avg Fraud Rate]` uses the max visible week and a 42-day lookback; with fewer than seven weeks it returns a partial average and should be labelled.
- `[Edge Week Fraud Events]` filters `dim_week[is_partial] = TRUE`; it includes both the boundary week and the final edge week, so use it only with a date context or explicit label.
- `[Experiments in Group]` and `[Best PR-AUC in Group]` use `ALLEXCEPT` on `fact_experiment[group_id]`. A visual must carry a `group_id` context; if two groups are selected the measure still returns a maximum, so label the visual with the group.
- `[Verified Provenance %]` divides the verified artifact count by all artifacts. It is a coverage measure, not a quality score.

## 5. Build steps

1. Open Power BI Desktop → **Get data** → **Text/CSV**.
2. Import all files from `data/` with **UTF-8** encoding and **Transform Data**.
3. In Power Query, set `date`, `week_end`, and `ts` fields to Date/DateTime; set `*_pct`, `*_rate`, `psi`, `pr_auc`, `roc_auc`, `threshold`, `usd_*`, `expected_loss`, `total_loss`, `missed_usd` to Decimal Number; set counts to Whole Number.
4. Close & Apply.
5. Create the 33 relationships in the order above.
6. Mark `dim_date` as a date table.
7. Add the measures from `dax/measures.dax` (Tabular Editor 2/3 or the DAX editor).
8. Set number formats:
   - Rates: percentage, 2–4 decimals.
   - PR-AUC/ROC-AUC: decimal, 4 decimals.
   - PSI: decimal, 3 decimals.
   - USD: `$#,##0`.
   - Counts: `#,##0`.
9. Import `theme/fraud_evidence_theme.json`.
10. Build the 19 pages from `pages/page_spec.md`.
11. Run the reconciliation checks below.

## 6. Reconciliation checks

Before calling the model validated, check these in Power BI Desktop:

| Check | Expected |
|---|---|
| `[Transactions (Overall)]` | 1,852,394 |
| `[Fraud Events (Overall)]` | 9,651 |
| `[Observed Fraud Rate]` | 0.5210% |
| `[Analytical Columns]` | 71 |
| `[Missing Columns]` | 11 |
| `[Max Missing %]` | 10.79% |
| `[Duplicate Transaction IDs]` | 0 |
| `[Contracts Passed]` / `[Contracts Flagged]` | 7 / 1 (plus two INFO contracts) |
| `[Train Full-Week Mean Rate]` | 0.6026% |
| `[Test Full-Week Mean Rate]` | 0.4248% |
| `[Full Model PR-AUC]` | 0.5575 |
| `[Full Model ROC-AUC]` | 0.9677 |
| `[Walk-Forward Mean Validation PR-AUC]` | 0.9510 |
| `[Walk-Forward Mean Test PR-AUC]` | 0.4726 |
| `[Walk-Forward OOD Gap]` | 0.4785 |
| `[Severe PSI Features]` / `[Moderate PSI Features]` / `[Stable PSI Features]` | 7 / 1 / 19 |
| `[PSI Severe or Moderate Share]` | 29.6% |
| `[Capture at 1% Budget]` | 0.6545 |
| `[Cost-Min Threshold]` | 0.00001 |
| `[Cost-Min Recall]` / `[Cost-Min Precision]` | 0.8424 / 0.0817 |
| `[Cost-Min Total Loss ($5/FP)]` | 193,653.87 |
| `[F1-Max F1]` | 0.5504 |
| `[High-Risk Combo Lift]` | 42.37 |
| `[Cards Ever Fraud]` / `[Cards Never Fraud]` / `[Cards 100% Fraud]` | 976 / 23 / 91 |
| `[Curated Issues]` / `[High-Severity Issues]` | 16 / 4 |
| `[Figures]` / `[Interactive Artifacts]` / `[Catalog Tables]` | 129 / 7 / 46 |
| `[Insights in View]` / `[Priority 1 Insights]` | 15 / 4 |
| `[Flagged Anomalies]` / `[Severe Anomalies]` | 10 / 7 |
| `[Weekly Rate Anomalies]` / `[Max Robust Z]` | 1 / 4.15 |
| `[Artifacts Traced]` / `[Verified Artifacts]` / `[Inferred Artifacts]` | 182 / 173 / 9 |
| `[Verified Provenance %]` | 95.05% |
| `[Metrics Catalogued]` / `[Validated Metrics]` / `[Metrics with Caveat]` | 155 / 118 / 16 |
| `[Lineage Nodes]` / `[Lineage Edges]` | 292 / 374 |
| `[Verified Edges]` / `[Inferred Edges]` | 365 / 9 |
| `[Repeated Patterns]` / `[Warning Patterns]` | 22 / 18 |

If a measure returns a blank, check the table filter context first — several measures intentionally require a single selected row or the `overall` row.

## 7. Why this is not a PBIX

This workspace has no Power BI authoring SDK or installed Power BI Desktop. The pack is a set of CSVs, DAX, theme JSON, page specifications, and this relationship guide. A `.pbix` cannot be opened, tested, or certified here. The React app is the functional simulation; the Power BI assets are the import-ready reproduction path.

Do not claim that the native model has been executed. The validation suite checks the source artifacts and arithmetic, not Power BI evaluation.
