# Phase 2 handoff

**What this is:** the state of the fraud-evidence console at the end of Phase 2 — what changed, what it now does, how to use it, what it still cannot do, and what should happen next.
**Run:** `RUN-20261020-1630` · 1,852,394 transactions · 9,651 fraud events (0.5210%) · 64 graded findings · 182 artifacts · one research program, seven project profiles, nine phases.
**Validation state:** Phase 1 validator 196/196 passed · Phase 2 validator 143/143 passed · browser matrix 76 measurements, 0 console errors, 0 px overflow, 0 sub-10 px text · production build 2,527 modules in 1.31 s.

---

## 1. What changed in one paragraph

Phase 1 was a faithful, well-documented reconstruction of a research run: twelve pages that showed every number the notebook produced, with the evidence and its boundaries attached. Phase 2 turned that reconstruction into an **investigation product**. A reproducible evidence layer (`analytics/build_phase2_data.py` → nine JSON files) now backs eight new routes — Insights, Program profile, Project portfolio & profiles, Experiments, Evidence map, Run logs, Data explorer and Metric catalog — the entire console provides a **Dual Theme Architecture** (Dark Mode and WCAG 2.2 AA-compliant Light Mode with topbar toggle and reactive canvas re-theming across 160 ECharts instances), the shell became collapsible and keyboard-navigable, the experiments engine gained cross-family benchmark comparison, the artifacts page gained a provenance index and an inspector, and the Power BI pack was extended to version 2.0.0 so the native rebuild path mirrors the new product. Nothing was invented: every new statement, flag, delta and edge traces to a table, a manifest record, a notebook cell or the metric catalogue.

## 2. Redesign

| Area | Phase 1 | Phase 2 |
|---|---|---|
| Theme | Warm paper content, dark navy sidebar | Dual theme architecture: polished dark graphite/navy and crisp, high-contrast light slate theme with reactive topbar toggle |
| Navigation | Fixed 268 px sidebar, 12 entries | Collapsible 274 px / 78 px rail, persisted, 6 groups, 20 entries (including Project Portfolio) |
| Smallest text | 8–9 px on several pages (up to 481 elements) | 10.5 px floor everywhere, 0 sub-10 px elements measured |
| Keyboard | No skip link, no focus trap | Skip link, focus trap in the modal and drawers, visible focus ring, reduced motion honoured in CSS *and* in charts |
| Charts | Light-surface colours, 8 px labels | Dual theme palettes (`paletteDark` and `paletteLight`), registered themes `fraud-p2-dark` and `fraud-p2-light`, 10.5 px minimum, ECharts `aria` enabled, reactive DOM observer |
| Mobile | 12 routes | 20 routes, 0 px overflow at 390 px |
| Errors | A page throw blanked the app | Route-level error boundary keeps the shell alive |

The palette was re-derived for both dark and light surfaces rather than inverted, and the migration is centralised in `adaptChartOption` — which is why every chart across all 20 routes renders correctly with immediate theme switching.

## 3. New analytics

| Capability | Method | Route |
|---|---|---|
| Project portfolio & profiles | 7 research initiatives (`PROJ-01` to `PROJ-07`) mapping 9 phases with KPIs, track filters, deliverables, limitations | `/portfolio` |
| Deterministic insight statements | Template + data, 15 statements, 8 scopes, each with source, confidence and caveat | `/insights` |
| Weekly fraud-rate anomaly | Robust z-score (median/MAD, `1.4826 × MAD`), `|z| ≥ 3.5`, reference = 105 weeks | `/insights` |
| Boundary-week edge case | Zero-event week reported separately, not as an anomaly | `/insights` |
| Drift register | The notebook's own PSI convention, re-published not re-derived | `/insights`, `/model` |
| Variant comparison & cross-family benchmark | Family-scoped deltas on native 0–1 scale plus global cross-family benchmark index (% of reference) | `/experiments` |
| Rank in family | Descending metric order inside the displayed family or global benchmark | `/experiments` |
| Column profiling | Count, missing, unique, min/max/mean/median, top values, histogram | `/explore` |
| Correlation | Pearson over up to 10 numeric columns per table | `/explore` |
| Message patterns | Normalised signatures over 817 log events | `/logs` |
| Provenance classification | Write-line parse from the notebook; verified vs inferred | `/artifacts`, `/lineage` |
| Lineage graph | 292 unique nodes, 374 edges (365 verified, 9 inferred, zero collisions) | `/lineage` |
| Evidence status | Grades plus the audit-note overlay | `/insights`, `/findings` |

