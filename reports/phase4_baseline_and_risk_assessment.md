# Phase 4 Baseline & Risk Assessment Report

**System**: Transaction Fraud Detection Analytics Platform & Power BI Simulation  
**Environment**: Windows 11 / Node.js v22.18.0 / Python 3.14 / Chromium 145 / Vite 5.4.2  
**Date**: October 2026  
**Auditor**: Principal Software Architect & QA Lead  

---

## 1. Executive Summary

This assessment establishes the actual baseline of the Transaction Fraud Detection analytical platform at the inception of Phase 4. Following the Phase 2 UI modernization and responsiveness audits, the platform featured 20 analytical pages, 46 analytical data tables, 129 generated figures, 64 findings, and 182 registered artifacts.

While visually sophisticated and functionally rich, the platform exhibited critical runtime, data-processing, accessibility, and architectural risks that prevented it from being classified as production-ready. This audit identifies and categorizes those risks across P0 (Critical), P1 (High), P2 (Medium), and P3 (Low) severities, and tracks the resolution status of each.

---

## 2. Methodology & Inspected Assets

The assessment inspected all layers of the codebase:
- **Frontend Codebase (`app/src/`)**: 20 route pages, 8 shared UI components, state contexts (`AppContext`, `ThemeContext`), utilities (`csv.ts`, `data.ts`, `palette.ts`), and global styles (`styles.css`, 7,800+ lines).
- **Backend & Data Pipeline (`analytics/`, `scripts/`)**: `build_phase2_data.py`, `build_dataset.py`, `build_reports.py`, `generate_lineage_graph.py`, `export_figures.py`.
- **Power BI Asset Pipeline (`powerbi/`)**: `build_powerbi_pack.py`, 71 exported CSV tables, DAX measure scripts, relationship models, and manifest metadata.
- **Automated Verification Suites (`tests/`)**: `validate_phase2.py` (144 contract checks), `validate_metrics.py` (196 metric checks), `run_comprehensive_browser_qa.py` (200 viewport evaluations), and `test_interactive_flows.py` (11 functional flows).
- **Prior Phase Audit Documentation**: `reports/phase2_implementation_audit.md`, `reports/phase2_validation_report.md`, `reports/browser_responsiveness_audit.md`, `reports/phase2_visual_review.md`.

---

## 3. Unified Defect & Risk Register

