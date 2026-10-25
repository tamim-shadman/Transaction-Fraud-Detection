# Validation report

Generated: **2026-10-25T14:02:19**  
Scope: **196 checks** against the workbook's generated tables, notebook, logs and app data layer.  
Result: **196 passed / 0 failed**  
Known source caveats recorded separately: **11**

## Method

The validator reloads the 46 CSV tables, the 64-record findings ledger, the notebook and the 129 figure files directly. It recomputes counts, rates, intervals, arithmetic identities, model metrics and inventory dimensions, then compares them with `app/public/data/manifest.json` and `analysis.json`. No app value is treated as its own evidence.

## Summary by group

| Group | Checks | Passed | Failed |
|---|---:|---:|---:|
| Data | 73 | 73 | 0 |
| Findings | 9 | 9 | 0 |
| Inventory | 25 | 25 | 0 |
| KPIs | 10 | 10 | 0 |
| Model | 74 | 74 | 0 |
| Narrative | 5 | 5 | 0 |
| **Total** | **196** | **196** | **0** |

## Failures

None. Every asserted check passed at its stated tolerance.

## Substantive checks

| ID | Group | Check | Expected | Actual | Status |
|---|---|---|---|---|---|
| DATA-01 | Data | Overall transaction count | 1852394 | 1852394 | PASS |
| DATA-02 | Data | Train transaction count | 1296675 | 1296675 | PASS |
| DATA-03 | Data | Test transaction count | 555719 | 555719 | PASS |
| DATA-04 | Data | Overall fraud count | 9651 | 9651 | PASS |
| DATA-05 | Data | Train fraud count | 7506 | 7506 | PASS |
| DATA-06 | Data | Test fraud count | 2145 | 2145 | PASS |
| DATA-07 | Data | Overall fraud rate | 0.0052100147160917 | 0.005210014716091717 | PASS |
| DATA-08 | Data | Train fraud rate | 0.0057886517438833 | 0.0057886517438833 | PASS |
| DATA-09 | Data | Test fraud rate | 0.0038598644278853 | 0.0038598644278853 | PASS |
| DATA-10 | Data | Train and test counts add to overall | True | [1852394, 9651] | PASS |
| DATA-11 | Data | Card count | 999 | 999 | PASS |
| DATA-12 | Data | Category count | 14 | 14 | PASS |
| DATA-13 | Data | State count (chi-square table) | 51 | 51 | PASS |
| DATA-14 | Data | Merchant count | 693 | 693 | PASS |
| DATA-15 | Data | City count | 836 | 836 | PASS |
| DATA-16 | Data | ZIP3 count | 532 | 532 | PASS |
| DATA-17 | Data | Final model feature count | 27 | 27 | PASS |
| DATA-18 | Data | Columns with missing values | 11 | 11 | PASS |
| DATA-19 | Data | Maximum missing percentage | 0.1079 | 0.1079 | PASS |
| DATA-20 | Data | Analytical columns (schema rows excluding Index) | 71 | 71 | PASS |
| DATA-21 | Data | Data contracts evaluated | 10 | 10 | PASS |
| DATA-22 | Data | Flagged data contracts | 1 | 1 | PASS |
| DATA-23 | Data | Only the age contract is flagged | True | ['age min / max (Sparkov expects ~18–100)'] | PASS |
| DATA-24 | Data | Duplicate trans_num rows | 0 | 0 | PASS |
| DATA-25 | Data | ZIP values below 10,000 | 116389 | 116389 | PASS |
| DATA-26 | Data | Cards never defrauded | 23 | 23 | PASS |
| DATA-27 | Data | Cards ever defrauded | 976 | 976 | PASS |
| DATA-28 | Data | Cards with 100% fraud rate | 91 | 91 | PASS |
| DATA-29 | Data | Cards with partial fraud rate | 885 | 885 | PASS |
| DATA-30 | Data | Card-profile transactions sum | 1852394 | 1852394 | PASS |
| DATA-31 | Data | Card-profile fraud sum | 9651 | 9651 | PASS |
| DATA-32 | Data | Card fraud distribution is zero-inflated, not symmetric | True | {'never': 23, 'ever': 976, 'full': 91, 'partial': 885} | PASS |
| DATA-33 | Data | Category table transaction sum | 1852394 | 1852394 | PASS |
| DATA-34 | Data | Category table fraud sum | 9651 | 9651 | PASS |
| DATA-35 | Data | Category rates recompute from counts | True | 8.933825901280557e-17 | PASS |
| DATA-36 | Data | Category rates table row count | 14 | 14 | PASS |
| DATA-37 | Data | All category Wilson intervals contain the point estimate | True | None | PASS |
| DATA-38 | Data | Median fraud amount | 390.0 | 390.0 | PASS |
| DATA-39 | Data | Median non-fraud amount | 47.24 | 47.24 | PASS |
| DATA-40 | Data | KS D for amount | 0.723803 | 0.723803 | PASS |
| DATA-41 | Data | Cliff's delta for amount | 0.668566 | 0.668566 | PASS |
| DATA-42 | Data | Cliff's delta lower CI | 0.655884 | 0.655884 | PASS |
| DATA-43 | Data | Cliff's delta upper CI | 0.680089 | 0.680089 | PASS |
| DATA-44 | Data | Total fraud exposure (USD) | 5121413.36 | 5121413.361572266 | PASS |
| DATA-45 | Data | Fraud counts by category sum to overall | 9651 | 9651 | PASS |
| DATA-46 | Data | Dollars per fraud recompute from totals | True | None | PASS |
| DATA-47 | Data | Weekly series length | 105 | 105 | PASS |
| DATA-48 | Data | Weekly transaction sum | 1852394 | 1852394 | PASS |
| DATA-49 | Data | Weekly fraud sum | 9651 | 9651 | PASS |
| DATA-50 | Data | Final week date | 2021-01-03 | 2021-01-03 | PASS |
| DATA-51 | Data | Final week transactions | 18921 | 18921 | PASS |
| DATA-52 | Data | Final week fraud count | 0 | 0 | PASS |
| DATA-53 | Data | Train weekly mean over full weeks | 0.006025998102514612 | 0.006025998102514612 | PASS |
| DATA-53A | Data | Train weekly mean through the boundary week | 0.006060895135006715 | 0.006060895135006715 | PASS |
| DATA-54 | Data | Test weekly mean over full weeks | 0.0042481780449662885 | 0.0042481780449662885 | PASS |
| DATA-55 | Data | Test weekly mean including the partial edge week | 0.0040964574005032065 | 0.0040964574005032065 | PASS |
| DATA-56 | Data | Full weekly train/test split counts | [76, 27] | [76, 27] | PASS |
| DATA-57 | Data | Hazard table months | 24 | 24 | PASS |
| DATA-58 | Data | Night fraud rate | 0.0081121030880685 | 0.0081121030880685 | PASS |
| DATA-59 | Data | Day fraud rate implied by night count | 0.004348090936015846 | 0.004348090936015846 | PASS |
| DATA-60 | Data | Night lift vs baseline | 1.5570211467951125 | 1.5570211467951125 | PASS |
| DATA-61 | Data | High-risk combination fraud rate | 0.2207563764291996 | 0.2207563764291996 | PASS |
| DATA-62 | Data | High-risk combination lift | 42.37154565943331 | 42.37154565943331 | PASS |
| DATA-63 | Data | Baseline fraud rate | 0.005210014716091717 | 0.0052100147160917 | PASS |
| DATA-64 | Data | Transactions above 1,000 km/h | 38005 | 38005 | PASS |
| DATA-65 | Data | Share above 1,000 km/h | 0.020517 | 0.020516693532801337 | PASS |
| DATA-66 | Data | Speed table fraud sum (non-missing speed only) | 9560 | 9560 | PASS |
| DATA-67 | Data | Speed table missing rows | 1043 | 1043 | PASS |
| DATA-68 | Data | Mutual-information rows | 14 | 14 | PASS |
| DATA-69 | Data | Mutual information is non-negative | True | None | PASS |
| DATA-70 | Data | Schema rows | 72 | 72 | PASS |
| DATA-71 | Data | Manifest raw column count | 22 | 22 | PASS |
| DATA-72 | Data | Manifest analytical column count | 71 | 71 | PASS |
| MODEL-01 | Model | FULL test PR-AUC | 0.5574801511963462 | 0.5574801511963462 | PASS |
| MODEL-02 | Model | FULL test ROC-AUC | 0.9677282868198628 | 0.9677282868198628 | PASS |
| MODEL-03 | Model | Raw-only test PR-AUC | 0.83533822876129 | 0.83533822876129 | PASS |
| MODEL-04 | Model | Removing card_prior_fraud recovers PR-AUC | 0.27400524856122876 | 0.27400524856122876 | PASS |
| MODEL-05 | Model | FULL minus raw-only PR-AUC | 0.27785807756494385 | 0.27785807756494385 | PASS |
| MODEL-06 | Model | Ablation variant count | 6 | 6 | PASS |
| MODEL-07 | Model | FULL is not the highest-PR-AUC ablation variant | True | 0.83533822876129 | PASS |
| MODEL-08 | Model | Walk-forward folds | 4 | 4 | PASS |
| MODEL-09 | Model | Mean validation PR-AUC | 0.9510414270082748 | 0.9510414270082747 | PASS |
| MODEL-10 | Model | Validation PR-AUC SD | 0.0152253832396225 | 0.015225383239622482 | PASS |
| MODEL-11 | Model | Mean fold test PR-AUC | 0.4725803686226709 | 0.47258036862267094 | PASS |
| MODEL-12 | Model | Fold test PR-AUC SD | 0.0760812880124376 | 0.07608128801243762 | PASS |
| MODEL-13 | Model | Mean OOD PR gap | 0.4784610583856036 | 0.4784610583856037 | PASS |
| MODEL-14 | Model | Recorded OOD gap mean | 0.4784610583856036 | 0.4784610583856036 | PASS |
| MODEL-15 | Model | Recorded mean validation PR-AUC | 0.9510414270082748 | 0.9510414270082748 | PASS |
| MODEL-16 | Model | Recorded mean fold test PR-AUC | 0.4725803686226709 | 0.4725803686226709 | PASS |
| MODEL-17 | Model | PSI feature count | 27 | 27 | PASS |
| MODEL-18 | Model | Severe PSI features | 7 | 7 | PASS |
| MODEL-19 | Model | Moderate PSI features | 1 | 1 | PASS |
| MODEL-20 | Model | Stable PSI features | 19 | 19 | PASS |
| MODEL-21 | Model | Top PSI (month_sin) | 6.514263998062767 | 6.514263998062767 | PASS |
| MODEL-22 | Model | Second PSI (n_prior) | 5.095471711875279 | 5.095471711875279 | PASS |
| MODEL-23 | Model | Severe + moderate share of features | 0.2962962962962963 | 0.2962962962962963 | PASS |
| MODEL-24 | Model | Capture table budgets | 5 | 5 | PASS |
| MODEL-25 | Model | Capture@1% recall | 0.6545454545454545 | 0.6545454545454545 | PASS |
| MODEL-26 | Model | Capture@1% precision | 0.2526543098794313 | 0.2526543098794313 | PASS |
| MODEL-27 | Model | Capture@1% USD share | 0.6870062339692 | 0.6870062339692452 | PASS |
| MODEL-28 | Model | Capture@1% review count | 5557 | 5557 | PASS |
| MODEL-29 | Model | Capture@1% fraud events caught | 1404 | 1404 | PASS |
| MODEL-30 | Model | Capture@5% recall | 0.862004662004662 | 0.862004662004662 | PASS |
| MODEL-31 | Model | Capture@5% USD share | 0.934209 | 0.9342090122811502 | PASS |
| MODEL-32 | Model | Capture precision and recall recompute from counts | True | None | PASS |
| MODEL-33 | Model | Capture@k review counts equal the budget percentage of the test set | True | None | PASS |
| MODEL-34 | Model | Operating-point rows | 3 | 3 | PASS |
| MODEL-35 | Model | Cost-min TP | 1807 | 1807 | PASS |
| MODEL-36 | Model | Cost-min FP | 20322 | 20322 | PASS |
| MODEL-37 | Model | Cost-min FN | 338 | 338 | PASS |
| MODEL-38 | Model | Cost-min TN | 533252 | 533252 | PASS |
| MODEL-39 | Model | Cost-min recall | 0.8424242424242424 | 0.8424242424242424 | PASS |
| MODEL-40 | Model | Cost-min precision | 0.0816575534366668 | 0.0816575534366668 | PASS |
| MODEL-41 | Model | Cost-min missed USD | 92043.8700942993 | 92043.87009429932 | PASS |
| MODEL-42 | Model | Cost-min total loss | 193653.8700942993 | 193653.8700942993 | PASS |
| MODEL-43 | Model | Cost-min USD captured share | 0.9187842003978174 | 0.9187842003978174 | PASS |
| MODEL-44 | Model | All operating-point confusion matrices sum to the test set | True | None | PASS |
| MODEL-45 | Model | All operating-point precision/recall recompute from counts | True | None | PASS |
| MODEL-46 | Model | Total loss = total FP cost + missed USD | True | 2.9103830456733704e-11 | PASS |
| MODEL-47 | Model | F1 at 0.11267 operating point | 0.550361713967724 | 0.5503617139677239 | PASS |
| MODEL-48 | Model | F1 operating point beats the 0.5 threshold on F1 | True | None | PASS |
| MODEL-49 | Model | Cost-sensitivity rows | 5 | 5 | PASS |
| MODEL-50 | Model | Cost sensitivity at $5/FN matches threshold table | 193653.8700942993 | 193653.8700942993 | PASS |
| MODEL-51 | Model | Expected loss rises monotonically with FP cost | True | None | PASS |
| MODEL-52 | Model | Optimal thresholds stay in [0, 0.001] across the sweep | True | None | PASS |
| MODEL-53 | Model | Calibration temperature | 1.4177918881006806 | 1.4177918881006806 | PASS |
| MODEL-54 | Model | ECE before calibration | 0.0001593957680143 | 0.0001593957680143 | PASS |
| MODEL-55 | Model | ECE after calibration | 0.0001183945305157 | 0.0001183945305157 | PASS |
| MODEL-56 | Model | Calibration improves ECE and NLL | True | None | PASS |
| MODEL-57 | Model | Learning-curve points | 5 | 5 | PASS |
| MODEL-58 | Model | Learning-curve peak PR-AUC | 0.626562 | 0.6265621319574277 | PASS |
| MODEL-59 | Model | Learning curve is non-monotonic | True | None | PASS |
| MODEL-60 | Model | Full-fraction learning-curve PR-AUC | 0.525359 | 0.5253585399509898 | PASS |
| MODEL-61 | Model | Leave-card-out slices | 3 | 3 | PASS |
| MODEL-62 | Model | Held-out-card test PR-AUC | 0.5540768597457347 | 0.5540768597457347 | PASS |
| MODEL-63 | Model | Held-out cards | 199 | 199 | PASS |
| MODEL-64 | Model | Walk-forward ensemble PR-AUC | 0.5128355010603128 | 0.5128355010603128 | PASS |
| MODEL-64A | Model | Manifest experiment fold-ensemble PR-AUC | 0.5128355010603128 | 0.5128355010603128 | PASS |
| MODEL-64B | Model | Manifest experiment count | 26 | 26 | PASS |
| MODEL-65 | Model | Monotonic model PR-AUC | 0.5921751049650442 | 0.5921751049650442 | PASS |
| MODEL-66 | Model | Time-decay model PR-AUC | 0.5407833916639233 | 0.5407833916639233 | PASS |
| MODEL-67 | Model | Segment-error rows | 63 | 63 | PASS |
| MODEL-68 | Model | Segment-error categories | 14 | 14 | PASS |
| MODEL-69 | Model | Segment-error hour bins | 4 | 4 | PASS |
| MODEL-70 | Model | Segment-error states | 45 | 45 | PASS |
| MODEL-71 | Model | Segment recall is between 0 and 1 | True | None | PASS |
| MODEL-72 | Model | Category segment rows account for the whole test set | 555719 | 555719.0 | PASS |
| FIND-01 | Findings | Ledger findings | 64 | 64 | PASS |
| FIND-02 | Findings | Strong findings | 30 | 30 | PASS |
| FIND-03 | Findings | Supporting findings | 27 | 27 | PASS |
| FIND-04 | Findings | Caveat findings | 6 | 6 | PASS |
| FIND-05 | Findings | Weak findings | 1 | 1 | PASS |
| FIND-06 | Findings | Manifest grade counts match ledger | {'caveat': 6, 'supports': 27, 'strong': 30, 'weak': 1} | {'strong': 30, 'supports': 27, 'weak': 1, 'caveat': 6} | PASS |
| FIND-07 | Findings | Findings per research question | {'RQ1': 6, 'RQ6': 11, 'RQ4': 6, 'RQ2': 2, 'RQ3': 6, 'RQ5': 10, 'RQ7': 4, 'RQ8': 19} | {'RQ1': 6, 'RQ2': 2, 'RQ3': 6, 'RQ4': 6, 'RQ5': 10, 'RQ6': 11, 'RQ7': 4, 'RQ8': 19} | PASS |
| FIND-08 | Findings | All ledger phases map to P0-P7 | True | True | PASS |
| FIND-09 | Findings | Report phase P8 has no findings | 0 | 0 | PASS |
| NARR-01 | Narrative | Audit note AN-01 exists for the leakage contradiction | True | ['AN-01', 'AN-02', 'AN-03', 'AN-04', 'AN-05'] | PASS |
| NARR-02 | Narrative | Audit-note count | 5 | 5 | PASS |
| NARR-03 | Narrative | Issue count | 16 | 16 | PASS |
| NARR-04 | Narrative | No P8 findings are asserted | True | None | PASS |
| NARR-05 | Narrative | Card-profile summary is not labelled bimodal in generated data | True | None | PASS |

