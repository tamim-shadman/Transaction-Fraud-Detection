# Metric catalog

Generated: **2026-10-20T17:57:53**  
Metrics: **155** · all values read from generated artifacts  
Machine-readable: `reports/metric_catalog.csv`.

## How to use this catalog

Every row names a metric, its value, its definition, the formula or derivation, the exact source file and locator, the app page(s) that display it, the independent validation check(s) that cover it, and any caveat. `confidence` is one of:

- **verified** — recomputed or directly loaded from a source table and covered by a validation check;
- **computed** — derived arithmetic from a verified source, without a dedicated check;
- **source claim** — stated in the ledger/log but not backed by a standalone table in the workspace.

## Headline metrics

| ID | Metric | Value | Source | Check | Confidence |
| --- | --- | ---: | --- | --- | --- |
| KPI-TRANSACTIONS | Transactions analysed | 1,852,394 | phase0_class_balance.csv | KPI-01 | verified |
| KPI-FRAUD_RATE | Observed fraud rate | 0.521% | phase0_class_balance.csv | KPI-02 | verified |
| KPI-FINDINGS | Graded findings | 64 | logs/findings_ledger.json | KPI-03 | verified |
| KPI-ARTIFACTS | Generated artifacts | 182 | figures/ & tables/ | KPI-04 | verified |
| KPI-RUN_TIME | End-to-end run | 5,513 s (1h 31m) | logs/findings.md | KPI-10 | verified |
| KPI-STRONG_FINDINGS | Strong findings | 30 | logs/findings_ledger.json | KPI-05 | verified |
| KPI-TEST_PR_AUC | Test PR-AUC | 0.5575 | phase8_ablation_decomposed.csv · FULL row | KPI-06 | verified |
| KPI-WF_PR_AUC | Walk-forward PR-AUC | 0.9510 | phase8_wf_vs_test.csv | KPI-07 | verified |
| KPI-OOD_GAP | OOD transfer gap | 0.4785 | phase8_wf_vs_test.csv | KPI-08 | verified |
| KPI-CAPTURE_1PCT | Capture at 1% budget | 65.45% | phase8_capture_at_k.csv | KPI-09 | verified |

## All metrics

