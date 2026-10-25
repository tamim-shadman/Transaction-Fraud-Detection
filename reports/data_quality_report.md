# Data quality report

Generated: **2026-10-20T17:57:53**  
Scope: **1,852,394** transactions · **71** analytical columns · **22** raw fields

## Verdict

**Usable for analysis, with explicit structural caveats.** The file is complete enough for the stated research questions: identifiers are unique, class labels are valid, amounts and coordinates are in range, and every table reconciles to 1,852,394 transactions / 9,651 frauds. It is **not** a production-representative fraud sample. Missingness is structural (first-transaction history), one contract is flagged (minimum age 13.9), the split is temporal rather than random, and the Sparkov generator leaves visible artifacts that must travel with every geographic or card-level claim.

## Scorecard

| Dimension | Rating | Evidence |
|---|---|---|
| Completeness | **Amber** | 11 of 71 columns have missing values; maximum 10.79% (`amt_z_prior`). Missingness is by design for first-transaction history. |
| Uniqueness | **Green** | 0 duplicate `trans_num`; 0 fully duplicated rows. |
| Validity | **Amber** | 7 PASS, 1 FLAG, 2 INFO contracts. The flag is minimum age 13.9 vs an expected ~18. |
| Consistency | **Green** | `zip3_state_purity = 1.0`; 532 ZIP3s; merchant→category near-deterministic (max 2 categories). |
| Timeliness | **Amber** | Single 2019-01-01 → 2020-12-31 window; test is a later-period transfer set, not a random holdout. |
| Distributional stability | **Red** | 7 severe + 1 moderate PSI features; adversarial validation AUC ≈ 1.000. |
| Representativeness | **Red** | Simulator artifacts: 97.7% of cards see fraud, 2.05% of transactions imply >1,000 km/h, merchant coordinates are jittered per transaction. |

## 1. Class balance

| Split | Transactions | Fraud | Fraud rate |
| --- | ---: | ---: | ---: |
| train | 1,296,675 | 7,506 | 0.5789% |
| test | 555,719 | 2,145 | 0.3860% |
| overall | 1,852,394 | 9,651 | 0.5210% |

Train and test counts add exactly to the overall totals. The fraud rate falls from 0.5789% in train to 0.3860% in test, a **0.193 pp** drop. That is a real distribution shift, not a sampling accident: the split boundary is a timestamp.

## 2. Completeness

- Analytical columns: **71**, derived from 72 schema-profile rows after removing the index row.
- Columns with any missing value: **11**.
- Highest missing share: **10.79%** on `amt_z_prior` and `amt_z_prior_log`.
- The missing block is concentrated in prior-transaction features (`amt_prior_*`, `dist_prev_*`, `hours_since_prev*`, `merch_*_prev`, `speed_kmh`). A card's first transaction has no prior location, amount or timestamp, so the row is structurally missing rather than corrupt.
- Model pipelines must handle these blanks explicitly. The notebook's LightGBM path does so natively; a naive imputation of zero would create a false “first transaction = zero distance” signal.

| Column | Dtype | Non-null | Missing |
| --- | --- | ---: | ---: |
| amt_z_prior | float32 | 1,850,396 | 10.79% |
| amt_z_prior_log | float32 | 1,850,396 | 10.79% |
| speed_kmh | float32 | 1,851,351 | 5.63% |
| amt_prior_mean | float32 | 1,851,395 | 5.39% |
| amt_prior_mean_log | float32 | 1,851,395 | 5.39% |
| dist_prev_km | float32 | 1,851,395 | 5.39% |
| dist_prev_km_log | float32 | 1,851,395 | 5.39% |
| hours_since_prev | float32 | 1,851,395 | 5.39% |
| hours_since_prev_log | float32 | 1,851,395 | 5.39% |
| merch_lat_prev | float32 | 1,851,395 | 5.39% |
| merch_long_prev | float32 | 1,851,395 | 5.39% |

## 3. Uniqueness

- Duplicate `trans_num`: **0**.
- Fully duplicated rows excluding split: **0**.
- Identifier audit: `cc_num` identifies 999 cards; `trans_num` is the transaction key; `zip` is numeric and has lost leading zeros (see below).

## 4. Validity and contracts

Contracts evaluated: **10** — 7 PASS, 1 FLAG, 2 INFO.

| Contract | Observed | Status |
| --- | --- | :---: |
| age min / max (Sparkov expects ~18–100) | 13.9 / 96.2 | FLAG |
| amt min / max | 1.00 / 28948.90 | PASS |
| lat in [-90, 90] | 20.0 / 66.7 | PASS |
| long in [-180, 180] | -165.7 / -68.0 | PASS |
| merch coords in bounds | (19.0,67.5) / (-166.7,-67.0) | PASS |
| city_pop <= 0 count | 0 | INFO |
| zip < 10000 (leading-zero loss artifact) | 116,389 | INFO |
| is_fraud domain | [0, 1] | PASS |
| fully duplicated rows (excl. split) | 0 | PASS |
| duplicate trans_num | 0 | PASS |