The full inventory checks (46 table dimensions, 129 figure dimensions, file existence and manifest counts) are in `tests/validation_results.json`.

## Known source caveats (not app failures)

### CAV-01 — Ablation delta column is relative to raw-only, not FULL

`phase8_ablation_decomposed.csv.delta_pr_auc` subtracts each variant from the raw-only row (the last row), so its sign and magnitude are not the effect of removing a feature from FULL. The app recomputes `variant.pr_auc - FULL.pr_auc` for display. Use that recomputation, not the source column.

Sources: `tables/phase8_ablation_decomposed.csv`

### CAV-02 — Weekly boundary week straddles the train/test cut

The week ending 2020-06-21 contains both train and test transactions because the split boundary is 12:13:37 on that Sunday. Weekly sums reconcile to 1,852,394 / 9,651, but train/test weekly means are not exact split means. The last week (2021-01-03) is a partial zero-fraud edge week and is excluded from trend means.

Sources: `tables/phase3_weekly_rate_table.csv; phase0_class_balance.csv`

### CAV-03 — The source calls the card fraud-rate distribution bimodal; it is zero-inflated

23 of 999 cards have no fraud, 885 have a partial rate, and 91 have a 100% rate. The histogram has mass only in the first and last bins because fraud is card-clustered; it is not a symmetric two-peak distribution. The app labels it zero-inflated.

