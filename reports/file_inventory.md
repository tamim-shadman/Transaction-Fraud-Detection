# File inventory

Generated: **2026-10-20T17:57:53**  
Root: `C:\Docusign\Code\Personal_Work\Transaction Fraud detection\outputs`  
Files inventoried: **851**  
Total size: **140.35 MB**  
Excluded from the walk: `app/node_modules`, `app/dist`, `.git`, `__pycache__`, `.vite`.

The machine-readable inventory is `reports/file_inventory.csv` with a full SHA-256 digest for every file. This page summarises it and flags byte-identical copies. The two inventory files themselves are excluded from their own walk.

## Inventory by category

| Category | Files | Size (MB) | Share of bytes |
| --- | ---: | ---: | ---: |
| Tests & evidence | 122 | 83.56 | 59.5% |
| Source figures | 136 | 20.08 | 14.3% |
| App figure mirror | 129 | 16.64 | 11.9% |
| Notebook mirror | 1 | 3.87 | 2.8% |
| Source notebook | 1 | 3.87 | 2.8% |
| App HTML mirror | 7 | 3.44 | 2.4% |
| Application data layer | 57 | 3.37 | 2.4% |
| App thumbnail mirror | 129 | 1.56 | 1.1% |
| Processed data | 18 | 0.97 | 0.7% |
| Power BI pack | 77 | 0.87 | 0.6% |
| Application source | 37 | 0.59 | 0.4% |
| Application static | 51 | 0.45 | 0.3% |
| Reports | 19 | 0.41 | 0.3% |
| Source tables | 46 | 0.40 | 0.3% |
| Data pipeline | 3 | 0.16 | 0.1% |
| Run logs | 6 | 0.06 | 0.0% |
| Root | 6 | 0.06 | 0.0% |
| Documentation | 2 | 0.02 | 0.0% |
| Utility scripts | 4 | 0.00 | 0.0% |

## Largest files

| Path | Kind | Size (MB) |
| --- | --- | ---: |
| app/public/artifacts/notebook/fraud_eda_colab.ipynb | Jupyter notebook | 3.87 |
| fraud_eda_colab(1).ipynb | Jupyter notebook | 3.87 |
| app/public/artifacts/html/phase4_pca_3d.html | Interactive HTML | 2.79 |
| figures/phase4_pca_3d.html | Interactive HTML | 2.79 |
| tests/phase2_shots/laptop-findings.png | PNG figure | 1.78 |
| tests/phase2_shots/desktop-findings.png | PNG figure | 1.78 |
| tests/ui_check/desktop-findings.png | PNG figure | 1.68 |
| tests/phase2_audit_shots/desktop-findings.png | PNG figure | 1.68 |
| tests/phase2_shots/tablet-findings.png | PNG figure | 1.61 |
| tests/phase2_shots/mobile-findings.png | PNG figure | 1.58 |
| tests/phase2_audit_shots/mobile-findings.png | PNG figure | 1.51 |
| tests/ui_check/mobile-findings.png | PNG figure | 1.51 |
| tests/phase2_shots/desktop-artifacts.png | PNG figure | 1.37 |
| tests/phase2_shots/desktop-insights.png | PNG figure | 1.27 |
| tests/phase2_shots/laptop-insights.png | PNG figure | 1.19 |
| tests/phase2_shots/laptop-artifacts.png | PNG figure | 1.14 |
| tests/phase2_shots/laptop-program.png | PNG figure | 1.14 |
| tests/phase2_shots/desktop-program.png | PNG figure | 1.13 |
| tests/ui_check/desktop-artifacts.png | PNG figure | 1.11 |
| tests/phase2_audit_shots/desktop-artifacts.png | PNG figure | 1.11 |

## Intentional mirrors

188 content groups contain more than one byte-identical file. The redundant copies account for **25.90 MB** after keeping one canonical copy per group. Almost all of this is the deliberate `figures/` → `app/public/artifacts/figures/` mirror used by the dashboard. Do not deduplicate those directories unless the app's asset paths are rewritten.

| Canonical path | Copies | Copy size (MB) | Duplicated paths |
| --- | ---: | ---: | --- |
| fraud_eda_colab(1).ipynb | 2 | 3.87 | app/public/artifacts/notebook/fraud_eda_colab.ipynb |
| figures/phase4_pca_3d.html | 2 | 2.79 | app/public/artifacts/html/phase4_pca_3d.html |
| tests/phase2_audit_shots/mobile-findings.png | 2 | 1.51 | tests/ui_check/mobile-findings.png |
| figures/phase4_parallel_coords.png | 2 | 1.05 | app/public/artifacts/figures/phase4_parallel_coords.png |
| figures/phase4_tsne_p30.png | 2 | 0.62 | app/public/artifacts/figures/phase4_tsne_p30.png |
| figures/phase4_andrews.png | 2 | 0.60 | app/public/artifacts/figures/phase4_andrews.png |
| figures/phase3_daily_rolling.png | 2 | 0.56 | app/public/artifacts/figures/phase3_daily_rolling.png |
| figures/phase4_tsne_p50.png | 2 | 0.55 | app/public/artifacts/figures/phase4_tsne_p50.png |
| figures/phase2_map_scatter.html | 2 | 0.54 | app/public/artifacts/html/phase2_map_scatter.html |
| figures/phase2_pairplot.png | 2 | 0.52 | app/public/artifacts/figures/phase2_pairplot.png |
| figures/phase4_umap_nn15_md0.5.png | 2 | 0.50 | app/public/artifacts/figures/phase4_umap_nn15_md0.5.png |
| figures/phase4_tsne_p100.png | 2 | 0.49 | app/public/artifacts/figures/phase4_tsne_p100.png |

## Integrity notes

- Inventory hash: every row carries a full SHA-256 digest, not the 16-character prefix used by the original notebook fingerprint.
- All inventoried files were readable; no permission or open-handle failures occurred.
- The two raw Kaggle CSVs referenced in `logs/data_fingerprint.json` are **not** in the inventory because they are absent from the workspace.
- `app/dist` is a generated production bundle and is intentionally excluded from the per-file inventory. Its size is reported in `folder_audit.md`.
- Screenshots under `tests/ui_check/` are test evidence, not analytical artifacts.
