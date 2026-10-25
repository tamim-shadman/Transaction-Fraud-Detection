# Data dictionary

Generated: **2026-10-20T17:57:53**  
Coverage: **252** columns across **46** source CSV tables.

Types are the observed pandas dtypes from the generated profile, not database declarations. `missing` and `unique` are counts over the full analytical frame where available. Examples are truncated for display; the full values stay in the source tables.

## How to read this dictionary

- **Table** is the CSV stem in `tables/`.
- **Missing %** is the share of rows with a null in that column.
- **Unique** is the observed distinct count, not a constraint.
- Identifier columns (`cc_num`, `trans_num`, `zip`) are not modelled as numeric magnitudes.
- The app data layer mirrors these tables under `app/public/data/tables/*.json`; the Power BI pack mirrors them under `powerbi/data/*.csv`.

## Table index

| Table | Phase | Rows | Cols | Description |
| --- | --- | ---: | ---: | --- |
| `figure_index` | P8 | 129 | 2 | Caption registry for the 129 PNG figures produced by the run. |
| `findings_ledger` | P8 | 64 | 5 | 64 graded findings across eight pre-registered research questions. |
| `phase0_class_balance` | P0 | 3 | 4 | Transaction and fraud counts for train, test and overall. |
| `phase0_contracts` | P0 | 10 | 4 | Ten domain and integrity checks with observed values and pass/flag status. |
| `phase0_generator_forensics` | P0 | 7 | 2 | Evidence about simulator mechanics: timestamp offset, merchant coordinates, ZIP3 purity and distance. |
| `phase0_schema` | P0 | 72 | 7 | Dtype, completeness, cardinality, memory and analytical role for the derived frame. |
| `phase1_amt_quantiles` | P1 | 9 | 4 | Selected percentiles for all, fraud and non-fraud transaction amounts. |
| `phase1_category_table` | P1 | 14 | 4 | Transaction counts and raw fraud rates for the 14 merchant categories. |
| `phase1_covid_window` | P1 | 3 | 3 | Fraud-rate comparison for the Jan–Feb, Mar–Jun and Jul–Dec 2020 windows. |
| `phase1_merchant_table` | P1 | 693 | 4 | Unshrunk transaction counts and fraud rates for 693 merchants. |
| `phase2_card_profiles` | P2 | 999 | 9 | One row per card: volume, fraud count, amount profile, hour entropy and fraud-rate bin. |
| `phase2_city_table` | P2 | 836 | 6 | 836 cities with volume, fraud count and empirical-Bayes shrunk fraud rate. |
| `phase2_dist_rate_table` | P2 | 6 | 4 | Fraud rate by card→merchant distance bin; distance is a simulator artifact. |
| `phase2_mi_table` | P2 | 14 | 2 | Mutual-information ranking of candidate features against the fraud target. |
| `phase2_money_category` | P2 | 14 | 4 | Fraud counts, total fraud dollars and dollars per fraud by category. |
| `phase2_zip3_table` | P2 | 532 | 12 | 532 ZIP3 prefixes with Wilson intervals, significance, sparsity and EB-shrunk rates. |
| `phase3_weekly_rate_table` | P3 | 105 | 4 | 105 weekly observations with volume, fraud count and fraud rate. |
| `phase4_anomaly_summary` | P4 | 3 | 5 | Isolation Forest, autoencoder and LOF AUC and top-decile lift. |
| `phase4_dbscan_clusters` | P4 | 2 | 3 | Cluster sizes and fraud rates; the noise group carries elevated risk. |
| `phase4_kmeans_cluster_rate` | P4 | 3 | 4 | Three-cluster solution with size, fraud count and fraud rate. |
| `phase4_separability_table` | P4 | 7 | 2 | Logistic AUC on seven 2D embeddings; PCA(2) performs best. |
| `phase5_category_posthoc_pairs` | P5 | 72 | 6 | Pairwise category tests with Cramér's V and Bonferroni-adjusted p-values. |
| `phase5_category_rates` | P5 | 14 | 11 | Fraud rates, Wilson intervals, FDR-adjusted significance and sparsity flags by category. |
| `phase5_chi2_cramers` | P5 | 5 | 7 | Chi-square and uncorrected Cramér's V for category, gender, state, job and ZIP3. |
| `phase5_cluster_robust_logit` | P5 | 9 | 10 | Card-clustered logistic coefficients and robust intervals for eight features. |
| `phase5_mw_effect_sizes` | P5 | 11 | 14 | Mann–Whitney, Cliff's delta, KS, Cohen's d and bootstrap intervals for 11 features. |
| `phase7_hazard_table` | P6 | 24 | 6 | Month-by-month hazard of first fraud with Wilson intervals. |
| `phase7_high_risk_combo` | P6 | 5 | 4 | Fraud rate and lift for night, risky category, high amount and their combination. |
| `phase7_hour_encoding_comparison` | P6 | 3 | 2 | Validation PR-AUC for raw, cyclical and one-hot hour encodings. |
| `phase7_merchant_eb_table` | P6 | 700 | 7 | 700 merchant rows with category prior, EB-shrunk rate and cleaned merchant name. |
| `phase7_speed_rate_table` | P6 | 5 | 4 | Fraud rate by implied card→merchant speed bin. |
| `phase8_ablation_decomposed` | P7 | 6 | 5 | PR/ROC AUC after removing feature families; localizes the transfer failure. |
| `phase8_calibration_temp` | P7 | 1 | 7 | Post-hoc calibration on the early-stopping split; not the test split. |
| `phase8_capture_at_k` | P7 | 5 | 8 | Fraud events and dollars captured at five review budgets. |
| `phase8_cost_sensitivity` | P7 | 5 | 5 | Optimal threshold, loss, recall and precision across false-positive costs. |
| `phase8_ensemble_comparison` | P7 | 2 | 3 | Single final model versus the mean prediction of four walk-forward models. |
| `phase8_learning_curve` | P7 | 5 | 4 | Test PR/ROC AUC at five training-fraction levels; non-monotonic under OOD shift. |
| `phase8_leave_card_out` | P7 | 3 | 5 | PR/ROC AUC for seen cards, held-out cards and held-out-card test rows. |
| `phase8_monotonic_comparison` | P7 | 2 | 3 | Audit-compliant monotonic model versus the unconstrained final model. |
| `phase8_psi` | P7 | 27 | 7 | Per-feature train→test PSI with stability verdict and top driver bin. |
| `phase8_segment_errors` | P7 | 63 | 8 | Recall and false positives by category, hour bin and state at the cost-min operating point. |
| `phase8_threshold_table` | P7 | 3 | 11 | Confusion counts, precision, recall and dollar loss at three thresholds. |
| `phase8_time_decay_comparison` | P7 | 2 | 3 | 180-day half-life weighting versus the unweighted final model. |
| `phase8_walkforward_cv` | P7 | 4 | 9 | Four time-ordered folds with in-domain validation and cross-boundary test metrics. |
| `phase8_wf_vs_test` | P7 | 1 | 6 | Mean in-domain and test PR-AUC across folds, with the transfer gap. |
| `reproducibility_checklist` | P8 | 11 | 3 | Eleven run-level reproducibility checks and their evidence. |

