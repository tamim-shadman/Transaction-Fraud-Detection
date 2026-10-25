# Glossary

Terms are defined as they are used in this project. Several are simulator- or split-specific; those caveats are noted.

## Data and sampling

**Transaction** — One row in the analytical frame. The workspace contains 1,852,394 transactions, each with a card, merchant, timestamp, amount and fraud label.

**Fraud label (`is_fraud`)** — Binary outcome: 1 for a fraudulent transaction, 0 otherwise. There are 9,651 positives (0.5210%). These are simulator labels, not production chargeback outcomes.

**Class imbalance** — The fraud class is rare: 0.5210% overall, 0.5789% in train and 0.3860% in test. Accuracy is therefore a misleading headline metric; precision, recall, PR-AUC and capture@k are used instead.

**Temporal split** — Train and test are separated by time, not randomly. Train ends at `2020-06-21 12:13:37`; test starts at `12:14:25`, a 48-second gap. This makes the test set a cross-boundary transfer sample.

**OOD (out-of-distribution)** — A sample drawn from a different distribution than the training data. Here, the test period is OOD relative to train because the fraud rate, feature distributions and calendar coverage shift across the boundary.

**Sparkov simulator** — The synthetic transaction generator behind the `kartik2112/fraud-detection` dataset. Its artifacts (card fraud clustering, coordinate jitter, near-universal card exposure) must travel with geographic and card-level claims.

**Boundary week** — The week ending `2020-06-21`, which contains both train and test transactions. It is flagged partial and excluded from full-week means.

**Final edge week** — The week ending `2021-01-03`, with 18,921 transactions and 0 frauds. It is a partial coverage artifact and is excluded from trend means.

**ZIP3** — The first three digits of a ZIP code. The project uses 532 ZIP3 prefixes; the raw numeric ZIP field lost leading zeros for 116,389 values.

**Zero-inflation** — A distribution with excess mass at zero. The card fraud-rate histogram is zero-inflated (23 cards never see fraud, 976 ever, 91 at 100%), not symmetric or truly bimodal.

## Model evaluation

**PR-AUC (precision-recall area under the curve)** — Area under the precision-recall curve; also called average precision. It is the primary ranking metric for rare fraud. The final test PR-AUC is 0.5575; the in-domain walk-forward mean is 0.9510.

**ROC-AUC** — Area under the receiver-operating-characteristic curve. It measures ranking quality across all thresholds and is less sensitive to class imbalance than accuracy. Final test ROC-AUC is 0.9677.

**Walk-forward validation** — Time-ordered cross-validation: train on the past, validate on the next block, roll forward. The project uses four folds. It estimates in-domain performance, not cross-boundary transfer.

**OOD gap** — Mean in-domain validation PR-AUC minus the same folds' test PR-AUC. The recorded gap is 0.4785; a positive value means transfer loss.

**Bootstrap CI** — A confidence interval built by resampling. The final test PR-AUC has a 95% bootstrap interval of 0.5365–0.5784 from 200 resamples.

**Precision** — Of the transactions flagged as fraud, the share that are actually fraud: TP / (TP + FP).

**Recall (sensitivity)** — Of the actual frauds, the share flagged: TP / (TP + FN).

**F1** — Harmonic mean of precision and recall: 2PR / (P + R). The F1-max operating point has F1 0.5504 at threshold 0.11267.

**Confusion matrix** — Counts of true positives (TP), false positives (FP), false negatives (FN) and true negatives (TN). At the cost-min threshold: TP 1,807, FP 20,322, FN 338, TN 533,252.

**Capture@k** — The share of fraud events (and fraud dollars) caught when reviewing the top k% of scored transactions. At 1%: 65.45% of frauds and 68.70% of fraud dollars; at 5%: 86.20% and 93.42%.

**Cost-min threshold** — The probability cutoff that minimises total expected loss, given a cost per false positive and the dollars missed by false negatives. At $5 per FP the threshold is 0.00001, with total loss $193,653.87.

