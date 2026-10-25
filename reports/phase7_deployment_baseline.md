# Phase 7 Deployment Baseline & Delivery Architecture Audit

**System**: Transaction Fraud Detection Analytics Platform & Power BI Simulation  
**Scope**: Production Delivery Engineering, Runtime Audit, Packaging Assessment, Infrastructure Readiness, and Operational Diagnostics  
**Date**: October 2026  
**Auditor**: Principal Platform Engineer, Release Engineer & DevOps Architect  

---

## 1. Executive Summary

This deployment baseline audit establishes the actual runtime, operational architecture, dependency footprint, storage mechanisms, and release posture of the **Transaction Fraud Detection Analytics Platform** following the completion of Phases 1 through 6.

The platform is currently operating as a high-performance, source-backed analytical application comprising:
1. A **pure client-side React 18 single-page application** (Vite 8.3.4, TypeScript 7.0.2, ECharts 5.6.0) hosting 27 routed views across Dual Exploration and Presentation modalities.
2. A **canonical research evidence repository** containing 46 CSV tables, 129 PNG figures, 7 interactive HTML maps, execution run logs, and the canonical Jupyter notebook (`fraud_eda_colab(1).ipynb`).
3. A **Python 3 data intelligence and validation pipeline** (`analytics/` and `tests/`) responsible for static evidence extraction, 6-stage transactional data refresh, SHA-256 fingerprinting, historical snapshotting, and 347 automated contract, metric, and engine assertions.
4. An **enterprise Power BI reproduction pack** in `powerbi/` with 71 CSV tables, 137 DAX measures, and 34 relationship specifications.

Prior to Phase 7, the application lacked standardized containerization, formal environment separation (dev/test/prod), automated CI/CD workflows, structured operational logging, native health-check probes, automated backup/recovery rehearsal, and supply-chain governance manifests.

This audit provides a factual analysis of the existing delivery architecture, catalogs confirmed defects and operational risks, establishes the runtime baseline, and defines the highest-priority engineering corrections implemented in Phase 7.

---

## 2. Runtime & Delivery Architecture Matrix

