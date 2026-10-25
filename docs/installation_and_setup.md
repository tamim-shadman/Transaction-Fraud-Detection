# Installation & Setup Guide

**System**: Transaction Fraud Detection Analytics Platform & Power BI Simulation  
**Document**: Standard Operating Procedure (SOP) — Environment Setup & Installation  
**Audience**: Developers, Data Engineers, and System Operators  

---

## 1. System Requirements

### Supported Runtimes
| Component | Supported Versions | Tested Version | Purpose |
|---|---|---|---|
| **Python** | 3.10, 3.11, 3.12, 3.13, 3.14 | **3.14.4** | Data pipeline, health checks, backup & server |
| **Node.js** | 18.x, 20.x, 22.x, 24.x | **v24.18.0** | Frontend compiler & package tooling |
| **npm** | 9.x, 10.x, 11.x | **11.16.0** | Package manager |
| **Docker** (Optional) | 24.x+ / Compose v2+ | Docker Engine | Containerized delivery |

### Hardware Prerequisites
- **CPU**: 2+ cores (4+ cores recommended for parallel Playwright tests)
- **RAM**: 2 GB minimum (4 GB recommended)
- **Disk Storage**: 500 MB free space (workspace consumes ~277 MB including `node_modules` and test backups)

---

## 2. Step-by-Step Installation

### Step 1: Clone or Open Workspace
Ensure your terminal is located in the repository root directory:
```powershell
cd "c:\Docusign\Code\Personal_Work\Transaction Fraud detection\outputs"
```

### Step 2: Configure Environment Variables
Copy the sanitized environment template:
```powershell
# Windows PowerShell
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```
*(Optional)* Adjust `APP_PORT` or `APP_HOST` in `.env` if you have port collisions.

### Step 3: Install Frontend Dependencies
```powershell
cd app
npm.cmd install    # On Linux/macOS: npm install
cd ..
```

### Step 4: Install Python Dependencies
```powershell
# For minimal production serving and operations:
pip install -r requirements-prod.txt

# Or for full data science pipelines and testing:
pip install -r requirements.txt
```

---

## 3. Pre-Flight Verification

Validate that the environment, configuration, and all 46 canonical evidence tables are present and healthy:
```powershell
python scripts/config_loader.py --validate
python scripts/health_check.py --type all
```
*Expected Output:*
```
Environment: production | Host: 127.0.0.1:4173 | Base URL: /
VALIDATION STATUS: PASS (Configuration is valid and required paths exist)
HEALTH STATUS [ALL]: PASS
```

---

## 4. Application Startup

### Option A: Development Mode (Hot Reload)
```powershell
cd app
npm.cmd run dev    # On Linux/macOS: npm run dev
```
Open **http://127.0.0.1:4173** in Google Chrome or Microsoft Edge. Changes to TypeScript components reload instantly.

### Option B: Production Operational Server (Recommended for Deployment)
1. Build the production bundle:
   ```powershell
   cd app
   npm.cmd run build
   cd ..
   ```
2. Start the hardened operational server:
   ```powershell
   python scripts/server.py
   ```
Open **http://127.0.0.1:4173**. Operational health probes are immediately active at:
- `http://127.0.0.1:4173/health`
- `http://127.0.0.1:4173/health/ready`
- `http://127.0.0.1:4173/health/data`
- `http://127.0.0.1:4173/api/status`

### Option C: Containerized Deployment (Docker)
```bash
docker compose up -d
```

---

## 5. Running Validation & Automated Tests

To verify that the deployment meets 100% mathematical and operational standards:
```powershell
# 1. Phase 7 deployment, health probe & backup tests
python tests/test_phase7_deployment.py

# 2. Backup and isolated disaster recovery rehearsal
python tests/test_backup_recovery.py

# 3. Mathematical metric integrity (196 checks)
python tests/validate_metrics.py

# 4. Schema contracts (144 checks)
python tests/validate_phase2.py

# 5. Phase 6 data refresh engine assertions (7 checks)
python tests/validate_phase6_engine.py

# 6. Capacity and workload benchmarks
python tests/benchmark_capacity.py
```
