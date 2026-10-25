# Phase 7 Environment Strategy & Configuration Architecture

**System**: Transaction Fraud Detection Analytics Platform  
**Scope**: Development, Testing, and Production Environment Separation, Security Isolation, and Configuration Governance  
**Date**: October 2026  
**Auditor**: Principal Platform Architect & Application Security Engineer  

---

## 1. Executive Summary

This report establishes the formalized environment strategy for the **Transaction Fraud Detection Analytics Platform**.

A dependable analytical system requires strict isolation between interactive developer workflows, automated deterministic testing, and hardened production delivery. Because this platform serves as both a data intelligence research environment (processing 1.85 million transactions and 185 analytical artifacts) and a Power BI-style executive presentation console, environment pollution can lead to corrupt baseline numbers, accidental deletion of historical snapshots, or leaked internal paths.

This strategy establishes three distinct operational tiers:
1. **Development (`development`)**: Prioritizes rapid iteration, developer ergonomics, Vite HMR (hot module replacement), verbose diagnostics, and dynamic component testing.
2. **Testing (`testing`)**: Prioritizes determinism, zero side-effects, staging isolation, synthetic fixture validation, and safe state resets without touching canonical evidence tables.
3. **Production (`production`)**: Prioritizes immutable bundling, hardened HTTP serving, structured JSON observability, non-root execution, pre-flight configuration validation, and persistent volume separation.

---

## 2. Environment Comparison Matrix

| Dimension | Development (`development`) | Automated Testing (`testing`) | Production (`production`) |
|---|---|---|---|
| **Intended Runtime** | Local developer workstation / IDE | CI runners, pre-commit hooks, validation scripts | Dedicated server, container host, or internal VPC |
| **Process Model** | Vite HMR Dev Server (`vite`) + Python interactive scripts | Python automated test runners (`pytest`/`unittest`) + Playwright headless | Python Operational Server (`scripts/server.py`) or multi-stage Docker container |
| **Network Binding** | `127.0.0.1:4173` | Ephemeral ports or loopback socket | Configurable `APP_HOST` (e.g. `0.0.0.0` or `127.0.0.1`), configurable `APP_PORT` |
| **Frontend Assets** | Dynamic on-demand TypeScript compilation via esbuild/Vite | Static mock fixtures or verified `app/dist/` bundle | Minified, tree-shaken, chunk-split bundle in `app/dist/` |
| **Logging Verbosity** | `DEBUG` / `INFO` (human-readable console logs) | `WARNING` / `ERROR` (test runner output assertions) | `INFO` (Structured JSON logs with event categories and durations) |
| **Error Handling** | React error boundaries with full component stacks | Assertion errors fail immediately with exit code 1 | Sanitized error screens; no raw stack traces or internal paths shown to users |
| **Data Mutability** | Refresh pipeline may stage updates to `.staging/` | Read-only fixtures; tests use temp directories (`tmp/`) | Strict staging-to-atomic-swap; canonical sources are protected |
| **Secret & Config Management** | `.env` local file or defaults | Synthetic mocked environment variables | Injected system environment variables or container secrets |
| **Health Checks** | Optional developer diagnostics | Explicit probe validation (`test_phase7_deployment.py`) | Continuous `/health`, `/health/ready`, `/health/data` polling |
| **Command** | `cd app; npm.cmd run dev` | `python tests/validate_phase6_engine.py`<br>`python tests/test_phase7_deployment.py` | `python scripts/server.py` or `docker compose up -d` |

---

## 3. Environment-Specific Architectural Requirements

### 3.1 Development Environment
- **Ergonomics**: Vite provides instant sub-50ms HMR for UI changes across the 27 routed views.
- **Diagnostics**: The in-app Activity Center and developer console output detailed loading timings, cache hits/evictions, and query matching details.
- **Configuration Defaults**: Safe defaults apply automatically if no `.env` file exists (`127.0.0.1:4173`, `BASE_URL=/`).

### 3.2 Testing Environment
- **Determinism**: Test runs must never depend on uncommitted local files or network availability.
- **Fixture Safety**: Testing never modifies canonical files in `tables/`, `figures/`, `logs/`, or `snapshots/`. All mutation tests (e.g. refresh staging, backup restoration, storage cleanup) are executed against isolated temporary scratch directories (`scratch/` or `backups/test_restore/`).
- **Zero Production Secrets**: No live API keys, tokens, or external credentials are used or exposed in test suites.
- **Reset Safety**: Tests clean up their temporary directories upon exit.

### 3.3 Production Environment
- **Debug Disabled**: TypeScript strict mode is enforced; debug logging is filtered out of public views.
- **Path Sanitization**: No private developer filesystem paths (e.g. `C:\Users\User\...`) are embedded in the client-side bundle. All assets resolve relative to `BASE_URL`.
- **Resource Limits**: Configurable storage limits (`STORAGE_LIMIT_MB=500`) prevent unbounded disk growth.
- **Health Verification**: External load balancers or orchestrators can poll `/health` (process liveness), `/health/ready` (system readiness), and `/health/data` (SHA-256 integrity of all 46 tables and snapshots).
- **Graceful Shutdown**: Production processes handle `SIGTERM` and `SIGINT` cleanly, waiting for in-flight requests or transactions to finalize.

---

## 4. Configuration Compatibility and Security Controls

### 4.1 Path Isolation Invariant
Frontend requests must strictly load assets relative to `import.meta.env.BASE_URL` or relative paths. The backend server maps `/` to `app/dist/index.html` and serves static files from `app/dist/` or `app/public/`. Private directories (`.git`, `scripts/`, `tests/`, raw data) are never served over HTTP.

### 4.2 Pre-Flight Startup Validation
When the production server or batch pipeline starts, `scripts/config_loader.py` validates:
1. Environment mode is explicitly recognized (`development`, `testing`, `production`).
2. Network port is an unprivileged port (1024–65535).
3. Required data directories exist (`app/public/data/` with `manifest.json`, `tables/` with 46 CSVs).
4. If in production mode, verifies that `app/dist/index.html` has been built. If missing, it outputs an actionable error directing the operator to run `npm.cmd run build`.

### 4.3 Sanitized Output Governance
All operational endpoints (`/api/status`, `/health/data`) sanitize system paths to forward slashes and suppress local user directory names, ensuring cloud compliance and privacy protection.
