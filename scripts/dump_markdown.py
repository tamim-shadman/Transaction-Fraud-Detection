"""Dump markdown cell headers to a readable file."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
cells = json.loads((ROOT / "data" / "raw" / "notebook_cells.json").read_text(encoding="utf-8"))
out = []
for c in cells:
    if c["type"] == "markdown":
        out.append(f"\n## CELL {c['index']}\n" + c["source"][:2200])
(ROOT / "data" / "raw" / "markdown_headers.txt").write_text("\n".join(out), encoding="utf-8")
print("ok")
