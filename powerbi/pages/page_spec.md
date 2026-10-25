# Power BI page specification

**Fraud Evidence Console — native-report reproduction guide**  
Pack version **2.0.0** · 70 CSV tables · 137 DAX measures · 33 relationships · 19 pages · 1440 × 900 canvas

This specification describes how to rebuild the React evidence console as a native Power BI report. It is a build guide, not a claim that a PBIX has been produced. Every native visual below uses a table in `powerbi/data/`; where the retained source has only a rendered figure, the visual is explicitly marked **Image** and points at the original artifact under `figures/` (PNG and interactive HTML).

## 1. Build conventions

| Item | Decision |
|---|---|
| Canvas | 1440 × 900, 16:10; 12-column grid; 24 px outer margin; 16 px gutters |
| Page background | `#F5F1EA` (warm paper) |
| Visual surface | `#FFFDF9`; 1 px `#E5DED2` border; 8 px radius |
| Ink | `#101A2E` headings, `#1C2330` body, `#4E5563` secondary, `#7C7A73` muted |
| Accents | Indigo `#4F46E5`, cyan `#0E7490`, violet `#7C3AED`, fraud `#CB4257`, green `#1F8A70`, amber `#BD761B` |
| Fonts | Segoe UI Semibold titles; Segoe UI body; tabular figures for counts |
| Theme | Import `theme/fraud_evidence_theme.json` before laying out pages |
| Slicer placement | Left rail, 208 px wide, starting at y=152; sync slicers across pages |
| Page header | Page ID + title + primary question, 56 px; no decorative chartjunk |
| Page footer | `Source: generated artifacts · cross-boundary test metrics are OOD · not production validation` |
| Tooltips | Show raw numerator/denominator and source table; never show a rate without n |
| Default aggregation | `Do not summarize` on every identifier and on every pre-aggregated fact column |

### Global filters

Place these in a collapsible left filter rail and sync across pages where noted:

| Slicer | Table field | Sync pages | Notes |
|---|---|---|---|
| Split | `dim_split[split]` | 01–04, 07–08 | Overall/train/test; test is the default for model views |
| Phase | `dim_phase[phase_id]` | 02, 07–08, 11–12 | Canonical IDs P0–P8; P8 is report-only |
| Grade | `dim_grade[grade]` | 01, 11 | Strong / supports / weak / caveat |
| Research question | `dim_rq[rq_id]` | 11 | RQ1–RQ8 |
| Review budget | `fact_capture[budget_pct]` | 01, 10 | 0.1 / 0.5 / 1 / 2 / 5% |
| FP cost | `fact_cost_sensitivity[fp_cost]` | 10 | $1, $5, $10, $20, $50 sensitivity scenarios |
| Model variant | `fact_ablation[model]` | 09 | Six pre-computed ablations |
| PSI verdict | `fact_psi[verdict]` | 09 | severe / moderate / stable |

### Page navigation

Use a left-hand page navigator styled as buttons, mirroring the app: **Command** (Overview, Insights), **Evidence** (Data audit, Distributions, Interactions, Temporal, Advanced viz, Statistics, Feature lab), **Decision** (Model, Economics, Experiments), **Investigate** (Evidence map, Run logs, Data explorer), **Outputs** (Findings, Artifacts), **Reference** (Metric catalog, Program profile). Include the run ID `RUN-20261020-1630` and a **not a PBIX** disclaimer on the welcome/Overview page.

### Model prerequisites

1. Import all 70 CSVs using *Get Data → Text/CSV → UTF-8* and promote headers.
2. Set data types: dates as Date, `week_end` / `date` as Date, money as Fixed decimal, rates as Decimal, counts as Whole number.
3. Create the 33 relationships in `relationships.md`.
4. Mark `dim_date` as the date table (`dim_date[date]`).
5. Paste `dax/measures.dax` into the model; organize measures into display folders by page.
6. Disable auto date/time and auto-detect relationships.
7. Set `dim_date[date]` sort by itself, `dim_week[week_end]` sort by `sort_order`, and month labels by `month`.
8. Apply the theme; set page background and grid.

### Native vs image visuals

- **Native visuals** use the facts and dimensions. They remain filterable and cross-highlightable.
- **Image visuals** preserve a diagnostic whose underlying transaction-level inputs are absent (for example STL decomposition, UMAP/PCA projections, forest plots, heatmaps, SHAP).
- Do not place a native visual over a static image and imply that the image responds to slicers.
- Every image visual title includes the original filename, e.g. `figures/phase3_stl.png`.

---

## 2. Page specifications

### PAGE-01 · Overview

**Question:** What does the program establish, and how far does it transfer?  
**Phase tags:** P0, P1, P7 · **Target visuals:** 8