## `figure_index` — Figure index

**Phase:** P8 · **Rows:** 129 · **Columns:** 2

Caption registry for the 129 PNG figures produced by the run.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `figure` | text | 0 | 0.00% | 129 | /content/outputs/figures/phase0_missing_matrix.png |
| `caption` | text | 0 | 0.00% | 129 | missingno matrix |

## `findings_ledger` — Findings ledger

**Phase:** P8 · **Rows:** 64 · **Columns:** 5

64 graded findings across eight pre-registered research questions.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `rq` | text | 0 | 0.00% | 8 | RQ1 |
| `phase` | integer | 0 | 0.00% | 8 | 1 |
| `grade` | text | 0 | 0.00% | 4 | caveat |
| `finding` | text | 0 | 0.00% | 64 | Data contracts evaluated with actual min/max printed (FIX #5) |
| `evidence` | text | 0 | 0.00% | 63 | [{'contract': 'age min / max (Sparkov expects ~18–100)', 'actual value': '13.9 / |

## `phase0_class_balance` — Class balance by split

**Phase:** P0 · **Rows:** 3 · **Columns:** 4

Transaction and fraud counts for train, test and overall.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `split` | text | 0 | 0.00% | 3 | train |
| `n` | integer | 0 | 0.00% | 3 | 1296675 |
| `fraud` | integer | 0 | 0.00% | 3 | 7506 |
| `fraud_rate` | number | 0 | 0.00% | 3 | 0.0057886517438833 |

## `phase0_contracts` — Data contracts

**Phase:** P0 · **Rows:** 10 · **Columns:** 4

Ten domain and integrity checks with observed values and pass/flag status.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `contract_id` | integer | 0 | 0.00% | 10 | 0 |
| `contract` | text | 0 | 0.00% | 10 | age min / max (Sparkov expects ~18–100) |
| `actual value` | text | 0 | 0.00% | 8 | 13.9 / 96.2 |
| `status` | text | 0 | 0.00% | 3 | FLAG |

## `phase0_generator_forensics` — Generator forensics

**Phase:** P0 · **Rows:** 7 · **Columns:** 2

Evidence about simulator mechanics: timestamp offset, merchant coordinates, ZIP3 purity and distance.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `metric` | text | 0 | 0.00% | 7 | unix_time_offset_days |
| `value` | text | 0 | 0.00% | 6 | -2557.0 |

## `phase0_schema` — Schema profile

**Phase:** P0 · **Rows:** 72 · **Columns:** 7

Dtype, completeness, cardinality, memory and analytical role for the derived frame.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `column` | text | 0 | 0.00% | 72 | Index |
| `dtype` | text | 1 | 138.89% | 8 | float32 |
| `non_null` | number | 1 | 138.89% | 4 | 1852394.0 |
| `missing_pct` | number | 1 | 138.89% | 4 | 0.0 |
| `n_unique` | number | 1 | 138.89% | 51 | 29792.0 |
| `memory_MB` | number | 0 | 0.00% | 14 | 0.0 |
| `role` | text | 0 | 0.00% | 6 | feature/derived |

## `phase1_amt_quantiles` — Amount quantiles

**Phase:** P1 · **Rows:** 9 · **Columns:** 4

Selected percentiles for all, fraud and non-fraud transaction amounts.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `quantile` | text | 0 | 0.00% | 9 | P1 |
| `amt` | number | 0 | 0.00% | 9 | 1.26 |
| `amt_fraud` | number | 0 | 0.00% | 9 | 6.84 |
| `amt_nonfraud` | number | 0 | 0.00% | 9 | 1.26 |

## `phase1_category_table` — Category volumes & rates

**Phase:** P1 · **Rows:** 14 · **Columns:** 4

Transaction counts and raw fraud rates for the 14 merchant categories.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `category` | text | 0 | 0.00% | 14 | entertainment |
| `n` | integer | 0 | 0.00% | 14 | 134118 |
| `k` | integer | 0 | 0.00% | 14 | 292 |
| `rate` | number | 0 | 0.00% | 14 | 0.002177187253016 |

## `phase1_covid_window` — COVID-window rates

**Phase:** P1 · **Rows:** 3 · **Columns:** 3

Fraud-rate comparison for the Jan–Feb, Mar–Jun and Jul–Dec 2020 windows.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `window` | text | 0 | 0.00% | 3 | Jan-Feb 2020 |
| `n` | integer | 0 | 0.00% | 3 | 99993 |
| `fraud_rate` | number | 0 | 0.00% | 3 | 0.0067904753332733 |

## `phase1_merchant_table` — Merchant rates

**Phase:** P1 · **Rows:** 693 · **Columns:** 4

Unshrunk transaction counts and fraud rates for 693 merchants.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `merchant_clean` | text | 0 | 0.00% | 693 | Abbott-Rogahn |
| `n` | integer | 0 | 0.00% | 569 | 2647 |
| `k` | integer | 0 | 0.00% | 57 | 4 |
| `rate` | number | 0 | 0.00% | 662 | 0.0015111446921042 |

## `phase2_card_profiles` — Cardholder profiles

**Phase:** P2 · **Rows:** 999 · **Columns:** 9

One row per card: volume, fraud count, amount profile, hour entropy and fraud-rate bin.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `cc_num` | integer | 0 | 0.00% | 999 | 60416207185 |
| `n` | integer | 0 | 0.00% | 140 | 2196 |
| `k` | integer | 0 | 0.00% | 18 | 9 |
| `amt_mean` | number | 0 | 0.00% | 999 | 59.257793 |
| `amt_std` | number | 0 | 0.00% | 999 | 142.86975 |
| `fraud_rate` | number | 0 | 0.00% | 416 | 0.0040983606557377 |
| `hour_entropy` | number | 0 | 0.00% | 971 | 4.455454575222526 |
| `geo_entropy` | number | 0 | 0.00% | 1 | -0.0 |
| `fraud_rate_bin` | text | 0 | 0.00% | 3 | (0,5%] |

## `phase2_city_table` — City-level risk

**Phase:** P2 · **Rows:** 836 · **Columns:** 6

836 cities with volume, fraud count and empirical-Bayes shrunk fraud rate.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `city` | text | 0 | 0.00% | 836 | Clearwater |
| `lat` | number | 0 | 0.00% | 834 | 27.900333 |
| `lon` | number | 0 | 0.00% | 835 | -82.71477 |
| `n` | integer | 0 | 0.00% | 169 | 753 |
| `k` | integer | 0 | 0.00% | 34 | 24 |
| `eb_rate` | number | 0 | 0.00% | 489 | 0.0314450098617646 |

## `phase2_dist_rate_table` — Distance bins

**Phase:** P2 · **Rows:** 6 · **Columns:** 4

Fraud rate by card→merchant distance bin; distance is a simulator artifact.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `dist_bin` | text | 0 | 0.00% | 6 | <10 |
| `n` | integer | 0 | 0.00% | 6 | 14982 |
| `k` | integer | 0 | 0.00% | 6 | 68 |
| `rate` | number | 0 | 0.00% | 6 | 0.0045387798691763 |

## `phase2_mi_table` — Mutual information

**Phase:** P2 · **Rows:** 14 · **Columns:** 2

Mutual-information ranking of candidate features against the fraud target.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `feature` | text | 0 | 0.00% | 14 | log_amt |
| `mutual_information` | number | 0 | 0.00% | 14 | 0.0161406288112617 |

## `phase2_money_category` — Fraud dollars by category

**Phase:** P2 · **Rows:** 14 · **Columns:** 4

Fraud counts, total fraud dollars and dollars per fraud by category.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `category` | text | 0 | 0.00% | 14 | shopping_net |
| `n_fraud` | number | 0 | 0.00% | 14 | 2219.0 |
| `fraud_usd` | number | 0 | 0.00% | 14 | 2214847.75 |
| `usd_per_fraud` | number | 0 | 0.00% | 14 | 998.1287841796876 |

## `phase2_zip3_table` — ZIP3 empirical Bayes

**Phase:** P2 · **Rows:** 532 · **Columns:** 12

532 ZIP3 prefixes with Wilson intervals, significance, sparsity and EB-shrunk rates.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `zip3` | integer | 0 | 0.00% | 532 | 170 |
| `n` | integer | 0 | 0.00% | 261 | 13896 |
| `k` | integer | 0 | 0.00% | 56 | 59 |
| `rate` | number | 0 | 0.00% | 414 | 0.0042458261370178 |
| `lo` | number | 0 | 0.00% | 445 | 0.0032932355821533 |
| `hi` | number | 0 | 0.00% | 440 | 0.005472447042604 |
| `p_vs_base` | number | 0 | 0.00% | 442 | 0.1143864506104588 |
| `q_vs_base` | number | 0 | 0.00% | 264 | 0.2335316549465794 |
| `sparse` | boolean | 0 | 0.00% | 2 | False |
| `sig` | boolean | 0 | 0.00% | 2 | False |
| `baseline` | number | 0 | 0.00% | 1 | 0.0052100147160917 |
| `eb_rate` | number | 0 | 0.00% | 447 | 0.0042488627093713 |

## `phase3_weekly_rate_table` — Weekly fraud rate

**Phase:** P3 · **Rows:** 105 · **Columns:** 4

105 weekly observations with volume, fraud count and fraud rate.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `ts` | text | 0 | 0.00% | 105 | 2019-01-06 |
| `size` | integer | 0 | 0.00% | 101 | 9680 |
| `sum` | integer | 0 | 0.00% | 75 | 47 |
| `rate` | number | 0 | 0.00% | 104 | 0.0048553719008264 |

## `phase4_anomaly_summary` — Anomaly detector comparison

**Phase:** P4 · **Rows:** 3 · **Columns:** 5

Isolation Forest, autoencoder and LOF AUC and top-decile lift.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `model` | text | 0 | 0.00% | 3 | IsolationForest |
| `auc` | number | 0 | 0.00% | 3 | 0.8431516731899904 |
| `top10pct_precision` | number | 0 | 0.00% | 3 | 0.034 |
| `top10pct_lift` | number | 0 | 0.00% | 3 | 6.5134099616858245 |
| `n` | integer | 0 | 0.00% | 2 | 50000 |

## `phase4_dbscan_clusters` — DBSCAN clusters

**Phase:** P4 · **Rows:** 2 · **Columns:** 3

Cluster sizes and fraud rates; the noise group carries elevated risk.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `cluster` | text | 0 | 0.00% | 2 | noise |
| `n` | integer | 0 | 0.00% | 2 | 395 |
| `fraud_rate` | number | 0 | 0.00% | 2 | 0.060759493670886 |

## `phase4_kmeans_cluster_rate` — K-Means clusters

**Phase:** P4 · **Rows:** 3 · **Columns:** 4

Three-cluster solution with size, fraud count and fraud rate.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `k_fraud` | integer | 0 | 0.00% | 3 | 76 |
| `n` | integer | 0 | 0.00% | 3 | 10622 |
| `rate` | number | 0 | 0.00% | 3 | 0.0071549614008661 |
| `cluster` | integer | 0 | 0.00% | 3 | 0 |

## `phase4_separability_table` — Embedding separability

**Phase:** P4 · **Rows:** 7 · **Columns:** 2

Logistic AUC on seven 2D embeddings; PCA(2) performs best.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `embedding` | text | 0 | 0.00% | 7 | PCA(2) |
| `auc` | number | 0 | 0.00% | 7 | 0.8156592743806254 |

## `phase5_category_posthoc_pairs` — Category post-hoc pairs

**Phase:** P5 · **Rows:** 72 · **Columns:** 6

Pairwise category tests with Cramér's V and Bonferroni-adjusted p-values.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `a` | text | 0 | 0.00% | 13 | home |
| `b` | text | 0 | 0.00% | 13 | shopping_net |
| `chi2` | number | 0 | 0.00% | 72 | 2059.860003304157 |
| `p` | number | 0 | 0.00% | 67 | 0.0 |
| `cramers_v` | number | 0 | 0.00% | 72 | 0.0809101941776436 |
| `p_bonf` | number | 0 | 0.00% | 67 | 0.0 |

## `phase5_category_rates` — Category rates with intervals

**Phase:** P5 · **Rows:** 14 · **Columns:** 11

Fraud rates, Wilson intervals, FDR-adjusted significance and sparsity flags by category.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `category` | text | 0 | 0.00% | 14 | entertainment |
| `n` | integer | 0 | 0.00% | 14 | 134118 |
| `k` | integer | 0 | 0.00% | 14 | 292 |
| `rate` | number | 0 | 0.00% | 14 | 0.002177187253016 |
| `lo` | number | 0 | 0.00% | 14 | 0.0019415904822434 |
| `hi` | number | 0 | 0.00% | 14 | 0.0024413019160965 |
| `p_vs_base` | number | 0 | 0.00% | 13 | 1.063163345393507e-53 |
| `q_vs_base` | number | 0 | 0.00% | 13 | 1.8605358544386382e-53 |
| `sparse` | boolean | 0 | 0.00% | 1 | False |
| `sig` | boolean | 0 | 0.00% | 1 | True |
| `baseline` | number | 0 | 0.00% | 1 | 0.0052100147160917 |

## `phase5_chi2_cramers` — Categorical association

**Phase:** P5 · **Rows:** 5 · **Columns:** 7

Chi-square and uncorrected Cramér's V for category, gender, state, job and ZIP3.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `variable` | text | 0 | 0.00% | 5 | category |
| `levels` | integer | 0 | 0.00% | 5 | 14 |
| `chi2` | number | 0 | 0.00% | 5 | 8329.139946 |
| `dof` | integer | 0 | 0.00% | 5 | 13 |
| `p` | number | 0 | 0.00% | 2 | 0.0 |
| `cramers_v` | number | 0 | 0.00% | 5 | 0.067003 |
| `n` | integer | 0 | 0.00% | 2 | 1852394 |

## `phase5_cluster_robust_logit` — Cluster-robust logit

**Phase:** P5 · **Rows:** 9 · **Columns:** 10

Card-clustered logistic coefficients and robust intervals for eight features.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `feature` | text | 0 | 0.00% | 9 | intercept |
| `coef` | number | 0 | 0.00% | 9 | -7.85213 |
| `OR` | number | 0 | 0.00% | 9 | 0.00039 |
| `se_naive` | number | 0 | 0.00% | 9 | 0.09054 |
| `se_cluster` | number | 0 | 0.00% | 9 | 0.12131 |
| `z_cluster` | number | 0 | 0.00% | 9 | -64.73004 |
| `p_cluster` | number | 0 | 0.00% | 4 | 0.0 |
| `OR_lo_robust` | number | 0 | 0.00% | 9 | 0.00031 |
| `OR_hi_robust` | number | 0 | 0.00% | 9 | 0.00049 |
| `n_clusters` | integer | 0 | 0.00% | 1 | 961 |

## `phase5_mw_effect_sizes` — Effect sizes

**Phase:** P5 · **Rows:** 11 · **Columns:** 14

Mann–Whitney, Cliff's delta, KS, Cohen's d and bootstrap intervals for 11 features.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `feature` | text | 0 | 0.00% | 11 | amt |
| `n_fraud` | integer | 0 | 0.00% | 3 | 9651 |
| `n_nonfraud` | integer | 0 | 0.00% | 4 | 1842743 |
| `med_fraud` | number | 0 | 0.00% | 11 | 390.0 |
| `med_nonfraud` | number | 0 | 0.00% | 11 | 47.240002 |
| `U` | number | 0 | 0.00% | 11 | 14837147795.0 |
| `p_mw` | number | 0 | 0.00% | 4 | 0.0 |
| `ks_D` | number | 0 | 0.00% | 11 | 0.723803 |
| `p_ks` | number | 0 | 0.00% | 4 | 0.0 |
| `cohens_d` | number | 0 | 0.00% | 11 | 2.973226 |
| `cliffs_delta` | number | 0 | 0.00% | 11 | 0.668566 |
| `cliffs_lo` | number | 0 | 0.00% | 11 | 0.655884 |
| `cliffs_hi` | number | 0 | 0.00% | 11 | 0.680089 |
| `q_fdr` | number | 0 | 0.00% | 4 | 0.0 |

## `phase7_hazard_table` — Discrete-time hazard

**Phase:** P6 · **Rows:** 24 · **Columns:** 6

Month-by-month hazard of first fraud with Wilson intervals.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `month` | integer | 0 | 0.00% | 24 | 0 |
| `n_risk` | integer | 0 | 0.00% | 24 | 999 |
| `events` | integer | 0 | 0.00% | 17 | 137 |
| `hazard` | number | 0 | 0.00% | 24 | 0.1371371371371371 |
| `lo` | number | 0 | 0.00% | 24 | 0.1171912124563506 |
| `hi` | number | 0 | 0.00% | 24 | 0.1598631099810112 |

## `phase7_high_risk_combo` — High-risk combinations

**Phase:** P6 · **Rows:** 5 · **Columns:** 4

Fraud rate and lift for night, risky category, high amount and their combination.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `segment` | text | 0 | 0.00% | 5 | night + shopping_net/misc_net + amt≥500 (COMBO) |
| `n` | integer | 0 | 0.00% | 5 | 2274 |
| `fraud_rate` | number | 0 | 0.00% | 5 | 0.2207563764291996 |
| `lift_vs_base` | number | 0 | 0.00% | 5 | 42.37154565943331 |

## `phase7_hour_encoding_comparison` — Hour encoding comparison

**Phase:** P6 · **Rows:** 3 · **Columns:** 2

Validation PR-AUC for raw, cyclical and one-hot hour encodings.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `encoding` | text | 0 | 0.00% | 3 | raw |
| `pr_auc` | number | 0 | 0.00% | 3 | 0.8592883007537216 |

## `phase7_merchant_eb_table` — Merchant hierarchical EB

**Phase:** P6 · **Rows:** 700 · **Columns:** 7

700 merchant rows with category prior, EB-shrunk rate and cleaned merchant name.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `category` | text | 0 | 0.00% | 14 | shopping_net |
| `merchant` | text | 0 | 0.00% | 693 | fraud_Kozey-Boehm |
| `n` | integer | 0 | 0.00% | 573 | 2758 |
| `k` | integer | 0 | 0.00% | 55 | 60 |
| `cat_eb` | number | 0 | 0.00% | 14 | 0.0159101290773769 |
| `eb_rate` | number | 0 | 0.00% | 688 | 0.0215503894008879 |
| `merchant_clean` | text | 0 | 0.00% | 693 | Kozey-Boehm |

## `phase7_speed_rate_table` — Implied-speed risk

**Phase:** P6 · **Rows:** 5 · **Columns:** 4

Fraud rate by implied card→merchant speed bin.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `speed_kmh` | text | 0 | 0.00% | 5 | <100 |
| `n` | integer | 0 | 0.00% | 5 | 1533728 |
| `k` | integer | 0 | 0.00% | 5 | 5567 |
| `rate` | number | 0 | 0.00% | 5 | 0.0036297179160842 |

## `phase8_ablation_decomposed` — Feature-family ablation

**Phase:** P7 · **Rows:** 6 · **Columns:** 5

PR/ROC AUC after removing feature families; localizes the transfer failure.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `model` | text | 0 | 0.00% | 6 | FULL (all features) |
| `n_features` | integer | 0 | 0.00% | 5 | 27 |
| `pr_auc` | number | 0 | 0.00% | 6 | 0.5574801511963462 |
| `roc_auc` | number | 0 | 0.00% | 6 | 0.9677282868198628 |
| `delta_pr_auc` | number | 0 | 0.00% | 6 | -0.2778580775649438 |

## `phase8_calibration_temp` — Temperature scaling

**Phase:** P7 · **Rows:** 1 · **Columns:** 7

Post-hoc calibration on the early-stopping split; not the test split.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `T` | number | 0 | 0.00% | 1 | 1.4177918881006806 |
| `ece_before` | number | 0 | 0.00% | 1 | 0.0001593957680143 |
| `ece_after` | number | 0 | 0.00% | 1 | 0.0001183945305157 |
| `brier_before` | number | 0 | 0.00% | 1 | 0.0007191004827225 |
| `brier_after` | number | 0 | 0.00% | 1 | 0.0007086159683003 |
| `nll_before` | number | 0 | 0.00% | 1 | 0.0035435140047159 |
| `nll_after` | number | 0 | 0.00% | 1 | 0.0030949310364134 |

## `phase8_capture_at_k` — Capture@k

**Phase:** P7 · **Rows:** 5 · **Columns:** 8

Fraud events and dollars captured at five review budgets.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `top_pct` | number | 0 | 0.00% | 5 | 0.1 |
| `k` | integer | 0 | 0.00% | 5 | 556 |
| `fraud_caught` | integer | 0 | 0.00% | 5 | 550 |
| `precision` | number | 0 | 0.00% | 5 | 0.9892086330935252 |
| `recall` | number | 0 | 0.00% | 5 | 0.2564102564102564 |
| `usd_captured` | number | 0 | 0.00% | 5 | 206385.49937677383 |
| `usd_share` | number | 0 | 0.00% | 5 | 0.1821062428275556 |
| `usd_per_review` | number | 0 | 0.00% | 5 | 371.1969413251328 |

## `phase8_cost_sensitivity` — Cost sensitivity

**Phase:** P7 · **Rows:** 5 · **Columns:** 5

Optimal threshold, loss, recall and precision across false-positive costs.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `fp_cost` | number | 0 | 0.00% | 5 | 1.0 |
| `optimal_threshold` | number | 0 | 0.00% | 4 | 9.703897328671126e-07 |
| `expected_loss` | number | 0 | 0.00% | 5 | 91313.50010156631 |
| `recall` | number | 0 | 0.00% | 4 | 0.9156177156177157 |
| `precision` | number | 0 | 0.00% | 4 | 0.0357721800265923 |

## `phase8_ensemble_comparison` — Ensemble comparison

**Phase:** P7 · **Rows:** 2 · **Columns:** 3

Single final model versus the mean prediction of four walk-forward models.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `model` | text | 0 | 0.00% | 2 | single_final |
| `pr_auc` | number | 0 | 0.00% | 2 | 0.5574801511963462 |
| `roc_auc` | number | 0 | 0.00% | 2 | 0.9677282868198628 |

## `phase8_learning_curve` — Learning curve

**Phase:** P7 · **Rows:** 5 · **Columns:** 4

Test PR/ROC AUC at five training-fraction levels; non-monotonic under OOD shift.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `frac` | number | 0 | 0.00% | 5 | 0.05 |
| `n_train` | integer | 0 | 0.00% | 5 | 64833 |
| `pr_auc` | number | 0 | 0.00% | 5 | 0.3228441253114523 |
| `roc_auc` | number | 0 | 0.00% | 5 | 0.9625954565232782 |

## `phase8_leave_card_out` — Leave-card-out CV

**Phase:** P7 · **Rows:** 3 · **Columns:** 5

PR/ROC AUC for seen cards, held-out cards and held-out-card test rows.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `slice` | text | 0 | 0.00% | 3 | train rows of SEEN cards |
| `n` | integer | 0 | 0.00% | 3 | 1031265 |
| `n_fraud` | integer | 0 | 0.00% | 3 | 5952 |
| `pr_auc` | number | 0 | 0.00% | 3 | 0.9947611727137646 |
| `roc_auc` | number | 0 | 0.00% | 3 | 0.9997981840051068 |

## `phase8_monotonic_comparison` — Monotonic constraints

**Phase:** P7 · **Rows:** 2 · **Columns:** 3

Audit-compliant monotonic model versus the unconstrained final model.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `model` | text | 0 | 0.00% | 2 | monotonic_constrained |
| `pr_auc` | number | 0 | 0.00% | 2 | 0.5921751049650442 |
| `roc_auc` | number | 0 | 0.00% | 2 | 0.9435379437250913 |

## `phase8_psi` — Population Stability Index

**Phase:** P7 · **Rows:** 27 · **Columns:** 7

Per-feature train→test PSI with stability verdict and top driver bin.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `feature` | text | 0 | 0.00% | 27 | month_sin |
| `family` | text | 0 | 0.00% | 3 | bounded |
| `n_train` | integer | 0 | 0.00% | 3 | 1296675 |
| `n_test` | integer | 0 | 0.00% | 3 | 555719 |
| `psi` | number | 0 | 0.00% | 26 | 6.514263998062767 |
| `verdict` | text | 0 | 0.00% | 3 | severe |
| `top_driver_bin` | text | 2 | 740.74% | 24 | (0.866, inf] |

## `phase8_segment_errors` — Segment errors

**Phase:** P7 · **Rows:** 63 · **Columns:** 8

Recall and false positives by category, hour bin and state at the cost-min operating point.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `category` | text | 49 | 7,777.78% | 14 | entertainment |
| `n` | number | 0 | 0.00% | 62 | 40104.0 |
| `n_fraud` | number | 0 | 0.00% | 49 | 59.0 |
| `recall` | number | 0 | 0.00% | 59 | 0.9661016949152542 |
| `fp` | number | 0 | 0.00% | 62 | 688.0 |
| `segment` | text | 0 | 0.00% | 3 | category |
| `hour_bin` | text | 59 | 9,365.08% | 4 | 00-05 |
| `state` | text | 18 | 2,857.14% | 45 | AK |

## `phase8_threshold_table` — Operating points

**Phase:** P7 · **Rows:** 3 · **Columns:** 11

Confusion counts, precision, recall and dollar loss at three thresholds.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `threshold` | number | 0 | 0.00% | 3 | 0.5 |
| `TP` | integer | 0 | 0.00% | 3 | 822 |
| `FP` | integer | 0 | 0.00% | 3 | 133 |
| `FN` | integer | 0 | 0.00% | 3 | 1323 |
| `TN` | integer | 0 | 0.00% | 3 | 553441 |
| `precision` | number | 0 | 0.00% | 3 | 0.8607329842931937 |
| `recall` | number | 0 | 0.00% | 3 | 0.3832167832167832 |
| `fp_cost` | number | 0 | 0.00% | 3 | 665.0 |
| `missed_usd` | number | 0 | 0.00% | 3 | 763845.8102025986 |
| `total_loss` | number | 0 | 0.00% | 3 | 764510.8102025986 |
| `usd_captured` | number | 0 | 0.00% | 3 | 0.3260132566696228 |

## `phase8_time_decay_comparison` — Time-decay weighting

**Phase:** P7 · **Rows:** 2 · **Columns:** 3

180-day half-life weighting versus the unweighted final model.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `model` | text | 0 | 0.00% | 2 | time_decay_weighted |
| `pr_auc` | number | 0 | 0.00% | 2 | 0.5407833916639233 |
| `roc_auc` | number | 0 | 0.00% | 2 | 0.9674108193720746 |

## `phase8_walkforward_cv` — Walk-forward CV

**Phase:** P7 · **Rows:** 4 · **Columns:** 9

Four time-ordered folds with in-domain validation and cross-boundary test metrics.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `fold` | integer | 0 | 0.00% | 4 | 0 |
| `val_window` | text | 0 | 0.00% | 4 | 2020-04-22 → 2020-06-21 |
| `n_train` | integer | 0 | 0.00% | 4 | 1146194 |
| `n_val` | integer | 0 | 0.00% | 4 | 150480 |
| `pr_auc` | number | 0 | 0.00% | 4 | 0.9624781000121158 |
| `roc_auc` | number | 0 | 0.00% | 4 | 0.9993242488998868 |
| `test_pr_auc` | number | 0 | 0.00% | 4 | 0.5384840455219909 |
| `test_roc_auc` | number | 0 | 0.00% | 4 | 0.9812925464224116 |
| `ood_gap_pr` | number | 0 | 0.00% | 4 | 0.4239940544901248 |

## `phase8_wf_vs_test` — OOD gap summary

**Phase:** P7 · **Rows:** 1 · **Columns:** 6

Mean in-domain and test PR-AUC across folds, with the transfer gap.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `mean_val_pr_auc` | number | 0 | 0.00% | 1 | 0.9510414270082748 |
| `sd_val_pr_auc` | number | 0 | 0.00% | 1 | 0.0152253832396225 |
| `mean_test_pr_auc_from_folds` | number | 0 | 0.00% | 1 | 0.4725803686226709 |
| `sd_test_pr_auc_from_folds` | number | 0 | 0.00% | 1 | 0.0760812880124376 |
| `mean_ood_gap` | number | 0 | 0.00% | 1 | 0.4784610583856036 |
| `n_folds` | integer | 0 | 0.00% | 1 | 4 |

## `reproducibility_checklist` — Reproducibility checklist

**Phase:** P8 · **Rows:** 11 · **Columns:** 3

Eleven run-level reproducibility checks and their evidence.

| Column | Type | Missing | Missing % | Unique | Example |
| --- | --- | ---: | ---: | ---: | --- |
| `item` | text | 0 | 0.00% | 11 | global random seed fixed |
| `evidence` | text | 0 | 0.00% | 11 | SEED=42 |
| `ok` | boolean | 0 | 0.00% | 1 | True |

## App data layer

The application does not parse the 46 CSVs at runtime. It loads three JSON documents plus 46 per-table JSON files from `app/public/data/`.

### `manifest.json`

| Key | Contents |
| --- | --- |
| meta | Build timestamp, build id, source root and reconstruction note |
| project | Program identity, dataset, technologies and intended users |
| run | Run id, timestamps, duration, seed, environment and embedding timings |
| notebook | Cell and output counts |
| counts | Headline entity and artifact counts |
| kpis | Ten curated headline KPIs with definition, formula, source and verification |
| phases | Nine research phases with purpose, methods, counts and limitations |
| rqs | Eight research questions with finding-grade counts |
| findings | 64 graded findings with evidence and source row |
| figures | 129 figure records: title, phase, group, dimensions, thumb and full path |
| htmlArtifacts | Seven interactive Plotly artifacts |
| tables | 46 table profiles: rows, columns, dtypes, missing and unique |
| dataQuality | Completeness, contract, generator and class-balance profiles |
| experiments | 26 model, fold, anomaly and encoding experiments |
| environment | Pinned package versions and runtime |
| warnings | Nine captured notebook warnings |
| issues | 16 independently recorded project issues |
| auditNotes | Five independent audit notes that qualify ledger claims |
| graph | 15 nodes and 36 links for the provenance graph |
| gradeDefs | Definitions for strong / supports / caveat / weak |
| sources | Six source records with presence flags and fingerprints |

### `analysis.json`

| Key | Contents |
| --- | --- |
| class_balance | Train/test/overall counts and rates |
| contracts | Ten data contracts with status |
| generator | Seven generator-forensics metrics |
| schema | 72-row column profile including the index |
| quantiles | Nine amount quantiles for all, fraud and non-fraud |
| category_table / money | Category counts, rates, fraud dollars and USD per fraud |
| cards / cards_summary | 999 card profiles plus the zero-inflation summary |
| cities / zip3 / merchants | Entity-level rates and ranking extracts |
| weekly / weekly_series | 105-week trend with split and partial flags in the app |
| ablation / walkforward / psi | Model transfer, drift and ablation tables |
| capture / cost / thresholds | Review-budget and operating-point economics |
| experiments / supervised_models | 26 experiments and 9 supervised model summaries |
| graph-ready extracts | Top merchants, cities and ZIP3s plus merchant volume |

### `notebook.json`

Normalized notebook cells with source, outputs, execution counts and cell types for the in-app viewer. It is generated from the original `.ipynb`; the original remains the canonical source.

## Power BI pack

`powerbi/data/` contains 10 dimension CSVs and 49 fact CSVs. Column definitions follow the source tables above; the pack adds only keys and display helpers. Table grain, filter directions and measure placement are documented in `powerbi/relationships.md`.

## Coverage limits

- The raw transaction CSVs are absent, so the dictionary describes the **analytical** frame (71 columns) built by the notebook, not the 22 raw fields alone.
- `figure_index` and `findings_ledger` are report metadata, not analytical observations.
- `phase7_merchant_eb_table` has 700 rows because it is a merchant×category EB view, while the distinct merchant count is 693. Do not treat its row count as a merchant count.