**The rules that protect the reader.** Bounded metrics get absolute differences, never percent improvement. Cross-family comparisons are presented as descriptive benchmark indices rather than claiming controlled feature ablations. Every anomaly card states its method, reference population, threshold and a "not a proof" boundary. No detector is applied where the data cannot support one (model metrics, runtimes, the log stream), and the absence is stated rather than left implicit.

## 4. Program & Project Portfolio enhancements

The console provides both an executive **Project Portfolio** (`/portfolio`) and a comprehensive **Program Profile** (`/program`):
- **Project Portfolio & Profiles**: Structures the entire research effort into 7 auditable project profiles (`PROJ-01` to `PROJ-07`) mapping the 9 program phases. Each project dossier carries verified research tracks, key metrics, findings distributions, notebook cell ranges, core deliverables, and methodological limitations.
- **Program Profile**: Outlines program identity and scope, the eight research questions with finding counts, nine phase dossiers, run provenance, source availability with hashes, reproducibility checklist, open issues, and program boundaries.
- **Auditable Boundary**: Both views link directly to verified phase analyses and findings ledger records; no synthetic portfolio metrics are asserted.

## 5. Log intelligence

The run record is now a first-class surface. 817 events from four sources (notebook outputs 683, UI smoke log 85, build log 40, warning register 9) are classified by severity and category, searchable, filterable, exportable as CSV, and collapsible into 629 normalised message patterns. Three warning families are counted from the register so one event is never counted twice: seven skipped static PNG exports, one Plotly/Kaleido version conflict, one SHAP background subsample — each with its evidence, its interpretation and its boundary. The page states prominently that the sources carry **no timestamps**, and that sequence is preserved by cell and line number. No timestamp is invented anywhere.

## 6. Performance

| Measure | Value |
|---|---|
| Production build | 1.31 s (2,527 modules) · 20 lazy route chunks |
| Largest JS chunk | 710.7 kB (234 kB gzip) — the ECharts bundle, route-lazy |
| Main chunk | 206.9 kB (68.5 kB gzip) |
| Stylesheet | 104.9 kB (23.0 kB gzip) |
| First contentful paint | 372 ms cold / 140 ms cached (unchanged from Phase 1) |
| Initial JSON on `/` | 936 KB (unchanged) |
| Heaviest Phase 2 route | `/logs` fetches 704 KB on demand |
| Peak JS heap | 47–74 MB |
| Page height (desktop) | 1,278–9,232 px |

Performance was protected by keeping the evidence layer per-route, fetching tables individually (696 KB total, max 999 rows each), profiling in the browser rather than on a server, and asserting a bundle budget inside the validator.

## 7. Files

**New**
```
analytics/build_phase2_data.py          evidence-layer generator (deterministic, generates 9 JSON files)
app/src/pages/{Insights,Program,Portfolio,Experiments,Lineage,Logs,Explore,Metrics}.tsx
app/src/context/ThemeContext.tsx        Dark/Light theme state and token persistence
app/src/components/phase2.tsx           Drawer, InsightCard, AnomalyCard, ProvenanceBadge, FilterPills, Delta, MiniBar
app/public/data/phase2/*.json           9 generated evidence files (including projects.json)
tests/validate_phase2.py                143-check independent validator
tests/capture_phase2_shots.py           20 routes x 4 viewports, 76 measurements
reports/phase2_implementation_audit.md
reports/phase2_research_and_design_decisions.md
reports/phase2_feature_implementation.md
reports/phase2_validation_report.md     (generated by the validator)
reports/phase2_visual_review.md
reports/phase2_handoff.md
```

**Modified** — `app/src/{App.tsx,styles.css,types.ts}`, `app/src/components/{Layout,Chart,SearchModal}.tsx`, `app/src/lib/{chartTheme,csv,data}.ts`, all twelve Phase 1 pages, `powerbi/build_powerbi_pack.py`, `powerbi/dax/measures.dax` (+25 measures), `powerbi/{README.md,relationships.md,pages/page_spec.md}`, `README.md`, `docs/QUICKSTART.md`.

