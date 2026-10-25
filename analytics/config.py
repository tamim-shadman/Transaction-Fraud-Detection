"""Static analytical configuration for the fraud EDA evidence console.

Only project metadata, interpretations and display labels live here. All numeric
values are loaded from the project's own CSV/JSON artifacts by build_dataset.py.
"""

PROJECT = {
    "id": "sparkov-fraud-eda",
    "title": "Sparkov Card-Fraud Research Program",
    "short_title": "Card-fraud evidence console",
    "subtitle": "Research-grade EDA, causal feature engineering and leak-aware model evaluation",
    "description": (
        "A single research notebook analyzing 1.85M simulated card transactions across "
        "8 pre-registered research questions. The program combines generator forensics, "
        "effect-size-first statistics, temporal validation, causal feature engineering and "
        "a full evaluation/economics suite."
    ),
    "source_dataset": "kartik2112/fraud-detection (Sparkov simulator)",
    "domain": "Financial crime / transaction fraud",
    "project_type": "Research-grade exploratory analytics and model evaluation",
    "primary_users": [
        "Fraud analytics leads",
        "Data scientists and ML engineers",
        "Model risk and validation reviewers",
        "BI and analytics engineering teams",
    ],
    "technologies": [
        "Python 3.13", "pandas 2.2.3", "NumPy 2.1.3", "scikit-learn 1.6.1",
        "LightGBM 4.6.0", "SHAP 0.54.1", "statsmodels 0.15.0",
        "UMAP 0.5.12", "ruptures 1.1.10", "Plotly 5.24.1",
        "matplotlib 3.10.0", "seaborn 0.13.2", "missingno 0.5.2",
    ],
    "created_for": "Power BI-style analytical simulation built from the workspace artifacts",
}

