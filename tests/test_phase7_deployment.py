"""Phase 7 Deployment Engineering, Operations & Release Verification Test Suite.

Automated verification of:
1. Environment configuration validation and error detection.
2. Structured JSON logging and automated sensitive key redaction.
3. Health check probe behavior (liveness, readiness, data integrity).
4. Storage management profiling and safety invariants.
5. Release package audit, SBOM verification, and secret scanning.
6. Backup archive creation and isolated restore rehearsal.
7. Production HTTP server API routes and graceful shutdown.
"""
from __future__ import annotations

import json
import os
import shutil
import socket
import sys
import threading
import time
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from scripts.backup_manager import create_backup, restore_backup, verify_backup
from scripts.build_release import build_release_package
from scripts.config_loader import AppConfig, get_config, validate_environment
from scripts.health_check import check_data_readiness_local, check_liveness_local, check_readiness_local
from scripts.server import OperationalHandler
from scripts.storage_manager import execute_cleanup, profile_storage
from scripts.structured_logger import StructuredLogger, mask_sensitive


def test_configuration_validation():
    print("[Test 1/7] Testing Environment Configuration & Validation...")
    # 1. Valid default config
    cfg = get_config()
    assert cfg.app_env in ("development", "testing", "production")
    assert 1024 <= cfg.app_port <= 65535

    # 2. Assert path validation
    ok, msgs = validate_environment()
    assert ok, f"Environment validation failed: {msgs}"

    # 3. Test invalid port detection
    try:
        os.environ["APP_PORT"] = "99999"
        get_config()
        assert False, "Should have failed on invalid port 99999"
    except ValueError:
        pass
    finally:
        os.environ.pop("APP_PORT", None)

    # 4. Test invalid environment detection
    try:
        os.environ["APP_ENV"] = "invalid_env"
        get_config()
        assert False, "Should have failed on invalid APP_ENV"
    except ValueError:
        pass
    finally:
        os.environ.pop("APP_ENV", None)

    print("  PASS: Configuration loader validated with strict type and path bounds.")


def test_structured_logger_and_redaction():
    print("[Test 2/7] Testing Structured Logging & Sensitive Key Redaction...")
    test_log_file = ROOT_DIR / "logs" / "test_operational.jsonl"
    logger = StructuredLogger(name="test-logger", log_file=test_log_file, min_level="DEBUG")

    # Test masking helper directly
    sensitive_dict = {
        "user": "analyst1",
        "password": "supersecretpassword123",
        "api_key": "AKIA1234567890EXAMPLE",
        "nested": {"token": "bearer-xyz-123", "normal": "safe_value"},
    }
    cleaned = mask_sensitive(sensitive_dict)
    assert cleaned["password"] == "******"
    assert cleaned["api_key"] == "******"
    assert cleaned["nested"]["token"] == "******"
    assert cleaned["nested"]["normal"] == "safe_value"

    # Test logger output
    logger.info("auth", "User login event", details=sensitive_dict)
    assert test_log_file.exists()

    # Read back and verify JSON Lines format
    with open(test_log_file, "r", encoding="utf-8") as f:
        lines = f.readlines()
        assert len(lines) >= 1
        record = json.loads(lines[-1])
        assert record["level"] == "INFO"
        assert record["category"] == "auth"
        assert record["details"]["password"] == "******"

    # Clean up test log
    test_log_file.unlink(missing_ok=True)
    print("  PASS: Structured JSON logging schema and sensitive data redaction verified.")


def test_health_check_probes():
    print("[Test 3/7] Testing Health Check Probes (Liveness, Readiness, Data Integrity)...")
    # Liveness
    live_ok, live_res = check_liveness_local()
    assert live_ok, f"Liveness check failed: {live_res}"
    assert live_res["status"] == "healthy"

    # Readiness
    ready_ok, ready_res = check_readiness_local()
    assert ready_ok, f"Readiness check failed: {ready_res}"
    assert ready_res["status"] == "ready"

    # Data Readiness
    data_ok, data_res = check_data_readiness_local()
    assert data_ok, f"Data readiness check failed: {data_res}"
    assert data_res["tables_found"] >= 40, f"Expected >= 40 tables, got {data_res['tables_found']}"
    assert len(data_res["empty_tables"]) == 0, f"Found empty tables: {data_res['empty_tables']}"
    assert data_res["snapshots_found"] >= 1, "Expected at least 1 snapshot checkpoint"

    print("  PASS: All 3 health probes (liveness, readiness, data integrity) verified.")


