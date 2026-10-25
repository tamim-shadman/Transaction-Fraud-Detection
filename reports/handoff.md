# Handoff — Phase 1 record

> **Superseded by Phase 2.** This document records the Phase 1 delivery. The current state of the console is documented in `reports/phase2_handoff.md`: 19 routes instead of 12, a dark-first redesign, a reproducible Phase 2 evidence layer, and a 136-check Phase 2 validator. This file is kept as the Phase 1 acceptance record.

Prepared: **2026-10-20T17:57:53**  
Program: **Sparkov Card-Fraud Research Program**  
Run: `RUN-20261020-1630` · 5,513 s · seed 42

## 1. Executive summary

The program analyses **1,852,394 simulated card transactions** and **9,651 frauds** (0.5210%). The signal is real and concentrated: amount separation is large (KS D 0.724; Cliff's delta 0.669), fraud clusters in cards and in a small set of category/time combinations, and the final 27-feature model ranks well (test ROC-AUC 0.9677). The hard part is transfer. Train and test are almost perfectly separable (adversarial AUC ≈ 1.000), 8 of 27 features have at least moderate PSI, and the final test PR-AUC of **0.5575** is a cross-boundary OOD estimate. In-domain walk-forward PR-AUC is **0.9510 ± 0.0152**; the same fold models score **0.4726 ± 0.0761** on test, an **OOD gap of 0.4785**. Removing `card_prior_fraud` recovers test PR-AUC to **0.8315**, localising the failure in a causal-but-shifting history feature.

At a 1% review budget the model catches **65.45%** of test frauds and **68.70%** of fraud dollars; at 5%, **86.20%** and **93.42%**. The cost-minimising threshold is essentially zero (0.00001), catching 1,807 frauds with 20,322 false positives and $92,043.87 missed fraud dollars. The operating point is a policy choice, not a model fact.

## 2. What to open first

| Audience | Open | Why |
|---|---|---|
| Executive / reviewer | `app/` → Overview | One-screen synthesis, risk signals and boundaries |
| Fraud analytics lead | `app/` → Model, Economics | Transfer, PSI, ablation, capture@k and thresholds |
| Data scientist | `app/` → Statistics, Features | Effect sizes, CIs, SHAP, hazard, velocity |
| BI engineer | `powerbi/README.md`, `powerbi/pages/page_spec.md` | Import and layout instructions |
| Auditor | `reports/validation_report.md`, `reports/data_quality_report.md` | Independent checks and caveats |
| New maintainer | `README.md`, `docs/QUICKSTART.md`, `reports/implementation_report.md` | Build, data flow and decisions |

## 3. Run it

```powershell
cd app
npm.cmd install
npm.cmd run dev
# open http://127.0.0.1:4173
```

Production build: `npm.cmd run build`, then `npm.cmd run preview`.
Validation: `python tests\validate_metrics.py` (196 checks).
Browser matrix: `python tests\ui_smoke.py` (requires the dev server).

## 4. What is and is not native Power BI

**Is:** an import-ready star schema, 112 DAX measures, 17 relationships, a theme and a 12-page layout spec.

**Is not:** a PBIX/PBIP file, a published dataset, a refreshable gateway model or a screenshot-tested Power BI report. No Power BI authoring tools exist in this environment. Do not describe the React app as Power BI.

To build the native report: import `powerbi/data/*.csv`, create the relationships exactly as in `powerbi/relationships.md`, paste the measures from `powerbi/dax/measures.dax`, import the theme, then follow `powerbi/pages/page_spec.md`.

## 5. Key numbers

| Metric | Value | Caveat |
|---|---:|---|
| Transactions / frauds / rate | 1,852,394 / 9,651 / 0.5210% | Simulated data |
| Train / test fraud rate | 0.5789% / 0.3860% | Temporal split, not random |
| Median amount (fraud / genuine) | $390 / $47.24 | Strong right shift |
| Amount KS D / Cliff's delta | 0.724 / 0.669 [0.656, 0.680] | Univariate separation |
| Final test PR-AUC / ROC-AUC | 0.5575 / 0.9677 | OOD transfer estimate |
| Walk-forward PR-AUC | 0.9510 ± 0.0152 | In-domain |
| Same-fold test PR-AUC | 0.4726 ± 0.0761 | Cross-boundary |
| OOD gap | 0.4785 | Positive = transfer loss |
| Severe / moderate PSI | 7 / 1 of 27 | Month encodings are calendar artifacts |
| Capture@1% recall / USD | 65.45% / 68.70% | 5,557 reviews |
| Capture@5% recall / USD | 86.20% / 93.42% | 27,786 reviews |
| Cost-min recall / missed USD | 84.24% / $92,043.87 | $5 per false positive |
| High-risk combination | 22.08% fraud, 42.37× lift | Descriptive, n = 2,274 |

## 6. Caveats that must travel with the numbers

1. **Raw inputs absent.** The notebook cannot be rerun from this folder.
2. **Test is OOD.** Never quote test PR-AUC without the walk-forward and OOD-gap context.
3. **Ablation source delta is relative to raw-only.** Use recomputed deltas vs FULL.
4. **Boundary week straddles splits.** 76 full train weeks / 27 full test weeks; exclude the final zero-fraud edge week.
5. **Card “bimodal” is zero-inflation.** 23 cards never see fraud; 976 do; 91 are 100% fraud.
6. **Leakage-demo correlations are equal** (0.048 vs 0.048); the claimed inflation is not demonstrated.
7. **Merchant→category is near-deterministic**, max 2 categories, not a strict key.
8. **ZIP3 V = 0.148 over 532 levels** is not comparable to 14-level category V.
9. **Notebook says 45 tables; 46 exist.**
10. **Calibration is not test-set.** Temperature scaling is fit on the early-stopping split.
11. **Speed table excludes 1,043 rows / 91 frauds.**

## 7. Acceptance checklist

- [x] All 12 routes render at desktop and mobile with zero horizontal overflow.
- [x] Every headline KPI is recomputed from source tables (196/196 checks).
- [x] All 129 figures, 7 HTML artifacts, 46 tables and 66 notebook cells are reachable.
- [x] Filterable/sortable tables export CSV.
- [x] Search modal covers findings, tables, figures and pages.
- [x] Findings link to evidence and audit notes.
- [x] Power BI pack builds with 59 CSVs, 112 measures, 17 relationships.
- [x] Date bridge is documented as the only bidirectional relationship.
- [x] Native-PBIX limitation is stated in the app, README and reports.
- [ ] Obtain raw Kaggle CSVs and rerun the notebook end to end (blocked).
- [ ] Open the pack in Power BI Desktop and validate the page spec (blocked: no PBI runtime).

## 8. Recommended next steps

1. **Obtain the raw CSVs** and rerun the notebook to confirm the fingerprints and regenerate every artifact.
2. **Build the native PBIX** from the pack and compare the 12 pages against the React reference.
3. **Re-validate `card_prior_fraud`** on production card histories before any deployment; the simulator's 97.7% exposure is not a real prior.
4. **Add a real out-of-time monitoring set** for PSI and capture@k; the current test set is a single boundary.
5. **Decide the review-cost policy** explicitly. The cost-min threshold and the F1-max threshold imply different review capacity and loss.

## 9. Ownership and support

No owner or support contact is recorded in the source artifacts; add them before publishing. The source dataset is `kartik2112/fraud-detection` (Sparkov simulator). The notebook, tables, figures and logs are the canonical evidence; `app/public/data` and `powerbi/data` are generated copies.

## 10. Deliverable index

| Path | Contents |
|---|---|
| `app/` | React application (12 pages) |
| `powerbi/` | Import pack, DAX, theme, page spec, relationships |
| `reports/` | This suite + validation + data dictionary |
| `tables/` | 46 source CSVs |
| `figures/` | 129 PNG + 7 HTML source artifacts |
| `logs/` | Four provenance files, build log, UI log |
| `tests/` | 196-check validator + UI smoke test |
| `docs/` | Quick start and glossary |
| `README.md` | Project map |