**Regenerated** — `app/public/data/phase2/*.json`, `powerbi/data/*.csv` (70), `powerbi/manifest.json` (v2.0.0), `reports/validation_report.md`, `reports/phase2_validation_report.md`.

## 8. Usage

```powershell
# 1. Regenerate the evidence layer (only needed if the upstream artifacts changed)
python analytics\build_phase2_data.py

# 2. Regenerate the Power BI pack
python powerbi\build_powerbi_pack.py

# 3. Validate
python tests\validate_metrics.py     # 196 checks
python tests\validate_phase2.py      # 143 checks

# 4. Run the console
cd app
npm.cmd install
npm.cmd run dev        # http://127.0.0.1:4173
npm.cmd run build      # tsc --noEmit && vite build
```

**A good first path.** Overview → Portfolio (explore 7 research project profiles) → Insights (read one card, then its caveat) → Experiments (compare within-family variants or view cross-family benchmarks) → Evidence map (focus the run, expand two hops, open a figure) → Artifacts → Provenance (open one artifact, read its producing cell) → Run logs (filter to warnings) → Data explorer (profile a table) → Metric catalog (look up any number you saw). Toggle theme at any time via the topbar sun/moon button.

**Deep links.** Every view is addressable: `?project=PROJ-01`, `?scope=model`, `?group=...&selected=...`, `?node=table:phase8_psi`, `?table=...&col=...`, `?metric=KPI-FRAUD-RATE`, `?finding=F-013`, `?note=AN-01`, `?artifact=...`, `?tab=notebook&cell=59`. The command palette (⌘K / Ctrl+K) searches pages, findings, tables, figures, phases, projects, and KPIs.

## 9. Limitations

1. **The raw datasets are absent.** `fraudTrain.csv` and `fraudTest.csv` are referenced by hash and size but are not in the workspace, so the notebook cannot be re-run and no value is recomputed from transaction rows.
2. **There is no native Power BI file.** The pack is CSV + DAX + theme + page spec. It has never been opened in Power BI Desktop, so it is validated by schema, count and arithmetic only. This is stated in the pack README, the relationship guide, the page spec, the program profile and the app footer.
3. **Partial runtime telemetry.** Total wall clock, six embedding durations and the SHAP duration only — so no runtime anomaly detection is attempted.
4. **A warning in two sources counts twice in the raw list and once in the families.** The interface states which number it is showing.
5. **Related findings are phase-level.** An artifact is linked to the findings of its phase; that is not a claim that the artifact is the source of the finding.
6. **The manifest's phase cell range omits each phase's final notebook cell.** The console uses the notebook's own cell-to-phase mapping as the authority and records the discrepancy as caveat C8.
7. **The seven Plotly HTML artifacts need a CDN at runtime.** They are marked on their tab.

## 10. Next priorities

**High value, low risk**

1. **Re-run the Phase 2 validator in CI.** The 143 checks and browser measurements are scripted; wiring them into a pipeline keeps the console honest.
2. **Add a `?view=` parameter to the metric catalogue** so a specific metric can be linked from a KPI card (the catalogue already links out to the table that produced it; the reverse link is missing).
3. **Extend the data explorer with cross-filtering** — pick a category value in one table, carry it into the others — which is the one Phase 1 feature that the new pages do not yet reproduce.
4. **Add an "export the visible page" action** to every new route, so a reader can capture a filtered view as a self-contained Markdown or JSON file rather than a screenshot.

**High value, higher cost**

5. **Build the native Power BI report** from the v2.0.0 pack. The page spec is complete for all pages; this needs Power BI Desktop, which this workspace does not have.
6. **Add a second anomaly family for the categorical series** — the current drift view re-publishes the notebook's PSI rather than adding a new categorical test. A Cramér's-V or chi-square stability test over time would be new analysis and would need its own validation.

**Explicitly not recommended**

7. **Automated narrative generation for insights.** A generated sentence cannot be traced to a table, and traceability is the product.
8. **Runtime anomaly detection** until per-phase timing is instrumented in the notebook.
9. **Uncontrolled cross-family causal claims.** Cross-family metrics must remain benchmark comparisons rather than claiming controlled ablation deltas.