| Dimension | Current Baseline | Architecture Assessment & Operational Posture |
|---|---|---|
| **Frontend Framework & Build** | React 18.3.1, TypeScript 7.0.2, Vite 8.3.4 | Static SPA bundled via Rollup/Vite. Production build produces optimized HTML/JS/CSS in `app/dist/` in ~1.5 seconds. Zero runtime node backend required. |
| **Backend & Process Model** | Python 3.14.4 offline batch pipeline; no standing daemon | Currently, the application is served via Vite dev server (`vite`) or Vite preview (`vite preview`). No dedicated production HTTP server or process supervisor is configured. |
| **Startup Commands** | `cd app; npm.cmd run dev` (dev)<br>`cd app; npm.cmd run build; npm.cmd run preview` (preview) | Port 4173 hardcoded in `package.json` scripts (`--port 4173`). No configurable environment-driven host or port selection. |
| **Data Processing Entry Points** | `analytics/build_dataset.py`<br>`analytics/build_phase2_data.py`<br>`analytics/refresh_engine.py`<br>`powerbi/build_powerbi_pack.py` | Transactional 6-stage refresh with SHA-256 fingerprinting across 185 source files (24.35 MB). Scripts run in user workspace and write directly to `app/public/data/`. |
| **Storage Architecture** | File-based static JSON store in `app/public/data/` | Stores `manifest.json`, `analysis.json`, `notebook.json`, 46 per-table JSONs, `phase2/` intelligence payloads, and immutable `snapshots/`. No SQL database required. |
| **Configuration & Environment Variables** | None configured. Hardcoded defaults in Vite and Python scripts. | Missing `.env.example`, `.env` loaders, and environment-variable validation. All endpoints assume relative paths under Vite's `BASE_URL`. |
| **Authentication & Authorization** | None (Single-tenant local workstation model) | Public read-only analytical explorer. No credentials, tokens, or session stores required. Safe for local, internal VPC, or static hosting. |
| **Docker / Containerization** | **None** | No `Dockerfile`, `.dockerignore`, or `docker-compose.yml`. Missing isolated container delivery workflow. |
| **CI / CD Automation** | **None** | No `.github/workflows/` or pipeline configurations. Release packaging is entirely manual. |
| **Deployment Manifests** | **None** | No Helm charts, Kubernetes manifests, or systemd service unit files. |
| **Current Test Commands** | `python tests/validate_metrics.py`<br>`python tests/validate_phase2.py`<br>`python tests/validate_phase6_engine.py`<br>`python tests/test_interactive_flows.py` | High mathematical test coverage (347 checks pass with 100%), but lacking automated deployment, configuration, backup, and health-check tests. |
| **Dependency Management** | `app/package.json` (npm) for frontend; system Python 3.14 for data tooling. | Missing root `requirements.txt` or pinned Python virtual environment specification. System Python packages used ad-hoc. |
| **Database Migrations** | Static JSON schemas versioned in `snapshots/` | No relational database. Schema evolution is tracked via snapshot diffs (`schema_diff.added_columns`, etc.). |
| **Log Destinations** | Local flat files in `logs/` (`findings.md`, `run_telemetry.json`, `data_fingerprint.json`) | No centralized logging framework, no log level controls, no log rotation, and no structured JSON logging format. |
| **Health-Check Endpoints** | **None** | No HTTP `/health`, `/health/ready`, or `/health/data` probes. External supervisors cannot poll liveness or data integrity. |
| **Build Artifacts** | `app/dist/` (static assets) | Build outputs include JS chunks, CSS bundles, font assets, and static copies of `app/public/`. |
| **Static & Media Dependencies** | 129 PNG figures, 7 Plotly HTML maps in `figures/` | Artifacts range from 15 KB to 8.5 MB. Large HTML files with inline GeoJSON require proper compression and MIME types. |
| **External Service Dependencies** | Zero external API or cloud service dependencies | 100% self-contained. Does not call third-party APIs, CDNs, or remote databases. High resilience against network partition. |
| **Power BI Integration** | `powerbi/data/` (71 CSVs), `powerbi/dax/` (137 DAX) | Import-ready star/snowflake schema for Microsoft Power BI Desktop. Generated via `powerbi/build_powerbi_pack.py`. |
| **Operating System Assumptions** | Windows 11 with PowerShell (`npm.cmd`) | Scripts use Windows-compatible paths, but rely on standard POSIX forward slashes in relative paths. Git not in default system PATH. |

---

## 3. Detailed Audit of Repository & Source Configuration

### 3.1 Hardcoded Values and Configuration Coupling
1. **Hardcoded Port 4173**: In `app/package.json`, scripts hardcode `--port 4173`:
   - `"dev": "vite --host 127.0.0.1 --port 4173"`
   - `"preview": "vite preview --host 127.0.0.1 --port 4173"`
   - *Impact*: Collides if port 4173 is already bound by another service on the host. Needs configurable `APP_PORT` and `APP_HOST`.
2. **Hardcoded Relative Paths in Python**:
   - `analytics/refresh_engine.py`, `analytics/build_dataset.py`, and `powerbi/build_powerbi_pack.py` use `Path(__file__).resolve().parents[1]` to locate project root.
   - *Assessment*: Valid for workspace execution, but requires explicit environment variable overrides (`DATA_DIR`, `LOG_DIR`, `OUTPUT_DIR`) when deployed in containerized or split-mount environments.
3. **Execution Policy Restriction on PowerShell**:
   - Running `npm` fails due to PowerShell script execution policy (`npm.ps1 cannot be loaded because running scripts is disabled`).
   - *Impact*: Developers must run `npm.cmd` directly on Windows or configure execution policy.

### 3.2 Secret and Credential Inspection
- An exhaustive scan was performed searching for private keys, AWS access keys, passwords, database URIs, and authentication tokens across all files in `app/`, `analytics/`, `scripts/`, `tables/`, `logs/`, and `reports/`.
- **Result: 0 secrets detected.**
- The application is completely free of hardcoded credentials. All analytical data is derived from synthetic simulation (`kartik2112/fraud-detection`).
- **Defect Identified**: Lack of `.env.example` leaves future operators without a standard template for configuring operational flags.

