# Project catalog

Generated: **2026-10-20T17:57:53**  
Program: **Sparkov Card-Fraud Research Program**  
Run: `RUN-20261020-1630` · 5,513 s · seed 42

## What the project contains

| Layer | Contents | Count |
|---|---|---:|
| Source evidence | Notebook, CSV tables, PNG figures, interactive HTML, logs | 1 + 46 + 129 + 7 + 6 |
| Research structure | Phases P0–P8, eight pre-registered research questions | 9 phases · 8 RQs |
| Findings | Graded ledger entries | 64 |
| Experiments | Supervised, walk-forward, unsupervised and encoding experiments | 26 |
| Application | Power BI-style React pages | 19 |
| Power BI pack | Dimension + fact CSVs, DAX measures, relationships, theme, page spec | 70 tables · 137 measures |
| Validation | Independent source-vs-app checks | 196 |

## Application pages

| Page ID | Route | Title | Primary question | Phases | Visuals |
| --- | --- | --- | --- | --- | ---: |
| PAGE-01 | `/` | Overview | What does the program establish, and how far does it transfer? | P0,P1,P7 | 8 |
| PAGE-02 | `/data-audit` | Data audit | Is the dataset trustworthy enough to analyse? | P0 | 9 |
| PAGE-03 | `/distributions` | Distributions | How far do fraud and genuine transactions separate on each axis? | P1 | 9 |
| PAGE-04 | `/interactions` | Interactions | Where does risk concentrate when variables interact? | P2 | 10 |
| PAGE-05 | `/temporal` | Temporal | When does fraud cluster, and what changes at the split? | P3 | 7 |
| PAGE-06 | `/advanced` | Advanced viz | Does fraud separate without supervision? | P4 | 9 |
| PAGE-07 | `/statistics` | Statistics | Which differences are large and robust, not merely significant? | P5 | 8 |
| PAGE-08 | `/features` | Feature lab | Which behavioural features are leak-aware and useful? | P6 | 10 |
| PAGE-09 | `/model` | Model | How good is the model in-domain, and why does it fail out-of-domain? | P7 | 11 |
| PAGE-10 | `/economics` | Economics | What review budget buys the most fraud loss reduction? | P7 | 8 |
| PAGE-11 | `/findings` | Findings | What exactly is claimed, at what grade, and on what evidence? | P0,P1,P2,P3,P4,P5,P6,P7 | 7 |
| PAGE-12 | `/artifacts` | Artifacts | Can every displayed number be traced to a generated artifact? | P0,P1,P2,P3,P4,P5,P6,P7,P8 | 8 |
| PAGE-13 | `/insights` | Insights | What does the evidence actually say, and where is it bounded? | P0,P1,P2,P3,P7 | 7 |
| PAGE-14 | `/experiments` | Experiments | Which comparisons are legitimate, and what exactly differs? | P7 | 6 |
| PAGE-15 | `/logs` | Run logs | What did the run record, and what did it skip? | P0,P1,P2,P3,P4,P5,P6,P7,P8 | 6 |
| PAGE-16 | `/lineage` | Evidence map | How does one artifact connect back to the run that produced it? | P0,P1,P2,P3,P4,P5,P6,P7,P8 | 5 |
| PAGE-17 | `/explore` | Data explorer | What does the underlying table actually contain? | P0,P1,P2,P3,P4,P5,P6,P7,P8 | 5 |
| PAGE-18 | `/metrics` | Metric catalog | What does each metric mean and where does it come from? | P0,P1,P2,P3,P4,P5,P6,P7,P8 | 4 |
| PAGE-19 | `/program` | Program profile | What was run, in what order, and what bounds it? | P0,P1,P2,P3,P4,P5,P6,P7,P8 | 6 |

## Research phases