**FP cost** — The assumed review/handling cost of a false positive. The threshold table uses $5; the cost-sensitivity table sweeps $1–$50.

**Calibration** — Agreement between predicted probabilities and observed fraud rates. The project reports expected calibration error (ECE) and Brier score. Temperature scaling is fit on the early-stopping split, not the test set.

**ECE (expected calibration error)** — Weighted average gap between predicted confidence and observed frequency across probability bins. Lower is better.

**Brier score** — Mean squared error of predicted probabilities: mean((p − y)²). Lower is better.

**Ablation** — Removing one feature or feature block and re-scoring the model. It localises where performance comes from — and where transfer breaks. Removing `card_prior_fraud` raises test PR-AUC from 0.5575 to 0.8315.

**Leakage** — Information in a feature that would not be available at prediction time, or that encodes the target. The project separates causal history features from target-encoded and post-hoc features.

**Target encoding** — Replacing a categorical level with a statistic of the target. It can leak if fit on the full training data; the project uses leak-aware variants and records the unresolved leakage-demo contradiction as audit note AN-01.

**SHAP** — Shapley-value attribution of a model prediction to its features. The project uses a 100-row background sample, so rankings are directional, not exact.

**Learning curve** — Test performance as the training fraction increases. The curve is non-monotonic; its full-data endpoint (0.5254) differs from the final model (0.5575) because the protocols differ.

**Leave-card-out validation** — Holding out entire cards rather than rows, to test whether the model generalises to unseen cards. The held-out-card test PR-AUC is 0.5541.

**Monotonic constraint** — A constraint that a model's output must move in a fixed direction with a feature. The monotonic variant scores 0.5922 test PR-AUC.

**Time-decay weighting** — Weighting recent training rows more heavily. The 180-day half-life variant scores 0.5408 test PR-AUC.

**Fold ensemble** — Averaging the four walk-forward fold models. The ensemble scores 0.5128 test PR-AUC.

## Drift and statistics

**PSI (population stability index)** — A binned measure of distribution shift between train and test. Rules of thumb: <0.10 stable, 0.10–0.25 moderate, ≥0.25 severe. The project finds 7 severe, 1 moderate and 19 stable features of 27; `month_sin` (6.514) and `n_prior` (5.095) are the largest.

**Adversarial validation** — Training a classifier to distinguish train from test rows. An AUC near 1.0 means the splits are almost perfectly separable. The recorded held-out AUC is 0.99999994.

**Cliff's delta** — A non-parametric effect size for the probability that a random draw from one group exceeds a random draw from another, rescaled to [−1, 1]. Amount Cliff's delta is 0.6686.

**KS statistic (Kolmogorov–Smirnov D)** — The maximum distance between two empirical cumulative distributions. Amount KS D is 0.7238.

**Cramér's V** — A chi-square-based association strength for categorical variables. Category V is 0.067 over 14 levels; ZIP3 V is 0.148 over 532 levels. The two are not directly comparable because of granularity.

**Hazard** — The discrete-time probability of a fraud event in a period, conditional on not having had one yet. The peak is month 23.

**Velocity** — Transaction speed or distance per unit time. The speed table marks 38,005 transactions (2.05%) above 1,000 km/h; these are simulator artifacts, not physical travel.

## Research governance

**Finding grade** — The source ledger's researcher-assigned label: `strong`, `supports`, `caveat` or `weak`. It is a judgement recorded in the notebook, not a formal statistical significance level.

**Evidence ledger** — `logs/findings_ledger.json`, containing 64 findings with phase, research question, grade and evidence.

**Audit note** — An independent note that qualifies or contradicts a ledger claim. There are five, including the unresolved equal-correlation leakage demo and the card-histogram “bimodal” label.