| # | Visual | Type | Fields / measures | Layout |
|---|---|---|---|---|
| 1 | Title and run context | Text box | Project title; `RUN-20261020-1630`; 1,852,394 transactions; 64 findings | x=24 y=24 w=720 h=92 |
| 2 | KPI strip | 5 cards | `[Transactions (Overall)]`, `[Observed Fraud Rate]`, `[Graded Findings]`, `[Full Model PR-AUC]`, `[Capture at 1% Budget]` | x=768 y=24 w=648 h=92 |
| 3 | Weekly fraud rate | Line chart | Axis `dim_week[week_end]`; values `[Weekly Fraud Rate]`; split by `dim_week[split]`; reference line at 0.5210% | x=24 y=140 w=892 h=258 |
| 4 | Transfer gap | Clustered bar | Axis `fact_walkforward[fold]`; values `[Walk-Forward Mean Validation PR-AUC]`, `[Walk-Forward Mean Test PR-AUC]`; callout `[Walk-Forward OOD Gap]` | x=936 y=140 w=480 h=258 |
| 5 | Risk concentration | Bar chart | Axis `fact_high_risk_combo[segment]`; values `fact_high_risk_combo[fraud_rate]`; tooltip n and `[High-Risk Combo Lift]` | x=24 y=418 w=600 h=244 |
| 6 | Finding grades | Donut | Legend `dim_grade[grade]`; values `[Graded Findings]`; colors from grade dimension | x=648 y=418 w=360 h=244 |
| 7 | Drift verdict | Card + text | `[PSI Severe or Moderate Share]`, `[Severe PSI Features]`, `[Moderate PSI Features]`, `[Maximum PSI]`; caveat that PSI is split drift, not production drift | x=1032 y=418 w=384 h=244 |
| 8 | Evidence strip | Text/table | 129 figures · 46 source tables · 7 interactive HTML · 196 validation checks · 5 audit notes · 16 issues | x=24 y=682 w=1392 h=170 |

**Interactions:** `dim_split[split]` and `dim_grade[grade]` filter cards 3, 5 and 6. The model cards ignore split (they are test-scope metrics). Do not allow a split slicer to change `[Full Model PR-AUC]` or `[Capture at 1% Budget]` without also showing the scope label.

**Narrative callout:** “The in-domain ranking is strong; the cross-boundary transfer estimate is much weaker. Never quote 0.5575 without the OOD qualifier.”

---

### PAGE-02 · Data audit

**Question:** Is the dataset trustworthy enough to analyse?  
**Phase tags:** P0 · **Target visuals:** 9

| # | Visual | Type | Fields / measures | Layout |
|---|---|---|---|---|
| 1 | Quality KPI strip | 5 cards | `[Transactions (Overall)]`, `[Analytical Columns]`, `[Missing Columns]`, `[Duplicate Transaction IDs]`, `[Flagged Contracts]` | x=24 y=24 w=1392 h=88 |
| 2 | Missingness by column | Horizontal bar | Axis `fact_missing_column[column]`; values `fact_missing_column[missing_pct]`; data label %; sort descending | x=24 y=132 w=660 h=302 |
| 3 | Class balance | Matrix/card | `fact_class_balance[split]`; `transaction_count`, `fraud_count`, `fraud_rate` | x=708 y=132 w=708 h=150 |
| 4 | Train/test boundary | Text/table | `fact_source` or a card: train end `2020-06-21 12:13:37`, test start `12:14:25`, gap 48 seconds | x=708 y=298 w=708 h=136 |
| 5 | Contract status | Table | `fact_contract[contract]`, `actual_value`, `status`; conditional color FLAG = red, PASS = green | x=24 y=452 w=708 h=300 |
| 6 | Contract pass/flag | Donut | `[Contracts Passed]`, `[Contracts Flagged]` | x=756 y=452 w=300 h=300 |
| 7 | Schema search | Table | `fact_schema` columns; filter by column name; show role and missing % | x=1080 y=452 w=336 h=300 |
| 8 | Generator forensics | Table | `fact_generator[metric]`, `value`; include merchant_single_category, zip3_state_purity, dist_km KS | x=24 y=770 w=660 h=106 |
| 9 | Source provenance | Table | `fact_source` name, role, present, MB, hash prefix | x=708 y=770 w=708 h=106 |

**Callouts:** raw Kaggle CSVs are absent; the audit is reproducible from retained artifacts only. 11 columns have structural missingness; `amt_z_prior` is the maximum at 10.79%. The age contract is flagged at 13.9 years. The 116,389 ZIP values below 10,000 are consistent with lost leading zeros, not a new finding.

**Interactions:** column search filters the schema table; contract status is not sliced by split because contracts describe the full frame.

---

### PAGE-03 · Distributions

**Question:** How far do fraud and genuine transactions separate on each axis?  
**Phase tags:** P1 · **Target visuals:** 9

