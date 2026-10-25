"""Configuration loader and validator for the Fraud Analytics Platform.

Supports environment variables, .env file loading, environment validation,
and path resolution across development, testing, and production environments.
"""
from __future__ import annotations

import argparse
import os
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT_DIR = Path(__file__).resolve().parents[1]


@dataclass
class AppConfig:
    app_env: str
    app_host: str
    app_port: int
    base_url: str
    data_dir: Path
    tables_dir: Path
    figures_dir: Path
    log_dir: Path
    backup_dir: Path
    dist_dir: Path
    log_level: str
    enable_diagnostics: bool
    healthcheck_timeout_sec: int
    storage_limit_mb: int
    backup_retention_days: int
    max_backup_count: int
    enable_cors: bool
    allowed_origins: List[str]

    def to_dict(self, sanitize: bool = True) -> Dict[str, Any]:
        """Convert configuration to dictionary, with stringified paths."""
        data = asdict(self)
        for k, v in data.items():
            if isinstance(v, Path):
                data[k] = str(v).replace("\\", "/")
        return data


def load_env_file(env_path: Path) -> Dict[str, str]:
    """Parse a .env file without external dependencies."""
    env_vars: Dict[str, str] = {}
    if not env_path.exists():
        return env_vars

    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip("'\"")
                env_vars[key] = val
    return env_vars


def get_config(env_file_path: Optional[Path] = None) -> AppConfig:
    """Load, validate, and return the application configuration."""
    # 1. Load from .env if present
    env_path = env_file_path or (ROOT_DIR / ".env")
    file_vars = load_env_file(env_path) if env_path.exists() else {}

    def get_var(key: str, default: str) -> str:
        return os.environ.get(key, file_vars.get(key, default)).strip()

    # 2. Extract and cast variables
    app_env = get_var("APP_ENV", "production").lower()
    if app_env not in ("development", "testing", "production"):
        raise ValueError(f"Invalid APP_ENV: '{app_env}'. Must be 'development', 'testing', or 'production'.")

    app_host = get_var("APP_HOST", "127.0.0.1")
    try:
        app_port = int(get_var("APP_PORT", "4173"))
        if not (1024 <= app_port <= 65535):
            raise ValueError(f"Port must be between 1024 and 65535, got {app_port}")
    except ValueError as e:
        raise ValueError(f"Invalid APP_PORT: {e}")

    base_url = get_var("BASE_URL", "/")
    if not base_url.startswith("/"):
        base_url = "/" + base_url
    if not base_url.endswith("/"):
        base_url = base_url + "/"

    def resolve_path(var_name: str, default_rel: str) -> Path:
        raw = get_var(var_name, default_rel)
        p = Path(raw)
        return p if p.is_absolute() else (ROOT_DIR / p).resolve()

    data_dir = resolve_path("DATA_DIR", "app/public/data")
    tables_dir = resolve_path("TABLES_DIR", "tables")
    figures_dir = resolve_path("FIGURES_DIR", "figures")
    log_dir = resolve_path("LOG_DIR", "logs")
    backup_dir = resolve_path("BACKUP_DIR", "backups")
    dist_dir = resolve_path("DIST_DIR", "app/dist")

    log_level = get_var("LOG_LEVEL", "INFO").upper()
    if log_level not in ("DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"):
        raise ValueError(f"Invalid LOG_LEVEL: '{log_level}'")

    enable_diagnostics = get_var("ENABLE_DIAGNOSTICS", "true").lower() in ("true", "1", "yes")
    
    try:
        healthcheck_timeout = int(get_var("HEALTHCHECK_TIMEOUT_SEC", "5"))
        storage_limit_mb = int(get_var("STORAGE_LIMIT_MB", "500"))
        backup_retention_days = int(get_var("BACKUP_RETENTION_DAYS", "30"))
        max_backup_count = int(get_var("MAX_BACKUP_COUNT", "10"))
    except ValueError as e:
        raise ValueError(f"Numeric configuration error: {e}")

    enable_cors = get_var("ENABLE_CORS", "false").lower() in ("true", "1", "yes")
    allowed_origins = [o.strip() for o in get_var("ALLOWED_ORIGINS", "*").split(",") if o.strip()]

    # Ensure required runtime directories exist
    log_dir.mkdir(parents=True, exist_ok=True)
    backup_dir.mkdir(parents=True, exist_ok=True)

    return AppConfig(
        app_env=app_env,
        app_host=app_host,
        app_port=app_port,
        base_url=base_url,
        data_dir=data_dir,
        tables_dir=tables_dir,
        figures_dir=figures_dir,
        log_dir=log_dir,
        backup_dir=backup_dir,
        dist_dir=dist_dir,
        log_level=log_level,
        enable_diagnostics=enable_diagnostics,
        healthcheck_timeout_sec=healthcheck_timeout,
        storage_limit_mb=storage_limit_mb,
        backup_retention_days=backup_retention_days,
        max_backup_count=max_backup_count,
        enable_cors=enable_cors,
        allowed_origins=allowed_origins,
    )


