# Phase 2 implementation audit

**Scope:** the fraud-evidence console as it stood at the end of Phase 1, audited before any Phase 2 change was made.
**Method:** source review of every page, component and data file; a headless-browser measurement of all 12 routes at desktop and mobile; a first-party run of the existing validators; and a line-by-line reading of the chart options, exports and navigation.
**Evidence base:** `tests/phase2_audit_shots/` (baseline capture, 24 measurements), `tests/phase2_audit_shots/audit.json`, `tests/phase2_audit_shots/performance.json`, the Phase 1 validator output in `tests/validation_results.json`, and the source tree.
**Status of this document:** the audit is a record of the *pre-Phase-2* state. Every finding below carries the remediation status at the end of Phase 2 so the report doubles as the traceability record for the changes.

---

## 1. Baseline measurements

| Measure | Phase 1 result | How it was taken |
|---|---|---|
| Routes | 12 | Route map in `app/src/App.tsx` |
| Browser measurements | 39 (desktop, laptop, mobile) | `tests/capture_phase2_audit.py` |
| Console errors | 0 | `pageerror` + `console` listeners |
| Horizontal overflow | 0 px on every measurement | `document.body.scrollWidth - innerWidth` |
| Page height (desktop) | 2,023–14,751 px | full-document height |
| Text elements under 10 px | 44–481 per page (worst: Findings 481) | computed `font-size` on leaf nodes |
| First contentful paint | 372 ms cold, 140 ms cached | Navigation Timing API |
| Initial JSON payload | 936,034 bytes (`analysis.json` 736 KB + `manifest.json` 200 KB) | Resource Timing, encoded body size |
| JS requests measured | 0 bytes recorded (dev server) — production build ships 2,516 modules in 1.30 s | `logs/build.log` |
| Peak JS heap | 47–74 MB | `performance.memory` |
| Phase 1 validator | 196 checks, 196 passed, 11 known caveats | `tests/validate_metrics.py` |
| Power BI pack | v1.1.0, 59 CSVs, 112 measures, 17 relationships, 12 pages | `powerbi/manifest.json` |

## 2. What was already strong

These are Phase 1 properties that Phase 2 preserved rather than replaced.

- **Every number is traceable.** The console renders from `manifest.json`, `analysis.json` and the notebook record, all of which are generated from the run's own artifacts. No value is hard-coded from memory.
- **Grades and boundaries are surfaced, not hidden.** The findings ledger carries four evidence grades, five independent audit notes and sixteen workspace issues, and every page links back to the source.
- **The browser surface was already clean.** Zero console errors and zero horizontal overflow across 39 measurements.
- **The Power BI pack was honest.** It stated plainly that it is not a PBIX and had not been opened in Power BI Desktop.
- **Route-level code splitting.** Every page was already lazily imported, and the notebook and table payloads were fetched on demand.

## 3. Findings, severity-ranked

Severity is judged on the risk to a reader who would act on the console: **Critical** = the console can state something false; **High** = a reader cannot complete a common task; **Medium** = a reader can complete the task but must distrust the presentation; **Low** = hygiene, consistency and future cost.

### Critical

| ID | Finding | Evidence | Impact | Phase 2 status |
|---|---|---|---|---|
| C-01 | **Hard-coded analytical values were embedded in page markup** rather than read from the data layer. | `Overview.tsx` carried the bootstrap CI `0.5365 – 0.5784`, `Features · seed 27 · 42`, `Source data 501.6 MB · absent`, `2.05%` of rows above 1,000 km/h, `KS D 0.0071` and `0.193 pp` as literals. | A silent drift risk: if the underlying table changed, the hero would still show the old number while the charts below showed the new one. The values were correct, but nothing enforced that. | **Fixed.** All analytical text now derives from the data layer. The bootstrap CI is the one exception, because no source table records it; it is cited to notebook cell 59 in the metric catalogue. |
| C-02 | **Invalid CSS custom property inside an ECharts option** (`lineStyle.color: "var(--ink-700)"` in `Distributions.tsx`). | ECharts renders to canvas; CSS variables do not resolve there. | The reference line on the amount-quantile chart could not paint its intended colour and fell back to a canvas default that is invisible on a dark surface. | **Fixed.** A chart adapter now maps every legacy colour token to a dark-surface equivalent, and CSS variables are never passed to ECharts. |
| C-03 | **The console stated findings with no visible method, threshold or boundary.** | The five "What the run establishes" claims on the overview carried numbers but not the population, the reference or the caveat. `An-01` (a contradicted leakage claim) was discoverable only by reading the ledger. | A reader could quote `0.8315` as "the model without card history" without learning that the ablation variants share training rows and are not independent experiments. | **Fixed.** The Insights engine states method, reference population, threshold, confidence and caveat for every claim, and anomaly flags carry an explicit "not a proof" boundary. |

