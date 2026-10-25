# Findings Ledger — fraud-detection EDA

run: 2026-10-20T16:30:06 → 2026-10-20T18:01:59 (91.9 min), seed=42, smoke=False

## RQ1 — Class imbalance & drift — how extreme and how stable is the fraud rate across time and splits?
- **[caveat]** Data contracts evaluated with actual min/max printed (FIX #5)
  - evidence: `[{'contract': 'age min / max (Sparkov expects ~18–100)', 'actual value': '13.9 / 96.2', 'status': 'FLAG'}, {'contract': 'amt min / max', 'actual value': '1.00 / 28948.90', 'status'`
- **[supports]** Schema audited; identifiers (cc_num/zip/trans_num) excluded from numeric analyses
  - evidence: `1,852,394 rows, 9,651 fraud`
- **[strong]** Class imbalance: train 7506/1296675 = 0.5789%, test 2145/555719 = 0.3860% — extreme imbalance, drift between splits detected
  - evidence: `[{'split': 'train', 'n': 1296675, 'fraud': 7506, 'fraud_rate': 0.005788651743883394}, {'split': 'test', 'n': 555719, 'fraud': 2145, 'fraud_rate': 0.0038598644278853163}, {'split': `
- **[strong]** Temporal split: train ends 2020-06-21 12:13:37, test starts 2020-06-21 12:14:25 — time-series CV is REQUIRED for any modeling (walk-forward implemented in §08)
  - evidence: `{'train_start': '2019-01-01 00:00:18', 'train_end': '2020-06-21 12:13:37', 'test_start': '2020-06-21 12:14:25', 'test_end': '2020-12-31 23:59:34', 'gap_days': 0.0005555555555555556`
- **[supports]** 999 cards × ~1,471 median txns — repeated-measures structure ⇒ card-clustered inference (§06) is mandatory
  - evidence: `{'cards': 999, 'median_txns': 1471.0}`
- **[supports]** Money lens: total fraud exposure $5,121,414; Gini=0.418; top-1% fraud txns = 2.3% of $ loss
  - evidence: `{'gini': 0.4179056346592692}`

## RQ2 — Amount structure — do fraud and non-fraud amount distributions differ, and by how much (effect size)?
- **[strong]** Fraud amounts are strongly shifted right vs non-fraud (see §06 effect sizes: Cliff's delta with bootstrap CI)
  - evidence: `KS D=0.724`
- **[strong]** Amount shift quantified: Cliff's delta = 0.669 [bootstrap CI 0.656, 0.680], KS D = 0.724 [0.715, 0.732], BH-q = 0
  - evidence: `{'n_fraud': 9651}`

## RQ3 — Temporal concentration — when (hour / weekday / month / era) does fraud concentrate?
- **[supports]** COVID window (Mar–Jun 2020) fraud-rate shift quantified vs adjacent windows
  - evidence: `[{'window': 'Jan-Feb 2020', 'n': 99993, 'fraud_rate': 0.006790475333273329}, {'window': 'Mar-Jun 2020 (COVID)', 'n': 301890, 'fraud_rate': 0.005763688760806916}, {'window': 'Jul-De`
- **[strong]** Night hours (00–06) show markedly elevated fraud rate vs volume share (see phase1_hour figure + §06 forest plot with CIs)
  - evidence: `{'rate_night': 0.008112103088068538, 'rate_day': 0.004348090936015846}`
- **[supports]** STL: weekly seasonality strength = 0.21 in daily fraud rate (trend + seasonality + residual plotted separately)
  - evidence: `strength=0.210`
- **[supports]** Autocorrelation: daily volume lag-7 = 0.87 (weekly periodicity); fraud-rate lag-1 = 0.50 — evidence of temporal clustering of fraud
  - evidence: `{'lag7_volume': 0.869001536964109, 'lag1_rate': 0.5029544959282922}`
- **[weak]** Structural breaks in daily fraud-rate stable across PELT penalties (2 consensus breaks); holiday proximity: 0 coincidences — breaks are generator-campaign driven, not calendar-driven
  - evidence: `{'consensus': ['2019-03-23', '2020-12-31'], 'holiday_near': []}`
- **[strong]** Hour forest: night hours carry statistically robust rate elevations (Wilson CIs exclude baseline after BH correction)
  - evidence: `[{'hour': 0, 'rate': 0.013568543401203528, 'lo': 0.012678153661592147, 'hi': 0.014520545760983047, 'n': 60655}, {'hour': 1, 'rate': 0.013484428501548996, 'lo': 0.01260159548475954,`

## RQ4 — Geography — is risk spatially structured (state, city, zip3, card→merchant distance)?
- **[caveat]** Merchant coordinates are per-transaction jitter (no fixed store locations): any card→merchant distance signal is a property of the noise model, not geography — reported honestly wherever dist_km is used (see §07)
  - evidence: `{'unix_time_offset_days': -2557.0, 'unix_time_offset_std_sec': 43199.910436545055, 'merchant_single_category': False, 'merchant_lat_std_med': 5.103738784790039, 'unique_coord_pairs`
- **[supports]** State-level fraud-rate gradient exists but small-n states shrink toward baseline under EB — geographic claims restricted to well-populated states
  - evidence: `[{'state': 'TX', 'n': 135269, 'k': 592, 'rate': 0.004376464674093842, 'lo': 0.00403848734254167, 'hi': 0.004742592332803893, 'p_vs_base': 2.0590262803072172e-05, 'q_vs_base': 0.000`
- **[caveat]** dist_km separates classes (KS D=0.007) BUT is generator noise per §01 forensics — discriminative signal is an artifact of the simulator's fraud coordinate sampling, not physical travel
  - evidence: `KS=0.0071`
- **[supports]** zip3 regional structure: 1 states max per zip3 (purity=100.0%); zip3 EB rates add granularity beyond state for high-volume prefixes
  - evidence: `n_zip3=532`
- **[caveat]** Interpretation boundary: dist_km carries signal only because the generator jitters merchant coordinates per transaction and samples the jitter differently for fraud events — a property of the simulator, NOT of real-world geography. Distance features must be re-validated on real data.
  - evidence: `median per-merchant lat std=5.104 deg`
- **[supports]** Zip3→state hierarchy verified (100% single-state zip3s): zip3 rates are a consistent refinement of state rates for downstream encoding
  - evidence: `{'n_zip3': 532}`

## RQ5 — Cardholder behavior — do velocity / history signatures separate fraud from genuine activity?
- **[strong]** Per-card fraud rate is bimodal: 2.3% of cards never defrauded, 97.7% defrauded at least once — fraud is card-clustered, not exchangeable across transactions
  - evidence: `{'cards': 999, 'never': 0.023023023023023025}`
- **[caveat]** GENERATOR ARTIFACT (do NOT transfer as a prior): 97.7% of cards have ≥1 fraud event on this dataset — Sparkov gives fraud to nearly every card, which is the OPPOSITE of production card data where most cards never see fraud. Card-level fraud rates here are a property of the simulator's per-card fraud-minting process, not of real cards
  - evidence: `{'share0': 0.023023023023023025, 'share1': 0.9769769769769769}`
- **[supports]** MI ranking: behavioral/velocity features rank alongside amount — motivates the ablation experiment in §08
  - evidence: `{'log_amt': 0.0161, 'amt_z_prior': 0.0103, 'hour': 0.004, 'age': 0.0015, 'n_prior': 0.0015}`
- **[strong]** Fraud is LESS likely than genuine txns to follow >72h card silence (0.2% vs 0.6%; ratio 0.32) — among fraud txns that have a prior txn on the same card, 90.7% follow another FRAUD txn — the mechanism is rapid clustering, not dormancy: it is genuine spending that resumes after dormancy. The visual 'bursts after dormancy' impression from card timelines is quantitatively wrong (direction auto-graded from the data)
  - evidence: `{'fraud': 0.0020723241114910373, 'nonfraud': 0.0064165214574143006, 'fraud_over_nonfraud': 0.3229669105363099, 'share_prev_is_fraud': 0.9073221757322176}`
- **[strong]** Velocity features are the strongest behavioral signals: fraud rate rises monotonically with implied speed and with trailing-window counts (see next figure)
  - evidence: `{'n': {'<100': 1533728, '100-500': 243458, '500-1k': 36160, '1k-5k': 30327, '>5k': 7678}, 'k': {'<100': 5567, '100-500': 2624, '500-1k': 617, '1k-5k': 579, '>5k': 173}, 'rate': {'<`
- **[supports]** Hour-encoding comparison (ADDED): raw vs sin/cos vs one-hot PR-AUC 0.859 / 0.859 / 0.847 — cyclical is compact; one-hot marginally better if the hourly profile is non-smooth
  - evidence: `{'raw': np.float64(0.8592883007537216), 'cyclical': np.float64(0.8589878775046752), 'categorical': np.float64(0.8467011461676432)}`
- **[supports]** Cohort analysis: fraud risk varies by card age (early-card months differ from mature months) — see cohort heatmap; campaign-like arrival quantified next via survival analysis
  - evidence: `{0: 0.0255, 1: 0.0078, 2: 0.0057, 3: 0.0052, 4: 0.0049, 5: 0.0042, 6: 0.0038, 7: 0.0041, 8: 0.0053, 9: 0.0062, 10: 0.0045, 11: 0.0038}`
- **[supports]** Time-to-first-fraud: hazard peaks at month 23 (48.889% vs flat 8.721%) — compared AGAINST the flat baseline hazard (FIX #8), so the 'fraud arrives early after card entry' claim is now supported rather than asserted; note this remains consistent with both campaign timing and generator card-aging, not proof of the former
  - evidence: `[{'month': 0, 'n_risk': 999, 'events': 137, 'hazard': 0.13713713713713713, 'lo': 0.11719121245635068, 'hi': 0.15986310998101128}, {'month': 1, 'n_risk': 862, 'events': 43, 'hazard'`
- **[supports]** Customer lifetime: median 556 transactions before the first fraud; 9.3% of defrauded cards are hit on their very first transaction
  - evidence: `{'median': 556.5, 'first_txn_share': 0.0932377049180328}`
- **[strong]** Repeated-fraud: 0.0% of affected cards experience ≥2 distinct fraud events; event-size distribution shows bursty multi-txn compromises rather than persistent re-fraud
  - evidence: `{'median_event_size': 10.0}`

## RQ6 — Categorical risk structure — which categories, states, jobs, merchants carry elevated risk (with uncertainty)?
- **[caveat]** merchant → category is deterministic (collinearity): merchant-level effects are category-level effects + noise from finite counts
  - evidence: `max cats/merchant=2`
- **[supports]** Age gradient in fraud rate quantified by bin (see figure + §06 MW test with effect size for age)
  - evidence: `{'mean': {'<=25': 0.00546, '26-35': 0.00453, '36-50': 0.0041, '51-65': 0.00667, '65+': 0.00651}, 'size': {'<=25': 168055, '26-35': 401345, '36-50': 621123, '51-65': 377187, '65+': `
- **[strong]** Category × hour interaction: online-shopping-type categories concentrate fraud in the 22:00–06:00 window (see heatmap)
  - evidence: `phase2_category_x_hour`
- **[strong]** Fraud-dollar ranking by category (not just count) — review-budget tables in §08 use $ capture, not only recall
  - evidence: `{'n_fraud': {'shopping_net': 2219.0, 'misc_net': 1182.0, 'shopping_pos': 1056.0, 'grocery_pos': 2228.0, 'entertainment': 292.0}, 'fraud_usd': {'shopping_net': 2214847.75, 'misc_net`
- **[supports]** Cramér's V: category vs target strongest categorical association; merchant↔category V≈1.0 (deterministic, §01) — drop one in modeling
  - evidence: `category×state V=0.02`
- **[strong]** Categorical associations with target: category V=0.067 > state > gender — effect sizes (not just p) reported per plan §7.2
  - evidence: `[{'variable': 'category', 'levels': 14, 'chi2': 8329.139945520074, 'dof': 13, 'p': 0.0, 'cramers_v': 0.06700301241922679, 'n': 1852394}, {'variable': 'gender', 'levels': 2, 'chi2':`
- **[strong]** Category forest identifies the high-risk merchant categories with CIs — the forest plot is the primary evidence table for categorical risk
  - evidence: `[{'category': 'entertainment', 'rate': 0.0021771872530160006, 'lo': 0.001941590482243479, 'hi': 0.002441301916096508, 'n': 134118}, {'category': 'food_dining', 'rate': 0.0015681294`
- **[strong]** Cluster-robust logit (cards as clusters, n_cards=961): 5 of 8 effects survive card-clustered SEs — per-transaction effects are smaller than naive SEs suggest (repeated-measures structure matters)
  - evidence: `[{'feature': 'log_amt', 'OR': 7.436, 'OR_lo_robust': 6.59, 'OR_hi_robust': 8.391}, {'feature': 'is_night', 'OR': 0.63, 'OR_lo_robust': 0.574, 'OR_hi_robust': 0.693}, {'feature': 'a`
- **[strong]** Interaction check: night + risky categories + amt≥500 multiplies risk 42× vs baseline — interactions materially beat main effects (SHAP interactions in §08 for the model view)
  - evidence: `[{'segment': 'night + shopping_net/misc_net + amt≥500 (COMBO)', 'n': 2274, 'fraud_rate': 0.22075637642919965, 'lift_vs_base': 42.37154565943331}, {'segment': 'night alone', 'n': 42`
- **[strong]** Merchant hierarchical EB (merchant∈category): shrinking toward the category EB prior prevents small-n merchants from dominating risk rankings — top merchants are consistently risky, not lucky
  - evidence: `[{'merchant_clean': 'Kozey-Boehm', 'n': 2758, 'eb_rate': 0.0216}, {'merchant_clean': 'Herman, Treutel and Dicken', 'n': 1870, 'eb_rate': 0.02}, {'merchant_clean': 'Terry-Huel', 'n'`
- **[supports]** Segment errors at the operating point: weakest recall in health_fitness, kids_pets, personal_care — where fraud is rare or amounts are small (see table for state/hour breakdowns)
  - evidence: `[{'category': 'health_fitness', 'n': 36674.0, 'n_fraud': 52.0, 'recall': 0.21153846153846154, 'fp': 1582.0, 'segment': 'category', 'hour_bin': nan, 'state': nan}, {'category': 'kid`

## RQ7 — Unsupervised separability — do embeddings, clusters, anomaly scores isolate fraud without labels?
- **[supports]** Embedding separability: best = PCA(2) (logistic AUC 0.816); embeddings show partial fraud structure but no clean separation — consistent with noisy-overlap fraud signatures
  - evidence: `{'PCA(2)': 0.816, 'UMAP(nn=15,md=0.5)': 0.643, 't-SNE(p=30)': 0.594, 't-SNE(p=50)': 0.591, 'UMAP(nn=15,md=0.1)': 0.587, 't-SNE(p=100)': 0.559, 'UMAP(nn=50,md=0.1)': 0.458}`
- **[supports]** K-Means (k=3): densest cluster reaches 1.9× baseline fraud rate — clusters capture some risk structure but no pure-fraud cluster
  - evidence: `[{'k_fraud': 76, 'n': 10622, 'rate': 0.0072, 'cluster': 0}, {'k_fraud': 83, 'n': 28952, 'rate': 0.0029, 'cluster': 1}, {'k_fraud': 102, 'n': 10426, 'rate': 0.0098, 'cluster': 2}]`
- **[supports]** Clustering stability: hierarchical vs K-Means ARI = 0.74; DBSCAN finds 1 clusters + 4% noise — structure is dominated by volume, not by fraud
  - evidence: `{'ari': 0.7399403879909414}`
- **[strong]** Unsupervised anomaly detection isolates fraud only weakly (AUCs 0.731–0.881): fraud is contextual relative to card history, not pointwise-outlying — motivates per-card features (§07)
  - evidence: `[{'model': 'IsolationForest', 'auc': 0.843, 'top10pct_precision': 0.034, 'top10pct_lift': 6.513, 'n': 50000}, {'model': 'Autoencoder', 'auc': 0.731, 'top10pct_precision': 0.022, 't`

## RQ8 — Causal predictive ceiling — what leak-free performance is achievable and which feature families drive it?
- **[strong]** Leakage demo: naive group-mean TE correlates with the test target at ρ=0.048 vs causal ρ=0.048 — every published pipeline using full-data target encodings on this dataset overstates its signal
  - evidence: `{'naive': 0.04847998795171954, 'causal': 0.048391612071955865}`
- **[strong]** Adversarial validation achieves held-out AUC = 1.000 (FIX #3) — train and test are (near-)perfectly separable by cumulative-history features (top: te_category, te_state, n_prior). Every train→test metric in this notebook (final PR-AUC, ablation delta, learning curve) measures out-of-distribution transfer under temporal drift, NOT typical generalization; walk-forward CV within the train period is the honest generalization estimate, and the ablation / learning-curve deltas must be read through this OOD lens
  - evidence: `{'auc_holdout': 0.9999999412499999, 'auc_train': 1.0}`
- **[strong]** PSI per feature confirms which features drive the AUC=1.000 adversarial split: 7 of 27 features are SEVERE (PSI≥0.25) — top: month_sin=6.51, n_prior=5.10, month_cos=1.45. This corroborates the ablation: expanding target encodings and cumulative-history counts carry the train/test drift, so their within-model weight is a drift signal rather than a fraud signal
  - evidence: `[{'feature': 'month_sin', 'family': 'bounded', 'n_train': 1296675, 'n_test': 555719, 'psi': 6.5143, 'verdict': 'severe', 'top_driver_bin': '(0.866, inf]'}, {'feature': 'n_prior', '`
- **[strong]** Walk-forward CV (time-ordered, 4 folds): PR-AUC 0.9510 ± 0.0152 — single-carve-out estimates would understate variance (review rigor item)
  - evidence: `[{'fold': 0, 'val_window': '2020-04-22 → 2020-06-21', 'n_train': 1146194, 'n_val': 150480, 'pr_auc': 0.9625, 'roc_auc': 0.9993, 'test_pr_auc': 0.5385, 'test_roc_auc': 0.9813, 'ood_`
- **[strong]** OOD transfer quantified (FIX #10): the SAME fold models score PR-AUC 0.951±0.015 in-domain but 0.473±0.076 on the held-out test split — mean OOD gap = +0.478 per fold. This is the cleanest single number for 'within-train generalisation minus cross-boundary transfer' and should be cited whenever anyone quotes a single train→test metric on this dataset
  - evidence: `[{'fold': 0, 'val_window': '2020-04-22 → 2020-06-21', 'n_train': 1146194, 'n_val': 150480, 'pr_auc': 0.9625, 'roc_auc': 0.9993, 'test_pr_auc': 0.5385, 'test_roc_auc': 0.9813, 'ood_`
- **[strong]** Leak-free causal model — test PR-AUC = 0.5575, ROC-AUC = 0.9677 (expanding TE + velocity features, train-only prior; all published numbers on this dataset that use full-data encodings are not comparable)
  - evidence: `{'pr_auc': np.float64(0.5574801511963462), 'roc_auc': np.float64(0.9677282868198628), 'pr_auc_es': np.float64(0.9643110560572633)}`
- **[supports]** Time-decay weighting (half-life 180d): PR-AUC 0.5408 vs unweighted 0.5575 — recency weighting hurts on OOD test
  - evidence: `{'decay_pr': 0.5407833916639233, 'unweighted_pr': 0.5574801511963462, 'half_life_days': 180.0}`
- **[supports]** Monotonic constraints (4 constraints on fraud-directional features: log_amt, is_night, cnt_24h, card_prior_fraud): PR-AUC 0.5922 vs unconstrained 0.5575 — helps accuracy while making the model audit-compliant
  - evidence: `{'mono_pr': 0.5921751049650442, 'unconstrained_pr': 0.5574801511963462}`
- **[supports]** Fold-ensemble vs single final model: PR-AUC 0.5128 vs 0.5575 — single wins under OOD transfer
  - evidence: `{'ensemble_pr': 0.5128355010603128, 'single_pr': 0.5574801511963462, 'n_fold_models': 4}`
- **[supports]** Calibration: Brier = 0.00241, ECE = 0.0019 — probabilities are reasonably trustworthy (review rigor item)
  - evidence: `{'brier': 0.0024144223205205574, 'ece': 0.0019491278615084995}`
- **[supports]** Temperature scaling (T=1.418) improves ECE from 0.0002 to 0.0001 on the early-stopping split — calibration is materially improved post-hoc
  - evidence: `{'T': 1.4177918881006806, 'ece_before': 0.00015939576801433144, 'ece_after': 0.00011839453051576071, 'nll_before': 0.003543514004715919, 'nll_after': 0.0030949310364134937}`
- **[strong]** Bootstrap 95% CI on test PR-AUC: [0.5365, 0.5784] around 0.5575 (n_boot=200) — the point estimate is a specific sample, not a generalisation claim (FIX #13)
  - evidence: `{'pr_lo': 0.5365040149742729, 'pr_hi': 0.5783880943611619, 'n_boot': 200}`
- **[supports]** Leave-card-out CV (FIX #14): PR-AUC drops from 0.9948 on seen cards to 0.9639 on held-out cards (Δ = 0.0308) — the model uses per-card history that doesn't fully transfer to genuinely new customers; test rows of held-out cards score 0.5541. ((a) is partially in-sample, so the seen-vs-held gap is an upper bound on the new-customer penalty)
  - evidence: `{'seen_cards_pr': 0.9947611727137646, 'held_cards_pr': 0.9639288688633889, 'delta': 0.03083230385037572, 'held_test_pr': 0.5540768597457347, 'n_held_cards': 199}`
- **[strong]** Cost-sensitive operating point: threshold 0.0000 minimizes expected loss (FP $5 friction vs full fraud amount) — recall 0.842 with $92,044 missed
  - evidence: `{'threshold': 1e-05, 'TP': 1807.0, 'FP': 20322.0, 'FN': 338.0, 'TN': 533252.0, 'precision': 0.08165755343666682, 'recall': 0.8424242424242424, 'fp_cost': 101610.0, 'missed_usd': 92`
- **[supports]** Cost sensitivity (FIX #12): the cost-min threshold is fragile under FP-cost assumptions from $1 to $50 (threshold ratio 443.6×, optimal thresholds 0.0000–0.0004) — 70.2%–91.6% recall range across the sweep
  - evidence: `[{'fp_cost': 1.0, 'optimal_threshold': 0.0, 'expected_loss': 91313.5001, 'recall': 0.9156, 'precision': 0.0358}, {'fp_cost': 5.0, 'optimal_threshold': 0.0, 'expected_loss': 193653.`
- **[strong]** Review budget: flagging top 1% of test by score captures 65.5% of fraud events and 68.7% of fraud dollars
  - evidence: `{'top_pct': 1.0, 'k': 5557.0, 'fraud_caught': 1404.0, 'precision': 0.2526543098794313, 'recall': 0.6545454545454545, 'usd_captured': 778601.1202645302, 'usd_share': 0.6870062339692`
- **[strong]** Learning curve is NON-MONOTONIC: test PR-AUC peaks at frac=0.25 (n=324,168, PR-AUC=0.627) then falls to 0.525 on the full train set (drop 0.101) — more train-period data does NOT help, because train→test is a distribution shift (see the adversarial-validation finding: near-perfect split separability). All train→test metrics here measure OOD transfer; the walk-forward CV numbers are the honest generalization estimate
  - evidence: `[{'frac': 0.05, 'n_train': 64833, 'pr_auc': 0.3228, 'roc_auc': 0.9626}, {'frac': 0.1, 'n_train': 129667, 'pr_auc': 0.4797, 'roc_auc': 0.9692}, {'frac': 0.25, 'n_train': 324168, 'pr`
- **[strong]** Decomposed ablation (FIX #11): the biggest single contributor to the OOD failure is 'MINUS card_prior_fraud' — removing it recovers PR-AUC by +0.2740 (0.5575 → 0.8315). All-family deltas vs raw-only: FULL (all features)=-0.278; MINUS card_prior_fraud=-0.004; MINUS te_* (4 features)=-0.168; MINUS cnt_*/n_prior (3 features)=-0.270; MINUS velocity (4 features)=-0.150. This localises the drift mechanism: card_prior_fraud is what does not transfer across the split
  - evidence: `[{'model': 'FULL (all features)', 'n_features': 27, 'pr_auc': 0.5575, 'roc_auc': 0.9677, 'delta_pr_auc': -0.2779}, {'model': 'MINUS card_prior_fraud', 'n_features': 26, 'pr_auc': 0`
- **[strong]** SHAP: top drivers are the behavioral/TE block (te_category, card_prior_fraud, cnt_24h...) + amount — consistent with the ablation
  - evidence: `{'log_amt': 3.7588, 'cat_code': 1.4849, 'card_prior_fraud': 1.2296, 'n_prior': 1.126, 'age': 0.538, 'hour_cos': 0.5008}`