# Canonical phase IDs used by the dashboard. The source has inconsistent phase
# naming: output prefixes are phase0..phase5, phase7, phase8, while the findings
# ledger uses section indices 1..8. Both mappings are retained.
PHASES = [
    {
        "id": "P0",
        "num": "00",
        "name": "Data Audit & Generator Forensics",
        "short_name": "Data audit",
        "section": "§01",
        "output_prefix": "phase0",
        "ledger_phase": "1",
        "cell_start": 13,
        "cell_end": 18,
        "purpose": (
            "Establish what the simulator actually produces before interpreting any "
            "downstream signal: schema, missingness, identifiers, split boundaries, "
            "class balance and known generator artifacts."
        ),
        "description": (
            "The audit resolves 1,852,394 transactions and audits 71 analytical columns. "
            "It fingerprints the two source CSVs, checks ten data contracts, establishes "
            "the temporal train/test boundary, and records the simulator behaviors that "
            "bound every later claim."
        ),
        "methods": [
            "Schema & completeness profiling", "Data contracts", "SHA-256 fingerprint",
            "Identifier audit", "Class balance", "Temporal coverage",
            "Generator forensics", "Split integrity",
        ],
        "key_metric": {"label": "Transactions audited", "value": 1852394, "format": "integer"},
        "key_findings": [
            "Train and test are separated by a 48-second boundary, not a random split.",
            "Eleven columns contain structural missingness from first-transaction history.",
            "One data contract is flagged: minimum age is 13.9 years versus an expected ~18.",
        ],
        "limitations": [
            "Raw CSVs are not present in the workspace; only hashes and derived outputs are available.",
            "The SHA-256 values were recorded as 16-character prefixes, not full digests.",
        ],
        "accent": "#E4572E",
    },
    {
        "id": "P1",
        "num": "01",
        "name": "Univariate Distributions",
        "short_name": "Univariate",
        "section": "§02",
        "output_prefix": "phase1",
        "ledger_phase": "2",
        "cell_start": 19,
        "cell_end": 26,
        "purpose": (
            "Characterize the marginal distributions of amount, time, category, "
            "demographics and geography, and quantify how far fraud separates from "
            "genuine activity on each axis."
        ),
        "description": (
            "Twenty-four figures cover amount histograms, ECDFs, QQ plots, categorical "
            "rates, time profiles and demographic/geographic distributions. The phase "
            "establishes the first effect-size estimates rather than relying on p-values."
        ),
        "methods": [
            "Histograms & ECDFs", "Box/violin & QQ plots", "Quantile comparison",
            "Category fraud rates", "Temporal profiles", "Demographic rates",
        ],
        "key_metric": {"label": "Amount separation (KS D)", "value": 0.7238, "format": "decimal3"},
        "key_findings": [
            "Fraud amounts are shifted far to the right: median $390 versus $47.24 for genuine transactions.",
            "The amount distribution is the strongest univariate separator in the program (KS D = 0.724).",
            "Night hours carry a higher fraud rate than daytime volume would suggest.",
        ],
        "limitations": [
            "Univariate separation does not establish incremental predictive value.",
            "Amount outliers are retained in the analysis; the maximum is 28,948.90.",
        ],
        "accent": "#3B6FD4",
    },
    {
        "id": "P2",
        "num": "02",
        "name": "Bivariate & Interaction Analysis",
        "short_name": "Bivariate",
        "section": "§03",
        "output_prefix": "phase2",
        "ledger_phase": "3",
        "cell_start": 27,
        "cell_end": 36,
        "purpose": (
            "Test whether risk concentrates in combinations of category, time, geography "
            "and cardholder behavior, and measure the money exposure behind transaction counts."
        ),
        "description": (
            "The interaction phase links category × hour, card profiles, city and ZIP3 "
            "structure, the fraud-dollar lens, mutual information and association structure. "
            "It distinguishes real structure from generator-driven artifacts."
        ),
        "methods": [
            "Interaction heatmaps", "Cardholder profiles", "Money-denominated rates",
            "Mutual information", "Spearman structure", "Cramér's V", "ZIP3 EB shrinkage",
        ],
        "key_metric": {"label": "shopping_net fraud rate", "value": 0.015927, "format": "percent2"},
        "key_findings": [
            "shopping_net is the highest-volume high-risk category at 1.59% fraud versus a 0.52% baseline.",
            "Merchant coordinates are jittered per transaction; distance is a simulator artifact, not physical travel.",
            "97.7% of cards experience at least one fraud event—an important simulator boundary, not a production prior.",
        ],
        "limitations": [
            "Merchant and category are almost redundant; merchant-level effects should not be over-interpreted.",
            "Geographic claims are restricted by the simulator's coordinate model.",
        ],
        "accent": "#7A5AF8",
    },
    {
        "id": "P3",
        "num": "03",
        "name": "Temporal Structure",
        "short_name": "Temporal",
        "section": "§04",
        "output_prefix": "phase3",
        "ledger_phase": "4",
        "cell_start": 37,
        "cell_end": 40,
        "purpose": (
            "Determine whether fraud is temporally clustered and how volume, seasonality "
            "and structural breaks evolve across the 2019–2020 observation window."
        ),
        "description": (
            "Rolling statistics, weekly fraud-rate series, STL decomposition, ACF/PACF, "
            "time-profile heatmaps, PELT change-point sensitivity and card timelines are "
            "used to separate campaign-like clustering from calendar effects."
        ),
        "methods": [
            "7-day rolling statistics", "STL decomposition", "ACF / PACF",
            "PELT change-point analysis", "Time-profile heatmaps", "Card timelines",
        ],
        "key_metric": {"label": "Lag-1 fraud-rate autocorrelation", "value": 0.503, "format": "decimal3"},
        "key_findings": [
            "Daily fraud rate has lag-1 autocorrelation of 0.503, evidence of temporal clustering.",
            "Volume has strong weekly periodicity (lag-7 = 0.869); STL seasonality strength is 0.21.",
            "Two consensus structural breaks are stable across PELT penalties; no holiday proximity was found.",
        ],
        "limitations": [
            "Two breaks are a small number of events; causal attribution to campaigns is not established.",
            "The observations are simulated; calendar effects are properties of the generator.",
        ],
        "accent": "#11A6A1",
    },
    {
        "id": "P4",
        "num": "04",
        "name": "Advanced Visualization & Dimensionality Reduction",
        "short_name": "Unsupervised",
        "section": "§05",
        "output_prefix": "phase4",
        "ledger_phase": "5",
        "cell_start": 41,
        "cell_end": 48,
        "purpose": (
            "Test whether fraud separates without labels using embeddings, clustering and "
            "anomaly detection, and document the limits of visual separability."
        ),
        "description": (
            "PCA, t-SNE and UMAP embeddings are scored with logistic AUC. K-Means, DBSCAN "
            "and hierarchical clustering are profiled, alongside Isolation Forest, an "
            "autoencoder and LOF. High-dimensional visual encodings are evaluated for honesty."
        ),
        "methods": [
            "PCA (2D/3D, biplot)", "t-SNE", "UMAP", "K-Means", "DBSCAN",
            "Hierarchical clustering", "Isolation Forest", "Autoencoder", "LOF",
            "Parallel coordinates", "Andrews curves", "Hexbin",
        ],
        "key_metric": {"label": "Best embedding separability (AUC)", "value": 0.8157, "format": "decimal3"},
        "key_findings": [
            "PCA(2) reaches logistic AUC 0.816; nonlinear embeddings do not improve separability.",
            "Anomaly detectors isolate fraud only weakly (AUC 0.731–0.881).",
            "DBSCAN labels 4% of points as noise, with a 6.08% fraud rate in that noise.",
        ],
        "limitations": [
            "Embedding AUC is a property of a 2D representation, not a deployable classifier.",
            "LOF was evaluated on 5,000 rows versus 50,000 for the other anomaly models; AUCs are not directly comparable.",
        ],
        "accent": "#D97A18",
    },
    {
        "id": "P5",
        "num": "05",
        "name": "Statistical Testing & Effect Sizes",
        "short_name": "Statistics",
        "section": "§06",
        "output_prefix": "phase5",
        "ledger_phase": "6",
        "cell_start": 49,
        "cell_end": 50,
        "purpose": (
            "Replace significance-only claims with effect sizes, bootstrap intervals, "
            "multiple-testing correction and inference that respects the card-level repeated measures."
        ),
        "description": (
            "Mann–Whitney tests are paired with Cliff's delta, KS statistics, bootstrap CIs "
            "and BH-FDR. Categorical associations use Cramér's V with post-hoc correction, "
            "and a card-clustered logistic model shows how naive standard errors mislead."
        ),
        "methods": [
            "Mann–Whitney U", "Cliff's delta + bootstrap CI", "KS D + bootstrap CI",
            "Benjamini–Hochberg FDR", "Chi-square / Cramér's V", "Wilson intervals",
            "Card-cluster-robust logistic regression",
        ],
        "key_metric": {"label": "Amount effect (Cliff's delta)", "value": 0.6686, "format": "decimal3"},
        "key_findings": [
            "Fraud amounts show Cliff's delta 0.669 [0.656, 0.680] and KS D 0.724 [0.715, 0.732].",
            "Five of eight logit effects survive card-clustered standard errors.",
            "72 of 91 category-pair post-hoc tests remain significant after Bonferroni correction.",
        ],
        "limitations": [
            "Cramér's V is not comparable across variables with very different cardinality (e.g., ZIP3 with 532 levels).",
            "The logistic model uses a 200,000-row sample and 961 card clusters, not the full 1.85M rows.",
        ],
        "accent": "#5B5BD6",
    },
    {
        "id": "P6",
        "num": "06",
        "name": "Feature Engineering & Depth Analyses",
        "short_name": "Feature engineering",
        "section": "§07",
        "output_prefix": "phase7",
        "ledger_phase": "7",
        "cell_start": 51,
        "cell_end": 54,
        "purpose": (
            "Build leak-aware behavioral features and test whether velocity, cohorts, "
            "hazards, hierarchical shrinkage and encoding choices add interpretable signal."
        ),
        "description": (
            "This phase constructs expanding, train-only target encodings, prior-transaction "
            "statistics and velocity features. It adds cohorts, discrete-time hazard, "
            "merchant hierarchical empirical Bayes, repeated-fraud events and an hour-encoding comparison."
        ),
        "methods": [
            "Expanding causal target encoding", "Prior-transaction statistics",
            "Velocity features", "High-risk combinations", "Cohort analysis",
            "Kaplan–Meier + discrete hazard", "Hierarchical empirical Bayes",
            "Hour encoding comparison",
        ],
        "key_metric": {"label": "High-risk combination lift", "value": 42.37, "format": "multiplier2"},
        "key_findings": [
            "Night + risky category + amount ≥ $500 reaches a 22.08% fraud rate, 42.4× baseline.",
            "38,005 transactions (2.05%) imply speeds above 1,000 km/h—physically impossible transitions.",
            "No affected card has two distinct fraud events more than 7 days apart; compromises are bursty.",
            "Fraud rate rises monotonically with implied speed and trailing-window counts.",
        ],
        "limitations": [
            "The high-risk combination is descriptive, not a causal effect.",
            "The simulator gives fraud to nearly every card; cohorts and hazards are not production priors.",
        ],
        "accent": "#E4572E",
    },
    {
        "id": "P7",
        "num": "07",
        "name": "Model Closure & Evaluation",
        "short_name": "Model lab",
        "section": "§08",
        "output_prefix": "phase8",
        "ledger_phase": "8",
        "cell_start": 55,
        "cell_end": 63,
        "purpose": (
            "Measure leak-free predictive performance, diagnose train→test transfer, "
            "calibrate probabilities and translate scores into review-budget economics."
        ),
        "description": (
            "A 27-feature LightGBM is evaluated with adversarial validation, per-feature PSI, "
            "walk-forward CV and leave-card-out CV. Calibration, cost-sensitive thresholds, "
            "capture@k, learning curves, ablation, SHAP, PDP/ICE and segment errors complete the loop."
        ),
        "methods": [
            "Adversarial validation", "Population Stability Index", "Walk-forward CV",
            "LightGBM", "Bootstrap PR-AUC CI", "Calibration & temperature scaling",
            "Cost-sensitive thresholds", "Capture@k", "Learning curve", "Ablation",
            "SHAP", "PDP / ICE", "Segment error analysis", "Leave-card-out CV",
            "Time-decay weighting", "Monotonic constraints",
        ],
        "key_metric": {"label": "Test PR-AUC (OOD)", "value": 0.55748, "format": "decimal4"},
        "key_findings": [
            "Final model: test PR-AUC 0.5575 [0.5365, 0.5784], ROC-AUC 0.9677.",
            "Walk-forward in-domain PR-AUC is 0.9510 ± 0.0152, but the same folds transfer at 0.4726 ± 0.0761.",
            "Adversarial validation separates train and test at AUC 0.99999994; 7 of 27 features have severe PSI.",
            "Top 1% of test by score captures 65.5% of fraud events and 68.7% of fraud dollars.",
            "Removing card_prior_fraud raises test PR-AUC from 0.5575 to 0.8315, localizing the transfer failure.",
        ],
        "limitations": [
            "Test metrics measure out-of-distribution transfer, not typical generalization.",
            "No epoch-level training history or hardware telemetry was logged.",
            "The final model's probability calibration is not directly comparable to the temperature-scaling split.",
        ],
        "accent": "#7A5AF8",
    },
    {
        "id": "P8",
        "num": "08",
        "name": "Report & Reproducibility",
        "short_name": "Report",
        "section": "§09",
        "output_prefix": None,
        "ledger_phase": None,
        "cell_start": 64,
        "cell_end": 65,
        "purpose": (
            "Compile the graded findings ledger, figure/table index, reproducibility "
            "checklist and output bundle, and verify the expected phase-8 artifacts exist."
        ),
        "description": (
            "The closing phase writes 64 findings, 129 figure captions and an 11-item "
            "reproducibility checklist. It verifies 9/9 expected phase-8 tables and creates "
            "a 17.9 MB output bundle (not included in this workspace)."
        ),
        "methods": [
            "Findings compilation", "Figure index", "Reproducibility checklist",
            "Artifact verification", "Output bundling",
        ],
        "key_metric": {"label": "Reproducibility checks passed", "value": 11, "format": "integer"},
        "key_findings": [
            "64 findings compiled: 30 strong, 27 supports, 6 caveats and 1 weak.",
            "All 11 reproducibility checklist items are marked true.",
            "The notebook reports 9/9 expected phase-8 tables present.",
        ],
        "limitations": [
            "The 17.9 MB bundle referenced by the run is not present in the workspace.",
            "The report summary says 45 tables, while 46 CSV tables are present.",
        ],
        "accent": "#626878",
    },
]