**Research question (RQ)** — One of eight pre-registered questions, RQ1–RQ8. Findings map to RQs; phases P0–P8 organise the analysis and reporting.

## Power BI and delivery

**Fact table** — A pre-aggregated analytical snapshot in the Power BI pack: a KPI, model variant, PSI feature, segment or entity profile. Facts are **not** transaction rows.

**Dimension table** — A lookup table (date, week, phase, RQ, grade, page, split, category, segment, PSI verdict) that filters facts.

**Star schema** — A model with dimensions connected to facts. The pack has 14 dimensions, 56 facts and 33 relationships.

**DAX** — The formula language used by Power BI measures. The pack ships 137 measures in `powerbi/dax/measures.dax`.

**PBIX / PBIP** — Native Power BI report/project formats. Neither is present; the pack is import-ready, not click-to-open.

**Theme** — A Power BI JSON file defining colours and typography. `powerbi/theme/fraud_evidence_theme.json` mirrors the app palette.

**Page spec** — The 1440 × 900 layout document for the 19 native pages, with fields, measures, interactions and explicitly labelled image fallbacks for figures that have no tabular source.

---

## Phase 2 evidence layer

**Evidence layer** — The eight generated JSON files under `app/public/data/phase2/` that back the Phase 2 routes. They are produced by `analytics/build_phase2_data.py` from the Phase 1 artifacts and the metric catalogue; nothing in them is hand-written.

**Deterministic insight** — A statement whose wording and numbers are produced by a fixed rule from a source table, with its source, confidence and caveat attached. No language model writes them.

**Insight scope** — The eight categories an insight can belong to: data, drift, economics, evidence quality, features, logs, model, temporal.

**Robust z-score** — `(x − median) / (1.4826 × MAD)`. Uses the median and the median absolute deviation instead of the mean and standard deviation, so a single extreme value cannot inflate the scale it is measured against. The console flags weekly fraud-rate observations at `|z| ≥ 3.5` against a 105-week reference population.

**MAD** — Median absolute deviation. The median of the absolute deviations from the median.

**Edge case** — An observation that is unusual but explained by a recording boundary rather than by the data. The final zero-fraud week (2021-01-03, 18,921 transactions) is reported as an edge case, not as an anomaly.

**Provenance (verified / inferred)** — Whether an artifact's producing notebook cell was located in a recorded write line (verified) or only inferred from its phase (inferred). 173 of 182 artifacts are verified; the 9 inferred ones are the seven HTML artifacts with no static export plus two report-metadata tables.

**Lineage edge** — A directed connection between two nodes of the evidence graph. 365 of 374 edges are verified (ledger, notebook cell range, warning register or artifact write line); 9 are inferred (phase to artifact with no located cell) and are drawn dashed.

**Message pattern** — A normalised log signature with paths, hashes and numbers replaced, so repeated lines collapse into one countable group. 817 events form 629 patterns.

**Warning family** — A group of warnings counted from the warning register rather than the raw event stream, so an event present in two sources is counted once. The console always states which count is on screen.

**Evaluation family (group)** — The unit of comparison for model variants. Variants may only be compared inside one family, because the families differ in split, sample size and objective. `dim_experiment_group` carries the basis and the limitations.

**Absolute delta** — The difference between two metric values on the metric's native scale. Used instead of a percent improvement for bounded metrics such as PR-AUC, where a percentage change overstates what a 0–1 scale can express.

**Semantic layer** — The single definition per metric: id, definition, formula, source file, source locator, validation check, confidence and caveat. Published as `fact_metric_catalog` in the Power BI pack and as the Metric catalog page in the app.

**Column profile** — Per-column statistics computed in the browser from the loaded rows: type, present/missing/unique counts, min/max/mean/median, value frequency and histogram. No sampling, no server.

**Deep link** — A URL that reproduces the current view exactly, including scope, selection, focused node, table, column, metric, finding, note and artifact. Every Phase 2 filter state is encoded in the query string.