| ID | Metric | Value | Source | Check | Confidence |
| --- | --- | ---: | --- | --- | --- |
| KPI-TRANSACTIONS | Transactions analysed | 1,852,394 | phase0_class_balance.csv | KPI-01 | verified |
| KPI-FRAUD_RATE | Observed fraud rate | 0.521% | phase0_class_balance.csv | KPI-02 | verified |
| KPI-FINDINGS | Graded findings | 64 | logs/findings_ledger.json | KPI-03 | verified |
| KPI-ARTIFACTS | Generated artifacts | 182 | figures/ & tables/ | KPI-04 | verified |
| KPI-RUN_TIME | End-to-end run | 5,513 s (1h 31m) | logs/findings.md | KPI-10 | verified |
| KPI-STRONG_FINDINGS | Strong findings | 30 | logs/findings_ledger.json | KPI-05 | verified |
| KPI-TEST_PR_AUC | Test PR-AUC | 0.5575 | phase8_ablation_decomposed.csv · FULL row | KPI-06 | verified |
| KPI-WF_PR_AUC | Walk-forward PR-AUC | 0.9510 | phase8_wf_vs_test.csv | KPI-07 | verified |
| KPI-OOD_GAP | OOD transfer gap | 0.4785 | phase8_wf_vs_test.csv | KPI-08 | verified |
| KPI-CAPTURE_1PCT | Capture at 1% budget | 65.45% | phase8_capture_at_k.csv | KPI-09 | verified |
| DQ-01 | Transactions analysed | 1,852,394 | phase0_class_balance.csv | DATA-01 | verified |
| DQ-02 | Train transactions | 1,296,675 | phase0_class_balance.csv | DATA-02 | verified |
| DQ-03 | Test transactions | 555,719 | phase0_class_balance.csv | DATA-03 | verified |
| DQ-04 | Fraud events | 9,651 | phase0_class_balance.csv | DATA-04 | verified |
| DQ-05 | Train fraud events | 7,506 | phase0_class_balance.csv | DATA-05 | verified |
| DQ-06 | Test fraud events | 2,145 | phase0_class_balance.csv | DATA-06 | verified |
| DQ-07 | Observed fraud rate | 0.521% | phase0_class_balance.csv | DATA-07 | verified |
| DQ-08 | Train fraud rate | 0.579% | phase0_class_balance.csv | DATA-08 | verified |
| DQ-09 | Test fraud rate | 0.386% | phase0_class_balance.csv | DATA-09 | verified |
| DQ-10 | Cards | 999 | phase2_card_profiles.csv | DATA-11 | verified |
| DQ-11 | Merchant categories | 14 | phase1_category_table.csv | DATA-12 | verified |
| DQ-12 | States | 51 | phase5_chi2_cramers.csv | DATA-13 | verified |
| DQ-13 | Merchants | 693 | phase1_merchant_table.csv | DATA-14 | verified |
| DQ-14 | Cities | 836 | phase2_city_table.csv | DATA-15 | verified |
| DQ-15 | ZIP3 prefixes | 532 | phase2_zip3_table.csv | DATA-16 | verified |
| DQ-16 | Analytical columns | 71 | phase0_schema.csv | DATA-20 | verified |
| DQ-17 | Raw columns | 22 | manifest.json | DATA-71 | verified |
| DQ-18 | Columns with missing values | 11 | phase0_schema.csv | DATA-18 | verified |
| DQ-19 | Maximum missing share | 10.79% | phase0_schema.csv | DATA-19 | verified |
| DQ-20 | Duplicate transaction keys | 0 | phase0_contracts.csv | DATA-24 | verified |
| DQ-21 | Data contracts evaluated | 10 | phase0_contracts.csv | DATA-21 | verified |
| DQ-22 | Flagged contracts | 1 | phase0_contracts.csv | DATA-22 | verified |
| DQ-23 | ZIP values below 10,000 | 116,389 | phase0_contracts.csv | DATA-25 | verified |
| DQ-24 | Model feature count | 27 | phase8_ablation_decomposed.csv | DATA-17 | verified |
| DQ-25 | Source data size | 501.6 | logs/data_fingerprint.json | INV-21 / INV-22 | verified |
| DQ-26 | Analytical memory | 636.4 | manifest.json |  | computed |
| AMT-01 | Median fraud amount | $390.00 | phase1_amt_quantiles.csv | DATA-38 | verified |
| AMT-02 | Median genuine amount | $47.24 | phase1_amt_quantiles.csv | DATA-39 | verified |
| AMT-03 | Amount KS D | 0.7238 | phase5_mw_effect_sizes.csv | DATA-40 | verified |
| AMT-04 | Amount Cliff's delta | 0.6686 | phase5_mw_effect_sizes.csv | DATA-41 | verified |
| AMT-05 | Cliff's delta 95% CI low | 0.6559 | phase5_mw_effect_sizes.csv | DATA-42 | verified |
| AMT-06 | Cliff's delta 95% CI high | 0.6801 | phase5_mw_effect_sizes.csv | DATA-43 | verified |
| AMT-07 | Total fraud exposure | $5,121,413.36 | phase2_money_category.csv | DATA-44 | verified |
| CARD-01 | Cards never defrauded | 23 | phase2_card_profiles.csv | DATA-26 | verified |
| CARD-02 | Cards ever defrauded | 976 | phase2_card_profiles.csv | DATA-27 | verified |
| CARD-03 | Cards at 100% fraud | 91 | phase2_card_profiles.csv | DATA-28 | verified |
| CARD-04 | Cards with partial fraud | 885 | phase2_card_profiles.csv | DATA-29 | verified |
| CARD-05 | Median transactions before first fraud | 556 | logs/findings.md |  | source claim |
| CARD-06 | Cards hit on first transaction | 9.32% | logs/findings.md |  | source claim |
| TMP-01 | Weekly observations | 105 | phase3_weekly_rate_table.csv | DATA-47 | verified |
| TMP-02 | Full train weeks | 76 | phase3_weekly_rate_table.csv | DATA-56 | verified |
| TMP-03 | Full test weeks | 27 | phase3_weekly_rate_table.csv | DATA-56 | verified |
| TMP-04 | Train full-week mean rate | 0.603% | phase3_weekly_rate_table.csv | DATA-53 | verified |
| TMP-05 | Test full-week mean rate | 0.425% | phase3_weekly_rate_table.csv | DATA-54 | verified |
| TMP-06 | Final week transactions | 18,921 | phase3_weekly_rate_table.csv | DATA-51 | verified |
| TMP-07 | Final week frauds | 0 | phase3_weekly_rate_table.csv | DATA-52 | verified |
| TMP-08 | Night fraud rate | 0.811% | phase7_high_risk_combo.csv | DATA-58 | verified |
| TMP-09 | Day fraud rate | 0.435% | phase7_high_risk_combo.csv | DATA-59 | verified |
| TMP-10 | Hazard peak month | 23 | phase7_hazard_table.csv | DATA-57 | verified |
| TMP-11 | Hazard peak value | 48.89% | phase7_hazard_table.csv | DATA-57 | verified |
| INT-01 | High-risk combination rate | 22.08% | phase7_high_risk_combo.csv | DATA-61 | verified |
| INT-02 | High-risk combination lift | 42.3715 | phase7_high_risk_combo.csv | DATA-62 | verified |
| INT-03 | Night lift | 1.5570 | phase7_high_risk_combo.csv | DATA-60 | verified |
| INT-04 | Transactions above 1,000 km/h | 38,005 | phase7_speed_rate_table.csv | DATA-64 | verified |
| INT-05 | Share above 1,000 km/h | 2.05% | phase7_speed_rate_table.csv | DATA-65 | verified |
| INT-06 | Speed-table missing rows | 1,043 | phase7_speed_rate_table.csv | DATA-67 | verified |
| INT-07 | Shopping_net fraud rate | 1.59% | phase1_category_table.csv |  | computed |
| INT-08 | Grocery_pos fraud rate | 1.26% | phase1_category_table.csv |  | computed |
| INT-09 | Misc_net fraud rate | 1.30% | phase1_category_table.csv |  | computed |
| INT-10 | Category Cramér's V | 0.0670 | phase5_chi2_cramers.csv |  | computed |
| INT-11 | ZIP3 Cramér's V | 0.1483 | phase5_chi2_cramers.csv |  | computed |
| INT-12 | Merchant max categories | 2 | phase0_generator_forensics.csv |  | computed |
| INT-13 | Distance KS (fraud vs genuine) | 0.0071 | phase0_generator_forensics.csv |  | computed |
| INT-14 | ZIP3→state purity | 100.00% | phase0_generator_forensics.csv |  | computed |
| UNS-01 | PCA(2) logistic AUC | 0.8157 | phase4_separability_table.csv |  | computed |
| UNS-02 | Best embedding AUC | 0.8157 | phase4_separability_table.csv |  | computed |
| UNS-03 | Worst embedding AUC | 0.4583 | phase4_separability_table.csv |  | computed |
| UNS-04 | Anomaly AUC range low | 0.7311 | phase4_anomaly_summary.csv |  | computed |
| UNS-05 | Anomaly AUC range high | 0.8810 | phase4_anomaly_summary.csv |  | computed |
| UNS-06 | DBSCAN noise share | 3.95% | phase4_dbscan_clusters.csv |  | computed |
| UNS-07 | DBSCAN noise fraud rate | 6.08% | phase4_dbscan_clusters.csv |  | computed |
| MOD-01 | Final test PR-AUC | 0.5575 | phase8_ablation_decomposed.csv | MODEL-01 / KPI-06 | verified |
| MOD-02 | Final test ROC-AUC | 0.9677 | phase8_ablation_decomposed.csv | MODEL-02 | verified |
| MOD-03 | PR-AUC bootstrap CI low | 0.5365 | logs/findings.md |  | source claim |
| MOD-04 | PR-AUC bootstrap CI high | 0.5784 | logs/findings.md |  | source claim |
| MOD-05 | Walk-forward mean validation PR-AUC | 0.9510 | phase8_wf_vs_test.csv | MODEL-09 / KPI-07 | verified |
| MOD-06 | Walk-forward validation SD | 0.0152 | phase8_wf_vs_test.csv | MODEL-10 | verified |
| MOD-07 | Same-fold test PR-AUC | 0.4726 | phase8_wf_vs_test.csv | MODEL-11 | verified |
| MOD-08 | Same-fold test SD | 0.0761 | phase8_wf_vs_test.csv | MODEL-12 | verified |
| MOD-09 | OOD transfer gap | 0.4785 | phase8_wf_vs_test.csv | MODEL-13 / KPI-08 | verified |
| MOD-10 | Severe PSI features | 7 | phase8_psi.csv | MODEL-18 | verified |
| MOD-11 | Moderate PSI features | 1 | phase8_psi.csv | MODEL-19 | verified |
| MOD-12 | Stable PSI features | 19 | phase8_psi.csv | MODEL-20 | verified |
| MOD-13 | Severe + moderate share | 29.63% | phase8_psi.csv | MODEL-23 | verified |
| MOD-14 | Top PSI feature value | 6.5143 | phase8_psi.csv | MODEL-21 | verified |
| MOD-15 | Capture@1% recall | 65.45% | phase8_capture_at_k.csv | MODEL-25 / KPI-09 | verified |
| MOD-16 | Capture@1% precision | 25.27% | phase8_capture_at_k.csv | MODEL-26 | verified |
| MOD-17 | Capture@1% USD share | 68.70% | phase8_capture_at_k.csv | MODEL-27 | verified |
| MOD-18 | Capture@1% reviews | 5,557 | phase8_capture_at_k.csv | MODEL-28 | verified |
| MOD-19 | Capture@1% frauds caught | 1,404 | phase8_capture_at_k.csv | MODEL-29 | verified |
| MOD-20 | Capture@5% recall | 86.20% | phase8_capture_at_k.csv | MODEL-30 | verified |
| MOD-21 | Capture@5% USD share | 93.42% | phase8_capture_at_k.csv | MODEL-31 | verified |
| MOD-22 | Cost-min threshold | 0.00001 | phase8_threshold_table.csv |  | computed |
| MOD-23 | Cost-min TP | 1,807 | phase8_threshold_table.csv | MODEL-35 | verified |
| MOD-24 | Cost-min FP | 20,322 | phase8_threshold_table.csv | MODEL-36 | verified |
| MOD-25 | Cost-min FN | 338 | phase8_threshold_table.csv | MODEL-37 | verified |
| MOD-26 | Cost-min recall | 84.24% | phase8_threshold_table.csv | MODEL-39 | verified |
| MOD-27 | Cost-min precision | 8.17% | phase8_threshold_table.csv | MODEL-40 | verified |
| MOD-28 | Cost-min missed USD | $92,043.87 | phase8_threshold_table.csv | MODEL-41 | verified |
| MOD-29 | Cost-min total loss | $193,653.87 | phase8_threshold_table.csv | MODEL-42 | verified |
| MOD-30 | F1-max threshold | 0.11267 | phase8_threshold_table.csv | MODEL-47 | verified |
| MOD-31 | F1 max | 0.5504 | phase8_threshold_table.csv | MODEL-47 | verified |
| MOD-32 | Cost-sensitivity recall range low | 70.21% | phase8_cost_sensitivity.csv |  | computed |
| MOD-33 | Cost-sensitivity recall range high | 91.56% | phase8_cost_sensitivity.csv |  | computed |
| MOD-34 | Ablation minus card_prior_fraud | 0.8315 | phase8_ablation_decomposed.csv | MODEL-04 | verified |
| MOD-35 | Ablation recovery from removing card_prior_fraud | 0.2740 | phase8_ablation_decomposed.csv | MODEL-04 | verified |
| MOD-36 | Raw-only PR-AUC | 0.8353 | phase8_ablation_decomposed.csv | MODEL-03 | verified |
| MOD-37 | FULL minus raw-only | -0.2779 | phase8_ablation_decomposed.csv | MODEL-05 | verified |
| MOD-38 | Learning-curve peak PR-AUC | 0.6266 | phase8_learning_curve.csv | MODEL-58 | verified |
| MOD-39 | Learning-curve full-data PR-AUC | 0.5254 | phase8_learning_curve.csv | MODEL-60 | verified |
| MOD-40 | Monotonic-constraint PR-AUC | 0.5922 | phase8_monotonic_comparison.csv | MODEL-65 | verified |
| MOD-41 | Time-decay PR-AUC | 0.5408 | phase8_time_decay_comparison.csv | MODEL-66 | verified |
| MOD-42 | Fold-ensemble PR-AUC | 0.5128 | phase8_ensemble_comparison.csv | MODEL-64 | verified |
| MOD-43 | Leave-card-out seen-card PR-AUC | 0.9948 | phase8_leave_card_out.csv |  | computed |
| MOD-44 | Leave-card-out held-card PR-AUC | 0.9639 | phase8_leave_card_out.csv |  | computed |
| MOD-45 | Leave-card-out held-card test PR-AUC | 0.5541 | phase8_leave_card_out.csv | MODEL-62 | verified |
| MOD-46 | Calibration temperature | 1.4178 | phase8_calibration_temp.csv | MODEL-53 | verified |
| MOD-47 | ECE before temperature scaling | 0.0001594 | phase8_calibration_temp.csv | MODEL-54 | verified |
| MOD-48 | ECE after temperature scaling | 0.0001184 | phase8_calibration_temp.csv | MODEL-55 | verified |
| MOD-49 | Reported Brier score | 0.002414 | logs/findings.md |  | source claim |
| MOD-50 | Reported ECE | 0.001949 | logs/findings.md |  | source claim |
| INV-01 | Graded findings | 64 | logs/findings_ledger.json | FIND-01 | verified |
| INV-02 | Strong findings | 30 | logs/findings_ledger.json | FIND-02 / KPI-05 | verified |
| INV-03 | Supporting findings | 27 | logs/findings_ledger.json | FIND-03 | verified |
| INV-04 | Caveat findings | 6 | logs/findings_ledger.json | FIND-04 | verified |
| INV-05 | Weak findings | 1 | logs/findings_ledger.json | FIND-05 | verified |
| INV-06 | Independent audit notes | 5 | app/public/data/manifest.json | NARR-02 | verified |
| INV-07 | Recorded issues | 16 | app/public/data/manifest.json | NARR-03 | verified |
| INV-08 | High-severity issues | 4 | app/public/data/manifest.json |  | computed |
| INV-09 | Medium-severity issues | 10 | app/public/data/manifest.json |  | computed |
| INV-10 | Low-severity issues | 2 | app/public/data/manifest.json |  | computed |
| INV-11 | Notebook warnings | 9 | app/public/data/manifest.json |  | computed |
| INV-12 | Source figures | 129 | figures/ | INV-06 | verified |
| INV-13 | Interactive artifacts | 7 | figures/ | INV-07 | verified |
| INV-14 | Source tables | 46 | tables/ | INV-05 | verified |
| INV-15 | Notebook cells | 66 | fraud_eda_colab(1).ipynb | INV-01 | verified |
| INV-16 | Notebook code cells | 33 | fraud_eda_colab(1).ipynb | INV-02 | verified |
| INV-17 | Notebook error outputs | 0 | fraud_eda_colab(1).ipynb | INV-04 | verified |
| INV-18 | Generated artifacts | 182 | figures/; tables/ | KPI-04 | verified |
| INV-19 | Validation checks | 196 | tests/validation_results.json |  | computed |
| INV-20 | Validation pass rate | 100.00% | tests/validation_results.json |  | computed |
| PBI-01 | Power BI tables | 59 | powerbi/manifest.json |  | computed |
| PBI-02 | Power BI measures | 112 | powerbi/dax/measures.dax |  | computed |
| PBI-03 | Power BI relationships | 17 | powerbi/manifest.json |  | computed |
| PBI-04 | Date dimension rows | 734 | powerbi/data/dim_date.csv |  | computed |