RQS = {
    "RQ1": "Class imbalance & drift — how extreme and how stable is the fraud rate across time and splits?",
    "RQ2": "Amount structure — do fraud and non-fraud amount distributions differ, and by how much?",
    "RQ3": "Temporal concentration — when (hour / weekday / month / era) does fraud concentrate?",
    "RQ4": "Geography — is risk spatially structured (state, city, ZIP3, card→merchant distance)?",
    "RQ5": "Cardholder behavior — do velocity / history signatures separate fraud from genuine activity?",
    "RQ6": "Categorical risk structure — which categories, states, jobs and merchants carry elevated risk?",
    "RQ7": "Unsupervised separability — do embeddings, clusters and anomaly scores isolate fraud without labels?",
    "RQ8": "Causal predictive ceiling — what leak-free performance is achievable and which feature families drive it?",
}

GRADE_DEFS = [
    {
        "grade": "strong",
        "label": "Strong",
        "definition": "Direct quantitative evidence with uncertainty or an explicit comparison; supports the stated claim.",
        "interpretation": "Researcher-assigned grade in the project ledger. The notebook does not publish a formal rubric; this dashboard treats it as the strongest tier.",
        "color": "#1F9D73",
    },
    {
        "grade": "supports",
        "label": "Supports",
        "definition": "Quantitative evidence consistent with the claim, but narrower or less direct than a strong finding.",
        "interpretation": "Researcher-assigned grade. May depend on a single figure, table or summary statistic.",
        "color": "#3B6FD4",
    },
    {
        "grade": "weak",
        "label": "Weak",
        "definition": "A fragile or ambiguous signal that should not carry a conclusion on its own.",
        "interpretation": "Only one ledger finding carries this grade: the PELT structural-break interpretation.",
        "color": "#D97A18",
    },
    {
        "grade": "caveat",
        "label": "Caveat",
        "definition": "A limitation, generator artifact or interpretation boundary rather than a positive claim.",
        "interpretation": "Caveats are used to bound external validity and should travel with the findings they qualify.",
        "color": "#D1495B",
    },
]

