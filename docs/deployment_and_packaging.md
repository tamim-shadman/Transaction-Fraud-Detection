# Deployment & Packaging Guide

**System**: Transaction Fraud Detection Analytics Platform & Power BI Simulation  
**Document**: Technical Packaging Specification & Runtime Topologies  
**Audience**: Release Engineers, DevOps Architects, and Platform Operators  

---

## 1. Overview & Packaging Philosophy

The **Transaction Fraud Detection Analytics Platform** provides a dual-topology delivery package designed for high reproducibility, minimal runtime dependencies, and maximum data preservation.

Because the system combines an interactive browser console with a deterministic Python data intelligence engine, packaging must clearly separate:
1. **Application Code & Assets**: Pure, immutable frontend bundle and serving logic.
2. **Canonical Research Evidence**: Original CSV tables, figures, notebooks, and run logs.
3. **Durable State**: Historical snapshots and differential metadata.
4. **Regenerable Derived Data**: Static JSON files served to the browser.
5. **Ephemeral State**: Staging files, temporary caches, and diagnostic outputs.

The platform supports two official deployment topologies:
- **Topology A: Containerized Delivery (Docker / Docker Compose)**: Recommended for team environments, container hosts, Kubernetes, or internal VPCs.
- **Topology B: Non-Containerized Local Delivery (Node.js + Python)**: Recommended for local data science workstations, air-gapped systems, or standalone audit environments.

---

## 2. Persistence Architecture & Artifact Classification

Before packaging or deploying, all workspace files are classified across five distinct persistence categories:

| Category | Directories & Files | Reproducibility | Backup Priority | Cleanup Policy |
|---|---|---|---|---|
| **Original Source Data** | `tables/*.csv`<br>`figures/*.png`<br>`figures/*.html`<br>`fraud_eda_colab(1).ipynb` | **Irreplaceable** without re-running 1.85M transaction Sparkov model notebook. | **CRITICAL (P0)**: Protected by SHA-256 fingerprinting. | **NEVER DELETE**. Protected by read-only safeguards in cleanup scripts. |
| **Durable Application State** | `app/public/data/snapshots/*.json`<br>`powerbi/data/fact_snapshot_meta.csv` | **Durable**: Tracks longitudinal version history across releases. | **HIGH (P1)**: Included in daily backup archives. | Retained up to retention limit (default: 30 days or 10 snapshots). |
| **Reproducible Derived Data** | `app/public/data/manifest.json`<br>`app/public/data/analysis.json`<br>`app/public/data/tables/*.json`<br>`app/public/data/phase2/*.json`<br>`powerbi/data/*.csv` | **100% Regenerable** from canonical tables via `python analytics/build_dataset.py` and `python analytics/refresh_engine.py`. | **MEDIUM (P2)**: Backed up with releases, but safely regenerable. | Safe to overwrite via staged transactional atomic refresh. |
| **Diagnostic Data** | `logs/findings.md`<br>`logs/run_telemetry.json`<br>`logs/data_fingerprint.json`<br>`reports/*.md` | **Historical Evidence**: Records execution metrics and test audits. | **MEDIUM (P2)**: Retained for research traceability. | Rotate or archive when log directory exceeds storage limit. |
| **Temporary / Ephemeral Data** | `app/public/data/.staging/`<br>`scratch/`<br>`tmp/`<br>`app/dist/`<br>`*.tmp` | **Disposable**: Ephemeral scratchpads and intermediate build artifacts. | **NONE (P4)**: Excluded from backups and Docker images. | Automated cleanup removes files older than 24 hours. |

---

## 3. Topology A: Containerized Delivery (Docker)

### 3.1 Multi-Stage Build Architecture
The `Dockerfile` employs a multi-stage pattern:
1. **Builder Stage (`node:22-alpine`)**:
   - Executes deterministic `npm ci`.
   - Runs TypeScript strict validation (`tsc --noEmit`).
   - Produces optimized static assets in `app/dist/`.
2. **Runner Stage (`python:3.12-slim`)**:
   - Installs minimal production dependencies from `requirements-prod.txt`.
   - Creates an unprivileged user `appuser` (UID: 10001, GID: 10001).
   - Copies static assets, evidence tables, scripts, and logs.
   - Executes `scripts/server.py` as `appuser`.
   - Embeds native container healthcheck (`HEALTHCHECK CMD python scripts/health_check.py --type liveness`).

### 3.2 Building and Running with Docker
```bash
# Build production image
docker build -t fraud-analytics-console:latest .

# Run container in background on port 4173
docker run -d \
  --name fraud-console \
  -p 4173:4173 \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/backups:/app/backups \
  -v $(pwd)/app/public/data/snapshots:/app/app/public/data/snapshots \
  fraud-analytics-console:latest
```

### 3.3 Running with Docker Compose
```bash
# Start service in detached mode
docker compose up -d

# Verify container status and health
docker compose ps

# View real-time operational logs
docker compose logs -f fraud-console

# Stop service cleanly
docker compose down
```

---

## 4. Topology B: Non-Containerized Local Delivery

When container tools are unavailable, the platform runs directly on standard Node.js and Python runtimes.

### 4.1 Prerequisites
- **Node.js**: v18.0.0 or newer (v22 / v24 tested)
- **Python**: 3.10 or newer (3.12 / 3.14 tested)
- **Operating System**: Windows, Linux, or macOS

### 4.2 Installation & Build
```powershell
# 1. Install frontend dependencies
cd app
npm.cmd install    # or 'npm install' on Linux/macOS

# 2. Compile production bundle
npm.cmd run build  # executes 'tsc --noEmit && vite build'
cd ..

# 3. Validate environment configuration
python scripts/config_loader.py --validate
```

### 4.3 Production Serving Options
**Option 1: Python Hardened Operational Server (Recommended)**
```powershell
# Starts the multi-threaded server with /health, /health/ready, /health/data endpoints
python scripts/server.py
```
*Application available at:* `http://127.0.0.1:4173`

**Option 2: Vite Production Preview Server**
```powershell
cd app
npm.cmd run preview
```

---

## 5. Persistent Volume Mounts & Data Safety

When mounting external storage in production:
- Ensure the mount target has read/write permissions for UID 10001 (`appuser`).
- Never mount an empty volume over `/app/tables` or `/app/app/public/data` as this would mask canonical data files.
- Persistent mounts are strictly assigned to:
  - `/app/logs`
  - `/app/backups`
  - `/app/app/public/data/snapshots`