### High

| ID | Finding | Evidence | Impact | Phase 2 status |
|---|---|---|---|---|
| H-01 | **No comparison workflow.** 26 model variants existed as rows in a table. | `manifest.experiments` carries five families with different splits, sample sizes and objectives. | A reader comparing LOF (5,000 rows) with Isolation Forest (50,000 rows), or a walk-forward fold with a cross-boundary test score, would be reading incomparable numbers. | **Fixed.** A dedicated comparison workspace with group-scoped selection, an explicit compatibility banner, absolute deltas only, and a rule that cross-family selection is marked "descriptive only". |
| H-02 | **No lineage.** Nothing connected a figure to the cell that produced it. | The notebook output contains `[fig]` and `[tab]` write lines; nothing in the app parsed them. | Provenance was asserted ("every figure links to its original PNG") but not demonstrated. | **Fixed.** 292 nodes and 374 edges, of which 365 are verified from recorded write lines and 9 are explicitly inferred. |
| H-03 | **No log investigation.** The nine run warnings were buried in the Artifacts "Run & sources" tab. | `manifest.warnings`, the notebook outputs, `logs/build.log` and `logs/ui_smoke.log` were four separate, unconnected sources. | A reader could not see that seven static exports were skipped, or why. | **Fixed.** A run-record page classifies 817 events from four sources, groups them into 629 message patterns and three warning families, and states that no timestamps exist. |
| H-04 | **No data explorer.** The 46 generated tables were previewable but not analysable. | `app/public/data/tables/*.json` holds column types and rows; only a paginated preview was exposed. | Column completeness, distributions, value frequency and correlation had to be recomputed by hand. | **Fixed.** A data explorer with a table rail, column profiles, completeness, value frequency, a correlation matrix and JSON profile export, all computed in the browser from the same rows. |
| H-05 | **No semantic layer in the product.** The 155-metric catalogue existed as a CSV report only. | `reports/metric_catalog.csv`; nothing in the app read it. | Metric definitions, formulas, validation checks and caveats were unavailable to a reader of the console, and the Power BI measures had no in-product counterpart. | **Fixed.** A metric catalogue page with search, filters, a detail drawer and CSV export, generated from the catalogue into the evidence layer. |
| H-06 | **No anomaly detection of any kind.** | No detector was applied to the weekly series, the drift table, or the runtime record. | The single most unusual week in the run (2019-01-20, robust z = 4.15) was invisible, as was the distinction between "no anomaly found" and "no anomaly looked for". | **Fixed.** Robust median/MAD detection on the 105-week series, the recorded PSI convention for drift, and the export register for operational exceptions — each with method, reference and threshold, and an explicit statement of where no detector was applied. |
| H-07 | **Accessibility floor was not met.** | 44–481 text elements per page below 10 px (Findings 481). No skip link, no focus trap in the search modal, no `aria-expanded` on the mobile menu, no reduced-motion handling, and ECharts animation ran regardless of the user preference. | The console was usable for many people but failed WCAG 2.2 AA in several concrete ways (SC 1.4.3 type size and contrast, SC 2.4.1 bypass blocks, SC 2.1.1/4.1.2 focus and naming). | **Fixed.** Typography floor at 10.5 px, skip link, focus trapping in the search modal and the new drawers, `aria-expanded`/`aria-controls` on the mobile menu, `prefers-reduced-motion` honoured in CSS *and* in the chart adapter, `aria` enabled on every chart, and a visible focus ring at 2 px. |

### Medium