| Phase | Name | Section | Figures | Tables | Findings |
| --- | --- | --- | ---: | ---: | ---: |
| SETUP | Environment setup | §00 | 0 | 0 | 0 |
| P0 | Data Audit & Generator Forensics | §01 | 4 | 4 | 7 |
| P1 | Univariate Distributions | §02 | 24 | 4 | 5 |
| P2 | Bivariate & Interaction Analysis | §03 | 23 | 6 | 9 |
| P3 | Temporal Structure | §04 | 12 | 1 | 4 |
| P4 | Advanced Visualization & Dimensionality Reduction | §05 | 27 | 4 | 4 |
| P5 | Statistical Testing & Effect Sizes | §06 | 4 | 5 | 5 |
| P6 | Feature Engineering & Depth Analyses | §07 | 12 | 5 | 11 |
| P7 | Model Closure & Evaluation | §08 | 23 | 14 | 19 |
| P8 | Report & Reproducibility | §09 | 0 | 3 | 0 |

P8 is a report phase: it owns three tables and no findings. The app's 12 pages are a separate presentation layer, not a one-to-one mapping of the nine research phases.

## Research questions

| RQ | Question | Findings | Strong | Supports | Caveat | Weak |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| RQ1 | Class imbalance & drift — how extreme and how stable is the fraud rate across time and splits? | 6 | 2 | 3 | 1 | 0 |
| RQ2 | Amount structure — do fraud and non-fraud amount distributions differ, and by how much? | 2 | 2 | 0 | 0 | 0 |
| RQ3 | Temporal concentration — when (hour / weekday / month / era) does fraud concentrate? | 6 | 2 | 3 | 0 | 1 |
| RQ4 | Geography — is risk spatially structured (state, city, ZIP3, card→merchant distance)? | 6 | 0 | 3 | 3 | 0 |
| RQ5 | Cardholder behavior — do velocity / history signatures separate fraud from genuine activity? | 10 | 4 | 5 | 1 | 0 |
| RQ6 | Categorical risk structure — which categories, states, jobs and merchants carry elevated risk? | 11 | 7 | 3 | 1 | 0 |
| RQ7 | Unsupervised separability — do embeddings, clusters and anomaly scores isolate fraud without labels? | 4 | 1 | 3 | 0 | 0 |
| RQ8 | Causal predictive ceiling — what leak-free performance is achievable and which feature families drive it? | 19 | 12 | 7 | 0 | 0 |

## Findings by grade

| Grade | Count | Share |
| --- | ---: | ---: |
| strong | 30 | 46.9% |
| supports | 27 | 42.2% |
| caveat | 6 | 9.4% |
| weak | 1 | 1.6% |

The grade is a researcher-assigned label in the source ledger. The notebook does not publish a formal rubric; the app reproduces the ledger grades and adds definitions in `dim_grade`.

## Findings index