| # | Visual | Type | Fields / measures | Layout |
|---|---|---|---|---|
| 1 | Amount KPI strip | 4 cards | `[Median Fraud Amount]` $390; `[Median Non-Fraud Amount]` $47.24; `[Amount KS D]` 0.7238; `[Amount Cliff's Delta]` 0.6686 | x=24 y=24 w=1392 h=88 |
| 2 | Amount quantile ladder | Line/table | `fact_quantile[quantile]`; `amount_fraud`, `amount_nonfraud`; log axis optional | x=24 y=132 w=600 h=300 |
| 3 | Fraud amount distribution | Image | `figures/phase1_amt_box_violin.png` + `phase1_amt_overlay.png` | x=648 y=132 w=360 h=300 |
| 4 | Non-fraud amount distribution | Image | `figures/phase1_amt_hist.png` | x=1032 y=132 w=384 h=300 |
| 5 | Category fraud rate | Bar chart | Axis `dim_category[category]`; values `fact_category[fraud_rate]`; tooltip n, k; sort descending; baseline line | x=24 y=456 w=660 h=244 |
| 6 | Category money | Bar chart | Axis `dim_category[category]`; values `fact_money_category[fraud_usd]`; tooltip `usd_per_fraud` | x=708 y=456 w=340 h=244 |
| 7 | Effect-size table | Table | `fact_effect_size[feature]`, `median_fraud`, `median_nonfraud`, `ks_d`, `cohens_d`, `cliffs_delta`, `cliffs_low`, `cliffs_high`, `q_fdr`; sort by absolute delta | x=1072 y=456 w=344 h=244 |
| 8 | Age profile | Image | `figures/phase1_age.png` + `phase1_age_bins.png` | x=24 y=716 w=420 h=156 |
| 9 | Hour profile | Image | `figures/phase1_hour.png` + `phase1_hour_by_year.png` | x=468 y=716 w=948 h=156 |

**Callout:** the amount signal is large but the maximum fraud amount is $1,376.04 versus $28,948.90 for non-fraud, so the fraud tail is narrower at the extreme. Do not describe the difference as a simple right shift without the tail and generator caveat.

**Interactions:** category chart filters the money chart and the category rows of the effect-size table where the field maps. Amount images do not filter.

---

### PAGE-04 · Interactions

**Question:** Where does risk concentrate when variables interact?  
**Phase tags:** P2 · **Target visuals:** 10

| # | Visual | Type | Fields / measures | Layout |
|---|---|---|---|---|
| 1 | Card exposure KPIs | 4 cards | `[Cards Profiled]` 999; `[Cards Ever Fraud]` 976; `[Cards Never Fraud]` 23; `[Cards 100% Fraud]` 91 | x=24 y=24 w=1392 h=88 |
| 2 | Card fraud-rate histogram | Column chart | `fact_card_profile[fraud_rate_bin]`, count of cards; keep the zero bin and 100% bin distinct | x=24 y=132 w=540 h=286 |
| 3 | Card count vs fraud rate | Scatter | X `transaction_count`; Y `fraud_rate`; details `cc_num`; size count; tooltip fraud_count | x=588 y=132 w=408 h=286 |
| 4 | High-risk combination | Bar chart | `fact_high_risk_combo[segment]`, `fraud_rate`, `lift_vs_baseline`, n | x=1020 y=132 w=396 h=286 |
| 5 | Category × hour heatmap | Image | `figures/phase2_category_x_hour.png` | x=24 y=442 w=540 h=286 |
| 6 | Merchant EB vs raw | Scatter | X raw `fact_merchant[fraud_count]/transaction_count`; Y `fact_merchant[fraud_rate]`; category color; only merchants with n≥20 | x=588 y=442 w=408 h=286 |
| 7 | City/zip geography | Image | `figures/phase2_map_scatter.html` (interactive) plus static city map image | x=1020 y=442 w=396 h=286 |
| 8 | ZIP3 exceptions | Table | `fact_zip3` sorted by EB rate; n, k, raw rate, CI, q, sparse, significant | x=24 y=752 w=780 h=120 |
| 9 | Money concentration | Bar chart | `fact_money_category[category]`, `fraud_usd`, % of total | x=828 y=752 w=588 h=120 |
| 10 | Interaction warning | Text box | “Generator artifacts: near-universal card exposure; merchant→category is near-deterministic; distance is per-transaction jitter.” | x=24 y=884 w=1392 h=16 |

**Interactions:** `dim_category` filters visuals 5, 6, 8, 9 where applicable. Add a merchant-count threshold slicer (n ≥ 20 / 100). Do not let a card-level slicer imply population inference beyond the 999 simulated cards.

---

### PAGE-05 · Temporal

**Question:** When does fraud cluster, and what changes at the split?  
**Phase tags:** P3 · **Target visuals:** 7

| # | Visual | Type | Fields / measures | Layout |
|---|---|---|---|---|
| 1 | Weekly fraud rate | Line chart | Axis `dim_week[week_end]`; date slicer on `dim_date[date]`; `[Weekly Fraud Rate]`; split color; 7-week moving average | x=24 y=24 w=920 h=318 |
| 2 | Weekly volume | Column chart | `[Weekly Transactions]`; fraud events on secondary line | x=968 y=24 w=448 h=318 |
| 3 | Split means | 3 cards | `[Train Full-Week Mean Rate]` 0.6026%; `[Test Full-Week Mean Rate]` 0.4248%; `[Rate Change (pp)]` | x=24 y=366 w=648 h=100 |
| 4 | Hazard curve | Line chart | `fact_hazard[month]`, `hazard`, CI low/high; mark month 23 at 48.9% | x=696 y=366 w=720 h=206 |
| 5 | STL decomposition | Image | `figures/phase3_stl.png` | x=24 y=490 w=660 h=280 |
| 6 | Change-points | Image | `figures/phase3_changepoint.png` | x=708 y=596 w=708 h=174 |
| 7 | Boundary annotation | Table/card | 105 weeks; 76 train full weeks; 27 test full weeks; final edge week 2021-01-03: 18,921 transactions, 0 fraud | x=24 y=794 w=1392 h=72 |

