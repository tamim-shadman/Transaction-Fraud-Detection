"""Emit markdown + output extracts for human review."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
cells = json.loads((ROOT / "data" / "raw" / "notebook_cells.json").read_text(encoding="utf-8"))
parts = []
for c in cells:
    parts.append(f"\n\n{'='*90}\nCELL {c['index']:02d} [{c['type']}] exec={c['execution_count']}\n{'='*90}\n")
    if c["type"] == "markdown":
        parts.append(c["source"])
    else:
        src = c["source"]
        parts.append("--- SOURCE (truncated to 4000 chars) ---\n" + src[:4000])
        if c["output_text"]:
            parts.append("\n--- OUTPUT ---\n" + c["output_text"][:12000])
        if c["images"]:
            parts.append(f"\n[images: {len(c['images'])}]")
(ROOT / "data" / "raw" / "notebook_dump.txt").write_text("".join(parts), encoding="utf-8")
print("written", len("".join(parts)))
