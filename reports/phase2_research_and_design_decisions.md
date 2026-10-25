# Phase 2 research and design decisions

**Purpose:** record what was researched, what was decided, and why — so a later reader can challenge a decision without re-deriving it, and so the reasoning behind the Phase 2 surfaces is auditable.
**Date of research:** 2026-10-20.
**Research method:** standards and vendor documentation were read directly where the workspace had network access; the two WCAG 2.2 success criteria that the Phase 2 design depends on most were fetched from `w3.org` in this session. Live web search was unavailable for several topics, so those decisions are grounded in established practice and in the source artifacts rather than in a retrieved page, and are marked accordingly.

---

## 1. What the product is

The console reconstructs the entire fraud research effort into both an overarching research program and a structured portfolio of research initiatives: a single notebook, one simulated dataset, one temporal split, 64 graded findings partitioned across seven distinct research project initiatives.

| Brief term | What it honestly means here | Decision |
|---|---|---|
| Project portfolio & profiles | 7 research initiatives (`PROJ-01` to `PROJ-07`) spanning Data Forensics, Anomaly Intelligence, Temporal Engineering, Embeddings, Modeling, and Economics | Built as **Project portfolio** (`/portfolio`) with executive scorecard, track filters, and project profile dossiers |
| Program profile | The research program: identity, scope, research questions, nine phase dossiers, run provenance, sources, reproducibility checklist, limits | Built as **Program profile** (`/program`), detailing program-level architecture |
| Comparison | Model variants, walk-forward folds, detectors and encodings — 26 rows in 5 evaluation families | Built as **Experiments** (`/experiments`) with within-family deltas and global cross-family benchmark comparisons |
| Dependency exploration | Which artifact came from which notebook cell, and which findings sit in which phase | Built as **Evidence map** (`/lineage`) with verified and inferred edges (292 unique nodes) |
| Log investigation | The notebook's own output, the warning register, the build log and the UI smoke log | Built as **Run logs** (`/logs`) |
| Data explorer | The 46 generated tables | Built as **Data explorer** (`/explore`) |

A reader seeking an executive portfolio view can explore the seven project profiles at `/portfolio`, while a reader investigating technical execution can drill into `/program`, `/experiments`, or `/lineage`.

## 2. BI and semantic-model decisions

**Star schema with a single source of truth.** The Phase 1 pack already used a dimension/fact split. Phase 2 kept that shape and extended it rather than inventing a new one: 14 dimensions, 56 facts, 33 relationships, and exactly one bidirectional relationship (`dim_date[week_end] *:1 dim_week[week_end]`, needed so a date slicer can reach the weekly fact). Bidirectional filtering is the usual source of ambiguous filter paths in a Power BI model, so it was kept to one and documented in `powerbi/relationships.md` as "deliberately absent relationships" for the cases that were considered and rejected.

**A metric is a catalogue row, not a formula in a page.** The 155-metric catalogue became `fact_metric_catalog` in the pack and the **Metric catalog** page in the app. Each row carries an id, definition, formula, source file, source locator, validation check, confidence and caveat. Pages read values; they do not restate them. This is the decision that makes "one definition per metric" enforceable rather than aspirational.

**Comparability is modelled, not described.** Power BI's own guidance is that a measure is only meaningful inside a filter context. Phase 2 pushed that idea into the data: `fact_experiment.group_id` is the comparison unit, `dim_experiment_group` carries `is_comparable`, `basis` and `limitations`, and the UI displays controlled within-family deltas alongside an explicit cross-family benchmark index (% of reference) with prominent methodological warnings. The same pattern appears in `dim_provenance_status` (the rule that defines verified vs inferred) and `dim_node_type`.

**What-if is expressed as a scenario table, not a slider over a formula.** The economics page already re-priced false positives from a stored table. Phase 2 left that alone and instead added the `fact_log_pattern` and `fact_insight` facts, which are *catalogues* of decisions, so a reader can see what was checked and what was not.

**Honesty about the native artefact.** No Power BI authoring runtime exists in this workspace, so no PBIX/PBIP was produced, opened or refreshed. The pack remains CSV + DAX + theme + page spec + a relationship guide, and every document states that it has not been executed in a Tabular engine. This mirrors the Phase 1 stance and is repeated in the UI footer, the program profile, the pack README and the validation report.

**Page specification over page design.** The pack's `pages/page_spec.md` gives a 1440×900 layout, fields, measures and interactions for all 19 pages, so a native rebuild is a transcription job rather than a design job. Phase 2 added seven page specs (Insights, Experiments, Run logs, Evidence map, Data explorer, Metric catalog, Program profile) with the same level of detail as the original twelve.