**Interactions:** the date range slicer on `dim_date[date]` must filter `dim_week` through the **bidirectional** `dim_date[week_end]` *:1 `dim_week[week_end]` bridge. That bridge is the only bidirectional relationship and the only relationship touching `dim_date`, so no ambiguous filter path exists. Do not add a direct daily-date relationship to the pre-aggregated week fact; it would double-count. Mark the boundary week as partial. Exclude the final zero-fraud partial week from means; show it as an anomaly.

**Callout:** the train/test boundary is a 48-second cut, not a random split. Weekly sums reconcile, but the boundary week straddles both splits.

---

### PAGE-06 · Advanced viz

**Question:** Does fraud separate without supervision?  
**Phase tags:** P4 · **Target visuals:** 9

| # | Visual | Type | Fields / measures | Layout |
|---|---|---|---|---|
| 1 | Anomaly AUC | Bar chart | `fact_anomaly[model]`, `auc`, `top_decile_precision`, `top_decile_lift`, n | x=24 y=24 w=660 h=270 |
| 2 | Embedding AUC | Bar chart | `fact_embedding[embedding]`, `auc`; sorted | x=708 y=24 w=708 h=270 |
| 3 | PCA projection | Image | `figures/phase4_pca_scatter.png` (or interactive 3D HTML) | x=24 y=318 w=540 h=300 |
| 4 | UMAP projection | Image | `figures/phase4_umap_nn15_md0.5.png` | x=588 y=318 w=456 h=300 |
| 5 | t-SNE projection | Image | `figures/phase4_tsne_p30.png` | x=1068 y=318 w=348 h=300 |
| 6 | K-Means cluster rates | Matrix | `fact_cluster[cluster_label]`, `transaction_count`, `fraud_count`, `fraud_rate` | x=24 y=642 w=660 h=224 |
| 7 | DBSCAN noise | Card/table | `fact_cluster` DBSCAN rows; label noise rate 6.08% and cluster rate 0.16% | x=708 y=642 w=340 h=224 |
| 8 | Method caveat | Text box | t-SNE/UMAP parameter-sensitive; sample sizes differ (50k, 5k); no pure fraud cluster; anomaly is weakly separable | x=1072 y=642 w=344 h=224 |
| 9 | Source note | Text box | “Best embedding: PCA(2) logistic AUC 0.816. LOF 0.881 on 5k; IsolationForest 0.843 on 50k. Not directly comparable.” | x=24 y=884 w=1392 h=16 |

**Interactions:** none needed beyond tooltips; projections are static. If using the HTML visuals, embed in a secure iframe and label sample size.

---

### PAGE-07 · Statistics

**Question:** Which differences are large and robust, not merely significant?  
**Phase tags:** P5 · **Target visuals:** 8

| # | Visual | Type | Fields / measures | Layout |
|---|---|---|---|---|
| 1 | Effect-size forest | Image | `figures/phase5_effectsize_forest.png` | x=24 y=24 w=540 h=360 |
| 2 | Effect-size table | Table | `fact_effect_size` full columns; conditional data bars on `cliffs_delta` and `ks_d` | x=588 y=24 w=828 h=360 |
| 3 | Chi-square / Cramér's V | Bar chart | `fact_chi2[variable]`, `cramers_v`, tooltip levels and n; do not rank raw V across cardinalities | x=24 y=408 w=480 h=260 |
| 4 | Category forest | Image | `figures/phase5_forest_category.png` | x=528 y=408 w=420 h=260 |
| 5 | Cluster-robust logit | Table | `fact_logit[feature]`, OR, naive SE, cluster SE, robust CI, p, n_clusters | x=972 y=408 w=444 h=260 |
| 6 | Logit OR | Dot plot | `fact_logit` excluding intercept; OR with robust low/high | x=24 y=694 w=660 h=206 |
| 7 | Post-hoc pairs | Table | `fact_posthoc` top 15 by Cramér's V; p_bonferroni | x=708 y=694 w=708 h=206 |
| 8 | Statistical caveat | Text box | 5 of 8 logit terms survive cluster-robust SEs; Cramér's V is not cardinality-corrected; p-values are not effect sizes | x=24 y=884 w=1392 h=16 |

**Interactions:** select a feature in the table to highlight the forest image? Images cannot cross-highlight; use a bookmark with the relevant static image instead. Do not fake interactivity.

---

### PAGE-08 · Feature lab

**Question:** Which behavioural features are leak-aware and useful?  
**Phase tags:** P6 · **Target visuals:** 10