| ID | Phase | RQ | Grade | Finding |
| --- | --- | --- | --- | --- |
| F-001 | P0 | RQ1 | caveat | Data contracts evaluated with actual min/max printed (FIX #5) |
| F-002 | P0 | RQ1 | supports | Schema audited; identifiers (cc_num/zip/trans_num) excluded from numeric analyses |
| F-003 | P0 | RQ1 | strong | Class imbalance: train 7506/1296675 = 0.5789%, test 2145/555719 = 0.3860% — extreme imbalance, drift between splits detected |
| F-004 | P0 | RQ1 | strong | Temporal split: train ends 2020-06-21 12:13:37, test starts 2020-06-21 12:14:25 — time-series CV is REQUIRED for any modeling (walk-forward implemented in §08) |
| F-005 | P0 | RQ1 | supports | 999 cards × ~1,471 median txns — repeated-measures structure ⇒ card-clustered inference (§06) is mandatory |
| F-006 | P0 | RQ6 | caveat | merchant → category is deterministic (collinearity): merchant-level effects are category-level effects + noise from finite counts |
| F-007 | P0 | RQ4 | caveat | Merchant coordinates are per-transaction jitter (no fixed store locations): any card→merchant distance signal is a property of the noise model, not geography — reported honestly wherever dist_km is used (see §07) |
| F-008 | P1 | RQ2 | strong | Fraud amounts are strongly shifted right vs non-fraud (see §06 effect sizes: Cliff's delta with bootstrap CI) |
| F-009 | P1 | RQ3 | supports | COVID window (Mar–Jun 2020) fraud-rate shift quantified vs adjacent windows |
| F-010 | P1 | RQ3 | strong | Night hours (00–06) show markedly elevated fraud rate vs volume share (see phase1_hour figure + §06 forest plot with CIs) |
| F-011 | P1 | RQ4 | supports | State-level fraud-rate gradient exists but small-n states shrink toward baseline under EB — geographic claims restricted to well-populated states |
| F-012 | P1 | RQ6 | supports | Age gradient in fraud rate quantified by bin (see figure + §06 MW test with effect size for age) |
| F-013 | P2 | RQ6 | strong | Category × hour interaction: online-shopping-type categories concentrate fraud in the 22:00–06:00 window (see heatmap) |
| F-014 | P2 | RQ4 | caveat | dist_km separates classes (KS D=0.007) BUT is generator noise per §01 forensics — discriminative signal is an artifact of the simulator's fraud coordinate sampling, not physical travel |
| F-015 | P2 | RQ4 | supports | zip3 regional structure: 1 states max per zip3 (purity=100.0%); zip3 EB rates add granularity beyond state for high-volume prefixes |
| F-016 | P2 | RQ5 | strong | Per-card fraud rate is bimodal: 2.3% of cards never defrauded, 97.7% defrauded at least once — fraud is card-clustered, not exchangeable across transactions |
| F-017 | P2 | RQ5 | caveat | GENERATOR ARTIFACT (do NOT transfer as a prior): 97.7% of cards have ≥1 fraud event on this dataset — Sparkov gives fraud to nearly every card, which is the OPPOSITE of production card data where most cards never see fraud. Card-level fraud rates here are a property of the simulator's per-card fraud-minting process, not of real cards |
| F-018 | P2 | RQ1 | supports | Money lens: total fraud exposure $5,121,414; Gini=0.418; top-1% fraud txns = 2.3% of $ loss |
| F-019 | P2 | RQ6 | strong | Fraud-dollar ranking by category (not just count) — review-budget tables in §08 use $ capture, not only recall |
| F-020 | P2 | RQ5 | supports | MI ranking: behavioral/velocity features rank alongside amount — motivates the ablation experiment in §08 |
| F-021 | P2 | RQ6 | supports | Cramér's V: category vs target strongest categorical association; merchant↔category V≈1.0 (deterministic, §01) — drop one in modeling |
| F-022 | P3 | RQ3 | supports | STL: weekly seasonality strength = 0.21 in daily fraud rate (trend + seasonality + residual plotted separately) |
| F-023 | P3 | RQ3 | supports | Autocorrelation: daily volume lag-7 = 0.87 (weekly periodicity); fraud-rate lag-1 = 0.50 — evidence of temporal clustering of fraud |
| F-024 | P3 | RQ3 | weak | Structural breaks in daily fraud-rate stable across PELT penalties (2 consensus breaks); holiday proximity: 0 coincidences — breaks are generator-campaign driven, not calendar-driven |
| F-025 | P3 | RQ5 | strong | Fraud is LESS likely than genuine txns to follow >72h card silence (0.2% vs 0.6%; ratio 0.32) — among fraud txns that have a prior txn on the same card, 90.7% follow another FRAUD txn — the mechanism is rapid clustering, not dormancy: it is genuine spending that resumes after dormancy. The visual 'bursts after dormancy' impression from card timelines is quantitatively wrong (direction auto-graded from the data) |
| F-026 | P4 | RQ7 | supports | Embedding separability: best = PCA(2) (logistic AUC 0.816); embeddings show partial fraud structure but no clean separation — consistent with noisy-overlap fraud signatures |
| F-027 | P4 | RQ7 | supports | K-Means (k=3): densest cluster reaches 1.9× baseline fraud rate — clusters capture some risk structure but no pure-fraud cluster |
| F-028 | P4 | RQ7 | supports | Clustering stability: hierarchical vs K-Means ARI = 0.74; DBSCAN finds 1 clusters + 4% noise — structure is dominated by volume, not by fraud |
| F-029 | P4 | RQ7 | strong | Unsupervised anomaly detection isolates fraud only weakly (AUCs 0.731–0.881): fraud is contextual relative to card history, not pointwise-outlying — motivates per-card features (§07) |
| F-030 | P5 | RQ2 | strong | Amount shift quantified: Cliff's delta = 0.669 [bootstrap CI 0.656, 0.680], KS D = 0.724 [0.715, 0.732], BH-q = 0 |
| F-031 | P5 | RQ6 | strong | Categorical associations with target: category V=0.067 > state > gender — effect sizes (not just p) reported per plan §7.2 |
| F-032 | P5 | RQ3 | strong | Hour forest: night hours carry statistically robust rate elevations (Wilson CIs exclude baseline after BH correction) |
| F-033 | P5 | RQ6 | strong | Category forest identifies the high-risk merchant categories with CIs — the forest plot is the primary evidence table for categorical risk |
| F-034 | P5 | RQ6 | strong | Cluster-robust logit (cards as clusters, n_cards=961): 5 of 8 effects survive card-clustered SEs — per-transaction effects are smaller than naive SEs suggest (repeated-measures structure matters) |
| F-035 | P6 | RQ5 | strong | Velocity features are the strongest behavioral signals: fraud rate rises monotonically with implied speed and with trailing-window counts (see next figure) |
| F-036 | P6 | RQ4 | caveat | Interpretation boundary: dist_km carries signal only because the generator jitters merchant coordinates per transaction and samples the jitter differently for fraud events — a property of the simulator, NOT of real-world geography. Distance features must be re-validated on real data. |
| F-037 | P6 | RQ5 | supports | Hour-encoding comparison (ADDED): raw vs sin/cos vs one-hot PR-AUC 0.859 / 0.859 / 0.847 — cyclical is compact; one-hot marginally better if the hourly profile is non-smooth |
| F-038 | P6 | RQ8 | strong | Leakage demo: naive group-mean TE correlates with the test target at ρ=0.048 vs causal ρ=0.048 — every published pipeline using full-data target encodings on this dataset overstates its signal |
| F-039 | P6 | RQ6 | strong | Interaction check: night + risky categories + amt≥500 multiplies risk 42× vs baseline — interactions materially beat main effects (SHAP interactions in §08 for the model view) |
| F-040 | P6 | RQ5 | supports | Cohort analysis: fraud risk varies by card age (early-card months differ from mature months) — see cohort heatmap; campaign-like arrival quantified next via survival analysis |
| F-041 | P6 | RQ5 | supports | Time-to-first-fraud: hazard peaks at month 23 (48.889% vs flat 8.721%) — compared AGAINST the flat baseline hazard (FIX #8), so the 'fraud arrives early after card entry' claim is now supported rather than asserted; note this remains consistent with both campaign timing and generator card-aging, not proof of the former |
| F-042 | P6 | RQ5 | supports | Customer lifetime: median 556 transactions before the first fraud; 9.3% of defrauded cards are hit on their very first transaction |
| F-043 | P6 | RQ5 | strong | Repeated-fraud: 0.0% of affected cards experience ≥2 distinct fraud events; event-size distribution shows bursty multi-txn compromises rather than persistent re-fraud |
| F-044 | P6 | RQ6 | strong | Merchant hierarchical EB (merchant∈category): shrinking toward the category EB prior prevents small-n merchants from dominating risk rankings — top merchants are consistently risky, not lucky |
| F-045 | P6 | RQ4 | supports | Zip3→state hierarchy verified (100% single-state zip3s): zip3 rates are a consistent refinement of state rates for downstream encoding |
| F-046 | P7 | RQ8 | strong | Adversarial validation achieves held-out AUC = 1.000 (FIX #3) — train and test are (near-)perfectly separable by cumulative-history features (top: te_category, te_state, n_prior). Every train→test metric in this notebook (final PR-AUC, ablation delta, learning curve) measures out-of-distribution transfer under temporal drift, NOT typical generalization; walk-forward CV within the train period is the honest generalization estimate, and the ablation / learning-curve deltas must be read through this OOD lens |
| F-047 | P7 | RQ8 | strong | PSI per feature confirms which features drive the AUC=1.000 adversarial split: 7 of 27 features are SEVERE (PSI≥0.25) — top: month_sin=6.51, n_prior=5.10, month_cos=1.45. This corroborates the ablation: expanding target encodings and cumulative-history counts carry the train/test drift, so their within-model weight is a drift signal rather than a fraud signal |
| F-048 | P7 | RQ8 | strong | Walk-forward CV (time-ordered, 4 folds): PR-AUC 0.9510 ± 0.0152 — single-carve-out estimates would understate variance (review rigor item) |
| F-049 | P7 | RQ8 | strong | OOD transfer quantified (FIX #10): the SAME fold models score PR-AUC 0.951±0.015 in-domain but 0.473±0.076 on the held-out test split — mean OOD gap = +0.478 per fold. This is the cleanest single number for 'within-train generalisation minus cross-boundary transfer' and should be cited whenever anyone quotes a single train→test metric on this dataset |
| F-050 | P7 | RQ8 | strong | Leak-free causal model — test PR-AUC = 0.5575, ROC-AUC = 0.9677 (expanding TE + velocity features, train-only prior; all published numbers on this dataset that use full-data encodings are not comparable) |
| F-051 | P7 | RQ8 | supports | Time-decay weighting (half-life 180d): PR-AUC 0.5408 vs unweighted 0.5575 — recency weighting hurts on OOD test |
| F-052 | P7 | RQ8 | supports | Monotonic constraints (4 constraints on fraud-directional features: log_amt, is_night, cnt_24h, card_prior_fraud): PR-AUC 0.5922 vs unconstrained 0.5575 — helps accuracy while making the model audit-compliant |
| F-053 | P7 | RQ8 | supports | Fold-ensemble vs single final model: PR-AUC 0.5128 vs 0.5575 — single wins under OOD transfer |
| F-054 | P7 | RQ8 | supports | Calibration: Brier = 0.00241, ECE = 0.0019 — probabilities are reasonably trustworthy (review rigor item) |
| F-055 | P7 | RQ8 | supports | Temperature scaling (T=1.418) improves ECE from 0.0002 to 0.0001 on the early-stopping split — calibration is materially improved post-hoc |
| F-056 | P7 | RQ8 | strong | Bootstrap 95% CI on test PR-AUC: [0.5365, 0.5784] around 0.5575 (n_boot=200) — the point estimate is a specific sample, not a generalisation claim (FIX #13) |
| F-057 | P7 | RQ8 | supports | Leave-card-out CV (FIX #14): PR-AUC drops from 0.9948 on seen cards to 0.9639 on held-out cards (Δ = 0.0308) — the model uses per-card history that doesn't fully transfer to genuinely new customers; test rows of held-out cards score 0.5541. ((a) is partially in-sample, so the seen-vs-held gap is an upper bound on the new-customer penalty) |
| F-058 | P7 | RQ8 | strong | Cost-sensitive operating point: threshold 0.0000 minimizes expected loss (FP $5 friction vs full fraud amount) — recall 0.842 with $92,044 missed |
| F-059 | P7 | RQ8 | supports | Cost sensitivity (FIX #12): the cost-min threshold is fragile under FP-cost assumptions from $1 to $50 (threshold ratio 443.6×, optimal thresholds 0.0000–0.0004) — 70.2%–91.6% recall range across the sweep |
| F-060 | P7 | RQ8 | strong | Review budget: flagging top 1% of test by score captures 65.5% of fraud events and 68.7% of fraud dollars |
| F-061 | P7 | RQ8 | strong | Learning curve is NON-MONOTONIC: test PR-AUC peaks at frac=0.25 (n=324,168, PR-AUC=0.627) then falls to 0.525 on the full train set (drop 0.101) — more train-period data does NOT help, because train→test is a distribution shift (see the adversarial-validation finding: near-perfect split separability). All train→test metrics here measure OOD transfer; the walk-forward CV numbers are the honest generalization estimate |
| F-062 | P7 | RQ8 | strong | Decomposed ablation (FIX #11): the biggest single contributor to the OOD failure is 'MINUS card_prior_fraud' — removing it recovers PR-AUC by +0.2740 (0.5575 → 0.8315). All-family deltas vs raw-only: FULL (all features)=-0.278; MINUS card_prior_fraud=-0.004; MINUS te_* (4 features)=-0.168; MINUS cnt_*/n_prior (3 features)=-0.270; MINUS velocity (4 features)=-0.150. This localises the drift mechanism: card_prior_fraud is what does not transfer across the split |
| F-063 | P7 | RQ8 | strong | SHAP: top drivers are the behavioral/TE block (te_category, card_prior_fraud, cnt_24h...) + amount — consistent with the ablation |
| F-064 | P7 | RQ6 | supports | Segment errors at the operating point: weakest recall in health_fitness, kids_pets, personal_care — where fraud is rare or amounts are small (see table for state/hour breakdowns) |

## Experiment catalog

| ID | Family | Label | Metric | Value | Source |
| --- | --- | --- | --- | ---: | --- |
| final_unconstrained | Supervised · OOD test | FULL (all features) / final | Test PR-AUC | 0.5575 | phase8_ablation_decomposed.csv |
| ablation_minus_card_prior | Supervised · OOD test | Ablation · minus card_prior_fraud | Test PR-AUC | 0.8315 | phase8_ablation_decomposed.csv |
| ablation_minus_te | Supervised · OOD test | Ablation · minus te_* | Test PR-AUC | 0.6670 | phase8_ablation_decomposed.csv |
| ablation_minus_counts | Supervised · OOD test | Ablation · minus cnt_*/n_prior | Test PR-AUC | 0.5656 | phase8_ablation_decomposed.csv |
| ablation_minus_velocity | Supervised · OOD test | Ablation · minus velocity | Test PR-AUC | 0.6856 | phase8_ablation_decomposed.csv |
| ablation_raw_only | Supervised · OOD test | Ablation · raw-only | Test PR-AUC | 0.8353 | phase8_ablation_decomposed.csv |
| monotonic | Supervised · OOD test | Monotonic constraints | Test PR-AUC | 0.5922 | phase8_monotonic_comparison.csv |
| time_decay | Supervised · OOD test | Time-decay weighting | Test PR-AUC | 0.5408 | phase8_time_decay_comparison.csv |
| fold_ensemble | Supervised · OOD test | Fold ensemble | Test PR-AUC | 0.5128 | phase8_ensemble_comparison.csv |
| wf_fold_0 | Walk-forward folds | Fold 0 · 2020-04-22 → 2020-06-21 | Validation PR-AUC / Test PR-AUC | 0.9625 | phase8_walkforward_cv.csv |
| wf_fold_1 | Walk-forward folds | Fold 1 · 2020-02-22 → 2020-04-22 | Validation PR-AUC / Test PR-AUC | 0.9545 | phase8_walkforward_cv.csv |
| wf_fold_2 | Walk-forward folds | Fold 2 · 2019-12-24 → 2020-02-22 | Validation PR-AUC / Test PR-AUC | 0.9585 | phase8_walkforward_cv.csv |
| wf_fold_3 | Walk-forward folds | Fold 3 · 2019-10-25 → 2019-12-24 | Validation PR-AUC / Test PR-AUC | 0.9287 | phase8_walkforward_cv.csv |
| anomaly_isolationforest | Unsupervised anomaly | IsolationForest | AUC | 0.8432 | phase4_anomaly_summary.csv |
| anomaly_autoencoder | Unsupervised anomaly | Autoencoder | AUC | 0.7311 | phase4_anomaly_summary.csv |
| anomaly_lof | Unsupervised anomaly | LOF | AUC | 0.8810 | phase4_anomaly_summary.csv |
| embed_pca_2 | Unsupervised embeddings | PCA(2) | Logistic AUC on embedding | 0.8157 | phase4_separability_table.csv |
| embed_umap_nn_15_md_0_5 | Unsupervised embeddings | UMAP(nn=15,md=0.5) | Logistic AUC on embedding | 0.6427 | phase4_separability_table.csv |
| embed_t_sne_p_30 | Unsupervised embeddings | t-SNE(p=30) | Logistic AUC on embedding | 0.5940 | phase4_separability_table.csv |
| embed_t_sne_p_50 | Unsupervised embeddings | t-SNE(p=50) | Logistic AUC on embedding | 0.5913 | phase4_separability_table.csv |
| embed_umap_nn_15_md_0_1 | Unsupervised embeddings | UMAP(nn=15,md=0.1) | Logistic AUC on embedding | 0.5866 | phase4_separability_table.csv |
| embed_t_sne_p_100 | Unsupervised embeddings | t-SNE(p=100) | Logistic AUC on embedding | 0.5588 | phase4_separability_table.csv |
| embed_umap_nn_50_md_0_1 | Unsupervised embeddings | UMAP(nn=50,md=0.1) | Logistic AUC on embedding | 0.4583 | phase4_separability_table.csv |
| hour_raw | Hour encoding | Raw hour encoding | Validation PR-AUC | 0.8593 | phase7_hour_encoding_comparison.csv |
| hour_cyclical | Hour encoding | Cyclical hour encoding | Validation PR-AUC | 0.8590 | phase7_hour_encoding_comparison.csv |
| hour_categorical | Hour encoding | Categorical hour encoding | Validation PR-AUC | 0.8467 | phase7_hour_encoding_comparison.csv |

## Source tables

| Table | Phase | Category | Rows | Cols | Title |
| --- | --- | --- | ---: | ---: | --- |
| phase0_class_balance | P0 | Data quality | 3 | 4 | Class balance by split |
| phase0_contracts | P0 | Data quality | 10 | 4 | Data contracts |
| phase0_generator_forensics | P0 | Data quality | 7 | 2 | Generator forensics |
| phase0_schema | P0 | Data quality | 72 | 7 | Schema profile |
| phase1_amt_quantiles | P1 | Descriptive | 9 | 4 | Amount quantiles |
| phase1_category_table | P1 | Descriptive | 14 | 4 | Category volumes & rates |
| phase1_covid_window | P1 | Descriptive | 3 | 3 | COVID-window rates |
| phase1_merchant_table | P1 | Descriptive | 693 | 4 | Merchant rates |
| phase2_card_profiles | P2 | Behavioral | 999 | 9 | Cardholder profiles |
| phase2_city_table | P2 | Geography | 836 | 6 | City-level risk |
| phase2_dist_rate_table | P2 | Geography | 6 | 4 | Distance bins |
| phase2_mi_table | P2 | Association | 14 | 2 | Mutual information |
| phase2_money_category | P2 | Money lens | 14 | 4 | Fraud dollars by category |
| phase2_zip3_table | P2 | Geography | 532 | 12 | ZIP3 empirical Bayes |
| phase3_weekly_rate_table | P3 | Temporal | 105 | 4 | Weekly fraud rate |
| phase4_anomaly_summary | P4 | Unsupervised | 3 | 5 | Anomaly detector comparison |
| phase4_dbscan_clusters | P4 | Clustering | 2 | 3 | DBSCAN clusters |
| phase4_kmeans_cluster_rate | P4 | Clustering | 3 | 4 | K-Means clusters |
| phase4_separability_table | P4 | Unsupervised | 7 | 2 | Embedding separability |
| phase5_category_posthoc_pairs | P5 | Statistics | 72 | 6 | Category post-hoc pairs |
| phase5_category_rates | P5 | Statistics | 14 | 11 | Category rates with intervals |
| phase5_chi2_cramers | P5 | Statistics | 5 | 7 | Categorical association |
| phase5_cluster_robust_logit | P5 | Statistics | 9 | 10 | Cluster-robust logit |
| phase5_mw_effect_sizes | P5 | Statistics | 11 | 14 | Effect sizes |
| phase7_hazard_table | P6 | Survival | 24 | 6 | Discrete-time hazard |
| phase7_high_risk_combo | P6 | Behavioral | 5 | 4 | High-risk combinations |
| phase7_hour_encoding_comparison | P6 | Modeling | 3 | 2 | Hour encoding comparison |
| phase7_merchant_eb_table | P6 | Behavioral | 700 | 7 | Merchant hierarchical EB |
| phase7_speed_rate_table | P6 | Behavioral | 5 | 4 | Implied-speed risk |
| phase8_ablation_decomposed | P7 | Model evaluation | 6 | 5 | Feature-family ablation |
| phase8_calibration_temp | P7 | Model evaluation | 1 | 7 | Temperature scaling |
| phase8_capture_at_k | P7 | Model economics | 5 | 8 | Capture@k |
| phase8_cost_sensitivity | P7 | Model economics | 5 | 5 | Cost sensitivity |
| phase8_ensemble_comparison | P7 | Model evaluation | 2 | 3 | Ensemble comparison |
| phase8_learning_curve | P7 | Model evaluation | 5 | 4 | Learning curve |
| phase8_leave_card_out | P7 | Model evaluation | 3 | 5 | Leave-card-out CV |
| phase8_monotonic_comparison | P7 | Model evaluation | 2 | 3 | Monotonic constraints |
| phase8_psi | P7 | Drift | 27 | 7 | Population Stability Index |
| phase8_segment_errors | P7 | Model evaluation | 63 | 8 | Segment errors |
| phase8_threshold_table | P7 | Model economics | 3 | 11 | Operating points |
| phase8_time_decay_comparison | P7 | Model evaluation | 2 | 3 | Time-decay weighting |
| phase8_walkforward_cv | P7 | Model evaluation | 4 | 9 | Walk-forward CV |
| phase8_wf_vs_test | P7 | Model evaluation | 1 | 6 | OOD gap summary |
| figure_index | P8 | Report metadata | 129 | 2 | Figure index |
| findings_ledger | P8 | Report metadata | 64 | 5 | Findings ledger |
| reproducibility_checklist | P8 | Report metadata | 11 | 3 | Reproducibility checklist |

## Figure inventory

| Group | Figures |
| --- | ---: |
| Model evaluation | 30 |
| Distribution & association | 28 |
| Other | 14 |
| Temporal | 14 |
| Amount | 13 |
| Geography | 13 |
| Unsupervised | 13 |
| Data quality | 4 |

Total: **129** PNG figures. All are registered in `tables/figure_index.csv` and served from `app/public/artifacts/figures/`.

### Interactive artifacts

| ID | Phase | Group | Size | Source |
| --- | --- | --- | ---: | --- |
| phase1_state_n_choro | P1 | Interactive | 8.9 KB | figures/phase1_state_n_choro.html |
| phase1_state_rate_choro | P1 | Interactive | 9.7 KB | figures/phase1_state_rate_choro.html |
| phase2_city_map | P2 | Interactive | 64.4 KB | figures/phase2_city_map.html |
| phase2_map_scatter | P2 | Interactive | 554.8 KB | figures/phase2_map_scatter.html |
| phase2_state_eb_choro | P2 | Interactive | 9.7 KB | figures/phase2_state_eb_choro.html |
| phase2_state_n_choro | P2 | Interactive | 9.0 KB | figures/phase2_state_n_choro.html |
| phase4_pca_3d | P4 | Interactive | 2,861.8 KB | figures/phase4_pca_3d.html |

## Feature surface

| Capability | Where it is implemented |
|---|---|
| 12 routed analytical pages | `app/src/App.tsx`, `app/src/pages/*.tsx` |
| Global search across findings, tables, figures and pages | `app/src/components/SearchModal.tsx` |
| Filterable/sortable tables with CSV export | `app/src/components/DataTable.tsx`, `app/src/lib/csv.ts` |
| Figure lightbox and notebook viewer | `app/src/components/Figures.tsx`, `app/src/pages/Artifacts.tsx` |
| Audit drawer linking findings to independent notes | `app/src/components/Layout.tsx`, `app/src/pages/Findings.tsx` |
| Economics calculator | `app/src/pages/Economics.tsx` |
| Static data layer with lazy-loaded JSON | `app/src/lib/data.ts`, `app/public/data/` |
| Power BI import assets | `powerbi/` |

## Companion documents

- `reports/relationships.md` — lineage, star schema and filter directions.
- `reports/data_dictionary.md` — 252 source columns plus app/Power BI layers.
- `reports/metric_catalog.md` — verified metrics with formulas and source locators.
- `reports/data_quality_report.md` — completeness, validity, drift and generator artifacts.
- `reports/log_analysis.md` — run, notebook, validation and UI evidence.
- `reports/implementation_report.md` / `reports/handoff.md` — build and transfer record.
