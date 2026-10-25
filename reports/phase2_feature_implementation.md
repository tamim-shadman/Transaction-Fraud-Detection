# Phase 2 feature implementation

**What changed, in the order the work happened.** This report records the Phase 2 build: the evidence layer that was added under the app, the seven new routes, the redesign of the shell and the existing pages, the new analytics, the export paths, the accessibility work, and the validation that now covers all of it.

---

## 1. The evidence layer (new)

Phase 1 shipped a static JSON data layer. Phase 2 adds a second, structured layer that the new pages read:

```
analytics/build_phase2_data.py          <- new generator
app/public/data/phase2/
  program.json      70 KB   program profile, 9 phase dossiers, 8 research questions, reproducibility
  experiments.json  34 KB   26 variants, 5 evaluation families, comparability rules, deltas
  artifacts.json   472 KB   182 artifacts with producing cell, provenance status, related findings
  lineage.json     177 KB   292 nodes, 374 edges (365 verified, 9 inferred)
  logs.json        704 KB   817 classified events, 629 message patterns, 3 warning families
  metrics.json      96 KB   155 catalogued metrics with formula, source, validation, caveat
  insights.json     21 KB   15 deterministic insight statements
  anomalies.json     9 KB   10 anomaly flags + 1 edge case, with method and threshold
```

**The generator never touches raw data.** It reads the Phase 1 manifest, analysis tables, notebook record, the metric catalogue and the run logs, and writes the eight files above. It is deterministic: running it twice produces the same content, and the validator recomputes the published quantities independently to prove it.

**Why a generator rather than hand-written JSON.** Three requirements forced this. First, provenance: an artifact's producing cell is *parsed* out of the notebook's `[fig]`/`[tab]` write lines, not asserted. Second, comparability: the evaluation families, their bases and their limitations are data, so the UI cannot disagree with the documentation. Third, the Power BI pack: it consumes the same eight files, so the React console and the import pack cannot drift.

## 2. New routes (7)

| Route | Page | What it answers |
|---|---|---|
| `/insights` | Insights | "What does the evidence actually say, and where is it bounded?" |
| `/program` | Program profile | "What was run, in what order, and what bounds it?" |
| `/experiments` | Experiments | "Which comparisons are legitimate, and what exactly differs?" |
| `/lineage` | Evidence map | "How does one artifact connect back to the run that produced it?" |
| `/logs` | Run logs | "What did the run record, and what did it skip?" |
| `/explore` | Data explorer | "What does the underlying table actually contain?" |
| `/metrics` | Metric catalog | "What does each metric mean and where does it come from?" |

The twelve Phase 1 routes are unchanged in scope and were all restyled. The route count went from 12 to 19.

### 2.1 Insights

- Fifteen deterministic statements across eight scopes (data, drift, economics, evidence quality, features, logs, model, temporal), each with a priority, a kind, the metrics behind it, the source of each metric, a link to the evidence and a caveat.
- A scope filter and a text search, both encoded in the URL so a view can be shared.
- An **anomaly watch** with the weekly flag, the export exception and the drift register, each card stating method, threshold, reference population and a "not a proof" boundary.
- A drift register with a bar per feature, a method-boundary panel, and a "where to investigate next" cross-link block.
- **Export brief**: the current filtered selection as a Markdown evidence brief with sources and caveats — the export cannot over-claim relative to the screen because it carries the same scope.

### 2.2 Program profile

- Program identity, description, audience, technologies, and the research question in the run's own terms.
- The eight research questions as cards linking into the findings ledger, with finding and strong-finding counts and the phases that answer them.
- Run provenance: id, start, end, reported vs measured duration, cells executed, cells with output, tracebacks, environment.
- Source availability: each source file with role, size, hash and present/absent state — the reproducibility boundary is explicit rather than implied.
- **Nine phase dossiers**, each with purpose, methods, key findings, limitations, evidence volume, workspace issues, representative figure and cell range. Opening a dossier opens a drawer with the full profile and links into the phase's analysis and its findings.
- The reproducibility checklist with each recorded check and its evidence string, the program limits, the highest-severity workspace issues, and an exportable Markdown profile.