| # | Visual | Type | Fields / measures | Layout |
|---|---|---|---|---|
| 1 | Velocity gradient | Bar chart | `fact_speed[speed_band_kmh]`, `fraud_rate`, n; monotonic order | x=24 y=24 w=540 h=260 |
| 2 | Speed volume | Column chart | `fact_speed[transaction_count]`, `fraud_count` | x=588 y=24 w=400 h=260 |
| 3 | Hazard curve | Line chart | `fact_hazard[month]`, `hazard`; month 23 callout 48.9% | x=1012 y=24 w=404 h=260 |
| 4 | High-risk combo | Bar chart | `fact_high_risk_combo[segment]`, `lift_vs_baseline`; n labels | x=24 y=308 w=540 h=260 |
| 5 | Merchant EB | Scatter/table | `fact_merchant`; EB rate vs raw rate; n threshold; category detail | x=588 y=308 w=400 h=260 |
| 6 | Hour encoding | Bar chart | `fact_hour_encoding[encoding]`, `validation_pr_auc`; 0.859 / 0.859 / 0.847 | x=1012 y=308 w=404 h=260 |
| 7 | PSI by feature | Bar chart | `fact_psi[feature]`, `psi`; color verdict; threshold lines 0.1 / 0.25 | x=24 y=592 w=660 h=308 |
| 8 | Feature cohort heatmap | Image | `figures/phase7_cohort_heatmap.png` | x=708 y=592 w=708 h=308 |
| 9 | Leakage audit note | Text box | Equal ρ=0.048 naive vs causal; do not claim demonstrated inflation | x=24 y=884 w=696 h=16 |
| 10 | Distance caveat | Text box | dist_km is generator jitter; KS 0.007; not physical geography | x=720 y=884 w=696 h=16 |

---

### PAGE-09 · Model

**Question:** How good is the model in-domain, and why does it fail out-of-domain?  
**Phase tags:** P7 · **Target visuals:** 11

| # | Visual | Type | Fields / measures | Layout |
|---|---|---|---|---|
| 1 | Headline metrics | 4 cards | `[Full Model PR-AUC]` 0.5575; `[Full Model ROC-AUC]` 0.9677; `[Walk-Forward Mean Validation PR-AUC]` 0.9510; `[Walk-Forward Mean Test PR-AUC]` 0.4726 | x=24 y=24 w=1392 h=92 |
| 2 | Ablation | Bar chart | `fact_ablation[model]`, `pr_auc`; selected variant; `[PR-AUC Delta vs Full]`; flag source delta ignored | x=24 y=136 w=660 h=300 |
| 3 | Walk-forward folds | Line/column | `fact_walkforward[fold]`, validation/test PR-AUC; gap labels | x=708 y=136 w=708 h=300 |
| 4 | PSI severity | Bar chart | `fact_psi[feature]`, `psi`; color verdict; callout 7 severe / 1 moderate / 19 stable | x=24 y=460 w=660 h=260 |
| 5 | Transfer summary | Table/cards | Mean OOD gap 0.4785; severe+moderate share 29.6%; adversarial AUC 1.000 (source finding) | x=708 y=460 w=340 h=260 |
| 6 | Calibration | Line/scatter | `fact_calibration`; temperature 1.4178; ECE before/after; note calibration is on early-stopping split | x=1072 y=460 w=344 h=260 |
| 7 | Learning curve | Line chart | `fact_learning_curve[train_fraction]`, `pr_auc`; peak 0.6266 at 0.25; endpoint 0.5254 | x=24 y=744 w=450 h=156 |
| 8 | Card holdout | Bar chart | `fact_leave_card_out[slice]`, `pr_auc`; held-out test 0.5541 | x=498 y=744 w=300 h=156 |
| 9 | Robustness variants | Table | `fact_monotonic`, `fact_time_decay`, `fact_ensemble`; PR-AUC and ROC-AUC | x=822 y=744 w=270 h=156 |
| 10 | Segment errors | Table | `fact_segment_error[segment]`; dim, n, fraud, recall, FP; sort by recall | x=1116 y=744 w=300 h=156 |
| 11 | Model caveat | Text box | “All test metrics are cross-boundary OOD estimates. The ablation source delta is vs raw-only; use delta_vs_full. Do not deploy.” | x=24 y=884 w=1392 h=16 |

**Interactions:** `fact_ablation[model]` selection drives cards 1/2; `dim_segment[segment]` filters segment table. Global split slicer should not modify test metrics; hide it on this page or label “test fixed”.

---

### PAGE-10 · Economics

**Question:** What review budget buys the most fraud loss reduction?  
**Phase tags:** P7 · **Target visuals:** 8

| # | Visual | Type | Fields / measures | Layout |
|---|---|---|---|---|
| 1 | Budget selector | Slicer | `fact_capture[budget_pct]`; default 1% | x=24 y=24 w=208 h=180 |
| 2 | Budget KPIs | 4 cards | `[Reviews at Selected Budget]`, `[Fraud Caught at Selected Budget]`, `[Recall at Selected Budget]`, `[Fraud USD Share at Selected Budget]` | x=248 y=24 w=1168 h=92 |
| 3 | Capture curve | Line/column | `fact_capture[top_pct]`; recall, precision, USD share | x=24 y=220 w=660 h=300 |
| 4 | Capture table | Table | 5 budgets with reviews, caught, precision, recall, USD captured/share/per review | x=708 y=220 w=708 h=300 |
| 5 | Threshold comparison | Bar/table | `fact_threshold`: 0.5, 0.11267, 0.00001; TP/FP/FN/TN, recall, precision, missed USD, total loss | x=24 y=544 w=660 h=262 |
| 6 | FP-cost sensitivity | Line chart | `fact_cost_sensitivity[fp_cost]`; optimal threshold, expected loss, recall; 5 scenarios | x=708 y=544 w=708 h=262 |
| 7 | What-if loss | Card + formula | `[Modeled Loss at Stored Operating Point] = [Cost-Min Missed USD] + [Selected FP Cost] × [Cost-Min False Positives]`; not the stored $5 total unless $5 is selected | x=24 y=820 w=660 h=56 |
| 8 | Unit warning | Text box | “fp_cost in the source is total cost at $5/FP, not a per-FP input. The cost-min threshold is 0.00001 at $5/FP; precision 8.17%.” | x=708 y=820 w=708 h=56 |