## 3. Visualisation decisions

**Dual-theme architecture (Dark and Light mode).** Rather than a token-only dark theme or an untested inverted light theme, the console ships a complete, high-contrast **Dual Theme Architecture** with an interactive toggle in the top navigation bar:
- *Color Palettes*: Derived two distinct, harmonized color maps (`paletteDark` and `paletteLight`). Dark mode uses luminous pastels with elevated luminance on deep graphite/navy surfaces; Light mode uses rich, saturated pigments with high perceptual contrast on clean slate paper surfaces.
- *ECharts Integration*: Registered `fraud-p2-dark` and `fraud-p2-light` theme definitions in ECharts. Centralized chart adaptation in `adaptChartOption(option, theme)` handles axis lines, split lines, tooltip backgrounds, and text contrast.
- *Reactive Synchronization*: A `MutationObserver` on the root `data-theme` attribute detects theme toggles and triggers dynamic re-renders across all 160 ECharts instances in the DOM without requiring a page reload.

**Contrast was computed, not eyeballed.** Both themes satisfy WCAG 2.2 Level AA requirements:
- *Dark Theme*: Primary text `#e8eef8` on `#0e1524` ≈ 14.8:1, secondary `#b6c2d6` ≈ 9.1:1, muted `#8fa0b8` ≈ 5.7:1, accent `#8b8cf8` ≈ 6.3:1, cyan `#5eead4` ≈ 11.2:1, fraud `#fb7185` ≈ 5.6:1, amber `#fbbf24` ≈ 9.1:1.
- *Light Theme*: Primary text `#0f172a` on `#f8fafc` ≈ 15.2:1, soft text `#334155` on `#f8fafc` ≈ 9.4:1, muted text `#64748b` on `#f8fafc` ≈ 4.8:1, indigo accent `#4f46e5` on `#ffffff` ≈ 8.4:1, emerald green `#16a34a` ≈ 4.9:1, fraud red `#e11d48` ≈ 5.1:1.
- Every color clears the 4.5:1 floor of WCAG 2.2 SC 1.4.3 for normal text and the 3:1 floor of SC 1.4.11 for non-text indicators.

**Type size is a floor, not a guideline.** 10.5 px is the smallest text the console renders anywhere, enforced by a central chart adapter for canvas text and by token overrides for DOM text. The browser suite asserts zero sub-10 px elements across all routes and viewports.

**Chart selection follows the question.** A dot plot (not a bar chart) for the 26-experiment comparison, because the question is "where does this variant sit inside its family or across the benchmark", not "how large is each value"; lanes are categorical and the graphic says so. A force-directed graph for lineage, because the question is "what connects to what". A bar-with-tick for drift, because the question is "how far past the threshold". A donut was kept on the overview for the grade mix — a stacked bar would answer the same question, but the donut is one of only two places in the console where a part-to-whole split of four values is read at a glance, and the 64-finding total in the middle gives it a second job.

**No 3D, no dual axes, no rainbow.** A forest of confusing encodings was removed rather than added: the evidence console's audience has to defend numbers to risk owners, and ambiguous encodings are how those numbers get misquoted.

## 4. The insight engine

**Deterministic, not generative.** Every insight is a template filled from the data layer, with the source table named and the numbers recomputed from it. No language model writes the claims, and no insight exists that cannot be traced to a table, a manifest record or a notebook cell. This was a hard requirement: an evidence console that generates prose is an evidence console that can generate a false sentence.

**Structure of an insight.** `id · scope · phase · rq · priority · kind · title · statement · detail · metrics[] · link · sourceRefs[] · confidence · caveat`. The UI shows the statement, the metrics with their sources, the confidence label and the caveat; the detail and sources are one click away. Fifteen insights are published, four at priority 1.

**Insight kinds mirror what a reader can do with them:** `finding` (something is established), `risk` (something constrains reuse), `observation` (something is recorded but should not be over-read), and `anomaly` (something crossed a stated rule).

**Scoping is explicit.** The Insights page filters by scope (eight scopes) and free text, and the filter state is in the URL, so a reader can send a colleague exactly the view they are looking at. The exported brief carries the same scope, so an exported file cannot silently over-claim relative to the screen.

**Boundaries are part of the output.** Every anomaly card states the method, the reference population, the threshold and a "not a proof" line. The method-boundary panel states the three things the page deliberately does not do.

## 5. Anomaly method