### 3.3 Storage Footprint & Artifact Growth Audit
- **Total Workspace Size**: ~75 MB (excluding `node_modules` ~130 MB and `.git`).
  - `figures/`: 129 PNGs + 7 HTML maps (~32.4 MB).
  - `tables/`: 46 CSV tables (~438 KB).
  - `app/public/data/`: Static JSON evidence store (~12.8 MB).
  - `app/dist/`: Production build output (~1.4 MB gzipped assets).
  - `logs/`: Flat text logs and telemetry (~1.2 MB).
- **Risk**: Staging directories (`.staging/`), backup archives, and build caches could grow without explicit retention limits and automated cleanup policies.

---

## 4. Confirmed Defects vs. Potential Concerns

### Confirmed Defects (Requiring Immediate Remediation in Phase 7)
1. **DEF-01: No Containerization or Deployment Specification**
   - The project has no `Dockerfile`, `docker-compose.yml`, or container build manifest. Deployment is restricted to manual local terminal execution.
2. **DEF-02: Absence of Environment Configuration Mechanism**
   - No `.env` loader, `.env.example`, or environment variable validation at startup.
3. **DEF-03: No Operational Health-Check Probes**
   - No HTTP endpoints or CLI commands exist to test liveness, readiness, data integrity, or refresh status for container orchestrators or monitoring agents.
4. **DEF-04: No Automated Backup, Restore Rehearsal, or Verification Script**
   - Historical evidence files in `tables/`, `figures/`, `logs/`, and `snapshots/` are vulnerable to accidental deletion or pipeline corruption without an automated backup manager.
5. **DEF-05: No CI/CD Quality Pipeline**
   - No GitHub Actions or CI pipeline exists to enforce typechecks, test execution, contract validation, and packaging rules on new commits.
6. **DEF-06: Missing Python Dependency Declarations**
   - No root `requirements.txt` or `requirements-prod.txt` exists to document exact Python dependencies required to run pipelines and test suites.

### Potential Concerns (Monitored & Documented)
1. **CON-01: Port Conflicts**: Running multiple instances locally could conflict on port 4173 if not dynamically configurable.
2. **CON-02: Windows Script Execution Policy**: Windows users invoking `npm` instead of `npm.cmd` will encounter execution policy errors.
3. **CON-03: In-Memory JSON Parsing for Large Views**: While individual tables are small (<100 KB), fetching multiple tables simultaneously on low-spec hardware could cause momentary main-thread pauses.

---

## 5. Phase 7 Remediation Plan & Delivery Architecture

To address these findings, Phase 7 implements a robust, modular delivery architecture:
1. **Standardized Environment Management**:
   - Provide sanitized `.env.example` and a centralized Python/Node configuration loader (`scripts/config_loader.py`) with strict startup validation.
2. **Multi-Stage Containerization**:
   - Multi-stage `Dockerfile` (Node 22 build stage + Python 3 slim runtime stage with non-root user `appuser`).
   - `docker-compose.yml` supporting persistent volume mounts for logs, backups, and data, with environment variable bindings and integrated healthchecks.
3. **Dedicated Operational Server & Health Probes**:
   - Lightweight production HTTP server (`scripts/server.py`) serving static assets with SPA routing fallback, plus `/health`, `/health/ready`, `/health/data`, and `/api/status`.
   - Standalone CLI health probe (`scripts/health_check.py`) with exit codes (0/1) for container orchestrators.
4. **Interactive In-App Operations View**:
   - Add `/operations` view into the React web console with real-time liveness, data readiness (auditing 46 tables and master SHA-256 fingerprint), refresh audit, storage breakdown, and event logging.
5. **Automated Backup & Disaster Recovery**:
   - Implement `scripts/backup_manager.py` with versioned archives, SHA-256 manifests, isolated restoration, and retention rules.
   - Verified via end-to-end rehearsal test (`tests/test_backup_recovery.py`).
6. **Storage Management & Cost Control**:
   - Implement `scripts/storage_manager.py` with directory profiling, dry-run safety, and cleanup of ephemeral artifacts while protecting canonical source files.
7. **Automated CI/CD Quality Gates & Release Packaging**:
   - Configure `.github/workflows/ci.yml` covering linting, typechecking, frontend build, metric validation, and Phase 7 deployment verification.
   - Implement `scripts/build_release.py` producing verified, clean release zip archives with SHA-256 checksums and software bill of materials (SBOM).
8. **Operational Runbooks & Handover Documentation**:
   - Complete documentation suite in `docs/` and reports in `reports/`.