**Interactions:** budget slicer drives cards and highlights. FP-cost slicer drives only the what-if card and sensitivity. Do not label the cost-min point as profit-maximizing; it minimizes modeled loss under stated assumptions.

---

### PAGE-11 · Findings

**Question:** What exactly is claimed, at what grade, and on what evidence?  
**Phase tags:** P0–P7 · **Target visuals:** 7

| # | Visual | Type | Fields / measures | Layout |
|---|---|---|---|---|
| 1 | Grade strip | 4 cards | `[Strong Findings]` 30; `[Supports Findings]` 27; `[Caveat Findings]` 6; `[Weak Findings]` 1 | x=24 y=24 w=900 h=88 |
| 2 | Audit/issue cards | 3 cards | `[Findings with Audit Note]`; `[Audit Notes]` 5; `[Curated Issues]` 16; `[High-Severity Issues]` 4 | x=948 y=24 w=468 h=88 |
| 3 | Grade filter | Slicer | `dim_grade[grade]`; multi-select | x=24 y=132 w=208 h=150 |
| 4 | RQ filter | Slicer | `dim_rq[rq_id]`; multi-select | x=24 y=298 w=208 h=200 |
| 5 | Finding ledger | Table | `fact_finding[finding_id]`, rq_id, grade, finding, evidence, source_file, source_row; wrap text, 10 rows/page | x=248 y=132 w=1168 h=440 |
| 6 | Audit note detail | Table | `fact_audit_note[id]`, status, title, claim, observation, implication, phase | x=248 y=588 w=570 h=224 |
| 7 | Issue register | Table | `fact_issue[id]`, severity, category, title, status, action | x=834 y=588 w=582 h=224 |

**Interactions:** grade and RQ slicers filter 5–7. Search is a text filter on finding/evidence via a slicer or the Power BI filter pane. Do not omit the caveat grade when a strong finding is contradicted; show AN-01 through AN-05.

---

### PAGE-12 · Artifacts

**Question:** Can every displayed number be traced to a generated artifact?  
**Phase tags:** P0–P8 · **Target visuals:** 8

| # | Visual | Type | Fields / measures | Layout |
|---|---|---|---|---|
| 1 | Inventory strip | 5 cards | `[Figures]` 129; `[Interactive Artifacts]` 7; `[Catalog Tables]` 46; `[Notebook Cells]` 66; `[Run Warnings]` 9 | x=24 y=24 w=1392 h=88 |
| 2 | Artifact inventory | Table | `fact_artifact` type, phase, title, bytes, source path | x=24 y=132 w=780 h=424 |
| 3 | Table catalog | Table | `fact_table` id, title, phase, rows, cols, missing_cells, source | x=816 y=132 w=600 h=424 |
| 4 | Figure type mix | Donut | `fact_artifact[artifact_type]`; count | x=24 y=576 w=300 h=236 |
| 5 | Notebook cells | Column chart | `fact_notebook_cell[phase_id]`, count of cells, code cells with output | x=336 y=576 w=360 h=236 |
| 6 | Reproducibility checklist | Table | `fact_checklist[item]`, evidence, ok; 11 rows, all true | x=708 y=576 w=708 h=236 |
| 7 | Warning register | Table | `fact_warning` 9 warnings, phase, message | x=24 y=828 w=840 h=48 |
| 8 | Scope note | Text box | “182 source artifacts, 66 notebook cells, 196 validation checks. Power BI pack: 70 CSVs, 137 measures, 33 relationships, 19 specs. No PBIX.” | x=876 y=828 w=540 h=48 |

**Interactions:** artifact type and phase filters. Need a source-path search. Selecting an artifact should open the source file via a URL action when hosted; local paths will not work in the Power BI Service unless the files are published or embedded.

---

### PAGE-13 · Insights

**Question:** What does the evidence actually say, and where is it bounded?  
**Phase tags:** P0–P3, P7 · **Target visuals:** 7