Sources: `tables/phase2_card_profiles.csv; logs/findings_ledger.json`

### CAV-04 — The leakage demo reports equal naive and causal correlations

The ledger says full-data target encoding inflates signal, but the recorded Spearman correlations are both 0.048 at displayed precision. The notebook output does not demonstrate inflation. The app records this as audit note AN-01 rather than a confirmed result.

Sources: `logs/findings_ledger.json; notebook cell 52`

### CAV-05 — Merchant-to-category is not deterministic

The ledger says merchant→category is deterministic, but the evidence records `max cats/merchant=2`. The app keeps the collinearity caution but does not repeat the deterministic claim.

Sources: `logs/findings_ledger.json`

### CAV-06 — ZIP3 Cramér's V is not comparable to category V

The ZIP3 association (V=0.148) is estimated over 532 levels, while category (V=0.067) has 14 levels. The larger V partly reflects granularity and should not be read as a stronger substantive effect without adjustment.

Sources: `tables/phase5_chi2_cramers.csv`

### CAV-07 — The notebook reports 45 tables; the workspace contains 46

The extra table is the report `figure_index.csv` (or a run-metadata table). The dashboard uses the actual file count, 46, and labels the report phase separately.

Sources: `tables/; logs/findings.md`

### CAV-08 — Calibration is fit on the early-stopping split, not the test set

