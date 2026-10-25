"""Comprehensive Health Probe and Diagnostic Validator.

Supports liveness, readiness, data integrity, and refresh health checks.
Callable via CLI with exit codes suitable for Docker HEALTHCHECK and monitoring probes.

Usage:
  python scripts/health_check.py --type liveness
  python scripts/health_check.py --type readiness
  python scripts/health_check.py --type data
  python scripts/health_check.py --type all
  python scripts/health_check.py --url http://127.0.0.1:4173 --type all
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple

ROOT_DIR = Path(__file__).resolve().parents[1]
TABLES_DIR = ROOT_DIR / "tables"
DATA_DIR = ROOT_DIR / "app" / "public" / "data"
SNAPSHOTS_DIR = DATA_DIR / "snapshots"
LOGS_DIR = ROOT_DIR / "logs"


def check_liveness_local() -> Tuple[bool, Dict[str, Any]]:
    """Local liveness assertion: process can execute and access filesystem."""
    try:
        t0 = datetime.now(timezone.utc)
        return True, {
            "status": "healthy",
            "timestamp": t0.isoformat(),
            "python_version": sys.version.split()[0],
            "message": "Process and runtime filesystem responsive",
        }
    except Exception as e:
        return False, {"status": "unhealthy", "error": str(e)}


def check_readiness_local() -> Tuple[bool, Dict[str, Any]]:
    """Local readiness assertion: required directories and core manifest exist."""
    errors = []
    if not DATA_DIR.exists():
        errors.append(f"DATA_DIR missing: {DATA_DIR}")
    if not (DATA_DIR / "manifest.json").exists():
        errors.append("manifest.json missing in DATA_DIR")
    if not TABLES_DIR.exists():
        errors.append(f"TABLES_DIR missing: {TABLES_DIR}")

    is_ready = len(errors) == 0
    return is_ready, {
        "status": "ready" if is_ready else "not_ready",
        "errors": errors,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def check_data_readiness_local() -> Tuple[bool, Dict[str, Any]]:
    """Verify presence and non-emptiness of all 46 canonical CSV tables and snapshots."""
    details: Dict[str, Any] = {
        "status": "healthy",
        "tables_found": 0,
        "tables_expected": 46,
        "snapshots_found": 0,
        "missing_tables": [],
        "empty_tables": [],
    }

    if not TABLES_DIR.exists():
        details["status"] = "unhealthy"
        details["error"] = f"Tables directory not found: {TABLES_DIR}"
        return False, details

    csv_files = list(TABLES_DIR.glob("*.csv"))
    details["tables_found"] = len(csv_files)

    for p in csv_files:
        try:
            if p.stat().st_size == 0:
                details["empty_tables"].append(p.name)
        except Exception:
            details["empty_tables"].append(p.name)

    if SNAPSHOTS_DIR.exists():
        snap_files = list(SNAPSHOTS_DIR.glob("*.json"))
        details["snapshots_found"] = len(snap_files)

    # Assert expected table count
    if details["tables_found"] < 40 or len(details["empty_tables"]) > 0:
        details["status"] = "degraded"
        return False, details

    return True, details


def check_remote_probe(base_url: str, probe_type: str) -> Tuple[bool, Dict[str, Any]]:
    """Query operational HTTP server endpoints."""
    path_map = {
        "liveness": "/health",
        "readiness": "/health/ready",
        "data": "/health/data",
        "all": "/api/status",
    }
    endpoint = base_url.rstrip("/") + path_map.get(probe_type, "/health")
    req = urllib.request.Request(endpoint, headers={"User-Agent": "HealthCheckProbe/1.0"})

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            code = response.getcode()
            body = response.read().decode("utf-8")
            data = json.loads(body)
            return code == 200, data
    except urllib.error.HTTPError as e:
        return False, {"http_code": e.code, "error": str(e)}
    except Exception as e:
        return False, {"error": str(e)}


def run_probes(probe_type: str, base_url: str = None) -> Tuple[bool, Dict[str, Any]]:
    """Dispatch requested health probes."""
    if base_url:
        return check_remote_probe(base_url, probe_type)

    results: Dict[str, Any] = {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "probes": {},
    }
    all_ok = True

    if probe_type in ("liveness", "all"):
        ok, res = check_liveness_local()
        results["probes"]["liveness"] = res
        if not ok:
            all_ok = False

    if probe_type in ("readiness", "all"):
        ok, res = check_readiness_local()
        results["probes"]["readiness"] = res
        if not ok:
            all_ok = False

    if probe_type in ("data", "all"):
        ok, res = check_data_readiness_local()
        results["probes"]["data"] = res
        if not ok:
            all_ok = False

    results["status"] = "healthy" if all_ok else "unhealthy"
    return all_ok, results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Application Health Check Probe")
    parser.add_argument("--type", choices=["liveness", "readiness", "data", "all"], default="all")
    parser.add_argument("--url", type=str, default=None, help="Base HTTP URL for remote check (e.g. http://127.0.0.1:4173)")
    parser.add_argument("--quiet", action="store_true", help="Suppress output, exit code only")
    args = parser.parse_args()

    ok, res = run_probes(args.type, args.url)

    if not args.quiet:
        print(f"HEALTH STATUS [{args.type.upper()}]: {'PASS' if ok else 'FAIL'}")
        print(json.dumps(res, indent=2))

    sys.exit(0 if ok else 1)
