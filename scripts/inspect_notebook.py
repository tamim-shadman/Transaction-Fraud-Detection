"""Inspect notebook cells and outputs; emit a machine-readable cell index."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NB = ROOT / "fraud_eda_colab(1).ipynb"

nb = json.loads(NB.read_text(encoding="utf-8"))
cells = []
for i, c in enumerate(nb["cells"]):
    src = "".join(c.get("source", []))
    outs = c.get("outputs", [])
    text_parts = []
    images = []
    for o in outs:
        if o.get("output_type") == "stream":
            text_parts.append("".join(o.get("text", [])))
        elif o.get("output_type") in ("execute_result", "display_data"):
            data = o.get("data", {})
            if "text/plain" in data:
                text_parts.append("".join(data["text/plain"]))
            if "image/png" in data:
                images.append({"mime": "image/png", "chars": len(data["image/png"])})
        elif o.get("output_type") == "error":
            text_parts.append("\n".join(o.get("traceback", [])))
    lines = src.strip().splitlines()
    cells.append({
        "index": i,
        "type": c["cell_type"],
        "execution_count": c.get("execution_count"),
        "source_first": lines[0][:160] if lines else "",
        "source_chars": len(src),
        "source": src,
        "output_text": "\n".join(text_parts),
        "output_chars": sum(len(t) for t in text_parts),
        "images": images,
    })

out = ROOT / "data" / "raw"
out.mkdir(parents=True, exist_ok=True)
(out / "notebook_cells.json").write_text(json.dumps(cells, indent=2, ensure_ascii=False), encoding="utf-8")

for c in cells:
    print(f"{c['index']:02d} {c['type']:8s} exec={c['execution_count']} out={c['output_chars']:7d} imgs={len(c['images'])} | {c['source_first']}")

print("\nTotal cells:", len(cells))
print("Code cells:", sum(c["type"] == "code" for c in cells))
print("Markdown cells:", sum(c["type"] == "markdown" for c in cells))
print("Cells with output:", sum(c["output_chars"] > 0 for c in cells))
print("Total output chars:", sum(c["output_chars"] for c in cells))
