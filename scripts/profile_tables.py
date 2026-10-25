"""Profile every CSV table in tables/ and figures/ index."""
import json
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
T = ROOT / "tables"
rows = []
for p in sorted(T.glob("*.csv")):
    try:
        df = pd.read_csv(p)
        rows.append({
            "file": p.name, "rows": len(df), "cols": len(df.columns),
            "columns": " | ".join(map(str, df.columns)),
            "nulls": int(df.isna().sum().sum()),
        })
        print(f"\n=== {p.name} rows={len(df)} cols={len(df.columns)} ===")
        print("columns:", list(df.columns))
        with pd.option_context("display.max_columns", 30, "display.width", 200, "display.max_colwidth", 80):
            print(df.head(6).to_string(index=False))
    except Exception as e:
        print(f"FAILED {p.name}: {e}")
        rows.append({"file": p.name, "rows": None, "cols": None, "columns": "", "nulls": None})
pd.DataFrame(rows).to_csv(ROOT / "data" / "raw" / "csv_profile.csv", index=False)
