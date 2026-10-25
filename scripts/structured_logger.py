"""Structured JSON Logging Framework for the Fraud Analytics Platform.

Produces JSON Lines format logs with standardized fields:
timestamp, level, category, operation_id, duration_ms, error_class, outcome, message, and details.
Includes automated redaction of sensitive patterns.
"""
from __future__ import annotations

import json
import logging
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

ROOT_DIR = Path(__file__).resolve().parents[1]
LOGS_DIR = ROOT_DIR / "logs"

# Mask patterns for sensitive terms
SENSITIVE_KEYS = {"password", "secret", "token", "key", "authorization", "bearer", "cookie", "card", "ccv", "ssn"}


def mask_sensitive(data: Any) -> Any:
    """Recursively mask sensitive keys in dictionaries or strings."""
    if isinstance(data, dict):
        cleaned = {}
        for k, v in data.items():
            if any(s in k.lower() for s in SENSITIVE_KEYS):
                cleaned[k] = "******"
            else:
                cleaned[k] = mask_sensitive(v)
        return cleaned
    elif isinstance(data, list):
        return [mask_sensitive(item) for item in data]
    return data


class StructuredLogger:
    def __init__(self, name: str = "fraud-analytics", log_file: Optional[Path] = None, min_level: str = "INFO"):
        self.name = name
        self.log_file = log_file or (LOGS_DIR / "operational.jsonl")
        self.min_level = getattr(logging, min_level.upper(), logging.INFO)
        LOGS_DIR.mkdir(parents=True, exist_ok=True)

    def _log(
        self,
        level_name: str,
        category: str,
        message: str,
        operation_id: Optional[str] = None,
        duration_ms: Optional[float] = None,
        error_class: Optional[str] = None,
        outcome: str = "success",
        details: Optional[Dict[str, Any]] = None,
    ):
        level_num = getattr(logging, level_name.upper(), logging.INFO)
        if level_num < self.min_level:
            return

        entry: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": level_name.upper(),
            "logger": self.name,
            "category": category,
            "message": message,
            "outcome": outcome,
        }

        if operation_id:
            entry["operation_id"] = operation_id
        if duration_ms is not None:
            entry["duration_ms"] = round(duration_ms, 2)
        if error_class:
            entry["error_class"] = error_class
        if details:
            entry["details"] = mask_sensitive(details)

        json_str = json.dumps(entry, default=str)

        # Output to console
        if level_num >= logging.ERROR:
            sys.stderr.write(f"[{entry['timestamp']}] [{entry['level']}] [{category}] {message}\n")
        else:
            sys.stdout.write(f"[{entry['timestamp']}] [{entry['level']}] [{category}] {message}\n")

        # Append to jsonl file
        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(json_str + "\n")
        except Exception:
            pass

    def debug(self, category: str, message: str, **kwargs):
        self._log("DEBUG", category, message, **kwargs)

    def info(self, category: str, message: str, **kwargs):
        self._log("INFO", category, message, **kwargs)

    def warning(self, category: str, message: str, **kwargs):
        self._log("WARNING", category, message, outcome="warning", **kwargs)

    def error(self, category: str, message: str, **kwargs):
        self._log("ERROR", category, message, outcome="failure", **kwargs)


# Global default logger instance
logger = StructuredLogger()
