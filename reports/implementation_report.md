# Implementation report — Phase 1 record

> **Superseded by Phase 2.** This document records the Phase 1 build. The current architecture is described in `reports/phase2_feature_implementation.md` and `reports/phase2_research_and_design_decisions.md`. This file is kept as the Phase 1 build record.

Generated: **2026-10-20T17:57:53**  
Application version: **1.0.0**  
Power BI pack version: **2.0.0**

## 1. What was delivered

A source-backed analytical experience in three layers:

1. **A React/TypeScript application** that reconstructs the notebook's evidence as 12 routed, filterable pages with charts, tables, exports, search, drill-throughs, a figure lightbox and a notebook viewer.
2. **A Power BI import pack** — 59 CSVs in a star schema, 112 DAX measures, 17 relationships, a theme and a 12-page layout specification. It is **not** a PBIX/PBIP file and has not been opened in Power BI Desktop on this machine.
3. **An evidence and audit library** — 196 independent checks, 11 known caveats, 64 graded findings, 5 audit notes, 16 issues and this report suite.

## 2. Architecture

```text
outputs/
  fraud_eda_colab(1).ipynb      executed research notebook (canonical source)
  tables/*.csv                  46 generated analysis tables
  figures/*.png|*.html          129 figures + 7 interactive artifacts
  logs/                         fingerprint, environment, findings
  analytics/                    dataset build pipeline
  app/
    src/                        React 18 + TypeScript + Vite
    public/data/                manifest, analysis, notebook, 46 table JSONs
    public/artifacts/           mirrored figures, thumbs, HTML, notebook
  powerbi/                      CSV star schema, DAX, theme, specs
  reports/                      audit, catalog, dictionary, metrics, handoff
  tests/                        metric validator + Playwright smoke test
```

The app is fully static: no backend, no database, no runtime API. `analysis.json` (736 KB) and `notebook.json` (323 KB) are lazily loaded; the 46 table JSONs are fetched on demand by the table viewer. This keeps the initial page responsive without weakening traceability.

## 3. Application surface

| Page | Route | Purpose | Key interactions |
|---|---|---|---|
| Overview | `/` | One-screen synthesis | KPI cards, risk signals, provenance graph, boundary callouts |
| Data audit | `/data-audit` | Schema, missingness, contracts, split | Filterable schema table, contract status, missingness chart |
| Distributions | `/distributions` | Amount/time/category separation | Amount distribution, quantiles, category forest, figure gallery |
| Interactions | `/interactions` | Cards, geography, money | Card histogram, state/city/ZIP3 tables, distance caveat |
| Temporal | `/temporal` | Weekly trend and boundary | Weekly line, split means, STL/change-point figures, boundary table |
| Advanced viz | `/advanced` | Embeddings and anomaly detection | Embedding AUC bars, anomaly table, cluster rates |
| Statistics | `/statistics` | Effect sizes and inference | Forest plots, bootstrap CIs, logit table, post-hoc pairs |
| Feature lab | `/features` | Leak-aware features | SHAP, hazard, high-risk combos, speed table, encoding comparison |
| Model | `/model` | Ranking, drift, transfer | Ablation, walk-forward, PSI, calibration, segment errors |
| Economics | `/economics` | Review-budget trade-offs | Capture@k curve, threshold table, cost calculator |
| Findings | `/findings` | Evidence ledger | Search, grade/RQ/phase filters, audit drawer, evidence links |
| Artifacts | `/artifacts` | Provenance browser | Figure lightbox, HTML artifacts, 46 tables, notebook viewer, logs |

Every page supports URL routing, keyboard search (`Ctrl/⌘+K`), responsive layout and table CSV export. Tables expose sorting and text filtering; charts expose hover tooltips and legends. The economics calculator is client-side arithmetic over the source capture/cost rows, not a model re-fit.

## 4. Data pipeline