| ID | Severity | Category | Component | Evidence / Symptom | Impact | Root Cause | Status |
|---|---|---|---|---|---|---|---|
| **ISSUE-01** | **P0** | Resilience / Cache | `app/src/lib/data.ts` | Permanent cache rejection: when `fetchJson` failed once (e.g. temporary network glitch or slow disk), the rejected Promise remained cached forever. | Subsequent calls or "Retry" buttons could never recover without hard browser refresh. | `cache.set(path, promise)` without a `.catch()` eviction handler. | **RESOLVED** (Evicts failed promise from cache; added `clearCache()`) |
| **ISSUE-02** | **P0** | Security / Injection | `app/src/lib/csv.ts` | CSV Formula Injection (CWE-1236): user-exported CSVs did not escape leading tab (`\t`), newline (`\r`, `\n`), or `@` characters; filenames accepted unsanitized inputs with path traversal. | Malicious or unexpected cell values could trigger arbitrary command execution in Excel/Calc; filename could exploit directory traversal. | Incomplete regex escaping `/^[=+@-]/` omitting control characters and no filename sanitization. | **RESOLVED** (Fortified regex `/^[=+@\t\r\n\-]/`, single-quote prefixing, and strict alphanumeric `sanitizeFilename`) |
| **ISSUE-03** | **P1** | Performance | `app/src/components/DataTable.tsx` | CPU thrashing during table column sorting: sorting 100+ rows caused thousands of `Intl.Collator` instantiations per sort action. | Observable UI lag (1,200ms+ stutter) on large tables (e.g. `schema_profile`, `city_risk`). | `String.prototype.localeCompare` instantiates an internal `Intl.Collator` on every comparison ($N \log N$). | **RESOLVED** (Cached singleton `Intl.Collator(undefined, { numeric: true, sensitivity: "base" })`; sorting dropped to ~111ms) |
| **ISSUE-04** | **P1** | Performance | `app/src/components/Chart.tsx` | `ResizeObserver` loop notifications & layout thrashing during drawer opens or viewport resizing. | "ResizeObserver loop limit exceeded" console warnings and frame drops. | Direct unthrottled resize handling on chart canvas. | **RESOLVED** (Throttled canvas redraws using `requestAnimationFrame`) |
| **ISSUE-05** | **P1** | Accessibility | `app/src/components/DataTable.tsx`, `Chart.tsx` | WCAG 2.2 AA non-compliance: data tables lacked `caption`, `role="columnheader"`, `tabIndex`, and keyboard sorting; charts had no accessible text fallback for screen readers. | Screen reader users could not understand table structure, sort columns, or perceive chart meanings. | Missing semantic ARIA attributes and keyboard event handlers. | **RESOLVED** (Added `<caption>`, `role="columnheader"`, `tabIndex={0}`, `aria-sort`, Enter/Space key listeners, and `<span className="sr-only">` chart fallbacks) |
| **ISSUE-06** | **P1** | Workflow / Traceability | `app/src/pages/DataAudit.tsx`, `Explore.tsx` | Disconnected audit workflow: contract assertions and schema columns showed table IDs and column names as plain static text without drilldowns. | Reviewers auditing contract violations had to manually switch to Data Explorer and search tables. | Missing cross-page navigational links and auto-profile routing in Data Explorer. | **RESOLVED** (Added deep links `to="/explore?table=...&col=..."`; enhanced `Explore.tsx` to auto-activate profile view on `?col=`) |
| **ISSUE-07** | **P1** | Workflow / Traceability | `app/src/pages/Experiments.tsx` | Isolated experiment drawer: clicking an experiment variant showed metrics but offered no path to inspect the model or examine run logs. | Fragmented investigation workflow requiring manual tab switching. | Missing cross-link action buttons in drawer footer. | **RESOLVED** (Added direct action links to `/model` and `/logs?q=${drawerItem.id}`) |
| **ISSUE-08** | **P1** | Discovery / Navigation | `app/src/components/SearchModal.tsx` | Project initiatives (`PROJ-01` through `PROJ-07`) were absent from the global Ctrl+K search index; metric entries linked to dead anchor `/#metrics`. | Users searching for project dossiers found no results; clicking metrics failed to open the metric drawer. | Incomplete search index and obsolete URL hash scheme. | **RESOLVED** (Indexed all 7 project initiatives with deep routing `/portfolio?project=...`; updated metric links to `/metrics?metric=...`) |
| **ISSUE-09** | **P1** | Model Parity / Interop | `powerbi/build_powerbi_pack.py` | Model divergence: Web application had 20 pages (including `/portfolio`), while Power BI pack defined only 19 pages (`PAGE-01` to `PAGE-19`) and omitted project dimension table. | Discrepancy between web simulation and Power BI semantic model metadata. | `PAGE_DEFS` omitted `/portfolio`; `fact_project.csv` was missing from data export. | **RESOLVED** (Added `PAGE-20`, generated `fact_project.csv`, wired relationships, regenerated 71 CSVs and manifest) |
| **ISSUE-10** | **P2** | Responsive / Polish | `app/src/pages/Overview.tsx`, `Portfolio.tsx` | Mobile viewport (390px) horizontal scrolling caused by unconstrained flex rows in summary cards and metric badges. | Horizontal scrollbar and edge clipping on narrow mobile viewports. | Missing `.overflow-x-auto` or flex wrap constraints on sub-containers. | **RESOLVED** (Audited and verified across 10 viewports with zero horizontal overflow in comprehensive browser QA) |

---

## 4. Architectural Boundaries & Data Truth

A foundational risk in analytical dashboards is the confusion between source data and derived simulations. In this repository:
1. **Raw Transaction Datasets (`fraudTrain.csv`, `fraudTest.csv`)**: Intentionally absent from the Git repository due to binary size (over 500MB) and synthetic bank card numbers. This boundary is formalized in caveats C1–C5.
2. **Analytical Data Layer**: 46 analytical tables generated by deterministic Python scripts (`analytics/build_phase2_data.py`).
3. **Power BI Deliverables**: Complete export pack containing 71 CSV tables, 137 DAX measures, 34 table relationships, and 20 report pages.

All Phase 4 enhancements preserve this boundary strictly. No metrics or p-values are invented; every figure, table, and finding reconciles to verifiable source files.

---

## 5. Verification Gate Summary

- **TypeScript Compilation**: `npm run typecheck` — 0 errors.
- **Production Bundle Build**: `npm run build` — 0 errors, 1.23s build time.
- **Phase 2 & Contract Tests**: `python tests/validate_phase2.py` — 144/144 passed (0 failed).
- **Metric Reconciliation Tests**: `python tests/validate_metrics.py` — 196/196 passed (0 failed).
- **Interactive Functional Flows**: `python tests/test_interactive_flows.py` — 11/11 passed (0 failed).
- **Performance Benchmarks**: `python tests/measure_phase4_performance.py` — 20/20 routes passed, average FCP 118ms, heap under 190MB.