## Metric definitions and caveats

**KPI-TRANSACTIONS · Transactions analysed** — 1,852,394. Total rows across the train and test source frames. Formula: `1,296,675 train + 555,719 test`. Source: `phase0_class_balance.csv` (headline KPI).

**KPI-FRAUD_RATE · Observed fraud rate** — 0.521%. Fraud transactions divided by all transactions. Formula: `9,651 / 1,852,394`. Source: `phase0_class_balance.csv` (headline KPI).

**KPI-FINDINGS · Graded findings** — 64. Entries in the run's findings ledger. Formula: `Count of findings_ledger.json records`. Source: `logs/findings_ledger.json` (headline KPI).

**KPI-ARTIFACTS · Generated artifacts** — 182. PNG figures, interactive HTML artifacts and CSV tables in the output bundle. Formula: `129 PNG + 7 HTML + 46 CSV`. Source: `figures/ & tables/` (headline KPI).

**KPI-RUN_TIME · End-to-end run** — 5,513 s (1h 31m). Wall-clock time between the documented run start and end. Formula: `18:01:59 − 16:30:06 = 5,513 s`. Source: `logs/findings.md` (headline KPI).

**KPI-STRONG_FINDINGS · Strong findings** — 30. Findings assigned grade 'strong' in the source ledger. Formula: `COUNT(findings WHERE grade = 'strong')`. Source: `logs/findings_ledger.json` (headline KPI).

