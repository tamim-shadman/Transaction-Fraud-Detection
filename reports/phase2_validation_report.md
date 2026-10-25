# Phase 2 validation report

Generated 2026-10-21T18:12:48+00:00 by `tests/validate_phase2.py`.

**Checks: 144 · Passed: 144 · Failed: 0**

The validator reloads the Phase 1 manifest, analysis tables and notebook record, recomputes the Phase 2 derivations independently, and compares them with the JSON the app serves. It does not trust the React code or the build script.

## Results by group

| Group | Checks | Passed | Failed |
|---|---:|---:|---:|
| Evidence layer | 18 | 18 | 0 |
| Program profile | 12 | 12 | 0 |
| Project portfolio | 5 | 5 | 0 |
| Experiments | 12 | 12 | 0 |
| Anomalies | 9 | 9 | 0 |
| Insights | 8 | 8 | 0 |
| Lineage | 9 | 9 | 0 |
| Artifacts | 7 | 7 | 0 |
| Logs | 11 | 11 | 0 |
| Metrics | 7 | 7 | 0 |
| Console | 16 | 16 | 0 |
| Power BI pack | 21 | 21 | 0 |
| Browser matrix | 6 | 6 | 0 |
| Build | 3 | 3 | 0 |

## Failed checks

None. Every check passed.

## What each group proves

| Group | Claim under test |
|---|---|
| Evidence layer | The eight Phase 2 JSON files exist, parse, and carry a generation stamp. |
| Program profile | Phase dossiers, research questions, findings, issues, notes and the reproducibility checklist are carried from the manifest without drift. |
| Experiments | Group membership, baselines, absolute deltas and comparability flags are internally consistent and match the manifest metrics. |
| Anomalies | The weekly flag set is reproduced by an independent median/MAD z computation; drift flags match the analysis PSI verdicts; no anomaly is raised where the sample is too small. |
| Insights | Every insight carries a scope, a numeric metric, a source reference, a link and a confidence label, and the headline numbers match the source tables. |
| Lineage | Every edge resolves to real nodes, verified and inferred edges partition the set, and no node family is missing. |
| Artifacts | Provenance totals reconcile; verified artifacts carry the cell that the notebook records for them; inferred artifacts claim no cell. |
| Logs | Event and pattern counts reconcile, no timestamps are invented, and the export-skip count matches the warning register. |
| Metrics | The catalogue is complete, ids are unique, and every source reference resolves to a real manifest table. |
| Console | The seven Phase 2 routes, pages, navigation entries, accessibility affordances and security guards are present in the source. |
| Power BI pack | Version, table/measure/relationship counts, the new tables and the single bidirectional relationship all reconcile. |
| Browser matrix | Every route was rendered at four viewports; no console error, no horizontal overflow, no sub-10px text and no empty chart canvas. |
| Build | The production bundle exists and stays inside the size budget. |

## Browser and build evidence

`tests/capture_phase2_shots.py` rendered **76 measurements** (4 viewports x 19 routes).

| Viewport | Routes | Console errors | Horizontal overflow (px) | Sub-10px text | Empty canvases | Tallest page (px) |
|---|---:|---:|---:|---:|---:|---:|
| desktop | 19 | 0 | 0 | 0 | 0 | 9,232 |
| laptop | 19 | 0 | 0 | 0 | 0 | 9,686 |
| mobile | 19 | 0 | 0 | 0 | 0 | 16,148 |
| tablet | 19 | 0 | 0 | 0 | 0 | 11,116 |

Production bundle (largest chunks):

| File | Bytes |
|---|---:|
| `Chart-CldXOiBB.js` | 710,892 |
| `index-DpGIZJ8M.js` | 226,856 |
| `Artifacts-CMugMXM1.js` | 39,453 |
| `Model-DUZofrQY.js` | 24,827 |
| `index-DihDrsX0.css` | 120,973 |

## Known caveats (not failures)

### C1 · The raw datasets are absent

fraudTrain.csv and fraudTest.csv are referenced by hash and size but are not in the workspace, so the notebook cannot be re-run end to end. Every Phase 2 value is derived from the generated artifacts only.

Sources: `logs/data_fingerprint.json, manifest sources`

### C2 · No native Power BI authoring runtime

The pack is CSV + DAX + theme + page spec. It has not been opened in Power BI Desktop, so the model is verified by schema, count and arithmetic checks only.

Sources: `powerbi/manifest.json`

### C3 · Log events have no timestamps

The notebook outputs, warning register and build logs carry no reliable per-event times. Sequence is preserved by cell and line number, and no timestamp is invented.

Sources: `data/notebook.json, logs/build.log`

### C4 · A single research program

The workspace contains one program with nine phases. Comparisons are between model variants, folds and detectors - not between independent projects.

Sources: `app/public/data/phase2/program.json`

### C5 · Partial runtime telemetry

The run records total wall clock, six embedding durations and the SHAP duration. There is no per-phase or per-model runtime ledger, so no runtime anomaly detection is attempted.

Sources: `manifest run.embeddingTimes`

### C6 · The same warning can appear in two sources

A warning present in both the notebook output and the warning register is counted once in the warning families and twice in the raw event stream. The UI states which number it is showing.

Sources: `data/phase2/logs.json`

### C7 · Related findings are phase-level

An artifact is linked to the findings of its phase. The link is labelled as phase-level rather than a claim that the artifact is the source of that finding.

Sources: `data/phase2/artifacts.json`

### C8 · The manifest's phase cell range omits each phase's final cell

For every phase, the notebook records one more cell in that phase than the manifest's cell_start/cell_end span (for example P0 is 13-18 in the manifest while cell 19 also carries the P0 phase). Range-based provenance checks would therefore report false mismatches, so the console uses the notebook's own cell-to-phase mapping as the authority and records the producing cell against it.

Sources: `data/notebook.json, manifest phases`

## Limits of this validation

- The raw datasets are absent, so the notebook cannot be re-run and no value here is recomputed from transaction rows.
- The Power BI pack is not executed in a Tabular engine; its DAX is source-inspected and arithmetic-checked only.
- Visual quality, contrast and interaction behaviour are covered by the browser suite in `tests/capture_phase2_shots.py` and the visual review, not by this script.