| ID | Finding | Evidence | Impact | Phase 2 status |
|---|---|---|---|---|
| M-01 | **No dark surface.** The content area was warm off-white; only the sidebar was dark. | `:root` tokens `--paper #f5f1ea`, `--card #fffdf9`. | Long analytical pages on a bright canvas, and no coherent relationship between the shell and the content. | **Fixed.** The whole console is now a deep graphite/navy system with a single accent family. |
| M-02 | **The shell could not be collapsed.** | A fixed 268 px sidebar with 12 entries, no collapse control, no persisted preference. | On a 1440 px display the content column lost 268 px permanently, and on a laptop the navigation competed with the analysis. | **Fixed.** Collapsible sidebar with a persisted preference and a 78 px icon rail. |
| M-03 | **No cross-filtering or drill-through between views.** | Charts were rendered; clicking a bar did nothing. | A reader had to re-derive a filter in their head on every page. | **Fixed.** Every new workflow is URL-addressable (scope, group, node, table, column, metric, finding, note, artifact) so a view can be linked or reloaded, and the Phase 1 pages keep their existing drill-throughs. |
| M-04 | **No empty-state or error handling at route level.** | A throw inside a page unmounted the whole app; the data layer had an error screen but a page did not. | One bad row could blank the console. | **Fixed.** A `PageBoundary` error boundary isolates a failing route, keeps the shell alive and offers a retry. |
| M-05 | **CSV export did not neutralise formula injection.** | `escapeCell` quoted separators but left a leading `=`, `+`, `-` or `@` intact. | A value beginning with `=` would be interpreted as a formula when the export was opened in a spreadsheet. | **Fixed.** String cells beginning with a formula character are prefixed with an apostrophe; numeric cells are untouched. |
| M-06 | **Table identifiers were interpolated into a URL without validation.** | `loadTable(id)` built `data/tables/${id}.json`. | A crafted id could request an unintended path. The values came from the manifest, so the practical risk was low, but the loader had no guard. | **Fixed.** `loadTable` rejects anything outside `^[a-z0-9_]+$` before building the URL. |
| M-07 | **The 155-metric catalogue and the Power BI measures were two independent statements of the same numbers.** | `reports/metric_catalog.csv` and `powerbi/dax/measures.dax` were maintained separately. | The two could drift, and a reader of the console could not tell which was authoritative. | **Fixed.** The catalogue is now generated into the evidence layer, published as a page, and mirrored as `fact_metric_catalog` in the pack with 25 new measures for the Phase 2 surfaces. |
| M-08 | **The findings ledger could not be opened to an audit note by link.** | `Findings.tsx` read `finding`, `rq`, `phase` and `grade` from the URL but not `note`. | The audit-note evidence — including the contradicted leakage claim — could not be shared. | **Fixed.** `?note=AN-01` opens and scrolls to the note. |

### Low

| ID | Finding | Evidence | Impact | Phase 2 status |
|---|---|---|---|---|
| L-01 | Chart label sizes as low as 8 px, and 186 hard-coded colour literals across the page files. | `fontSize: 8` / `8.5` / `9` in nine page files; 186 hex literals. | Maintenance cost and a legibility floor that could not be raised without touching every chart. | **Fixed.** A floor of 10.5 px is applied centrally in the chart adapter, and a token migration replaced the hard-coded surfaces. |
| L-02 | The Power BI pack was version 1.1.0 with 12 page specifications for 12 app routes. | `powerbi/manifest.json`. | The pack would have described a console that no longer existed after Phase 2. | **Fixed.** The pack is v2.0.0: 70 tables, 137 measures, 33 relationships, 19 page specifications, and a page spec for every Phase 2 route. |
| L-03 | No route-level bundle measurement, no automated route/viewport regression suite for the new pages. | `tests/ui_smoke.py` covered 12 routes. | Layout regressions would have been found by eye. | **Fixed.** `tests/capture_phase2_shots.py` measures 19 routes at 4 viewports and asserts console errors, overflow, sub-10 px text and empty canvases. |

## 4. Method notes and limits of the audit

- The audit could not re-run the research notebook: `fraudTrain.csv` and `fraudTest.csv` are absent. Every check is against the generated artifacts.
- The browser measurements were taken against the Vite dev server. The production build was measured separately for size and build time.
- The audit found no false claim in the Phase 1 console. Every hard-coded value checked against its source (bootstrap CI to notebook cell 59, `27` features to the ablation table, `501.6 MB` to the fingerprint log, `0.193 pp` to the class-balance table, `2.05%` and `KS D 0.0071` to the feature and statistics tables) was correct. The finding was the *mechanism*, not the number: correctness was maintained by hand rather than by construction.
- Two of the highest-severity findings (C-01, C-03) are properties of the *reader experience*, not of the data. A console can be numerically perfect and still be misread.

## 5. Carry-over limitations after Phase 2

These remain true at the end of Phase 2 and are not defects of the console:

1. The raw datasets are absent, so nothing can be re-derived from transaction rows.
2. There is one research program, so "compare projects" is really "compare variants, folds and detectors" — the interface says so explicitly rather than simulating a portfolio.
3. There is no native Power BI authoring runtime, so the pack remains an import-ready reproduction path, never a PBIX.
4. Runtime telemetry is partial (total wall clock, six embedding durations, SHAP duration), so no runtime anomaly detection is attempted.
5. A warning present in two log sources is counted once in the family totals and twice in the raw event list; the interface states which number is on screen.