| # | Visual | Type | Fields / measures | Layout |
|---|---|---|---|---|
| 1 | Insight summary strip | 4 cards | `[Insights in View]` 15; `[Priority 1 Insights]` 4; `[Flagged Anomalies]` 10; `[Severe Anomalies]` 7 | x=24 y=24 w=1392 h=88 |
| 2 | Insight cards | Table (report page tooltip) | `fact_insight` id, scope, kind, title, statement, confidence, caveat | x=24 y=132 w=880 h=560 |
| 3 | Insight scope mix | Bar chart | `fact_insight[scope]`; `[Insights by Scope]` | x=916 y=132 w=500 h=264 |
| 4 | Anomaly watch | Table | `fact_anomaly_flag` id, series, label, value, severity, method, threshold, reference population | x=916 y=408 w=500 h=284 |
| 5 | Weekly rate with the flagged week | Line chart | `fact_weekly_rate[week_end]`, fraud rate; overlay the flagged week from `fact_anomaly_flag` | x=24 y=712 w=680 h=300 |
| 6 | Method boundary table | Table | `fact_anomaly_flag` method, threshold, not_a_proof | x=716 y=712 w=700 h=300 |
| 7 | Scope note | Text box | “15 deterministic rules, 10 flags. Every row states its method, threshold and reference population. A flag is not a verdict.” | x=24 y=1024 w=1392 h=48 |

**Interactions:** scope slicer from `dim_insight_scope` filters the insight table and the scope mix. Selecting an anomaly row must show the method and the "not a proof" boundary in the tooltip — do not hide it behind a drill-through.

---

### PAGE-14 · Experiments

**Question:** Which comparisons are legitimate, and what exactly differs?  
**Phase tags:** P7 · **Target visuals:** 6

| # | Visual | Type | Fields / measures | Layout |
|---|---|---|---|---|
| 1 | Group selector | Slicer | `dim_experiment_group[group_id]`; `is_comparable` shown in the category label | x=24 y=24 w=280 h=180 |
| 2 | Compatibility banner | Text box + card | `dim_experiment_group[basis]`, `limitations`, `is_comparable` | x=316 y=24 w=1100 h=180 |
| 3 | PR-AUC by family | Scatter | `fact_experiment[pr_auc]`, `[Experiments in Group]`, `[Best PR-AUC in Group]` | x=24 y=224 w=880 h=420 |
| 4 | Selection detail | Table | selected variants: pr_auc, roc_auc, n_features, n_rows, split, source | x=916 y=224 w=500 h=420 |
| 5 | Variant catalog | Table | `fact_experiment` label, group, metrics, `rank_in_group`, split, source | x=24 y=664 w=1392 h=340 |
| 6 | Comparison rules | Text box | “Absolute differences only. No percent-improvement claim for bounded metrics. Cross-family comparisons are not controlled.” | x=24 y=1024 w=1392 h=48 |

**Interactions:** the group slicer is mandatory before any delta is read. If two groups are selected, suppress the delta column and show the "descriptive only" state.

---

### PAGE-15 · Run logs

**Question:** What did the run record, and what did it skip?  
**Phase tags:** P0–P8 · **Target visuals:** 6

| # | Visual | Type | Fields / measures | Layout |
|---|---|---|---|---|
| 1 | Log summary strip | 4 cards | events 817; warning events 18; error events 0; tracebacks 0 | x=24 y=24 w=1392 h=88 |
| 2 | Timestamp boundary | Text box | “The notebook outputs, warning register and build logs carry no reliable per-event timestamps. Sequence is preserved by cell and line number.” | x=24 y=128 w=1392 h=56 |
| 3 | Warning families | Table | `fact_warning` id, category, message, detail; 9 rows | x=24 y=200 w=680 h=300 |
| 4 | Severity mix | Bar chart | `fact_log_pattern[severity]`, count | x=716 y=200 w=700 h=300 |
| 5 | Message patterns | Table | `fact_log_pattern` id, category, occurrence_count, phase_ids, signature | x=24 y=520 w=1392 h=380 |
| 6 | Method note | Text box | “The warning register is a separate source, so a warning present in both sources is counted once in the families and twice in the raw events.” | x=24 y=920 w=1392 h=48 |

**Interactions:** severity and category filters; a pattern row filters the event list in the React app, which is not reproducible in native BI without a custom visual.

---

### PAGE-16 · Evidence map

**Question:** How does one artifact connect back to the run that produced it?  
**Phase tags:** P0–P8 · **Target visuals:** 5

| # | Visual | Type | Fields / measures | Layout |
|---|---|---|---|---|
| 1 | Map summary | 4 cards | `[Lineage Nodes]` 292; `[Lineage Edges]` 374; `[Verified Edges]` 365; `[Inferred Edges]` 9 | x=24 y=24 w=1392 h=88 |
| 2 | Node type mix | Bar chart | `dim_node_type[node_type]`, node_count | x=24 y=132 w=420 h=260 |
| 3 | Graph | Custom visual (Network) or Image | `fact_lineage_node` + `fact_lineage_edge`; dashed edge for `is_verified = FALSE` | x=456 y=132 w=960 h=560 |
| 4 | Node detail | Table | selected node: label, type, phase, route, provenance | x=24 y=412 w=420 h=280 |
| 5 | Edge semantics | Text box | “Verified edges come from the ledger, notebook cell ranges, the warning register or an artifact write line. Inferred edges connect a phase to an artifact with no located cell.” | x=24 y=712 w=1392 h=48 |

**Interactions:** node type slicer from `dim_node_type`. Because `fact_lineage_edge` has no relationship to `fact_lineage_node`, a native graph visual needs both tables passed in; do not create a relationship for it.

---

### PAGE-17 · Data explorer

**Question:** What does the underlying table actually contain?  
**Phase tags:** P0–P8 · **Target visuals:** 5