The flagged age minimum of **13.9 years** is not plausible for a cardholder under the simulator's documented ~18–100 range. It affects a small tail and does not change the fraud-rate conclusions, but age-based cohorts should exclude or winsorise it.

The ZIP INFO line is more consequential: **116,389** ZIP values are below 10,000 because leading zeros were dropped when the field was stored as an integer. ZIP3 analysis is still valid for populated prefixes, but the raw ZIP is not a clean geographic key. `city_pop <= 0` has zero offenders.

## 5. Temporal coverage and split integrity

- Observation window: **2019-01-01 00:00:18** → **2020-12-31 23:59:34**.
- Train ends **2020-06-21 12:13:37**; test starts **2020-06-21 12:14:25** — a **48-second** gap on the same Sunday.
- Weekly series: **105** weeks; 76 full train weeks, 27 full test weeks.
- Full-week train mean: **0.6026%**; full-week test mean: **0.4248%**.
- Boundary week ending 2020-06-21: **19,970** transactions, **174** frauds — it straddles both splits and is flagged partial.
- Final week ending 2021-01-03: **18,921** transactions, **0** frauds. It is a partial zero-fraud edge week and must be excluded from trend means.

The weekly sums reconcile to the full dataset (1,852,394 / 9,651), but the boundary week is why train/test weekly means are not identical to the transaction-level split rates.

## 6. Drift and transfer diagnostics

- Adversarial validation held-out AUC: **0.99999994** (train vs test are almost perfectly separable).
- PSI: **7 severe**, **1 moderate**, **19 stable** across 27 model features.
- Severe + moderate share: **29.63%** (8/27).
- Largest PSI: `month_sin` **6.514**; second: `n_prior` **5.095**.
- Month encodings are deterministic transforms of the transaction month, so their extreme PSI is a calendar-coverage artifact, not a behavioural drift signal. `n_prior`, `card_prior_fraud` and the target encodings are the substantive drift carriers.

## 7. Generator forensics (the data is synthetic)

| Artifact | Observed | Consequence |
|---|---|---|
| Card fraud exposure | 23 of 999 cards never fraud; 976 ever; 91 at 100%; 885 partial | Card-level rates are a simulator property, not a production prior |
| Implied speed > 1,000 km/h | 38,005 transactions (2.05%) | Distance/velocity features are partly physical-impossibility artifacts |
| Speed missing rows | 1,043 | Excluded from the speed table; 91 frauds are outside it |
| Merchant coordinates | Per-transaction jitter; median per-merchant lat SD 5.10°, unique coordinate-pair ratio 1.0 | Distance is a noise model, not store geography |
| Merchant→category | `merchant_single_category = False`; max 2 categories | Near-deterministic collinearity, not a strict key |
| ZIP3→state | Purity 1.0 over 532 ZIP3s | ZIP3 is a clean state refinement in this simulator |
| Distance KS (fraud vs non-fraud) | 0.0071 | Distance has almost no univariate separation; any model signal is jitter-driven |

## 8. Data quality issues by priority

| Priority | Issue | Impact | Recommendation |
|---|---|---|---|
| High | Raw source CSVs absent | Cannot rerun or independently re-fingerprint the notebook | Obtain the Kaggle files or accept the reconstruction boundary |
| High | Temporal split / OOD shift | All test metrics are transfer estimates | Report walk-forward and OOD results together; never quote test PR-AUC alone |
| High | Card exposure is near-universal | Card-level priors do not transfer | Re-validate `card_prior_fraud` on production data before use |
| Medium | 11 structurally missing columns | First-transaction rows lack history | Use model-native missing handling; do not zero-impute |
| Medium | Age minimum 13.9 | Contract violation in a small tail | Exclude or winsorise; document the rule |
| Medium | ZIP leading-zero loss | 116,389 invalid ZIP values | Use ZIP3, or recover leading zeros at ingest |
| Medium | Merchant coordinate jitter | Geographic/distance claims are simulator-bound | Keep the caveat on every distance figure |
| Low | Final week 0 fraud / partial coverage | Can bias means and trend fits | Exclude via `is_partial` |
| Low | Notebook says 45 tables, workspace has 46 | Count mismatch in the closing summary | Use the observed 46 |

## 9. What would change the verdict

- A production extract with genuine non-fraud card histories would invalidate the 97.7%-exposed card prior.
- Recovered raw CSVs would allow a full rerun, but would not remove the temporal split or the generator artifacts.
- A random holdout would answer a different question; it would not repair the cross-boundary transfer problem.

## 10. Provenance

- `tables/phase0_schema.csv`, `phase0_contracts.csv`, `phase0_generator_forensics.csv`, `phase0_class_balance.csv`
- `tables/phase3_weekly_rate_table.csv`, `phase8_psi.csv`, `phase7_speed_rate_table.csv`, `phase7_high_risk_combo.csv`
- `logs/data_fingerprint.json`, `logs/env_snapshot.json`, `logs/findings.md`
- Independent checks: `tests/validate_metrics.py` (196/196 passed) and `reports/validation_report.md`.