# Independent audit notes produced while validating the dashboard's claims.
AUDIT_NOTES = [
    {
        "id": "AN-01",
        "title": "The leakage-demo claim is not supported by its own numbers",
        "status": "contradicted",
        "claim": "The ledger says every pipeline using full-data target encoding overstates its signal.",
        "observation": "The recorded Spearman correlations are 0.048 for the naive encoding and 0.048 for the causal encoding—equal at the displayed precision. The notebook output does not demonstrate inflation.",
        "implication": "Keep the causal encoding as good practice, but do not use this finding as evidence that naive encoding inflated this dataset's signal.",
        "sources": ["findings_ledger.csv · RQ8 leakage demo", "notebook cell 52 output"],
        "phase": "P6",
    },
    {
        "id": "AN-02",
        "title": "“Bimodal” card fraud is really zero-inflation plus a broad rate distribution",
        "status": "wording",
        "claim": "Per-card fraud rate is described as bimodal because 2.3% of cards never see fraud and 97.7% see it at least once.",
        "observation": "The 999 card profiles show 23 cards with zero fraud and 976 with one or more events. The positive cards have fraud rates spread from near zero to 100%; that is not a two-peak distribution.",
        "implication": "The substantive point—fraud is card-clustered—stands. The word “bimodal” should be replaced with “zero-inflated / near-universal exposure.”",
        "sources": ["phase2_card_profiles.csv", "findings_ledger.csv · RQ5"],
        "phase": "P2",
    },
    {
        "id": "AN-03",
        "title": "Merchant→category is near-deterministic, not strictly deterministic",
        "status": "discrepancy",
        "claim": "The ledger calls merchant→category deterministic collinearity.",
        "observation": "The generator forensics record merchant_single_category = False and max categories per merchant = 2.",
        "implication": "Treat merchant and category as near-redundant representations with a small number of exceptions, not as an exact functional dependency.",
        "sources": ["phase0_generator_forensics.csv", "findings_ledger.csv · RQ6"],
        "phase": "P0",
    },
    {
        "id": "AN-04",
        "title": "Cramér's V is compared across very different cardinalities",
        "status": "method",
        "claim": "Category is described as having the strongest categorical association with fraud.",
        "observation": "Category V = 0.067 over 14 levels, but ZIP3 V = 0.148 over 532 levels. Uncorrected Cramér's V rises mechanically with cardinality and the table does not apply a bias correction.",
        "implication": "Do not rank categorical variables by raw V. Use a bias-corrected statistic or permutation null before declaring a strongest categorical association.",
        "sources": ["phase5_chi2_cramers.csv", "findings_ledger.csv · RQ6"],
        "phase": "P5",
    },
    {
        "id": "AN-05",
        "title": "Artifact count differs from the notebook's closing summary",
        "status": "discrepancy",
        "claim": "The report cell prints “tables: 45”.",
        "observation": "The workspace contains 46 CSV tables, including figure_index.csv, findings_ledger.csv and reproducibility_checklist.csv.",
        "implication": "Counts should be taken after all closing artifacts are written. The dashboard uses the observed 46.",
        "sources": ["notebook cell 65 output", "tables/ directory"],
        "phase": "P8",
    },
]