**Robust median/MAD z-score for the weekly series.** The weekly fraud rate is a 105-point series with a heavy tail, a structural zero at the final week and a boundary week. A mean/standard-deviation z-score would be dragged by exactly the points we are trying to find. The median and the median absolute deviation are not. The scaled robust z is `(x - median) / (1.4826 × MAD)`; the threshold is `|z| ≥ 3.5`, chosen to be conservative for a series of this size. The result is one flagged week: **2019-01-20**, rate 1.4642%, 175 fraud events in 11,952 transactions, z = 4.15. The reference population is all 105 weeks and is stated on the card.

**The final zero-fraud week is an edge case, not an anomaly.** The week ending 2021-01-03 has 0 fraud events across 18,921 transactions (z = −2.20). It is reported in a separate *edge case* list with the reason, and it is not counted as an anomaly, because the recorded week is a boundary artefact rather than a statistical surprise. The interface shows both lists, so the decision is visible.

**PSI is a recorded convention, not a new detector.** The seven severe and one moderate drift features use the thresholds the notebook already applied (`severe ≥ 0.25`, `moderate ≥ 0.10`). They are re-published, not re-derived, and the card says that a high PSI identifies distribution shift rather than performance loss.

**No detector where the data does not support one.** Model metrics, runtimes and the log event stream are explicitly not anomaly-scanned. The reasoning is recorded in the data (`methodNotes`) and shown in the UI: experiment metrics are designed contrasts, the runtime record is too sparse for a reference population, and the log stream has no timestamps. Silence is reported as a decision, not as a clean bill of health.

## 6. Comparison rules

**A comparison requires a shared evaluation basis.** The five families are compared *within* themselves, and each carries a stated basis and a stated limitation.

| Family | Comparable? | Why |
|---|---|---|
| Cross-boundary model variants (9) | Yes, with caveats | Same held-out split; ablations share training rows; robustness variants are not controlled experiments |
| Time-ordered folds (4) | Yes, as repeated measures | Different market periods; report dispersion, not one fold |
| Anomaly detectors (3) | No | Different algorithms and different sample sizes (LOF 5,000 rows vs 50,000) |
| 2D embeddings (7) | No | Different geometry and hyperparameters; qualitative diagnostic only |
| Hour-encoding comparison (3) | Yes | Same narrow model and holdout; a 0.0003 difference is not a general recommendation |

**Absolute differences, not percent improvement.** PR-AUC and ROC-AUC are bounded in [0, 1], so "a 49% improvement" on 0.5575 → 0.8315 is arithmetically true and analytically misleading: it overstates what a bounded metric can express. The console shows the absolute difference on the native 0–1 scale and states that this is the unit. A ratio is shown only where it is interpretable, and a feature-count delta is rendered in a neutral tone, because fewer features is not automatically better.

**No significance theatre.** Single-seed experiments with no variance estimate cannot support a p-value, and the console computes none. Where the source has a real interval (the bootstrap CI on test PR-AUC, 0.5365–0.5784) it is shown; where it does not, the absence is not filled in.

**The selection is the unit of comparison.** Up to four variants can be selected, and the reference is always named. If the selection mixes families or splits, the delta column is replaced by an explicit "descriptive only" state.

## 7. Accessibility decisions

Target: **WCAG 2.2 Level AA**. Two criteria were read directly from the W3C in this session (SC 1.4.3 Contrast (Minimum) and SC 2.5.8 Target Size (Minimum)); the remainder are applied from the WCAG 2.2 specification and are listed with their success criteria so a claim can be checked against the spec.

