# Environment Configuration Guide

**System**: Transaction Fraud Detection Analytics Platform & Power BI Simulation  
**Document**: Technical Reference — Environment Variables & Runtime Parameters  
**Audience**: DevOps Engineers, System Administrators, and Security Reviewers  

---

## 1. Overview & Precedence Hierarchy

The platform loads configuration through a multi-tiered hierarchy:
1. **Explicit CLI Flags** (e.g. `--port 8080`, `--host 0.0.0.0` passed to `server.py`).
2. **System Environment Variables** (injected by Docker, Kubernetes, or host shell).
3. **Local `.env` File** (loaded via `scripts/config_loader.py` if present in repository root).
4. **Hardcoded Fallback Defaults** (safe local defaults targeting `127.0.0.1:4173`).

---

## 2. Environment Variable Reference Table

| Variable Name | Default Value | Accepted Values | Description |
|---|---|---|---|
| `APP_ENV` | `production` | `development`, `testing`, `production` | Controls operational mode, error display, and logging verbosity. |
| `APP_HOST` | `127.0.0.1` | IP address or hostname (`0.0.0.0`, `127.0.0.1`) | Network interface for the operational server to bind. |
| `APP_PORT` | `4173` | Integer (`1024`–`65535`) | TCP port for HTTP serving. |
| `BASE_URL` | `/` | URL path (`/`, `/fraud/`) | Base URL path for static asset resolution. |
| `DATA_DIR` | `app/public/data` | Relative or absolute path | Directory containing `manifest.json`, tables JSONs, and snapshots. |
| `TABLES_DIR` | `tables` | Relative or absolute path | Directory containing canonical research CSV tables. |
| `FIGURES_DIR` | `figures` | Relative or absolute path | Directory containing PNG figures and Plotly HTML maps. |
| `LOG_DIR` | `logs` | Relative or absolute path | Directory where operational and telemetry logs are written. |
| `BACKUP_DIR` | `backups` | Relative or absolute path | Directory where backup zip archives and manifests are stored. |
| `DIST_DIR` | `app/dist` | Relative or absolute path | Target directory containing the compiled production bundle. |
| `LOG_LEVEL` | `INFO` | `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL` | Minimum log severity recorded to console and `logs/operational.jsonl`. |
| `ENABLE_DIAGNOSTICS` | `true` | `true`, `false` | Enables `/operations` diagnostic view and health probes. |
| `HEALTHCHECK_TIMEOUT_SEC` | `5` | Positive Integer | Maximum seconds before health probes timeout. |
| `STORAGE_LIMIT_MB` | `500` | Positive Integer | Soft storage cap; triggers capacity warnings in status API. |
| `BACKUP_RETENTION_DAYS` | `30` | Positive Integer | Maximum age of backup archives before pruning. |
| `MAX_BACKUP_COUNT` | `10` | Positive Integer | Maximum number of backup archives retained on disk. |
| `ENABLE_CORS` | `false` | `true`, `false` | Enables Cross-Origin Resource Sharing headers on API routes. |
| `ALLOWED_ORIGINS` | `*` | Comma-separated URLs | Permitted CORS origins when `ENABLE_CORS=true`. |

---

## 3. Environment Specific Configurations

### 3.1 Local Development Profile
Recommended `.env` configuration for local frontend and research work:
```ini
APP_ENV=development
APP_HOST=127.0.0.1
APP_PORT=4173
LOG_LEVEL=DEBUG
ENABLE_DIAGNOSTICS=true
```

### 3.2 Automated Testing Profile
Used during CI workflows and automated testing runs:
```ini
APP_ENV=testing
APP_HOST=127.0.0.1
APP_PORT=4173
LOG_LEVEL=WARNING
STORAGE_LIMIT_MB=1000
```

### 3.3 Production Container Profile
Configured in `Dockerfile` and `docker-compose.yml`:
```ini
APP_ENV=production
APP_HOST=0.0.0.0
APP_PORT=4173
LOG_LEVEL=INFO
ENABLE_DIAGNOSTICS=true
STORAGE_LIMIT_MB=500
MAX_BACKUP_COUNT=10
```

---

## 4. Validating Configuration

Operators can inspect and validate the active configuration at any time:
```powershell
# Validate configuration and verify that all referenced directories exist
python scripts/config_loader.py --validate

# Output active configuration as formatted JSON
python scripts/config_loader.py --json
```
If critical settings are invalid (such as an unprivileged port out of bounds or missing data directory), the utility exits with code `1` and prints an explanatory error.