| # | Visual | Type | Fields / measures | Layout |
|---|---|---|---|---|
| 1 | Table selector | Slicer | `fact_table[id]` / `fact_table[title]` | x=24 y=24 w=280 h=200 |
| 2 | Table facts strip | 5 cards | rows, columns, missing cells, phase, source path | x=316 y=24 w=1100 h=200 |
| 3 | Column profile | Table | `fact_table` column metadata: dtype, non_null, missing, unique | x=24 y=244 w=880 h=420 |
| 4 | Completeness | Bar chart | missing percentage by column | x=916 y=244 w=500 h=300 |
| 5 | Note | Text box | “The React explorer profiles the loaded rows in the browser; the native equivalent is limited to the imported CSV grain. No sampling is applied in either case.” | x=916 y=560 w=500 h=104 |

---

### PAGE-18 · Metric catalog

**Question:** What does each metric mean and where does it come from?  
**Phase tags:** P0–P8 · **Target visuals:** 4

| # | Visual | Type | Fields / measures | Layout |
|---|---|---|---|---|
| 1 | Catalog summary | 4 cards | `[Metrics Catalogued]` 155; `[Validated Metrics]` 118; `[Metrics with Caveat]` 16; layers 9 | x=24 y=24 w=1392 h=88 |
| 2 | Metric table | Table | `fact_metric_catalog` id, layer, metric, value, unit, confidence, validation_checks, source_file | x=24 y=132 w=1000 h=600 |
| 3 | Confidence mix | Bar chart | `fact_metric_catalog[confidence]`, count | x=1036 y=132 w=380 h=280 |
| 4 | Caveat list | Table | metrics where caveat is not blank | x=1036 y=424 w=380 h=308 |

**Interactions:** the metric id is the join key back to `reports/metric_catalog.csv`. Do not re-derive a metric in Power Query; the catalogue is the semantic layer.

---

### PAGE-19 · Program profile

**Question:** What was run, in what order, and what bounds it?  
**Phase tags:** P0–P8 · **Target visuals:** 6

| # | Visual | Type | Fields / measures | Layout |
|---|---|---|---|---|
| 1 | Program facts strip | 4 cards | transactions, fraud events, wall clock, seed | x=24 y=24 w=1392 h=88 |
| 2 | Research questions | Table | `dim_rq` id, question, findings, strong, phases | x=24 y=132 w=680 h=360 |
| 3 | Phase dossiers | Table | `dim_phase` id, name, cell range, findings, artifacts, status | x=716 y=132 w=700 h=360 |
| 4 | Source availability | Table | `fact_source` name, role, present, bytes, hash | x=24 y=512 w=680 h=300 |
| 5 | Reproducibility checklist | Table | `fact_checklist` 11 items with evidence | x=716 y=512 w=700 h=300 |
| 6 | Limits | Text box | “Raw CSVs absent; single research program; no native Power BI authoring runtime; partial runtime telemetry.” | x=24 y=832 w=1392 h=48 |

---

## 3. Cross-page interaction rules

| Rule | Implementation |
|---|---|
| Split slicer scope | Applies to data-audit, distribution, interaction and feature pages. It does not change the final test metrics; those are explicitly test-scope. |
| Grade/RQ scope | Applies only to findings and overview narrative; never filters model metrics. |
| Budget scope | Drives economics cards and highlights capture curve. |
| Model variant | Drives PR-AUC/ROC-AUC cards and ablation differences; does not change PSI (PSI is per final feature). |
| Date range | Uses the bidirectional `dim_date` → `dim_week` bridge → `fact_weekly_rate`; all trend visuals use `dim_week[week_end]` axis. |
| Reset | Add a bookmark “Reset filters” on each page. |
| Tooltips | Use report-page tooltips with numerator, denominator and source. |
| Drill-through | Findings → Source artifact; source table row → Power BI “See records” only where an import table has that granule. Pre-aggregated facts have no transaction-level drill-through. |
| Exports | Use Power BI export for tables. The React app exports filtered CSV; the native report should use the built-in export data. |

## 4. Accessibility and performance

- Keep data labels on cards and critical bars; use text alternatives in titles for image visuals.
- Do not encode the only distinction by color; pair grade/verdict color with text labels.
- Use `Tab` order left-to-right, top-to-bottom; set alt text to the figure caption and source.
- Avoid transaction-level visuals; the pack is pre-aggregated. Large tables are limited to 100 rows with “See data” export.
- Use import mode; 70 CSVs are small (< 1 MB total). Do not build a DirectQuery model over CSVs.

## 5. Sign-off checklist

- [ ] All 70 CSVs imported with UTF-8 and typed columns.
- [ ] 33 relationships created exactly as in `relationships.md`.
- [ ] `dim_date[date]` marked as date table.
- [ ] 137 measures added; spot-check eight headline values against `reports/metric_catalog.csv`.
- [ ] 19 pages laid out; page IDs visible.
- [ ] Global disclaimers visible on Overview and Model.
- [ ] Test metrics labelled cross-boundary OOD.
- [ ] No sum across pre-aggregated facts.
- [ ] No PBIX claimed; this pack is a reproduction guide.