| Criterion | Level | How Phase 2 meets it |
|---|---|---|
| 1.4.3 Contrast (Minimum) | AA | 4.5:1 minimum for normal text, 3:1 for large text and non-text indicators. Every token clears the floor; ratios are listed in §3. |
| 1.4.10 Reflow | AA | No horizontal scrolling at 320 CSS px. Verified: 0 px overflow on every route at 390 px, and the shell resets its margin below 960 px. |
| 1.4.11 Non-text Contrast | AA | 3:1 for chart strokes, focus rings, borders and status dots. Accent and status colours clear 3:1 on their surfaces. |
| 1.4.12 Text Spacing | AA | Layouts use flexible spacing; no fixed-height text containers clip at increased line height. |
| 2.1.1 Keyboard | A | Every control is a real button, link, input or select. Drawers and the search modal trap focus and close on Escape. |
| 2.4.1 Bypass Blocks | A | A skip link ("Skip to main content") is the first focusable element, and the sidebar, topbar, main region and footer are landmarks. |
| 2.4.7 Focus Visible | AA | A 2 px cyan focus ring with a 2 px offset on every interactive element. |
| 2.4.11 Focus Not Obscured (Minimum) | AA | The sticky topbar is the only fixed element; panels scroll beneath it rather than under an overlay. |
| 2.5.8 Target Size (Minimum) | AA | Interactive targets are ≥ 24×24 CSS px, or satisfy the spacing exception. (Read in this session from `w3.org/WAI/WCAG22/Understanding/target-size-minimum.html`.) |
| 1.4.1 Use of Color | A | Grade, severity, provenance and verified/inferred status are always paired with a text label or an icon, never colour alone. |
| 2.3.3 Animation from Interactions | AAA | `prefers-reduced-motion: reduce` disables CSS transitions and ECharts animation in the chart adapter. |
| 4.1.2 Name, Role, Value | A | Icon-only buttons carry `aria-label`; the mobile menu carries `aria-expanded` and `aria-controls`; the new drawer is a labelled `role="dialog"` with `aria-modal`. |
| 4.1.3 Status Messages | AA | Filter results, selection counts and export results are announced through live regions or explicit count labels. |

**Charts.** Every chart carries `role="img"` with a descriptive label, is focusable, and enables ECharts' own `aria` component. Where a chart encodes data that matters, the same data is available as a table (the experiment comparison, the metric catalogue, the log stream, the column profile), so the chart is never the only path to a number.

## 8. Performance decisions

| Decision | Rationale | Result |
|---|---|---|
| Route-level code splitting (19 routes) | The ECharts chunk is 707 kB raw; it must not gate first paint | First contentful paint 372 ms cold / 140 ms cached (unchanged from Phase 1) |
| Evidence layer loaded per page | The Phase 2 JSON totals 1.55 MB uncompressed; loading it all on `/` would have tripled the initial payload | Initial payload unchanged at 936 KB on the overview; the heaviest Phase 2 route (`/logs`) fetches 704 KB on demand |
| Tables fetched individually | The 46 table JSONs total 696 KB | The explorer fetches one table (max 999 rows) and profiles it in the browser |
| No client-side chart animation for reduced motion | Also removes layout thrash | `animation: false` under `prefers-reduced-motion` |
| Canvas renderer, not SVG | Hundreds of marks in the lineage graph and 160 charts | Consistent with Phase 1; `Chart` reuses one instance per mount and disposes it |
| DOM-level pagination instead of virtualisation | The longest list is 629 log patterns and 155 metrics; 76 measurements show no layout pain | Page heights stay in a readable band (1,197–16,148 px) with no overflow |
| Build budget enforced in the validator | Prevents silent growth | Largest JS chunk 707 kB (< 800 kB), stylesheet 91 kB (< 150 kB) |

**Measured, not assumed.** The browser suite records console errors, overflow, sub-10 px text, empty canvases, page heights and DOM size for every route at four viewports. The final run: **76 measurements, 0 console errors, 0 px overflow, 0 sub-10 px text, 0 empty canvases.**

## 9. Security decisions

- The console is a static bundle with no backend, no authentication and no user accounts.
- All data is fetched from same-origin static JSON with a strict path allowlist; `loadTable` validates the identifier against `^[a-z0-9_]+$`.
- All rendering goes through React's escaping; no `dangerouslySetInnerHTML` is used anywhere, including the notebook and log viewers.
- CSV export neutralises spreadsheet formula injection on string cells.
- External links use `target="_blank" rel="noreferrer"`.
- The seven Plotly HTML artifacts require a CDN at runtime; the interface states this on the tab rather than pretending they are self-contained.

## 10. Decisions deliberately not taken and operational boundaries

| Boundary / Not Done | Rationale |
|---|---|
| Synthetic portfolio financial metrics | Research project profiles are strictly bound to verified execution metrics; no synthetic revenue or ROI values are invented. |
| Uncontrolled cross-family causal claims | Cross-family experiments are presented as descriptive benchmark comparisons (% of reference), not controlled feature ablations. |
| Native PBIX/PBIP | No authoring runtime, no Power BI Desktop, no way to validate the result. Claiming otherwise would be false. |
| Automated narrative generation | Insights must be traceable and reproducible. A generated sentence cannot be. |
| Runtime anomaly detection | The telemetry is too sparse for a defensible reference population. |
| Significance testing on experiment deltas | Single-seed, no variance estimate. A p-value here would be theatre. |
| Writing the raw CSVs into the console | They are absent, and shipping them is not this console's job. |