def validate_environment() -> Tuple[bool, List[str]]:
    """Perform pre-flight configuration and file integrity assertions."""
    errors = []
    warnings = []

    try:
        cfg = get_config()
    except Exception as e:
        return False, [f"Configuration validation failed: {e}"]

    # 1. Check Data Directory
    if not cfg.data_dir.exists():
        errors.append(f"DATA_DIR does not exist: {cfg.data_dir}")
    else:
        manifest_file = cfg.data_dir / "manifest.json"
        if not manifest_file.exists():
            errors.append(f"Missing manifest.json in DATA_DIR: {manifest_file}")

    # 2. Check Tables Directory
    if not cfg.tables_dir.exists():
        errors.append(f"TABLES_DIR does not exist: {cfg.tables_dir}")
    else:
        csv_count = len(list(cfg.tables_dir.glob("*.csv")))
        if csv_count < 40:
            errors.append(f"Expected at least 46 CSV tables in TABLES_DIR, found {csv_count}")

    # 3. Check Figures Directory
    if not cfg.figures_dir.exists():
        errors.append(f"FIGURES_DIR does not exist: {cfg.figures_dir}")
    else:
        png_count = len(list(cfg.figures_dir.glob("*.png")))
        if png_count < 100:
            warnings.append(f"Figures directory has {png_count} PNGs (expected ~129)")

    # 4. Check Dist Directory (for production)
    if cfg.app_env == "production":
        if not cfg.dist_dir.exists() or not (cfg.dist_dir / "index.html").exists():
            warnings.append(
                f"Production build not found in {cfg.dist_dir}. Run 'npm.cmd run build' in app/ directory."
            )

    success = len(errors) == 0
    messages = errors + [f"WARNING: {w}" for w in warnings]
    return success, messages


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Configuration loader and validator")
    parser.add_argument("--validate", action="store_true", help="Validate current environment")
    parser.add_argument("--json", action="store_true", help="Print configuration as JSON")
    args = parser.parse_args()

    try:
        cfg = get_config()
        if args.validate:
            ok, msgs = validate_environment()
            print(f"Environment: {cfg.app_env} | Host: {cfg.app_host}:{cfg.app_port} | Base URL: {cfg.base_url}")
            for msg in msgs:
                print(f"  {msg}")
            if ok:
                print("VALIDATION STATUS: PASS (Configuration is valid and required paths exist)")
                sys.exit(0)
            else:
                print("VALIDATION STATUS: FAIL")
                sys.exit(1)
        elif args.json:
            import json
            print(json.dumps(cfg.to_dict(), indent=2))
        else:
            print(f"Configuration loaded successfully: {cfg.app_env} mode on {cfg.app_host}:{cfg.app_port}")
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
