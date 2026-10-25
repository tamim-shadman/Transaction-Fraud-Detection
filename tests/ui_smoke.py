"""Headless UI smoke test for the Fraud Evidence Console.

Requires the Vite dev server at http://127.0.0.1:4173 and Playwright for Python.
Run: python tests/ui_smoke.py
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = os.environ.get("APP_URL", "http://127.0.0.1:4173")
CHROME = os.environ.get("CHROME_PATH", r"C:\Program Files\Google\Chrome\Application\chrome.exe")
OUT = Path(os.environ.get("UI_CHECK_OUT", Path(__file__).resolve().parent / "ui_check"))

ROUTES = [
    ("/", "Overview"),
    ("/data-audit", "Data audit"),
    ("/distributions", "Distributions"),
    ("/interactions", "Interactions"),
    ("/temporal", "Temporal"),
    ("/advanced", "Advanced viz"),
    ("/statistics", "Statistics"),
    ("/features", "Feature lab"),
    ("/model", "Model"),
    ("/economics", "Economics"),
    ("/findings", "Findings"),
    ("/artifacts", "Artifacts"),
]

VIEWPORTS = [
    ("desktop", 1440, 1000),
    ("laptop", 1280, 900),
    ("tablet", 1000, 900),
    ("mobile-landscape", 768, 900),
    ("mobile", 390, 844),
]


def measure(page) -> dict:
    return page.evaluate(
        """() => {
          const charts = [...document.querySelectorAll('.chart')].map((el) => {
            const box = el.getBoundingClientRect();
            const canvas = el.querySelector('canvas');
            return {
              w: Math.round(box.width),
              h: Math.round(box.height),
              canvasW: canvas ? canvas.width : null,
            };
          });
          const main = document.querySelector('main');
          return {
            h1: main?.querySelector('h1')?.innerText ?? null,
            sub: main?.querySelector('.page-sub')?.innerText?.slice(0, 160) ?? null,
            panels: document.querySelectorAll('main .panel').length,
            charts: charts.length,
            minChartW: charts.length ? Math.min(...charts.map((c) => c.w)) : null,
            canvasMismatch: charts.filter((c) => c.canvasW !== null && Math.abs(c.canvasW - c.w) > 2).length,
            tables: document.querySelectorAll('main table').length,
            bodyScrollW: document.body.scrollWidth,
            innerW: window.innerWidth,
            overflow: document.body.scrollWidth - window.innerWidth,
            bodyH: document.body.scrollHeight,
            mainText: (main?.innerText ?? '').length,
            navItems: document.querySelectorAll('.nav-item').length,
          };
        }"""
    )


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    results = []
    failed = False
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, headless=True)
        for label, width, height in VIEWPORTS:
            context = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=1)
            page = context.new_page()
            errors: list[str] = []
            page.on("pageerror", lambda error: errors.append(f"pageerror: {error}"))
            page.on("console", lambda msg: errors.append(f"console: {msg.text}") if msg.type == "error" else None)
            for route, name in ROUTES:
                # Full matrix at desktop and mobile; representative pages at intermediate widths.
                if label not in ("desktop", "mobile") and route not in ("/", "/distributions", "/model", "/findings", "/artifacts"):
                    continue
                page.goto(BASE + route, wait_until="domcontentloaded", timeout=45_000)
                page.wait_for_selector("main h1", timeout=45_000)
                page.wait_for_timeout(500)
                info = measure(page)
                info.update({"viewport": label, "route": route, "name": name, "errors": list(errors)})
                results.append(info)
                if info["h1"] is None or info["panels"] == 0 or info["overflow"] > 1 or info["canvasMismatch"]:
                    failed = True
                errors.clear()
                if label in ("desktop", "mobile") and route in ("/", "/distributions", "/model", "/findings", "/artifacts"):
                    page.screenshot(path=str(OUT / f"{label}-{name.lower().replace(' ', '-')}.png"), full_page=True)
            context.close()
        browser.close()

    (OUT / "results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")

    print(f"{'viewport':<18}{'route':<18}{'h1':<6}{'panels':>7}{'charts':>7}{'minW':>7}{'overflow':>9}{'bodyH':>8}")
    for row in results:
        print(
            f"{row['viewport']:<18}{row['route']:<18}{('yes' if row['h1'] else 'NO'):<6}"
            f"{row['panels']:>7}{row['charts']:>7}{str(row['minChartW']):>7}{row['overflow']:>9}{row['bodyH']:>8}"
        )
        for error in row["errors"]:
            print(f"  ERROR {error}")
    print(f"\nWrote {OUT / 'results.json'}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