1. The notebook writes 46 CSV tables, 129 PNGs, 7 HTML artifacts and four provenance logs. Two verification logs (`build.log`, `ui_smoke.log`) are captured later.
2. `analytics/build_dataset.py` reads those artifacts and writes:
   - `app/public/data/manifest.json` (metadata, KPIs, phases, RQs, findings, figures, tables, issues, audit notes);
   - `app/public/data/analysis.json` (chart-ready series and model/economics tables);
   - `app/public/data/notebook.json` (normalized cells for the viewer);
   - 46 per-table JSON files;
   - 129 WebP thumbnails and mirrored artifacts.
3. `powerbi/build_powerbi_pack.py` reads the same manifest and tables and writes the 59-CSV star schema, `manifest.json`, and validates measure counts.
4. `reports/build_reports.py` reads all of the above and writes this report suite.
5. `tests/validate_metrics.py` independently recomputes 196 checks from source tables/notebook/logs and compares them with the app data layer.

## 5. Power BI pack

- **Tables:** 70 (14 dimensions, 56 facts).
- **Measures:** 137 in `powerbi/dax/measures.dax`.
- **Relationships:** 33; the date bridge is the only bidirectional relationship.
- **Date table:** 734 rows, 2019-01-01 → 2021-01-03.
- **Theme:** `powerbi/theme/fraud_evidence_theme.json` mirrors the app palette and typography.
- **Page spec:** `powerbi/pages/page_spec.md` defines 12 pages at 1440 × 900, with native visuals where facts exist and explicitly labelled image visuals where only a rendered figure exists.
- **Not delivered:** a native PBIX/PBIP. No Power BI authoring runtime is available in this environment, so the pack is import-ready rather than click-to-open.

## 6. Verification record

| Gate | Result | Evidence |
|---|---|---|
| TypeScript compile | PASS (`tsc --noEmit`) | `app/package.json` build script |
| Vite production build | PASS | 425 emitted files, 30.77 MB |
| Build modules | 2,516 | `logs/build.log` |
| Build time | 1.30 s | `logs/build.log` |
| Metric validation | 196/196 PASS | `tests/validation_results.json` |
| UI route/viewport checks | 39 measured | `tests/ui_check/results.json` |
| Horizontal overflow | 0 px | same |
| Canvas/container mismatch | 0 | same |
| Console/page errors | 0 | same |
| Power BI pack build | 70 CSVs, 137 measures | `powerbi/manifest.json` |

The browser matrix covers 5 viewports (desktop, laptop, mobile, mobile-landscape, tablet) and all 12 routes at desktop and mobile, with representative routes at laptop, tablet and mobile-landscape. No page had horizontal overflow or a chart canvas/container mismatch.

## 7. Design decisions

- **Dark navy rail, warm off-white canvas, indigo/violet/cyan accents.** The visual language reads as an analytical publication rather than a generic admin dashboard.
- **Numbers before decoration.** Every chart has a source line; every table has an export; every claim links to a figure or table.
- **Caveats are first-class.** Audit notes and known caveats are surfaced in the UI, not buried in a README.
- **Simulation is labelled.** The app describes itself as a Power BI-style reconstruction, not a native PBIX.
- **No invented metrics.** Where only a rendered figure exists, the page shows the figure and does not fabricate a value.

## 8. Limitations

- Raw CSVs absent: no end-to-end rerun, no independent re-fingerprint, no retraining.
- No Power BI Desktop: the pack cannot be opened, refreshed or screenshot-tested here.
- Placeholder imagery: the app uses the notebook's rendered PNGs, not re-rendered chart primitives.
- Calibration and SHAP are split-specific; see the 11 known caveats.
- The UI smoke test is structural (headings, panel counts, overflow, canvas size, console errors); it is not a pixel-diff or accessibility audit.

## 9. Reproduction

```powershell
cd app
npm.cmd install
npm.cmd run build
npm.cmd run dev
# new terminal, from project root:
python analytics\build_dataset.py   # only if the app data layer changed
python powerbi\build_powerbi_pack.py
python tests\validate_metrics.py
python tests\ui_smoke.py
python reports\build_reports.py
```

See `docs/QUICKSTART.md` for the short version and `README.md` for the project map.
