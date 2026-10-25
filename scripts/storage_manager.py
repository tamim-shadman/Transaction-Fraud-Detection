"""Storage Management, Capacity Profiling, and Safe Cleanup Utility.

Profiles workspace disk consumption across storage categories and provides
safe, safeguarded cleanup of transient caches, staging files, and scratch sandboxes.

Usage:
  python scripts/storage_manager.py --action profile
  python scripts/storage_manager.py --action cleanup --dry-run
  python scripts/storage_manager.py --action cleanup --force
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple

ROOT_DIR = Path(__file__).resolve().parents[1]

# Protected canonical paths that must NEVER be deleted or modified by cleanup
PROTECTED_PATHS = [
    ROOT_DIR / "tables",
    ROOT_DIR / "figures",
    ROOT_DIR / "logs",
    ROOT_DIR / "powerbi",
    ROOT_DIR / "app" / "src",
    ROOT_DIR / "app" / "public" / "data" / "snapshots",
    ROOT_DIR / "fraud_eda_colab(1).ipynb",
]

# Ephemeral targets eligible for cleanup
CLEANUP_TARGETS = [
    ROOT_DIR / "app" / "public" / "data" / ".staging",
    ROOT_DIR / "scratch",
    ROOT_DIR / "tmp",
    ROOT_DIR / "backups" / "rehearsal_sandbox",
    ROOT_DIR / "backups" / "test_restore",
]


def measure_dir(path: Path) -> Tuple[int, int]:
    """Measure total bytes and file count in a directory."""
    if not path.exists():
        return 0, 0
    if path.is_file():
        return path.stat().st_size, 1

    total_bytes = 0
    count = 0
    for p in path.rglob("*"):
        if p.is_file():
            try:
                total_bytes += p.stat().st_size
                count += 1
            except Exception:
                pass
    return total_bytes, count


def profile_storage() -> Dict[str, Any]:
    """Generate comprehensive storage profile of the application workspace."""
    categories = [
        {"name": "Canonical Tables (CSV)", "path": ROOT_DIR / "tables", "class": "Source Data (Protected)"},
        {"name": "Research Figures & Maps", "path": ROOT_DIR / "figures", "class": "Visual Evidence (Protected)"},
        {"name": "Run Telemetry & Logs", "path": ROOT_DIR / "logs", "class": "Historical Telemetry (Protected)"},
        {"name": "Static Data Store (JSON)", "path": ROOT_DIR / "app" / "public" / "data", "class": "Derived Evidence"},
        {"name": "Historical Snapshots", "path": ROOT_DIR / "app" / "public" / "data" / "snapshots", "class": "Durable State (Protected)"},
        {"name": "Production Build (app/dist)", "path": ROOT_DIR / "app" / "dist", "class": "Application Bundle"},
        {"name": "Backup Archives", "path": ROOT_DIR / "backups", "class": "Disaster Recovery"},
        {"name": "Power BI Pack", "path": ROOT_DIR / "powerbi", "class": "Interoperability"},
        {"name": "Frontend Dependencies (node_modules)", "path": ROOT_DIR / "app" / "node_modules", "class": "Third-Party Build Tooling"},
        {"name": "Notebook Source", "path": ROOT_DIR / "fraud_eda_colab(1).ipynb", "class": "Source Notebook (Protected)"},
    ]

    total_workspace_bytes = 0
    breakdown = []

    for cat in categories:
        bytes_val, count_val = measure_dir(cat["path"])
        mb_val = round(bytes_val / (1024 * 1024), 2)
        total_workspace_bytes += bytes_val
        breakdown.append({
            "category": cat["name"],
            "path": str(cat["path"].relative_to(ROOT_DIR)).replace("\\", "/"),
            "persistence_class": cat["class"],
            "size_bytes": bytes_val,
            "size_mb": mb_val,
            "file_count": count_val,
        })

    # Sort breakdown by size descending
    breakdown.sort(key=lambda x: x["size_bytes"], reverse=True)

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_workspace_bytes": total_workspace_bytes,
        "total_workspace_mb": round(total_workspace_bytes / (1024 * 1024), 2),
        "storage_breakdown": breakdown,
    }


def find_cleanup_candidates() -> List[Dict[str, Any]]:
    """Identify transient and disposable files eligible for safe deletion."""
    candidates = []

    # 1. Ephemeral directories
    for target in CLEANUP_TARGETS:
        if target.exists():
            if target.is_dir():
                for p in target.rglob("*"):
                    if p.is_file():
                        candidates.append({
                            "path": str(p).replace("\\", "/"),
                            "size_bytes": p.stat().st_size,
                            "reason": f"Ephemeral file in {target.name}",
                        })
            elif target.is_file():
                candidates.append({
                    "path": str(target).replace("\\", "/"),
                    "size_bytes": target.stat().st_size,
                    "reason": "Ephemeral file",
                })

    # 2. Python bytecode caches (__pycache__, *.pyc)
    for p in ROOT_DIR.rglob("__pycache__"):
        if p.is_dir():
            for f in p.glob("*.pyc"):
                candidates.append({
                    "path": str(f).replace("\\", "/"),
                    "size_bytes": f.stat().st_size,
                    "reason": "Python bytecode cache",
                })

    # 3. Temporary *.tmp files
    for p in ROOT_DIR.glob("*.tmp"):
        if p.is_file():
            candidates.append({
                "path": str(p).replace("\\", "/"),
                "size_bytes": p.stat().st_size,
                "reason": "Temporary file",
            })

    return candidates


def execute_cleanup(dry_run: bool = True) -> Dict[str, Any]:
    """Execute or simulate cleanup with strict safeguards."""
    candidates = find_cleanup_candidates()
    total_reclaimable_bytes = sum(c["size_bytes"] for c in candidates)

    # Assert that NO candidate is in a protected directory
    for c in candidates:
        candidate_path = Path(c["path"])
        for prot in PROTECTED_PATHS:
            if candidate_path == prot or prot in candidate_path.parents:
                raise RuntimeError(
                    f"CRITICAL SAFETY VIOLATION: Candidate {candidate_path} is within protected directory {prot}! Aborting."
                )

    if dry_run:
        return {
            "status": "DRY_RUN_COMPLETED",
            "candidate_count": len(candidates),
            "reclaimable_bytes": total_reclaimable_bytes,
            "reclaimable_mb": round(total_reclaimable_bytes / (1024 * 1024), 2),
            "candidates": candidates,
            "message": "No files were deleted. Re-run with --force to execute.",
        }

    # Execute actual deletion
    deleted_count = 0
    for target in CLEANUP_TARGETS:
        if target.exists():
            try:
                if target.is_dir():
                    shutil.rmtree(target, ignore_errors=True)
                else:
                    target.unlink(missing_ok=True)
                deleted_count += 1
            except Exception:
                pass

    # Remove pyc files
    for p in ROOT_DIR.rglob("*.pyc"):
        try:
            p.unlink(missing_ok=True)
            deleted_count += 1
        except Exception:
            pass

    return {
        "status": "CLEANUP_EXECUTED",
        "deleted_count": deleted_count,
        "freed_bytes": total_reclaimable_bytes,
        "freed_mb": round(total_reclaimable_bytes / (1024 * 1024), 2),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Storage Manager and Capacity Profiler")
    parser.add_argument("--action", choices=["profile", "cleanup"], required=True)
    parser.add_argument("--dry-run", action="store_true", default=False, help="Simulate cleanup without deleting")
    parser.add_argument("--force", action="store_true", default=False, help="Execute destructive cleanup")
    args = parser.parse_args()

    if args.action == "profile":
        profile = profile_storage()
        print(f"=====================================================================")
        print(f"  WORKSPACE STORAGE PROFILE — Total: {profile['total_workspace_mb']} MB")
        print(f"=====================================================================")
        print(f"{'Category':<35} {'Class':<25} {'Size (MB)':>10} {'Files':>8}")
        print("-" * 80)
        for row in profile["storage_breakdown"]:
            print(f"{row['category']:<35} {row['persistence_class']:<25} {row['size_mb']:>10.2f} {row['file_count']:>8}")
        print("=" * 80)

    elif args.action == "cleanup":
        is_dry_run = not args.force or args.dry_run
        res = execute_cleanup(dry_run=is_dry_run)
        print(json.dumps(res, indent=2))
