"""Operational Production HTTP Server for Fraud Analytics Platform.

Serves the built frontend SPA with routing fallback and provides native
operational health endpoints (/health, /health/ready, /health/data, /api/status).

Usage:
  python scripts/server.py
  python scripts/server.py --port 4173 --host 0.0.0.0
"""
from __future__ import annotations

import argparse
import json
import mimetypes
import os
import signal
import sys
import time
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from scripts.config_loader import get_config
from scripts.health_check import check_data_readiness_local, check_readiness_local
from scripts.structured_logger import logger

START_TIME = time.time()


class OperationalHandler(SimpleHTTPRequestHandler):
    """Custom HTTP handler with health endpoints and SPA fallback."""

    def __init__(self, *args, **kwargs):
        cfg = get_config()
        # Serve from app/dist if built, otherwise app/public
        serve_dir = cfg.dist_dir if (cfg.dist_dir / "index.html").exists() else (ROOT_DIR / "app" / "public")
        self.serve_dir = str(serve_dir)
        super().__init__(*args, directory=self.serve_dir, **kwargs)

    def log_message(self, format: str, *args):
        # Route standard server log into structured logger
        pass

    def send_json_response(self, status_code: int, data: Dict[str, Any]):
        """Helper to send standardized JSON response."""
        payload = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        t0 = time.time()
        url_path = self.path.split("?")[0]

        # 1. Health Probe: Liveness
        if url_path == "/health":
            uptime = time.time() - START_TIME
            data = {
                "status": "ok",
                "service": "fraud-analytics-console",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "uptime_seconds": round(uptime, 2),
            }
            self.send_json_response(HTTPStatus.OK, data)
            logger.info("health_probe", "Liveness probe answered", duration_ms=(time.time() - t0) * 1000)
            return

        # 2. Health Probe: Readiness
        if url_path == "/health/ready":
            is_ready, details = check_readiness_local()
            code = HTTPStatus.OK if is_ready else HTTPStatus.SERVICE_UNAVAILABLE
            self.send_json_response(code, details)
            logger.info("health_probe", "Readiness probe answered", outcome="success" if is_ready else "degraded")
            return

        # 3. Health Probe: Data Readiness
        if url_path == "/health/data":
            is_healthy, details = check_data_readiness_local()
            code = HTTPStatus.OK if is_healthy else HTTPStatus.SERVICE_UNAVAILABLE
            self.send_json_response(code, details)
            logger.info("health_probe", "Data readiness probe answered", outcome="success" if is_healthy else "degraded")
            return

        # 4. Operational API: System Status
        if url_path == "/api/status":
            cfg = get_config()
            uptime = time.time() - START_TIME
            
            # Count artifacts
            csv_count = len(list(cfg.tables_dir.glob("*.csv"))) if cfg.tables_dir.exists() else 0
            png_count = len(list(cfg.figures_dir.glob("*.png"))) if cfg.figures_dir.exists() else 0
            snap_count = len(list((cfg.data_dir / "snapshots").glob("*.json"))) if (cfg.data_dir / "snapshots").exists() else 0

            # Measure disk size in MB
            def dir_mb(p: Path) -> float:
                if not p.exists():
                    return 0.0
                total = sum(f.stat().st_size for f in p.rglob("*") if f.is_file())
                return round(total / (1024 * 1024), 2)

            manifest_path = cfg.data_dir / "manifest.json"
            manifest_meta = {}
            if manifest_path.exists():
                try:
                    with open(manifest_path, "r", encoding="utf-8") as f:
                        m_data = json.load(f)
                        manifest_meta = {
                            "created": m_data.get("created"),
                            "run_id": m_data.get("run_id"),
                            "fingerprint": m_data.get("fingerprint"),
                        }
                except Exception:
                    pass

            status_payload = {
                "application": "Transaction Fraud Detection Analytics Platform",
                "app_env": cfg.app_env,
                "app_version": "1.0.0",
                "uptime_seconds": round(uptime, 2),
                "server_time": datetime.now(timezone.utc).isoformat(),
                "runtime": {
                    "python_version": sys.version.split()[0],
                    "host": cfg.app_host,
                    "port": cfg.app_port,
                    "base_url": cfg.base_url,
                },
                "data_inventory": {
                    "tables_csv": csv_count,
                    "figures_png": png_count,
                    "snapshots": snap_count,
                    "manifest": manifest_meta,
                },
                "storage_mb": {
                    "tables": dir_mb(cfg.tables_dir),
                    "figures": dir_mb(cfg.figures_dir),
                    "dist": dir_mb(cfg.dist_dir),
                    "data": dir_mb(cfg.data_dir),
                    "logs": dir_mb(cfg.log_dir),
                    "limit_mb": cfg.storage_limit_mb,
                },
            }
            self.send_json_response(HTTPStatus.OK, status_payload)
            logger.info("api", "Operational status queried", duration_ms=(time.time() - t0) * 1000)
            return

        # 5. Static File Serving with Single-Page Application (SPA) Fallback
        # Check if the requested file exists
        req_file = Path(self.serve_dir) / url_path.lstrip("/")
        
        # If it's a file, serve it directly
        if req_file.is_file():
            super().do_GET()
            return

        # If it's a directory containing index.html
        if (req_file / "index.html").is_file():
            super().do_GET()
            return

        # SPA Route Fallback: if path has no file extension, rewrite to index.html
        if "." not in os.path.basename(url_path):
            index_path = Path(self.serve_dir) / "index.html"
            if index_path.exists():
                self.path = "/index.html"
                super().do_GET()
                return

        # Otherwise standard 404
        super().do_GET()


def run_server(host: str = None, port: int = None):
    cfg = get_config()
    server_host = host or cfg.app_host
    server_port = port or cfg.app_port

    server = ThreadingHTTPServer((server_host, server_port), OperationalHandler)
    logger.info(
        "server_start",
        f"Fraud Analytics Console operational server listening at http://{server_host}:{server_port}",
        details={"environment": cfg.app_env, "serve_dir": str(cfg.dist_dir)},
    )
    print(f"=====================================================================")
    print(f"  FRAUD ANALYTICS CONSOLE — PRODUCTION OPERATIONAL SERVER")
    print(f"  Listening on: http://{server_host}:{server_port}")
    print(f"  Mode: {cfg.app_env.upper()} | Diagnostics: {'ENABLED' if cfg.enable_diagnostics else 'DISABLED'}")
    print(f"  Health Endpoints:")
    print(f"    - http://{server_host}:{server_port}/health       (Liveness)")
    print(f"    - http://{server_host}:{server_port}/health/ready (Readiness)")
    print(f"    - http://{server_host}:{server_port}/health/data  (Data Readiness)")
    print(f"    - http://{server_host}:{server_port}/api/status   (Operational Metadata)")
    print(f"=====================================================================")

    def handle_shutdown(signum, frame):
        print("\nInitiating graceful shutdown...")
        logger.info("server_shutdown", "Shutting down operational server cleanly")
        server.shutdown()
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_shutdown)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, handle_shutdown)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Operational Production HTTP Server")
    parser.add_argument("--host", type=str, default=None, help="Host network binding")
    parser.add_argument("--port", type=int, default=None, help="Network port (default: 4173)")
    args = parser.parse_args()

    run_server(args.host, args.port)