`phase8_calibration_temp.csv` reports temperature scaling on a held-out calibration slice. Its very small ECE values should not be presented as test-set calibration evidence.

Sources: `tables/phase8_calibration_temp.csv`

### CAV-09 — Speed table excludes 1,043 rows with no prior location

`phase7_speed_rate_table.csv` covers 1,851,351 of 1,852,394 transactions (9,560 of 9,651 frauds). The 38,005 count above 1,000 km/h and its 2.05% share are over all transactions, not over the non-missing-speed subset.

Sources: `tables/phase7_speed_rate_table.csv`

### CAV-10 — `fp_cost` in the threshold table is total cost, not per-FP cost

The column equals FP count × $5 (e.g., 20,322 × 5 = 101,610). Total loss is `fp_cost + missed_usd`. The app labels it as total review cost to avoid a unit error.

Sources: `tables/phase8_threshold_table.csv`

### CAV-11 — The learning-curve endpoint differs from the final model

The full-fraction learning-curve point has PR-AUC 0.5254, while the final model reports 0.5575. They are different training protocols (learning-curve subsamples / fixed parameters), so the curve should not be read as the final model's score.

Sources: `tables/phase8_learning_curve.csv; phase8_ablation_decomposed.csv`

## Limits of this validation

- The raw `fraudTrain.csv` and `fraudTest.csv` are absent, so the notebook cannot be rerun end-to-end. The validator can only check consistency with the generated artifacts.
- The notebook's own claims are not all independently reproducible from the retained outputs. Where a claim contradicts its artifact, the app records an audit note and this report lists the caveat.
- This validates the simulation's data layer, not the native Power BI model. The Power BI pack is a documented import package, not a PBIX, so its measures are checked by source inspection and arithmetic only.
