"""Comprehensive Browser QA, Responsiveness Audit, and Layout Inspector.

Tests all 20 routes across all 10 target viewports in both Dark and Light themes.
Records horizontal overflow, small text violations, empty/clipped canvases,
target size issues, console errors, and full-page screenshots.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any

sys.stdout.reconfigure(line_buffering=True)

from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:4173"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

VIEWPORTS = [
    ("large-desktop", 1920, 1080),
    ("desktop", 1440, 900),
    ("laptop", 1366, 768),
    ("compact-laptop", 1280, 800),
    ("small-desktop", 1024, 768),
    ("tablet-portrait", 768, 1024),
    ("large-mobile", 430, 932),
    ("standard-mobile", 390, 844),
    ("compact-mobile", 360, 800),
    ("narrow-mobile", 320, 700),
]

ROUTES = [
    ("overview", "/"),
    ("portfolio", "/portfolio"),
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

AUDIT_SCRIPT = """
() => {
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const docW = document.documentElement.scrollWidth;
  const docH = document.documentElement.scrollHeight;
  const hOverflow = Math.max(0, docW - winW);

  // Find culprits extending past window width
  const overflowCulprits = [];
  const allElements = document.querySelectorAll('*');
  for (const el of allElements) {
    if (el.tagName === 'HTML' || el.tagName === 'BODY' || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.right > winW + 1.5) {
      // check if it is inside an intentional scroll container
      let p = el.parentElement;
      let insideScroller = false;
      while (p && p !== document.body) {
        const overflowX = getComputedStyle(p).overflowX;
        if (overflowX === 'auto' || overflowX === 'scroll') {
          insideScroller = true;
          break;
        }
        p = p.parentElement;
      }
      if (!insideScroller) {
        overflowCulprits.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : '',
          id: el.id || '',
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          overflowAmount: Math.round(rect.right - winW)
        });
      }
    }
  }

  // Small text check (< 10.4px)
  const smallTextElements = [];
  for (const el of document.querySelectorAll('main *')) {
    if (el.childElementCount === 0) {
      const text = (el.textContent || '').trim();
      if (text.length >= 2) {
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs > 0 && fs < 10.4) {
          smallTextElements.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className && typeof el.className === 'string') ? el.className.slice(0, 60) : '',
            fs: fs,
            text: text.slice(0, 40)
          });
        }
      }
    }
  }

  // Canvases check
  const canvases = [...document.querySelectorAll('canvas')];
  const emptyCanvases = canvases.filter(c => c.width === 0 || c.height === 0).length;
  const clippedCanvases = [];
  for (const c of canvases) {
    const parent = c.parentElement;
    if (parent) {
      const pRect = parent.getBoundingClientRect();
      const cRect = c.getBoundingClientRect();
      if (cRect.width > pRect.width + 2) {
        clippedCanvases.push({
          canvasWidth: Math.round(cRect.width),
          parentWidth: Math.round(pRect.width)
        });
      }
    }
  }

  // Touch target check on mobile (< 24px width or height for buttons/links)
  const tinyTouchTargets = [];
  if (winW <= 430) {
    const clickables = document.querySelectorAll('button:not(:disabled), a[href], select, input[type="button"], input[type="submit"]');
    for (const el of clickables) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.width < 22 || r.height < 22)) {
        tinyTouchTargets.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className && typeof el.className === 'string') ? el.className.slice(0, 50) : '',
          w: Math.round(r.width),
          h: Math.round(r.height),
          text: (el.textContent || '').trim().slice(0, 30)
        });
      }
    }
  }

  return {
    winW,
    winH,
    docW,
    docH,
    hOverflow,
    culpritCount: overflowCulprits.length,
    topCulprits: overflowCulprits.slice(0, 5),
    smallTextCount: smallTextElements.length,
    smallTextSamples: smallTextElements.slice(0, 5),
    canvasCount: canvases.length,
    emptyCanvases,
    clippedCanvasCount: clippedCanvases.length,
    tinyTouchTargetCount: tinyTouchTargets.length,
    theme: document.documentElement.getAttribute('data-theme') || 'dark',
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyColor: getComputedStyle(document.body).color
  };
}
"""


def run_audit(
    phase_label: str = "before",
    filter_viewport: str | None = None,
    filter_route: str | None = None,
    test_light_theme: bool = False,
    take_screenshots: bool = True,
) -> dict[str, Any]:
    out_dir = Path("artifacts/screenshots") / phase_label
    out_dir.mkdir(parents=True, exist_ok=True)
    report_dir = Path("artifacts/reports")
    report_dir.mkdir(parents=True, exist_ok=True)

    records: list[dict[str, Any]] = []
    total_overflows = 0
    total_errors = 0
    total_small_text = 0

    target_viewports = VIEWPORTS
    if filter_viewport:
        target_viewports = [v for v in VIEWPORTS if v[0] == filter_viewport]

    target_routes = ROUTES
    if filter_route:
        target_routes = [r for r in ROUTES if r[0] == filter_route or r[1] == filter_route]

    print(f"=== Starting Comprehensive Browser QA: {phase_label.upper()} ===")
    print(f"Routes: {len(target_routes)} | Viewports: {len(target_viewports)} | Light Theme: {test_light_theme}")

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)

        for vp_name, width, height in target_viewports:
            print(f"\n--- Testing Viewport: {vp_name} ({width}x{height}) ---")
            context = browser.new_context(viewport={"width": width, "height": height})
            page = context.new_page()

            page_errors: list[str] = []
            failed_requests: list[str] = []

            page.on("pageerror", lambda err: page_errors.append(str(err)))
            page.on(
                "console",
                lambda msg: page_errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None,
            )
            page.on(
                "response",
                lambda res: failed_requests.append(f"{res.status} {res.url}") if res.status >= 400 else None,
            )

            for slug, path in target_routes:
                page_errors.clear()
                failed_requests.clear()
                url = BASE_URL + path

                try:
                    page.goto(url, wait_until="domcontentloaded", timeout=45000)
                    page.wait_for_selector("main h1", timeout=30000)
                    page.wait_for_timeout(400)

                    if test_light_theme:
                        # Set light theme on root
                        page.evaluate("() => document.documentElement.setAttribute('data-theme', 'light')")
                        page.wait_for_timeout(200)

                    # Trigger scroll to load any lazy images, then scroll back
                    page.evaluate("() => window.scrollTo(0, document.body.scrollHeight)")
                    page.wait_for_timeout(350)
                    page.evaluate("() => window.scrollTo(0, 0)")
                    page.wait_for_timeout(200)

                    metrics = page.evaluate(AUDIT_SCRIPT)

                    screenshot_path = ""
                    if take_screenshots:
                        theme_prefix = "light-" if test_light_theme else ""
                        filename = f"{theme_prefix}{vp_name}-{slug}.png"
                        file_dest = out_dir / filename
                        page.screenshot(path=str(file_dest), full_page=True)
                        screenshot_path = str(file_dest)

                    rec = {
                        "phase": phase_label,
                        "viewport": vp_name,
                        "width": width,
                        "height": height,
                        "route": path,
                        "slug": slug,
                        "screenshot": screenshot_path,
                        **metrics,
                        "pageErrors": list(page_errors),
                        "failedRequests": list(failed_requests),
                    }
                    records.append(rec)

                    h_over = metrics["hOverflow"]
                    s_text = metrics["smallTextCount"]
                    err_cnt = len(page_errors) + len(failed_requests)

                    total_overflows += 1 if h_over > 0 else 0
                    total_errors += err_cnt
                    total_small_text += s_text

                    status = "PASS" if (h_over == 0 and err_cnt == 0 and s_text == 0) else "FAIL"
                    print(
                        f"  [{status}] {slug:15} | over={h_over:2}px | small={s_text:2} | empty_c={metrics['emptyCanvases']} | errs={err_cnt}"
                    )
                    if h_over > 0 and metrics["topCulprits"]:
                        for c in metrics["topCulprits"][:2]:
                            print(f"       -> Overflow culprit: <{c['tag']} class='{c['cls']}'> right={c['right']} (over by {c['overflowAmount']}px)")

                except Exception as ex:
                    print(f"  [ERROR] {slug} threw exception: {ex}")
                    records.append({
                        "phase": phase_label,
                        "viewport": vp_name,
                        "width": width,
                        "height": height,
                        "route": path,
                        "slug": slug,
                        "fatalError": str(ex),
                    })
                    total_errors += 1

            context.close()
        browser.close()

    summary = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "phase": phase_label,
        "totalEvaluations": len(records),
        "totalOverflows": total_overflows,
        "totalErrors": total_errors,
        "totalSmallText": total_small_text,
        "records": records,
    }

    report_path = report_dir / f"{phase_label}-results.json"
    report_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"\nAudit complete! Wrote summary to {report_path}")
    print(f"Evaluations: {len(records)} | Overflows: {total_overflows} | Errors: {total_errors} | Small Text: {total_small_text}")
    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--phase", default="before", help="Phase label: before, after, etc.")
    parser.add_argument("--viewport", default=None, help="Specific viewport to test")
    parser.add_argument("--route", default=None, help="Specific route slug to test")
    parser.add_argument("--light", action="store_true", help="Audit light theme")
    parser.add_argument("--no-screens", action="store_true", help="Skip saving screenshots")
    args = parser.parse_args()

    run_audit(
        phase_label=args.phase,
        filter_viewport=args.viewport,
        filter_route=args.route,
        test_light_theme=args.light,
        take_screenshots=not args.no_screens,
    )