### 2.3 Experiments

- Five evaluation families as filter pills, each with its metric, its basis and its limitations.
- A compatibility banner that states whether the current family is comparable, and why not when it is not.
- A PR-AUC dot plot across all 26 variants, with lanes as categories and an explicit "do not rank across lanes" note. Clicking a point adds it to the comparison.
- A selection of up to four variants with a named reference, a comparison table (PR-AUC, ROC-AUC, features, rows, split, evidence source) and per-row absolute deltas.
- A variant catalogue with rank-in-group, source links, and add/remove selection.
- A comparison-rules panel and the metric notes (PR-AUC, ROC-AUC, delta semantics).
- **Exports**: a CSV of the selection, and a Markdown brief that repeats the compatibility warning into the exported file.
- The selection lives in the URL, so a comparison is shareable and reproducible.

### 2.4 Evidence map

- 292 nodes across eleven types (run, notebook, source, phase, research question, finding, audit note, issue, figure, interactive artifact, table) and 374 edges.
- **Verified versus inferred is a first-class distinction**: 365 edges come from the ledger, notebook cell ranges, the warning register or an artifact write line; 9 are inferred because no producing cell could be located, and they are drawn dashed.
- Focus model: the graph renders the focused node and its neighbourhood, with a 1/2/3-hop expansion control and a node-type filter. Selecting a node in the graph re-focuses it.
- A detail panel with the node's metadata, every connection with its relation and its verified/inferred flag, and a shortest path back to the run.
- A search box that finds any node by id, label, type or phase.

### 2.5 Run logs

- 817 events from four sources: notebook outputs (683), the UI smoke log (85), the build log (40) and the warning register (9).
- Classification by severity (info / notice / warning / error) and category (section, artifact, measurement, ledger, export, dependency, explainability, runtime, build, test, output, divider).
- Filters for severity, category, phase, source and free text, all URL-encoded.
- Two views: the event stream (with expandable raw lines) and 629 normalised **message patterns** with occurrence counts, affected phases and cells.
- Three **warning families** counted from the register so one event is not counted twice: seven skipped static exports, one Plotly/Kaleido version conflict, one SHAP background subsample — each with its evidence, its interpretation and its boundary.
- A prominent statement that the sources carry no timestamps, and that sequence is preserved by cell and line number.
- **Export** of the filtered event list as CSV.

### 2.6 Data explorer

- A table rail over all 46 generated tables with search and a category filter.
- Three views per table: **Rows** (sortable, searchable, paginated preview), **Column profile** (type, present, unique, missing, range or top values per column) and **Quality & correlation** (completeness bars and a Pearson correlation matrix over the numeric columns).
- A column detail panel with min/max/mean/median or value frequency, a histogram, and the exact missing percentage.
- Profiles are computed in the browser from the same rows the preview shows — no sampling, no server.
- **Exports**: the full table as CSV, and a JSON profile (per-column statistics plus the correlation matrix) for the current table.

### 2.7 Metric catalog

- All 155 catalogued metrics with layer, value, unit, confidence, validation checks and a link to the source table.
- Layer and confidence filters plus free-text search across name, formula and source.
- A detail drawer with the definition, the formula in monospace, the source file and locator, the pages the metric appears on, and the caveat.
- Summary tiles for catalogue size, validated count and caveat count, and a note on the Power BI parity rule.
- **Export** of the filtered catalogue as CSV.

## 3. Artifacts: provenance and detail

The Artifacts page gains a **Provenance** tab and a detail inspector:

- A searchable index of all 182 artifacts with kind, phase, provenance status, producing cell and related-finding count.
- An inspector drawer per artifact: preview, metadata, the recorded source path, the producing cell and its write line, the phase's research question, and the phase's related findings.
- Actions from the inspector: open the original file, open the table in the data explorer, open the producing notebook cell (`/artifacts?tab=notebook&cell=N`), and trace the artifact in the evidence map.
- A JSON export of the provenance index.
- Coverage tiles: 173 verified, 9 inferred, with the rule for each stated on the page.

