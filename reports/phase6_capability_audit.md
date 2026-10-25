# Phase 6 Capability Audit Report
### Automated Data Intelligence, Reproducible Analytics, What-If Simulation, and Evidence-Grounded Analytics Copilot

**System**: Transaction Fraud Detection Analytics Platform  
**Scope**: Source Discovery, Data Refresh Architecture, Historical Snapshots, Experiment Registry, Scenario Modeling, Analytics Copilot, Lineage, and Change Intelligence  
**Date**: October 2026  
**Auditor**: Principal Data Platform Engineer & Analytics Architect  

---

## 1. Executive Summary

Following Phases 1 through 5, the platform achieved high mathematical fidelity (340 verified metric and contract checks), responsive UI (200 browser viewport audits), production security hardening (CWE-1236 CSV formula injection sanitization), guided storytelling (`/walkthrough`), presentation mode (`/presentation`), and report publishing (`/reports`).

However, an audit of the underlying **data platform intelligence, refresh architecture, scenario simulation, and self-answering analytical capabilities** reveals key architectural opportunities:
1. **Refresh & Discovery Gap**: Data regeneration is purely an offline batch CLI operation (`build_dataset.py`, `build_phase2_data.py`). The dashboard lacks a centralized **Data Refresh Center** where users can inspect source origins, run on-demand validations, preview changes, observe processing stages, and review refresh history.
2. **Snapshot & Versioning Gap**: Processed analytical outputs overwrite `app/public/data/` in-place. There is no historical snapshot ledger or snapshot comparison view to observe metric drift, schema modifications, or record-count changes across pipeline runs.
3. **Experiment Reproducibility Classification**: While 26 experiment runs are cataloged across 5 evaluation families, they lack a formalized 4-tier reproducibility classification (*Reproducible from retained inputs*, *Partially reproducible*, *Historically documented*, *Insufficient evidence*) and execution manifests for controlled reruns.
4. **Scenario Simulation Gap**: The current `/economics` view presents static, observed review capacity curves ($k = 1\%$ to $5\%$). Users cannot explore hypothetical "what-if" scenarios (e.g., varying fraud review capacity, false positive investigation costs, operational wage rates, workload scaling, or pipeline runtime sensitivity) side-by-side with observed baselines.
5. **Grounded Analytics Copilot Gap**: The existing `SearchModal` (`Ctrl+K`) supports entity fuzzy-search and action navigation, but cannot answer natural language questions about the research data (e.g., *"What is the PR-AUC drop between in-domain validation and the OOD test split?"*, *"Which merchant category has the highest fraud dollar loss?"*, *"Explain the calculation of Catch@1%"*).
6. **Data Lineage & Freshness Gap**: While a 292-node directed acyclic graph exists in `Lineage.tsx`, nodes lack explicit freshness status badges, snapshot linkage, and direct drill-through from individual KPI cards.

---

## 2. Comprehensive Capability Matrix

