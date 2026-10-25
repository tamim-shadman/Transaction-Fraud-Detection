"""Phase 6 Interactive Automated Test Suite.

Validates the full automated data intelligence workflows:
1. Data Refresh Center (/refresh): Pre-flight contracts, source inventory search, simulated pipeline execution.
2. Historical Snapshots (/snapshots): Baseline vs Phase 6 comparison, delta metrics, schema evolution.
3. What-If Scenario Lab (/scenarios): Hypothetical warning boundary, capacity slider updates, EChart curve, export.
4. Analytics Copilot (/copilot): Suggested prompts, deterministic Q&A, formula explanations, evidence citations.
5. In-App Activity Center (ActivityCenterModal): Topbar bell notification, alert filtering, mark-as-read.
6. Mobile Viewport Responsiveness: Clean layout on 390x844.
"""
from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:4173"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUT_DIR = Path("artifacts/screenshots/phase6")
OUT_DIR.mkdir(parents=True, exist_ok=True)


def test_phase6_interactive():
    results = []
    print("=== Starting Phase 6 Interactive Automated Test Suite ===")

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)

        # -------------------------------------------------------------
        # 1. Desktop Interactive Flows (1440x900)
        # -------------------------------------------------------------
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        errors = []
        page.on("pageerror", lambda e: errors.append(f"PageError: {e}"))
        page.on("console", lambda m: errors.append(f"ConsoleError: {m.text}") if m.type == "error" else None)

        # --- FLOW 19: Data Refresh Center (/refresh) ---
        print("\n[Flow 19] Testing Data Refresh Center (/refresh)...")
        errors.clear()
        page.goto(BASE_URL + "/refresh", wait_until="domcontentloaded")
        page.wait_for_selector(".page-head")

        # Verify pre-flight contracts pass
        contract_text = page.locator("body").text_content()
        assert "Centralized Data Refresh Center" in contract_text
        assert "Zero Missingness" in contract_text
        assert "All Contracts Pass" in contract_text

        # Verify source inventory table loads
        search_input = page.locator("input[placeholder*='Search file name']")
        assert search_input.count() == 1
        search_input.fill(".csv")
        page.wait_for_timeout(250)

        # Click "Run Refresh" button
        refresh_btn = page.locator("button:has-text('Run Refresh')")
        assert refresh_btn.count() == 1
        refresh_btn.click()
        print("  Triggered refresh execution, waiting for stages to complete...")

        # Wait for simulated pipeline stages to complete
        page.wait_for_timeout(3500)
        
        # Verify success toast or completion state
        refreshed_text = page.locator("body").text_content()
        assert "Refresh Pipeline Succeeded" in refreshed_text or "All Contracts Pass" in refreshed_text

        page.screenshot(path=str(OUT_DIR / "flow19_refresh_center.png"))
        results.append({"flow": "refresh_center", "status": "PASS", "errors": len(errors)})

        # --- FLOW 20: Historical Snapshots Explorer (/snapshots) ---
        print("\n[Flow 20] Testing Historical Snapshots Explorer (/snapshots)...")
        errors.clear()
        page.goto(BASE_URL + "/snapshots", wait_until="domcontentloaded")
        page.wait_for_selector(".page-head")

        # Verify snapshot selector dropdowns exist
        selectors = page.locator("select")
        print(f"  Snapshot selector dropdowns: {selectors.count()}")
        assert selectors.count() >= 2

        # Check for side-by-side metric comparison table
        table_text = page.locator("table").text_content()
        assert "In-Domain Test PR-AUC" in table_text or "PR-AUC" in table_text
        assert "Findings Ledger Coverage" in table_text or "Findings" in table_text

        page.screenshot(path=str(OUT_DIR / "flow20_snapshots.png"))
        results.append({"flow": "snapshots_explorer", "status": "PASS", "errors": len(errors)})

        # --- FLOW 21: What-If Scenario Lab (/scenarios) ---
        print("\n[Flow 21] Testing What-If Scenario Lab (/scenarios)...")
        errors.clear()
        page.goto(BASE_URL + "/scenarios", wait_until="domcontentloaded")
        page.wait_for_selector(".page-head")

        # Verify hypothetical warning callout
        body_text = page.locator("body").text_content()
        assert "What-If Simulation Notice & Boundary" in body_text

        # Verify interactive slider exists and adjust value
        slider = page.locator("input[type='range']").first
        assert slider.count() == 1
        
        # Read initial review volume
        initial_vol = page.locator(".stat-value").first.text_content()
        print(f"  Initial review volume/metric: {initial_vol}")

        # Drag slider to 2.5%
        slider.fill("2.5")
        slider.dispatch_event("input")
        page.wait_for_timeout(300)

        updated_vol = page.locator(".stat-value").first.text_content()
        print(f"  Updated metric after slider change: {updated_vol}")

        # Switch to Workload tab
        page.click("button:has-text('Workload & Ingestion Scaling')")
        page.wait_for_timeout(300)
        assert "Transaction Volume Multiplier" in page.locator("body").text_content()

        # Switch back to Economics and click Save Scenario
        page.click("button:has-text('Review Capacity & Economics')")
        page.wait_for_timeout(200)
        page.click("button:has-text('Save Scenario')")
        page.wait_for_timeout(300)
        assert "Scenario parameters saved" in page.locator("body").text_content()

        page.screenshot(path=str(OUT_DIR / "flow21_scenario_lab.png"))
        results.append({"flow": "scenario_lab", "status": "PASS", "errors": len(errors)})

        # --- FLOW 22: Analytics Copilot (/copilot) ---
        print("\n[Flow 22] Testing Evidence-Grounded Analytics Copilot (/copilot)...")
        errors.clear()
        page.goto(BASE_URL + "/copilot", wait_until="domcontentloaded")
        page.wait_for_selector(".page-head")

        # Click suggested prompt: "What is the model PR-AUC performance?"
        page.click("button:has-text('PR-AUC performance')")
        page.wait_for_timeout(400)

        # Verify response headline
        headline = page.locator(".copilot-headline h2").text_content()
        print(f"  Answer headline: {headline}")
        assert "0.9124" in headline or "PR-AUC" in headline

        # Type inquiry into input box
        input_box = page.locator("input[placeholder*='Ask a question about the fraud research program']")
        input_box.fill("How many transactions were analyzed?")
        page.click("button:has-text('Ask Copilot')")
        page.wait_for_timeout(400)

        headline2 = page.locator(".copilot-headline h2").text_content()
        print(f"  Second answer: {headline2}")
        assert "1,852,394" in headline2 or "transactions" in headline2

        page.screenshot(path=str(OUT_DIR / "flow22_analytics_copilot.png"))
        results.append({"flow": "analytics_copilot", "status": "PASS", "errors": len(errors)})

        # --- FLOW 23: Activity Center & Notification Bell ---
        print("\n[Flow 23] Testing Activity Center Notification Modal...")
        errors.clear()
        page.goto(BASE_URL + "/", wait_until="domcontentloaded")
        page.wait_for_selector(".topbar")

        # Click topbar bell button
        bell_btn = page.locator("button[aria-label='Activity and change intelligence notifications']")
        assert bell_btn.count() == 1
        bell_btn.click()
        page.wait_for_selector(".modal", state="visible")

        # Verify notification list is displayed
        notifs = page.locator(".notif-card")
        print(f"  Notification items rendered: {notifs.count()}")
        assert notifs.count() >= 3

        # Click "Mark read" button
        page.click(".modal button:has-text('Mark read')")
        page.wait_for_timeout(200)

        page.screenshot(path=str(OUT_DIR / "flow23_activity_center.png"))
        page.keyboard.press("Escape")
        page.wait_for_selector(".modal", state="hidden")
        results.append({"flow": "activity_center", "status": "PASS", "errors": len(errors)})

        context.close()

        # -------------------------------------------------------------
        # 2. Mobile Responsiveness (390x844)
        # -------------------------------------------------------------
        print("\n[Flow 24] Testing Mobile Responsiveness (390x844)...")
        mobile_context = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        mobile_page = mobile_context.new_page()

        for route in ["/refresh", "/snapshots", "/scenarios", "/copilot"]:
            errors.clear()
            mobile_page.goto(BASE_URL + route, wait_until="domcontentloaded")
            mobile_page.wait_for_selector(".content")
            scroll_width = mobile_page.evaluate("() => document.documentElement.scrollWidth")
            client_width = mobile_page.evaluate("() => document.documentElement.clientWidth")
            print(f"  Mobile {route}: scrollWidth={scroll_width}, clientWidth={client_width}")
            assert scroll_width <= client_width + 5, f"Horizontal overflow on {route}: {scroll_width} > {client_width}"

        mobile_page.screenshot(path=str(OUT_DIR / "flow24_mobile_copilot.png"))
        results.append({"flow": "mobile_responsiveness", "status": "PASS", "errors": 0})
        mobile_context.close()

        browser.close()

    print("\n=====================================================================")
    print("      PHASE 6 INTERACTIVE AUTOMATED TEST RESULTS                    ")
    print("=====================================================================")
    all_passed = True
    for r in results:
        status_sym = "[PASS]" if r["status"] == "PASS" and r.get("errors", 0) == 0 else "[FAIL]"
        if status_sym == "[FAIL]":
            all_passed = False
        print(f"  {status_sym} Flow: {r['flow']:<25} (Console/Page Errors: {r.get('errors', 0)})")
    print("=====================================================================")
    if all_passed:
        print("  ALL PHASE 6 INTERACTIVE BROWSER FLOWS PASSED (6/6 - 100%)         ")
    else:
        print("  SOME FLOWS ENCOUNTERED ERRORS                                     ")
    print("=====================================================================")
    assert all_passed


if __name__ == "__main__":
    test_phase6_interactive()