## 4. Redesign

### 4.1 Shell

- **Dark-first design system.** Deep graphite/navy surfaces (`#070b13` page, `#0e1524` surface), a restrained accent family (indigo `#8b8cf8`, violet `#c4a7ff`, teal `#2dd4bf`, cyan `#5eead4`) and status colours (fraud `#fb7185`, amber `#fbbf24`, green `#4ade80`). Every token was contrast-checked against its surface.
- **Collapsible navigation.** 274 px expanded, 78 px icon rail collapsed, persisted in `localStorage`, with a keyboard-reachable control. Six groups: Command, Evidence, Decision, Investigate, Outputs, Reference.
- **Topbar** with a three-level breadcrumb (program / group / page), a run-context strip, and the command palette trigger.
- **Command palette** extended to all 19 pages and every finding, table, figure, phase and KPI, with a focus trap and Escape handling.
- **Skip link** to the main content, landmark roles on the shell, `aria-expanded`/`aria-controls` on the mobile menu, and a 2 px focus ring on every interactive element.

### 4.2 Existing pages

All twelve Phase 1 pages were restyled onto the new system rather than left in the old palette:

- Panels, KPIs, badges, callouts, tables, toolbars, tabs, segmented controls, galleries, drawers, the lightbox, the notebook viewer, the findings ledger, the phase rail and the footer all have dark-surface equivalents.
- Hard-coded light surfaces in the page files (23 inline backgrounds) were replaced with tokens.
- The Phase 1 typography floor was raised: the smallest DOM text is now 10.5 px (was 8 px in several places), and the chart adapter enforces the same floor on canvas text.
- The invalid CSS-variable reference in a chart option is gone.
- The hard-coded analytical values in the overview hero were replaced with values read from the data layer; the bootstrap CI is the single retained literal and is cited to its notebook cell.

## 5. Analytics added

| Analysis | Method | Where |
|---|---|---|
| Weekly fraud-rate anomaly | Robust z-score, median/MAD, `|z| ≥ 3.5`, reference = all 105 weeks | Insights → Anomaly watch |
| Boundary-week edge case | Zero-event week recorded separately, not as an anomaly | Insights → Anomaly watch |
| Drift register | The notebook's own PSI convention (severe ≥ 0.25, moderate ≥ 0.10) | Insights, Model |
| Comparison deltas | Absolute difference on the native 0–1 scale, family-scoped | Experiments |
| Rank in family | Descending metric order within the displayed family | Experiments, Pack |
| Column profiles | Count, missing, unique, min/max/mean/median, value frequency, histogram | Data explorer |
| Correlation matrix | Pearson over numeric columns (max 10 per table) | Data explorer → Quality |
| Message patterns | Normalised signatures (paths, hashes and numbers replaced) | Run logs |
| Provenance classification | Write-line parse from the notebook, verified vs inferred | Artifacts, Evidence map |
| Lineage construction | Phase, RQ, finding, note, issue and artifact edges from manifest and notebook records | Evidence map |
| Evidence status | Strong / supports / caveat / weak, plus the audit-note overlay | Insights, Findings |

Everything above is computed by `analytics/build_phase2_data.py` or in the browser from loaded rows. Nothing is asserted by hand.

## 6. Exports

| Export | Format | Trigger |
|---|---|---|
| Evidence brief | Markdown | Insights, current scope |
| Program profile | Markdown | Program profile |
| Comparison brief | Markdown | Experiments, current selection and family |
| Experiment selection | CSV | Experiments |
| Log events | CSV | Run logs, current filters |
| Table rows | CSV | Data explorer, current table |
| Column profile | JSON | Data explorer, current table |
| Metric catalogue | CSV | Metrics, current filters |
| Artifact provenance | JSON | Artifacts → Provenance |
| Manifest | JSON | Artifacts header (Phase 1, retained) |

Every CSV export passes string cells through the formula-injection guard; every Markdown export repeats the applicable boundary statement so the file cannot be quoted more strongly than the screen.

## 7. Power BI pack → v2.0.0