# Curated issue register. Every issue points at an actual artifact.
ISSUES = [
    {
        "id": "ISS-01",
        "title": "Raw source datasets are absent from the workspace",
        "severity": "High",
        "category": "Reproducibility",
        "scope": "Workspace",
        "status": "Open",
        "confidence": "Confirmed",
        "summary": "Only the notebook, derived tables, figures and logs are present. fraudTrain.csv and fraudTest.csv are referenced by hash and size but are not in the folder.",
        "evidence": [
            "logs/data_fingerprint.json records 351.2 MB and 150.4 MB source files.",
            "No CSV or ZIP larger than 1 MB exists under the project root.",
        ],
        "impact": "The analytical outputs can be inspected but the notebook cannot be rerun end-to-end from this folder alone.",
        "action": "Add the Kaggle source files (or an authorized copy) and run the rebuild pipeline with FRAUD_PROJECT_ROOT set.",
        "sources": ["logs/data_fingerprint.json", "fraud_eda_colab(1).ipynb"],
        "phase": "P0",
    },
    {
        "id": "ISS-02",
        "title": "Train→test shift makes every test metric an OOD estimate",
        "severity": "High",
        "category": "Model risk",
        "scope": "Project",
        "status": "Open",
        "confidence": "Confirmed",
        "summary": "Train and test are almost perfectly separable by cumulative-history features. The final model's test PR-AUC is a cross-boundary transfer estimate, not a typical generalization estimate.",
        "evidence": [
            "Adversarial validation held-out AUC = 1.000 (0.99999994).",
            "7 of 27 model features have severe PSI (≥0.25).",
            "Walk-forward PR-AUC 0.9510 ± 0.0152 versus test transfer 0.4726 ± 0.0761 for the same folds.",
        ],
        "impact": "Quoting 0.5575 as “model accuracy” without the OOD context would overstate production readiness.",
        "action": "Report in-domain and cross-boundary metrics side by side; validate on a genuinely external, later cohort before deployment.",
        "sources": ["phase8_psi.csv", "phase8_walkforward_cv.csv", "phase8_wf_vs_test.csv", "findings_ledger.csv · RQ8"],
        "phase": "P7",
    },
    {
        "id": "ISS-03",
        "title": "card_prior_fraud dominates the transfer failure",
        "severity": "High",
        "category": "Model risk",
        "scope": "Project",
        "status": "Open",
        "confidence": "Confirmed",
        "summary": "Removing the causal prior-fraud count raises test PR-AUC from 0.5575 to 0.8315. The feature is causally constructed but its distribution shifts sharply across the split.",
        "evidence": [
            "phase8_ablation_decomposed.csv: FULL 0.5575 vs MINUS card_prior_fraud 0.8315.",
            "PSI for card_prior_fraud = 0.327 (severe).",
            "97.7% of cards already have at least one train-period fraud event in the simulator.",
        ],
        "impact": "The feature may encode campaign timing / generator mechanics rather than transferable fraud behavior.",
        "action": "Retrain without card_prior_fraud and compare on external data; model fraud-label latency explicitly before using prior fraud in real time.",
        "sources": ["phase8_ablation_decomposed.csv", "phase8_psi.csv", "phase2_card_profiles.csv"],
        "phase": "P7",
    },
    {
        "id": "ISS-04",
        "title": "Simulator artifacts limit external validity",
        "severity": "High",
        "category": "External validity",
        "scope": "Project",
        "status": "Open",
        "confidence": "Confirmed",
        "summary": "Several apparently predictive structures are properties of the Sparkov generator: near-universal card fraud, per-transaction merchant coordinate jitter, deterministic-ish merchant categories and impossible travel speeds.",
        "evidence": [
            "97.7% of cards have at least one fraud event.",
            "Median per-merchant latitude standard deviation = 5.10° (~566 km); coordinates are not fixed stores.",
            "38,005 transactions (2.05%) imply speeds above 1,000 km/h.",
            "Merchant_single_category = False; max categories per merchant = 2.",
        ],
        "impact": "Distance, merchant and card-history priors should not be transferred to production without revalidation.",
        "action": "Re-run the feature and cohort analyses on real transaction data with stable merchant identifiers and label latency.",
        "sources": ["phase0_generator_forensics.csv", "phase7_speed_rate_table.csv", "findings.md · generator boundary"],
        "phase": "P0",
    },
    {
        "id": "ISS-05",
        "title": "One strong finding is contradicted by its own evidence",
        "severity": "Medium",
        "category": "Evidence quality",
        "scope": "Evidence",
        "status": "Open",
        "confidence": "Confirmed",
        "summary": "The target-encoding leakage demo reports naive ρ=0.048 and causal ρ=0.048, yet its finding says full-data encoding overstates the signal.",
        "evidence": [
            "notebook cell 52 output: naive TE corr 0.048, causal TE corr 0.048.",
            "findings_ledger.csv marks the claim “strong”.",
        ],
        "impact": "A reader could cite an inflation effect that the recorded numbers do not show.",
        "action": "Revise the claim to a null result or supply a stronger leakage metric; keep the causal encoding as a methodological safeguard.",
        "sources": ["findings_ledger.csv · RQ8", "notebook cell 52 output"],
        "phase": "P6",
    },
    {
        "id": "ISS-06",
        "title": "Cramér's V comparisons ignore cardinality bias",
        "severity": "Medium",
        "category": "Statistics",
        "scope": "Project",
        "status": "Open",
        "confidence": "Confirmed",
        "summary": "ZIP3 has 532 levels and V=0.148; category has 14 levels and V=0.067. Raw V is not comparable across these cardinalities.",
        "evidence": ["phase5_chi2_cramers.csv"],
        "impact": "“Category is the strongest categorical association” is not established by the table.",
        "action": "Use bias-corrected Cramér's V or a permutation baseline; rank only within comparable cardinalities.",
        "sources": ["phase5_chi2_cramers.csv"],
        "phase": "P5",
    },
    {
        "id": "ISS-07",
        "title": "Age contract violation is unresolved",
        "severity": "Low",
        "category": "Data quality",
        "scope": "Project",
        "status": "Open",
        "confidence": "Confirmed",
        "summary": "The minimum age is 13.9 years, below the ~18 expected for a cardholder. The record is flagged but not corrected.",
        "evidence": ["phase0_contracts.csv · age min/max FLAG"],
        "impact": "Minor for aggregate EDA; potentially material for age-segment analysis or any production-like use.",
        "action": "Inspect the source rows and decide whether to exclude, cap or retain with a documented rule.",
        "sources": ["phase0_contracts.csv"],
        "phase": "P0",
    },
    {
        "id": "ISS-08",
        "title": "ZIP codes lose leading zeros",
        "severity": "Medium",
        "category": "Data quality",
        "scope": "Project",
        "status": "Open",
        "confidence": "Confirmed",
        "summary": "116,389 transactions have ZIP values below 10,000, consistent with leading-zero loss after numeric parsing.",
        "evidence": ["phase0_contracts.csv · zip < 10000 (leading-zero loss artifact)"],
        "impact": "ZIP-level joins and geography analyses may misclassify Northeast ZIPs.",
        "action": "Read ZIP as string with zero-padding; re-run ZIP3 aggregation if exact geography matters.",
        "sources": ["phase0_contracts.csv"],
        "phase": "P0",
    },
    {
        "id": "ISS-09",
        "title": "Structural missingness reaches 10.79%",
        "severity": "Medium",
        "category": "Data quality",
        "scope": "Project",
        "status": "Open",
        "confidence": "Confirmed",
        "summary": "Prior-transaction and z-score features are missing for the first transaction on a card; amt_z_prior is missing in 10.79% of rows.",
        "evidence": ["phase0_schema.csv · 11 columns with missingness"],
        "impact": "Models and PDP routines must handle NaN explicitly; dropping rows would bias first-transaction behavior.",
        "action": "Retain explicit missing indicators and document LightGBM's native NaN handling.",
        "sources": ["phase0_schema.csv"],
        "phase": "P0",
    },
    {
        "id": "ISS-10",
        "title": "The cost-minimizing operating point is precision-costly",
        "severity": "Medium",
        "category": "Operations",
        "scope": "Project",
        "status": "Open",
        "confidence": "Confirmed",
        "summary": "At the cost-min threshold (≈0.00001), recall is 84.2% but 20,322 genuine transactions are flagged (precision 8.2%). At a 1% review budget, precision is 25.3% and 4,153 genuine transactions are flagged.",
        "evidence": ["phase8_threshold_table.csv", "phase8_capture_at_k.csv"],
        "impact": "The economically optimal threshold may be operationally infeasible without review capacity.",
        "action": "Choose an operating point against measured analyst capacity; report expected false-positive workload alongside recall.",
        "sources": ["phase8_threshold_table.csv", "phase8_capture_at_k.csv"],
        "phase": "P7",
    },
    {
        "id": "ISS-11",
        "title": "Optimal threshold is fragile to the false-positive cost",
        "severity": "Medium",
        "category": "Decision risk",
        "scope": "Project",
        "status": "Open",
        "confidence": "Confirmed",
        "summary": "Across $1–$50 false-positive friction, the optimal threshold moves from 0.0000 to 0.0004 and recall ranges from 91.6% to 70.2%.",
        "evidence": ["phase8_cost_sensitivity.csv"],
        "impact": "A single cost assumption should not be treated as a stable policy.",
        "action": "Present a cost-sensitivity range and tie the final threshold to a governance decision.",
        "sources": ["phase8_cost_sensitivity.csv"],
        "phase": "P7",
    },
    {
        "id": "ISS-12",
        "title": "Evidence excerpts are capped at 400 characters",
        "severity": "Medium",
        "category": "Evidence quality",
        "scope": "Evidence",
        "status": "Open",
        "confidence": "Confirmed",
        "summary": "The notebook's log_finding function stores str(evidence)[:400]. The ledger therefore contains excerpts, not full supporting objects.",
        "evidence": ["notebook cell 8 · log_finding", "maximum evidence length in findings_ledger.json = 400"],
        "impact": "Some findings cannot be independently reproduced from the ledger alone.",
        "action": "Store full structured evidence and stable cell/line references; keep the short excerpt for display.",
        "sources": ["logs/findings_ledger.json", "notebook cell 8"],
        "phase": "P8",
    },
    {
        "id": "ISS-13",
        "title": "Phase numbering is inconsistent across artifacts",
        "severity": "Medium",
        "category": "Metadata",
        "scope": "Workspace",
        "status": "Mitigated",
        "confidence": "Confirmed",
        "summary": "Figure/table prefixes use phase0..phase5, phase7, phase8; the findings ledger uses section-phase 1..8. Phase 6 is absent from artifact names.",
        "evidence": [
            "tables/ has no phase6_* files.",
            "findings_ledger.csv uses phase 1 for the §01 audit.",
        ],
        "impact": "Naive joins on phase number mis-associate findings and artifacts.",
        "action": "This dashboard uses canonical P0–P8 IDs with explicit source-prefix and ledger mappings. The source artifacts remain unchanged.",
        "sources": ["tables/ directory", "logs/findings_ledger.json"],
        "phase": "P8",
    },
    {
        "id": "ISS-14",
        "title": "Runtime and resource telemetry is largely absent",
        "severity": "Medium",
        "category": "Observability",
        "scope": "Project",
        "status": "Open",
        "confidence": "Confirmed",
        "summary": "Only the end-to-end run window, six embedding timings and one SHAP timing are recorded. There is no per-phase duration, CPU/GPU utilization, VRAM or inference-latency series.",
        "evidence": [
            "findings.md: run 16:30:06 → 18:01:59 (91.9 min).",
            "notebook cell 42: t-SNE 321/352/410 s; UMAP 51/36/20 s.",
            "notebook cell 63: SHAP 163.1 s.",
        ],
        "impact": "The performance page cannot attribute cost to phases or hardware.",
        "action": "Instrument phase timers, device telemetry and inference latency in the next run.",
        "sources": ["logs/findings.md", "notebook cells 42 and 63"],
        "phase": "P4",
    },
    {
        "id": "ISS-15",
        "title": "Seven interactive maps have no static preview",
        "severity": "Low",
        "category": "Artifact quality",
        "scope": "Project",
        "status": "Accepted",
        "confidence": "Confirmed",
        "summary": "Plotly 5.24.1 is incompatible with Kaleido 1.5.0, so static map exports were skipped. The HTML artifacts were retained and are included in this gallery.",
        "evidence": [
            "notebook cell 4: UserWarning about Plotly/Kaleido versions.",
            "‘kaleido PNG skipped’ appears for 7 map/3D artifacts.",
        ],
        "impact": "Gallery thumbnails cannot be generated for those artifacts; interactive HTML remains available.",
        "action": "Pin Plotly ≥6.1.1 or Kaleido 0.2.1 if static previews are required.",
        "sources": ["notebook cell 4 output", "figures/*.html"],
        "phase": "P4",
    },
    {
        "id": "ISS-16",
        "title": "Output bundle and full provenance digests are missing",
        "severity": "Medium",
        "category": "Reproducibility",
        "scope": "Workspace",
        "status": "Open",
        "confidence": "Confirmed",
        "summary": "The notebook reports a 17.9 MB zip bundle, but no bundle exists. Data fingerprints are 16 hex characters rather than full SHA-256 values.",
        "evidence": ["notebook cell 65 output", "logs/data_fingerprint.json · sha256_16"],
        "impact": "Artifact-level integrity and one-click restoration are weaker than claimed.",
        "action": "Include the bundle or regenerate it; store full digests and a manifest.",
        "sources": ["notebook cell 65", "logs/data_fingerprint.json"],
        "phase": "P8",
    },
]

CONTEXT = {
    "run_window_note": "Run start/end are recorded in findings.md; the timezone is not stated.",
    "raw_data_note": "The two source CSVs are referenced by size and hash but are not in the workspace.",
    "powerbi_note": "No PBIX/PBIP or Power BI Desktop installation was found. This is a functional Power BI-style simulation plus import-ready CSV/DAX assets, not a native report.",
    "ledger_note": "Evidence excerpts in the source ledger are capped at 400 characters; the dashboard links them back to notebook cells.",
}
