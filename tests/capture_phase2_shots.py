"""Capture every Phase 2 route for visual review.

Usage: python tests/capture_phase2_shots.py
"""
from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:4173"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUT = Path(__file__).resolve().parent / "phase2_shots"

ROUTES = [
    ("overview", "/"),
    ("insights", "/insights"),
    ("program", "/program"),
    ("data-audit", "/data-audit"),
    ("distributions", "/distributions"),
    ("interactions", "/interactions"),
    ("temporal", "/temporal"),
    ("advanced", "/advanced"),
    ("statistics", "/statistics"),
    ("features", "/features"),
    ("model", "/model"),
    ("economics", "/economics"),
    ("experiments", "/experiments"),
    ("lineage", "/lineage"),
    ("logs", "/logs"),
    ("explore", "/explore"),
    ("metrics", "/metrics"),
    ("findings", "/findings"),
    ("artifacts", "/artifacts"),
]

VIEWPORTS = [("desktop", 1440, 1000), ("laptop", 1280, 900), ("tablet", 834, 1100), ("mobile", 390, 844)]

PROBE = """
() => {
  const main = document.querySelector('main');
  const styles = getComputedStyle(document.body);
  const small = [...document.querySelectorAll('main *')].filter(el => {
    const t = (el.childElementCount === 0 && el.textContent || '').trim();
    if (!t || t.length < 3) return false;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    return fs > 0 && fs < 10;
  }).length;
  const canvases = [...document.querySelectorAll('canvas')];
  const emptyCanvas = canvases.filter(c => c.width === 0 || c.height === 0).length;
  return {
    bodyBg: styles.backgroundColor,
    bodyColor: styles.color,
    height: document.body.scrollHeight,
    overflow: document.body.scrollWidth - window.innerWidth,
    smallText: small,
    nodes: document.querySelectorAll('*').length,
    charts: canvases.length,
    emptyCanvas,
    panels: document.querySelectorAll('.panel').length,
    headings: [...document.querySelectorAll('main h1, main h2')].slice(0, 3).map(h => h.textContent.trim().slice(0, 60)),
  };
}
"""


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    report = []
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, headless=True)
        for label, width, height in VIEWPORTS:
            context = browser.new_context(viewport={"width": width, "height": height})
            page = context.new_page()
            errors: list[str] = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            for slug, route in ROUTES:
                errors.clear()
                page.goto(BASE + route, wait_until="domcontentloaded", timeout=60000)
                page.wait_for_selector("main h1", timeout=60000)
                page.wait_for_timeout(1100)
                # trigger lazy images so gallery screenshots are complete
                page.evaluate("() => window.scrollTo(0, document.body.scrollHeight)")
                page.wait_for_timeout(700)
                page.evaluate("() => window.scrollTo(0, 0)")
                page.wait_for_timeout(250)
                metrics = page.evaluate(PROBE)
                page.screenshot(path=str(OUT / f"{label}-{slug}.png"), full_page=True)
                record = {"viewport": label, "route": route, **metrics, "errors": list(errors)}
                report.append(record)
                print(
                    f"{label:8} {route:16} errors={len(errors)} h={metrics['height']:6} "
                    f"overflow={metrics['overflow']} small={metrics['smallText']} charts={metrics['charts']}"
                )
            context.close()
        browser.close()
    (OUT / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    total_errors = sum(len(r["errors"]) for r in report)
    overflows = [r for r in report if r["overflow"] > 0]
    print(f"\nmeasurements={len(report)} console_errors={total_errors} overflow_failures={len(overflows)}")
    for r in overflows:
        print("  overflow", r["viewport"], r["route"], r["overflow"])


if __name__ == "__main__":
    main()