**KPI-TEST_PR_AUC · Test PR-AUC** — 0.5575. Average precision on the held-out test split for the final 27-feature LightGBM. This is a cross-boundary OOD estimate. Formula: `sklearn.average_precision_score(y_test, p_test)`. Source: `phase8_ablation_decomposed.csv · FULL row` (headline KPI).

**KPI-WF_PR_AUC · Walk-forward PR-AUC** — 0.9510. Mean in-domain validation PR-AUC across four time-ordered folds. Formula: `mean(fold PR-AUC)`. Source: `phase8_wf_vs_test.csv` (headline KPI).

**KPI-OOD_GAP · OOD transfer gap** — 0.4785. Mean fold validation PR-AUC minus the same folds' test PR-AUC. Formula: `0.951041 − 0.472580`. Source: `phase8_wf_vs_test.csv` (headline KPI).

**KPI-CAPTURE_1PCT · Capture at 1% budget** — 65.45%. Share of test fraud events caught when reviewing the top 1% of scored transactions. Formula: `1,404 / 2,145`. Source: `phase8_capture_at_k.csv` (headline KPI).

**DQ-01 · Transactions analysed** — 1,852,394. All train and test rows. Formula: `1,296,675 + 555,719`. Source: `phase0_class_balance.csv` (overall row).

**DQ-02 · Train transactions** — 1,296,675. Rows before the temporal boundary. Formula: `row: train`. Source: `phase0_class_balance.csv` (train row).

**DQ-03 · Test transactions** — 555,719. Rows after the temporal boundary. Formula: `row: test`. Source: `phase0_class_balance.csv` (test row).

**DQ-04 · Fraud events** — 9,651. Positive `is_fraud` labels. Formula: `sum(fraud) across splits`. Source: `phase0_class_balance.csv` (overall row).

**DQ-05 · Train fraud events** — 7,506. Frauds before the boundary. Formula: `row: train`. Source: `phase0_class_balance.csv` (train row).

**DQ-06 · Test fraud events** — 2,145. Frauds after the boundary. Formula: `row: test`. Source: `phase0_class_balance.csv` (test row).

**DQ-07 · Observed fraud rate** — 0.521%. Fraud events divided by all transactions. Formula: `9,651 / 1,852,394`. Source: `phase0_class_balance.csv` (overall row).

**DQ-08 · Train fraud rate** — 0.579%. Train frauds divided by train rows. Formula: `7,506 / 1,296,675`. Source: `phase0_class_balance.csv` (train row).

**DQ-09 · Test fraud rate** — 0.386%. Test frauds divided by test rows. Formula: `2,145 / 555,719`. Source: `phase0_class_balance.csv` (test row).

**DQ-10 · Cards** — 999. Distinct card numbers in the card-profile table. Formula: `count distinct cc_num`. Source: `phase2_card_profiles.csv` (999 rows).

**DQ-11 · Merchant categories** — 14. Distinct merchant categories. Formula: `count distinct category`. Source: `phase1_category_table.csv` (14 rows).

**DQ-12 · States** — 51. Distinct state codes in the chi-square table. Formula: `count distinct state`. Source: `phase5_chi2_cramers.csv` (state row).

**DQ-13 · Merchants** — 693. Distinct clean merchant names. Formula: `count distinct merchant`. Source: `phase1_merchant_table.csv` (693 rows).

**DQ-14 · Cities** — 836. Distinct city records. Formula: `count distinct city`. Source: `phase2_city_table.csv` (836 rows).

**DQ-15 · ZIP3 prefixes** — 532. Distinct 3-digit ZIP prefixes. Formula: `count distinct zip3`. Source: `phase2_zip3_table.csv` (532 rows).

**DQ-16 · Analytical columns** — 71. Columns in the derived analytical frame, excluding the index. Formula: `72 schema rows − 1 index`. Source: `phase0_schema.csv` (non-index rows).

**DQ-17 · Raw columns** — 22. Original Sparkov columns before derivation. Formula: `raw schema`. Source: `manifest.json` (dataQuality.summary.rawColumns).