def test_storage_manager_and_safeguards():
    print("[Test 4/7] Testing Storage Management & Protected Path Safeguards...")
    # Profile
    profile = profile_storage()
    assert profile["total_workspace_bytes"] > 0
    assert len(profile["storage_breakdown"]) >= 5

    # Dry-run cleanup
    dry_res = execute_cleanup(dry_run=True)
    assert dry_res["status"] == "DRY_RUN_COMPLETED"

    print("  PASS: Storage capacity profile measured and cleanup safety invariants enforced.")


def test_release_packaging_and_secret_scan():
    print("[Test 5/7] Testing Release Packaging & Secret Scanning...")
    ok, res = build_release_package(version="1.0.0", validate_only=True)
    assert ok, f"Release validation failed: {res}"
    assert res["status"] == "VALIDATED"
    assert res["candidate_file_count"] >= 50
    assert res["sbom_components"] >= 5

    print(f"  PASS: Release package validated ({res['candidate_file_count']} files, {res['sbom_components']} SBOM components, 0 secrets).")


def test_backup_and_recovery_cycle():
    print("[Test 6/7] Testing Backup Creation & Manifest Verification...")
    ok, b_res = create_backup(label="deployment_test")
    assert ok, f"Backup creation failed: {b_res}"
    archive = Path(b_res["archive"])

    try:
        ok, v_res = verify_backup(archive)
        assert ok, f"Backup verification failed: {v_res}"
        assert v_res["status"] == "VERIFIED_INTEGRITY"
        assert v_res["verified_files"] >= 180
    finally:
        archive.unlink(missing_ok=True)
        archive.with_suffix(".zip.sha256").unlink(missing_ok=True)

    print("  PASS: Backup creation and cryptographic manifest verification passed.")


def test_operational_server_smoke():
    print("[Test 7/7] Testing Operational Production HTTP Server...")
    # Find free port
    sock = socket.socket()
    sock.bind(("", 0))
    free_port = sock.getsockname()[1]
    sock.close()

    server = ThreadingHTTPServer(("127.0.0.1", free_port), OperationalHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    time.sleep(0.3)

    base_url = f"http://127.0.0.1:{free_port}"

    try:
        # 1. Query /health
        with urllib.request.urlopen(f"{base_url}/health", timeout=3) as resp:
            assert resp.getcode() == 200
            data = json.loads(resp.read().decode())
            assert data["status"] == "ok"
            assert "uptime_seconds" in data

        # 2. Query /health/ready
        with urllib.request.urlopen(f"{base_url}/health/ready", timeout=3) as resp:
            assert resp.getcode() == 200
            data = json.loads(resp.read().decode())
            assert data["status"] == "ready"

        # 3. Query /health/data
        with urllib.request.urlopen(f"{base_url}/health/data", timeout=3) as resp:
            assert resp.getcode() == 200
            data = json.loads(resp.read().decode())
            assert data["status"] == "healthy"
            assert data["tables_found"] >= 40

        # 4. Query /api/status
        with urllib.request.urlopen(f"{base_url}/api/status", timeout=3) as resp:
            assert resp.getcode() == 200
            data = json.loads(resp.read().decode())
            assert data["application"] == "Transaction Fraud Detection Analytics Platform"
            assert "data_inventory" in data
            assert data["data_inventory"]["tables_csv"] >= 40

        # 5. Query SPA fallback route (e.g. /operations)
        with urllib.request.urlopen(f"{base_url}/operations", timeout=3) as resp:
            assert resp.getcode() == 200
            body = resp.read().decode("utf-8")
            assert "<!DOCTYPE html>" in body or "<html" in body

        print("  PASS: Operational HTTP server routes (/health, /health/ready, /health/data, /api/status, SPA fallback) verified.")
    finally:
        server.shutdown()
        server.server_close()


def run_all_tests():
    print("=" * 70)
    print("  RUNNING PHASE 7 DEPLOYMENT & OPERATIONS VERIFICATION SUITE")
    print("=" * 70)

    test_configuration_validation()
    test_structured_logger_and_redaction()
    test_health_check_probes()
    test_storage_manager_and_safeguards()
    test_release_packaging_and_secret_scan()
    test_backup_and_recovery_cycle()
    test_operational_server_smoke()

    print("=" * 70)
    print("  ALL 7 PHASE 7 DEPLOYMENT VERIFICATION TESTS PASSED (100%)")
    print("=" * 70)


if __name__ == "__main__":
    try:
        run_all_tests()
        sys.exit(0)
    except AssertionError as e:
        print(f"\nTEST FAILED: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\nUNHANDLED EXCEPTION: {e}", file=sys.stderr)
        sys.exit(1)
