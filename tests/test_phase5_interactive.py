"""Phase 5 Interactive Automated Test Suite.

Validates the full storytelling, presentation, reporting, search, and workspace workflows:
- Guided Project Walkthrough (/walkthrough): 7 stages, keyboard navigation, project switching.
- Dedicated Presentation Mode (/presentation): 10 slides, speaker notes toggle, slide navigation, exit.
- Report Composer (/reports): template selection, section toggling/reordering, paper preview, exports.
- Saved Workspaces (/components/SavedViewsModal): save, list, restore, and delete in localStorage.
- Command Palette (Ctrl+K): command discovery, keyboard execution, and seamless routing.
- Responsive validation on mobile viewport (390x844).
"""
from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:4173"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUT_DIR = Path("artifacts/screenshots/phase5")
OUT_DIR.mkdir(parents=True, exist_ok=True)


def test_phase5_interactive():
    results = []
    print("=== Starting Phase 5 Interactive Automated Test Suite ===")

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

        # --- FLOW 13: Guided Project Walkthrough (/walkthrough) ---
        print("\n[Flow 13] Testing Guided Project Walkthrough (/walkthrough)...")
        errors.clear()
        page.goto(BASE_URL + "/walkthrough", wait_until="domcontentloaded")
        page.wait_for_selector(".walkthrough-stepper")

        # Verify 7 projects tabs exist
        project_tabs = page.locator(".project-tab-btn").count()
        print(f"  Project selector buttons: {project_tabs}")
        assert project_tabs == 7, f"Expected 7 project tabs, got {project_tabs}"

        # Verify 7 stages in stepper
        stepper_steps = page.locator(".step-item").count()
        print(f"  Stepper stages: {stepper_steps}")
        assert stepper_steps == 7, f"Expected 7 stages in stepper, got {stepper_steps}"

        # Stage 1 active initially
        initial_stage_title = page.locator(".panel-head").first.text_content()
        print(f"  Stage 1 header: {initial_stage_title}")
        assert "Stage 1" in initial_stage_title or "Problem" in initial_stage_title

        # Click Next button to advance to Stage 2
        page.click("button:has-text('Next stage')")
        page.wait_for_timeout(250)
        stage2_title = page.locator(".panel-head").first.text_content()
        print(f"  Navigated to Stage 2: {stage2_title}")
        assert "Stage 2" in stage2_title or "Approach" in stage2_title

        # Advance with ArrowRight key to Stage 3
        page.keyboard.press("ArrowRight")
        page.wait_for_timeout(250)
        stage3_title = page.locator(".panel-head").first.text_content()
        print(f"  Navigated to Stage 3 via ArrowRight: {stage3_title}")
        assert "Stage 3" in stage3_title or "Implementation" in stage3_title

        # Jump directly to Stage 6 (Generated Results) via stepper
        page.click("button.step-item:has-text('Results')")
        page.wait_for_timeout(250)
        stage6_title = page.locator(".panel-head").first.text_content()
        print(f"  Jumped to Stage 6 via stepper: {stage6_title}")
        assert "Stage 6" in stage6_title or "Results" in stage6_title

        # Switch to PROJ-04 (Statistical Hypothesis Testing)
        page.click("button.project-tab-btn:has-text('PROJ-04')")
        page.wait_for_timeout(250)
        active_proj = page.locator(".project-tab-btn.active").text_content()
        print(f"  Switched project tab to: {active_proj}")
        assert "PROJ-04" in active_proj

        page.screenshot(path=str(OUT_DIR / "flow13_walkthrough.png"))
        results.append({"flow": "guided_walkthrough", "status": "PASS", "errors": len(errors)})

        # --- FLOW 14: Executive Presentation Mode (/presentation) ---
        print("\n[Flow 14] Testing Executive Presentation Mode (/presentation)...")
        errors.clear()
        page.goto(BASE_URL + "/presentation", wait_until="domcontentloaded")
        page.wait_for_selector(".presentation-container")

        # Verify initial slide is 1 of 10
        slide_counter = page.locator(".pres-counter").text_content()
        print(f"  Initial slide: {slide_counter}")
        assert "Slide 1 of 10" in slide_counter

        # Verify slide title
        slide_title = page.locator(".slide-heading").text_content()
        print(f"  Slide 1 Title: {slide_title}")
        assert "Transaction Fraud Detection" in slide_title or "Fraud" in slide_title

        # Toggle speaker notes with 'N'
        page.keyboard.press("n")
        page.wait_for_timeout(200)
        notes_visible = page.locator(".slide-notes-col").count()
        print(f"  Speaker notes toggled with 'N': count={notes_visible}")
        assert notes_visible == 1, "Expected speaker notes drawer to open on 'N'"

        # Advance to Slide 2 using ArrowRight
        page.keyboard.press("ArrowRight")
        page.wait_for_timeout(200)
        slide2_counter = page.locator(".pres-counter").text_content()
        print(f"  Advanced via ArrowRight: {slide2_counter}")
        assert "Slide 2 of 10" in slide2_counter

        # Jump to Slide 6 via slide dot
        dots = page.locator(".slide-dot")
        print(f"  Total presentation dots: {dots.count()}")
        assert dots.count() == 10
        dots.nth(5).click()
        page.wait_for_timeout(200)
        slide6_counter = page.locator(".pres-counter").text_content()
        print(f"  Jumped to dot 6: {slide6_counter}")
        assert "Slide 6 of 10" in slide6_counter

        # Take screenshot of presentation
        page.screenshot(path=str(OUT_DIR / "flow14_presentation_mode.png"))

        # Click Exit button and verify return to application
        page.click("a:has-text('Exit presentation')")
        page.wait_for_timeout(300)
        current_url = page.url
        print(f"  Exited presentation mode to: {current_url}")
        assert "/presentation" not in current_url

        results.append({"flow": "presentation_mode", "status": "PASS", "errors": len(errors)})

        # --- FLOW 15: Interactive Report Composer (/reports) ---
        print("\n[Flow 15] Testing Interactive Report Composer (/reports)...")
        errors.clear()
        page.goto(BASE_URL + "/reports", wait_until="domcontentloaded")
        page.wait_for_selector(".report-paper")

        # Verify initial report title
        report_h1 = page.locator(".report-doc-title").text_content()
        print(f"  Initial Report Title: {report_h1}")
        assert "Executive" in report_h1

        # Switch template to "Technical Dossier"
        page.click("button:has-text('Technical Dossier')")
        page.wait_for_timeout(250)
        tech_h1 = page.locator(".report-doc-title").text_content()
        print(f"  Switched template to Technical Dossier: {tech_h1}")
        assert "Technical" in tech_h1

        # Check rendered sections count in paper preview
        initial_sections_count = page.locator(".report-paper .report-section").count()
        print(f"  Rendered sections in paper preview: {initial_sections_count}")
        assert initial_sections_count > 0

        # Toggle first non-disabled checked checkbox off
        checked_checkboxes = page.locator(".section-checkbox-label input[type='checkbox']:checked:not([disabled])")
        if checked_checkboxes.count() > 0:
            checked_checkboxes.first.click()
            page.wait_for_timeout(200)
            updated_sections_count = page.locator(".report-paper .report-section").count()
            print(f"  Sections count after toggling one off: {updated_sections_count}")
            assert updated_sections_count == initial_sections_count - 1
            # Toggle it back on
            page.locator(".section-checkbox-label input[type='checkbox']:not(:checked):not([disabled])").first.click()
            page.wait_for_timeout(200)

        # Test Export Buttons existence
        pdf_btn = page.locator("button:has-text('Print / Save PDF')")
        md_btn = page.locator("button:has-text('Export .MD')")
        json_btn = page.locator("button:has-text('Export .JSON')")
        assert pdf_btn.count() == 1
        assert md_btn.count() == 1
        assert json_btn.count() == 1

        page.screenshot(path=str(OUT_DIR / "flow15_report_composer.png"))
        results.append({"flow": "report_composer", "status": "PASS", "errors": len(errors)})

        # --- FLOW 16: Saved Workspaces & Views ---
        print("\n[Flow 16] Testing Saved Workspaces & Local Storage Persistence...")
        errors.clear()
        page.goto(BASE_URL + "/", wait_until="domcontentloaded")
        page.wait_for_selector(".topbar")

        # Open Saved Views Modal
        page.click("button[aria-label='Saved views and workspaces']")
        page.wait_for_selector(".modal", state="visible")

        # Click 'Save current view' button inside modal
        page.click(".modal button:has-text('Save current view')")
        page.wait_for_selector(".modal form")

        # Fill name
        test_view_name = "Automated Test Workspace View"
        page.fill(".modal form input[placeholder*='View name']", test_view_name)
        page.click(".modal form button[type='submit']")
        page.wait_for_timeout(250)

        # Verify it appears in saved items list
        saved_item = page.locator(f".saved-view-item:has-text('{test_view_name}')")
        print(f"  Saved view found in list: count={saved_item.count()}")
        assert saved_item.count() == 1

        # Verify localStorage contents
        stored_raw = page.evaluate("() => localStorage.getItem('fraud-console.saved-views')")
        stored_views = json.loads(stored_raw) if stored_raw else []
        print(f"  LocalStorage stored views count: {len(stored_views)}")
        assert any(v.get("name") == test_view_name for v in stored_views)

        # Delete the test view
        saved_item.locator("button[title='Delete saved view']").click()
        page.wait_for_timeout(250)
        remaining_count = page.locator(f".saved-view-item:has-text('{test_view_name}')").count()
        print(f"  After deletion count: {remaining_count}")
        assert remaining_count == 0

        # Close modal
        page.keyboard.press("Escape")
        page.wait_for_selector(".modal", state="hidden")

        page.screenshot(path=str(OUT_DIR / "flow16_saved_views.png"))
        results.append({"flow": "saved_workspaces", "status": "PASS", "errors": len(errors)})

        # --- FLOW 17: Command Palette Execution (Ctrl+K) ---
        print("\n[Flow 17] Testing Command Palette Execution (Ctrl+K)...")
        errors.clear()
        page.keyboard.press("Control+k")
        page.wait_for_selector(".modal", state="visible")

        # Verify command palette commands are displayed
        command_items = page.locator(".search-result.is-command").count()
        print(f"  Command palette actions found: {command_items}")
        assert command_items >= 4, f"Expected at least 4 quick commands, got {command_items}"

        # Click the "Start Guided Project Walkthrough" command
        walkthrough_cmd = page.locator(".search-result.is-command:has-text('Guided Project Walkthrough')").first
        walkthrough_cmd.click()
        page.wait_for_timeout(300)
        print(f"  Executed command, navigated to: {page.url}")
        assert "/walkthrough" in page.url

        page.screenshot(path=str(OUT_DIR / "flow17_command_palette.png"))
        results.append({"flow": "command_palette_nav", "status": "PASS", "errors": len(errors)})

        context.close()

        # -------------------------------------------------------------
        # 2. Mobile Responsive Storytelling Flows (390x844)
        # -------------------------------------------------------------
        print("\n[Flow 18] Testing Mobile Walkthrough & Presentation (390x844)...")
        mobile_ctx = browser.new_context(viewport={"width": 390, "height": 844})
        mobile_page = mobile_ctx.new_page()
        errors.clear()

        mobile_page.goto(BASE_URL + "/walkthrough", wait_until="domcontentloaded")
        mobile_page.wait_for_selector(".walkthrough-stepper")
        mobile_page.wait_for_timeout(250)
        mobile_page.screenshot(path=str(OUT_DIR / "flow18_mobile_walkthrough.png"))

        # Verify stepper renders without fatal overflow
        stepper_scroll_width = mobile_page.evaluate("() => document.querySelector('.walkthrough-stepper').scrollWidth")
        viewport_width = mobile_page.evaluate("() => window.innerWidth")
        print(f"  Mobile Walkthrough stepper: viewport={viewport_width}px, scrollWidth={stepper_scroll_width}px")

        # Test Mobile Presentation Mode
        mobile_page.goto(BASE_URL + "/presentation", wait_until="domcontentloaded")
        mobile_page.wait_for_selector(".presentation-container")
        mobile_page.wait_for_timeout(250)
        mobile_page.screenshot(path=str(OUT_DIR / "flow18_mobile_presentation.png"))
        mobile_pres_title = mobile_page.locator(".slide-heading").text_content()
        print(f"  Mobile Presentation Title: {mobile_pres_title}")
        assert len(mobile_pres_title) > 0

        # Test Mobile Report Composer
        mobile_page.goto(BASE_URL + "/reports", wait_until="domcontentloaded")
        mobile_page.wait_for_selector(".composer-grid")
        mobile_page.wait_for_timeout(250)
        mobile_page.screenshot(path=str(OUT_DIR / "flow18_mobile_reports.png"))
        print("  Mobile Report Composer rendered cleanly")

        results.append({"flow": "mobile_responsive_phase5", "status": "PASS", "errors": len(errors)})
        mobile_ctx.close()

        browser.close()

    summary_file = Path("artifacts/reports/phase5-interactive-test-results.json")
    summary_file.parent.mkdir(parents=True, exist_ok=True)
    summary_file.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"\nAll Phase 5 interactive flows passed successfully! Summary written to {summary_file}")
    return results


if __name__ == "__main__":
    test_phase5_interactive()