**DQ-18 · Columns with missing values** — 11. Derived history columns with structural nulls. Formula: `count(columns missing_pct > 0)`. Source: `phase0_schema.csv` (missing_pct > 0).

**DQ-19 · Maximum missing share** — 10.79%. Highest column-level missingness. Formula: `max(missing_pct)`. Source: `phase0_schema.csv` (amt_z_prior).

**DQ-20 · Duplicate transaction keys** — 0. Rows with a repeated `trans_num`. Formula: `count duplicate trans_num`. Source: `phase0_contracts.csv` (duplicate contract).

**DQ-21 · Data contracts evaluated** — 10. Domain and integrity checks. Formula: `count contracts`. Source: `phase0_contracts.csv` (10 rows).

**DQ-22 · Flagged contracts** — 1. Contracts that failed an expected range. Formula: `count(status = FLAG)`. Source: `phase0_contracts.csv` (age contract).

**DQ-23 · ZIP values below 10,000** — 116,389. Leading-zero loss in the numeric ZIP field. Formula: `count(zip < 10000)`. Source: `phase0_contracts.csv` (zip contract).

**DQ-24 · Model feature count** — 27. Features in the final LightGBM. Formula: `FULL n_features`. Source: `phase8_ablation_decomposed.csv` (FULL row).

**DQ-25 · Source data size** — 501.6. Referenced raw train + test file size. Formula: `351.2 + 150.4`. Source: `logs/data_fingerprint.json` (two source records). **Caveat:** Files absent; size from fingerprint log

**DQ-26 · Analytical memory** — 636.4. In-memory size of the analytical frame. Formula: `sum(column memory)`. Source: `manifest.json` (dataQuality.summary.memoryMB).

**AMT-01 · Median fraud amount** — $390.00. Median transaction amount among frauds. Formula: `P50(amount | fraud)`. Source: `phase1_amt_quantiles.csv` (P50 row).

**AMT-02 · Median genuine amount** — $47.24. Median transaction amount among non-frauds. Formula: `P50(amount | non-fraud)`. Source: `phase1_amt_quantiles.csv` (P50 row).

**AMT-03 · Amount KS D** — 0.7238. Two-sample Kolmogorov–Smirnov distance. Formula: `sup|F_fraud − F_nonfraud|`. Source: `phase5_mw_effect_sizes.csv` (amt row).

