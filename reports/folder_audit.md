# Folder audit

Generated: **2026-10-20T17:57:53**

## Verdict

The workspace is internally consistent and complete for a **reconstruction from generated artifacts**. The only material absence is the raw Kaggle input, so the notebook cannot be rerun end to end from this folder. Every derived table, figure, log and app data file needed by the dashboard is present and readable. There are no orphaned app assets. Four empty `analytics/*` scaffolding directories are documented below; they contain no code and are not missing outputs.

## Top-level folders

| Folder | Files | Size (MB) | Role |
| --- | ---: | ---: | --- |
| tests | 122 | 83.56 | Metric validator, UI smoke test and screenshots |
| app | 416 | 29.96 | React/Vite application, app data layer and mirrored artifacts |
| figures | 136 | 20.08 | Primary 129 PNG figures + 7 interactive HTML artifacts |
| (root) | 2 | 3.87 | Notebook and top-level files |
| data | 18 | 0.97 | Normalized working data and notebook dumps |
| powerbi | 77 | 0.87 | Import-ready star schema, DAX, theme and page specification |
| reports | 19 | 0.41 | Generated audit, catalog, dictionary, metric and handoff reports |
| tables | 46 | 0.40 | Primary 46 CSV analysis tables |
| analytics | 3 | 0.16 | Dataset build pipeline and configuration |
| logs | 6 | 0.06 | Four provenance files plus build and UI verification logs |
| docs | 2 | 0.02 | Quick start and glossary |
| scripts | 4 | 0.00 | Notebook/table inspection utilities |

Counts are the inventoried files. `reports/file_inventory.csv` and `reports/file_inventory.md` are excluded from their own walk.

### Excluded generated and dependency folders

| Folder | Files | Size (MB) | Reason excluded |
| --- | ---: | ---: | --- |
| app/node_modules | 7,106 | 179.44 | npm dependency tree; reproducible from package-lock.json |
| app/dist | 425 | 30.77 | generated production build; reproducible with `npm run build` |

## Expected artifact counts

| Artifact family | Observed | Expected | Status |
| --- | ---: | ---: | :---: |
| Source PNG figures | 129 | 129 | PASS |
| Source interactive HTML | 7 | 7 | PASS |
| Source CSV tables | 46 | 46 | PASS |
| Original log/provenance files | 4 | 4 | PASS |
| All files in logs/ | 6 | 6 | PASS |
| App figure mirrors | 129 | 129 | PASS |
| App thumbnails | 129 | 129 | PASS |
| App interactive mirrors | 7 | 7 | PASS |
| App table JSON files | 46 | 46 | PASS |
| Power BI CSV tables | 70 | 59 | CHECK |

## Duplicate and mirror audit

- Byte-identical groups: **188**.
- Redundant bytes after keeping one canonical copy per group: **25.90 MB**.
- Dominant pattern: the 129 figures, 129 thumbnails and 7 HTML artifacts are mirrored into `app/public/artifacts/` so the Vite build is self-contained.
- The notebook is also mirrored to `app/public/artifacts/notebook/fraud_eda_colab.ipynb` for the in-app viewer.
- These mirrors are intentional. Deleting them would break the application; deleting the originals would break provenance.

## Structural checks

- Empty directories outside excluded dependency/build trees: **4** (`analytics/extraction`, `analytics/metrics`, `analytics/transformations`, `analytics/validation`). They are unused `analytics/` scaffolding, not missing artifacts.
- `tests/ui_check/` holds **11** files (8.67 MB): 10 screenshots plus `results.json` from the browser matrix.
- `logs/` holds **6** files (60.7 KB): four provenance files (`data_fingerprint.json`, `env_snapshot.json`, `findings.md`, `findings_ledger.json`) plus `build.log` and `ui_smoke.log`.
- Naming is phase-prefixed (`phase0_`–`phase8_`) for tables and figures; the app data layer normalizes these to IDs without changing source filenames.
- No raw CSV or ZIP larger than 1 MB exists under the project root; the two fingerprint-referenced CSVs are absent.

## Gaps and risks

| Finding | Severity | Effect | Disposition |
|---|---|---|---|
| Raw `fraudTrain.csv` / `fraudTest.csv` absent | High | Notebook cannot be rerun end to end | Keep fingerprints and derived artifacts; document the boundary |
| `app/node_modules` present but excluded | Low | Large dependency tree in the folder | Reinstall from `package-lock.json`; do not ship it |
| 188 intentional duplicate groups | Low | 25.90 MB of mirrored assets | Required by the app; do not deduplicate blindly |
| `data/raw/` contains notebook dumps, not raw transactions | Medium | The folder name can mislead | Rename mentally to “working extracts”; documented here |

## Keep / do not ship

- **Ship:** `app/src`, `app/public`, `powerbi`, `reports`, `figures`, `tables`, `logs`, `docs`, `analytics`, `tests`, notebook.
- **Do not ship:** `app/node_modules`, `app/dist`, `__pycache__`, transient Vite caches.
- **Preserve in place:** all 129 PNGs, 7 HTMLs, 46 CSVs and the six files in `logs/`; the four provenance logs are the evidence base, while `build.log` and `ui_smoke.log` are verification records.
