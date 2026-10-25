"""Capture the Phase 1 baseline UI for the Phase 2 audit."""
from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:4173"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUT = Path(__file__).resolve().parent / "phase2_audit_shots"

PAGES = [
    ("overview", "/"),
    ("data-audit", "/data-audit"),
    ("distributions", "/distributions"),
    ("interactions", "/interactions"),
    ("temporal", "/temporal"),
    ("advanced", "/advanced"),
    ("statistics", "/statistics"),
    ("features", "/features"),
    ("model", "/model"),
    ("economics", "/economics"),
    ("findings", "/findings"),
    ("artifacts", "/artifacts"),
]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    report = []
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, headless=True)
        for label, width, height in [("desktop", 1440, 1000), ("mobile", 390, 844)]:
            context = browser.new_context(viewport={"width": width, "height": height})
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            for slug, route in PAGES:
                errors.clear()
                page.goto(BASE + route, wait_until="domcontentloaded", timeout=45000)
                page.wait_for_selector("main h1", timeout=45000)
                page.wait_for_timeout(900)
                metrics = page.evaluate(
                    """() => {
                      const main = document.querySelector('main');
                      const styles = getComputedStyle(document.body);
                      const chartEls = [...document.querySelectorAll('.chart')];
                      return {
                        bodyBg: styles.backgroundColor,
                        bodyColor: styles.color,
                        bodyFont: styles.fontFamily,
                        mainWidth: Math.round(main.getBoundingClientRect().width),
                        bodyHeight: document.body.scrollHeight,
                        overflow: document.body.scrollWidth - innerWidth,
                        chartHeights: chartEls.map(el => Math.round(el.getBoundingClientRect().height)),
                        emptyPanels: [...document.querySelectorAll('.panel')].filter(p => (p.innerText||'').trim().length < 20).length,
                        smallText: [...document.querySelectorAll('main *')].filter(el => {
                          const t = (el.childElementCount === 0 && el.textContent || '').trim();
                          if (!t || t.length < 3) return false;
                          const fs = parseFloat(getComputedStyle(el).fontSize);
                          return fs > 0 && fs < 10;
                        }).length,
                      }
                    }"""
                )
                page.screenshot(path=str(OUT / f"{label}-{slug}.png"), full_page=True)
                report.append({"viewport": label, "route": route, **metrics, "errors": list(errors)})
                print(label, route, "errors:", len(errors), "height:", metrics["bodyHeight"])
            context.close()
        browser.close()
    (OUT / "audit.json").write_text(json.dumps(report, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