**AMT-04 · Amount Cliff's delta** — 0.6686. Probability a random fraud amount exceeds a random genuine amount, rescaled to [−1,1]. Formula: `Cliff's delta`. Source: `phase5_mw_effect_sizes.csv` (amt row).

**AMT-05 · Cliff's delta 95% CI low** — 0.6559. Bootstrap lower bound. Formula: `2.5th percentile`. Source: `phase5_mw_effect_sizes.csv` (amt row).

**AMT-06 · Cliff's delta 95% CI high** — 0.6801. Bootstrap upper bound. Formula: `97.5th percentile`. Source: `phase5_mw_effect_sizes.csv` (amt row).

**AMT-07 · Total fraud exposure** — $5,121,413.36. Sum of fraud transaction amounts by category. Formula: `sum(fraud_usd)`. Source: `phase2_money_category.csv` (14 rows).

**CARD-01 · Cards never defrauded** — 23. Cards with zero fraud events. Formula: `count(k = 0)`. Source: `phase2_card_profiles.csv` (999 rows).

**CARD-02 · Cards ever defrauded** — 976. Cards with at least one fraud event. Formula: `count(k > 0)`. Source: `phase2_card_profiles.csv` (999 rows).

**CARD-03 · Cards at 100% fraud** — 91. Cards whose every transaction is fraud. Formula: `count(fraud_rate = 1)`. Source: `phase2_card_profiles.csv` (999 rows).

**CARD-04 · Cards with partial fraud** — 885. Cards with at least one genuine and one fraud transaction. Formula: `count(0 < fraud_rate < 1)`. Source: `phase2_card_profiles.csv` (999 rows).

**CARD-05 · Median transactions before first fraud** — 556. Card lifetime in transactions before first fraud. Formula: `median(customer lifetime)`. Source: `logs/findings.md` (RQ5 ledger). **Caveat:** Ledger claim; no standalone table

**CARD-06 · Cards hit on first transaction** — 9.32%. Share of defrauded cards whose first transaction is fraud. Formula: `first_txn_share`. Source: `logs/findings.md` (RQ5 ledger). **Caveat:** Ledger claim; no standalone table

**TMP-01 · Weekly observations** — 105. Weeks in the trend table. Formula: `row count`. Source: `phase3_weekly_rate_table.csv` (105 rows).

**TMP-02 · Full train weeks** — 76. Train weeks ending on or before 2020-06-14. Formula: `ts <= 2020-06-14`. Source: `phase3_weekly_rate_table.csv` (filtered rows).

**TMP-03 · Full test weeks** — 27. Test weeks after the boundary week and before the final edge week. Formula: `2020-06-21 < ts < 2021-01-03`. Source: `phase3_weekly_rate_table.csv` (filtered rows).

**TMP-04 · Train full-week mean rate** — 0.603%. Unweighted mean of full train weeks. Formula: `mean(rate)`. Source: `phase3_weekly_rate_table.csv` (76 weeks).

**TMP-05 · Test full-week mean rate** — 0.425%. Unweighted mean of full test weeks. Formula: `mean(rate)`. Source: `phase3_weekly_rate_table.csv` (27 weeks).

**TMP-06 · Final week transactions** — 18,921. Transactions in the partial 2021-01-03 week. Formula: `size`. Source: `phase3_weekly_rate_table.csv` (last row).

**TMP-07 · Final week frauds** — 0. Frauds in the partial 2021-01-03 week. Formula: `sum`. Source: `phase3_weekly_rate_table.csv` (last row).

**TMP-08 · Night fraud rate** — 0.811%. Fraud rate for night transactions. Formula: `night fraud / night transactions`. Source: `phase7_high_risk_combo.csv` (night alone row).

**TMP-09 · Day fraud rate** — 0.435%. Implied fraud rate outside night. Formula: `residual fraud / residual transactions`. Source: `phase7_high_risk_combo.csv` (derived row).

**TMP-10 · Hazard peak month** — 23. Month with the highest discrete hazard. Formula: `argmax(hazard)`. Source: `phase7_hazard_table.csv` (month 23).

**TMP-11 · Hazard peak value** — 48.89%. Discrete hazard at month 23. Formula: `events / at-risk`. Source: `phase7_hazard_table.csv` (month 23).

**INT-01 · High-risk combination rate** — 22.08%. Night + risky category + amount ≥ $500. Formula: `segment rate`. Source: `phase7_high_risk_combo.csv` (COMBO row).

**INT-02 · High-risk combination lift** — 42.3715. Combination rate divided by baseline. Formula: `rate / 0.005210`. Source: `phase7_high_risk_combo.csv` (COMBO row).

**INT-03 · Night lift** — 1.5570. Night rate divided by baseline. Formula: `rate / 0.005210`. Source: `phase7_high_risk_combo.csv` (night row).

**INT-04 · Transactions above 1,000 km/h** — 38,005. Sum of 1k–5k and >5k speed bins. Formula: `30,327 + 7,678`. Source: `phase7_speed_rate_table.csv` (speed bins).

**INT-05 · Share above 1,000 km/h** — 2.05%. Share of all transactions above 1,000 km/h. Formula: `38,005 / 1,852,394`. Source: `phase7_speed_rate_table.csv` (speed bins).

**INT-06 · Speed-table missing rows** — 1,043. Rows with no prior location, excluded from the speed table. Formula: `1,852,394 − sum(speed n)`. Source: `phase7_speed_rate_table.csv` (5 bins).

**INT-07 · Shopping_net fraud rate** — 1.59%. Highest-volume high-risk category. Formula: `k / n`. Source: `phase1_category_table.csv` (shopping_net row).

**INT-08 · Grocery_pos fraud rate** — 1.26%. Second high-risk category. Formula: `k / n`. Source: `phase1_category_table.csv` (grocery_pos row).

**INT-09 · Misc_net fraud rate** — 1.30%. Third high-risk category. Formula: `k / n`. Source: `phase1_category_table.csv` (misc_net row).

**INT-10 · Category Cramér's V** — 0.0670. Bias-uncorrected association with fraud. Formula: `sqrt(chi2 / (n·(min(r,c)−1)))`. Source: `phase5_chi2_cramers.csv` (category row).

**INT-11 · ZIP3 Cramér's V** — 0.1483. Association with fraud over 532 levels. Formula: `sqrt(chi2 / (n·(min(r,c)−1)))`. Source: `phase5_chi2_cramers.csv` (zip3 row). **Caveat:** Not comparable with 14-level category V (CAV-06)

**INT-12 · Merchant max categories** — 2. Maximum categories observed for one merchant. Formula: `max cats/merchant`. Source: `phase0_generator_forensics.csv` (merchant_single_category). **Caveat:** Near-deterministic, not strict

**INT-13 · Distance KS (fraud vs genuine)** — 0.0071. Univariate separation of card→merchant distance. Formula: `KS D`. Source: `phase0_generator_forensics.csv` (dist_km_ks_D_fraud_vs_non). **Caveat:** Generator jitter artifact

**INT-14 · ZIP3→state purity** — 100.00%. Share of ZIP3s mapping to one state. Formula: `purity`. Source: `phase0_generator_forensics.csv` (zip3_state_purity).

**UNS-01 · PCA(2) logistic AUC** — 0.8157. Separability of the 2D PCA embedding. Formula: `logistic AUC`. Source: `phase4_separability_table.csv` (PCA(2) row).

**UNS-02 · Best embedding AUC** — 0.8157. Best of seven embeddings. Formula: `max(AUC)`. Source: `phase4_separability_table.csv` (PCA(2) row).

**UNS-03 · Worst embedding AUC** — 0.4583. Worst of seven embeddings. Formula: `min(AUC)`. Source: `phase4_separability_table.csv` (UMAP(nn=50) row).

**UNS-04 · Anomaly AUC range low** — 0.7311. Lowest anomaly-detector AUC. Formula: `min(AUC)`. Source: `phase4_anomaly_summary.csv` (Autoencoder row). **Caveat:** LOF uses 5,000 rows; others 50,000

**UNS-05 · Anomaly AUC range high** — 0.8810. Highest anomaly-detector AUC. Formula: `max(AUC)`. Source: `phase4_anomaly_summary.csv` (LOF row). **Caveat:** LOF uses 5,000 rows; others 50,000

**UNS-06 · DBSCAN noise share** — 3.95%. Share of the 10,000-point sample labelled noise. Formula: `395 / 10,000`. Source: `phase4_dbscan_clusters.csv` (noise row).

**UNS-07 · DBSCAN noise fraud rate** — 6.08%. Fraud rate inside DBSCAN noise. Formula: `k / n`. Source: `phase4_dbscan_clusters.csv` (noise row).

**MOD-01 · Final test PR-AUC** — 0.5575. Average precision on the cross-boundary test split. Formula: `average_precision_score`. Source: `phase8_ablation_decomposed.csv` (FULL row). **Caveat:** OOD transfer estimate

**MOD-02 · Final test ROC-AUC** — 0.9677. Ranking quality on the test split. Formula: `roc_auc_score`. Source: `phase8_ablation_decomposed.csv` (FULL row).

**MOD-03 · PR-AUC bootstrap CI low** — 0.5365. 2.5th bootstrap percentile. Formula: `200 resamples`. Source: `logs/findings.md` (RQ8 ledger).

**MOD-04 · PR-AUC bootstrap CI high** — 0.5784. 97.5th bootstrap percentile. Formula: `200 resamples`. Source: `logs/findings.md` (RQ8 ledger).

**MOD-05 · Walk-forward mean validation PR-AUC** — 0.9510. Mean in-domain validation across four folds. Formula: `mean(fold PR-AUC)`. Source: `phase8_wf_vs_test.csv` (summary row).

**MOD-06 · Walk-forward validation SD** — 0.0152. Between-fold standard deviation. Formula: `SD(fold PR-AUC)`. Source: `phase8_wf_vs_test.csv` (summary row).

**MOD-07 · Same-fold test PR-AUC** — 0.4726. Mean test PR-AUC of the four fold models. Formula: `mean(fold test PR-AUC)`. Source: `phase8_wf_vs_test.csv` (summary row).

**MOD-08 · Same-fold test SD** — 0.0761. Between-fold test SD. Formula: `SD(fold test PR-AUC)`. Source: `phase8_wf_vs_test.csv` (summary row).

**MOD-09 · OOD transfer gap** — 0.4785. In-domain validation minus cross-boundary test. Formula: `0.951041 − 0.472580`. Source: `phase8_wf_vs_test.csv` (summary row).

**MOD-10 · Severe PSI features** — 7. Features with PSI ≥ 0.25. Formula: `count(psi >= 0.25)`. Source: `phase8_psi.csv` (27 rows).

**MOD-11 · Moderate PSI features** — 1. Features with 0.10 ≤ PSI < 0.25. Formula: `count(0.1 <= psi < 0.25)`. Source: `phase8_psi.csv` (27 rows).

**MOD-12 · Stable PSI features** — 19. Features with PSI < 0.10. Formula: `count(psi < 0.1)`. Source: `phase8_psi.csv` (27 rows).

**MOD-13 · Severe + moderate share** — 29.63%. Share of features with PSI ≥ 0.10. Formula: `8 / 27`. Source: `phase8_psi.csv` (27 rows).

**MOD-14 · Top PSI feature value** — 6.5143. Largest PSI, on `month_sin`. Formula: `PSI(month_sin)`. Source: `phase8_psi.csv` (first row). **Caveat:** Calendar coverage artifact

**MOD-15 · Capture@1% recall** — 65.45%. Fraud events caught at 1% review budget. Formula: `1,404 / 2,145`. Source: `phase8_capture_at_k.csv` (1.0 row).

**MOD-16 · Capture@1% precision** — 25.27%. Fraud share among 5,557 reviewed transactions. Formula: `1,404 / 5,557`. Source: `phase8_capture_at_k.csv` (1.0 row).

**MOD-17 · Capture@1% USD share** — 68.70%. Share of fraud dollars captured. Formula: `usd_captured / total`. Source: `phase8_capture_at_k.csv` (1.0 row).

**MOD-18 · Capture@1% reviews** — 5,557. Transactions reviewed at 1%. Formula: `1% × 555,719`. Source: `phase8_capture_at_k.csv` (1.0 row).

**MOD-19 · Capture@1% frauds caught** — 1,404. Fraud events caught at 1%. Formula: `TP at budget`. Source: `phase8_capture_at_k.csv` (1.0 row).

**MOD-20 · Capture@5% recall** — 86.20%. Fraud events caught at 5% budget. Formula: `1,849 / 2,145`. Source: `phase8_capture_at_k.csv` (5.0 row).

**MOD-21 · Capture@5% USD share** — 93.42%. Fraud dollars caught at 5% budget. Formula: `usd_captured / total`. Source: `phase8_capture_at_k.csv` (5.0 row).

**MOD-22 · Cost-min threshold** — 0.00001. Threshold minimizing total expected loss at $5/FP. Formula: `argmin total_loss`. Source: `phase8_threshold_table.csv` (cost-min row).

**MOD-23 · Cost-min TP** — 1,807. True positives at the cost-min threshold. Formula: `TP`. Source: `phase8_threshold_table.csv` (cost-min row).

**MOD-24 · Cost-min FP** — 20,322. False positives at the cost-min threshold. Formula: `FP`. Source: `phase8_threshold_table.csv` (cost-min row).

**MOD-25 · Cost-min FN** — 338. False negatives at the cost-min threshold. Formula: `FN`. Source: `phase8_threshold_table.csv` (cost-min row).

**MOD-26 · Cost-min recall** — 84.24%. Recall at the cost-min threshold. Formula: `TP / (TP + FN)`. Source: `phase8_threshold_table.csv` (cost-min row).

**MOD-27 · Cost-min precision** — 8.17%. Precision at the cost-min threshold. Formula: `TP / (TP + FP)`. Source: `phase8_threshold_table.csv` (cost-min row).

**MOD-28 · Cost-min missed USD** — $92,043.87. Fraud dollars missed at the cost-min threshold. Formula: `sum(amount | FN)`. Source: `phase8_threshold_table.csv` (cost-min row).

**MOD-29 · Cost-min total loss** — $193,653.87. FP friction plus missed fraud dollars. Formula: `FP × $5 + missed_usd`. Source: `phase8_threshold_table.csv` (cost-min row).

**MOD-30 · F1-max threshold** — 0.11267. Threshold maximizing F1 on test. Formula: `argmax F1`. Source: `phase8_threshold_table.csv` (F1 row).

**MOD-31 · F1 max** — 0.5504. Best F1 across the three operating points. Formula: `2PR/(P+R)`. Source: `phase8_threshold_table.csv` (F1 row).

**MOD-32 · Cost-sensitivity recall range low** — 70.21%. Lowest recall across $1–$50 FP cost. Formula: `min(recall)`. Source: `phase8_cost_sensitivity.csv` (5 rows).

**MOD-33 · Cost-sensitivity recall range high** — 91.56%. Highest recall across $1–$50 FP cost. Formula: `max(recall)`. Source: `phase8_cost_sensitivity.csv` (5 rows).

**MOD-34 · Ablation minus card_prior_fraud** — 0.8315. PR-AUC after removing the causal prior-fraud count. Formula: `variant PR-AUC`. Source: `phase8_ablation_decomposed.csv` (MINUS card_prior_fraud).

**MOD-35 · Ablation recovery from removing card_prior_fraud** — 0.2740. FULL → minus card_prior_fraud gain. Formula: `0.831485 − 0.557480`. Source: `phase8_ablation_decomposed.csv` (recomputed).

**MOD-36 · Raw-only PR-AUC** — 0.8353. Model with raw features only, no history block. Formula: `variant PR-AUC`. Source: `phase8_ablation_decomposed.csv` (raw-only row).

**MOD-37 · FULL minus raw-only** — -0.2779. Transfer penalty attributable to the history block. Formula: `0.557480 − 0.835338`. Source: `phase8_ablation_decomposed.csv` (recomputed).

**MOD-38 · Learning-curve peak PR-AUC** — 0.6266. Peak test PR-AUC across training fractions. Formula: `max(pr_auc)`. Source: `phase8_learning_curve.csv` (25% row).

**MOD-39 · Learning-curve full-data PR-AUC** — 0.5254. Test PR-AUC at 100% of train rows. Formula: `last row`. Source: `phase8_learning_curve.csv` (100% row).

**MOD-40 · Monotonic-constraint PR-AUC** — 0.5922. Robustness variant with four monotonic constraints. Formula: `variant PR-AUC`. Source: `phase8_monotonic_comparison.csv` (monotonic row).

**MOD-41 · Time-decay PR-AUC** — 0.5408. Robustness variant with 180-day half-life weighting. Formula: `variant PR-AUC`. Source: `phase8_time_decay_comparison.csv` (time-decay row).

**MOD-42 · Fold-ensemble PR-AUC** — 0.5128. Ensemble of four fold models. Formula: `variant PR-AUC`. Source: `phase8_ensemble_comparison.csv` (ensemble row).

**MOD-43 · Leave-card-out seen-card PR-AUC** — 0.9948. Train rows of cards seen in training. Formula: `slice PR-AUC`. Source: `phase8_leave_card_out.csv` (seen cards). **Caveat:** Partially in-sample

**MOD-44 · Leave-card-out held-card PR-AUC** — 0.9639. Train rows of held-out cards. Formula: `slice PR-AUC`. Source: `phase8_leave_card_out.csv` (held-out train).

**MOD-45 · Leave-card-out held-card test PR-AUC** — 0.5541. Test rows of held-out cards. Formula: `slice PR-AUC`. Source: `phase8_leave_card_out.csv` (held-out test).

**MOD-46 · Calibration temperature** — 1.4178. Fitted temperature for probability scaling. Formula: `argmin NLL`. Source: `phase8_calibration_temp.csv` (single row). **Caveat:** Fit on early-stopping split, not test (CAV-08)

**MOD-47 · ECE before temperature scaling** — 0.0001594. Expected calibration error before scaling. Formula: `ECE`. Source: `phase8_calibration_temp.csv` (single row). **Caveat:** Early-stopping split

**MOD-48 · ECE after temperature scaling** — 0.0001184. Expected calibration error after scaling. Formula: `ECE`. Source: `phase8_calibration_temp.csv` (single row). **Caveat:** Early-stopping split

**MOD-49 · Reported Brier score** — 0.002414. Ledger calibration diagnostic for the final model. Formula: `mean((p − y)²)`. Source: `logs/findings.md` (RQ8 ledger). **Caveat:** Different split from temperature table

**MOD-50 · Reported ECE** — 0.001949. Ledger calibration diagnostic for the final model. Formula: `ECE`. Source: `logs/findings.md` (RQ8 ledger). **Caveat:** Different split from temperature table

**INV-01 · Graded findings** — 64. Ledger entries across eight RQs. Formula: `count findings`. Source: `logs/findings_ledger.json` (64 records).

**INV-02 · Strong findings** — 30. Highest researcher-assigned grade. Formula: `count(grade = strong)`. Source: `logs/findings_ledger.json` (ledger).

**INV-03 · Supporting findings** — 27. Second grade tier. Formula: `count(grade = supports)`. Source: `logs/findings_ledger.json` (ledger).

**INV-04 · Caveat findings** — 6. Limitations rather than positive claims. Formula: `count(grade = caveat)`. Source: `logs/findings_ledger.json` (ledger).

**INV-05 · Weak findings** — 1. Fragile signal. Formula: `count(grade = weak)`. Source: `logs/findings_ledger.json` (ledger).

**INV-06 · Independent audit notes** — 5. Notes that qualify or contradict ledger claims. Formula: `count auditNotes`. Source: `app/public/data/manifest.json` (auditNotes).

**INV-07 · Recorded issues** — 16. Project issues by severity. Formula: `count issues`. Source: `app/public/data/manifest.json` (issues).

**INV-08 · High-severity issues** — 4. Confirmed high-impact issues. Formula: `count(severity = High)`. Source: `app/public/data/manifest.json` (issues).

**INV-09 · Medium-severity issues** — 10. Medium-impact issues. Formula: `count(severity = Medium)`. Source: `app/public/data/manifest.json` (issues).

**INV-10 · Low-severity issues** — 2. Low-impact issues. Formula: `count(severity = Low)`. Source: `app/public/data/manifest.json` (issues).

**INV-11 · Notebook warnings** — 9. Captured non-fatal warnings. Formula: `count warnings`. Source: `app/public/data/manifest.json` (warnings).

**INV-12 · Source figures** — 129. PNG figures. Formula: `count(*.png)`. Source: `figures/` (directory).

**INV-13 · Interactive artifacts** — 7. Plotly HTML exports. Formula: `count(*.html)`. Source: `figures/` (directory).

**INV-14 · Source tables** — 46. CSV analysis tables. Formula: `count(*.csv)`. Source: `tables/` (directory).

**INV-15 · Notebook cells** — 66. All cells. Formula: `count cells`. Source: `fraud_eda_colab(1).ipynb` (notebook).

**INV-16 · Notebook code cells** — 33. Executable cells. Formula: `count code cells`. Source: `fraud_eda_colab(1).ipynb` (notebook).

**INV-17 · Notebook error outputs** — 0. Tracebacks or error outputs. Formula: `count(error)`. Source: `fraud_eda_colab(1).ipynb` (notebook).

**INV-18 · Generated artifacts** — 182. 129 PNG + 7 HTML + 46 CSV. Formula: `129 + 7 + 46`. Source: `figures/; tables/` (directories).

**INV-19 · Validation checks** — 196. Independent source-vs-app checks. Formula: `count(results)`. Source: `tests/validation_results.json` (summary).

**INV-20 · Validation pass rate** — 100.00%. All checks passed. Formula: `196 / 196`. Source: `tests/validation_results.json` (summary).

**PBI-01 · Power BI tables** — 59. 10 dimensions + 49 facts. Formula: `count(CSV)`. Source: `powerbi/manifest.json` (counts.tables).

**PBI-02 · Power BI measures** — 112. DAX measures in the library. Formula: `count(MEASURE)`. Source: `powerbi/dax/measures.dax` (file).

**PBI-03 · Power BI relationships** — 17. Semantic-model relationships. Formula: `count(relationships)`. Source: `powerbi/manifest.json` (relationships).

**PBI-04 · Date dimension rows** — 734. Calendar days from 2019-01-01 to 2021-01-03. Formula: `date range`. Source: `powerbi/data/dim_date.csv` (734 rows).

## Coverage summary

| Domain | Metrics |
|---|---:|
| AMT | 7 |
| CARD | 6 |
| DQ | 26 |
| INT | 14 |
| INV | 20 |
| KPI | 10 |
| MOD | 50 |
| PBI | 4 |
| TMP | 11 |
| UNS | 7 |
| **Total** | **155** |

## Metrics intentionally excluded

- Values that exist only as plotted pixels with no table: the app shows the figure and labels it as a rendered artifact rather than inventing a number.
- Per-epoch training history: no epoch-level log exists (`data/processed/training_history.csv` has no usable rows).
- Hardware telemetry, memory peaks and per-cell runtimes: not logged.
- Any metric that would require rerunning the notebook on the absent raw CSVs.
