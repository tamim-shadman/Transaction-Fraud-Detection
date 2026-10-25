# Fraud Evidence Console & Analytics Platform

[![CI & Delivery QA](https://github.com/tamim-shadman/Transaction-Fraud-Detection/actions/workflows/ci.yml/badge.svg)](https://github.com/tamim-shadman/Transaction-Fraud-Detection/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/tamim-shadman/Transaction-Fraud-Detection/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/tamim-shadman/Transaction-Fraud-Detection/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Security Policy](https://img.shields.io/badge/Security-Policy-red.svg)](SECURITY.md)
[![Contributing](https://img.shields.io/badge/Contributing-Guidelines-orange.svg)](CONTRIBUTING.md)
[![Accessibility: WCAG 2.2 AA](https://img.shields.io/badge/Accessibility-WCAG%202.2%20AA-brightgreen.svg)](reports/phase4_accessibility_report.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178c6.svg)](app/tsconfig.json)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](app/package.json)
[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.12%20%7C%203.14-3776ab.svg)](requirements.txt)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed.svg)](Dockerfile)
[![Tests Passing](https://img.shields.io/badge/Tests-347%20passing%20(100%25)-success.svg)](reports/phase7_release_validation.md)

A production-hardened, source-backed reconstruction of the Sparkov card-fraud research notebook: an **advanced React analytics application with dual Exploration & Presentation modes**, a **Power BI enterprise import pack**, and a **340-check automated audit and Playwright regression suite**. Every displayed number is derived from the notebook, its 46 CSV tables, 129 figures, or its execution run logs.

> **What this is not:** a native Power BI report file. No Power BI authoring runtime exists on non-Windows/headless cloud systems, so there is no proprietary `.pbix` or `.pbip`. The React web app is the functional, browser-verified simulation platform; the `powerbi/` folder is an enterprise import-ready reproduction pack with 71 tables, 137 DAX measures, 34 relationships, and 20 page layouts.

## At a glance

| Item | Value |
|---|---:|
| Transactions analysed | **1,852,394** |
| Fraud events | **9,651** (0.5210%) |
| Graded findings | **64** — 30 strong, 27 supports, 6 caveat, 1 weak |
| Research initiatives | **7 projects** (`PROJ-01` to `PROJ-07`) across 9 phases (`P0` to `P8`) |
| Source artifacts | **129 PNG + 7 HTML + 46 CSV** |
| Notebook | **66 cells** (33 code, 31 with output, 0 errors) |
| Application modes | **Dual Experience**: Exploration Mode (deep technical audit) + Presentation Mode (guided narratives & briefings) |
| Application | **28 routed views** with filters, search, command palette, 7-stage walkthroughs, presentation slides, report composer, system operations console, drill-through, keyboard sorting, and triple exports |
| Metric & Contract tests | **196 / 196** metric checks · **144 / 144** contract checks (**100% PASS**) |
| Interactive & E2E flows | **18 / 18** functional and storytelling flows passed with 0 console errors |
| Browser matrix | **200 route/viewport measurements** across 10 distinct resolutions (0 px overflow, 0 console errors) |
| Performance benchmarks | **118 ms** avg FCP · **111 ms** avg table sort latency · **<190 MB** heap |
| Power BI pack | **71 CSVs**, **34 relationships**, **137 DAX measures**, **20 page specs**, **734 date rows** |

## What is in this repository

| Path | Contents |
|---|---|
| `fraud_eda_colab(1).ipynb` | Executed research notebook — canonical analytical source |
| `tables/` | 46 generated analysis CSV tables |
| `figures/` | 129 PNG figures and 7 interactive HTML artifacts |
| `logs/` | Execution logs, run telemetry, and provenance files |
| `analytics/` | Dataset build pipeline, research configuration, and evidence layer generator |
| `app/` | React 18 + TypeScript + Vite application (WCAG 2.2 AA compliant, dark/light theme, dual-mode) |
| `powerbi/` | Enterprise star/snowflake schema (71 CSVs, 137 DAX measures, relationships, theme) |
| `reports/` | Comprehensive Phase 4 & Phase 5 audit, storytelling methodology, export validation, and test reports |
| `tests/` | Metric validator, contract validator, interactive E2E flows, and performance profilers |
| `docs/` | Quick start, user guide, and glossary |

The web application is fully static. It loads `app/public/data/manifest.json`, lazily loads `analysis.json` and `notebook.json`, fetches the 46 per-table JSON files on demand, and loads the evidence files per route. There is no external database or runtime backend API required.

## The Application Pages & Modes

### 1. Presentation & Storytelling Modality
| Route | View Name | Purpose & Workflow |
|---|---|---|
| `/` | **Project Discovery Center** | Five-question orientation, featured initiatives (`PROJ-01`, `PROJ-04`, `PROJ-06`), and instant entry points. |
| `/walkthrough` | **Guided Project Walkthrough** | Interactive 7-stage research narrative (Problem $\to$ Approach $\to$ Implementation $\to$ Evidence $\to$ Interpretation $\to$ Results $\to$ Lessons) across all 7 projects with stepper navigation and keyboard controls (`←` / `→`). |
| `/presentation` | **Executive Presentation Mode** | Distraction-free 10-slide deck with live metrics, speaker notes drawer (`N`), fullscreen (`F`), and exit controls (`Esc`). |
| `/reports` | **Interactive Report Composer** | Drag/reorder report assembler supporting 5 templates (Executive Summary, Technical Dossier, Model Benchmark, Data Quality Audit, Portfolio Matrix) with live paper preview and Print/PDF, Markdown, and JSON export. |
| `/refresh` | **Centralized Data Refresh Center** | 6-stage transactional refresh pipeline with SHA-256 fingerprinting (185 sources, 24.35 MB), pre-flight contract assertions, inventory search, and audit history. |
| `/snapshots` | **Historical Snapshots Explorer** | Longitudinal checkpoint comparison between Baseline and Phase 6 Production with absolute ($\Delta$) and relative ($\% \Delta$) metrics and schema evolution cards. |
| `/scenarios` | **What-If Scenario Lab** | Evidence-grounded simulation of Review Capacity ($k = 0.1\% \dots 5.0\%$), investigator labor economics, classification thresholds, and workload volume scaling. |
| `/copilot` | **Evidence-Grounded Analytics Copilot**| Safe query allowlist natural-language Q&A with formula breakdowns, 5-tier evidence citations, and zero runtime code execution. |
| `/operations` | **System Operations & Health Console** | Real-time liveness, readiness, 46-table data integrity probes, storage profiling, and on-demand diagnostics. |

### 2. Exploration & Deep-Dive Modality
| Group | Routes |
|---|---|
| Command | `/` Overview · `/portfolio` Project Portfolio · `/insights` Insights |
| Intelligence | `/refresh` Refresh center · `/snapshots` Snapshots · `/scenarios` Scenario lab · `/copilot` Copilot · `/operations` Operations |
| Evidence | `/data-audit` · `/distributions` · `/interactions` · `/temporal` · `/advanced` · `/statistics` · `/features` |
| Decision | `/model` · `/economics` · `/experiments` |
| Investigate | `/lineage` Evidence map · `/logs` Run logs · `/explore` Data explorer |
| Outputs | `/findings` Findings ledger · `/artifacts` Artifacts & notebook |
| Reference | `/metrics` Metric catalog · `/program` Program profile |

### 3. Cross-Cutting Capabilities
- **Command Palette & Global Search (`Ctrl+K`)**: Quick actions (`Start Walkthrough`, `Launch Presentation`, `Open Reports`, `Browse Portfolio`) alongside fuzzy entity search over 24 pages, 7 projects, 155 metrics, and 64 findings.
- **Shareable Views & Saved Workspaces**: Copy permanent analytical URLs with filter state, or save/restore named analytical workspaces stored locally in browser `localStorage`.
- **5-Tier Evidence Governance**: Explicit badges categorizing figures as `Directly verified`, `Recomputed`, `Reported`, `Inferred`, or `Unavailable`.

---

## Verified Commands & Runbook

### 1. Install & Run Application
```powershell
cd app
npm.cmd install
npm.cmd run dev
```
Open **http://127.0.0.1:4173** in Google Chrome or Edge.

### 2. Production Typecheck & Build
```powershell
cd app
npm.cmd run typecheck     # 0 errors
npm.cmd run build         # ~6.6s production bundling
npm.cmd run preview
```

### 3. Run Automated Validation & E2E Suites
From the repository root:
```powershell
python tests\validate_phase6_engine.py    # 7 Phase 6 automated engine & math checks (100% PASS)
python tests\test_phase6_interactive.py   # 6 Phase 6 browser E2E flows (100% PASS)
python tests\validate_phase2.py           # 144 contract & schema checks (100% PASS)
python tests\validate_metrics.py          # 196 mathematical metric checks (100% PASS)
python tests\test_interactive_flows.py    # 12 Playwright functional E2E flows (100% PASS)
python tests\test_phase5_interactive.py   # 6 Phase 5 storytelling & presentation flows (100% PASS)
python tests\measure_phase4_performance.py # 20 route performance profiles + sort benchmark
python tests\run_comprehensive_browser_qa.py # 200 viewport layout evaluations
```

### 4. Execute Automated Refresh & Power BI Export
```powershell
python analytics\refresh_engine.py --action scan       # Discover & hash 185 source artifacts
python analytics\refresh_engine.py --action refresh    # Execute 6-stage transactional refresh
python analytics\refresh_engine.py --action snapshot   # Capture immutable historical snapshot
python analytics\build_phase2_data.py                  # Regenerate static web evidence JSONs
python powerbi\build_powerbi_pack.py                   # Regenerate 71 CSVs, 137 DAX, and manifest.json
```

### 5. Phase 7 Deployment, Operations & Disaster Recovery
```powershell
# 1. Pre-flight environment and configuration validation
python scripts\config_loader.py --validate

# 2. Run multi-probe health diagnostics (liveness, readiness, data integrity)
python scripts\health_check.py --type all

# 3. Start hardened multi-threaded production operational server
python scripts\server.py

# 4. Create cryptographically hashed backup archive with embedded manifest
python scripts\backup_manager.py --action create --label "production_checkpoint"

# 5. Run automated disaster recovery rehearsal in isolated sandbox
python tests\test_backup_recovery.py

# 6. Profile workspace storage and preview safe ephemeral cleanup
python scripts\storage_manager.py --action profile
python scripts\storage_manager.py --action cleanup --dry-run

# 7. Build release package with secret scan and SBOM generation
python scripts\build_release.py

# 8. Run full Phase 7 deployment and operations verification test suite (7/7 PASS)
python tests\test_phase7_deployment.py

# 9. Docker Containerized Deployment
docker compose up -d
```

---

## Headline Results

| Metric | Value | Read it with |
|---|---:|---|
| Final test PR-AUC | **0.5575** | Cross-boundary OOD estimate |
| Final test ROC-AUC | **0.9677** | Ranking quality, not calibration |
| Walk-forward validation PR-AUC | **0.9510 ± 0.0152** | In-domain estimate |
| Same-fold test PR-AUC | **0.4726 ± 0.0761** | Cross-boundary estimate |
| OOD transfer gap | **0.4785** | Positive = transfer loss |
| Capture@1% recall / USD share | **65.45% / 68.70%** | 5,557 reviews |
| Capture@5% recall / USD share | **86.20% / 93.42%** | 27,786 reviews |
| Cost-min threshold (at $5/FP) | **0.00001** | 84.24% recall; $92,043.87 missed fraud USD |
| Severe / moderate PSI | **7 / 1 of 27** | Month encodings are calendar artifacts |
| High-risk combination | **22.08% fraud, 42.37× lift** | Descriptive, n = 2,274 |
| Flagged weekly anomaly | **2019-01-20, 1.4642%, z = 4.15** | Robust z over 105 weeks; descriptive, not a defect |
| Artifact provenance | **173 verified / 9 inferred** | Verified = located in a notebook write line |
| Operational Health Status | **100% HEALTHY** | Liveness, Readiness, Data Integrity verified |
| Workspace Capacity | **277.37 MB / 500 MB** | 55.4% free headroom |

---

## Important Boundaries & Caveats

1. **Raw inputs are absent (C1–C5).** The raw `fraudTrain.csv` and `fraudTest.csv` (>500MB) are intentionally excluded from Git. All tables and metrics are verified from executed outputs.
2. **Test is OOD.** The test split starts 48 seconds after the training split. Never quote test PR-AUC alone.
3. **Reconstructed Single-Seed Baseline.** Recorded metrics represent single-seed runs; no cross-environment generalization claim is invented.
4. **Power BI Deliverable.** The Power BI pack provides 71 CSV tables, 137 DAX measures, and 34 relationships for Microsoft Power BI Desktop. The web application operates as a standalone simulation.
5. **Isolated Recovery Invariant.** The disaster recovery system restores archives into an isolated sandbox (`backups/rehearsal_sandbox/`); canonical evidence is never overwritten without explicit `--force` confirmation.

---

## Documentation Index

| Operational & Phase 7 Document | Description |
|---|---|
| `docs/installation_and_setup.md` | Standardized environment prerequisites, installation commands, and verified startup options |
| `docs/deployment_and_packaging.md` | Multi-stage Docker packaging, non-containerized delivery, and artifact classification |
| `docs/environment_configuration.md`| Complete reference for all `.env` operational variables, profiles, and path resolution |
| `docs/release_process.md` | Release lifecycle SOP, code freeze, SBOM validation, checksum verification, and rollback |
| `docs/deployment_runbook.md` | Pre-flight checklists, 10-stage production deployment sequence, and emergency recovery |
| `docs/backup_and_restore.md` | RPO/RTO specifications, backup creation, manifest verification, and disaster recovery |
| `docs/troubleshooting.md` | Comprehensive diagnostic guide for port collisions, execution policies, and container health |
| `reports/phase7_deployment_baseline.md` | Initial baseline audit of runtime, delivery architecture, defects, and remediation plan |
| `reports/phase7_environment_strategy.md`| Environment separation strategy between development, automated testing, and production |
| `reports/phase7_ci_pipeline.md` | 4-stage GitHub Actions CI/CD quality gates, data safety rules, and validation criteria |
| `reports/phase7_observability_design.md` | Health probe design (`/health`, `/health/ready`, `/health/data`), structured JSON logging, ops view |
| `reports/phase7_backup_and_recovery.md` | Data persistence inventory, cryptographic manifest hashing, and rehearsal recovery test results |
| `reports/phase7_storage_management.md` | Workspace capacity profile (277 MB), growth vector mitigation, and dry-run cleanup safeguards |
| `reports/phase7_dependency_review.md` | `npm audit` findings threat modeling, license compliance inventory, and SBOM specification |
| `reports/phase7_capacity_validation.md` | Workload throughput benchmarks: hashing (744 MB/s), simulation (9.98M ops/s), parsing |
| `reports/phase7_release_validation.md` | Full-stack test execution matrix (448/448 checks passed) and release readiness sign-off |

| Phase 5 & Phase 6 Document | Description |
|---|---|
| `reports/phase6_refresh_architecture.md` | 6-stage transactional refresh pipeline, SHA-256 fingerprinting, contracts, and staging isolation |
| `reports/phase6_snapshot_model.md` | Dataset versioning, immutable JSON snapshots, schema evolution, and longitudinal delta metrics |
| `reports/phase6_scenario_methodology.md` | What-If simulation methodology: piecewise empirical interpolation, capacity economics, thresholds |
| `reports/phase6_analytics_copilot_design.md` | Zero-code-execution copilot architecture, deterministic query allowlist, and 5-tier citations |
| `reports/phase5_storytelling_methodology.md` | 7-stage narrative framework, evidence classification, and factual integrity safeguards |
| `reports/phase5_feature_implementation.md` | Implementation report of walkthroughs, presentation mode, report composer, and saved views |
| `powerbi/reproduction_and_validation_guide.md` | Power BI Desktop import instructions, DAX measures, and star schema relationships |

---

## Source and Provenance

Source dataset: `kartik2112/fraud-detection` (Sparkov simulator). The notebook fingerprints both raw files by 16-character SHA-256 prefix and records their sizes. All downstream tables, figures, app data, and Power BI CSVs are derived from the executed notebook's outputs. The notebook, `tables/`, `figures/`, and `logs/` are the canonical evidence; `app/public/data/` and `powerbi/data/` are generated copies.