| Capability | Current State in Repository | Identified Gap / Risk | Phase 6 Target Architecture | Source Files Involved |
|---|---|---|---|---|
| **Source Discovery** | Script scans `tables/`, `figures/`, `logs/`, and `notebook.ipynb` using hardcoded paths. | No checksum fingerprinting; no detection of new/modified files; no UI for inspecting discovered files. | Implement **SHA-256 File Fingerprinting** and dynamic directory discovery with inclusion/exclusion filters. | `analytics/refresh_engine.py`, `app/src/pages/Refresh.tsx` |
| **Data Refresh Center** | Two manual CLI scripts (`build_dataset.py`, `build_phase2_data.py`). | No UI workspace; no staging; no progress telemetry; no refresh history ledger. | Build a dedicated **Data Refresh Center** (`/refresh`) supporting discovery scans, staging, validation checks, and refresh audit log. | `app/src/pages/Refresh.tsx`, `analytics/refresh_engine.py` |
| **Incremental Processing** | Full batch re-write of all JSON and CSV outputs on every run. | High unnecessary I/O; potential partial corruption if script crashes mid-execution. | Staged updates: validate all inputs in temporary staging, atomic swap to production data, preserve last known good state. | `analytics/refresh_engine.py` |
| **Historical Snapshots** | Single current state overwritten in `app/public/data/`. | Cannot compare findings across different notebook runs or pipeline iterations; historical drift invisible. | Implement **Historical Snapshot Model** (`snapshot_id`, timestamp, fingerprint, metrics, schema diffs) and comparison UI. | `app/public/data/snapshots/`, `app/src/pages/Snapshots.tsx` |
| **Experiment Reproducibility** | 26 experiments in `experiments.json` categorized into 5 families. | Lacks formal reproducibility tiers; no rerun manifest or environment specification for reproduction. | Formalize **4-Tier Reproducibility Classification** and generate reproducible execution manifests. | `app/public/data/phase2/experiments.json`, `app/src/pages/Experiments.tsx` |
| **What-If Simulation Lab** | Static capture tables in `Economics.tsx` and `phase7_capture_at_k.csv`. | Reviewers cannot simulate operational changes (e.g., custom review queue caps, investigator hourly cost variations, workload volume scaling). | Build an interactive **Scenario Lab** (`/scenarios`) with side-by-side baseline vs scenario metrics and sensitivity charts. | `app/src/pages/ScenarioLab.tsx`, `app/src/lib/simulation.ts` |
| **Analytics Copilot** | Passive keyword search and command navigation in `SearchModal.tsx`. | Cannot answer analytical questions, explain formulas, or query metric tables with natural language. | Create an **Evidence-Grounded Analytics Copilot** with deterministic query allowlist, step-by-step math explanation, and evidence citations. | `app/src/components/Copilot.tsx`, `app/src/lib/copilotEngine.ts` |
| **Lineage & Freshness** | 292 nodes and 374 edges in `Lineage.tsx`. | Nodes do not indicate data freshness (current, stale, unknown); no drill-down from KPI cards to lineage origins. | Add **Evidence Freshness Indicators** and direct KPI-to-Lineage breadcrumbs. | `app/src/pages/Lineage.tsx`, `app/public/data/phase2/lineage.json` |
| **Change Intelligence** | Static anomaly flags in `anomalies.json`. | No in-app notification center for refresh outcomes, schema changes, or metric drifts. | Build an **Activity & Change Intelligence Center** with deduplicated alerts and next-action links. | `app/src/components/ActivityCenter.tsx` |
| **Power BI Interoperability** | 71 CSV tables in `powerbi/data/`. | Lacks tables for refresh history, snapshots, and scenario simulation assumptions. | Extend Power BI data pack with `fact_refresh_history.csv`, `fact_snapshot_meta.csv`, and `fact_scenario_assumptions.csv`. | `powerbi/build_powerbi_pack.py` |

---

## 3. High-Value Implementation Opportunities

### 3.1 Opportunity 1: Centralized Data Refresh Center (`/refresh`)
- **Objective**: Provide users with full visibility into pipeline health, discovered source files, checksum fingerprints, schema validation status, and refresh history.
- **Reliability Invariant**: Staging directory isolation ensures that if a parse or contract check fails, existing analytical data is never corrupted, and the last known good state is preserved.

### 3.2 Opportunity 2: Snapshot Model & Time-Travel Comparison (`/snapshots`)
- **Objective**: Archive analytical snapshots across pipeline runs and provide a side-by-side diffing interface to observe changes in row counts, null rates, model PR-AUC, and artifact additions.

### 3.3 Opportunity 3: Evidence-Grounded What-If Simulation Lab (`/scenarios`)
- **Objective**: Enable fraud managers to simulate operational parameters:
  - *Review Capacity & Cost Optimization*: Adjust daily queue review caps ($0.1\%$ to $5\%$) and investigator hourly rates ($\$15$ to $\$75$/hr) to compute net operational savings.
  - *Decision Threshold Sensitivity*: Shift fraud probability classification cutoffs ($0.00001$ to $0.99$) and observe precision, recall, and dollar loss trade-offs.
  - *Workload & Volume Scaling*: Project data ingestion times and storage footprint under $2\times$ to $10\times$ volume growth.
- **Governance Invariant**: Simulated metrics are visually and structurally isolated from measured values. Never overwrite empirical data with projections.

### 3.4 Opportunity 4: Evidence-Grounded Analytics Copilot
- **Objective**: Allow users to query the research program in plain English.
- **Safety Invariant**: Operates via a deterministic, read-only query allowlist. Never executes arbitrary code or manufactures hallucinations. Every response provides:
  1. The direct answer.
  2. The exact numerical value with units.
  3. The formula / calculation summary.
  4. The supporting evidence file and cell range.
  5. Actionable deep-links to relevant dashboard routes.

---

## 4. Verification & Testing Strategy

Each new capability will be validated through automated tests:
1. **Refresh Pipeline Tests**: Verify staging isolation, checksum change detection, duplicate row detection, error containment, and atomic swap.
2. **Snapshot Engine Tests**: Verify unique snapshot IDs, schema diffing accuracy, and metric delta calculations.
3. **Simulation Math Tests**: Verify formula correctness for Catch@k, cost minimization, and workload scaling.
4. **Copilot Query Safety Tests**: Verify allowlist query enforcement, rejection of invalid tables/columns, injection safety, and citation veracity.
5. **Interactive Browser Tests**: Playwright end-to-end execution of refresh trigger, snapshot comparison, what-if slider manipulation, and copilot dialogue.
