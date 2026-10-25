"""Automated Release Packaging and Validation Script.

Verifies build integrity, scans for credentials/private files, generates
release manifests and SBOM inventories, and creates reproducible zip packages.

Usage:
  python scripts/build_release.py                 # Full package build
  python scripts/build_release.py --validate-only # Pre-flight validation
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple

ROOT_DIR = Path(__file__).resolve().parents[1]
APP_DIR = ROOT_DIR / "app"
DIST_DIR = APP_DIR / "dist"
RELEASE_DIR = ROOT_DIR / "dist-release"

# Sensitive or development patterns that must NEVER be in a release package
FORBIDDEN_EXTENSIONS = {".pem", ".key", ".log", ".pyc", ".tmp", ".temp"}
FORBIDDEN_DIR_NAMES = {"node_modules", "scratch", "tmp", ".staging", "__pycache__"}

SECRET_REGEXES = [
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"(?i)(api[_-]?key|secret[_-]?key|password)\s*[:=]\s*['\"][a-zA-Z0-9_\-]{8,}['\"]"),
]


def compute_file_sha256(filepath: Path) -> str:
    """Calculate SHA-256 digest of a file."""
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def get_version() -> str:
    """Retrieve version string from app/package.json."""
    pkg_json = APP_DIR / "package.json"
    if pkg_json.exists():
        with open(pkg_json, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("version", "1.0.0")
    return "1.0.0"


def generate_sbom() -> Dict[str, Any]:
    """Generate a lightweight Software Bill of Materials (SBOM)."""
    sbom: Dict[str, Any] = {
        "format": "CycloneDX-compatible-lightweight",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "application": "Transaction Fraud Detection Analytics Platform",
        "components": [],
    }

    # 1. npm dependencies
    pkg_json = APP_DIR / "package.json"
    if pkg_json.exists():
        with open(pkg_json, "r", encoding="utf-8") as f:
            pkg = json.load(f)
            for name, ver in pkg.get("dependencies", {}).items():
                sbom["components"].append({"type": "library", "ecosystem": "npm", "name": name, "version": ver})

    # 2. Python dependencies from requirements-prod.txt
    req_file = ROOT_DIR / "requirements-prod.txt"
    if req_file.exists():
        with open(req_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    parts = re.split(r"[><=~]+", line, maxsplit=1)
                    name = parts[0].strip()
                    ver = parts[1].strip() if len(parts) > 1 else "latest"
                    sbom["components"].append({"type": "library", "ecosystem": "pypi", "name": name, "version": ver})

    return sbom


def audit_files_for_secrets(files: List[Path]) -> List[str]:
    """Scan candidate files for potential credentials or confidential patterns."""
    violations = []
    for f in files:
        name = f.name
        # Disallow actual env files, but allow .env.example
        if name.startswith(".env") and not name.endswith(".example"):
            violations.append(f"Forbidden environment file detected: {f.relative_to(ROOT_DIR)}")

        # Check forbidden extensions
        if f.suffix.lower() in FORBIDDEN_EXTENSIONS:
            violations.append(f"Forbidden file extension ({f.suffix}) detected: {f.relative_to(ROOT_DIR)}")

        # Check forbidden directories
        if any(part in FORBIDDEN_DIR_NAMES for part in f.parts):
            violations.append(f"Forbidden directory component detected: {f.relative_to(ROOT_DIR)}")

        # Check content of text files < 1 MB
        if f.suffix in (".js", ".html", ".css", ".json", ".md", ".txt", ".py") and f.stat().st_size < 1000000:
            try:
                content = f.read_text(encoding="utf-8", errors="ignore")
                for r in SECRET_REGEXES:
                    if r.search(content):
                        violations.append(f"Potential secret pattern found in: {f.relative_to(ROOT_DIR)}")
            except Exception:
                pass
    return violations


def build_release_package(version: str, validate_only: bool = False) -> Tuple[bool, Dict[str, Any]]:
    """Assemble verified distribution package."""
    # 1. Check that production build exists
    if not (DIST_DIR / "index.html").exists():
        return False, {"error": "Production build not found in app/dist. Run 'npm.cmd run build' first."}

    # 2. Collect candidate files to include in release package
    included_paths: List[Path] = []
    
    # Static build
    for p in DIST_DIR.rglob("*"):
        if p.is_file():
            included_paths.append(p)

    # Core scripts and runners
    for s in (ROOT_DIR / "scripts").glob("*.py"):
        included_paths.append(s)

    # Tables & metadata
    for t in (ROOT_DIR / "tables").glob("*.csv"):
        included_paths.append(t)

    # Figures & maps
    for fig in (ROOT_DIR / "figures").glob("*"):
        if fig.is_file() and fig.suffix in (".png", ".html", ".svg"):
            included_paths.append(fig)

    # Config templates and requirements
    for cf in [ROOT_DIR / ".env.example", ROOT_DIR / "requirements-prod.txt", ROOT_DIR / "Dockerfile", ROOT_DIR / "docker-compose.yml"]:
        if cf.exists():
            included_paths.append(cf)

    # 3. Security audit of release candidates
    violations = audit_files_for_secrets(included_paths)
    if violations:
        return False, {"error": "Security audit failed", "violations": violations}

    # 4. Generate SBOM
    sbom = generate_sbom()

    if validate_only:
        return True, {
            "status": "VALIDATED",
            "version": version,
            "candidate_file_count": len(included_paths),
            "sbom_components": len(sbom["components"]),
        }

    # 5. Create release directory and zip package
    RELEASE_DIR.mkdir(parents=True, exist_ok=True)
    zip_filename = f"fraud-analytics-console-v{version}.zip"
    zip_path = RELEASE_DIR / zip_filename

    manifest: Dict[str, Any] = {
        "release_version": version,
        "built_at": datetime.now(timezone.utc).isoformat(),
        "total_files": len(included_paths),
        "files": [],
    }

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in included_paths:
            rel = p.relative_to(ROOT_DIR)
            zf.write(p, arcname=str(rel))
            manifest["files"].append({
                "path": str(rel).replace("\\", "/"),
                "size_bytes": p.stat().st_size,
                "sha256": compute_file_sha256(p),
            })

        # Embed release_manifest.json and sbom.json into zip
        manifest_bytes = json.dumps(manifest, indent=2).encode("utf-8")
        zf.writestr("release_manifest.json", manifest_bytes)
        sbom_bytes = json.dumps(sbom, indent=2).encode("utf-8")
        zf.writestr("sbom.json", sbom_bytes)

    # Write manifest and SBOM to disk as well
    with open(RELEASE_DIR / "release_manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    with open(RELEASE_DIR / "sbom.json", "w", encoding="utf-8") as f:
        json.dump(sbom, f, indent=2)

    zip_hash = compute_file_sha256(zip_path)
    zip_size = zip_path.stat().st_size

    # Write checksum file
    with open(RELEASE_DIR / f"{zip_filename}.sha256", "w", encoding="utf-8") as f:
        f.write(f"{zip_hash}  {zip_filename}\n")

    return True, {
        "status": "RELEASE_CREATED",
        "version": version,
        "package_path": str(zip_path).replace("\\", "/"),
        "package_size_bytes": zip_size,
        "package_sha256": zip_hash,
        "total_files": len(included_paths),
        "sbom_components": len(sbom["components"]),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build and validate release package")
    parser.add_argument("--validate-only", action="store_true", help="Audit without writing zip file")
    parser.add_argument("--version", type=str, default=None, help="Override release version")
    args = parser.parse_args()

    ver = args.version or get_version()
    ok, res = build_release_package(ver, validate_only=args.validate_only)

    if ok:
        print(f"RELEASE BUILD SUCCESS (v{ver})")
        print(json.dumps(res, indent=2))
        sys.exit(0)
    else:
        print(f"RELEASE BUILD FAILED: {res.get('error')}", file=sys.stderr)
        if "violations" in res:
            for v in res["violations"]:
                print(f"  Violation: {v}", file=sys.stderr)
        sys.exit(1)
