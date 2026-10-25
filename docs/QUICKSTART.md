# Quick start

This guide covers the React application, the Phase 2 evidence layer, the validation suite and the Power BI import pack. Run all commands from the project root unless a step says otherwise.

## Prerequisites

| Tool | Version / note |
|---|---|
| Node.js | 20+ recommended; the app uses React 18, Vite 8 and TypeScript 7 |
| Python | 3.11+ recommended; the local test environment uses 3.14.4 |
| Python packages | `pandas`, `Pillow`, `playwright` (only for the browser matrix) |
| Chrome | The browser tests default to `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| Power BI Desktop | **Not installed here.** Required only if you want to build the native report from the pack |

> In PowerShell, use `npm.cmd`, not `npm.ps1`. The local execution policy blocks the PowerShell shim in this environment.

## 1. Run the application

```powershell
cd app
npm.cmd install
npm.cmd run dev
```

Open **http://127.0.0.1:4173**.

The app is a fully static React/Vite build. It does not need a database or API server. If port 4173 is already in use, stop the other process before starting a second dev server; the app's data paths are relative, so a different port works too.

### The 19 routes

| Group | Routes |
|---|---|
| Command | `/` Overview · `/insights` Insights |
| Evidence | `/data-audit` · `/distributions` · `/interactions` · `/temporal` · `/advanced` · `/statistics` · `/features` |
| Decision | `/model` · `/economics` · `/experiments` |
| Investigate | `/lineage` · `/logs` · `/explore` |
| Outputs | `/findings` · `/artifacts` |
| Reference | `/metrics` · `/program` |

Press **⌘K** (or **Ctrl+K**) for the command palette. The sidebar collapses to an icon rail from the control in the brand block; the preference is remembered.

### Production build

```powershell
cd app
npm.cmd run build
npm.cmd run preview
```

`npm.cmd run build` runs `tsc --noEmit` and then Vite. The build output is written to `app/dist/`, which is excluded from the file inventory and from the shipped source tree.

## 2. Validate the numbers

From the project root:

```powershell
python tests\validate_metrics.py     # Phase 1 data layer
python tests\validate_phase2.py      # Phase 2 evidence layer, analytics and console surface
```

`validate_metrics.py` reloads the 46 source CSVs, the notebook, the 64-finding ledger and the 129 PNGs, recomputes the published metrics and compares them with the app data. Expected: **196 checks, 196 passed, 0 failed**, 11 known caveats.

`validate_phase2.py` reloads the Phase 1 artifacts and the eight Phase 2 evidence files, independently recomputes the robust z-score flags, the comparison deltas, the lineage integrity and the Power BI pack counts, and checks the console surface (routes, navigation, accessibility affordances, security guards) and the browser matrix artefacts. Expected: **136 checks, 136 passed, 0 failed**, 8 known caveats.

Outputs: `tests/validation_results.json`, `tests/phase2_validation_results.json`, `reports/validation_report.md`, `reports/phase2_validation_report.md`.

## 3. Run the browser matrix

Start the dev server first, then in another terminal:

```powershell
python tests\capture_phase2_shots.py
```

The script renders all 19 routes at desktop (1440), laptop (1280), tablet (834) and mobile (390), scrolls each page to trigger lazy images, and records console errors, horizontal overflow, text below 10 px, empty chart canvases, page height and DOM size.

Outputs:

- `tests/phase2_shots/report.json` — 76 measurements;
- `tests/phase2_shots/*.png` — 76 full-page screenshots.

Expected: 0 console errors, 0 px horizontal overflow, 0 sub-10 px text, 0 empty canvases.

The older `tests/ui_smoke.py` still runs the Phase 1 12-route matrix and writes `tests/ui_check/`.

To use a different URL or Chrome path:

```powershell
$env:APP_URL = "http://127.0.0.1:4173"
$env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
python tests\capture_phase2_shots.py
```

## 4. Regenerate the pipeline

The pipeline is source-backed but does **not** rerun the notebook. It reads the existing notebook artifacts.

```powershell
python analytics\build_dataset.py          # Phase 1 app data layer
python analytics\build_phase2_data.py      # Phase 2 evidence layer
python powerbi\build_powerbi_pack.py       # Power BI pack
python tests\validate_metrics.py
python tests\validate_phase2.py
python tests\capture_phase2_shots.py
python reports\build_reports.py
```

| Step | Reads | Writes |
|---|---|---|
| `analytics\build_dataset.py` | notebook, tables, figures, logs | `app/public/data/*.json`, 46 table JSONs, thumbnails, mirrored artifacts, processed CSVs |
| `analytics\build_phase2_data.py` | app data layer, notebook record, metric catalogue, run logs | `app/public/data/phase2/*.json` (8 files) |
| `powerbi\build_powerbi_pack.py` | app data layer, Phase 2 evidence, source tables | `powerbi/data/*.csv` (70), `powerbi/manifest.json` |
| `tests\validate_metrics.py` | source tables, notebook, figures, logs, app data | `tests/validation_results.json`, `reports/validation_report.md` |
| `tests\validate_phase2.py` | Phase 1 + Phase 2 data, pack manifest, app source, browser artefacts | `tests/phase2_validation_results.json`, `reports/phase2_validation_report.md` |
| `tests\capture_phase2_shots.py` | running app at `APP_URL` | `tests/phase2_shots/report.json`, screenshots |
| `reports\build_reports.py` | all of the above, validation results, pack manifest | `reports/*.md` and `reports/*.csv` |

The order matters: the evidence layer precedes the pack build, the pack build precedes the reports, and validation and browser evidence precede the reports so the implementation and handoff reports carry the current numbers.

> `reports/build_reports.py` regenerates the Phase 1 report suite. The Phase 2 reports (`phase2_*.md`) are authored documents and are not overwritten by it, except `phase2_validation_report.md`, which the Phase 2 validator writes.

## 5. Import the Power BI pack

There is **no PBIX/PBIP file**. Use `powerbi/` as a reproduction kit (version 2.0.0):

1. Open Power BI Desktop.
2. **Get data → Text/CSV** and import every CSV in `powerbi/data/`.
3. Set UTF-8 encoding. Confirm dates, decimals and whole numbers in Power Query.
4. Create the 33 relationships exactly as listed in `powerbi/relationships.md`.
5. Mark `dim_date` as the date table using `dim_date[date]`.
6. Paste the measures from `powerbi/dax/measures.dax` (137 measures).
7. Import `powerbi/theme/fraud_evidence_theme.json`.
8. Build the 19 pages from `powerbi/pages/page_spec.md` at 1440 × 900.
9. Reconcile the headline values against `powerbi/relationships.md` §6 and `reports/metric_catalog.csv`.

The date bridge is deliberate: `dim_date[week_end]` is many-to-one to `dim_week[week_end]`, with bidirectional cross-filtering. It is the only relationship touching `dim_date` and the only bidirectional relationship, so it does not create an ambiguous filter path.

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| `npm.ps1 cannot be loaded` | Use `npm.cmd` (for example, `npm.cmd run dev`) |
| Port 4173 already in use | Stop the existing dev server, or run Vite on another port and update `APP_URL` for the browser test |
| Browser test cannot find Chrome | Set `CHROME_PATH` to the Chrome executable |
| Browser test gets connection errors | Start `npm.cmd run dev` first and wait for the Vite ready message |
| A Phase 2 page shows "could not be loaded" | The route failed in isolation; the page boundary keeps the rest of the console alive. Re-run `python analytics\build_phase2_data.py` and reload |
| A Phase 2 page shows a data-layer error | The eight `app/public/data/phase2/*.json` files are missing or stale; regenerate them |
| Power BI shows duplicated totals | Facts are pre-aggregated snapshots; filter to one fact and do not sum across fact families |
| Date slicer does not filter the weekly page | Confirm the `dim_date` → `dim_week` bridge is bidirectional and that `dim_date` is marked as the date table |
| Validation fails on source counts | Confirm you are in the project root and that `tables/`, `figures/` and `logs/` are intact; rerun `python tests\validate_metrics.py` |
| Raw CSV rerun fails | Expected: `fraudTrain.csv` and `fraudTest.csv` are absent. The notebook cannot be rerun end to end here |

## 7. Where to look next

- `reports/phase2_handoff.md` — **start here**: what changed, how to use it, limitations, next priorities.
- `README.md` — project map and headline results.
- `docs/glossary.md` — metric and modelling definitions.
- `reports/phase2_implementation_audit.md` — the pre-Phase-2 audit with remediation status.
- `reports/phase2_research_and_design_decisions.md` — the reasoning behind each design decision.
- `reports/phase2_visual_review.md` — visual review of 19 routes at 4 viewports.
- `reports/phase2_validation_report.md` — the 136-check Phase 2 record.
- `reports/implementation_report.md` — Phase 1 architecture and build record.
- `reports/metric_catalog.md` — 155 metrics with formulas and sources.
- `powerbi/README.md` — pack contents and import caveats.