| | Phase 1 | Phase 2 |
|---|---:|---:|
| CSV tables | 59 | **70** |
| Dimensions / facts | 10 / 49 | **14 / 56** |
| DAX measures | 112 | **137** |
| Relationships | 17 | **33** |
| Page specifications | 12 | **19** |

New tables: `fact_insight` (15), `fact_anomaly_flag` (10), `fact_artifact_provenance` (182), `fact_metric_catalog` (155), `fact_log_pattern` (629), `fact_lineage_node` (292), `fact_lineage_edge` (374), plus dimensions `dim_insight_scope`, `dim_experiment_group`, `dim_provenance_status`, `dim_node_type`. `fact_experiment` gained `group_id` and `rank_in_group` so the comparison unit is in the model.

The pack still contains **no PBIX and no PBIP**, has never been opened in Power BI Desktop, and says so in its README, its relationship guide, its page spec and the app footer.

## 8. Security, empty states and error handling

- **Security**: static-only data access with an id allowlist; React escaping everywhere (no `dangerouslySetInnerHTML`); formula-injection-safe CSV export; `rel="noreferrer"` on external links; a stated CDN dependency for the Plotly artifacts.
- **Empty states**: every new page has a designed empty state (no matching insights, no anomalies at the thresholds, no selection, no matching logs, no matching metrics, no table match) with a way out, not a blank region.
- **Error handling**: a route-level `PageBoundary` isolates a failing page, keeps the shell and navigation alive, and offers a retry. The data layer retains its own error screen with the rebuild instruction.
- **Loading states**: skeleton pages and inline skeletons for lazily loaded evidence, with no layout jump.

## 9. Files changed

**Added**
```
analytics/build_phase2_data.py            Phase 2 evidence-layer generator
app/src/pages/Insights.tsx
app/src/pages/Program.tsx
app/src/pages/Experiments.tsx
app/src/pages/Lineage.tsx
app/src/pages/Logs.tsx
app/src/pages/Explore.tsx
app/src/pages/Metrics.tsx
app/src/components/phase2.tsx             Drawer, InsightCard, AnomalyCard, ProvenanceBadge, FilterPills…
app/public/data/phase2/*.json             8 generated evidence files
tests/validate_phase2.py                  136-check validator
tests/capture_phase2_shots.py             19 routes x 4 viewports
reports/phase2_*.md                       audit, research, features, validation, visual review, handoff
```

**Modified**
```
app/src/App.tsx                 route map, error boundary, 19 routes
app/src/components/Layout.tsx   collapsible shell, new navigation, skip link, breadcrumbs
app/src/components/Chart.tsx    dark theme, colour migration, min font size, reduced motion, aria
app/src/components/SearchModal.tsx  new pages, focus trap
app/src/components/ui.tsx        (unchanged API, restyled through tokens)
app/src/lib/chartTheme.ts       new palette + adaptChartOption + ECharts theme
app/src/lib/csv.ts              formula-injection guard
app/src/lib/data.ts             phase 2 loaders, table id validation
app/src/types.ts                Phase 2 types
app/src/styles.css              Phase 2 design system (2,978 → 6,858 lines)
app/src/pages/*.tsx             all 12 Phase 1 pages restyled; hard-coded values removed
powerbi/build_powerbi_pack.py   phase 2 facts/dims/pages/relationships
powerbi/dax/measures.dax        +25 measures
powerbi/README.md, relationships.md, pages/page_spec.md   v2.0.0 documentation
```

**Regenerated**
```
app/public/data/phase2/*.json       8 files
powerbi/data/*.csv                  70 files
powerbi/manifest.json               v2.0.0
reports/validation_report.md        re-run of the Phase 1 validator
reports/phase2_validation_report.md generated by the Phase 2 validator
```

## 10. What is still not possible here

1. The notebook cannot be re-run: the raw CSVs are absent.
2. There is no native Power BI file, and the DAX has not been executed in a Tabular engine.
3. Runtime telemetry is partial, so runtime anomaly detection is not attempted.
4. The console is a single-program reconstruction; it is not a multi-project portfolio.
5. Light theme was deliberately not shipped (see the research report, §3).
